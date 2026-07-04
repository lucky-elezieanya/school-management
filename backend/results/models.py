from django.db import models
from django.utils import timezone
# from decimal import Decimal
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db.models import Q
import uuid

from django.db import models

class ResultCustomization(models.Model):
    """
    Controls which fields are displayed on generated result sheets.
     """
    session = models.ForeignKey(
        "academics.AcademicSession",
        on_delete=models.CASCADE,
        related_name="result_customizations",
    )

    term = models.ForeignKey(
        "academics.Term",
        on_delete=models.CASCADE,
        related_name="result_customizations",
    )

    subject_average = models.BooleanField(default=True)
    class_average = models.BooleanField(default=True)
    subject_position = models.BooleanField(default=True)
    class_size = models.BooleanField(default=True)
    subject_score = models.BooleanField(default=True)
    cumulative_average = models.BooleanField(default=True)
    class_position = models.BooleanField(default=True)
    highest_lowest_scores = models.BooleanField(default=True)
    overall_grade = models.BooleanField(default=True)
    test_scores = models.BooleanField(default=True)
    performance_chart = models.BooleanField(default=True)
    show_teacher_comment = models.BooleanField(default=True)
    show_principal_comment = models.BooleanField(default=True)
    show_behaviour = models.BooleanField(default=True)
    show_attendance = models.BooleanField(default=True)
    show_school_days = models.BooleanField(default=True)
    show_class_fees = models.BooleanField(default=True)
    show_grading_scale = models.BooleanField(default=True)
    show_performance_chart = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        unique_together = ("session", "term")
        verbose_name = "Result Customization"
        verbose_name_plural = "Result Customizations"

    def __str__(self):
        return (
            f"{self.session} - "
            f"{self.term}"
        )

class ClassResultPDF(models.Model):
    school_class = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="result_pdfs",
    )

    term = models.ForeignKey(
        "academics.Term",
        on_delete=models.CASCADE,
    )

    session = models.ForeignKey(
        "academics.AcademicSession",
        on_delete=models.CASCADE,
    )

    file = models.FileField(
        upload_to="results/class_pdfs/",
        null=True,
        blank=True,
    )
    status = models.CharField(default="PENDING")

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (
            "school_class",
            "term",
            "session",
        )
        ordering = ["school_class__name"]

class ResultPDF(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("PROCESSING", "Processing"),
        ("DONE", "Done"),
        ("FAILED", "Failed"),
    )
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    student = models.ForeignKey(
        "academics.Student",
        on_delete=models.CASCADE,
        related_name="result_pdfs",
    )

    term = models.ForeignKey(
        "academics.Term",
        on_delete=models.PROTECT,
        related_name="result_pdfs",
    )

    session = models.ForeignKey(
        "academics.AcademicSession",
        on_delete=models.PROTECT,
        related_name="result_pdfs",
    )

    file = models.FileField(
        upload_to="results/pdfs/",
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
    )

    task_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        unique_together = (
            "student",
            "term",
            "session",
        )

        indexes = [
            models.Index(fields=["student"]),
            models.Index(fields=["term"]),
            models.Index(fields=["session"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return (
            f"{self.student} - "
            f"{self.term} - "
            f"{self.session}"
        )
  
class Result(models.Model):
    student = models.ForeignKey(
        "academics.Student",
        on_delete=models.CASCADE,
        related_name="results"
    )
    class_subject = models.ForeignKey(
        "academics.ClassSubject",
        on_delete=models.CASCADE,
        related_name="results"
    )
    term = models.ForeignKey("academics.Term", on_delete=models.PROTECT)
    session = models.ForeignKey("academics.AcademicSession", on_delete=models.PROTECT)
    first_test = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    second_test = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    exam_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_score = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    grade = models.CharField(max_length=2, blank=True)
    remark = models.CharField(max_length=100, blank=True)
    teacher_submitted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("student", "class_subject", "term", "session")
        indexes = [
            models.Index(fields=["term", "session", "class_subject"]),
            models.Index(fields=["student"]),
      ]
        ordering = ["-total_score"]
        
    def __str__(self):
        return f"{self.student.user.full_name} - {self.class_subject} result"

    @property
    def school_class(self):
        """
        Get class from ClassSubject relation.
        """
        return self.class_subject.school_class

    def calculate_total(self):
        return (
            self.first_test +
            self.second_test +
            self.exam_score
        )
    def save(self, *args, **kwargs):
        self.full_clean()
        self.total_score = self.calculate_total()
        super().save(*args, **kwargs)

class GradingScale(models.Model):
    SUBJECT = "subject"
    OVERALL = "overall"

    GRADE_TYPES = (
        (SUBJECT, "Subject Grade"),
        (OVERALL, "Overall Grade"),
    )

    grading_type = models.CharField(
        max_length=20,
        choices=GRADE_TYPES,
        default=SUBJECT,
    )

    grade = models.CharField(max_length=20)

    lower_limit = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )

    upper_limit = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )

    remark = models.CharField(max_length=50)

    class Meta:
        ordering = ["grading_type", "-upper_limit"]
        
# ==========================================
# RESULT SUMMARY MODEL
# ==========================================
class ResultSummary(models.Model): 
    """
    Stores overall term computation for a student.
    Example:
    Total Score, Average, Position
    """
    student = models.ForeignKey(
        "academics.Student",
        on_delete=models.PROTECT,
        related_name="result_summaries"
    )
    school_class = models.ForeignKey(
        "academics.Class",
        on_delete=models.PROTECT,
        related_name="result_summaries"
    )

    term = models.ForeignKey(
        "academics.Term", on_delete=models.PROTECT
    )

    session = models.ForeignKey(
        "academics.AcademicSession",
        on_delete=models.PROTECT
    )

    total_score = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    average_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0
    )

    position = models.PositiveIntegerField(
        null=True,
        blank=True
    )
 
    class_average = models.DecimalField(
        max_digits=6 ,
        decimal_places=2,
        default=0
    )
    total_subjects = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position"]
        unique_together = (
            "student",
            "school_class",
            "term",
            "session"
        )

    def __str__(self):
        return f"{self.student} Summary - {self.term}"
    
class SubjectSummary(models.Model):

    student = models.ForeignKey(
        "academics.Student",
        on_delete=models.CASCADE,
    )

    class_subject = models.ForeignKey(
        "academics.ClassSubject",
        on_delete=models.CASCADE,
    )

    term = models.ForeignKey(
        "academics.Term",
        on_delete=models.PROTECT,
    )

    session = models.ForeignKey(
        "academics.AcademicSession",
        on_delete=models.PROTECT,
    )

    score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
    )

    subject_average = models.DecimalField(
        max_digits=6,
        decimal_places=2,
    )

    subject_position = models.PositiveIntegerField()

    class_size = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        unique_together = (
            "student",
            "class_subject",
            "term",
            "session",
        )

        indexes = [
            models.Index(
                fields=[
                    "class_subject",
                    "term",
                    "session",
                ]
            ),
            models.Index(
            fields=[
                "student",
                "term",
                "session",
            ]
        ),

        models.Index(
            fields=[
                "term",
                "session",
            ]
        ),
    ]
# ==========================================
# TERM COMMENT MODEL
# ==========================================
class TermComment(models.Model):
    """
    Stores comments for each student per term.
    """
    student = models.ForeignKey(
        "academics.Student",
        on_delete=models.PROTECT,
        related_name="term_comments"
    )
    school_class = models.ForeignKey(
        "academics.Class",
        on_delete=models.PROTECT,
        related_name="term_comments"
    )
    term = models.ForeignKey(
        "academics.Term", on_delete=models.PROTECT
    )
    session = models.ForeignKey(
        "academics.AcademicSession",
        on_delete=models.PROTECT
    )
    class_teacher_comment = models.TextField(blank=True)
    principal_comment = models.TextField(blank=True) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (
            "student",
            "school_class",
            "term",
            "session"
        )
    def __str__(self):
        return f"{self.student.user.full_name} comment for - {self.term}"

class ClassFees(models.Model):
    school_class = models.ForeignKey("academics.Class", on_delete=models.CASCADE)
    session = models.ForeignKey("academics.AcademicSession", on_delete=models.CASCADE)
    term = models.ForeignKey("academics.Term", on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["school_class", "session", "term"],
                name="unique_class_fee"
            )
        ]
        ordering = ["-school_class"]

class MaxScores(models.Model):
    first_test = models.DecimalField(max_digits=10, decimal_places=2)
    second_test = models.DecimalField(max_digits=10, decimal_places=2)
    exam = models.DecimalField(max_digits=10, decimal_places=2)
    school_class = models.ForeignKey("academics.Class", on_delete=models.CASCADE)
    class Meta:
        ordering = (
          "-school_class__name",
        )
    def __str__(self):
        return f"Max scores for {self.school_class.name}: T1: {self.first_test}, T: {self.second_test}, Ex: {self.exam}"

class ResumptionDate(models.Model):
    resumption_date = models.DateField(blank=True, null=True)
    current_term = models.ForeignKey("academics.Term", on_delete=models.PROTECT, related_name="current_term",  null=True)
    next_term = models.ForeignKey("academics.Term", on_delete=models.PROTECT, related_name="next_term",  null=True)
    current_session = models.ForeignKey("academics.AcademicSession", on_delete=models.PROTECT, related_name="current_session",  null=True)
    next_session = models.ForeignKey("academics.AcademicSession", on_delete=models.PROTECT, blank=True, null=True, related_name="next_session")
    
    class Meta:
        ordering = ["-resumption_date"]

    def __str__(self):
        return f"{self.next_session} {self.next_term} resumes {self.resumption_date}"

class ComputationStatus(models.Model):
    computation_started = models.BooleanField(default=False)
    computation_completed = models.BooleanField(default=False)
    term = models.ForeignKey("academics.Term", on_delete=models.CASCADE)
    session = models.ForeignKey("academics.AcademicSession", on_delete=models.CASCADE)

    class Meta:
        ordering = ["-term"]
    
    def __str__(self):
        return f"{self.session} - {self.term} Results Computation started: {self.computation_started}"

class ClassTeacherSignature(models.Model):
    teacher = models.ForeignKey(
        "academics.Teacher",
        on_delete=models.CASCADE,
        related_name="signatures",
    )

    school_class = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="teacher_signatures",
    )

    signature = models.ImageField(
        upload_to="signatures/class_teachers/",
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["school_class"],
                condition=Q(is_active=True),
                name="one_active_signature_per_class",
            )
        ]

    def __str__(self):
        return f"{self.teacher} - {self.school_class}"

class HeadTeacherSignature(models.Model):
    owner = models.CharField(max_length=100)
    signature = models.ImageField(
        upload_to="signatures/head_teacher/",
        )
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["is_active"],
                condition=Q(is_active=True),
                name="single_active_headteacher_signature",
            )
        ]

    def __str__(self):
        return self.owner

class SchoolDays(models.Model):
    days_school_opened = models.PositiveIntegerField(default=0)
    term = models.ForeignKey("academics.Term", on_delete=models.PROTECT)
    session = models.ForeignKey("academics.AcademicSession", on_delete=models.PROTECT)

    def clean(self):
        # Prevent duplicate term/session combinations
        if SchoolDays.objects.exclude(pk=self.pk).filter(
            term=self.term,
            session=self.session
        ).exists():
            raise ValidationError("School days already exists for this term and session.")

    def save(self, *args, **kwargs):
        self.full_clean()  # ensures clean() runs before saving
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.term.name} - {self.session.name}: {self.days_school_opened} days"
    
class Attendance(models.Model):
    school_class = models.ForeignKey("academics.Class", on_delete=models.PROTECT)
    attendance = models.PositiveIntegerField(default=0)
    student = models.ForeignKey(
        "academics.Student",
        on_delete=models.PROTECT,
        related_name="attendance"
    )

    term = models.ForeignKey("academics.Term", on_delete=models.PROTECT)
    session = models.ForeignKey("academics.AcademicSession", on_delete=models.PROTECT)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("term", "session", "student")
        ordering = ["-student"]

    # --------------------------------------------------
    # VALIDATION RULE
    # --------------------------------------------------


    def clean(self):
        from .models import SchoolDays  # avoid circular import

        try:
            school_days = SchoolDays.objects.get(
                term=self.term,
                session=self.session
            )
        except SchoolDays.DoesNotExist:
            raise ValidationError({
                "attendance": "School days record not found for this term/session."
            })

        if self.attendance > school_days.days_school_opened:
            raise ValidationError({
                "attendance": (
                    f"Attendance cannot exceed {school_days.days_school_opened} "
                    "days school was opened."
                )
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    # --------------------------------------------------
    # STRING REPRESENTATION
    # --------------------------------------------------
    def __str__(self):
        return (
            f"{self.student.user.full_name} - "
            f"{self.attendance}"
            f"({self.term.name}, {self.session.name})"
        )
        
class Behaviour(models.Model):
    BEHAVIOUR_CHOICES = (
        ("A", "A"),
        ("B", "B"),
        ("C", "C"),
        ("D", "D"),
        ("E", "E"),
        ("F", "F")
    )
    skills = models.CharField(max_length=5, choices=BEHAVIOUR_CHOICES, default="A")
    politeness = models.CharField(max_length=5, choices=BEHAVIOUR_CHOICES, default="A")
    neatness = models.CharField(max_length=5, choices=BEHAVIOUR_CHOICES, default="A")
    self_control = models.CharField(max_length=5, choices=BEHAVIOUR_CHOICES, default="A")
    relationship = models.CharField(max_length=5, choices=BEHAVIOUR_CHOICES, default="A")
    attendance = models.CharField(max_length=5, choices=BEHAVIOUR_CHOICES, default="A")
    punctuality = models.CharField(max_length=5, choices=BEHAVIOUR_CHOICES, default="A")
    leadership = models.CharField(max_length=5, choices=BEHAVIOUR_CHOICES, default="A")
    school_class = models.ForeignKey("academics.Class", on_delete=models.PROTECT)
    student = models.ForeignKey("academics.Student", on_delete=models.PROTECT)
    term = models.ForeignKey("academics.Term", on_delete=models.PROTECT)
    session = models.ForeignKey("academics.AcademicSession", on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        unique_together = (
            "student",
            "term",
            "session",
            "school_class"
        )
        ordering = ["-student"]
        
    def __str__(self):
        return f"Behavioural inputs for {self.student.user.first_name} for {self.term.name}"

# SUBJECT RESULT STATUS MODEL

class SubjectResultStatus(models.Model):
    """
    Tracks whether a teacher has submitted
    scores for a subject completely.
    """
    class_subject = models.ForeignKey(
        "academics.ClassSubject",
        on_delete=models.CASCADE,
        related_name="submission_statuses"
    )
    school_class = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="subject_submission_statuses",
        null=True,
    )
    term = models.ForeignKey(
        "academics.Term", on_delete=models.PROTECT
    )
    session = models.ForeignKey(
        "academics.AcademicSession",
        on_delete=models.PROTECT
    )

    is_submitted = models.BooleanField(default=False)

    submitted_at = models.DateTimeField(
       blank=True, null=True
    )

    is_released = models.BooleanField(default=False)

    class Meta:
        unique_together = (
            "class_subject",
            "term",
            "session"
        )

    def __str__(self):
        return f"{self.class_subject} Submission Status"
    
    def save(self, *args, **kwargs):
        if self.is_submitted and not self.submitted_at:
            self.submitted_at = timezone.now()
        elif not self.is_submitted:
            self.submitted_at = None

        super().save(*args, **kwargs)

class ResultWorkflow(models.Model):

    STATUS_CHOICES = [
        ("Draft", "Draft"),
        ("Pending", "Pending"),
        ("Approved", "Approved"),
        ("Released", "Released"),
    ]

    school_class = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="result_workflows",
    )

    term = models.ForeignKey(
        "academics.Term",
        on_delete=models.PROTECT,
    )

    session = models.ForeignKey(
        "academics.AcademicSession",
        on_delete=models.PROTECT,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Draft",
    )

    all_results_submitted = models.BooleanField(
        default=False
    )

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_results",
    )

    approved_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    released_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="released_results",
    )

    released_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        unique_together = (
            "school_class",
            "term",
            "session",
        )
        ordering = ["-school_class"]

    def __str__(self):
        return (
            f"{self.school_class} "
            f"{self.term} "
            f"{self.status}"
        )

class ActivateResultPortal(models.Model):
    term = models.OneToOneField(
        "academics.Term",
        on_delete=models.CASCADE,
        related_name="result_portal"
    )

    session = models.ForeignKey(
        "academics.AcademicSession",
        on_delete=models.CASCADE,
        related_name="result_portals"
    )

    open = models.BooleanField(default=False)
    opened_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.term} - {'Open' if self.open else 'Closed'}"