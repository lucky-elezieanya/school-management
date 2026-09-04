from django.db import models
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()
class StudentImport(models.Model):
    STATUS = (
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    )

    file = models.FileField(upload_to="student_uploads/")
    task_id = models.CharField(max_length=255, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="pending",
    )

    created_count = models.IntegerField(default=0)
    skipped_count = models.IntegerField(default=0)

    result = models.JSONField(default=dict, blank=True)

    error = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Student Import - {self.id} - {self.status}"

    class Meta:
        ordering = ["-created_at"]
        
class SchoolAsset(models.Model):

    ASSET_TYPES = (
        ("logo", "Logo"),
        ("header", "Header"),
    )

    asset_type = models.CharField(max_length=10, choices=ASSET_TYPES)
    image = models.ImageField(upload_to="school_assets/")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.asset_type} - {self.id}"
    
    def save(self, *args, **kwargs):
        if self.is_active:
            SchoolAsset.objects.filter(
                asset_type=self.asset_type,
                is_active=True
            ).update(is_active=False)

        super().save(*args, **kwargs)

class Arms(models.Model):

    name = models.CharField(max_length=10, default="A")
    code = models.CharField(max_length=10, default="ARM A", blank=True, null=True)

    class Meta:
        ordering = ["-name"]
    
    def __str__(self):
        return f"{self.name}"


class AcademicSession(models.Model):
    name = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # If this session is being set active
        if self.is_active:
            AcademicSession.objects.exclude(id=self.id).update(is_active=False)

        super().save(*args, **kwargs)
        
        class Meta:
            ordering = ["-name"]

    def __str__(self):
        return self.name
    
class Term(models.Model):
    TERM_CHOICES = (
    ("First Term", "First Term"),
    ("Second Term", "Second Term"),
    ("Third Term", "Third Term"),
)
    name = models.CharField(max_length=20, choices=TERM_CHOICES)
    session = models.ForeignKey(
        AcademicSession, 
        on_delete=models.CASCADE, 
        related_name="terms")
    
    is_active = models.BooleanField(default=False)

    class Meta:
        unique_together = ("name", "session", "is_active")

    def save(self, *args, **kwargs):
        # If this session is being set active
        if self.is_active:
            Term.objects.filter(
                    session=self.session
                ).exclude(
                    id=self.id
                ).update(
                    is_active=False
                )

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.session}"

class Subject(models.Model):
    """
    Represents a school subject.
    Example:
    Mathematics, English Language
    """

    name = models.CharField(
        max_length=100,
        unique=True
    )

    code = models.CharField(
        max_length=20,
        unique=True,
        blank=True
    )
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Teacher(models.Model):
    """
    Teacher profile linked to auth user.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="teacher_profile"
    )
    qualification = models.CharField(
        max_length=255,
        blank=True
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True
    )
    address = models.TextField(blank=True)

  
    date_employed = models.DateField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["user__first_name"]

    def __str__(self):
        return self.user.get_full_name() or self.user.username

# ==========================================
# CLASS MODEL
# ==========================================
class Class(models.Model):
    """
    Represents a school class.
    Example:
    JSS1A, JSS2B, SS1 Science
    """
    name = models.CharField(
        max_length=100
    )
    arm = models.ForeignKey(Arms, on_delete=models.CASCADE, related_name="classes")
    class_teacher = models.ForeignKey(
        Teacher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    related_name="assigned_classes"
)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["name", "arm"]
        ordering = ["name"]

    def __str__(self):
        
        return f"{self.name} - {self.arm}"
        

# ==========================================
# CLASS SUBJECT MODEL
# ==========================================
class ClassSubject(models.Model):
    """
    Assigns a subject to a class.
    Example:
    Mathematics assigned to JSS1A 
    """

    school_class = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name="class_subjects"
    )
    
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="class_subjects"
    )
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name="term_subjects")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["school_class", "subject", "term"]
        unique_together = ("school_class", "subject", "term")

    def __str__(self):
        return f"{self.school_class} - {self.subject}"

# ==========================================
# STUDENT MODEL
# ==========================================
class Student(models.Model):
    """
    Student bio-data and parent/guardian information.
    Academic placement is managed through StudentEnrollment.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="student_profile",
        null=True,
        blank=True,
    )

    admission_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
    )

    # ==========================================
    # PARENT / GUARDIAN INFORMATION
    # ==========================================

    parent_first_name = models.CharField(
        max_length=255,
        blank=True,
    )

    parent_last_name = models.CharField(
        max_length=255,
        blank=True,
    )

    parent_phone = models.CharField(
        max_length=20,
        blank=True,
        db_index=True,
    )

    parent_email = models.EmailField(
        max_length=150,
        blank=True,
    )

    parent_address = models.TextField(
        blank=True,
    )

    # ==========================================
    # STUDENT INFORMATION
    # ==========================================

    date_admitted = models.DateField(auto_now_add=True)

    is_active = models.BooleanField(
        default=True,
        help_text="Determines whether the student is currently active in the school.",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["user"]
        indexes = [
            models.Index(fields=["admission_number"]),
            models.Index(fields=["parent_phone"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        if self.user:
            return (
                self.user.full_name
                or self.user.username
                or self.admission_number
            )

        return self.admission_number

    @property
    def current_enrollment(self):
        """
        Returns the student's active enrollment.
        """
        return self.enrollments.filter(is_current=True).first()

    @property
    def current_class(self):
        enrollment = self.current_enrollment
        return enrollment.school_class if enrollment else None

class ClassSubjectTeacher(models.Model):

    class_subject = models.ForeignKey(
        ClassSubject,
        on_delete=models.CASCADE,
        related_name="teachers",
    )

    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name="subject_assignments",
    )

    session = models.ForeignKey(
        AcademicSession,
        on_delete=models.CASCADE,
    )

    class Meta:
        unique_together = (
            "class_subject",
            "teacher",
            "session",
        )

class StudentEnrollment(models.Model):
    """
    Represents a student's academic placement
    for a specific academic session.

    This is the source of truth for determining
    where a student belongs academically.
    """

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )

    session = models.ForeignKey(
        AcademicSession,
        on_delete=models.CASCADE,
        related_name="student_enrollments",
    )

    school_class = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name="student_enrollments",
    )

    is_current = models.BooleanField(
        default=False,
        help_text="Indicates the student's current enrollment."
    )

    enrolled_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-session__name", "student__admission_number"]

        constraints = [
        models.UniqueConstraint(
            fields=["student", "session"],
            name="unique_student_session_enrollment",
        ),
        models.UniqueConstraint(
            fields=["student"],
            condition=Q(is_current=True),
            name="unique_current_enrollment_per_student",
        ),
]

        indexes = [
            models.Index(fields=["student"]),
            models.Index(fields=["session"]),
            models.Index(fields=["school_class"]),
            models.Index(fields=["is_current"]),
        ]

    def __str__(self):
        return (
            f"{self.student} - "
            f"{self.school_class} "
            f"({self.session})"
        )
    
class PromotionRule(models.Model):
    """
    JSS1 -> JSS2
    JSS2 -> JSS3
    """

    from_class = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name="promotion_rule"
    )

    to_class = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name="incoming_promotions"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.from_class} → {self.to_class}"
    

class PromotionBatch(models.Model):
    """
    One promotion operation.
    """

    from_session = models.ForeignKey(
        AcademicSession,
        on_delete=models.CASCADE,
        related_name="promotion_batches_from"
    )

    to_session = models.ForeignKey(
        AcademicSession,
        on_delete=models.CASCADE,
        related_name="promotion_batches_to"
    )

    promoted_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True
    )

    completed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [
            "from_session",
            "to_session"
        ]

    def __str__(self):
        return f"{self.from_session} → {self.to_session}"
    
class PromotionRecord(models.Model):

    STATUS_CHOICES = (
        ("PROMOTED", "Promoted"),
        ("REPEATED", "Repeated"),
        ("GRADUATED", "Graduated"),
        ("TRANSFERRED", "Transferred"),
    )

    batch = models.ForeignKey(
        PromotionBatch,
        on_delete=models.CASCADE,
        related_name="records"
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="promotion_records"
    )

    from_class = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name="+"
    )

    to_class = models.ForeignKey(
        Class,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PROMOTED"
    )

    remarks = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [
            "batch",
            "student"
        ]

class StudentHistory(models.Model):
    """
    Immutable academic snapshot.

    Exactly one record exists for a student in an academic session.

    StudentHistory is NOT an event log.

    It represents:
        "What did this student's academic record look like
         during this academic session?"

    PromotionRecord represents transitions between sessions.
    """

    STATUS_CHOICES = (
        ("ENROLLED", "Enrolled"),
        ("PROMOTED", "Promoted"),
        ("REPEATED", "Repeated"),
        ("TRANSFERRED", "Transferred"),
        ("GRADUATED", "Graduated"),
        ("WITHDRAWN", "Withdrawn"),
        ("DEACTIVATED", "Deactivated"),
    )

    # ==========================================================
    # REFERENCES
    # ==========================================================

    student = models.ForeignKey(
        Student,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="history_records",
    )

    enrollment = models.ForeignKey(
        StudentEnrollment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="history_records",
    )

    session = models.ForeignKey(
        AcademicSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_history_records",
    )

    term = models.ForeignKey(
        Term,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_history_records",
    )

    school_class = models.ForeignKey(
        Class,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_history_records",
    )

    # ==========================================================
    # STATUS
    # ==========================================================

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ENROLLED",
        db_index=True,
    )

    # ==========================================================
    # SNAPSHOTS
    # ==========================================================

    student_snapshot = models.JSONField(
        default=dict,
    )

    class_snapshot = models.JSONField(
        default=dict,
    )

    session_snapshot = models.JSONField(
        default=dict,
    )

    term_snapshot = models.JSONField(
        default=dict,
        blank=True,
    )

    # ==========================================================
    # EXTRA
    # ==========================================================

    remarks = models.TextField(
        blank=True,
    )

    recorded_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    # ==========================================================
    # META
    # ==========================================================

    class Meta:
        ordering = ["-recorded_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["student", "session"],
                name="unique_student_history_per_session",
            ),
        ]

        indexes = [
            models.Index(
                fields=["student", "session"],
            ),
            models.Index(
                fields=["session", "school_class"],
            ),
            models.Index(
                fields=["session", "status"],
            ),
            models.Index(
                fields=["term"],
            ),
            models.Index(
                fields=["recorded_at"],
            ),
        ]

    def __str__(self):
        student_name = (
            (self.student_snapshot or {})
            .get("user", {})
            .get("full_name")
            or (self.student_snapshot or {}).get("admission_number")
            or "Unknown Student"
        )

        session_name = (
            (self.session_snapshot or {}).get("name")
            or "Unknown Session"
        )

        class_name = (
            (self.class_snapshot or {}).get("display_name")
            or (self.class_snapshot or {}).get("name")
            or "Unknown Class"
        )

        return f"{student_name} - {class_name} - {session_name}"

    def save(self, *args, **kwargs):
        """
        Prevent updates to an existing history record.
        """

        if self.pk:
            raise ValueError(
                "StudentHistory records are immutable and cannot be modified."
            )

        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError(
            "StudentHistory records are immutable and cannot be deleted."
        )