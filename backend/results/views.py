from decimal import Decimal
import os
import io
from django.http import FileResponse
from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .permissions import IsAdminUser, IsTeacherOrAdmin
from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from .models import ( Attendance, Behaviour, ClassFees, ClassResultPDF, ClassTeacherSignature, GradingScale, HeadTeacherSignature, MaxScores, Result, ResultCustomization, SchoolDays,  SubjectResultStatus, TermComment, ResultSummary, ResumptionDate, ActivateResultPortal, ResultWorkflow, SubjectSummary, ResultPDF)
from .serializers import  (AttendanceSerializer, BehaviourSerializer, ClassFeeSerializer, ClassTeacherSignatureSerializer,  GradingScaleSerializer, HeadTeacherSignatureSerializer, MaxScoresSerializer, ResultCustomizationSerializer, ResultPDFSerializer, ResultSerializer, ResultSummarySerializer, SchoolDaysSerializer, SubjectResultStatusSerializer, TermCommentSerializer, ResumptionDateSerializer, ActivateResultPortalSerializer, ResultWorkflowSerializer, SubjectSummarySerializer,)
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.utils import IntegrityError

from rest_framework.permissions import IsAuthenticated
from academics.models import AcademicSession, ClassSubject, SchoolAsset, Student, StudentEnrollment, Teacher, Term, Class
from django.db import transaction

from celery.result import AsyncResult
from rest_framework.decorators import api_view

from .tasks import compute_all_results_task, generate_result_pdfs_task, recompute_all_results_task
from .services import get_student_results, update_result_workflow

import csv
import base64
import matplotlib.pyplot as plt

from django.http import FileResponse, HttpResponse
from django.template.loader import render_to_string

import numpy as np
from .defaults import DEFAULT_RESULT_CUSTOMIZATION

class ResultCustomizationViewSet(viewsets.ModelViewSet):
    serializer_class = ResultCustomizationSerializer
    permission_classes = [IsAuthenticated]
    queryset = ResultCustomization.objects.select_related(
        "session",
        "term",
    )

    def list(self, request, *args, **kwargs):
        """
        Returns the customization for a given session and term.
        If none exists, returns the default configuration.
        """

        session_id = request.query_params.get("session")
        term_id = request.query_params.get("term")

        if not session_id or not term_id:
            return Response(
                {
                    "detail": "Both session and term query parameters are required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        customization = self.get_queryset().filter(
            session_id=session_id,
            term_id=term_id,
        ).first()

        if customization:
            serializer = self.get_serializer(customization)
            return Response(serializer.data)

        return Response(
            {
                "id": None,
                "session": int(session_id),
                "term": int(term_id),
                **DEFAULT_RESULT_CUSTOMIZATION,
            }
        )

    def create(self, request, *args, **kwargs):
        """
        Creates or updates the customization for a session and term.
        """

        session_id = request.data.get("session")
        term_id = request.data.get("term")

        if not session_id or not term_id:
            return Response(
                {
                    "detail": "Both session and term are required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        defaults = {
            "subject_average": request.data.get("subject_average"),
            "subject_position": request.data.get("subject_position"),
            "class_size": request.data.get("class_size"),
            "subject_score": request.data.get("subject_score"),
            "cumulative_average": request.data.get("cumulative_average"),
            "class_position": request.data.get("class_position"),
            "highest_lowest_scores": request.data.get("highest_lowest_scores"),
            "overall_grade": request.data.get("overall_grade"),
            "test_scores": request.data.get("test_scores"),
            "show_teacher_comment": request.data.get("show_teacher_comment"),
            "show_principal_comment": request.data.get("show_principal_comment"),
            "show_behaviour": request.data.get("show_behaviour"),
            "show_attendance": request.data.get("show_attendance"),
            "show_school_days": request.data.get("show_school_days"),
            "show_class_fees": request.data.get("show_class_fees"),
            "show_grading_scale": request.data.get("show_grading_scale"),
            "show_performance_chart": request.data.get("show_performance_chart"),
            
            
        }
        with transaction.atomic():
            customization, created = ResultCustomization.objects.update_or_create(
                session_id=session_id,
                term_id=term_id,
                defaults=defaults,
            )

        serializer = self.get_serializer(customization)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
        

class SchoolDaysViewSet(viewsets.ModelViewSet):
    queryset = SchoolDays.objects.select_related("term", "session").all()
    serializer_class = SchoolDaysSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend
    ]

    filterset_fields = [
        "term",
        "session",
   
    ]

def generate_chart(results):

    subjects = [r.subject_name[:8] for r in results]
    scores = [r.total_score for r in results]
    class_average = [r.class_average for r in results]

    x = np.arange(len(subjects)) * 1.4 # label positions
    width = 0.5  # no gap between grouped bars

    plt.figure(figsize=(14, 4))

    # First bar: student score (blue)
    plt.bar(x, scores, width=width, color='blue', label='Score', zorder=3)

    # Second bar: class average (purple), shifted right
    plt.bar(x + width, class_average, width=width, color='purple', label='Class Avg', zorder=3)
    
    plt.grid(True, axis='y', linestyle='-', alpha=1, zorder=0)
    plt.grid(True, axis='x', linestyle='-', alpha=1, zorder=0)
    # X-axis labels (subjects)
    plt.xticks(x + width / 2, subjects, rotation=45, ha='right')

    # Y-axis label
    plt.ylabel("Scores")

    plt.ylim(0, 120)

    plt.legend()

    plt.tight_layout()

    buffer = io.BytesIO()
    plt.savefig(buffer, format="png", bbox_inches="tight")
    buffer.seek(0)

    image_png = buffer.getvalue()
    buffer.close()

    graphic = base64.b64encode(image_png)

    plt.close()

    return f"data:image/png;base64,{graphic.decode('utf-8')}"


def behavioural_assessment():
    return [
        ("Attendance", "A"),
        ("Neatness", "A"),
        ("Punctuality", "A"),
        ("Politeness", "A"),
        ("Self Control", "A"),
        ("Reliability", "A"),
    ]

def generate_chart(results):
    """
    results = [
        {
            "subject_code": "ENG",
            "total_score": 75,
            "subject_average": 64,
        }
    ]
    """

    subjects = [r["subject_code"] for r in results]
    scores = [float(r["total_score"]) for r in results]
    subject_averages = [
        float(r["subject_average"] or 0)
        for r in results
    ]

    x = np.arange(len(subjects)) * 1.4
    width = 0.5

    plt.figure(figsize=(14, 4))

    plt.bar(
        x,
        scores,
        width=width,
        label="Student Scores",
        zorder=3,
        color="blue"
    )

    plt.bar(
        x + width,
        subject_averages,
        width=width,
        label="Subject Average",
        zorder=3,
        color="purple"
    )

    plt.grid(
        True,
        axis="y",
        linestyle="-",
        alpha=1,
        zorder=0,
    )

    plt.grid(
        True,
        axis="x",
        linestyle="-",
        alpha=1,
        zorder=0,
    )

    plt.xticks(
        x + width / 2,
        subjects,
        rotation=45,
        ha="right",
    )

    plt.ylabel("Subject Scores")
    plt.ylim(0, 120)

    plt.legend()
    plt.tight_layout()

    buffer = io.BytesIO()

    plt.savefig(
        buffer,
        format="png",
        bbox_inches="tight",
    )

    buffer.seek(0)

    image_png = buffer.getvalue()

    graphic = base64.b64encode(image_png)

    buffer.close()
    plt.close()

    return (
        f"data:image/png;base64,"
        f"{graphic.decode('utf-8')}"
    )
   
def preview_pdf_html(request):

    student = Student.objects.get(id=44)
    school_class = Class.objects.get(id=1)
    context = get_student_results(student, 3, 1, school_class)

    html = render_to_string(
        "results/pdf/result_sheet.html",
       context
    )

    return HttpResponse(html)

class ClassTeacherSignatureViewSet(viewsets.ModelViewSet):
    queryset = ClassTeacherSignature.objects.all()
    serializer_class = ClassTeacherSignatureSerializer
    permission_classes = [IsTeacherOrAdmin]
    
class HeadTeacherSignatureViewSet(viewsets.ModelViewSet):
    queryset = HeadTeacherSignature.objects.all()
    serializer_class = HeadTeacherSignatureSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):

        HeadTeacherSignature.objects.filter(
            is_active=True
        ).update(
            is_active=False
        )

        serializer.save(
            is_active=True
        )

    def perform_update(self, serializer):

        instance = serializer.instance

        if serializer.validated_data.get("is_active"):

            HeadTeacherSignature.objects.exclude(
                pk=instance.pk
            ).filter(
                is_active=True
            ).update(
                is_active=False
            )

        serializer.save()
        
class ResultPDFViewSet(viewsets.ViewSet):
    queryset = ResultPDF.objects.all()
    serializer_class = ResultPDFSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=["get"], url_path="my-pdf")
    def my_pdf(self, request):
        user = self.request.user
        term_id = request.query_params.get("term_id")
        session_id = request.query_params.get("session_id")
        
        if not term_id or not session_id:
            return Response({"detail": "term_id and session_id are required."}, status=400)
            
        
        if user.role == "student":       
            student = Student.objects.get(user=user)
            current_class = student.current_class
        
        if not user == student.user:
            return Response({"detail": "Only students can view their PDF results."}, status=403)
            
        if not current_class:
            return Response({"detail": "No current enrollment found for student."}, status=404)
            
        workflow = ResultWorkflow.objects.filter(
            school_class=current_class,
            term_id=term_id,
            session_id=session_id
        ).first()
        
        if not workflow or workflow.status != "Released":
            return Response({"detail": "Results have not been released yet."}, status=403)
            
        pdf_record = ResultPDF.objects.filter(
            student=student,
            term_id=term_id,
            session_id=session_id,
            status="DONE"
        ).first()
        
        if not pdf_record:
            return Response({"detail": "PDF report sheet is not available or is still generating."}, status=404)
        print("backend return url: ", pdf_record.file.url)
            
        return Response({
            "pdf_url": pdf_record.file.url if pdf_record.file else None
        })

    @action(
        detail=False,
        methods=["post"],
        url_path="generate",
    )
    def generate(self, request):
        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")

        if not term_id or not session_id:
            return Response(
                {
                    "detail":
                    "term_id and session_id are required."
                },
                status=400,
            )

        task = generate_result_pdfs_task.delay(
            term_id,
            session_id,
        )

        return Response({
            "task_id": task.id,
            "status": "queued",
        })
        

    @action(detail=False, methods=["get"], url_path="status")
    def status(self, request):

        task_id = request.query_params.get("task_id")

        if not task_id:
            return Response({
                "detail": "task_id is required"
            }, status=400)

        result = AsyncResult(task_id)

        response_data = {
            "task_id": task_id,
            "state": result.state,
            "ready": result.ready(),
        }

        # --------------------------------------------------
        # SAFE RESULT HANDLING
        # --------------------------------------------------
        if result.ready():
            try:
                # if success → normal result
                response_data["result"] = result.result

            except Exception:
                # fallback safety
                response_data["result"] = None

            # if failure → convert exception to string
            if result.failed():
                response_data["error"] = str(result.result)
                response_data["result"] = None

        return Response(response_data)
        
    @action(detail=False, methods=["get"], url_path="precheck")
    def precheck(self, request):

        term_id = request.query_params.get("term_id")
        session_id = request.query_params.get("session_id")

        if not term_id or not session_id:
            return Response(
                {"detail": "term_id and session_id are required."},
                status=400
            )
            
        enrollments = StudentEnrollment.objects.filter(session_id=session_id, is_current=True).count()
        attendance = Attendance.objects.filter(
                term_id=term_id,
                session_id=session_id,
            ).count()
        termComments = TermComment.objects.filter(term_id=term_id, session_id=session_id).count()
        classes =  Class.objects.all().count()

        return Response({
            # All behaviour records are complete
            "behaviours": Behaviour.objects.filter(
                term_id=term_id,
                session_id=session_id,
            ).count() == enrollments,

            # attendance exists
            "attendance": attendance == enrollments,
            "comments": termComments == enrollments,
            "grades": GradingScale.objects.filter(grade_type="subject").exists(),

            # active school logo/header exists
            "school_assets": SchoolAsset.objects.filter(
                is_active=True,
                asset_type="logo"
            ).exists(),
            "class_teacher_signatures": ClassTeacherSignature.objects.filter(is_active=True).count() == classes,
            "head_teacher_signature": HeadTeacherSignature.objects.exists(),
            # class fees exist
            "class_fees": ClassFees.objects.filter(
                term_id=term_id,
                session_id=session_id,
            ).count() == classes,
            # resumption date exists
            "resumption_date": ResumptionDate.objects.filter(
                current_term_id=term_id,
                current_session_id=session_id,
            ).exists(),
        })
        
class ResultComputationViewSet(viewsets.ViewSet):
    """
    Handles async result computation via Celery
    """
    @action(detail=False, methods=["post"], url_path="compute")
    def compute(self, request):
        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")

        if not term_id or not session_id:
            return Response(
                {"detail": "term_id and session_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task = compute_all_results_task.delay(
            term_id=term_id,
            session_id=session_id,
        )

        return Response(
            {"task_id": task.id, "status": "queued"},
            status=status.HTTP_202_ACCEPTED,
        )

    @action(detail=False, methods=["post"], url_path="recompute")
    def recompute(self, request):
        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")

        if not term_id or not session_id:
            return Response(
                {"detail": "term_id and session_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task = recompute_all_results_task.delay(
            term_id=term_id,
            session_id=session_id,
        )

        return Response(
            {"task_id": task.id, "status": "queued"},
            status=status.HTTP_202_ACCEPTED,
        )

@api_view(["GET"])
def task_status(request, task_id):

    task = AsyncResult(task_id)

    response = {
        "state": task.state,
        "result": task.result,
    }

    if task.state == "PROGRESS":
        response.update(task.info)

    return Response(response)

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related(
        "student", "term", "session"
    ).all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["term", "session", "school_class", "student"]


    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "bulk_upsert"]:
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        user_role = user.role

        if user.is_staff or user.is_superuser or user_role == "admin":
            return queryset

        if user_role == "teacher":
            return queryset.filter(school_class__class_teacher__user=user)
        
        if user_role == "student":
            from django.db.models import F
            return queryset.filter(
                student__user=user,
                school_class__result_workflows__term=F('term'),
                school_class__result_workflows__session=F('session'),
                school_class__result_workflows__status="Released"
            ).distinct()

        return queryset.none()
    # =========================
    # BULK UPSERT (FIXED)
    # =========================

    @action(detail=False, methods=["post"])
    def bulk_upsert(self, request):
        try:
            term_id = request.data.get("term_id")
            session_id = request.data.get("session_id")
            school_class_id = request.data.get("school_class_id")
            records = request.data.get("records", [])

            # -------------------------
            # VALIDATION
            # -------------------------
            if not term_id or not session_id or not school_class_id:
                return Response(
                    {
                        "status": "error",
                        "message": "term_id, session_id and school_class_id are required"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not isinstance(records, list) or len(records) == 0:
                return Response(
                    {
                        "status": "error",
                        "message": "records must be a non-empty list"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            results = []
            errors = []

            # -------------------------
            # BULK PROCESS USING SERIALIZER (CORRECT WAY)
            # -------------------------
            with transaction.atomic():
                for index, item in enumerate(records):

                    payload = {
                        "student_id": item.get("student"),
                        "attendance": item.get("attendance", 0),
                        "school_class_id": school_class_id,
                        "term_id": term_id,
                        "session_id": session_id,
                    }

                    try:
                        # check if exists (for update logic)
                        instance = Attendance.objects.filter(
                            student_id=item.get("student"),
                            term_id=term_id,
                            session_id=session_id,
                            school_class_id=item.get("school_class_id")
                        ).first()

                        serializer = self.get_serializer(
                            instance,
                            data=payload,
                            partial=True
                        )

                        serializer.is_valid(raise_exception=True)
                        obj = serializer.save()

                        results.append(obj)

                    except Exception as e:
                        errors.append({
                            "index": index,
                            "student": item.get("student"),
                            "error": str(e)
                        })

            response_serializer = self.get_serializer(results, many=True)

            return Response(
                {
                    "status": "success" if not errors else "partial_success",
                    "message": "Bulk attendance processed",
                    "results": response_serializer.data,
                    "errors": errors
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {
                    "status": "error",
                    "message": "Unexpected server error",
                    "detail": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class BehaviourViewSet(viewsets.ModelViewSet):
    queryset = Behaviour.objects.select_related(
        "student", "term", "session"
    ).all()
    serializer_class = BehaviourSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["term", "session", "student", "school_class"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_staff or user.is_superuser or user.role == "admin":
            return queryset

        if user.role == "teacher":
            teacher = Teacher.objects.get(user=user)
            school_class = Class.objects.filter(class_teacher_id=teacher.id).first()
            return queryset.filter(school_class=school_class)

        if user.role == "student":
            from django.db.models import F
            return queryset.filter(
                student__user=user,
                student__enrollments__school_class__result_workflows__term=F('term'),
                student__enrollments__school_class__result_workflows__session=F('session'),
                student__enrollments__school_class__result_workflows__status="Released",
                student__enrollments__is_current=True
            ).distinct()

        return queryset.none()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        obj, created = Behaviour.objects.update_or_create(
            student=serializer.validated_data["student"],
            term=serializer.validated_data["term"],
            session=serializer.validated_data["session"],
            school_class = serializer.validated_data["school_class"],
            defaults={
                "skills": serializer.validated_data.get("skills", "A"),
                "politeness": serializer.validated_data.get("politeness", "A"),
                "neatness": serializer.validated_data.get("neatness", "A"),
                "self_control": serializer.validated_data.get("self_control", "A"),
                "relationship": serializer.validated_data.get("relationship", "A"),
                "attendance": serializer.validated_data.get("attendance", "A"),
                "punctuality": serializer.validated_data.get("punctuality", "A"),
                "leadership": serializer.validated_data.get("leadership", "A"),
            },
        )

        return Response(
            {
                "message": "Behaviour created" if created else "Behaviour updated",
                "created": created,
                "behaviour": self.get_serializer(obj).data,
                "student_id": obj.student_id,
                "behaviour_id": obj.id,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial,
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

class MaxScoreViewset(viewsets.ModelViewSet):
    serializer_class = MaxScoresSerializer
    permission_classes = [IsTeacherOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["school_class"]

    def get_queryset(self):
        queryset = MaxScores.objects.select_related("school_class")

        class_id = self.request.query_params.get("school_class")

        if class_id:
            queryset = queryset.filter(school_class_id=class_id)

        return queryset

class GradingScaleViewSet(viewsets.ModelViewSet):
    queryset = GradingScale.objects.all().order_by(
        "grading_type",
        "-upper_limit",
    )
    serializer_class = GradingScaleSerializer
    permission_classes = [IsTeacherOrAdmin]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        - If a grading scale with the same grading_type + grade exists,
          update it.

        - If a grading scale with the same grading_type +
          lower_limit + upper_limit exists,
          update it.
        - Otherwise create a new grading scale.
        """

        grading_type = request.data.get("grading_type")
        grade = request.data.get("grade")
        lower_limit = request.data.get("lower_limit")
        upper_limit = request.data.get("upper_limit")

        existing = (
            GradingScale.objects.filter(
                grading_type=grading_type,
            )
            .filter(
                Q(grade__iexact=grade)
                | Q(
                    lower_limit=lower_limit,
                    upper_limit=upper_limit,
                )
            )
            .first()
        )

        if existing:
            serializer = self.get_serializer(
                existing,
                data=request.data,
                partial=False,
            )

            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )
        
# RESULT VIEWSET
# ============================== 
class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.select_related(
        "student",
        "student__user",
        "class_subject",
        "session",
        "term"
    )

    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['term', 'student', 'class_subject', 'session']

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "bulk_create"]:
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        user_role = user.role
        
        if user.is_staff or user.is_superuser or user_role=="admin":
            return queryset

        if user_role == "teacher":
            return queryset.filter(
                class_subject__school_class__class_teacher__user=user
            )

        if user_role == "student":
            from django.db.models import F
            return queryset.filter(
                student__user=user,
                class_subject__submission_statuses__term=F('term'),
                class_subject__submission_statuses__session=F('session'),
                class_subject__submission_statuses__is_released=True
            ).distinct()

        return queryset.none()        
    
    @action(detail=False, methods=["get"], url_path="subject-results")
    def subject_results(self, request):
        user_role = request.user.role
        if not request.user.is_staff and not user_role == "teacher":
            return Response({"detail": "Permission denied"}, status=403)

        class_id = request.query_params.get("class_id")
        class_subject_id = request.query_params.get("class_subject_id")
        
        if not class_id or not class_subject_id:
            return Response(
                {
                    "detail": "class_id and class_subject_id are required"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            class_subject = ClassSubject.objects.select_related(
                "school_class",
                "subject"
            ).get(
                id=class_subject_id,
                school_class_id=class_id
            )
        except ClassSubject.DoesNotExist:
            return Response(
                {
                    "detail": "Class subject not found"
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        results = Result.objects.select_related(
            "student__user",
                "student"
            ).filter(
                term=request.query_params.get("term"),
                class_subject_id=class_subject_id,
                class_subject__school_class_id=class_id
            )

        return Response(
            {
                "class_subject": {
                    "id": class_subject.id,
                    "subject": class_subject.subject.name,
                    "class": class_subject.school_class.name,
                },
                "results": [
                    {
                        "result_id": result.id,
                        "student_id": result.student.id,
                        "student_name": result.student.user.full_name,
                        "profile_picture": request.build_absolute_uri(result.student.user.profile_picture.url) if result.student.user.profile_picture else None,
                        
                        "admission_number": result.student.admission_number,
                        "first_test": result.first_test,
                        "second_test": result.second_test,
                        "exam_score": result.exam_score,
                        "total_score": result.total_score,
                        "grade": result.grade,
                        "remark": result.remark,
                        "teacher_submitted": result.teacher_submitted,
                    }
                    for result in results
                ],
            }
        )
    
    # -----------------------------
    # BULK CREATE / UPDATE OPTIMIZED
    # -----------------------------
    @action(detail=False, methods=["post"], url_path="bulk-create")
    def bulk_create(self, request):
        class_subject_id = request.data.get("class_subject")
        term_id = request.data.get("term")
        session_id = request.data.get("session")
        results_data = request.data.get("results", [])

        if not all([class_subject_id, term_id, session_id]):
            return Response(
                {"detail": "class_subject, term and session are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -----------------------------
        # FETCH CORE OBJECTS (1 TIME ONLY)
        # -----------------------------
        try:
            class_subject = ClassSubject.objects.select_related(
                "school_class"
            ).get(id=class_subject_id)

            term = Term.objects.get(id=term_id)
            session = AcademicSession.objects.get(id=session_id)

        except (ClassSubject.DoesNotExist, Term.DoesNotExist, AcademicSession.DoesNotExist):
            return Response(
                {"detail": "Invalid class_subject, term or session"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grades = list(GradingScale.objects.filter(grade_type="subject").all())

        # -----------------------------
        # PRELOAD STUDENTS (REDUCE QUERIES)
        # -----------------------------
        student_ids = [r.get("student") for r in results_data]
        students = Student.objects.select_related("user").in_bulk(student_ids)

        # -----------------------------
        # PRELOAD EXISTING RESULTS (CRITICAL OPTIMIZATION)
        # -----------------------------
        existing_qs = Result.objects.filter(
            class_subject=class_subject,
            term=term,
            session=session,
            student_id__in=student_ids
        )

        existing_results = {
            (r.student_id): r
            for r in existing_qs
        }

        # -----------------------------
        # PREPROCESS (NO DB WRITES HERE)
        # -----------------------------
        to_create = []
        to_update = []

        for item in results_data:
            student_id = item.get("student")
            student = students.get(student_id)

            if not student:
                continue

            first_test = Decimal(str(item.get("first_test", 0)))
            second_test = Decimal(str(item.get("second_test", 0)))
            exam_score = Decimal(str(item.get("exam_score", 0)))

            total = first_test + second_test + exam_score

            grade_obj = next(
                (
                    g for g in grades
                    if g.lower_limit <= total <= g.upper_limit
                ),
                None
            )

            data = {
                "student": student,
                "class_subject": class_subject,
                "term": term,
                "session": session,
                "first_test": first_test,
                "second_test": second_test,
                "exam_score": exam_score,
                "total_score": total,
                "grade": grade_obj.grade if grade_obj else "",
                "remark": grade_obj.remark if grade_obj else "",
                "teacher_submitted": True,
            }

            existing = existing_results.get(student_id)

            if existing:
                # update object in memory
                for key, value in data.items():
                    setattr(existing, key, value)
                to_update.append(existing)
            else:
                to_create.append(Result(**data))

        # -----------------------------
        # DB WRITE (VERY SHORT TRANSACTION)
        # -----------------------------
        with transaction.atomic():
            if to_create:
                Result.objects.bulk_create(to_create)

            if to_update:
                Result.objects.bulk_update(
                    to_update,
                    [
                        "first_test",
                        "second_test",
                        "exam_score",
                        "total_score",
                        "grade",
                        "remark",
                        "teacher_submitted",
                    ]
                )

            # update submission status
            if to_create or to_update:
                SubjectResultStatus.objects.update_or_create(
                    class_subject=class_subject,
                    term=term,
                    session=session,
                    defaults={
                        "school_class": class_subject.school_class,
                        "is_submitted": True,
                    },
                )

        return Response(
            {
                "message": "Results processed successfully",
                "created": len(to_create),
                "updated": len(to_update),
            },
            status=status.HTTP_200_OK,
        )

    def _get_approved_workflow(self, school_class_id, term_id, session_id):
        return ResultWorkflow.objects.filter(
            school_class_id=school_class_id,
            term_id=term_id,
            session_id=session_id,
            status__in=["Approved", "Released"],
        ).select_related(
            "school_class",
            "school_class__arm",
            "term",
            "session",
        ).first()

    def _require_broadsheet_params(self, request):
        user = request.user
        if not (
            request.user.is_staff
            or request.user.is_superuser
            or request.user.role == "admin"
            or request.user.role == "teacher"
        ):
            return None, Response(
                {"detail": "Permission denied!."},
                status=status.HTTP_403_FORBIDDEN,
            )

        school_class_id = (
            request.query_params.get("class_id")
            or request.query_params.get("school_class")
            or request.query_params.get("school_class_id")
        )
        term_id = request.query_params.get("term_id") or request.query_params.get("term")
        session_id = request.query_params.get("session_id") or request.query_params.get("session")

        if not school_class_id or not term_id or not session_id:
            return None, Response(
                {"detail": "class_id, term_id and session_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
            
        if request.user.role == "teacher":
            try:
                teacher = Teacher.objects.select_related("user").get(user=user)
            except Teacher.DoesNotExist:
                return None, Response(
                    {"detail": "Teacher profile not found."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            allowed = Class.objects.filter(
                id=school_class_id,
                class_teacher=teacher,
            ).exists()

            if not allowed:
                return None, Response(
                    {
                        "detail": "You can only view results for your assigned classes."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )        
        workflow = self._get_approved_workflow(
            school_class_id,
            term_id,
            session_id,
            )

        if not workflow:
            return None, Response(
                {
                    "detail": (
                        "Results for this class can only be viewed or "
                        "downloaded after approval."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return {
            "school_class_id": school_class_id,
            "term_id": term_id,
            "session_id": session_id,
            "workflow": workflow,
        }, None

    def _build_class_broadsheet(self, request, school_class_id, term_id, session_id, workflow):
        subjects = list(
            ClassSubject.objects.select_related(
                "subject",
                "school_class",
                "school_class__arm",
            )
            .filter(
                school_class_id=school_class_id,
                term_id=term_id,
            )
            .order_by(
                "subject__code",
                "subject__name",
            )
        )

        students = list(
            Student.objects.select_related("user")
            .filter(
                enrollments__school_class_id=school_class_id,
                enrollments__session_id=session_id,
            )
            .distinct()
            .order_by(
                "user__last_name",
                "user__first_name",
                "admission_number",
            )
        )

        result_map = {
            (result.student_id, result.class_subject_id): result
            for result in Result.objects.select_related(
                "student",
                "student__user",
                "class_subject",
                "class_subject__subject",
            ).filter(
                class_subject__school_class_id=school_class_id,
                class_subject__in=subjects,
                term_id=term_id,
                session_id=session_id,
            )
        }

        summary_map = {
            summary.student_id: summary
            for summary in ResultSummary.objects.filter(
                school_class_id=school_class_id,
                term_id=term_id,
                session_id=session_id,
            )
        }

        pdf_student_ids = set(
            ResultPDF.objects.filter(
                student_id__in=[student.id for student in students],
                term_id=term_id,
                session_id=session_id,
                status="DONE",
                file__isnull=False,
            ).values_list("student_id", flat=True)
        )

        rows = []
        for student in students:
            summary = summary_map.get(student.id)
            subject_results = []
            if student.user.profile_picture and hasattr(student.user.profile_picture, 'url'):
                picture_url = request.build_absolute_uri(student.user.profile_picture.url) if student.user.profile_picture else None
             
            else:
                picture_url = None
    

            for class_subject in subjects:
                result = result_map.get((student.id, class_subject.id))
                subject_results.append({
                    "class_subject_id": class_subject.id,
                    "subject_code": class_subject.subject.code,
                    "subject_name": class_subject.subject.name,
                    "first_test": result.first_test if result else None,
                    "second_test": result.second_test if result else None,
                    "exam_score": result.exam_score if result else None,
                    "total_score": result.total_score if result else None,
                    "grade": result.grade if result else "",
                    "remark": result.remark if result else "",
                })

            rows.append({
                "student_id": student.id,
                "student_name": student.user.full_name,
                "profile_picture": picture_url,
                "admission_number": student.admission_number,
                "total_score": summary.total_score if summary else None,
                "average_score": summary.average_score if summary else None,
                "position": summary.position if summary else None,
                "pdf_available": student.id in pdf_student_ids,
                "subjects": subject_results,
                 
            })

        return {
            "class": {
                "id": workflow.school_class.id,
                "name": workflow.school_class.name,
                "arm": workflow.school_class.arm.code if workflow.school_class.arm else "",
            },
            "term": {
                "id": workflow.term.id,
                "name": workflow.term.name,
            },
            "session": {
                "id": workflow.session.id,
                "name": workflow.session.name,
            },
            "workflow": {
                "id": workflow.id,
                "status": workflow.status,
                "approved_at": workflow.approved_at,
                "released_at": workflow.released_at,
            },
            "subjects": [
                {
                    "class_subject_id": subject.id,
                    "subject_id": subject.subject.id,
                    "code": subject.subject.code,
                    "name": subject.subject.name,
                }
                for subject in subjects
            ],
            "rows": rows,
        }

    def _require_student_pdf_params(self, request):

        if not (
            request.user.is_staff
            or request.user.is_superuser
            or request.user.role == "admin"
            or request.user.role == "teacher"
        ):
            return None, Response(
                {"detail": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN,
            )

        student_id = request.query_params.get("student_id")

        school_class_id = (
            request.query_params.get("class_id")
            or request.query_params.get("school_class")
            or request.query_params.get("school_class_id")
        )

        term_id = (
            request.query_params.get("term_id")
            or request.query_params.get("term")
        )

        session_id = (
            request.query_params.get("session_id")
            or request.query_params.get("session")
        )

        if not all([student_id, school_class_id, term_id, session_id]):
            return None, Response(
                {
                    "detail": (
                        "student_id, class_id, term_id and session_id are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        workflow = self._get_approved_workflow(
            school_class_id,
            term_id,
            session_id,
        )

        if not workflow:
            return None, Response(
                {
                    "detail": (
                        "PDF can only be viewed after results approval."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return {
            "student_id": student_id,
            "school_class_id": school_class_id,
            "term_id": term_id,
            "session_id": session_id,
        }, None

    @action(detail=False, methods=["get"], url_path="class-broadsheet")
    def class_broadsheet(self, request):
        params, error_response = self._require_broadsheet_params(request)
        if error_response:
            return error_response

        data = self._build_class_broadsheet(request=request, **params)
        return Response(data)

    @action(detail=False, methods=["get"], url_path="class-broadsheet-csv")
    def class_broadsheet_csv(self, request):
        params, error_response = self._require_broadsheet_params(request)
        if error_response:
            return error_response

        data = self._build_class_broadsheet(request=request, **params)
        response = HttpResponse(content_type="text/csv")
        filename = (
            f"{data['class']['name']}_{data['class']['arm']}_"
            f"{data['term']['name']}_{data['session']['name']}_results.csv"
        ).replace(" ", "_")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        first_header = ["Student", "ADM No."]
        second_header = ["", ""]

        for subject in data["subjects"]:
            first_header.extend(["", subject["code"], "", ])
          
            second_header.extend([
         
                "CA",
                "Total",
                "Grade",
            ])

        first_header.extend(["Overall Total", "Average", "Position"])
        second_header.extend(["", "", ""])
        writer.writerow(first_header)
        writer.writerow(second_header)

        for row in data["rows"]:
            csv_row = [row["student_name"], row["admission_number"]]
            for result in row["subjects"]:
                csv_row.extend([
                    (result["first_test"] or 0) + (result["second_test"] or 0),
                    
                    result["total_score"] or "",
                    result["grade"],
                    
                ])
            csv_row.extend([
                row["total_score"] or "",
                row["average_score"] or "",
                row["position"] or "",
            ])
            writer.writerow(csv_row)

        return response

    @action(detail=False, methods=["get"], url_path="student-pdf")
    def student_pdf(self, request):
        if not (
            request.user.is_staff
            or request.user.is_superuser
            or request.user.role == "admin" 
            or request.user.role == "teacher"
        ):
            return Response(
                {"detail": "Only administrators and teachers can download student PDFs here."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if request.user.role == "teacher":
            teacher = Teacher.objects.get(user=request.user)
            pass
        student_id = request.query_params.get("student_id")
        school_class_id = (
            request.query_params.get("class_id")
            or request.query_params.get("school_class")
            or request.query_params.get("school_class_id")
        )
        term_id = request.query_params.get("term_id") or request.query_params.get("term")
        session_id = request.query_params.get("session_id") or request.query_params.get("session")

        if not student_id or not school_class_id or not term_id or not session_id:
            return Response(
                {
                    "detail": (
                        "student_id, class_id, term_id and session_id "
                        "are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        workflow = self._get_approved_workflow(
            school_class_id,
            term_id,
            session_id,
        )

        if not workflow:
            return Response(
                {"detail": "PDF can only be downloaded after results approval."},
                status=status.HTTP_403_FORBIDDEN,
            )

        pdf_record = ResultPDF.objects.filter(
            student_id=student_id,
            term_id=term_id,
            session_id=session_id,
            status="DONE",
        ).first()

        if not pdf_record or not pdf_record.file:
            return Response(
                {"detail": "PDF report sheet is not available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return FileResponse(
            pdf_record.file.open("rb"),
            as_attachment=True,
            filename=pdf_record.file.name.split("/")[-1],
        )
     
    @action(detail=False, methods=["get"], url_path="student-pdf-info")
    def student_pdf_info(self, request):

        params, error = self._require_student_pdf_params(request)
        if error:
            return error

        pdf_record = ResultPDF.objects.filter(
            student_id=params["student_id"],
            term_id=params["term_id"],
            session_id=params["session_id"],
            status="DONE",
        ).first()

        if not pdf_record or not pdf_record.file:
            return Response(
                {"detail": "PDF report sheet is not available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "url": request.build_absolute_uri(pdf_record.file.url),
            "filename": os.path.basename(pdf_record.file.name),
        })
        
    @action(
        detail=False,
        methods=["get"],
        url_path="class-results-pdf",
    )
    def class_results_pdf(self, request):

        params, error = self._require_broadsheet_params(request)

        if error:
            return error

        merged = ClassResultPDF.objects.filter(
            school_class_id=params["school_class_id"],
            term_id=params["term_id"],
            session_id=params["session_id"],
        ).first()

        if not merged or not merged.file:

            return Response(
                {
                    "detail": "Merged class PDF not available."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
      
        return FileResponse(
            merged.file.open("rb"),
            as_attachment=False,
            filename=merged.file.name.split("/")[-1],
            content_type="application/pdf",
        )

class TermCommentViewSet(viewsets.ModelViewSet):
    queryset = TermComment.objects.select_related("student", "student__user", "term", "session", "school_class")
    serializer_class = TermCommentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['term', 'student', 'school_class', 'session']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        user_role = user.role

        if user.is_staff or user.is_superuser or user_role == "admin":
            return queryset
        if user_role == "teacher":
            # filter the comments by the class of the teacher
            return queryset.filter(school_class__class_teacher__user=user)

        if user_role == "student":
            from django.db.models import F
            return queryset.filter(
                student__user=user,
                school_class__result_workflows__term=F('term'),
                school_class__result_workflows__session=F('session'),
                school_class__result_workflows__status="Released"
            ).distinct()

        return queryset.none()
    
    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

class ResultSummaryViewset(viewsets.ModelViewSet):
    queryset = ResultSummary.objects.select_related("student", "school_class", "term", "session")
    serializer_class = ResultSummarySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["term", "session", "student", ]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_staff or user.is_superuser or user.role == "admin":
            return queryset
        
        if user.role == "teacher":
            return queryset.filter(school_class__class_teacher__user=user)

        if user.role == "student":
            from django.db.models import F
            return queryset.filter(
                student__user=user,
                school_class__result_workflows__term=F('term'),
                school_class__result_workflows__session=F('session'),
                school_class__result_workflows__status="Released"
            ).distinct()

        return queryset.none()
    
    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

class SubjectResultStatusViewSet(viewsets.ModelViewSet):
    queryset = SubjectResultStatus.objects.select_related("school_class", "term", "session")
    serializer_class = SubjectResultStatusSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_staff or user.is_superuser or user.role == "admin":
            return queryset

        if user.role == "teacher":
            return queryset.filter(school_class__class_teacher__user=user)
        return queryset.none()
    
    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

class ClassFeesViewset(viewsets.ModelViewSet):
    queryset = ClassFees.objects.select_related(
        "school_class",
        "session",
        "term"
    )
    serializer_class = ClassFeeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["term", "session", "school_class"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_staff or user.is_superuser or user.role == "admin":
            return queryset
        if user.role == "teacher":
            return queryset.filter(school_class__class_teacher__user=user)
        if user.role == "student":
            student = Student.objects.get(user=user)
            return queryset.filter(school_class=student.current_class)
        return queryset.none()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            self.perform_create(serializer)
        except IntegrityError:
          
            return Response(
                {
                    "non_field_errors": [
                        "Fee already exists for this class, session, and term."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        headers = self.get_success_headers(serializer.data)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

class ResumptionDateViewSet(viewsets.ModelViewSet):
    queryset = ResumptionDate.objects.select_related(
        "next_term",
        "current_term",
        "current_session",
        "next_session"
    )
    serializer_class = ResumptionDateSerializer
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            self.perform_create(serializer)
        except IntegrityError:
            # 🔥 handles race condition (duplicate insert at DB level)
            return Response(
                {
                    "non_field_errors": [
                        "Resumption date already exists for next session and term."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        headers = self.get_success_headers(serializer.data)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        ) 

class ActivateResultPortalViewSet(viewsets.ModelViewSet):

    queryset = ActivateResultPortal.objects.select_related(
        "term",
        "session",
    )

    serializer_class = ActivateResultPortalSerializer
    parser_classes = [
        MultiPartParser,
        FormParser,
    ]   
    permission_classes = [IsTeacherOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['term'
    ]
    def perform_create(self, serializer):
        term = serializer.validated_data["term"]
        serializer.save(session=term.session)

class ResultWorkflowViewSet(viewsets.ModelViewSet):
    queryset = ResultWorkflow.objects.select_related(
        "school_class",
        "school_class__arm",
        "term",
        "session",
        "approved_by",
        "released_by",
    )

    serializer_class = (
        ResultWorkflowSerializer
    )

    permission_classes = [
        IsTeacherOrAdmin
    ]

    filter_backends = [
        DjangoFilterBackend
    ]

    filterset_fields = [
        "school_class",
        "term",
        "session",
        "status",
    ]

    @action(
        detail=False,
        methods=["post"],
        url_path="approve",
    )
    def approve(self, request):

        school_class_id = request.data.get(
            "school_class_id"
        )

        term_id = request.data.get(
            "term_id"
        )

        session_id = request.data.get(
            "session_id"
        )

        if not all([
            school_class_id,
            term_id,
            session_id,
        ]):
            return Response(
                {
                    "detail":
                    "school_class_id, "
                    "term_id and "
                    "session_id "
                    "are required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        workflow = ResultWorkflow.objects.filter(
            school_class_id=school_class_id,
            term_id=term_id,
            session_id=session_id,
        ).first()

        if not workflow:
            return Response(
                {
                    "detail":
                    "Workflow not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not workflow.all_results_submitted:
            return Response(
                {
                    "detail":
                    "All subjects "
                    "have not been submitted."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        workflow.status = "Approved"

        workflow.approved_by = (
            request.user
        )

        workflow.approved_at = timezone.now()
        workflow.save()
 
        serializer = self.get_serializer(
            workflow
        )

        return Response(
            serializer.data
        )


    @action(
        detail=False,
        methods=["post"],
        url_path="approve-all",
    )
    def approve_all(self, request):

        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")

        if not term_id or not session_id:
            return Response(
                {
                    "detail":
                    "term_id and session_id are required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        workflows = ResultWorkflow.objects.filter(
            term_id=term_id,
            session_id=session_id,
        )

        if not workflows.exists():
            return Response(
                {
                    "detail":
                    "No workflows found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        approved = []
        skipped = []

        for workflow in workflows:

            if not workflow.all_results_submitted:

                skipped.append({
                    "class_id": workflow.school_class_id,
                    "class_name": str(workflow.school_class),
                    "reason":
                    "All subjects have not been submitted.",
                })

                continue

            workflow.status = "Approved"
            workflow.approved_by = request.user
            workflow.approved_at = timezone.now()
            workflow.save()

            approved.append({
                "class_id": workflow.school_class_id,
                "class_name": str(workflow.school_class),
            })

        return Response(
            {
                "approved_count": len(approved),
                "approved": approved,
                "skipped": skipped,
            }
        )
    @action(
        detail=False,
        methods=["post"],
        url_path="release",
    )
    def release(self, request):

        school_class_id = request.data.get(
            "school_class_id"
        )

        term_id = request.data.get(
            "term_id"
        )

        session_id = request.data.get(
            "session_id"
        )

        workflow = ResultWorkflow.objects.filter(
            school_class_id=school_class_id,
            term_id=term_id,
            session_id=session_id,
        ).first()

        if not workflow:
            return Response(
                {
                    "detail":
                    "Workflow not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if workflow.status != "Approved":
            return Response(
                {
                    "detail":
                    "Results must be approved "
                    "before release."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        workflow.status = "Released"

        workflow.released_by = (
            request.user
        )
        workflow.released_at = timezone.now()
        workflow.save()
        SubjectResultStatus.objects.all().update(is_released=True)
        serializer = self.get_serializer(
            workflow
        )

        return Response(
            serializer.data
        )
        
    @action(
        detail=False,
        methods=["post"],
        url_path="release-all",
    )
    def release_all(self, request):

        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")

        if not term_id or not session_id:
            return Response(
                {
                    "detail":
                    "term_id and session_id are required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        workflows = ResultWorkflow.objects.filter(
            term_id=term_id,
            session_id=session_id,
        )

        if not workflows.exists():
            return Response(
                {
                    "detail":
                    "No workflows found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        released = []
        skipped = []

        for workflow in workflows:
            
            update_result_workflow(
                school_class=workflow.school_class,
                term=workflow.term,
                session=workflow.session,
            )

            workflow.refresh_from_db()            

            if workflow.status != "Approved":

                skipped.append({
                    "class_id": workflow.school_class_id,
                    "class_name": str(workflow.school_class),
                    "reason":
                    "Workflow is not approved.",
                })

                continue
                
                

            workflow.status = "Released"
            workflow.released_by = request.user
            workflow.released_at = timezone.now()
            workflow.save()

            SubjectResultStatus.objects.filter(
                school_class=workflow.school_class,
                term=workflow.term,
                session=workflow.session,
            ).update(
                is_released=True
            )

            released.append({
                "class_id": workflow.school_class_id,
                "class_name": str(workflow.school_class),
            })

        return Response(
            {
                "released_count": len(released),
                "released": released,
                "skipped": skipped,
            }
        )    
    

    @action(
        detail=False,
        methods=["post"],
        url_path="refresh",
    )
    def refresh_status(
        self,
        request
    ):
        """
        Recalculate workflow state
        from SubjectResultStatus.
        """

        class_id = request.data.get(
            "school_class_id"
        )

        term_id = request.data.get(
            "term_id"
        )

        session_id = request.data.get(
            "session_id"
        )

        workflow, _ = (
            ResultWorkflow.objects.get_or_create(
                school_class_id=class_id,
                term_id=term_id,
                session_id=session_id,
            )
        )

        total_subjects = (
            SubjectResultStatus.objects.filter(
                school_class_id=class_id,
                term_id=term_id,
                session_id=session_id,
            ).count()
        )

        submitted_subjects = (
            SubjectResultStatus.objects.filter(
                school_class_id=class_id,
                term_id=term_id,
                session_id=session_id,
                is_submitted=True,
            ).count()
        )

        workflow.all_results_submitted = (
            total_subjects > 0
            and
            total_subjects ==
            submitted_subjects
        )

        if (
            workflow.status == "Draft"
            and workflow.all_results_submitted
        ):
            workflow.status = "Pending"

        workflow.save()

        serializer = (
            self.get_serializer(
                workflow
            )
        )

        return Response(
            serializer.data
        )

class SubjectSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = (
        SubjectSummarySerializer
    )

    permission_classes = [
        IsAuthenticated
    ]

    filter_backends = [
        DjangoFilterBackend,
    ]

    filterset_fields = [
        "student",
        "class_subject",
        "term",
        "session",
    ]

    queryset = (
        SubjectSummary.objects
        .select_related(
            "student",
            "student__user",
            "class_subject",
            "class_subject__subject",
            "class_subject__school_class",
            "term",
            "session",
        )
        .order_by(
            "class_subject",
            "subject_position",
        )
    )