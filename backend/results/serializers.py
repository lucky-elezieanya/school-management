from rest_framework import serializers
from .models import (Attendance, Behaviour, ClassFees, GradingScale, MaxScores, Result, ResultPDF, ResultSummary, ResultWorkflow, SchoolDays, StudentResultSnapshot, TermComment, SubjectResultStatus, ResumptionDate,  ActivateResultPortal, SubjectSummary, ClassTeacherSignature,
    HeadTeacherSignature,)
from academics.models import (Student, 
                              Class, 
                              AcademicSession, 
                              Term, 
                              ClassSubject 
                              )
from academics.serializers import (
    ClassSerializer, 
    StudentSerializer,
    AcademicSessionSerializer,
    TermSerializer,
    ClassSubjectSerializer
)
from django.db import transaction
from .utils.signature import process_signature
from rest_framework import serializers
from .models import ResultCustomization


class StudentResultSnapshotSerializer(serializers.ModelSerializer):

    class Meta:
        model = StudentResultSnapshot

        fields = (
            "id",
            "student",
            "school_class",
            "session",
            "term",
            "status",
            "data",
            "version",
            "computed_at",
        )

        read_only_fields = fields

class ResultCustomizationSerializer(serializers.ModelSerializer):
    session = AcademicSessionSerializer(read_only=True)
    session_id = serializers.PrimaryKeyRelatedField(
        queryset=AcademicSession.objects.all(),
        source="session",
        write_only=True
    )
    term = TermSerializer(read_only=True)
    term_id = serializers.PrimaryKeyRelatedField(
        queryset=Term.objects.all(),
        source="term",
        write_only=True
    )
    school_class = ClassSerializer(read_only=True)
    school_class_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        required=False,
        
        source="school_class",
        queryset=Class.objects.all()
    )
    
    class Meta:
        model = ResultCustomization
        fields = [
            "id",
            "session",
            "session_id",           
            "term",
            "term_id",
            "school_class",
            "school_class_id",
            "subject_average",
            "class_average",
            "subject_position",
            "class_size",
            "subject_score",
            "cumulative_average",
            "class_position",
            "highest_lowest_scores",
            "overall_grade",
            "show_teacher_comment",
            "show_principal_comment",
            "show_behaviour",
            "show_attendance",
            "show_school_days",
            "show_class_fees",
            "show_grading_scale",
            "show_performance_chart",
            "test_scores",
            "created_at",
            "updated_at",
        ]

        read_only_fields = (
            "id",
          
            "created_at",
            "updated_at",
        )

class ResultPDFSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResultPDF
        fields = "__all__"

class SchoolDaysSerializer(serializers.ModelSerializer):
    session = AcademicSessionSerializer(read_only=True)
    session_id = serializers.PrimaryKeyRelatedField(
        queryset=AcademicSession.objects.all(),
        source="session",
        write_only=True
    )
    term = TermSerializer(read_only=True)
    term_id = serializers.PrimaryKeyRelatedField(
        queryset=Term.objects.all(),
        source="term",
        write_only=True
    )
    class Meta:
        model = SchoolDays
        fields = [
            "id",
            "session",
            "session_id",
            "term",
            "term_id",
            "days_school_opened"
                  ]

class ClassTeacherSignatureSerializer(serializers.ModelSerializer):

    class Meta:
        model = ClassTeacherSignature
        fields = "__all__"

    def _process_signature(self, validated_data):
        signature = validated_data.get("signature")

        if signature:
            validated_data["signature"] = process_signature(signature)

        return validated_data

    @transaction.atomic
    def create(self, validated_data):
        school_class = validated_data["school_class"]

        # deactivate existing active signatures
        ClassTeacherSignature.objects.filter(
            school_class=school_class,
            is_active=True
        ).update(is_active=False)

        validated_data = self._process_signature(validated_data)
        validated_data["is_active"] = True

        instance = super().create(validated_data)

        # 🔥 FORCE SAVE ensures file is written to storage properly
        instance.save()

        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        validated_data = self._process_signature(validated_data)

        make_active = validated_data.get("is_active", instance.is_active)

        if make_active:
            ClassTeacherSignature.objects.filter(
                school_class=instance.school_class,
                is_active=True
            ).exclude(pk=instance.pk).update(is_active=False)

        instance = super().update(instance, validated_data)

        # 🔥 ENSURE FILE EXISTS IN STORAGE
        instance.save()

        return instance

class HeadTeacherSignatureSerializer(serializers.ModelSerializer):

    class Meta:
        model = HeadTeacherSignature
        fields = "__all__"

    def _process_signature(self, validated_data):
        signature = validated_data.get("signature")

        if signature:
            validated_data["signature"] = process_signature(signature)

        return validated_data

    @transaction.atomic
    def create(self, validated_data):
        # deactivate all active signatures
        HeadTeacherSignature.objects.filter(
            is_active=True
        ).update(is_active=False)

        validated_data = self._process_signature(validated_data)
        validated_data["is_active"] = True

        instance = super().create(validated_data)
        instance.save()
        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        validated_data = self._process_signature(validated_data)

        make_active = validated_data.get(
            "is_active",
            instance.is_active,
        )

        if make_active:
            HeadTeacherSignature.objects.filter(
                is_active=True,
            ).exclude(
                pk=instance.pk,
            ).update(is_active=False)

        instance =  super().update(instance, validated_data) 
        instance.save()
        return instance
    
class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.user.full_name",
        read_only=True
    )

    student = StudentSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        source="student",
        write_only=True
    )

    school_class = ClassSerializer(read_only=True)
    school_class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        source="school_class",
        write_only=True
    )

    term = TermSerializer(read_only=True)
    term_id = serializers.PrimaryKeyRelatedField(
        queryset=Term.objects.all(),
        source="term",
        write_only=True
    )
    session = AcademicSessionSerializer(read_only=True)
    session_id = serializers.PrimaryKeyRelatedField(
        queryset=AcademicSession.objects.all(),
        source="session",
        write_only=True
    )

    class_name = serializers.CharField(
        source="student.current_class.name",
        read_only=True
    )

    term_name = serializers.CharField(
        source="term.name",
        read_only=True
    )

    session_name = serializers.CharField(
        source="session.name",
        read_only=True
    )

    class Meta:
        model = Attendance
        fields = [
            "id",
            "attendance",

            "student",
            "student_id",
            "student_name",

            "school_class",
            "school_class_id",

            "term",
            "term_id",
            "session",
            "session_id",

            "term_name",
            "session_name",
            "class_name",

            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        student = attrs.get(
            "student",
            self.instance.student if self.instance else None,
        )

        school_class = attrs.get(
            "school_class",
            self.instance.school_class if self.instance else None,
        )

        term = attrs.get(
            "term",
            self.instance.term if self.instance else None,
        )

        session = attrs.get(
            "session",
            self.instance.session if self.instance else None,
        )

        qs = Attendance.objects.filter(
            student=student,
            school_class=school_class,
            term=term,
            session=session,
        )

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                "Attendance already exists for this student."
            )

        return attrs  
class MaxScoresSerializer(serializers.ModelSerializer):
    school_class = ClassSerializer(read_only=True)
    school_class_id = serializers.PrimaryKeyRelatedField(
        source="school_class",
        write_only=True,
        queryset=Class.objects.all()
    )
    class Meta:
        model = MaxScores
        fields = ["id", "first_test", "second_test", "exam", "school_class", "school_class_id"]

class BehaviourSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.user.full_name",
        read_only=True
    )

    class_name = serializers.CharField(
        source="student.current_class.name",
        read_only=True
    )

    term_name = serializers.CharField(
        source="term.name",
        read_only=True
    )

    session_name = serializers.CharField(
        source="session.name",
        read_only=True
    )
    school_class = ClassSerializer(read_only=True)
    school_class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        write_only=True,
        source="school_class"
    )

    class Meta:
        model = Behaviour
        fields = [
            "id",

            "skills",
            "politeness",
            "neatness",
            "self_control",
            "relationship",
            "attendance",
            "punctuality",
            "leadership",
            "school_class",
            "school_class_id",
            "student",
            "student_name",
            "class_name",

            "term",
            "term_name",

            "session",
            "session_name",

            "created_at",
            "updated_at",
        ]

    def validate(self, data):
        return data

class GradingScaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradingScale
        fields = [
            "id",
            "grade",
            "grading_type",
            "upper_limit",
            "lower_limit",
            "remark",
        ]

    def validate(self, attrs):
        lower = attrs["lower_limit"]
        upper = attrs["upper_limit"]
        grading_type = attrs["grading_type"]

        if lower > upper:
            raise serializers.ValidationError({"message":
                "Lower limit cannot be greater than upper limit."
            })

        overlap = GradingScale.objects.filter(
            grading_type=grading_type,
            lower_limit__lte=upper,
            upper_limit__gte=lower,
        )

        if self.instance:
            overlap = overlap.exclude(pk=self.instance.pk)

        if overlap.exists():
            raise serializers.ValidationError(
                {"message": "This grading range overlaps with an existing grading scale."}
            )

        return attrs
      
class ClassFeeSerializer(serializers.ModelSerializer):
    session = AcademicSessionSerializer(read_only=True)
    session_id = serializers.PrimaryKeyRelatedField(
        source="session",
        queryset=AcademicSession.objects.all(),
        write_only=True
    )
    term = TermSerializer(read_only=True)
    term_id = serializers.PrimaryKeyRelatedField(source="term", write_only=True, queryset=Term.objects.all())
    school_class = ClassSerializer(read_only=True)
    school_class_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        queryset=Class.objects.all(),
        source="school_class"
    )

    class Meta:
        model = ClassFees
        fields = [
            "id",
            "school_class",
            "school_class_id",
            "session_id",
            "session",
            "term",
            "term_id",
            "amount",
        ]

    def validate(self, data):
        """
        Prevent duplicate fee entries per class/session/term
        (safe for both create and update)
        """

        school_class = data.get("school_class")
        session = data.get("session")
        term = data.get("term")

        if not school_class or not session or not term:
            return data

        queryset = ClassFees.objects.filter(
            school_class=school_class,
            session=session,
            term=term
        )

        # 🔥 IMPORTANT: exclude current instance on update
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError({
                "non_field_errors": [
                    "Fee already exists for this class, session, and term."
                ]
            })

        return data

# ==============================
# RESULT SERIALIZER
class ResultSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        source='student',
        write_only=True
    )

    term = TermSerializer(read_only=True)
    term_id = serializers.PrimaryKeyRelatedField(
        queryset=Term.objects.all(),
        source='term',
        write_only=True
    )
    session = AcademicSessionSerializer(read_only=True)
    session_id = serializers.PrimaryKeyRelatedField(
        queryset=AcademicSession.objects.all(),
        source='session',
        write_only=True
    )
    class_subject = ClassSubjectSerializer(read_only=True)
    class_subject_id = serializers.PrimaryKeyRelatedField(
        queryset=ClassSubject.objects.all(),
        source='class_subject',
        write_only=True
    )

    class Meta:
        model = Result
        fields = [
            "id",
            "student",
            "student_id",
            "class_subject",
            "class_subject_id",
            "term",
            "term_id",
            "session",
            "session_id",
            "first_test",
            "second_test",
            "exam_score",
            "total_score",
            "grade",
            "remark"
        ]
        read_only_fields = ["total_score", "grade"]
# ==============================
# RESULT SUMMARY SERIALIZER
# ==============================
class ResultSummarySerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        source='student',
        write_only=True
    )

    school_class = ClassSerializer(read_only=True)
    school_class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        source='school_class',
        write_only=True
    )

    class Meta:
        model = ResultSummary
        fields = [
            "id",
            "student",
            "student_id",
            "school_class",
            "school_class_id",
            "term",
            "session",
            "total_score",
            "average_score",
            "position",
            "total_subjects",
            "class_average"
        ]
        read_only_fields = ["total_score", "average_score", "position", "total_subjects"]

# ==============================
# TERM COMMENT SERIALIZER
# ==============================
class TermCommentSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        source='student',
        write_only=True
    )

    school_class = ClassSerializer(read_only=True)
    school_class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        source='school_class',
        write_only=True
    )
    term = TermSerializer(read_only=True)
    term_id = serializers.PrimaryKeyRelatedField(
        source="term", write_only=True, 
        queryset=Term.objects.all()
        )
    session = AcademicSessionSerializer(read_only=True)
    session_id = serializers.PrimaryKeyRelatedField(
        source="session", write_only=True, 
        queryset=AcademicSession.objects.all()
        )
    class Meta:
        model = TermComment
        fields = [
            "id",
            "student",
            "student_id",
            "class_teacher_comment",
            "principal_comment",
            "school_class",
            "school_class_id",
            "term",
            "term_id", "session_id",
            "session","created_at", 
            "updated_at"
        ]

class SubjectResultStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubjectResultStatus
        fields = "__all__"

class ResultWorkflowSerializer(serializers.ModelSerializer):

    school_class = ClassSerializer(
        read_only=True
    )

    school_class_id = serializers.PrimaryKeyRelatedField(
        source="school_class",
        queryset=Class.objects.all(),
        write_only=True,
    )

    session = AcademicSessionSerializer(
        read_only=True
    )

    session_id = serializers.PrimaryKeyRelatedField(
        source="session",
        queryset=AcademicSession.objects.all(),
        write_only=True,
    )

    term = TermSerializer(
        read_only=True
    )

    term_id = serializers.PrimaryKeyRelatedField(
        source="term",
        queryset=Term.objects.all(),
        write_only=True,
    )

    approved_by_name = serializers.CharField(
        source="approved_by.full_name",
        read_only=True,
    )

    released_by_name = serializers.CharField(
        source="released_by.full_name",
        read_only=True,
    )

    class Meta:
        model = ResultWorkflow

        fields = [
            "id",

            "school_class",
            "school_class_id",

            "term",
            "term_id",

            "session",
            "session_id",

            "status",

            "all_results_submitted",

            "approved_by",
            "approved_by_name",
            "approved_at",

            "released_by",
            "released_by_name",
            "released_at",
        ]

        read_only_fields = [
            "approved_by",
            "approved_at",
            "released_by",
            "released_at",
        ]
class ResumptionDateSerializer(serializers.ModelSerializer):
    current_session = AcademicSessionSerializer(read_only=True)
    next_session = AcademicSessionSerializer(read_only=True)
    current_term = TermSerializer(read_only=True)
    next_term = TermSerializer(read_only=True)
    current_term_id = serializers.PrimaryKeyRelatedField(
        source="current_term",
        queryset=Term.objects.all(),
        write_only=True
    )
    next_term_id = serializers.PrimaryKeyRelatedField(
        source="next_term",
        queryset=Term.objects.all(),
        write_only=True
    )
    current_session_id = serializers.PrimaryKeyRelatedField(
        source="current_session",
        queryset=AcademicSession.objects.all(),
        write_only=True
    )
    next_session_id = serializers.PrimaryKeyRelatedField(
        source="next_session",
        queryset=AcademicSession.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    class Meta:
        model = ResumptionDate
        fields = [
            "id",
            "resumption_date",
            "current_term",
            "current_term_id",
            "next_term",
            "next_term_id",
            "current_session",
            "current_session_id",
            "next_session",
            "next_session_id"
            ]        
class ActivateResultPortalSerializer(serializers.ModelSerializer):

    term = TermSerializer(read_only=True)
    session = AcademicSessionSerializer(read_only=True)

    term_id = serializers.PrimaryKeyRelatedField(
        source="term",
        queryset=Term.objects.all(),
        write_only=True
    )

    session_id = serializers.PrimaryKeyRelatedField(
        source="session",
        queryset=AcademicSession.objects.all(),
        write_only=True
    )

    class Meta:
        model = ActivateResultPortal
        fields = [
            "id",
            "open",
            "term",
            "session",
            "term_id",
            "session_id",
            "opened_at",
        ]

    # =========================
    # VALIDATION
    # =========================
    def validate(self, attrs):
        term = attrs.get("term")
        session = attrs.get("session")

        if term and session and term.session_id != session.id:
            raise serializers.ValidationError({
                "term_id": "Selected term does not belong to selected session."
            })

        return attrs

    # =========================
    # CREATE (UPSERT BY TERM)
    # =========================
    def create(self, validated_data):
        term = validated_data["term"]

        # 🔥 ensure only one open globally
        if validated_data.get("open"):
            ActivateResultPortal.objects.update(open=False)

        # 🔥 UPSERT (no duplicates per term)
        instance, _ = ActivateResultPortal.objects.update_or_create(
            term=term,
            defaults=validated_data
        )

        return instance

    # =========================
    # UPDATE
    # =========================
    def update(self, instance, validated_data):

        # 🔥 only one open portal at a time
        if validated_data.get("open"):
            ActivateResultPortal.objects.exclude(
                id=instance.id
            ).update(open=False)

        return super().update(instance, validated_data)
     
class SubjectSummarySerializer(
    serializers.ModelSerializer
):
    student_name = serializers.CharField(
        source="student.user.full_name",
        read_only=True,
    )

    admission_number = serializers.CharField(
        source="student.admission_number",
        read_only=True,
    )

    subject_name = serializers.CharField(
        source="class_subject.subject.name",
        read_only=True,
    )

    class_name = serializers.CharField(
        source="class_subject.school_class.__str__",
        read_only=True,
    )

    class Meta:
        model = SubjectSummary

        fields = [
            "id",

            "student",
            "student_name",
            "admission_number",

            "class_subject",
            "subject_name",
            "class_name",

            "term",
            "session",

            "score",
            "subject_average",
            "subject_position",
            "class_size",
        ]