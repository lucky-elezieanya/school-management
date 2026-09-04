# admin.py

from django.contrib import admin

from .models import (
    Arms,
    AcademicSession,
    SchoolAsset,
    StudentEnrollment,
    StudentHistory,
    StudentImport,
    Term,
    Teacher,
    Subject,
    Class,
    Student,
    ClassSubject, PromotionRule,
    PromotionBatch,
    PromotionRecord,
)

@admin.register(StudentImport)
class StudentImportAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "status",
        "created_count",
        "skipped_count",
        
       
        "task_id",
        "created_at",
        "started_at",
        "completed_at",
    )

    list_filter = (
        "status",
        "created_at",
        "started_at",
        "completed_at",
    )

    search_fields = (
        "task_id",
    )

    readonly_fields = (
        "task_id",
        "status",
        "created_count",
        "skipped_count",
        "created_at",
        "started_at",
        "completed_at",
        "result",
        "error",
    )

    fieldsets = (
        (
            "Import Information",
            {
                "fields": (
                    "file",
                    "task_id",
                    "status",
                )
            },
        ),
        (
            "Statistics",
            {
                "fields": (
                    "created_count",
                    "skipped_count",
                )
            },
        ),
        (
            "Timing",
            {
                "fields": (
                    "created_at",
                    "started_at",
                    "completed_at",
                )
            },
        ),
        (
            "Error",
            {
                "fields": (
                    "error",
                )
            },
        ),
        (
            "Result",
            {
                "fields": (
                    "result",
                )
            },
        ),
    )

    ordering = ("-created_at",)
    
# ==========================================
# ARMS ADMIN
# ==========================================
@admin.register(Arms)
class ArmsAdmin(admin.ModelAdmin):
    list_display = (
        "name", "code"
    )

    search_fields = (
        "name", "code"
    )

    ordering = (
        "-name",
    )
# ==========================================
# ACADEMIC SESSION ADMIN
# ==========================================
@admin.register(AcademicSession)
class AcademicSessionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "is_active",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "name",
    )

    ordering = (
        "-id",
    )
# ==========================================
# TERM ADMIN
# ==========================================
@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "session",
        "is_active",
    )

    list_filter = (
        "session",
        "name",
        "is_active",
    )

    search_fields = (
        "name",
        "session__name",
    )

    autocomplete_fields = (
        "session",
    )

    ordering = (
        "-id",
    )

    list_select_related = (
        "session",
    )
# ==========================================
# TEACHER ADMIN
# ==========================================
@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "get_full_name",
        "get_assigned_class",
        "qualification",
        "phone_number",
        "date_employed",
        "created_at",
    )

    search_fields = (
        "user__first_name",
        "user__last_name",
        "user__username",
        "phone_number",
    )

    list_filter = (
        "date_employed",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = (
        "user__first_name",
    )

    list_select_related = (
        "user",
    )

    def get_full_name(self, obj):
        return obj.user.full_name

    get_full_name.short_description = "Teacher"

    def get_assigned_class(self, obj):
        return obj.assigned_class if hasattr(obj, "assigned_class") else "-"

    get_assigned_class.short_description = "Assigned Class"

# ==========================================
# SUBJECT ADMIN
# ==========================================
@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "is_active",
        "created_at",
    )

    search_fields = (
        "name",
        "code",
        "teacher__user__first_name",
        "teacher__user__last_name",
    )

    list_filter = (
        "is_active",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = (
        "name",
    )
# ==========================================
# CLASS ADMIN
# ==========================================
@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "arm",
        "description",
        "class_teacher",
        "is_active",
        "created_at",
    )

    search_fields = (
        "name",
        "arm__name",
        "class_teacher__user__first_name",
        "class_teacher__user__last_name",
    )

    list_filter = (
        "arm",
        "is_active",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    ordering = (
        "name",
    )

    list_select_related = (
        "arm",
        "class_teacher",
    )

# ==========================================
# STUDENT ENROLLMENT
# ==========================================

@admin.register(StudentEnrollment)
class StudentEnrollmentAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "school_class",
        "session",
        "is_current",
        "updated_at",
        "enrolled_at",
    )

    list_filter = (
        "session",
        "school_class",
    )

    search_fields = (
        "student__admission_number",
        "student__user__first_name",
        "student__user__last_name",
        "school_class__name",
    )

    autocomplete_fields = (
        "student",
        "session",
        "school_class",
    )

    readonly_fields = (
        "enrolled_at",
    )

    ordering = (
        "-enrolled_at",
    )

# ==========================================
# PROMOTION RULE
# ==========================================

@admin.register(PromotionRule)
class PromotionRuleAdmin(admin.ModelAdmin):
    list_display = (
        "from_class",
        "to_class",
        "is_active",
        "created_at",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "from_class__name",
        "to_class__name",
    )

    autocomplete_fields = (
        "from_class",
        "to_class",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = (
        "from_class",
    )

# ==========================================
# PROMOTION RECORD INLINE
# ==========================================

class PromotionRecordInline(admin.TabularInline):
    model = PromotionRecord
    extra = 0

    fields = (
        "student",
        "from_class",
        "to_class",
        "status",
        "remarks",
    )

    autocomplete_fields = (
        "student",
        "from_class",
        "to_class",
    )

    show_change_link = True

# ==========================================
# PROMOTION BATCH
# ==========================================
@admin.action(description="Mark selected batches as completed")
def mark_completed(modeladmin, request, queryset):
    queryset.update(completed=True)


@admin.action(description="Mark selected batches as pending")
def mark_pending(modeladmin, request, queryset):
    queryset.update(completed=False)


@admin.register(PromotionBatch)
class PromotionBatchAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "from_session",
        "to_session",
        "promoted_by",
        "completed",
        "created_at",
    )

    list_filter = (
        "completed",
        "from_session",
        "to_session",
    )

    search_fields = (
        "from_session__name",
        "to_session__name",
        "promoted_by__username",
    )

    autocomplete_fields = (
        "from_session",
        "to_session",
        "promoted_by",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = (
        "-created_at",
    )

    actions = (
        mark_completed,
        mark_pending,
    )

    inlines = [
        PromotionRecordInline,
    ]

# ==========================================
# PROMOTION RECORD
# ==========================================

@admin.register(PromotionRecord)
class PromotionRecordAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "from_class",
        "to_class",
        "status",
        "batch",
        "created_at",
    )

    list_filter = (
        "status",
        "from_class",
        "to_class",
        "batch",
    )

    search_fields = (
        "student__admission_number",
        "student__user__first_name",
        "student__user__last_name",
    )

    autocomplete_fields = (
        "student",
        "batch",
        "from_class",
        "to_class",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = (
        "-created_at",
    )

class StudentEnrollmentInline(admin.TabularInline):
    model = StudentEnrollment
    extra = 0

    readonly_fields = (
        "session",
        "school_class",
        "enrolled_at",
        "is_current"
    )

    can_delete = False
# ==========================================
# STUDENT ADMIN
# ==========================================
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    inlines = [ StudentEnrollmentInline]
    list_display = (
        "user",
        "admission_number",
        "is_active",
        "parent_first_name",
        "parent_last_name",
        "parent_phone",
        "date_admitted",
    )

    search_fields = (
        "user__first_name",
        "user__last_name",
        "user__username",
        "admission_number",
        "parent_first_name",
        "parent_last_name",
    )

    list_filter = (
        "date_admitted",
    )

    readonly_fields = (
        "created_at",
        "date_admitted",
    )

    ordering = (
        "user__first_name",
    )

    list_select_related = (
        "user",
    )

@admin.register(SchoolAsset)
class SchoolAssetAdmin(admin.ModelAdmin):
    list_display = ("id", "asset_type", "is_active", "created_at")
    list_filter = ("asset_type", "is_active", "created_at")
    search_fields = ("asset_type",)
    ordering = ("-created_at",)

    readonly_fields = ("created_at",)

    fieldsets = (
        ("Asset Info", {
            "fields": ("asset_type", "image", "is_active")
        }),
        ("Meta", {
            "fields": ("created_at",)
        }),
    )

# ==========================================
# CLASS SUBJECT ADMIN
# ==========================================
@admin.register(ClassSubject)
class ClassSubjectAdmin(admin.ModelAdmin):
    list_display = (
        "school_class",
        "subject",
        "term",
        "created_at",
    )

    search_fields = (
        "school_class__name",
        "subject__name",
        "subject__code", "term"
    )

    list_filter = (
        "school_class",
        "subject", "term"
    )

    readonly_fields = (
        "created_at",
    )

    ordering = (
        "school_class",
        "subject",
    )

    list_select_related = (
        "school_class",
        "subject",
    )

# ==========================================
# STUDENT HISTORY ADMIN
# ==========================================
@admin.register(StudentHistory)
class StudentHistoryAdmin(admin.ModelAdmin):
    """
    Admin configuration for StudentHistory.
    StudentHistory records are immutable:
    - Admins can view them
    - Admins cannot edit them
    - Admins cannot delete them
    - Admins cannot manually create them
    Records should be created by the academic-history/promotion
    service logic.
    """
    # ==========================================================
    # LIST DISPLAY
    # ==========================================================
    list_display = (
        "student_name",
        "admission_number",
        "session_name",
        "class_name",
        "status",
        "recorded_at",
    )

    # ==========================================================
    # FILTERS
    # ==========================================================

    list_filter = (
        "status",
        "session",
        "school_class",
        "term",
        "recorded_at",
    )

    # ==========================================================
    # SEARCH
    # ==========================================================

    search_fields = (
        "student__user__full_name",
        "student__admission_number",
        "session__name",
        "school_class__name",
    )

    # ==========================================================
    # DEFAULT ORDERING
    # ==========================================================

    ordering = (
        "-recorded_at",
    )

    # ==========================================================
    # READ-ONLY FIELDS
    # ==========================================================

    readonly_fields = (
        "student",
        "enrollment",
        "session",
        "term",
        "school_class",
        "status",
        "student_snapshot",
        "class_snapshot",
        "session_snapshot",
        "term_snapshot",
        "remarks",
        "recorded_at",
    )

    # ==========================================================
    # FIELDSETS
    # ==========================================================

    fieldsets = (
        (
            "Academic Record",
            {
                "fields": (
                    "student",
                    "enrollment",
                    "session",
                    "term",
                    "school_class",
                    "status",
                    "remarks",
                    "recorded_at",
                )
            },
        ),
        (
            "Student Snapshot",
            {
                "fields": (
                    "student_snapshot",
                ),
                "classes": (
                    "collapse",
                ),
            },
        ),
        (
            "Class Snapshot",
            {
                "fields": (
                    "class_snapshot",
                ),
                "classes": (
                    "collapse",
                ),
            },
        ),
        (
            "Session Snapshot",
            {
                "fields": (
                    "session_snapshot",
                ),
                "classes": (
                    "collapse",
                ),
            },
        ),
        (
            "Term Snapshot",
            {
                "fields": (
                    "term_snapshot",
                ),
                "classes": (
                    "collapse",
                ),
            },
        ),
    )

    # ==========================================================
    # CUSTOM DISPLAY METHODS
    # ==========================================================

    @admin.display(
        description="Student",
        ordering="student__user__full_name",
    )
    def student_name(self, obj):
        if obj.student and obj.student.user:
            return obj.student.user.full_name

        return (
            (obj.student_snapshot or {})
            .get("user", {})
            .get("full_name")
            or "Unknown Student"
        )

    @admin.display(
        description="Admission Number",
    )
    def admission_number(self, obj):
        if obj.student:
            return obj.student.admission_number

        return (
            (obj.student_snapshot or {})
            .get("admission_number")
            or "—"
        )

    @admin.display(
        description="Session",
        ordering="session__name",
    )
    def session_name(self, obj):
        if obj.session:
            return obj.session.name

        return (
            (obj.session_snapshot or {})
            .get("name")
            or "Unknown Session"
        )

    @admin.display(
        description="Class",
        ordering="school_class__name",
    )
    def class_name(self, obj):
        if obj.school_class:
            return obj.school_class.name

        snapshot = obj.class_snapshot or {}

        return (
            snapshot.get("display_name")
            or snapshot.get("name")
            or "Unknown Class"
        )

    # ==========================================================
    # IMMUTABILITY
    # ==========================================================

    def has_add_permission(self, request):
        """
        Prevent admins from manually creating history records.

        History should be created automatically by the application
        when a student's academic state is recorded.
        """
        return False

    def has_change_permission(self, request, obj=None):
        """
        Prevent modification of existing history records.
        """
        return False

    def has_delete_permission(self, request, obj=None):
        """
        Prevent deletion of history records.
        """
        return False