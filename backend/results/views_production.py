from decimal import Decimal

import csv
from django.db.models import Count, F, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .utils.services.approve_workflow import approve_workflow
from .utils.services.engine import ResultEngine

from .permissions import IsAdminUser, IsTeacherOrAdmin
from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from .models import ( Attendance, Behaviour, ClassFees, ClassTeacherSignature, GradingScale, HeadTeacherSignature, MaxScores, Result, ResultCustomization, SchoolDays, StudentResultSnapshot,  SubjectResultStatus, TermComment, ResultSummary, ResumptionDate, ActivateResultPortal, ResultWorkflow, SubjectSummary)
from .serializers import (AttendanceSerializer, BehaviourSerializer, ClassFeeSerializer, ClassTeacherSignatureSerializer,  GradingScaleSerializer, HeadTeacherSignatureSerializer, MaxScoresSerializer, ResultCustomizationSerializer, ResultSerializer, ResultSummarySerializer, SchoolDaysSerializer, StudentResultSnapshotSerializer, SubjectResultStatusSerializer, TermCommentSerializer, ResumptionDateSerializer, ActivateResultPortalSerializer, ResultWorkflowSerializer, SubjectSummarySerializer,)

from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.permissions import IsAuthenticated
from academics.models import AcademicSession, ClassSubject, SchoolAsset, Student, StudentEnrollment, Teacher, Term, Class
from django.db import transaction

from .utils.services.update_workflow import  update_result_workflow

from django.http import HttpResponse

from .defaults import DEFAULT_RESULT_CUSTOMIZATION
# ============================================================================
# 1. STUDENT RESULT SNAPSHOT VIEWSET
# ============================================================================
class StudentResultSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StudentResultSnapshotSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["student", "school_class", "session", "term", "status"]

    def get_queryset(self):
        return (
            StudentResultSnapshot.objects.select_related(
                "student__user",
                "school_class",
                "session",
                "term",
            )
            .order_by("-computed_at")
        )


# ============================================================================
# 2. RESULT CUSTOMIZATION VIEWSET
# ============================================================================
class ResultCustomizationViewSet(viewsets.ModelViewSet):
    serializer_class = ResultCustomizationSerializer
    permission_classes = [IsAuthenticated]
    queryset = ResultCustomization.objects.select_related(
        "session",
        "term",
        "school_class",
    )

    def list(self, request, *args, **kwargs):
        session_id = request.query_params.get("session")
        term_id = request.query_params.get("term")
        school_class_id = request.query_params.get("school_class_id")

        if not session_id or not term_id:
            return Response(
                {"detail": "Both session and term query parameters are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Single Query Optimization for list fallback
        qs = self.get_queryset().filter(session_id=session_id, term_id=term_id)
        
        customization = None
        if school_class_id:
            customization = qs.filter(school_class_id=school_class_id).first()

        if not customization:
            customization = qs.filter(school_class__isnull=True).first()

        if customization:
            serializer = self.get_serializer(customization)
            return Response(serializer.data)

        return Response(
            {
                "id": None,
                "session": int(session_id),
                "term": int(term_id),
                "school_class": school_class_id,
                **DEFAULT_RESULT_CUSTOMIZATION,
            }
        )

    def create(self, request, *args, **kwargs):
        session_id = request.data.get("session")
        term_id = request.data.get("term")
        school_class_id = request.data.get("school_class_id")

        if not session_id or not term_id:
            return Response(
                {"detail": "Both session and term are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fields = [
            "subject_average", "class_average", "subject_position", "class_size",
            "subject_score", "cumulative_average", "class_position", "highest_lowest_scores",
            "overall_grade", "test_scores", "show_teacher_comment", "show_principal_comment",
            "show_behaviour", "show_attendance", "show_school_days", "show_class_fees",
            "show_grading_scale", "show_performance_chart"
        ]
        
        defaults = {field: request.data.get(field) for field in fields if field in request.data}

        lookup = {"session_id": session_id, "term_id": term_id}
        if school_class_id:
            lookup["school_class_id"] = school_class_id
        else:
            lookup["school_class"] = None

        with transaction.atomic():
            customization, created = ResultCustomization.objects.update_or_create(
                defaults=defaults,
                **lookup,
            )

            if school_class_id:
                workflow = ResultWorkflow.objects.filter(
                    school_class_id=school_class_id,
                    term_id=term_id,
                    session_id=session_id,
                ).select_related("school_class", "session", "term").first()

                if workflow and workflow.all_results_submitted and workflow.status != "Released":
                   
                    ResultEngine(
                        school_class=workflow.school_class,
                        session=workflow.session,
                        term=workflow.term,
                        request=self.request
                    ).compute()

        serializer = self.get_serializer(customization)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# ============================================================================
# 3. SCHOOL DAYS VIEWSET
# ============================================================================
class SchoolDaysViewSet(viewsets.ModelViewSet):
    queryset = SchoolDays.objects.select_related("term", "session").all()
    serializer_class = SchoolDaysSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["term", "session"]

# ============================================================================
# 4. CLASS TEACHER SIGNATURE VIEWSET
# ============================================================================
class ClassTeacherSignatureViewSet(viewsets.ModelViewSet):
    queryset = ClassTeacherSignature.objects.select_related("teacher", "school_class").all()
    serializer_class = ClassTeacherSignatureSerializer
    permission_classes = [IsTeacherOrAdmin]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        teacher_id = request.data.get("teacher")
        signature_file = request.FILES.get("signature")

        if not teacher_id:
            return Response({"detail": "teacher is required."}, status=status.HTTP_400_BAD_REQUEST)

        class_ids = list(Class.objects.filter(class_teacher_id=teacher_id).values_list("id", flat=True))

        if not class_ids:
            return Response(
                {"detail": "This teacher is not assigned to any class."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        signatures_to_create = [
            ClassTeacherSignature(
                teacher_id=teacher_id,
                school_class_id=c_id,
                signature=signature_file,
                is_active=True
            ) for c_id in class_ids
        ]

        # Bulk creation avoids loop iteration DRF save overhead
        ClassTeacherSignature.objects.filter(school_class_id__in=class_ids, is_active=True).update(is_active=False)
        created_objs = ClassTeacherSignature.objects.bulk_create(signatures_to_create)

        serializer = self.get_serializer(created_objs, many=True)
        return Response(
            {
                "message": f"Signature applied to {len(created_objs)} class(es).",
                "count": len(created_objs),
                "results": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        teacher_id = instance.teacher_id
        signature_file = request.FILES.get("signature")

        class_ids = Class.objects.filter(class_teacher_id=teacher_id).values_list("id", flat=True)

        for school_class_id in class_ids:
            ClassTeacherSignature.objects.update_or_create(
                teacher_id=teacher_id,
                school_class_id=school_class_id,
                defaults={"signature": signature_file, "is_active": True} if signature_file else {}
            )

        return Response({"message": "Teacher signatures updated across all assigned classes."}, status=status.HTTP_200_OK)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        deleted_count, _ = ClassTeacherSignature.objects.filter(teacher_id=instance.teacher_id).delete()

        return Response(
            {"detail": f"{deleted_count} signature(s) deleted successfully."},
            status=status.HTTP_200_OK,
        )

# ============================================================================
# 5. HEAD TEACHER SIGNATURE VIEWSET
# ============================================================================
class HeadTeacherSignatureViewSet(viewsets.ModelViewSet):
    queryset = HeadTeacherSignature.objects.all()
    serializer_class = HeadTeacherSignatureSerializer
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def perform_create(self, serializer):
        HeadTeacherSignature.objects.filter(is_active=True).update(is_active=False)
        serializer.save(is_active=True)

    @transaction.atomic
    def perform_update(self, serializer):
        if serializer.validated_data.get("is_active"):
            HeadTeacherSignature.objects.exclude(pk=serializer.instance.pk).filter(is_active=True).update(is_active=False)
        serializer.save()

    @action(detail=True, methods=["post"], url_path="activate")
    @transaction.atomic
    def activate(self, request, pk=None):
        signature = self.get_object()
        HeadTeacherSignature.objects.filter(is_active=True).update(is_active=False)
        signature.is_active = True
        signature.save(update_fields=["is_active"])

        return Response(self.get_serializer(signature).data, status=status.HTTP_200_OK)


# ============================================================================
# 6. RESULT COMPUTATION VIEWSET
# ============================================================================
class ResultComputationViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=["post"], url_path="compute")
    def compute(self, request):
        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")
        school_class_id = request.data.get("school_class_id")  # Optional: targeted computation

        if not term_id or not session_id:
            return Response(
                {"detail": "term_id and session_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        term = Term.objects.filter(id=term_id, session_id=session_id).first()
        session = AcademicSession.objects.filter(id=session_id).first()

        if not term or not session:
            return Response(
                {"detail": "Invalid term or session provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If a class ID is provided, compute only for that class to avoid timing out HTTP requests
        if school_class_id:
            classes = Class.objects.filter(id=school_class_id)
            if not classes.exists():
                return Response(
                    {"detail": "Specified school_class_id does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            # Fallback to computing all classes
            classes = Class.objects.all()

        computed_classes = []

        # Wrap computations in an atomic transaction to avoid partial state corruption on error
        with transaction.atomic():
            for school_class in classes:
                ResultEngine(
                    school_class=school_class,
                    session=session,
                    term=term,
                    request=self.request,
                ).compute()
                computed_classes.append(school_class.name)

        return Response(
            {
                "message": f"Results computed successfully for {len(computed_classes)} class(es).",
                "classes": computed_classes,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================================
# 7. ATTENDANCE VIEWSET (BULK OPTIMIZED)
# ============================================================================
class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related("student__user", "term", "session", "school_class").all()
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
        user_role = getattr(user, "role", None)

        if user.is_staff or user.is_superuser or user_role == "admin":
            return queryset.filter(student__enrollments__is_current=True)

        if user_role == "teacher":
            return queryset.filter(school_class__class_teacher__user=user, student__enrollments__is_current=True)

        if user_role == "student":
            from django.db.models import F
            return queryset.filter(
                student__user=user,
                school_class__result_workflows__term=F('term'),
                school_class__result_workflows__session=F('session'),
                school_class__result_workflows__status="Released"
            ).distinct()

        return queryset.none()

    @action(detail=False, methods=["post"])
    def bulk_upsert(self, request):
        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")
        school_class_id = request.data.get("school_class_id")
        records = request.data.get("records", [])

        if not all([term_id, session_id, school_class_id]) or not isinstance(records, list) or not records:
            return Response(
                {"status": "error", "message": "term_id, session_id, school_class_id, and non-empty records are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student_ids = [r.get("student") for r in records if r.get("student")]
        
        # 1. Fetch all existing attendance records in 1 Query
        existing_map = {
            att.student_id: att
            for att in Attendance.objects.filter(
                term_id=term_id,
                session_id=session_id,
                school_class_id=school_class_id,
                student_id__in=student_ids,
            )
        }

        to_create = []
        to_update = []
        errors = []

        # Validate Max School Days Upfront in 1 Query
        school_days = SchoolDays.objects.filter(term_id=term_id, session_id=session_id).first()
        max_days = school_days.days_school_opened if school_days else None

        for index, item in enumerate(records):
            student_id = item.get("student")
            att_val = item.get("attendance", 0)

            if max_days is not None and att_val > max_days:
                errors.append({"index": index, "student": student_id, "errors": f"Attendance cannot exceed {max_days} days."})
                continue

            if student_id in existing_map:
                instance = existing_map[student_id]
                instance.attendance = att_val
                to_update.append(instance)
            else:
                to_create.append(Attendance(
                    student_id=student_id,
                    school_class_id=school_class_id,
                    term_id=term_id,
                    session_id=session_id,
                    attendance=att_val
                ))

        # 2. Execute Batch Database Operations (2 Queries Total)
        with transaction.atomic():
            if to_create:
                Attendance.objects.bulk_create(to_create)
            if to_update:
                Attendance.objects.bulk_update(to_update, fields=["attendance", "updated_at"])

        return Response(
            {
                "status": "success" if not errors else "partial_success",
                "saved_count": len(to_create) + len(to_update),
                "failed_count": len(errors),
                "errors": errors,
            },
            status=status.HTTP_200_OK,
        )

# ============================================================================
# 8. BEHAVIOUR VIEWSET (BULK OPTIMIZED)
# ============================================================================
class BehaviourViewSet(viewsets.ModelViewSet):
    queryset = Behaviour.objects.select_related("student__user", "term", "session", "school_class").all()
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
            return queryset.filter(student__enrollments__is_current=True)

        if user.role == "teacher":
            teacher = Teacher.objects.get(user=user)
            school_class = Class.objects.filter(class_teacher_id=teacher.id).first()
            return queryset.filter(school_class=school_class, student__enrollments__is_current=True)

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

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-upsert",
        permission_classes=[IsTeacherOrAdmin],
    )
    def bulk_upsert(self, request):
        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")
        school_class_id = request.data.get("school_class_id")
        records = request.data.get("records", [])

        # ---------------------------------------------------
        # VALIDATION
        # ---------------------------------------------------

        if not all([term_id, session_id, school_class_id]):
            return Response(
                {
                    "status": "error",
                    "message": "term_id, session_id and school_class_id are required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(records, list) or not records:
            return Response(
                {
                    "status": "error",
                    "message": "records must be a non-empty list.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        saved_records = []
        errors = []

        # ---------------------------------------------------
        # PROCESS RECORDS
        # ---------------------------------------------------

        with transaction.atomic():

            for index, item in enumerate(records):

                payload = {
                    "student_id": item.get("student"),
                    "school_class_id": school_class_id,
                    "term_id": term_id,
                    "session_id": session_id,

                    "skills": item.get("skills", "A"),
                    "politeness": item.get("politeness", "A"),
                    "neatness": item.get("neatness", "A"),
                    "self_control": item.get("self_control", "A"),
                    "relationship": item.get("relationship", "A"),
                    "attendance": item.get("attendance", "A"),
                    "punctuality": item.get("punctuality", "A"),
                    "leadership": item.get("leadership", "A"),
                }

                instance = Behaviour.objects.filter(
                    student_id=item.get("student"),
                    school_class_id=school_class_id,
                    term_id=term_id,
                    session_id=session_id,
                ).first()

                serializer = self.get_serializer(
                    instance=instance,
                    data=payload,
                    partial=instance is not None,
                )

                try:
                    serializer.is_valid(raise_exception=True)

                    behaviour = serializer.save()

                    saved_records.append(behaviour)

                except DjangoValidationError as exc:
                    errors.append(
                        {
                            "index": index,
                            "student": item.get("student"),
                            "errors": exc.detail,
                        }
                    )

                except Exception as exc:
                    errors.append(
                        {
                            "index": index,
                            "student": item.get("student"),
                            "errors": str(exc),
                        }
                    )

        # ---------------------------------------------------
        # RESPONSE
        # ---------------------------------------------------

        serializer = self.get_serializer(saved_records, many=True)

        if errors and not saved_records:
            return Response(
                {
                    "status": "error",
                    "message": "No behaviour records were saved.",
                    "results": [],
                    "errors": errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "status": "success" if not errors else "partial_success",
                "message": (
                    "Behaviour saved successfully."
                    if not errors
                    else "Behaviour saved with some errors."
                ),
                "results": serializer.data,
                "saved_count": len(saved_records),
                "failed_count": len(errors),
                "errors": errors,
            },
            status=status.HTTP_200_OK,
        )
        
    def create(self, request, *args, **kwargs):
        return self.upsert(request)
 
    
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
        

class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.select_related(
        "student",
        "student__user",
        "class_subject",
        "session",
        "term",
    )
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["term", "student", "class_subject", "session"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "bulk_create"]:
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        user_role = getattr(user, "role", None)

        if user.is_staff or user.is_superuser or user_role == "admin":
            return queryset

        if user_role == "teacher":
            return queryset.filter(
                class_subject__school_class__class_teacher__user=user
            )

        if user_role == "student":
            from django.db.models import F
            return queryset.filter(
                student__user=user,
                class_subject__submission_statuses__term=F("term"),
                class_subject__submission_statuses__session=F("session"),
                class_subject__submission_statuses__is_released=True,
            ).distinct()

        return queryset.none()

    # =========================================================================
    # 1. SUBJECT RESULTS ACTION
    # =========================================================================
    @action(detail=False, methods=["get"], url_path="subject-results")
    def subject_results(self, request):
        user_role = getattr(request.user, "role", None)
        if not request.user.is_staff and user_role != "teacher":
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        class_id = request.query_params.get("class_id")
        class_subject_id = request.query_params.get("class_subject_id")
        term_id = request.query_params.get("term")

        if not class_id or not class_subject_id:
            return Response(
                {"detail": "class_id and class_subject_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            class_subject = ClassSubject.objects.select_related(
                "school_class", "subject"
            ).get(id=class_subject_id, school_class_id=class_id)
        except ClassSubject.DoesNotExist:
            return Response(
                {"detail": "Class subject not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        results = Result.objects.select_related("student__user", "student").filter(
            term_id=term_id,
            class_subject_id=class_subject_id,
            class_subject__school_class_id=class_id,
        )

        results_data = []
        for result in results:
            user = result.student.user
            profile_picture_url = None
            if user.profile_picture and hasattr(user.profile_picture, "url"):
                profile_picture_url = request.build_absolute_uri(user.profile_picture.url)

            results_data.append({
                "result_id": result.id,
                "student_id": result.student.id,
                "student_name": user.full_name,
                "profile_picture": profile_picture_url,
                "admission_number": result.student.admission_number,
                "first_test": result.first_test,
                "second_test": result.second_test,
                "exam_score": result.exam_score,
                "total_score": result.total_score,
                "grade": result.grade,
                "remark": result.remark,
                "teacher_submitted": result.teacher_submitted,
            })

        return Response({
            "class_subject": {
                "id": class_subject.id,
                "subject": class_subject.subject.name,
                "class": class_subject.school_class.name,
            },
            "results": results_data,
        })

    # =========================================================================
    # 2. RESULT SHEETS EXIST ACTION
    # =========================================================================
    @action(detail=False, methods=["get"], url_path="results-sheets-exist")
    def result_sheets_exist(self, request):
        user_role = getattr(request.user, "role", None)
        if not request.user.is_staff and user_role != "teacher":
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        term_id = request.query_params.get("term_id")
        school_class_id = request.query_params.get("school_class_id")

        if not term_id and not school_class_id:
            return Response(
                {"detail": "term_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        class_merged_pdf = ClassResultPDF.objects.filter(
            term_id=term_id, school_class_id=school_class_id
        ).exists()

        return Response({"class_results_exists": class_merged_pdf})

    # =========================================================================
    # 3. ALL RESULTS SUBMITTED ACTION
    # =========================================================================
    @action(detail=False, methods=["get"], url_path="all-results-submitted")
    def all_results_submitted(self, request):
        user_role = getattr(request.user, "role", None)
        if not request.user.is_staff and user_role != "teacher":
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        term_id = request.query_params.get("term_id")
        school_class_id = request.query_params.get("school_class")

        if not term_id:
            return Response(
                {"detail": "term_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subject_filter = {"term_id": term_id}
        status_filter = {"term_id": term_id, "is_submitted": True}

        if school_class_id:
            subject_filter["school_class_id"] = school_class_id
            status_filter["school_class_id"] = school_class_id

        class_subjects_count = ClassSubject.objects.filter(**subject_filter).count()
        submission_statuses_count = SubjectResultStatus.objects.filter(**status_filter).count()

        all_submitted = (
            class_subjects_count > 0 and class_subjects_count == submission_statuses_count
        )

        return Response({"all_results_submitted": all_submitted})

    # =========================================================================
    # 4. PRECHECK ACTION (OPTIMIZED FOR METRICS & VALIDATION)
    # =========================================================================
    @action(detail=False, methods=["get"], url_path="precheck")
    def precheck(self, request):
        term_id = request.query_params.get("term_id")
        session_id = request.query_params.get("session_id")
        school_class_id = request.query_params.get("class_id")

        if not term_id or not session_id:
            return Response(
                {"detail": "term_id and session_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if school_class_id:
            enrollment_count = StudentEnrollment.objects.filter(
                session_id=session_id,
                school_class_id=school_class_id,
                is_current=True,
            ).count()

            attendance_count = Attendance.objects.filter(
                term_id=term_id,
                session_id=session_id,
                school_class_id=school_class_id,
                student__enrollments__is_current=True,
            ).count()

            behaviour_count = Behaviour.objects.filter(
                term_id=term_id,
                session_id=session_id,
                school_class_id=school_class_id,
                student__enrollments__is_current=True,
            ).count()

            comment_count = TermComment.objects.filter(
                term_id=term_id,
                session_id=session_id,
                school_class_id=school_class_id,
                student__enrollments__is_current=True,
            ).count()

            has_class_teacher_signature = ClassTeacherSignature.objects.filter(
                school_class_id=school_class_id,
                is_active=True,
            ).exists()

            has_class_fees = ClassFees.objects.filter(
                term_id=term_id,
                session_id=session_id,
                school_class_id=school_class_id,
            ).exists()

        else:
            enrollment_count = StudentEnrollment.objects.filter(
                session_id=session_id,
                is_current=True,
            ).count()

            attendance_count = Attendance.objects.filter(
                term_id=term_id,
                session_id=session_id,
            ).count()

            behaviour_count = Behaviour.objects.filter(
                term_id=term_id,
                session_id=session_id,
            ).count()

            comment_count = TermComment.objects.filter(
                term_id=term_id,
                session_id=session_id,
            ).count()

            total_classes = Class.objects.count()

            signed_classes = ClassTeacherSignature.objects.filter(
                is_active=True
            ).values("school_class_id").distinct().count()

            fees_configured_classes = ClassFees.objects.filter(
                term_id=term_id,
                session_id=session_id,
            ).values("school_class_id").distinct().count()

            has_class_teacher_signature = (total_classes > 0 and signed_classes == total_classes)
            has_class_fees = (total_classes > 0 and fees_configured_classes == total_classes)

        checks = {
            "attendance": (enrollment_count > 0 and attendance_count == enrollment_count),
            "behaviours": (enrollment_count > 0 and behaviour_count == enrollment_count),
            "comments": (enrollment_count > 0 and comment_count == enrollment_count),
            "grades": GradingScale.objects.filter(grading_type="subject").exists(),
            "school_days": SchoolDays.objects.filter(term_id=term_id, session_id=session_id).exists(),
            "school_assets": SchoolAsset.objects.filter(is_active=True, asset_type="logo").exists(),
            "class_teacher_signatures": has_class_teacher_signature,
            "head_teacher_signature": HeadTeacherSignature.objects.filter(is_active=True).exists(),
            "class_fees": has_class_fees,
            "resumption_date": ResumptionDate.objects.filter(
                current_term_id=term_id, current_session_id=session_id
            ).exists(),
        }

        checks["ready"] = all(checks.values())
        checks["summary"] = {
            "students": enrollment_count,
            "attendance_records": attendance_count,
            "behaviour_records": behaviour_count,
            "comment_records": comment_count,
        }

        return Response(checks, status=status.HTTP_200_OK)

    # =========================================================================
    # 5. BULK CREATE / UPDATE OPTIMIZED
    # =========================================================================
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

        try:
            class_subject = ClassSubject.objects.select_related("school_class").get(id=class_subject_id)
            term = Term.objects.get(id=term_id)
            session = AcademicSession.objects.get(id=session_id)
        except (ClassSubject.DoesNotExist, Term.DoesNotExist, AcademicSession.DoesNotExist):
            return Response(
                {"detail": "Invalid class_subject, term or session"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grades = list(GradingScale.objects.filter(grading_type="subject"))
        school_class = class_subject.school_class

        student_ids = [r.get("student") for r in results_data if r.get("student")]
        students = Student.objects.select_related("user").in_bulk(student_ids)

        existing_results = {
            r.student_id: r
            for r in Result.objects.filter(
                class_subject=class_subject,
                term=term,
                session=session,
                student_id__in=student_ids,
            )
        }

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
                (g for g in grades if g.lower_limit <= total <= g.upper_limit),
                None,
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
                for key, value in data.items():
                    setattr(existing, key, value)
                to_update.append(existing)
            else:
                to_create.append(Result(**data))

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
                    ],
                )

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

        # Trigger workflow evaluation synchronously (No Celery)
        update_result_workflow(school_class, term, session)
        workflow = ResultWorkflow.objects.filter(school_class=school_class, term=term, session=session).first()
        
        if workflow and workflow.all_results_submitted:
            ResultEngine(
                school_class=school_class,
                session=session,
                term=term,
                request=request,
            ).compute()

        return Response(
            {
                "message": "Results processed successfully",
                "created": len(to_create),
                "updated": len(to_update),
            },
            status=status.HTTP_200_OK,
        )

    # =========================================================================
    # HELPER METHODS (BROADSHEET PERMISSIONS & MATRIX BUILDING)
    # =========================================================================
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
        user_role = getattr(user, "role", None)

        if not (user.is_staff or user.is_superuser or user_role in ["admin", "teacher"]):
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

        if user_role == "teacher":
            try:
                teacher = Teacher.objects.select_related("user").get(user=user)
            except Teacher.DoesNotExist:
                return None, Response(
                    {"detail": "Teacher profile not found."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            allowed = Class.objects.filter(id=school_class_id, class_teacher=teacher).exists()
            if not allowed and not user.is_staff and not user.is_superuser:
                return None, Response(
                    {"detail": "You can only view results for your assigned classes."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        workflow = self._get_approved_workflow(school_class_id, term_id, session_id)
        if not workflow:
            return None, Response(
                {"detail": "Results for this class can only be viewed or downloaded after approval."},
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
            ClassSubject.objects.select_related("subject", "school_class", "school_class__arm")
            .filter(school_class_id=school_class_id, term_id=term_id)
            .order_by("subject__code", "subject__name")
        )

        students = list(
            Student.objects.select_related("user")
            .filter(
                enrollments__school_class_id=school_class_id,
                enrollments__session_id=session_id,
            )
            .distinct()
            .order_by("user__last_name", "user__first_name", "admission_number")
        )

        result_map = {
            (result.student_id, result.class_subject_id): result
            for result in Result.objects.select_related(
                "student", "student__user", "class_subject", "class_subject__subject"
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

        rows = []
        for student in students:
            summary = summary_map.get(student.id)
            subject_results = []
            
            user = student.user
            picture_url = None
            if user.profile_picture and hasattr(user.profile_picture, "url"):
                picture_url = request.build_absolute_uri(user.profile_picture.url)

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
                "student_name": user.full_name,
                "profile_picture": picture_url,
                "admission_number": student.admission_number,
                "total_score": summary.total_score if summary else None,
                "average_score": summary.average_score if summary else None,
                "position": summary.position if summary else None,
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

    # =========================================================================
    # 6. CLASS BROADSHEET ACTIONS (JSON & CSV EXPORT)
    # =========================================================================
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
            first_header.extend(["", subject["code"], ""])
            second_header.extend(["CA", "Total", "Grade"])

        first_header.extend(["Overall Total", "Average", "Position"])
        second_header.extend(["", "", ""])
        
        writer.writerow(first_header)
        writer.writerow(second_header)

        for row in data["rows"]:
            csv_row = [row["student_name"], row["admission_number"]]
            for result in row["subjects"]:
                ca_score = (result["first_test"] or 0) + (result["second_test"] or 0)
                csv_row.extend([
                    ca_score if (result["first_test"] is not None or result["second_test"] is not None) else "",
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
    
# =============================================================================
# 1. TERM COMMENT VIEWSET
# =============================================================================
class TermCommentViewSet(viewsets.ModelViewSet):
    queryset = TermComment.objects.select_related(
        "student", "student__user", "term", "session", "school_class"
    )
    serializer_class = TermCommentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["term", "student", "school_class", "session"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        user_role = getattr(user, "role", None)

        if user.is_staff or user.is_superuser or user_role == "admin":
            return queryset.filter(student__enrollments__is_current=True)

        if user_role == "teacher":
            return queryset.filter(
                school_class__class_teacher__user=user,
                student__enrollments__is_current=True,
            )

        if user_role == "student":
            return queryset.filter(
                student__user=user,
                school_class__result_workflows__term=F("term"),
                school_class__result_workflows__session=F("session"),
                school_class__result_workflows__status="Released",
            ).distinct()

        return queryset.none()

    @action(detail=False, methods=["post"], url_path="bulk-save")
    def bulk_save(self, request):
        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")
        school_class_id = request.data.get("school_class_id")
        comments = request.data.get("comments", [])

        if not all([term_id, session_id, school_class_id]):
            return Response(
                {"detail": "term_id, session_id and school_class_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student_ids = [item.get("student") for item in comments if item.get("student")]
        if not student_ids:
            return Response(
                {"created": 0, "updated": 0, "total": 0},
                status=status.HTTP_200_OK,
            )

        # Pre-fetch existing comment records into a lookup map to avoid N+1 queries
        existing_comments = {
            c.student_id: c
            for c in TermComment.objects.filter(
                term_id=term_id,
                session_id=session_id,
                school_class_id=school_class_id,
                student_id__in=student_ids,
            )
        }

        to_create = []
        to_update = []

        for item in comments:
            student_id = item.get("student")
            if not student_id:
                continue

            class_teacher_comment = item.get("class_teacher_comment", "")
            principal_comment = item.get("principal_comment", "")

            existing = existing_comments.get(student_id)
            if existing:
                existing.class_teacher_comment = class_teacher_comment
                existing.principal_comment = principal_comment
                to_update.append(existing)
            else:
                to_create.append(
                    TermComment(
                        student_id=student_id,
                        term_id=term_id,
                        session_id=session_id,
                        school_class_id=school_class_id,
                        class_teacher_comment=class_teacher_comment,
                        principal_comment=principal_comment,
                    )
                )

        with transaction.atomic():
            if to_create:
                TermComment.objects.bulk_create(to_create)
            if to_update:
                TermComment.objects.bulk_update(
                    to_update, ["class_teacher_comment", "principal_comment"]
                )

        return Response(
            {
                "created": len(to_create),
                "updated": len(to_update),
                "total": len(to_create) + len(to_update),
            },
            status=status.HTTP_200_OK,
        )

# =============================================================================
# 2. RESULT SUMMARY VIEWSET
# =============================================================================
class ResultSummaryViewset(viewsets.ModelViewSet):
    queryset = ResultSummary.objects.select_related(
        "student", "student__user", "school_class", "term", "session"
    )
    serializer_class = ResultSummarySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["term", "session", "student", "school_class"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        user_role = getattr(user, "role", None)

        if user.is_staff or user.is_superuser or user_role == "admin":
            return queryset

        if user_role == "teacher":
            return queryset.filter(school_class__class_teacher__user=user)

        if user_role == "student":
            return queryset.filter(
                student__user=user,
                school_class__result_workflows__term=F("term"),
                school_class__result_workflows__session=F("session"),
                school_class__result_workflows__status="Released",
            ).distinct()

        return queryset.none()

# =============================================================================
# 3. SUBJECT RESULT STATUS VIEWSET
# =============================================================================
class SubjectResultStatusViewSet(viewsets.ModelViewSet):
    queryset = SubjectResultStatus.objects.select_related("school_class", "term", "session")
    serializer_class = SubjectResultStatusSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        user_role = getattr(user, "role", None)

        if user.is_staff or user.is_superuser or user_role == "admin":
            return queryset

        if user_role == "teacher":
            return queryset.filter(school_class__class_teacher__user=user)

        return queryset.none()

# =============================================================================
# 4. CLASS FEES VIEWSET
# =============================================================================
class ClassFeesViewset(viewsets.ModelViewSet):
    queryset = ClassFees.objects.select_related("school_class", "session", "term")
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
        user_role = getattr(user, "role", None)

        if user.is_staff or user.is_superuser or user_role == "admin":
            return queryset

        if user_role == "teacher":
            return queryset.filter(school_class__class_teacher__user=user)

        if user_role == "student":
            return queryset.filter(
                school_class__enrollments__student__user=user,
                school_class__enrollments__is_current=True,
            ).distinct()

        return queryset.none()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            self.perform_create(serializer)
        except IntegrityError:
            return Response(
                {"non_field_errors": ["Fee already exists for this class, session, and term."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

# =============================================================================
# 5. RESUMPTION DATE VIEWSET
# =============================================================================
class ResumptionDateViewSet(viewsets.ModelViewSet):
    queryset = ResumptionDate.objects.select_related(
        "next_term", "current_term", "current_session", "next_session"
    )
    serializer_class = ResumptionDateSerializer
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            self.perform_create(serializer)
        except IntegrityError:
            return Response(
                {"non_field_errors": ["Resumption date already exists for next session and term."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)   
    
# =============================================================================
# 1. ACTIVATE RESULT PORTAL VIEWSET
# =============================================================================
class ActivateResultPortalViewSet(viewsets.ModelViewSet):
    queryset = ActivateResultPortal.objects.select_related("term", "session")
    serializer_class = ActivateResultPortalSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsTeacherOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["term"]

    def perform_create(self, serializer):
        term = serializer.validated_data["term"]
        serializer.save(session=term.session)

# =============================================================================
# 2. RESULT WORKFLOW VIEWSET
# =============================================================================
class ResultWorkflowViewSet(viewsets.ModelViewSet):
    queryset = ResultWorkflow.objects.select_related(
        "school_class",
        "school_class__arm",
        "term",
        "session",
        "approved_by",
        "released_by",
        "unlocked_by",
    )
    serializer_class = ResultWorkflowSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["school_class", "term", "session", "status"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        user_role = getattr(user, "role", None)

        if user.is_staff or user.is_superuser or user_role == "admin":
            return queryset

        if user_role == "teacher":
            return queryset.filter(school_class__class_teacher__user=user)

        if user_role == "student":
            return queryset.filter(
                school_class__enrollments__student__user=user,
                school_class__enrollments__is_current=True,
                status="Released",
            ).distinct()

        return queryset.none()

    # -------------------------------------------------------------------------
    # APPROVE (SINGLE)
    # -------------------------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="approve")
    def approve(self, request):
        school_class_id = request.data.get("school_class_id")
        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")

        if not all([school_class_id, term_id, session_id]):
            return Response(
                {"detail": "school_class_id, term_id and session_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workflow = ResultWorkflow.objects.filter(
            school_class_id=school_class_id,
            term_id=term_id,
            session_id=session_id,
        ).first()

        if not workflow:
            return Response(
                {"detail": "Workflow not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not workflow.all_results_submitted:
            return Response(
                {"detail": "All subjects have not been submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        approve_workflow(workflow, request.user, school_class_id, session_id, term_id)

        serializer = self.get_serializer(workflow)
        return Response(serializer.data)

    # -------------------------------------------------------------------------
    # UNLOCK (SINGLE)
    # -------------------------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="unlock")
    def unlock(self, request):
        school_class_id = request.data.get("school_class_id")
        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")

        if not all([school_class_id, term_id, session_id]):
            return Response(
                {"detail": "school_class_id, term_id and session_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workflow = ResultWorkflow.objects.filter(
            school_class_id=school_class_id,
            term_id=term_id,
            session_id=session_id,
        ).first()

        if not workflow:
            return Response(
                {"detail": "Workflow not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not workflow.all_results_submitted:
            return Response(
                {"detail": "All subjects have not been submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workflow.status = "Pending"
        workflow.unlocked_by = request.user
        workflow.unlocked_at = timezone.now()
        workflow.save(update_fields=["status", "unlocked_by", "unlocked_at"])

        serializer = self.get_serializer(workflow)
        return Response(serializer.data)

    # -------------------------------------------------------------------------
    # APPROVE ALL (BULK)
    # -------------------------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="approve-all")
    def approve_all(self, request):
        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")

        if not term_id or not session_id:
            return Response(
                {"detail": "term_id and session_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workflows = list(
            ResultWorkflow.objects.select_related("school_class").filter(
                term_id=term_id,
                session_id=session_id,
            )
        )

        if not workflows:
            return Response(
                {"detail": "No workflows found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        approved = []
        skipped = []

        for workflow in workflows:
            if not workflow.all_results_submitted:
                skipped.append(
                    {
                        "class_id": workflow.school_class_id,
                        "class_name": str(workflow.school_class),
                        "reason": "All subjects have not been submitted.",
                    }
                )
                continue

            approve_workflow(workflow, request.user, workflow.school_class_id, session_id, term_id)
            approved.append(
                {
                    "class_id": workflow.school_class_id,
                    "class_name": str(workflow.school_class),
                }
            )

        return Response(
            {
                "approved_count": len(approved),
                "approved": approved,
                "skipped": skipped,
            }
        )

    # -------------------------------------------------------------------------
    # UNLOCK ALL (BULK OPTIMIZED)
    # -------------------------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="unlock-all")
    def unlock_all(self, request):
        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")

        if not term_id or not session_id:
            return Response(
                {"detail": "term_id and session_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workflows = list(
            ResultWorkflow.objects.select_related("school_class").filter(
                term_id=term_id,
                session_id=session_id,
            )
        )

        if not workflows:
            return Response(
                {"detail": "No workflows found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        unlocked = []
        skipped = []
        to_update = []
        now = timezone.now()

        for workflow in workflows:
            if not workflow.all_results_submitted:
                skipped.append(
                    {
                        "class_id": workflow.school_class_id,
                        "class_name": str(workflow.school_class),
                        "reason": "All subjects have not been submitted.",
                    }
                )
                continue

            workflow.status = "Pending"
            workflow.unlocked_by = request.user
            workflow.unlocked_at = now
            to_update.append(workflow)

            unlocked.append(
                {
                    "class_id": workflow.school_class_id,
                    "class_name": str(workflow.school_class),
                }
            )

        if to_update:
            ResultWorkflow.objects.bulk_update(
                to_update, ["status", "unlocked_by", "unlocked_at"]
            )

        return Response(
            {
                "unlocked_count": len(unlocked),
                "unlocked": unlocked,
                "skipped": skipped,
            }
        )

    # -------------------------------------------------------------------------
    # RELEASE (SINGLE - FIXED DATA LEAK)
    # -------------------------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="release")
    def release(self, request):
        school_class_id = request.data.get("school_class_id")
        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")

        workflow = ResultWorkflow.objects.filter(
            school_class_id=school_class_id,
            term_id=term_id,
            session_id=session_id,
        ).first()

        if not workflow:
            return Response(
                {"detail": "Workflow not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if workflow.status != "Approved":
            return Response(
                {"detail": "Results must be approved before release."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            workflow.status = "Released"
            workflow.released_by = request.user
            workflow.released_at = timezone.now()
            workflow.save(update_fields=["status", "released_by", "released_at"])

            # Fixed: Only release status records matching this specific class, term, and session
            SubjectResultStatus.objects.filter(
                school_class_id=school_class_id,
                term_id=term_id,
                session_id=session_id,
            ).update(is_released=True)

        serializer = self.get_serializer(workflow)
        return Response(serializer.data)

    # -------------------------------------------------------------------------
    # RELEASE ALL (BULK OPTIMIZED)
    # -------------------------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="release-all")
    def release_all(self, request):
        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")

        if not term_id or not session_id:
            return Response(
                {"detail": "term_id and session_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workflows = list(
            ResultWorkflow.objects.select_related("school_class", "term", "session").filter(
                term_id=term_id,
                session_id=session_id,
            )
        )

        if not workflows:
            return Response(
                {"detail": "No workflows found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        released = []
        skipped = []
        to_update = []
        released_class_ids = []
        now = timezone.now()

        for workflow in workflows:
            update_result_workflow(
                school_class=workflow.school_class,
                term=workflow.term,
                session=workflow.session,
            )
            workflow.refresh_from_db()

            if workflow.status != "Approved":
                skipped.append(
                    {
                        "class_id": workflow.school_class_id,
                        "class_name": str(workflow.school_class),
                        "reason": "Workflow is not approved.",
                    }
                )
                continue

            workflow.status = "Released"
            workflow.released_by = request.user
            workflow.released_at = now
            to_update.append(workflow)
            released_class_ids.append(workflow.school_class_id)

            released.append(
                {
                    "class_id": workflow.school_class_id,
                    "class_name": str(workflow.school_class),
                }
            )

        if to_update:
            with transaction.atomic():
                ResultWorkflow.objects.bulk_update(
                    to_update, ["status", "released_by", "released_at"]
                )
                SubjectResultStatus.objects.filter(
                    school_class_id__in=released_class_ids,
                    term_id=term_id,
                    session_id=session_id,
                ).update(is_released=True)

        return Response(
            {
                "released_count": len(released),
                "released": released,
                "skipped": skipped,
            }
        )

    # -------------------------------------------------------------------------
    # REFRESH STATUS (SINGLE QUERY AGGREGATION)
    # -------------------------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="refresh")
    def refresh_status(self, request):
        class_id = request.data.get("school_class_id")
        term_id = request.data.get("term_id")
        session_id = request.data.get("session_id")

        if not all([class_id, term_id, session_id]):
            return Response(
                {"detail": "school_class_id, term_id, and session_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workflow, _ = ResultWorkflow.objects.get_or_create(
            school_class_id=class_id,
            term_id=term_id,
            session_id=session_id,
        )

        counts = SubjectResultStatus.objects.filter(
            school_class_id=class_id,
            term_id=term_id,
            session_id=session_id,
        ).aggregate(
            total=Count("id"),
            submitted=Count("id", filter=Q(is_submitted=True)),
        )

        total_subjects = counts["total"]
        submitted_subjects = counts["submitted"]

        workflow.all_results_submitted = (
            total_subjects > 0 and total_subjects == submitted_subjects
        )

        if workflow.status == "Draft" and workflow.all_results_submitted:
            workflow.status = "Pending"

        workflow.save(update_fields=["all_results_submitted", "status"])

        serializer = self.get_serializer(workflow)
        return Response(serializer.data)

# =============================================================================
# 3. SUBJECT SUMMARY VIEWSET
# =============================================================================
class SubjectSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubjectSummary.objects.select_related(
        "student",
        "student__user",
        "class_subject",
        "class_subject__subject",
        "class_subject__school_class",
        "term",
        "session",
    ).order_by("class_subject", "subject_position")

    serializer_class = SubjectSummarySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["student", "class_subject", "term", "session"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        user_role = getattr(user, "role", None)

        if user.is_staff or user.is_superuser or user_role == "admin":
            return queryset

        if user_role == "teacher":
            return queryset.filter(class_subject__school_class__class_teacher__user=user)

        if user_role == "student":
            return queryset.filter(
                student__user=user,
                class_subject__submission_statuses__term=F("term"),
                class_subject__submission_statuses__session=F("session"),
                class_subject__submission_statuses__is_released=True,
            ).distinct()

        return queryset.none()
    
    