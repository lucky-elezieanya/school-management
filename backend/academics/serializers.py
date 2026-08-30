
from rest_framework import serializers
from .models import Arms, Class, PromotionBatch, PromotionRecord, PromotionRule, SchoolAsset, StudentEnrollment, StudentImport, Teacher, Student, Subject, ClassSubject, Term, AcademicSession
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueTogetherValidator
from django.db import transaction

User = get_user_model()
   
class SchoolAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolAsset
        fields = "__all__"

    def create(self, validated_data):
        asset_type = validated_data.get("asset_type")

        # Ensure only one active per type
        SchoolAsset.objects.filter(
            asset_type=asset_type,
            is_active=True
        ).update(is_active=False)

        validated_data.setdefault("is_active", True)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # If activating this one, deactivate others
        if validated_data.get("is_active") is True:
            SchoolAsset.objects.filter(
                asset_type=instance.asset_type,
                is_active=True
            ).exclude(id=instance.id).update(is_active=False)

        return super().update(instance, validated_data)
    
class AcademicSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSession
        fields = ["id", "name", "is_active"]

class TermSerializer(serializers.ModelSerializer):
    session = AcademicSessionSerializer(read_only=True)
    session_id = serializers.PrimaryKeyRelatedField(
        queryset=AcademicSession.objects.all(),
        source="session",
        write_only=True,
    )
    class Meta:
        model = Term
        fields = ["id", "name", "is_active", "session", "session_id"]

class SessionTermSerializer(serializers.Serializer):

    session = serializers.CharField()
    term = serializers.CharField()
    is_active = serializers.BooleanField(default=False)

    def validate(self, attrs):

        session_name = attrs["session"].strip().upper()
        term_name = attrs["term"].strip()

        attrs["session"] = session_name
        attrs["term"] = term_name

        return attrs

    def create(self, validated_data):

        session_name = validated_data["session"]
        term_name = validated_data["term"]
        is_active = validated_data["is_active"]

        # ==========================================
        # CREATE OR GET SESSION
        # ==========================================
        session, created = AcademicSession.objects.get_or_create(
            name=session_name        )

        # ==========================================
        # HANDLE ACTIVE SESSION
        # ==========================================
        if is_active:

            AcademicSession.objects.exclude(
                id=session.id
            ).update(is_active=False)

            session.is_active = True
            session.save()

        # ==========================================
        # CREATE OR GET TERM
        # ==========================================
        term, term_created = Term.objects.get_or_create(
            name=term_name,
            session=session,
        )

        # ==========================================
        # HANDLE ACTIVE TERM
        # ==========================================
        if is_active:

            Term.objects.exclude(
                id=term.id
            ).update(is_active=False)

            term.is_active = True
            term.save()

        return {
            "session": session,
            "term": term,
            "created": created,
            "term_created": term_created,
        }
# ==============================
# USER SERIALIZER
# ==============================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username",
            "email",
            "first_name",
            "middle_name",
            "last_name",
            "full_name",
            "role",
            "gender",
            "date_of_birth",
            "age",
            "profile_picture",]

class ArmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Arms
        fields = ["id", "name", "code"]


class AssignedClassSerializer(serializers.ModelSerializer):
    arm = ArmSerializer(read_only=True)
    class Meta:
        model = Class
        fields = ["id", "name", "arm", "description"]
# ==============================
# TEACHER SERIALIZER
# ==============================
class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True
    )
    assigned_classes = AssignedClassSerializer(read_only=True, many=True)

    class Meta:
        model = Teacher
        fields = ["id", "user", "user_id", "address", "qualification", "date_employed", "assigned_classes", "phone_number"]

# CLASS SERIALIZER
# ==============================
class ClassSerializer(serializers.ModelSerializer):
    class_teacher = TeacherSerializer(read_only=True)

    class_teacher_id = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(),
        source="class_teacher",
        write_only=True,
        required=False,
        allow_null=True,
    )

    arm = ArmSerializer(read_only=True)

    arm_id = serializers.PrimaryKeyRelatedField(
        queryset=Arms.objects.all(),
        source="arm",
        write_only=True,
        required=True,
    )

    class Meta:
        model = Class
        fields = [
            "id",
            "name",
            "arm",
            "arm_id",
            "class_teacher",
            "class_teacher_id",
            "description",
        ]

    def validate(self, attrs):
        name = attrs.get("name")
        arm = attrs.get("arm")

        queryset = Class.objects.filter(
            name__iexact=name,
            arm=arm,
        )

        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)

        if queryset.exists():
            raise serializers.ValidationError({
                "name": "This class already exists for this arm."
            })

        return attrs

# CLASS UPDATE SERIALIZER
# ==============================
class ClassUpdateSerializer(serializers.ModelSerializer):

    class_teacher = TeacherSerializer(read_only=True)

    class_teacher_id = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(),
        source="class_teacher",
        required=False,
        allow_null=True,
        write_only=True
    )

    arm = ArmSerializer(read_only=True)

    # allow existing ID OR new arm string
    arm_id = serializers.CharField(
        write_only=True,
        required=True,
    )
    class Meta:
        model = Class
        fields = [
            "name",
            "arm",
            "arm_id",
            "description",
            "class_teacher",
            "class_teacher_id",
        ]

    # ==========================================
    # VALIDATE
    # ==========================================
    def validate(self, attrs):

        class_name = attrs.get("name")

        arm_input = self.initial_data.get("arm_id")

        if not arm_input:
            raise serializers.ValidationError({
                "arm_id": ["Arm is required."]
            })

        arm_obj = None

        # Existing arm selected
        if str(arm_input).isdigit():

            arm_obj = Arms.objects.filter(
                id=arm_input
            ).first()

        # Manual arm entered
        else:

            arm_obj = Arms.objects.filter(
                name__iexact=arm_input.strip()
            ).first()

        # Prevent duplicate class-arm combination
        if arm_obj:

            existing_class = Class.objects.filter(
                name__iexact=class_name.strip(),
                arm=arm_obj
            ).exclude(id=self.instance.id).first()

            if existing_class:
                raise serializers.ValidationError({
                    "name": [
                        f"{class_name} {arm_obj.name} already exists."
                    ]
                })

        return attrs

    # ==========================================
    # UPDATE
    # ==========================================
    def update(self, instance, validated_data):

        arm_input = self.initial_data.get("arm_id")

        arm_obj = None

        # Existing arm selected
        if str(arm_input).isdigit():

            arm_obj = Arms.objects.filter(
                id=arm_input
            ).first()

        # Manual arm typed
        else:

            arm_obj, _ = Arms.objects.get_or_create(
                name=arm_input.strip().upper()
            )

        instance.name = validated_data.get(
            "name",
            instance.name
        )

        instance.description = validated_data.get(
            "description",
            instance.description
        )

        instance.class_teacher = validated_data.get(
            "class_teacher",
            instance.class_teacher
        )

        instance.arm = arm_obj

        instance.save()

        return instance
    
class TeacherCreateSerializer(serializers.ModelSerializer):
    # User fields
    first_name = serializers.CharField(write_only=True)
    middle_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True)
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    gender = serializers.CharField(write_only=True)
    date_of_birth = serializers.DateField(write_only=True, required=False)
    date_employed = serializers.DateField(write_only=True, required=False)
    profile_picture = serializers.ImageField(write_only=True, required=False, allow_null=True)

    assigned_classes = serializers.PrimaryKeyRelatedField(
    queryset=Class.objects.all(),
    many=True,
    write_only=True,
    required=False,
    )

    class Meta:
        model = Teacher
        fields = [
            "id",
            # user fields
            "first_name",
            "middle_name",
            "last_name",
            "username",
            "email",
            "password",
            "gender",
            "date_of_birth",
            "profile_picture",
            # teacher fields
            "address",
            "qualification",
            "date_employed",
            "phone_number",
            # classes
            "assigned_classes",
        ]
 
    def create(self, validated_data):
        # Get actual Class objects
        assigned_classes = validated_data.pop(
            "assigned_classes",
            []
        )
        # Extract user fields
        user_data = {
            "first_name": validated_data.pop("first_name"),
            "middle_name": validated_data.pop("middle_name", None),
            "last_name": validated_data.pop("last_name"),
            "username": validated_data.pop("username"),
            "email": validated_data.pop("email", ""),
            "gender": validated_data.pop("gender"),
            "date_of_birth": validated_data.pop("date_of_birth", None),
            "profile_picture": validated_data.pop("profile_picture", None),
            "role": "teacher",
        }

        password = validated_data.pop("password")

        # Create user
        user = User.objects.create(**user_data)
        user.set_password(password)
        user.save()

        # Create teacher
        teacher = Teacher.objects.create(
            user=user,
            **validated_data
        )

        if assigned_classes:
            teacher.assigned_classes.set(assigned_classes)

        return teacher # TEACHER UPDATE SERIALIZER

class TeacherUpdateSerializer(serializers.ModelSerializer):
    # Allow passing an array of Class IDs
    assigned_classes = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        many=True,
        required=False
    )
    # Include nested user fields update if needed
    first_name = serializers.CharField(source="user.first_name", required=False)
    last_name = serializers.CharField(source="user.last_name", required=False)
    middle_name = serializers.CharField(source="user.middle_name", required=False)
    username = serializers.CharField(source="user.username", required=False)
    email = serializers.EmailField(source="user.email", required=False)
    gender = serializers.CharField(source="user.gender", required=False)
    date_of_birth = serializers.DateField(source="user.date_of_birth", required=False)

    class Meta:
        model = Teacher
        fields = [
            "id",
            "address",
            "qualification",
            "date_employed",
            "phone_number",
            "assigned_classes",
            "first_name",
            "last_name",
            "middle_name",
            "username",
            "email",
            "gender",
            "date_of_birth",
        ]

    def update(self, instance, validated_data):
        # Extract user data if present
        user_data = validated_data.pop("user", {})
        
        # Extract assigned_classes
        assigned_classes = validated_data.pop("assigned_classes", None)

        # Update Teacher fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update User fields
        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()

        # Update assigned_classes (Class.class_teacher relationship)
        if assigned_classes is not None:
            # Check user permission to ensure non-admins cannot change assigned classes
            request = self.context.get("request")
            if request and (request.user.is_staff or request.user.is_superuser or request.user.role == "admin"):
                # Remove this teacher from previously assigned classes
                Class.objects.filter(class_teacher=instance).update(class_teacher=None)
                # Assign to new classes
                Class.objects.filter(id__in=[c.id for c in assigned_classes]).update(class_teacher=instance)

        return instance

class StudentImportSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentImport
        fields = "__all__"

class StudentEnrollmentSerializer(serializers.ModelSerializer):
    session = AcademicSessionSerializer(read_only=True)
    session_id = serializers.PrimaryKeyRelatedField(
        source='session',
        write_only=True,
        queryset=AcademicSession.objects.all()
    )
    school_class = ClassSerializer(read_only=True)
    school_class_id = serializers.PrimaryKeyRelatedField(
        source='school_class',
        write_only=True,
        queryset=Class.objects.all()
    )
    student_name = serializers.CharField(
        read_only=True,
        source="student.user.full_name"
    )
    profile_picture = serializers.SerializerMethodField()
    admission_number = serializers.CharField(
        read_only=True,
        source="student.admission_number"
    )
    is_active = serializers.BooleanField(
        read_only=True,
        source="student.is_active"
    )

    class Meta:
        model = StudentEnrollment
        fields = [
            "id",
            "student",
            "student_name",
            "profile_picture",
            "is_current",
            "admission_number",
            "is_active",
            "session",
            "session_id",
            "school_class",
            "school_class_id",
            "enrolled_at",
        ]
        
    def get_profile_picture(self, obj):
        request = self.context.get("request")

        picture = obj.student.user.profile_picture

        if not picture:
            return None

        if request:
            return request.build_absolute_uri(picture.url)

        return picture.url

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    current_enrollment = StudentEnrollmentSerializer(
        read_only=True
    )
    behaviour_exists = serializers.BooleanField(
        read_only=True
    )
    behaviour_id = serializers.IntegerField(
        read_only=True
    )

    class Meta:
        model = Student

        fields = [
            "id",
            "user",
            "admission_number",
            "is_active",
            "parent_first_name",
            "parent_last_name",
            "parent_email",
            "parent_phone",
            "parent_address",
            "date_admitted",
            "current_enrollment",
            "behaviour_exists",
            "behaviour_id",
        ]


class StudentCreateSerializer(serializers.Serializer):

    # ======================
    # USER
    # ======================

    first_name = serializers.CharField(write_only=True)

    middle_name = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        write_only=True
    )

    last_name = serializers.CharField(write_only=True)

    username = serializers.CharField(write_only=True)

    password = serializers.CharField(
        write_only=True
    )

    gender = serializers.CharField(write_only=True)

    date_of_birth = serializers.DateField(
        required=False
    )

    profile_picture = serializers.ImageField(
        required=False,
        allow_null=True
    )

    # ======================
    # CLASS
    # ======================
    class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        write_only=True
    )

    # ======================
    # STUDENT
    # ======================

    admission_number = serializers.CharField()

    parent_first_name = serializers.CharField()

    parent_last_name = serializers.CharField()

    parent_email = serializers.EmailField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    parent_phone = serializers.CharField()

    parent_address = serializers.CharField()

    def validate_username(self, value):

        if User.objects.filter(
            username=value
        ).exists():

            raise serializers.ValidationError(
                "Username already exists"
            )

        return value

    def validate_admission_number(self, value):

        if Student.objects.filter(
            admission_number=value
        ).exists():

            raise serializers.ValidationError(
                "Admission number already exists"
            )

        return value

    @transaction.atomic
    def create(self, validated_data):
        school_class = validated_data.pop("class_id")  # ✅ FIXED
        password = validated_data.pop("password")
        admission_number = validated_data.pop("admission_number")
        parent_first_name = validated_data.pop("parent_first_name")
        parent_last_name = validated_data.pop("parent_last_name")
        parent_email = validated_data.pop("parent_email", "")
        parent_phone = validated_data.pop("parent_phone")
        parent_address = validated_data.pop("parent_address")

        active_session = AcademicSession.objects.filter(is_active=True).first()

        if not active_session:
            raise serializers.ValidationError(
                "No active academic session found."
            )

        # ✅ USER FIELDS ONLY
        user = User.objects.create(
            **validated_data,
            role="student",
        )
        user.set_password(password)
        user.save()

        # ✅ STUDENT DATA ONLY
        student = Student.objects.create(
            user=user,
            admission_number=admission_number,
            parent_first_name=parent_first_name,
            parent_last_name=parent_last_name,
            parent_email=parent_email,
            parent_phone=parent_phone,
            parent_address=parent_address,
        )

        StudentEnrollment.objects.create(
            student=student,
            session=active_session,
            school_class=school_class,
            is_current=True,
        )

        return student
  
class StudentUpdateSerializer(serializers.Serializer):

    # =========================
    # USER FIELDS
    # =========================
    first_name = serializers.CharField(required=False)
    middle_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    last_name = serializers.CharField(required=False, write_only=True)
    username = serializers.CharField(required=False, write_only=True)
    password = serializers.CharField(required=False, write_only=True)
    gender = serializers.CharField(required=False, write_only=True)
    date_of_birth = serializers.DateField(required=False, write_only=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True, write_only=True)

    # =========================
    # STUDENT FIELDS
    # =========================
    admission_number = serializers.CharField(required=False)
    parent_first_name = serializers.CharField(required=False)
    parent_last_name = serializers.CharField(required=False)
    parent_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    parent_phone = serializers.CharField(required=False)
    parent_address = serializers.CharField(required=False)

    # =========================
    # ENROLLMENT / CLASS FIELD
    # =========================
    current_class = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )

    # =========================
    # USERNAME VALIDATION
    # =========================
    def validate_username(self, value):
        student = self.instance
        if User.objects.exclude(id=student.user.id).filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    # =========================
    # GLOBAL VALIDATION
    # =========================
    def validate(self, data):
        student = self.instance
        admission_number = data.get("admission_number", student.admission_number)

        exists = Student.objects.exclude(id=student.id).filter(
            admission_number=admission_number,
        ).exists()

        if exists:
            raise serializers.ValidationError({
                "admission_number": f"{admission_number} already exists"
            })

        return data

    # =========================
    # UPDATE
    # =========================
    def update(self, instance, validated_data):
        user = instance.user

        # Extract current_class from payload
        new_class = validated_data.pop("current_class", None)

        # Update User fields
        user.first_name = validated_data.get("first_name", user.first_name)
        user.middle_name = validated_data.get("middle_name", user.middle_name)
        user.last_name = validated_data.get("last_name", user.last_name)
        user.username = validated_data.get("username", user.username)
        user.gender = validated_data.get("gender", user.gender)
        user.date_of_birth = validated_data.get("date_of_birth", user.date_of_birth)

        if "profile_picture" in validated_data:
            user.profile_picture = validated_data.get("profile_picture")

        password = validated_data.get("password")
        if password:
            user.set_password(password)

        user.save()

        # Update Student fields
        instance.admission_number = validated_data.get("admission_number", instance.admission_number)
        instance.parent_first_name = validated_data.get("parent_first_name", instance.parent_first_name)
        instance.parent_last_name = validated_data.get("parent_last_name", instance.parent_last_name)
        instance.parent_email = validated_data.get("parent_email", instance.parent_email)
        instance.parent_phone = validated_data.get("parent_phone", instance.parent_phone)
        instance.parent_address = validated_data.get("parent_address", instance.parent_address)

        instance.save()

        # =====================================
        # UPDATE CURRENT CLASS ENROLLMENT
        # =====================================
        if new_class is not None:
            current_enrollment = instance.current_enrollment
            if current_enrollment:
                if current_enrollment.school_class != new_class:
                    current_enrollment.school_class = new_class
                    current_enrollment.save()
            else:
                # If student had no active enrollment, create one
                StudentEnrollment.objects.create( 
                    student=instance,
                    school_class=new_class,
                    is_current=True,
                )

        return instance
    
# ==============================
# SUBJECT SERIALIZER
# ==============================
class SubjectSerializer(serializers.ModelSerializer):
    teacher = TeacherSerializer(read_only=True)
    teacher_id = serializers.PrimaryKeyRelatedField(
        source="teacher",
        queryset=Teacher.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        )
    class Meta:
        model = Subject
        fields = ["id", "name", "code", "teacher", "teacher_id"]
# ==============================
# CLASS SUBJECT SERIALIZER
# ==============================
class ClassSubjectSerializer(serializers.ModelSerializer):
    school_class = ClassSerializer(read_only=True)
    school_class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        source="school_class",
        write_only=True,
    )

    term = TermSerializer(read_only=True)
    term_id = serializers.PrimaryKeyRelatedField(
        queryset=Term.objects.all(),
        source="term",
        write_only=True,
    )

    subject = SubjectSerializer(read_only=True)
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(),
        source="subject",
        write_only=True,
    )

    class Meta:
        model = ClassSubject
        fields = [
            "id",
            "school_class",
            "school_class_id",
            "subject",
            "subject_id",
            "term",
            "term_id",
        ]

        validators = [
            UniqueTogetherValidator(
                queryset=ClassSubject.objects.all(),
                fields=["school_class", "subject", "term"],
                message="This subject is already assigned to this class for this term.",
            )
        ]
    def validate(self, data):
        school_class = data.get(
            "school_class",
            getattr(self.instance, "school_class", None),
        )

        subject = data.get(
            "subject",
            getattr(self.instance, "subject", None),
        )

        term = data.get(
            "term",
            getattr(self.instance, "term", None),
        )

        queryset = ClassSubject.objects.filter(
            school_class=school_class,
            subject=subject,
            term=term,
        )

        # Exclude current instance during update
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                {
                    "subject": (
                        "This subject is already assigned "
                        "to this class for this term."
                    )
                }
            )

        return data
    

class PromotionRuleSerializer(serializers.ModelSerializer):
    from_class = ClassSerializer(read_only=True)
    to_class = ClassSerializer(read_only=True)

    from_class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        source="from_class",
        write_only=True
    )

    to_class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        source="to_class",
        write_only=True
    )

    class Meta:
        model = PromotionRule
        fields = [
            "id",
            "from_class",
            "to_class",
            "from_class_id",
            "to_class_id",
            "is_active",
            "created_at",
        ]
        
class PromotionRecordSerializer(serializers.ModelSerializer):
    from_class = ClassSerializer(read_only=True)
    to_class = ClassSerializer(read_only=True)

    student_name = serializers.CharField(
        source="student.user.full_name",
        read_only=True
    )
    batch_id = serializers.PrimaryKeyRelatedField(source="batch", read_only=True)
    batch = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = PromotionRecord
        fields = [
            "id", 
            "batch_id",
        "batch",
        
        "status",
        "created_at",
            "student_name",
        "from_class",
        "to_class",
         ]


class PromotionBatchSerializer(serializers.ModelSerializer):
    from_session = AcademicSessionSerializer(read_only=True)
    to_session = AcademicSessionSerializer(read_only=True)

    from_session_id = serializers.PrimaryKeyRelatedField(
        queryset=AcademicSession.objects.all(),
        source="from_session",
        write_only=True
    )

    to_session_id = serializers.PrimaryKeyRelatedField(
        queryset=AcademicSession.objects.all(),
        source="to_session",
        write_only=True
    )

    records = PromotionRecordSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = PromotionBatch
        fields = [
            "id", 
            "completed",
         "promoted_by",
         "created_at",
        "to_session_id", 
        "from_session_id", 
        "to_session", 
        "from_session", 
        "records",
         ]

