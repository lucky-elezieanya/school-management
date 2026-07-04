# admin.py
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    ClassFees,
    Result,
    ResultSummary,
    SchoolDays,
    TermComment,
    SubjectResultStatus,
    MaxScores,
    ResumptionDate,
    ComputationStatus,
    ClassTeacherSignature,
    HeadTeacherSignature,
    Attendance,
    Behaviour,
    GradingScale,
    ActivateResultPortal,
    ResultWorkflow,
    SubjectSummary,
    ResultPDF,
    ClassResultPDF,
    ResultCustomization
)


@admin.register(ResultCustomization)
class ResultCustomizationAdmin(admin.ModelAdmin):
    list_display = (
        
        "session",
        "term",
        "updated_at",
        "subject_average",
        "subject_position",
        "class_average",
        "class_position",
        "highest_lowest_scores",
        "overall_grade",
        "test_scores",
        "show_teacher_comment",
        "show_principal_comment",
        "show_behaviour",
        "show_attendance",
        "show_school_days",
        "show_class_fees",
        "show_grading_scale",
        "show_performance_chart"
    )

    list_filter = (
        
        "session",
        "term",
    )

    search_fields = (
        "school__name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

@admin.register(ClassResultPDF)
class ClassResultPDFAdmin(admin.ModelAdmin):

    list_display = (
        "school_class",
        "term",
        "session",
        "status",
        "file",
        "created_at",
    )

    list_filter = (
        "term",
        "session",
    )

    search_fields = (
        "school_class__name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

@admin.register(SchoolDays)
class SchoolDaysAdmin(admin.ModelAdmin):
    list_display = ("term", "session", "days_school_opened")
    list_filter = ("term", "session")
    search_fields = ("term__name", "session__name")
    
# ==========================================================
# CLASS TEACHER SIGNATURE ADMIN
# ==========================================================
@admin.register(ClassTeacherSignature)
class ClassTeacherSignatureAdmin(admin.ModelAdmin):
    list_display = (
        "teacher",
        "school_class",
        "signature_preview",
    )

    search_fields = (
        "teacher__user__first_name",
        "teacher__user__last_name",
        "teacher__user__username",
        "school_class__name",
    )

    list_select_related = (
        "teacher",
        "school_class",
    )

    readonly_fields = (
        "signature_preview",
    )

    fieldsets = (
        (
            "Teacher Information",
            {
                "fields": (
                    "teacher",
                    "school_class",
                )
            },
        ),
        (
            "Signature",
            {
                "fields": (
                    "signature",
                    "signature_preview",
                )
            },
        ),
    )

    def signature_preview(self, obj):
        if obj.signature:
            return format_html(
                '<img src="{}" style="height:80px;border:1px solid #ddd;padding:4px;" />',
                obj.signature.url,
            )
        return "No Signature"

    signature_preview.short_description = "Preview"

# HEAD TEACHER SIGNATURE ADMIN
# ==========================================================
@admin.register(HeadTeacherSignature)
class HeadTeacherSignatureAdmin(admin.ModelAdmin):
    list_display = (
        "owner",
        "signature_preview",
    )
    search_fields = (
        "owner",
    )
    readonly_fields = (
        "signature_preview",
    )

    fieldsets = (
        (
            "Head Teacher",
            {
                "fields": (
                    "owner",
                )
            },
        ),
        (
            "Signature",
            {
                "fields": (
                    "signature",
                    "signature_preview",
                )
            },
        ),
    )

    def signature_preview(self, obj):
        if obj.signature:
            return format_html(
                '<img src="{}" style="height:80px;border:1px solid #ddd;padding:4px;" />',
                obj.signature.url,
            )
        return "No Signature"

    signature_preview.short_description = "Preview"

    def has_add_permission(self, request):
        """
        Allow only one Head Teacher Signature record.
        """
        if HeadTeacherSignature.objects.exists():
            return False
        return super().has_add_permission(request)
    
@admin.register(ResultPDF)
class ResultPDFAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student",
        "term",
        "session",
        "status",
        "task_id",
        "file",
        "created_at",
        "updated_at"
    )
    list_filter = (
        "status",
        "term",
        "session",
        "created_at",
    )

    search_fields = (
        "id",
        "task_id",
        "student",
    )

    readonly_fields = (
        "id",
        "task_id",
        "created_at",
    )

    fieldsets = (
        ("Core Info", {
            "fields": (
                "id",
                "student",
                "term",
                "session",
            )
        }),
        ("Processing", {
            "fields": (
                "status",
                "task_id",
                "file",
            )
        }),
        ("Meta", {
            "fields": (
                "created_at",
            )
        }),
    )

    ordering = ("-created_at",)

    def has_add_permission(self, request):
        # Prevent manual creation (PDFs should come from Celery/API)
        return False

@admin.register(SubjectSummary)
class SubjectSummaryAdmin(
    admin.ModelAdmin
):
    list_display = [
        "student",
        "get_subject",
        "get_class",
        "score",
        "subject_average",
        "subject_position",
        "class_size",
        "term",
        "session",
    ]

    list_filter = [
        "term",
        "session",
        "class_subject__subject",
        "class_subject__school_class",
    ]

    search_fields = [
        "student__user__first_name",
        "student__user__last_name",
        "student__admission_number",
        "class_subject__subject__name",
    ]

    autocomplete_fields = [
        "student",
        "class_subject",
    ]

    ordering = [
        "class_subject",
        "subject_position",
    ]

    def get_subject(
        self,
        obj,
    ):
        return obj.class_subject.subject.name

    get_subject.short_description = (
        "Subject"
    )
    def get_class(self, obj):
        return obj.class_subject.school_class.name
    
    get_class.short_description = ("Class")
      
# ==========================================
# RESULT ADMIN
# ==========================================
@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "school_class",
        "class_subject",
        "term",
        "session",
        "total_score",
        "grade",
        "remark",
        "teacher_submitted",
    )

    search_fields = (
        "student__user__first_name",
        "student__user__last_name",
        "class_subject__subject__name",
    )

    list_filter = (
        "term",
        "session",
        "teacher_submitted",
    )

    readonly_fields = (
        "total_score",
        "created_at",
        "updated_at",
    )

    ordering = (
        "-session",
        "term",
    )

    list_select_related = (
        "student",
        "class_subject",
        "term",
        "session",
    )

# ==========================================
# GRADING SCALE ADMIN
# ==========================================
@admin.register(GradingScale)
class GradingScaleAdmin(admin.ModelAdmin):
    list_display = (
        "grade",
        "grading_type",
        "lower_limit",
        "upper_limit",
        "remark",
    )

    search_fields = (
        "grade",
        "grading_type",
        "remark",
    )

    ordering = (
        "grade",
    )

# ==========================================
# RESULT SUMMARY ADMIN
# ==========================================
@admin.register(ResultSummary)
class ResultSummaryAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "school_class",
        "term",
        "session",
        "total_score",
        "average_score",
        "class_average",
        "position",
        "total_subjects",
    )

    search_fields = (
        "student__user__first_name",
        "student__user__last_name",
        "school_class__name",
    )

    list_filter = (
        "term",
        "session",
        "school_class",
    )

    readonly_fields = (
        "updated_at",
    )

    ordering = (
        "position",
    )

    list_select_related = (
        "student",
        "school_class",
        "term",
        "session",
    )

# ==========================================
# TERM COMMENT ADMIN
# ==========================================
@admin.register(TermComment)
class TermCommentAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "school_class",
        "term",
        "session",
        "created_at",
    )

    search_fields = (
        "student__user__first_name",
        "student__user__last_name",
    )

    list_filter = (
        "term",
        "session",
        "school_class",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    list_select_related = (
        "student",
        "school_class",
        "term",
        "session",
    )

# ==========================================
# CLASS FEES ADMIN
# ==========================================
@admin.register(ClassFees)
class ClassFeesAdmin(admin.ModelAdmin):
    list_display = (
        "school_class",
        "session",
        "term",
        "amount",
    )

    search_fields = (
        "school_class__name",
    )

    list_filter = (
        "session",
        "term",
    )

    ordering = (
        "-session",
    )

# ==========================================
# MAX SCORES ADMIN
# ==========================================
@admin.register(MaxScores)
class MaxScoresAdmin(admin.ModelAdmin):
    list_display = (
        "school_class",
        "first_test",
        "second_test",
        "exam",
    )

    search_fields = (
        "school_class__name",
    )

# ==========================================
# RESUMPTION DATE ADMIN
# ==========================================
@admin.register(ResumptionDate)
class ResumptionDateAdmin(admin.ModelAdmin):
    list_display = (
        "current_session",
        "next_session",
        "current_term",
        "next_term",
        "resumption_date",
    )

    list_filter = (
         "current_session",
        "next_session",
        "current_term",
        "next_term",
    )

    ordering = (
        "-current_session",
    )


# COMPUTATION STATUS ADMIN
# ==========================================
@admin.register(ComputationStatus)
class ComputationStatusAdmin(admin.ModelAdmin):
    list_display = (
        "session",
        "term",
        "computation_started",
        "computation_completed",
    )

    list_filter = (
        "session",
        "term",
        "computation_started",
        "computation_completed",
    )

# ==========================================
# ATTENDANCE ADMIN
# ==========================================
@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "attendance",
        "school_class__name",
        "term",
        "session",
        "created_at",
    )

    search_fields = (
        "student__user__first_name",
        "student__user__last_name",
    )

    list_filter = (
        "term",
        "session",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    list_select_related = (
        "student",
        "term",
        "session",
    )
# ==========================================
# BEHAVIOUR ADMIN
# ==========================================
@admin.register(Behaviour)
class BehaviourAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "school_class",
        "term",
        "session",
        "skills",
        "politeness",
        "neatness",
        "punctuality",
        "leadership",
    )

    search_fields = (
        "student__user__first_name",
        "student__user__last_name",
    )

    list_filter = (
        "term",
        "session",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    list_select_related = (
        "student",
        "term",
        "session",
    )

# ==========================================
# SUBJECT RESULT STATUS ADMIN
# ==========================================
@admin.register(SubjectResultStatus)
class SubjectResultStatusAdmin(admin.ModelAdmin):
    list_display = (
        "school_class",
        "class_subject",
        "term",
        "session",
        "is_submitted",
        "submitted_at",
        "is_released",
    )

    search_fields = (
        "school_class__name",
        "class_subject__subject__name",
    )

    list_filter = (
        "term",
        "session",
        "is_submitted",
        "is_released",
    )

    readonly_fields = (
        "submitted_at",
    )

    ordering = (
        "-session",
        "term",
    )

    list_select_related = (
        "school_class",
        "class_subject",
        "term",
        "session",
    )

@admin.register(ResultWorkflow)
class ResultWorkflowAdmin(
    admin.ModelAdmin
):

    list_display = [
        "school_class",
        "term",
        "session",
        "status",
        "all_results_submitted",
        "approved_at",
        "approved_by",
        "released_at",
    ]

    list_filter = [
        "status",
        "term",
        "session",
        "school_class",
    ]

    search_fields = [
        "school_class__name",
        "term__name",
        "session__name",
    ]

    readonly_fields = [
        "approved_at",
        "released_at",
        "approved_by",
        "released_by",
    ]
@admin.register(ActivateResultPortal)
class ActivateResultPortalAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "session",
        "term",
        "open",
        "opened_at",
    )

    list_filter = (
        "open",
        "session",
        "term",
    )

    search_fields = (
        "session__name",
        "term__name",
    )

    readonly_fields = (
        "opened_at",
    )

    ordering = (
        "-opened_at",
    )

    autocomplete_fields = (
        "session",
        "term",
    )