from .services.utils.progress_tracker import ProgressTask
from uuid import uuid4
from .tasks import import_students_task
from .permissions import IsAdminUser, IsTeacherOrAdmin
from .models import AcademicSession, Arms, Class, PromotionBatch, PromotionRecord, PromotionRule, SchoolAsset, StudentEnrollment, StudentImport, Teacher, Student, Subject, ClassSubject, Term
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.response import Response
import pandas as pd  
from django.db import transaction   
import traceback
from django.db.models import Count, Exists, OuterRef, Subquery
from results.models import Behaviour 
from django.contrib.auth import get_user_model   
from .serializers import (
    AcademicSessionSerializer,
    ArmSerializer,
    ClassSerializer,
    ClassUpdateSerializer,
    PromotionBatchSerializer,
    PromotionRecordSerializer,
    PromotionRuleSerializer,
    SchoolAssetSerializer,
    SessionTermSerializer,
    StudentEnrollmentSerializer,
    StudentImportSerializer,
    StudentUpdateSerializer,
    TeacherCreateSerializer,
    TeacherSerializer,
    StudentSerializer,
    SubjectSerializer,
    ClassSubjectSerializer,
    StudentCreateSerializer,
    TeacherUpdateSerializer,
    TermSerializer
)
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils.dateparse import parse_date 
from rest_framework import  status, viewsets
from rest_framework.filters import SearchFilter
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .filters import StudentFilter

User = get_user_model()
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 30
    page_query_param = 'page'
    page_size_query_param = 'page_size'
    max_page_size = 1000

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

class TermViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.select_related("session").all().order_by("-id")
    serializer_class = TermSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def active(self, request):
        term = Term.objects.filter(is_active=True).first()

        if not term:
            return Response({"detail": "No active term"}, status=404)

        serializer = self.get_serializer(term)
        return Response(serializer.data)
   

    def get_queryset(self):
        queryset = super().get_queryset()
        session_id = self.request.query_params.get("session")

        # Optional filtering by session
        if session_id:
            queryset = queryset.filter(session_id=session_id)

        return queryset

class AcademicSessionViewSet(viewsets.ModelViewSet):
    queryset = AcademicSession.objects.prefetch_related("terms").order_by("-name")
    serializer_class = AcademicSessionSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def active(self, request):

        session = AcademicSession.objects.filter(
            is_active=True
        ).first()

        if not session:
            return Response(
                {"detail": "No active session"},
                status=404
            )

        serializer = self.get_serializer(session)

        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="active/term")
    def active_terms(self, request):

        term = Term.objects.filter(is_active=True).first()

        if not term:
            return Response(
                {"detail": "No active term"},
                status=404
            )

        serializer = TermSerializer(term)

        return Response(serializer.data)
        # ======================================
        # GET TERMS FOR A SESSION
    # ======================================
    @action(detail=True, methods=["get"])
    def terms(self, request, pk=None):

        session = self.get_object()

        terms = Term.objects.filter(
            session=session
        )

        if not terms.exists():
            return Response(
                {"detail": "No terms found for this session"},
                status=404
            )

        serializer = TermSerializer(
            terms,
            many=True
        )

        return Response({
            "session": session.name,
            "terms_count": terms.count(),
            "terms": serializer.data
        })

    @action(detail=False, methods=["post"], url_path="active/create")
    def session_term(self, request):

        serializer = SessionTermSerializer(
            data=request.data
        )

        if (serializer.is_valid(raise_exception=True)):

            data = serializer.save()

            return Response( {
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
        return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
                )

    @action(detail=False, methods=["post"], url_path="switch-active")
    def switch_active(self, request):
        session_id = request.data.get("session_id")
        term_id = request.data.get("term_id")

        # deactivate all
        AcademicSession.objects.update(is_active=False)
        Term.objects.update(is_active=False)

        # activate selected session
        session = AcademicSession.objects.get(id=session_id)
        session.is_active = True
        session.save()

        # activate selected term
        term = Term.objects.get(id=term_id)
        term.is_active = True
        term.save()

        return Response({
            "message": "Switched successfully",
            "session": AcademicSessionSerializer(session).data,
            "term": TermSerializer(term).data,
        })

# STUDENT VIEWSET
class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related(
            "user",
        ).prefetch_related("enrollments").order_by("-id")
        
    serializer_class = StudentSerializer
    permission_classes = [
        IsAuthenticated
    ]
    parser_classes = [
        MultiPartParser,
        FormParser,
    ]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    
    filterset_class = StudentFilter
    
    search_fields = [
        "admission_number",
        "user__full_name",
        "user__username",
        "user__gender"
    ]
    # =====================================================
    # OPTIMIZED QUERYSET
    # =====================================================
    def get_queryset(self):
        queryset = super().get_queryset()

        user = self.request.user
        user_id = self.request.query_params.get("user")
        role = user.role

        if user_id:
            return queryset.filter(user_id=user_id)
        
        if user.is_staff or user.is_superuser or role == "admin":
            return queryset

        elif role == "teacher":
            queryset = queryset.filter(
                enrollments__is_current=True,
                enrollments__school_class__class_teacher__user=user,
            )

        elif role == "student":
            queryset = queryset.filter(user=user)

        else:
            return queryset.none()

        return queryset.distinct()
    # =====================================================
    # SERIALIZER CONTEXT
    # =====================================================
    def get_serializer_class(self):

        if self.action == "create":
            return StudentCreateSerializer

        elif self.action in ["update", "partial_update"]:
            return StudentUpdateSerializer

        return StudentSerializer

    # =====================================================
    # DYNAMIC PERMISSIONS
    # =====================================================
    def get_permissions(self):

        if self.action in [
            "create",
           
            "destroy",
        ]:
        
            return [IsTeacherOrAdmin()]

        return [IsAuthenticated()]

    def get_serializer_context(self):
        context = super().get_serializer_context()

        context["term_id"] = self.request.query_params.get("term")
        context["session_id"] = self.request.query_params.get("session")

        return context
        # =====================================================
    # CREATE STUDENT
    # =====================================================
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # =========================================
        # VALIDATE INPUT
        # =========================================
        serializer = StudentCreateSerializer(
        data=request.data
    )

        serializer.is_valid(
            raise_exception=True
        )

        student = serializer.save()

        response_serializer = StudentSerializer(
            student,
            context={"request": request},
        )

        return Response(
            {
                "message":
                "Student created successfully",

                "student":
                response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )    # =====================================================
    # UPDATE STUDENT
    # =====================================================
    @transaction.atomic
    def update(self, request, *args, **kwargs):

        student = self.get_object()

        serializer = StudentUpdateSerializer(
            student,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        student = serializer.save()

        response_serializer = StudentSerializer(
            student,
            context={"request": request},
        )

        return Response(
            {
                "message":
                "Student updated successfully",

                "student":
                response_serializer.data,
            },
            status=status.HTTP_200_OK,
        )
    # =====================================================
    # DELETE STUDENT
    # =====================================================
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        student = self.get_object()
        user = student.user
        student.delete()
        user.delete()

        return Response(
            {
                "message":
                "Student deleted successfully"
            },
            status=status.HTTP_204_NO_CONTENT,
        )
       
    @action(
    detail=True,
    methods=["patch"],
    url_path="deactivate"
    )
    @transaction.atomic
    def deactivate(self, request, pk=None):

        student = self.get_object()

        if not student.is_active:
            return Response(
                {
                    "message":
                    "Student is already inactive."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        student.is_active = False
        student.save(update_fields=["is_active"])

        enrollment = StudentEnrollment.objects.filter(
            student=student,
            is_current=True
        )
        enrollment.update(is_current=False)
        
        return Response(
            {
                "message":
                "Student deactivated successfully."
            },
            status=status.HTTP_200_OK
        ) 
    @action(
    detail=True,
    methods=["patch"],
    url_path="reactivate"
)
    @transaction.atomic
    def reactivate(self, request, pk=None):

        student = self.get_object()
        if student.is_active:
            return Response(
                {
                    "message":
                    "Student is already active."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
    #    student will be manually enrolled if reactivated
        student.is_active = True
        student.save(update_fields=["is_active"])
        return Response(
            {
                "message":
                "Student reactivated successfully."
            }
        )
    
class StudentImportViewSet(viewsets.ModelViewSet):
    queryset = StudentImport.objects.all()
    serializer_class = StudentImportSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=["get"], url_path="status")
    def status(self, request):
        task_id = request.query_params.get("task_id")

        if not task_id:
            return Response(
                {"detail": "task_id is required"},
                status=400,
            )

        task_result = StudentImport.objects.filter(task_id=task_id).first()

        if not task_result:
            return Response(
                {"detail": "Task not found."},
                status=404,
            )

        response_data = {
            "task_id": task_result.task_id,
            "state": task_result.status,
            "ready": task_result.status in ("completed", "failed"),
            "created_count": task_result.created_count,
            "skipped_count": task_result.skipped_count,
            "result": task_result.result,
            "error": task_result.error,
        }

        return Response(response_data)  
    
# ==============================
# STUDENT FILE UPLOAD VIEWSET
class StudentFileUploadView(APIView):

    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAdminUser]

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

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

        filename = file_obj.name.lower()

        if not (
            filename.endswith(".csv")
            or filename.endswith(".xlsx")
            or filename.endswith(".xls")
        ):
            return Response(
                {"error": "Unsupported file format"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        task_id = str(uuid4())
        student_import = StudentImport.objects.create(
            file=file_obj,
            status="pending",
            task_id=task_id
        )

        import_students_task(student_import.id)

        student_import.refresh_from_db()

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
        
class ArmsViewSet(viewsets.ModelViewSet):
    queryset = Arms.objects.all()
    serializer_class = ArmSerializer
    permission_classes = [IsTeacherOrAdmin]

# CLASS VIEWSET
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

    permission_classes = [IsTeacherOrAdmin]
    pagination_class = StandardResultsSetPagination
    serializer_class = ClassSerializer

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return ClassUpdateSerializer
        return ClassSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        user_role = user.role
        
        if user.is_staff or user.is_superuser or user_role =="admin":
            return queryset
        
        if user_role == "teacher":
            return queryset.filter(class_teacher__user=user)

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
            .filter(enrollments__school_class=school_class)
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
    
    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """
        Returns all classes together with:
        - student count
        - class teacher
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
                    distinct=True,
                )
            )
            .order_by("name")
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
                    },
                    "description": school_class.description,
                    "is_active": school_class.is_active,
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
                        arm=class_arm
                    ).exists():

                        skipped_classes.append({
                            "row": excel_row,
                            "name": class_name,
                            "error": f"Subject with name {class_name} and code {class_description} already exists",
                        })
                        
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


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.select_related("user").prefetch_related(
        "assigned_classes",
        "assigned_classes__arm",
    )
    permission_classes = [IsTeacherOrAdmin]
    parser_classes = [FormParser, MultiPartParser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user"]

    def get_serializer_class(self):
        if self.action == "create":
            return TeacherCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return TeacherUpdateSerializer
        return TeacherSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_staff or user.is_superuser or user.role == "admin":
            return queryset
        if user.role == "teacher":
            return queryset.filter(user=user)

        if user.role == "student":
            student = Student.objects.select_related(
                "current_enrollment__school_class__class_teacher__user"
            ).filter(user=user).first()

            if student and student.current_enrollment:
                teacher = student.current_enrollment.school_class.class_teacher
                if teacher:
                    return queryset.filter(pk=teacher.pk)

            return queryset.none()

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

# ==============================
# SUBJECT VIEWSET
# ==============================
class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
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
        queryset = super().get_queryset()
        user = self.request.user
        user_role = user.role

        if user.is_staff or user.is_superuser or user_role == "admin" or user_role == "teacher":
            return queryset

        if user_role == "student":
            return queryset.filter(class_subject__school_class=user.student__current_enrollment__school_class).distinct()

        return queryset.none()

    @action(
    detail=False,
    methods=["post"],
    url_path="upload"
    )
    def upload(self, request, pk=None):
        REQUIRED_COLUMNS = [
        "subject_name", "subject_code"]
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

            # =====================================================
            # RESULTS
            # =====================================================
            created_subjects = []
            skipped_subjects = []

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
                    # ==========CLEAN SUBJECT FIELDS =========#
                    subject_name = cleaned_row["subject_name"].strip()

                    subject_code = cleaned_row["subject_code"].strip()
                    # =================================================
                    # VALIDATE SUBJECT NAME
                    # =================================================
                    if not subject_name:
                        skipped_subjects.append({
                            "row": excel_row,
                            "error": "Subject name is required",
                        })
                        continue
                    # =================================================
                    # CHECK EXISTING SUBJECT
                    # =================================================
                    # =================================================
                    # CHECK EXISTING STUDENT
                    # =================================================
                    if Subject.objects.filter(
                        name=subject_name
                    ).exists():

                        skipped_subjects.append({
                            "row": excel_row,
                            "name": subject_name,
                            "error": f"Subject with name {subject_name} and code {subject_code} already exists",
                        })

                        continue
                    # =========== SERIALIZER DATA ========= #
                    
                    serializer_data = {
                        "name": subject_name.upper(),
                        "code": subject_code.upper(),
                       }
                    # # =================================================
                    # SAVE SUBJECT
                    # =================================================
                    with transaction.atomic():

                        serializer = SubjectSerializer(
                            data=serializer_data
                        )

                        if serializer.is_valid():
                            serializer.save()

                            created_subjects.append({
                                "row": excel_row,
                                "subject_name": subject_name,
                                "subject_code": subject_code,
                            })
                        else:
                            skipped_subjects.append({
                                "row": excel_row,
                                "subject_name": subject_name,
                                "error": serializer.errors,
                            })
                            
                except Exception as e:

                    print(traceback.format_exc())

                    skipped_subjects.append({
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

                    "created_count": len(created_subjects),

                    "skipped_count": len(skipped_subjects),

                    "created_subjects": created_subjects,

                    "skipped_subjects": skipped_subjects,
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

class ClassSubjectViewSet(viewsets.ModelViewSet):
    queryset = ClassSubject.objects.select_related(
        "school_class",
        "subject",
    )
    serializer_class = ClassSubjectSerializer
    permission_classes = [IsTeacherOrAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['term', 'school_class', 'subject']
    
    def get_permissions(self):

        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy"
        ]:
            return [IsTeacherOrAdmin()]

        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()

        school_class_id = self.request.query_params.get("school_class")
        term_id = self.request.query_params.get("term")

        if school_class_id:
            queryset = queryset.filter(
                school_class_id=school_class_id
            )

        if term_id:
            queryset = queryset.filter(
                term_id=term_id
            )

        return queryset
    
    @action(detail=False, methods=["post"], url_path="bulk-create")
    def bulk_create(self, request):
        class_id = request.data.get("class_id")
        term_id = request.data.get("term_id")
        subject_ids = request.data.get("subject_ids", [])

        created = []

        for subject_id in subject_ids:
            obj, _ = ClassSubject.objects.get_or_create(
                school_class_id=class_id,
                subject_id=subject_id,
                term_id=term_id,
            )
            created.append(obj.id)

        return Response({"created": created})

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

class StudentEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = StudentEnrollment.objects.select_related(
            "student__user",
            "session",
   
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
        """
        Bulk enroll students into a class/session.

        Rules:
        - A student can have only one enrollment record per session.
        - If an enrollment exists but is_current=False, reactivate it.
        - If an enrollment exists in another class for the same session,
        move the student to the selected class.
        - If no enrollment exists, create one.
        - When enrolling a student as current, ensure Student.is_active=True.
        """

        session_id = request.data.get("session_id")
        school_class_id = request.data.get("school_class_id")
        is_current = bool(request.data.get("is_current", True))
        student_ids = request.data.get("student_ids", [])

        # ==========================
        # VALIDATIONS
        # ==========================

        if not student_ids:
            return Response(
                {"detail": "student_ids is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not session_id or not school_class_id:
            return Response(
                {"detail": "session_id and school_class_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Allow comma-separated string if sent as string
        if isinstance(student_ids, str):
            student_ids = student_ids.split(",")

        try:
            student_ids = [
                int(x) for x in student_ids if str(x).strip().isdigit()
            ]
        except Exception:
            return Response(
                {"detail": "Invalid student_ids format"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not student_ids:
            return Response(
                {"detail": "No valid student IDs supplied"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Remove duplicate student IDs from the request
        student_ids = list(dict.fromkeys(student_ids))

        # ==========================
        # VERIFY SESSION AND CLASS
        # ==========================

        try:
            session = AcademicSession.objects.get(id=session_id)
        except AcademicSession.DoesNotExist:
            return Response(
                {"detail": "Session not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            school_class = Class.objects.get(id=school_class_id)
        except Class.DoesNotExist:
            return Response(
                {"detail": "Class not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ==========================
        # VERIFY STUDENTS
        # ==========================

        students = Student.objects.filter(
            id__in=student_ids
        ).select_related("user")

        existing_student_ids = set(
            students.values_list("id", flat=True)
        )

        missing_student_ids = [
            student_id
            for student_id in student_ids
            if student_id not in existing_student_ids
        ]

        if missing_student_ids:
            return Response(
                {
                    "detail": "Some students were not found.",
                    "student_ids": missing_student_ids,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_enrollments = {
            enrollment.student_id: enrollment
            for enrollment in StudentEnrollment.objects.filter(
                student_id__in=student_ids,
                session_id=session_id,
            )
        }

        created_count = 0
        reactivated_count = 0
        moved_count = 0
        skipped_count = 0

        enrollments_to_create = []
        enrollments_to_update = []

        # ==========================
        # PROCESS STUDENTS
        # ==========================

        for student_id in student_ids:

            existing_enrollment = existing_enrollments.get(student_id)

            # ----------------------------------
            # NO ENROLLMENT FOR THIS SESSION
            # ----------------------------------

            if existing_enrollment is None:
                enrollments_to_create.append(
                    StudentEnrollment(
                        student_id=student_id,
                        session_id=session_id,
                        school_class_id=school_class_id,
                        is_current=is_current,
                    )
                )

                created_count += 1

                continue

            # ----------------------------------
            # ENROLLMENT ALREADY EXISTS
            # ----------------------------------

            if (
                existing_enrollment.school_class_id == school_class_id
                and existing_enrollment.is_current == is_current
            ):
                skipped_count += 1
                continue

            # ----------------------------------
            # EXISTING ENROLLMENT IS INACTIVE
            # ----------------------------------

            if not existing_enrollment.is_current and is_current:
                existing_enrollment.school_class_id = school_class_id
                existing_enrollment.is_current = True

                enrollments_to_update.append(existing_enrollment)

                reactivated_count += 1

                continue

            # ----------------------------------
            # EXISTING CURRENT ENROLLMENT
            # IN ANOTHER CLASS
            # ----------------------------------

            if (
                existing_enrollment.is_current
                and existing_enrollment.school_class_id != school_class_id
                and is_current
            ):
                existing_enrollment.school_class_id = school_class_id
                existing_enrollment.is_current = True

                enrollments_to_update.append(existing_enrollment)

                moved_count += 1

                continue

            # ----------------------------------
            # OTHER CASE
            # ----------------------------------

            existing_enrollment.school_class_id = school_class_id
            existing_enrollment.is_current = is_current

            enrollments_to_update.append(existing_enrollment)

        # ==========================
        # IF ENROLLING AS CURRENT
        # ==========================

        if is_current:
            StudentEnrollment.objects.filter(
                student_id__in=student_ids,
                is_current=True,
            ).exclude(
                session_id=session_id,
            ).update(
                is_current=False
            )

            # Also handle any existing current enrollment
            # in this same session before bulk updating.
            #
            # The selected session enrollment will be
            # updated below.
            StudentEnrollment.objects.filter(
                student_id__in=student_ids,
                session_id=session_id,
                is_current=True,
            ).exclude(
                school_class_id=school_class_id,
            ).update(
                is_current=False
            )

            # Make all selected students active.
            Student.objects.filter(
                id__in=student_ids,
                is_active=False,
            ).update(
                is_active=True
            )

        # ==========================
        # BULK CREATE NEW ENROLLMENTS
        # ==========================

        if enrollments_to_create:
            StudentEnrollment.objects.bulk_create(
                enrollments_to_create
            )

        # ==========================
        # BULK UPDATE EXISTING
        # ==========================

        if enrollments_to_update:
            StudentEnrollment.objects.bulk_update(
                enrollments_to_update,
                [
                    "school_class",
                    "is_current",
                ],
            )

        # ==========================
        # GET FINAL ENROLLMENTS
        # ==========================

        final_enrollments = StudentEnrollment.objects.filter(
            student_id__in=student_ids,
            session_id=session_id,
        )

        final_current_student_ids = set(
            final_enrollments.filter(
                is_current=True
            ).values_list(
                "student_id",
                flat=True,
            )
        )

        enrolled_students = Student.objects.filter(
            id__in=final_current_student_ids
        ).select_related("user")

        # ==========================
        # RESPONSE
        # ==========================

        total_processed = (
            created_count
            + reactivated_count
            + moved_count
        )

        return Response(
            {
                "created": created_count,
                "reactivated": reactivated_count,
                "moved": moved_count,
                "skipped": skipped_count,
                "total_processed": total_processed,
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
                "message": (
                    f"{total_processed} student enrollment(s) "
                    f"processed successfully. "
                    f"{created_count} created, "
                    f"{reactivated_count} reactivated, "
                    f"{moved_count} moved, "
                    f"{skipped_count} skipped."
                ),
            },
            status=status.HTTP_201_CREATED,
        )
       
class PromotionRecordViewSet(viewsets.ModelViewSet):
    queryset = PromotionRecord.objects.select_related(
        "student",
        "from_class",
        "to_class",
        "batch"
    )

    serializer_class = PromotionRecordSerializer
    permission_classes = [IsAdminUser]

class PromotionRuleViewSet(viewsets.ModelViewSet):
    queryset = PromotionRule.objects.select_related(
        "from_class",
        "to_class"
    )

    serializer_class = PromotionRuleSerializer
    permission_classes = [IsAdminUser]

class PromotionBatchViewSet(viewsets.ModelViewSet):
    queryset = PromotionBatch.objects.select_related(
        "from_session",
        "to_session"
    )
    serializer_class = PromotionBatchSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=["post"])
    def execute(self, request, pk=None):

        batch = self.get_object()

        # Prevent double execution
        if batch.completed:
            return Response(
                {"detail": "Promotion already executed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        enrollments = StudentEnrollment.objects.filter(
            session=batch.from_session,
            is_current=True
        ).select_related(
            "student",
            "school_class"
        )

        promoted = 0
        failed = 0

        with transaction.atomic():

            for enrollment in enrollments:

                rule = PromotionRule.objects.filter(
                    from_class=enrollment.school_class,
                    is_active=True
                ).first()

                # No rule found → record failure and skip
                if not rule:
                    PromotionRecord.objects.create(
                        batch=batch,
                        student=enrollment.student,
                        from_class=enrollment.school_class,
                        to_class=None,
                        status="FAILED"
                    )
                    failed += 1
                    continue

                # Deactivate current enrollment
                StudentEnrollment.objects.filter(
                    student=enrollment.student,
                    is_current=True,
                ).update(is_current=False)

                # Create or get next session enrollment
                StudentEnrollment.objects.get_or_create(
                    student=enrollment.student,
                    session=batch.to_session,
                    defaults={
                        "school_class": rule.to_class,
                        "is_current": True,
                    }
                )

                # Log promotion
                PromotionRecord.objects.create(
                    batch=batch,
                    student=enrollment.student,
                    from_class=enrollment.school_class,
                    to_class=rule.to_class,
                    status="PROMOTED"
                )

                promoted += 1

            # Mark batch complete
            batch.completed = True
            batch.save()

        return Response({
            "message": "Promotion execution completed",
            "students_promoted": promoted,
            "students_failed": failed
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def repeat_student(self, request, pk=None):

        batch = self.get_object()

        student_id = request.data.get("student")

        if not student_id:
            return Response(
                {"detail": "student is required"},
                status=400
            )

        try:
            enrollment = StudentEnrollment.objects.get(
                student_id=student_id,
                session=batch.from_session
            )
        except StudentEnrollment.DoesNotExist:
            return Response(
                {"detail": "Enrollment not found"},
                status=404
            )

        StudentEnrollment.objects.filter(student=enrollment.student, is_current=True,).update(is_current=False)

        StudentEnrollment.objects.get_or_create(
            student=enrollment.student,
            session=batch.to_session,
            defaults={
                "school_class": enrollment.school_class,
                "is_current": True,
            }
        )

        PromotionRecord.objects.create(
            batch=batch,
            student=enrollment.student,
            from_class=enrollment.school_class,
            to_class=enrollment.school_class,
            status="REPEATED"
        )

        return Response({
            "message": "Student marked as repeater"
        })
    @action(detail=True, methods=["post"])
    def graduate_student(self, request, pk=None):

        batch = self.get_object()

        student_id = request.data.get("student")

        try:
            enrollment = StudentEnrollment.objects.get(
                student_id=student_id,
                session=batch.from_session
            )

        except StudentEnrollment.DoesNotExist:
            return Response(
                {"detail": "Enrollment not found"},
                status=404
            )

        PromotionRecord.objects.create(
            batch=batch,
            student=enrollment.student,
            from_class=enrollment.school_class,
            to_class=None,
            status="GRADUATED"
        )

        return Response({
            "message": "Student graduated successfully"
        })
        
    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):

        batch = self.get_object()

        enrollments = StudentEnrollment.objects.filter(
            session=batch.from_session
        ).select_related(
            "school_class"
        )

        preview_data = []

        total = 0

        rules = PromotionRule.objects.select_related(
            "from_class",
            "to_class"
        )

        for rule in rules:

            count = enrollments.filter(
                school_class=rule.from_class
            ).count()

            total += count

            preview_data.append({
                "from_class": str(rule.from_class),
                "to_class": str(rule.to_class),
                "students": count
            })

        return Response({
            "total_students": total,
            "promotions": preview_data
        })
    
    @action(detail=True, methods=["post"])
    def transfer_student(self, request, pk=None):

        batch = self.get_object()

        student_id = request.data.get("student")
        new_class_id = request.data.get("new_class")

        if not student_id or not new_class_id:
            return Response(
                {"detail": "student and new_class required"},
                status=400
            )

        try:
            enrollment = StudentEnrollment.objects.get(
                student_id=student_id,
                session=batch.from_session
            )

        except StudentEnrollment.DoesNotExist:
            return Response(
                {"detail": "Enrollment not found"},
                status=404
            )

        StudentEnrollment.objects.update_or_create(
            student=enrollment.student,
            session=batch.to_session,
            defaults={
                "school_class_id": new_class_id
            }
        )

        PromotionRecord.objects.create(
            batch=batch,
            student=enrollment.student,
            from_class=enrollment.school_class,
            to_class_id=new_class_id,
            status="TRANSFERRED"
        )

        StudentEnrollment.objects.filter(
            student=enrollment.student,
            is_current=True,).update(is_current=False)

        StudentEnrollment.objects.update_or_create(
            student=enrollment.student,
            session=batch.to_session,
            defaults={
                "school_class_id": new_class_id,
                "is_current": True,
            }
        )

        return Response({
            "message": "Student transferred successfully"
        })
    
    @action(detail=True, methods=["get"])
    def students(self, request, pk=None):

        batch = self.get_object()

        enrollments = StudentEnrollment.objects.filter(
            session=batch.from_session
        ).select_related(
            "student__user",
            "school_class"
        )

        data = []

        for enrollment in enrollments:

            data.append({
                "student_id": enrollment.student.id,
                "name": enrollment.student.user.full_name,
                "current_class": str(enrollment.school_class),
            })

        return Response(data)
