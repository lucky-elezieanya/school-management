import os
import traceback
from uuid import uuid4
import pandas as pd
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Exists, OuterRef, Prefetch, Q, Subquery
from django.utils.dateparse import parse_date

from .services.student_history import create_student_history

from .tasks import import_students_task
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django_filters.rest_framework import DjangoFilterBackend
from results.models import Behaviour

from .filters import StudentFilter
from .models import (
    AcademicSession,
    Arms,
    Class,
    ClassSubject,
  
    PromotionBatch,
    PromotionRecord,
    PromotionRule,
    SchoolAsset,
    Student,
    StudentEnrollment,
    StudentHistory,
    StudentImport,
    Subject,
    Teacher,
    Term,
)
from .permissions import IsAdminUser, IsTeacherOrAdmin
from .serializers import (
    AcademicSessionSerializer,
    ArmSerializer,
    ClassSerializer,
    ClassSubjectSerializer,
    ClassUpdateSerializer,
    PromotionBatchSerializer,
    PromotionRecordSerializer,
    PromotionRuleBulkItemSerializer,
    PromotionRuleSerializer,
    SchoolAssetSerializer,
    SessionTermSerializer,
    StudentCreateSerializer,
    StudentEnrollmentSerializer,
    StudentHistorySerializer,
    StudentImportSerializer,
    StudentSerializer,
    StudentUpdateSerializer,
    SubjectSerializer,
    TeacherCreateSerializer,
    TeacherSerializer,
    TeacherUpdateSerializer,
    TermSerializer,
)

User = get_user_model()

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 30
    page_query_param = 'page'
    page_size_query_param = 'page_size'
    max_page_size = 1000

# ==========================================
# SCHOOL ASSET VIEWSET
# ==========================================
class SchoolAssetViewSet(viewsets.ModelViewSet):
    queryset = SchoolAsset.objects.all()
    serializer_class = SchoolAssetSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['asset_type', 'is_active']

    def get_queryset(self):
        qs = super().get_queryset()
        asset_type = self.request.query_params.get("type")
        if asset_type:
            qs = qs.filter(asset_type=asset_type)
        return qs

# ==========================================
# TERM VIEWSET
# ==========================================
class TermViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.select_related("session").all().order_by("-id")
    serializer_class = TermSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def active(self, request):
        term = Term.objects.select_related("session").filter(is_active=True).first()
        if not term:
            return Response({"detail": "No active term"}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(term)
        return Response(serializer.data)

    def get_queryset(self):
        queryset = super().get_queryset()
        session_id = self.request.query_params.get("session")
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        return queryset

# ==========================================
# ACADEMIC SESSION VIEWSET
# ==========================================
class AcademicSessionViewSet(viewsets.ModelViewSet):
    queryset = AcademicSession.objects.prefetch_related("terms").order_by("-name")
    serializer_class = AcademicSessionSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def active(self, request):
        session = AcademicSession.objects.filter(is_active=True).first()
        if not session:
            return Response({"detail": "No active session"}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="active/term")
    def active_terms(self, request):
        term = Term.objects.select_related("session").filter(is_active=True).first()
        if not term:
            return Response({"detail": "No active term"}, status=status.HTTP_404_NOT_FOUND)

        serializer = TermSerializer(term)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def terms(self, request, pk=None):
        session = self.get_object()
        terms = Term.objects.filter(session=session)

        if not terms.exists():
            return Response({"detail": "No terms found for this session"}, status=status.HTTP_404_NOT_FOUND)

        serializer = TermSerializer(terms, many=True)
        return Response({
            "session": session.name,
            "terms_count": terms.count(),
            "terms": serializer.data
        })

    @action(detail=False, methods=["post"], url_path="active/create")
    def session_term(self, request):
        serializer = SessionTermSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            data = serializer.save()
            return Response(
                {
                    "message": "Session and term processed successfully",
                    "session": {
                        "id": data["session"].id,
                        "name": data["session"].name,
                        "is_active": data["session"].is_active,
                    },
                    "term": {
                        "id": data["term"].id,
                        "name": data["term"].name,
                        "is_active": data["term"].is_active,
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"], url_path="switch-active")
    @transaction.atomic
    def switch_active(self, request):
        session_id = request.data.get("session_id")
        term_id = request.data.get("term_id")

        AcademicSession.objects.update(is_active=False)
        Term.objects.update(is_active=False)

        session = AcademicSession.objects.get(id=session_id)
        session.is_active = True
        session.save(update_fields=["is_active"])

        term = Term.objects.select_related("session").get(id=term_id)
        term.is_active = True
        term.save(update_fields=["is_active"])

        return Response({
            "message": "Switched successfully",
            "session": AcademicSessionSerializer(session).data,
            "term": TermSerializer(term).data,
        })

# ==========================================
# STUDENT VIEWSET
# ==========================================
class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = StudentFilter
    search_fields = [
        "admission_number",
        "user__full_name",
        "user__username",
        "user__gender"
    ]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)
        user_id = self.request.query_params.get("user")
        is_active = self.request.query_params.get("is_current")
        session_id = self.request.query_params.get("session_id")
        school_class_id = self.request.query_params.get("school_class_id")
        
        lookups = {}
        
        if session_id:
            lookups["session_id"] = session_id
        if is_active:
            lookups["is_current"] = bool(is_active)
        if school_class_id:
            lookups["school_class_id"] = school_class_id

        current_enrollments_qs = None
        if lookups:
            current_enrollments_qs = StudentEnrollment.objects.select_related(
                "school_class",
                "school_class__arm",
                "session"
            ).filter(**lookups)
        # Prefetch current enrollment with its nested FKs to completely stop N+1 queries during serialization
        current_enrollments_qs = StudentEnrollment.objects.select_related(
                        "school_class",
                        "school_class__arm",
                        "session"
                    ).filter(is_current=True )

        queryset = Student.objects.select_related("user").prefetch_related(
            Prefetch("enrollments", queryset=current_enrollments_qs, to_attr="prefetched_current_enrollment")
        ).order_by("-id")

        if user_id:
            return queryset.filter(user_id=user_id)

        if user.is_staff or user.is_superuser or role == "admin":
            return queryset

        elif role == "teacher":
            return queryset.filter(
                enrollments__is_current=True,
                enrollments__school_class__class_teacher__user=user,
            ).distinct()

        elif role == "student":
            return queryset.filter(user=user)

        return queryset.none()

    def get_serializer_class(self):
        if self.action == "create":
            return StudentCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return StudentUpdateSerializer
        return StudentSerializer

    def get_permissions(self):
        if self.action in ["create", "destroy", "update", "partial_update"]:
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["term_id"] = self.request.query_params.get("term")
        context["session_id"] = self.request.query_params.get("session")
        return context

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = StudentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()

        # Re-fetch with prefetching for proper serialization response
        student_qs = self.get_queryset().get(pk=student.pk)
        response_serializer = StudentSerializer(student_qs, context={"request": request})

        return Response(
            {"message": "Student created successfully", "student": response_serializer.data},
            status=status.HTTP_201_CREATED,
        )

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        student = self.get_object()
        serializer = StudentUpdateSerializer(student, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()

        student_qs = self.get_queryset().get(pk=student.pk)
        response_serializer = StudentSerializer(student_qs, context={"request": request})

        return Response(
            {"message": "Student updated successfully", "student": response_serializer.data},
            status=status.HTTP_200_OK,
        )

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        student = self.get_object()
        user = student.user
        student.delete()
        if user:
            user.delete()

        return Response({"message": "Student deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["patch"], url_path="deactivate")
    @transaction.atomic
    def deactivate(self, request, pk=None):
        student = self.get_object()
        if not student.is_active:
            return Response({"message": "Student is already inactive."}, status=status.HTTP_400_BAD_REQUEST)

        student.is_active = False
        student.save(update_fields=["is_active"])
        StudentEnrollment.objects.filter(student=student, is_current=True).update(is_current=False)

        return Response({"message": "Student deactivated successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="reactivate")
    @transaction.atomic
    def reactivate(self, request, pk=None):
        student = self.get_object()
        if student.is_active:
            return Response({"message": "Student is already active."}, status=status.HTTP_400_BAD_REQUEST)

        student.is_active = True
        student.save(update_fields=["is_active"])
        return Response({"message": "Student reactivated successfully."}, status=status.HTTP_200_OK)

# ==========================================
# STUDENT IMPORT VIEWSET
# ==========================================
class StudentImportViewSet(viewsets.ModelViewSet):
    queryset = StudentImport.objects.all()
    serializer_class = StudentImportSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="status")
    def status(self, request):
        task_id = request.query_params.get("task_id")
        if not task_id:
            return Response({"detail": "task_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        task_result = StudentImport.objects.filter(task_id=task_id).first()
        if not task_result:
            return Response({"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "task_id": task_result.task_id,
            "state": task_result.status,
            "ready": task_result.status in ("completed", "failed"),
            "created_count": task_result.created_count,
            "skipped_count": task_result.skipped_count,
            "result": task_result.result,
            "error": task_result.error,
        })

# ==========================================
# ARMS VIEWSET
# ==========================================
class ArmsViewSet(viewsets.ModelViewSet):
    queryset = Arms.objects.all().order_by("-name")
    serializer_class = ArmSerializer
    permission_classes = [IsTeacherOrAdmin]

# ==========================================
# CLASS VIEWSET
#===========================================
class ClassViewSet(viewsets.ModelViewSet):
    queryset = (
    Class.objects
            .select_related(
                "class_teacher",
                "class_teacher__user",
                "arm"
            )
            .prefetch_related(
                "student_enrollments",
                "student_enrollments__student",
                "student_enrollments__student__user",
            )
        )

    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    serializer_class = ClassSerializer

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return ClassUpdateSerializer
        return ClassSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        user_role = getattr(user, "role", None)

        if user.is_staff or user.is_superuser or user_role == "admin":
            return queryset

        if user_role == "teacher":
            return queryset.filter(
                class_teacher__user=user
            )

        if user_role == "student":
            student_classes = (
                StudentEnrollment.objects
                .filter(
                    student__user=user,
                    is_current=True,
                )
                .values_list(
                    "school_class_id",
                    flat=True,
                )
            )

            return queryset.filter(
                id__in=student_classes
            )

        return queryset.none()

    # GET CLASS STUDENTS (WITH BEHAVIOUR STATUS)
    @action(detail=True, methods=["get"], url_path="students")
    def students(self, request, pk=None):
        school_class = self.get_object()
        user = request.user
        user_role = getattr(user, "role", None)

        # ======================================
        # PERMISSIONS
        # ======================================
        if user.is_staff or user.is_superuser or user_role == "admin":
            pass

        elif user_role == "teacher":
            # Check if this specific teacher is assigned to this specific class
            if not hasattr(school_class, "class_teacher") or school_class.class_teacher.user != user:
                return Response(
                    {"detail": "You do not have permission to view this class."},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            return Response(
                {"detail": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN
            )

        # ======================================
        # SAFE TERM + SESSION RESOLUTION
        # ======================================
        active_session = AcademicSession.objects.filter(is_active=True).first()
        active_term = Term.objects.filter(session=active_session, is_active=True).first()
        
        term_id = request.query_params.get("term") or getattr(active_term, "id", None)
        session_id = request.query_params.get("session") or getattr(active_session, "id", None)

        # ======================================
        # GET STUDENTS BASE QUERY
        # ======================================
        students = (
            Student.objects
            .filter(enrollments__school_class=school_class,
                    enrollments__session=active_session,
                    enrollments__is_current=True
                    )
            .select_related("user")
            .prefetch_related(
                "enrollments",
                "enrollments__school_class",
                "enrollments__session",
            )
            .distinct()
        )

        # ======================================
        # FAST BEHAVIOUR LOOKUP 
        # ======================================
        behaviour_qs = Behaviour.objects.filter(
            student_id=OuterRef("pk"),
            term_id=term_id,
            session_id=session_id,
        )

        students = students.annotate(
            behaviour_exists=Exists(behaviour_qs),
            behaviour_id=Subquery(behaviour_qs.values("id")[:1])
        )

        # ======================================
        # SERIALIZER
        # ======================================
        serializer = StudentSerializer(
            students,
            many=True,
            context={"request": request}
        )

        return Response({
            "class": ClassSerializer(
                school_class,
                context={"request": request}
            ).data,
            "students_count": students.count(),
            "students": serializer.data,
        })
    
    @action(detail=True, methods=["get"], url_path="subjects")
    def subjects(self, request, pk=None):
        school_class = self.get_object()
        term_id = request.query_params.get("term")

        subjects = school_class.class_subjects.select_related(
            "subject",
            "term"
        )

        if term_id:
            subjects = subjects.filter(term_id=term_id)

        serializer = ClassSubjectSerializer(
            subjects,
            many=True,
            context={"request": request}
        )

        return Response({
            "subjects": serializer.data
        })
    
    # ==========================================
    # CLASS SUMMARY
    # ==========================================
    
    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """
        Returns all classes together with:
        - current student count
        - class teacher

        A student is counted only when their enrollment
        is marked as is_current=True.
        """

        queryset = (
            self.get_queryset()
            .select_related(
                "arm",
                "class_teacher",
                "class_teacher__user",
            )
            .annotate(
                student_count=Count(
                    "student_enrollments__student",
                    filter=Q(
                        student_enrollments__is_current=True
                    ),
                    distinct=True,
                )
            )
            .order_by("name", "arm__name")
        )

        data = []

        for school_class in queryset:
            teacher = school_class.class_teacher

            data.append(
                {
                    "id": school_class.id,
                    "name": school_class.name,

                    "arm": {
                        "id": school_class.arm.id,
                        "name": school_class.arm.name,
                        "code": school_class.arm.code,
                    }
                    if school_class.arm
                    else None,

                    "description": school_class.description,

                    "is_active": school_class.is_active,

                    # ONLY CURRENT ENROLLMENTS
                    "student_count": school_class.student_count,

                    "class_teacher": (
                        {
                            "id": teacher.id,
                            "full_name": teacher.user.full_name,
                            "username": teacher.user.username,
                        }
                        if teacher
                        else None
                    ),
                }
            )

        return Response(
            {
                "count": len(data),
                "results": data,
            }
        )
        
    @action(detail=False, methods=["post"], url_path="upload")
    def upload(self, request, pk=None):
        REQUIRED_COLUMNS = [
        "class_name", 
        "class_description",
        "arm", 
        "class_teacher_username"
        ]
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        try:

            # =====================================================
            # GET FILE
            # =====================================================
            file_obj = request.FILES.get("file")

            if not file_obj:
                return Response(
                    {"error": "No file uploaded"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # =====================================================
            # FILE SIZE VALIDATION
            # =====================================================
            if file_obj.size > MAX_FILE_SIZE:
                return Response(
                    {"error": "File too large. Maximum size is 10MB"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            filename = file_obj.name.lower()

            # =====================================================
            # READ FILE
            # =====================================================
            try:

                if filename.endswith(".csv"):
                    df = pd.read_csv(file_obj)

                elif filename.endswith((".xlsx", ".xls")):
                    df = pd.read_excel(file_obj)

                else:
                    return Response(
                        {"error": "Unsupported file format"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # CLEAN COLUMN NAMES
                df.columns = df.columns.str.strip()

                # REPLACE NaN WITH EMPTY STRING
                df = df.fillna("")

            except Exception as e:

                return Response(
                    {"error": f"Error reading file: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # =====================================================
            # VALIDATE REQUIRED COLUMNS
            # =====================================================
            missing_columns = [
                col for col in REQUIRED_COLUMNS
                if col not in df.columns
            ]

            if missing_columns:
                return Response(
                    {
                        "error": "Missing required columns",
                        "missing_columns": missing_columns,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ========== RESULTS ============#
            created_classes = []
            skipped_classes = []

            # =====================================================
            # LOOP THROUGH ROWS
            # =====================================================
            for index, row in df.iterrows():
                excel_row = index + 2
                try:
                    # =================================================
                    # CLEAN ROW VALUES
                    # =================================================
                    cleaned_row = {}

                    for key, value in row.items():
                        cleaned_row[key] = (
                            str(value).strip()
                            if pd.notnull(value)
                            else ""
                        )
                    # ==========CLEAN CLASS FIELDS =========#
                    class_name = cleaned_row["class_name"].strip()
                    arm = cleaned_row["arm"].strip().upper()
                    class_description = cleaned_row["class_description"].strip()
                    class_teacher_username = cleaned_row["class_teacher_username"].strip().lower()                    
                    # ================= VALIDATE CLASS NAME
                   
                    if not class_name:
                        skipped_classes.append({
                            "row": excel_row,
                            "error": "Class name is required",
                        })
                        continue
                    if not class_description:
                        skipped_classes.append({
                            "row": excel_row,
                            "error": "Class description is required",
                        })
                        continue
                    if not arm:
                        skipped_classes.append({
                            "row": excel_row,
                            "error": "Class arm is required",
                        })
                        continue

                    
                    if arm:
                        class_arm = Arms.objects.filter(name=arm).first()
                        if not class_arm:
                            class_arm = Arms.objects.create(
                                name=arm,
                                code=f"Arm {arm}"
                            )
                 
                    # =================================================
                    # CHECK EXISTING CLASS
                    # =================================================
                    if Class.objects.filter( 
                        name=class_name,
                        arm=class_arm,
                    ).exists():

                        skipped_classes.append({
                            "row": excel_row,
                            "name": class_name,
                            "error": (
                                f"Class {class_name} with arm "
                                f"{class_arm.name} already exists."
                            ),
                        })

                        continue
                        
                    class_teacher_id = None

                    if class_teacher_username:
                       
                        user = User.objects.filter(username=class_teacher_username).first()
                        
                        if user:
                            class_teacher = Teacher.objects.filter(user=user).first()
                            if class_teacher:
                                class_teacher_id = class_teacher.id
                       
                    # =========== SERIALIZER DATA ========= #
                    
                    serializer_data = {
                        "name": class_name.upper(),
                        "arm_id": class_arm.id,
                        "description": class_description.upper(),
                        "class_teacher_id": class_teacher_id
                       }
                    # # =================================================
                    # SAVE CLASS
                    # =================================================
                    with transaction.atomic():

                        serializer = ClassSerializer(
                            data=serializer_data
                        )

                        if serializer.is_valid():
                            serializer.save()

                            created_classes.append({
                                "row": excel_row,
                                "class_name": class_name,
                                "class_description": class_description,
                            })
                        else:
                            skipped_classes.append({
                                "row": excel_row,
                                "class_name": class_name,
                                "error": serializer.errors,
                            })
                            
                except Exception as e:

                    print(traceback.format_exc())

                    skipped_classes.append({
                        "row": excel_row,
                        "subject_name": cleaned_row.get(
                            "subject_name",
                            "unknown",
                        ),
                        "error": str(e),
                    })

            # =====================================================
            # FINAL RESPONSE
            # =====================================================
            return Response(
                {
                    "message": "Upload completed",

                    "created_count": len(created_classes),

                    "skipped_count": len(skipped_classes),

                    "created_classes": created_classes,

                    "skipped_classes": skipped_classes,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:

            print(traceback.format_exc())

            return Response(
                {
                    "error": "Server error",
                    "details": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ) 

# ==========================================
# TEACHER VIEWSET
# ==========================================
class TeacherViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTeacherOrAdmin]
    parser_classes = [FormParser, MultiPartParser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user"]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)

        queryset = Teacher.objects.select_related("user").prefetch_related(
            "assigned_classes__arm"
        )

        if user.is_staff or user.is_superuser or role == "admin":
            return queryset
        if role == "teacher":
            return queryset.filter(user=user)

        if role == "student":
            student = Student.objects.select_related(
                "enrollments__school_class__class_teacher"
            ).filter(user=user, enrollments__is_current=True).first()

            if student and student.current_class and student.current_class.class_teacher_id:
                return queryset.filter(pk=student.current_class.class_teacher_id)

            return Teacher.queryset.none()

        return Teacher.queryset.none()

    def get_serializer_class(self):
        if self.action == "create":
            return TeacherCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return TeacherUpdateSerializer
        return TeacherSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        if "assigned_classes" in request.data:
            if hasattr(request.data, "getlist"):
                assigned_classes = request.data.getlist(
                    "assigned_classes"
                )

                # Remove empty values
                assigned_classes = [
                    class_id
                    for class_id in assigned_classes
                    if str(class_id).strip()
                ]

                data.setlist(
                    "assigned_classes",
                    assigned_classes
                )

        serializer = self.get_serializer(
            data=data
        )

        serializer.is_valid(
            raise_exception=True
        )

        self.perform_create(serializer)

        headers = self.get_success_headers(
            serializer.data
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        # Prepare request data copy for form-data list handling
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)

        # Handle assigned_classes list parsing for MultiPartParser / FormParser
        if "assigned_classes" in request.data:
            if hasattr(request.data, "getlist"):
                # Get all array elements if sent as key-value pairs (e.g. assigned_classes=1&assigned_classes=2)
                assigned_classes = request.data.getlist("assigned_classes")
                if len(assigned_classes) == 1 and isinstance(assigned_classes[0], str) and "," in assigned_classes[0]:
                    # Handle comma-separated strings if sent as "1,2,3"
                    assigned_classes = [item.strip() for item in assigned_classes[0].split(",") if item.strip()]
                data.setlist("assigned_classes", assigned_classes)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Return full TeacherSerializer response instead of update serializer
        response_serializer = TeacherSerializer(instance, context=self.get_serializer_context())
        return Response(response_serializer.data)

    @action(detail=False, methods=["get"], url_path="teacher")
    def teacher(self, request):
        user = request.user
        user_id = request.query_params.get("user_id")

        if not user_id:
            return Response(
                {"detail": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if str(user.id) != user_id:
            return Response(
                {"detail": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN,
            )

        teacher = self.get_queryset().filter(user_id=user.id).first()

        if not teacher:
            return Response(
                {"detail": "Teacher not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(teacher)
        return Response(serializer.data)

# ==========================================
# SUBJECT VIEWSET
# ==========================================
class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all().order_by("name")
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [SearchFilter]
    search_fields = ["name", "code"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        user_role = getattr(user, "role", None)

        if user.is_staff or user.is_superuser or user_role in ["admin", "teacher"]:
            return super().get_queryset()

        if user_role == "student":
            return Subject.objects.filter(
                class_subjects__school_class__student_enrollments__student__user=user,
                class_subjects__school_class__student_enrollments__is_current=True
            ).distinct()

        return Subject.objects.none()

    @action(
        detail=False,
        methods=["post"],
        url_path="upload",
        parser_classes=[MultiPartParser, FormParser]
    )
    def upload(self, request):
        REQUIRED_COLUMNS = ["subject_name", "subject_code"]
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        if file_obj.size > MAX_FILE_SIZE:
            return Response({"error": "File too large. Maximum size is 10MB"}, status=status.HTTP_400_BAD_REQUEST)

        filename = file_obj.name.lower()

        # Read File
        try:
            if filename.endswith(".csv"):
                df = pd.read_csv(file_obj)
            elif filename.endswith((".xlsx", ".xls")):
                df = pd.read_excel(file_obj)
            else:
                return Response(
                    {"error": "Unsupported file format. Allowed formats: .csv, .xlsx, .xls"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Standardize column headers and clean data
            df.columns = df.columns.str.strip()
            df = df.fillna("")
        except Exception as e:
            return Response({"error": f"Error reading file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate required columns
        missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing_columns:
            return Response(
                {"error": "Missing required columns", "missing_columns": missing_columns},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Fetch all existing names and codes upfront in 1 single database call
        existing_names = set(Subject.objects.values_list("name", flat=True))
        existing_codes = set(Subject.objects.values_list("code", flat=True))

        created_subjects = []
        skipped_subjects = []
        to_create = []

        # Iteration through records array for memory efficiency
        records = df.to_dict(orient="records")

        for index, row in enumerate(records):
            excel_row = index + 2
            try:
                subject_name = str(row.get("subject_name", "")).strip().upper()
                subject_code = str(row.get("subject_code", "")).strip().upper()

                if not subject_name:
                    skipped_subjects.append({
                        "row": excel_row,
                        "error": "Subject name is required",
                    })
                    continue

                if not subject_code:
                    skipped_subjects.append({
                        "row": excel_row,
                        "subject_name": subject_name,
                        "error": "Subject code is required",
                    })
                    continue

                # In-memory validation check
                if subject_name in existing_names:
                    skipped_subjects.append({
                        "row": excel_row,
                        "subject_name": subject_name,
                        "error": f"Subject with name '{subject_name}' already exists",
                    })
                    continue

                if subject_code in existing_codes:
                    skipped_subjects.append({
                        "row": excel_row,
                        "subject_name": subject_name,
                        "error": f"Subject with code '{subject_code}' already exists",
                    })
                    continue

                # Stage for batch creation
                to_create.append(Subject(name=subject_name, code=subject_code))
                
                # Update local sets to catch duplicate rows within the same uploaded file
                existing_names.add(subject_name)
                existing_codes.add(subject_code)

                created_subjects.append({
                    "row": excel_row,
                    "subject_name": subject_name,
                    "subject_code": subject_code,
                })

            except Exception as e:
                skipped_subjects.append({
                    "row": excel_row,
                    "subject_name": str(row.get("subject_name", "unknown")),
                    "error": str(e),
                })

        # Bulk database insert in 1 transaction
        if to_create:
            with transaction.atomic():
                Subject.objects.bulk_create(to_create)

        return Response(
            {
                "message": "Upload completed successfully",
                "created_count": len(created_subjects),
                "skipped_count": len(skipped_subjects),
                "created_subjects": created_subjects,
                "skipped_subjects": skipped_subjects,
            },
            status=status.HTTP_201_CREATED,
        )

# ==========================================
# CLASS SUBJECT VIEWSET
# ==========================================
class ClassSubjectViewSet(viewsets.ModelViewSet):
    queryset = ClassSubject.objects.select_related(
        "school_class",
        "school_class__arm",
        "subject",
        "term",
        "term__session"
    )
    serializer_class = ClassSubjectSerializer
    permission_classes = [IsTeacherOrAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['term', 'school_class', 'subject']

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["post"], url_path="bulk-create")
    @transaction.atomic
    def bulk_create(self, request):
        class_id = request.data.get("class_id")
        term_id = request.data.get("term_id")
        subject_ids = request.data.get("subject_ids", [])

        objs = [
            ClassSubject(school_class_id=class_id, subject_id=s_id, term_id=term_id)
            for s_id in subject_ids
        ]
        created = ClassSubject.objects.bulk_create(objs, ignore_conflicts=True)
        return Response({"created": [obj.id for obj in created if obj.id]})

    @action(detail=False, methods=["delete"], url_path="bulk-delete-by-composite")
    def bulk_delete_by_composite(self, request):
        class_id = request.query_params.get("class")
        term_id = request.query_params.get("term")
        subjects = request.query_params.get("subjects", "")

        if not class_id or not term_id:
            return Response(
                {"detail": "class and term are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ convert "4,5" → [4, 5]
        subject_ids = [
            int(s) for s in subjects.split(",") if s.strip().isdigit()
        ]

        if not subject_ids:
            return Response(
                {"detail": "No valid subject IDs provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        deleted_count = ClassSubject.objects.filter(
            school_class_id=class_id,
            term_id=term_id,
            subject_id__in=subject_ids
        ).delete()[0]

        return Response(
            {
                "message": "Deleted successfully",
                "deleted": deleted_count
            },
            status=status.HTTP_200_OK
        )
  
    @action(detail=False, methods=["get"])
    def by_class_and_term(self, request):

        class_id = request.query_params.get("class")
        term_id = request.query_params.get("term")

        queryset = ClassSubject.objects.filter(
            school_class_id=class_id,
            term_id=term_id,
        )

        serializer = self.get_serializer(
            queryset,
            many=True,
        )

        return Response(serializer.data)

# ==========================================
# STUDENT ENROLLMENT VIEWSET
# ==========================================
class StudentEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = StudentEnrollment.objects.select_related(
        "student",
        "student__user",
        "session",
        "school_class",
        "school_class__arm",
    )
    serializer_class = StudentEnrollmentSerializer
    permission_classes = [IsTeacherOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['school_class', 'session', 'is_current']
    search_fields = ["student__admission_number", "student__user__full_name"]

    @action(detail=False, methods=["get"], url_path="students")
    def students(self, request):
        """
        Fetch students enrolled in a class for a session.

        Query Params:
        ?school_class=1
        ?session=2
        """

        class_id = request.query_params.get("school_class")
        session_id = request.query_params.get("session")

        if not class_id:
            return Response(
                {"detail": "school_class is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        students = Student.objects.filter(
            enrollments__school_class_id=class_id
        )

        if session_id:
            students = students.filter(
                enrollments__session_id=session_id
            )
        else:
            students = students.filter(
                enrollments__is_current=True
            )

        students = (
            students.select_related("user")
            .distinct()
        )

        serializer = StudentSerializer(
            students,
            many=True,
            context={"request": request},
        )

        return Response(
            {
                "count": students.count(),
                "students": serializer.data,
            },
            status=status.HTTP_200_OK,
        )   
    
    @action(detail=False, methods=["post"], url_path="bulk-enroll")
    @transaction.atomic
    def bulk_enroll(self, request):

        session_id = request.data.get("session_id")
        school_class_id = request.data.get("school_class_id")
        is_current = request.data.get("is_current", True)
        student_ids = request.data.get("student_ids", [])

        # ==========================================================
        # VALIDATE INPUT
        # ==========================================================

        if not student_ids or not session_id or not school_class_id:
            return Response(
                {
                    "detail": (
                        "session_id, school_class_id and "
                        "student_ids are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Convert string input:
        # "1,2,3" -> [1, 2, 3]
        if isinstance(student_ids, str):
            student_ids = [
                int(x)
                for x in student_ids.split(",")
                if x.strip().isdigit()
            ]

        # Remove duplicates
        student_ids = list(set(student_ids))

        if not student_ids:
            return Response(
                {"detail": "No valid student IDs provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ==========================================================
        # GET SESSION + CLASS
        # ==========================================================

        session = (
            AcademicSession.objects
            .filter(id=session_id)
            .first()
        )

        school_class = (
            Class.objects
            .select_related("arm")
            .filter(id=school_class_id)
            .first()
        )

        if not session:
            return Response(
                {"detail": "Academic session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not school_class:
            return Response(
                {"detail": "Class not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ==========================================================
        # VERIFY STUDENTS EXIST
        # ==========================================================

        students = {
            student.id: student
            for student in Student.objects
            .select_related("user")
            .filter(id__in=student_ids)
        }

        missing_students = [
            student_id
            for student_id in student_ids
            if student_id not in students
        ]

        if missing_students:
            return Response(
                {
                    "detail": "Some students do not exist.",
                    "missing_student_ids": missing_students,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ==========================================================
        # LOCK ENROLLMENTS
        #
        # Prevent concurrent enrollment operations from modifying
        # the same student's records at the same time.
        # ==========================================================

        existing_enrollments = {
            enrollment.student_id: enrollment
            for enrollment in (
                StudentEnrollment.objects
                .select_for_update()
                .filter(
                    student_id__in=student_ids,
                    session_id=session_id,
                )
            )
        }

        # ==========================================================
        # RESULT COLLECTIONS
        # ==========================================================

        created = []
        skipped = []
        conflicts = []

        # ==========================================================
        # PROCESS EACH STUDENT
        # ==========================================================

        for student_id in student_ids:

            existing = existing_enrollments.get(student_id)

            # ------------------------------------------------------
            # CASE 1:
            # Student has NO enrollment for this session.
            # ------------------------------------------------------

            if existing is None:

                enrollment = StudentEnrollment.objects.create(
                    student_id=student_id,
                    session_id=session_id,
                    school_class_id=school_class_id,
                    is_current=is_current,
                )

                # --------------------------------------------------
                # CREATE IMMUTABLE HISTORY
                # --------------------------------------------------

                create_student_history(
                    enrollment=enrollment,
                    status="ENROLLED",
                )

                created.append({
                    "student_id": student_id,
                    "enrollment_id": enrollment.id,
                })

                continue

            # ------------------------------------------------------
            # CASE 2:
            # Enrollment already exists for this session and class.
            # ------------------------------------------------------

            if existing.school_class_id == school_class_id:

                # If it is already in the requested state,
                # nothing needs to happen.

                if existing.is_current == is_current:

                    skipped.append({
                        "student_id": student_id,
                        "reason": "Already enrolled in this class.",
                    })

                    continue

                # --------------------------------------------------
                # Same session + same class, but current state differs.
                #
                # This is NOT a new academic placement.
                # We can safely change current status.
                # --------------------------------------------------

                existing.is_current = is_current
                existing.save(update_fields=["is_current"])

                if is_current:
                    Student.objects.filter(
                        id=student_id,
                        is_active=False,
                    ).update(is_active=True)

                skipped.append({
                    "student_id": student_id,
                    "reason": "Enrollment status updated.",
                })

                continue

            # ------------------------------------------------------
            # CASE 3:
            # Enrollment exists for this session but different class.
            #
            # DO NOT silently move the student.
            # ------------------------------------------------------

            conflicts.append({
                "student_id": student_id,
                "existing_enrollment_id": existing.id,
                "existing_class_id": existing.school_class_id,
                "requested_class_id": school_class_id,
                "reason": (
                    "Student already has an enrollment for this "
                    "academic session in another class. "
                    "Use the dedicated transfer/reassignment flow."
                ),
            })

        # ==========================================================
        # HANDLE CURRENT ENROLLMENTS
        # ==========================================================
        #
        # Only students that were actually newly enrolled into the
        # requested class should become current here.
        #
        # IMPORTANT:
        # The new enrollment has already been created above.
        # We now deactivate current enrollments from OTHER sessions.
        # ==========================================================

        if is_current and created:

            created_student_ids = [
                item["student_id"]
                for item in created
            ]

            StudentEnrollment.objects.filter(
                student_id__in=created_student_ids,
                is_current=True,
            ).exclude(
                session_id=session_id
            ).update(
                is_current=False
            )

            Student.objects.filter(
                id__in=created_student_ids,
                is_active=False,
            ).update(
                is_active=True
            )

        # ==========================================================
        # REFRESH STUDENTS FOR RESPONSE
        # ==========================================================

        current_enrollments_qs = (
            StudentEnrollment.objects
            .select_related(
                "school_class",
                "school_class__arm",
                "session",
            )
            .filter(is_current=True)
        )

        enrolled_students = (
            Student.objects
            .filter(id__in=student_ids)
            .select_related("user")
            .prefetch_related(
                Prefetch(
                    "enrollments",
                    queryset=current_enrollments_qs,
                    to_attr="prefetched_current_enrollment",
                )
            )
        )

        # ==========================================================
        # RESPONSE
        # ==========================================================

        return Response(
            {
                "message": "Bulk enrollment processed successfully.",

                "created_count": len(created),

                "skipped_count": len(skipped),

                "conflict_count": len(conflicts),

                "created": created,

                "skipped": skipped,

                "conflicts": conflicts,

                "class": ClassSerializer(
                    school_class,
                    context={"request": request},
                ).data,

                "session": AcademicSessionSerializer(
                    session,
                    context={"request": request},
                ).data,

                "students": StudentSerializer(
                    enrolled_students,
                    many=True,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )

class StudentFileUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAdminUser]

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get("file")

        if not file_obj:
            return Response(
                {"error": "No file uploaded"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file_obj.size > self.MAX_FILE_SIZE:
            return Response(
                {"error": "File too large. Maximum size is 10MB"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            return Response(
                {"error": "Unsupported file format. Allowed formats: .csv, .xlsx, .xls"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task_id = str(uuid4())
        student_import = StudentImport.objects.create(
            file=file_obj,
            status="pending",
            task_id=task_id,
        )

        try:
            import_students_task(student_import.id)
            student_import.refresh_from_db()
        except Exception as e:
            student_import.status = "failed"
            student_import.error = str(e)
            student_import.save(update_fields=["status", "error"])
            return Response(
                {"error": "Import task failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "message": "Student import completed successfully.",
                "task_id": student_import.task_id,
                "import_id": student_import.id,
                "status": student_import.status,
                "created_count": student_import.created_count,
                "skipped_count": student_import.skipped_count,
                "completed_at": student_import.completed_at,
                "result": student_import.result,
            },
            status=status.HTTP_200_OK,
        )

# ============================================================
# PROMOTION RECORD VIEWSET
# ============================================================

class PromotionRecordViewSet(viewsets.ModelViewSet):
    queryset = (
        PromotionRecord.objects
        .select_related(
            "student",
            "student__user",
            "from_class",
            "from_class__arm",
            "to_class",
            "to_class__arm",
            "batch",
            "batch__from_session",
            "batch__to_session",
        )
        .order_by("-id")
    )

    serializer_class = PromotionRecordSerializer
    permission_classes = [IsAdminUser]

# ============================================================
# PROMOTION RULE VIEWSET
# ============================================================

class PromotionRuleViewSet(viewsets.ModelViewSet):

    queryset = (
        PromotionRule.objects
        .select_related(
            "from_class",
            "from_class__arm",
            "to_class",
            "to_class__arm",
        )
        .order_by("from_class__name")
    )

    serializer_class = PromotionRuleSerializer
    permission_classes = [IsAdminUser]


    # ========================================================
    # BULK UPSERT
    # ========================================================

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-upsert",
    )
    @transaction.atomic
    def bulk_upsert(self, request):

        serializer = PromotionRuleBulkItemSerializer(
            data=request.data,
            many=True,
        )

        serializer.is_valid(raise_exception=True)

        rows = serializer.validated_data


        # ====================================================
        # CHECK DUPLICATE SOURCE CLASSES
        # ====================================================

        from_class_ids = [
            row["from_class_id"].id
            for row in rows
        ]

        if len(from_class_ids) != len(set(from_class_ids)):

            return Response(
                {
                    "message": (
                        "A class can only have one "
                        "promotion rule."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        # ====================================================
        # PROCESS CONFIGURATION
        # ====================================================

        for row in rows:

            from_class = row["from_class_id"]

            to_class = row.get(
                "to_class_id"
            )

            outcome = row.get(
                "outcome",
                PromotionRule.PROMOTE,
            )

            is_active = row.get(
                "is_active",
                True,
            )


            # ------------------------------------------------
            # FIND EXISTING RULE
            # ------------------------------------------------

            rule = (
                PromotionRule.objects
                .filter(
                    from_class=from_class,
                )
                .first()
            )


            # ------------------------------------------------
            # UPDATE EXISTING RULE
            # ------------------------------------------------

            if rule:

                rule.to_class = to_class
                rule.outcome = outcome
                rule.is_active = is_active

                rule.save(
                    update_fields=[
                        "to_class",
                        "outcome",
                        "is_active",
                    ]
                )

                continue


            # ------------------------------------------------
            # CREATE NEW RULE
            # ------------------------------------------------

            PromotionRule.objects.create(
                from_class=from_class,
                to_class=to_class,
                outcome=outcome,
                is_active=is_active,
            )


        # ====================================================
        # RETURN CURRENT CONFIGURATION
        # ====================================================

        result = (
            PromotionRule.objects
            .select_related(
                "from_class",
                "from_class__arm",
                "to_class",
                "to_class__arm",
            )
            .order_by("from_class__name")
        )

        response_serializer = PromotionRuleSerializer(
            result,
            many=True,
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )
# ============================================================
# PROMOTION BATCH VIEWSET
# ============================================================

class PromotionBatchViewSet(viewsets.ModelViewSet):

    queryset = (
        PromotionBatch.objects
        .select_related(
            "from_session",
            "to_session",
            "promoted_by",
        )
        .order_by("-id")
    )

    serializer_class = PromotionBatchSerializer
    permission_classes = [IsAdminUser]

    # ========================================================
    # HELPER
    # ========================================================
    def _get_batch(self, pk, lock=False):

        queryset = PromotionBatch.objects.all()

        if lock:
            queryset = queryset.select_for_update()

        return get_object_or_404(
            queryset,
            pk=pk,
        )

    # ========================================================
    # EXECUTE PROMOTION
    # ========================================================

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def execute(self, request, pk=None):

        # --------------------------------------------------------
        # Lock ONLY the promotion batch row.
        # Do not select_related() while locking.
        # --------------------------------------------------------

        batch = self._get_batch(
            pk,
            lock=True,
        )

        if batch.completed:

            return Response(
                {
                    "detail": (
                        "This promotion batch has already "
                        "been executed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        # --------------------------------------------------------
        # Get current source-session enrollments.
        #
        # IMPORTANT:
        # Do NOT combine select_for_update() with select_related().
        # --------------------------------------------------------

        enrollments = list(
            StudentEnrollment.objects
            .select_for_update()
            .filter(
                session=batch.from_session,
                is_current=True,
            )
        )


        # --------------------------------------------------------
        # Get active promotion rules.
        # --------------------------------------------------------

        rules = (
            PromotionRule.objects
            .filter(
                is_active=True,
            )
            .values(
                "from_class_id",
                "to_class_id",
                "outcome",
            )
        )


        rules_map = {
            rule["from_class_id"]: rule
            for rule in rules
        }


        # ========================================================
        # PRE-FLIGHT VALIDATION
        # ========================================================

        students_without_rule = []
        target_conflicts = []


        for enrollment in enrollments:

            rule = rules_map.get(
                enrollment.school_class_id
            )


            # ----------------------------------------------------
            # NO RULE
            #
            # This is different from GRADUATE.
            #
            # It means the administrator has not configured
            # this class.
            # ----------------------------------------------------

            if not rule:

                students_without_rule.append(
                    {
                        "student_id": enrollment.student_id,
                        "from_class_id": enrollment.school_class_id,
                    }
                )

                continue


            # ----------------------------------------------------
            # GRADUATION
            #
            # No target enrollment is required.
            # ----------------------------------------------------

            if rule["outcome"] == PromotionRule.GRADUATE:

                continue


            # ----------------------------------------------------
            # PROMOTION
            # ----------------------------------------------------

            to_class_id = rule["to_class_id"]

            if not to_class_id:

                students_without_rule.append(
                    {
                        "student_id": enrollment.student_id,
                        "from_class_id": enrollment.school_class_id,
                    }
                )

                continue


            # ----------------------------------------------------
            # Prevent target-session conflicts.
            # ----------------------------------------------------

            existing_target = (
                StudentEnrollment.objects
                .filter(
                    student_id=enrollment.student_id,
                    session=batch.to_session,
                )
                .first()
            )

            if existing_target:

                target_conflicts.append(
                    {
                        "student_id": enrollment.student_id,
                        "existing_enrollment_id": (
                            existing_target.id
                        ),
                        "existing_class_id": (
                            existing_target.school_class_id
                        ),
                    }
                )

        # ========================================================
        # STOP BEFORE MAKING CHANGES
        # ========================================================
        if students_without_rule or target_conflicts:
            return Response(
                {
                    "detail": (
                        "Promotion batch cannot be executed "
                        "until all students are resolved."
                    ),

                    "students_without_rule":
                        students_without_rule,

                    "target_conflicts":
                        target_conflicts,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        # ========================================================
        # PROCESS STUDENTS
        # ========================================================
        promoted_count = 0
        graduated_count = 0

        for enrollment in enrollments:

            student_id = enrollment.student_id

            from_class_id = (
                enrollment.school_class_id
            )

            rule = rules_map[from_class_id]

            outcome = rule["outcome"]


            # ====================================================
            # GRADUATE
            # ====================================================

            if outcome == PromotionRule.GRADUATE:

                enrollment.is_current = False

                enrollment.save(
                    update_fields=[
                        "is_current",
                        "updated_at",
                    ]
                )


                PromotionRecord.objects.create(
                    batch=batch,
                    student_id=student_id,
                    from_class_id=from_class_id,
                    to_class_id=None,
                    status="GRADUATED",
                )


                graduated_count += 1

                continue


            # ====================================================
            # PROMOTE
            # ====================================================

            to_class_id = rule["to_class_id"]


            # ----------------------------------------------------
            # Deactivate current enrollment.
            # ----------------------------------------------------

            enrollment.is_current = False

            enrollment.save(
                update_fields=[
                    "is_current",
                    "updated_at",
                ]
            )


            # ----------------------------------------------------
            # Create target enrollment.
            # ----------------------------------------------------

            target_enrollment = (
                StudentEnrollment.objects.create(
                    student_id=student_id,
                    session=batch.to_session,
                    school_class_id=to_class_id,
                    is_current=True,
                )
            )


            # ----------------------------------------------------
            # Promotion record.
            # ----------------------------------------------------

            PromotionRecord.objects.create(
                batch=batch,
                student_id=student_id,
                from_class_id=from_class_id,
                to_class_id=to_class_id,
                status="PROMOTED",
            )


            # ----------------------------------------------------
            # Target-session academic history.
            # ----------------------------------------------------

            create_student_history(
                enrollment=target_enrollment,
                status="PROMOTED",
            )


            promoted_count += 1


        # ========================================================
        # COMPLETE BATCH
        # ========================================================

        batch.completed = True

        batch.save(
            update_fields=["completed"]
        )


        # ========================================================
        # RESPONSE
        # ========================================================

        return Response(
            {
                "message": (
                    "Promotion execution completed successfully."
                ),

                "students_processed":
                    len(enrollments),

                "students_promoted":
                    promoted_count,

                "students_graduated":
                    graduated_count,

                "students_failed":
                    0,
            },
            status=status.HTTP_200_OK,
        )
        
    # ========================================================
    # PREVIEW
    # ========================================================

    @action(
        detail=True,
        methods=["get"],
    )
    def preview(self, request, pk=None):

        batch = self.get_object()

        class_counts = dict(
            StudentEnrollment.objects
            .filter(
                session=batch.from_session,
                is_current=True,
            )
            .values("school_class_id")
            .annotate(
                total=Count("id")
            )
            .values_list(
                "school_class_id",
                "total",
            )
        )

        rules = (
            PromotionRule.objects
            .filter(
                is_active=True,
            )
            .select_related(
                "from_class",
                "from_class__arm",
                "to_class",
                "to_class__arm",
            )
        )

        preview_data = []

        total_students = 0

        students_without_rule = 0

        rule_class_ids = set()

        promoted_students = 0

        graduating_students = 0


        # ==========================================================
        # RULES
        # ==========================================================

        for rule in rules:

            rule_class_ids.add(
                rule.from_class_id
            )

            count = class_counts.get(
                rule.from_class_id,
                0,
            )

            total_students += count


            # ------------------------------------------------------
            # Graduate
            # ------------------------------------------------------

            if (
                rule.outcome ==
                PromotionRule.GRADUATE
            ):

                graduating_students += count

                preview_data.append(
                    {
                        "from_class_id":
                            rule.from_class_id,

                        "from_class":
                            str(
                                rule.from_class
                            ),

                        "to_class_id":
                            None,

                        "to_class":
                            None,

                        "outcome":
                            PromotionRule.GRADUATE,

                        "students":
                            count,
                    }
                )

                continue


            # ------------------------------------------------------
            # Promote
            # ------------------------------------------------------

            promoted_students += count

            preview_data.append(
                {
                    "from_class_id":
                        rule.from_class_id,

                    "from_class":
                        str(
                            rule.from_class
                        ),

                    "to_class_id":
                        rule.to_class_id,

                    "to_class":
                        (
                            str(rule.to_class)
                            if rule.to_class
                            else None
                        ),

                    "outcome":
                        PromotionRule.PROMOTE,

                    "students":
                        count,
                }
            )


        # ==========================================================
        # CLASSES WITHOUT RULES
        # ==========================================================

        for class_id, count in class_counts.items():

            if class_id not in rule_class_ids:

                students_without_rule += count


        # ==========================================================
        # RESPONSE
        # ==========================================================

        return Response(
            {
                "batch_id":
                    batch.id,

                "from_session":
                    batch.from_session_id,

                "to_session":
                    batch.to_session_id,

                "total_students":
                    total_students,

                "promoted_students":
                    promoted_students,

                "graduating_students":
                    graduating_students,

                "students_without_rule":
                    students_without_rule,

                "promotions":
                    preview_data,
            }
        )
    # ========================================================
    # GET BATCH STUDENTS
    # ========================================================

    @action(detail=True, methods=["get"])
    def students(self, request, pk=None):

        batch = self.get_object()

        data = list(
            StudentEnrollment.objects
            .filter(
                session=batch.from_session,
                is_current=True,
            )
            .values(
                "student_id",
                "student__user__full_name",
                "student__user__username",
                "school_class_id",
                "school_class__name",
                "school_class__arm__name",
            )
            .order_by(
                "school_class__name",
                "school_class__arm__name",
                "student__user__full_name",
            )
        )

        formatted_data = []

        for item in data:

            name = (
                item["student__user__full_name"]
                or item["student__user__username"]
            )

            class_name = item["school_class__name"] or ""

            arm_name = item["school_class__arm__name"] or ""

            current_class = (
                f"{class_name} {arm_name}"
            ).strip()

            formatted_data.append(
                {
                    "student_id": item["student_id"],
                    "name": name,
                    "current_class": current_class,
                    "school_class_id": item["school_class_id"],
                }
            )

        return Response(formatted_data)

    # ========================================================
    # REPEAT STUDENT
    # ========================================================

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def repeat_student(self, request, pk=None):

        batch = self._get_batch(pk, lock=True)

        if batch.completed:
            return Response(
                {
                    "detail": (
                        "This promotion batch has already been executed. "
                        "Students can no longer be modified."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        student_id = request.data.get("student")

        if not student_id:
            return Response(
                {"detail": "student is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Prevent duplicate processing.
        # --------------------------------------------------------

        if PromotionRecord.objects.filter(
            batch=batch,
            student_id=student_id,
        ).exists():

            return Response(
                {
                    "detail": (
                        "This student has already been processed "
                        "in this promotion batch."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Lock the source enrollment.
        # --------------------------------------------------------

        enrollment = (
                StudentEnrollment.objects
                .select_for_update()
                .filter(
                    student_id=student_id,
                    session=batch.from_session,
                    is_current=True,
                )
                .first()
            )

        if not enrollment:
            return Response(
                {
                    "detail": (
                        "Current enrollment not found for "
                        "this student in the source session."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # --------------------------------------------------------
        # A student cannot have another enrollment in the target
        # session.
        # --------------------------------------------------------

        if StudentEnrollment.objects.filter(
            student_id=student_id,
            session=batch.to_session,
        ).exists():

            return Response(
                {
                    "detail": (
                        "This student already has an enrollment "
                        "in the target session."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Deactivate source/current enrollment.
        # --------------------------------------------------------

        enrollment.is_current = False
        enrollment.save(
            update_fields=["is_current", "updated_at"]
        )

        # --------------------------------------------------------
        # Create target enrollment in the SAME class.
        # --------------------------------------------------------

        target_enrollment = StudentEnrollment.objects.create(
            student_id=student_id,
            session=batch.to_session,
            school_class_id=enrollment.school_class_id,
            is_current=True,
        )

        # --------------------------------------------------------
        # Promotion record.
        # --------------------------------------------------------

        PromotionRecord.objects.create(
            batch=batch,
            student_id=student_id,
            from_class_id=enrollment.school_class_id,
            to_class_id=enrollment.school_class_id,
            status="REPEATED",
        )

        # --------------------------------------------------------
        # Immutable target-session history.
        # --------------------------------------------------------

        create_student_history(
            enrollment=target_enrollment,
            status="REPEATED",
        )

        return Response(
            {
                "message": (
                    "Student has been marked as a repeater "
                    "successfully."
                )
            },
            status=status.HTTP_200_OK,
        )
    # ========================================================
    # GRADUATE STUDENT
    # ========================================================
    @action(detail=True, methods=["post"])
    @transaction.atomic
    def graduate_student(self, request, pk=None):

        batch = self._get_batch(pk, lock=True)

        if batch.completed:
            return Response(
                {
                    "detail": (
                        "This promotion batch has already been executed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        student_id = request.data.get("student")

        if not student_id:
            return Response(
                {"detail": "student is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Prevent duplicate processing.
        # --------------------------------------------------------

        if PromotionRecord.objects.filter(
            batch=batch,
            student_id=student_id,
        ).exists():

            return Response(
                {
                    "detail": (
                        "This student has already been processed "
                        "in this promotion batch."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Lock source enrollment.
        # --------------------------------------------------------

        enrollment = (
            StudentEnrollment.objects
            .select_for_update()
            .filter(
                student_id=student_id,
                session=batch.from_session,
                is_current=True,
            )
            .first()
        )

        if not enrollment:
            return Response(
                {
                    "detail": (
                        "Current enrollment not found for "
                        "this student in the source session."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # --------------------------------------------------------
        # Graduation means the student has no current enrollment
        # going forward.
        # --------------------------------------------------------

        StudentEnrollment.objects.filter(
            student_id=student_id,
            is_current=True,
        ).update(
            is_current=False,
        )

        # --------------------------------------------------------
        # Record the graduation outcome.
        # --------------------------------------------------------

        PromotionRecord.objects.create(
            batch=batch,
            student_id=student_id,
            from_class_id=enrollment.school_class_id,
            to_class_id=None,
            status="GRADUATED",
        )

        # --------------------------------------------------------
        # IMPORTANT:
        #
        # DO NOT create another StudentHistory row here.
        #
        # The source-session history already exists and is
        # immutable. Graduation is an outcome recorded by
        # PromotionRecord.
        # --------------------------------------------------------

        return Response(
            {
                "message": "Student graduated successfully."
            },
            status=status.HTTP_200_OK,
        )
    
    # ========================================================
    # TRANSFER STUDENT
    # ========================================================

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def transfer_student(self, request, pk=None):

        batch = self._get_batch(pk, lock=True)

        if batch.completed:
            return Response(
                {
                    "detail": (
                        "This promotion batch has already been executed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        student_id = request.data.get("student")
        new_class_id = request.data.get("new_class")

        if not student_id or not new_class_id:
            return Response(
                {
                    "detail": (
                        "student and new_class are required"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Validate target class.
        # --------------------------------------------------------

        target_class = (
            Class.objects
            .select_related("arm")
            .filter(id=new_class_id)
            .first()
        )

        if not target_class:
            return Response(
                {
                    "detail": "Target class does not exist."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # --------------------------------------------------------
        # Prevent duplicate processing.
        # --------------------------------------------------------

        if PromotionRecord.objects.filter(
            batch=batch,
            student_id=student_id,
        ).exists():

            return Response(
                {
                    "detail": (
                        "This student has already been processed "
                        "in this promotion batch."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Lock source enrollment.
        # --------------------------------------------------------
        enrollment = (
            StudentEnrollment.objects
            .select_for_update()
            .filter(
                student_id=student_id,
                session=batch.from_session,
                is_current=True,
            )
            .first()
        )
        
        if not enrollment:
            return Response(
                {
                    "detail": (
                        "Current enrollment not found for "
                        "this student in the source session."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # --------------------------------------------------------
        # Prevent target-session conflict.
        # --------------------------------------------------------

        if StudentEnrollment.objects.filter(
            student_id=student_id,
            session=batch.to_session,
        ).exists():

            return Response(
                {
                    "detail": (
                        "This student already has an enrollment "
                        "in the target session."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # Deactivate old current enrollment.
        # --------------------------------------------------------

        enrollment.is_current = False
        enrollment.save(
            update_fields=["is_current", "updated_at"]
        )

        # --------------------------------------------------------
        # Create target enrollment.
        # --------------------------------------------------------

        target_enrollment = StudentEnrollment.objects.create(
            student_id=student_id,
            session=batch.to_session,
            school_class_id=new_class_id,
            is_current=True,
        )

        # --------------------------------------------------------
        # Promotion record.
        # --------------------------------------------------------

        PromotionRecord.objects.create(
            batch=batch,
            student_id=student_id,
            from_class_id=enrollment.school_class_id,
            to_class_id=new_class_id,
            status="TRANSFERRED",
        )

        # --------------------------------------------------------
        # Immutable target-session history.
        # --------------------------------------------------------

        create_student_history(
            enrollment=target_enrollment,
            status="TRANSFERRED",
        )

        return Response(
            {
                "message": "Student transferred successfully.",
                "target_class": str(target_class),
            },
            status=status.HTTP_200_OK,
        )
  
class StudentHistoryViewSet(viewsets.ModelViewSet):
    queryset = (
        StudentHistory.objects
        .select_related(
            "student",
            "student__user",
            "session",
            "term",
            "school_class",
            "school_class__arm",
            "enrollment",
        )
        .order_by("-recorded_at")
    )

    serializer_class = StudentHistorySerializer

    permission_classes = [IsAuthenticated]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "student",
        "session",
        "term",
        "school_class",
        "status",
    ]

    search_fields = [
        "student__admission_number",

        "student_snapshot__admission_number",
        "student_snapshot__user__username",
        "student_snapshot__user__full_name",

        "session_snapshot__name",

        "class_snapshot__name",
        "class_snapshot__display_name",

        "term_snapshot__name",
    ]

    ordering_fields = [
        "recorded_at",
        "session",
        "term",
        "school_class",
        "status",
    ]

    ordering = [
        "-recorded_at",
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        role = getattr(
            user,
            "role",
            None,
        )

        # ------------------------------------------
        # ADMIN
        # ------------------------------------------

        if (
            user.is_staff
            or user.is_superuser
            or role == "admin"
        ):
            return queryset

        # ------------------------------------------
        # TEACHER
        # ------------------------------------------

        if role == "teacher":

            return queryset.filter(
                school_class__class_teacher__user=user
            )

        # ------------------------------------------
        # STUDENT
        # ------------------------------------------

        if role == "student":

            return queryset.filter(
                student__user=user
            )

        return queryset.none()

    # ==========================================================
    # DISABLE WRITE OPERATIONS
    # ==========================================================

    def create(self, request, *args, **kwargs):

        return Response(
            {
                "detail": (
                    "Student history is created automatically "
                    "when an enrollment is created."
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def update(self, request, *args, **kwargs):

        return Response(
            {
                "detail": (
                    "Student history records are immutable."
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def partial_update(
        self,
        request,
        *args,
        **kwargs,
    ):

        return Response(
            {
                "detail": (
                    "Student history records are immutable."
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def destroy(self, request, *args, **kwargs):

        return Response(
            {
                "detail": (
                    "Student history records cannot be deleted."
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    # ==========================================================
    # STUDENT HISTORY
    # ==========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path=r"student/(?P<student_id>[^/.]+)",
    )
    def student_history(
        self,
        request,
        student_id=None,
    ):

        history = (
            self.get_queryset()
            .filter(
                student_id=student_id
            )
            .order_by(
                "-session__name",
                "-recorded_at",
            )
        )

        serializer = self.get_serializer(
            history,
            many=True,
        )

        return Response(
            {
                "student_id": student_id,
                "count": history.count(),
                "history": serializer.data,
            }
        ) 