from django.db.models import Q
from django_filters import rest_framework as filters

from .models import Student, StudentHistory


class StudentHistoryFilter(filters.FilterSet):
    """
    Filters student history records by student, session, term,
    class, status, snapshot information, and recording date.
    """

    # ---------------------------------------------------------
    # Direct foreign-key filters
    # ---------------------------------------------------------

    student = filters.NumberFilter(
        field_name="student_id",
    )

    session = filters.NumberFilter(
        field_name="session_id",
    )

    term = filters.NumberFilter(
        field_name="term_id",
    )

    school_class = filters.NumberFilter(
        field_name="school_class_id",
    )

    status = filters.CharFilter(
        field_name="status",
        lookup_expr="iexact",
    )

    # ---------------------------------------------------------
    # Student snapshot filters
    # ---------------------------------------------------------

    admission_number = filters.CharFilter(
        field_name="student_snapshot__admission_number",
        lookup_expr="icontains",
    )

    student_name = filters.CharFilter(
        field_name="student_snapshot__user__full_name",
        lookup_expr="icontains",
    )

    username = filters.CharFilter(
        field_name="student_snapshot__user__username",
        lookup_expr="icontains",
    )

    # ---------------------------------------------------------
    # Session snapshot filters
    # ---------------------------------------------------------

    session_name = filters.CharFilter(
        field_name="session_snapshot__name",
        lookup_expr="icontains",
    )

    # ---------------------------------------------------------
    # Class snapshot filters
    # ---------------------------------------------------------

    class_name = filters.CharFilter(
        field_name="class_snapshot__name",
        lookup_expr="icontains",
    )

    arm = filters.CharFilter(
        field_name="class_snapshot__arm__name",
        lookup_expr="iexact",
    )

    # ---------------------------------------------------------
    # Date filters
    # ---------------------------------------------------------

    recorded_after = filters.DateTimeFilter(
        field_name="recorded_at",
        lookup_expr="gte",
    )

    recorded_before = filters.DateTimeFilter(
        field_name="recorded_at",
        lookup_expr="lte",
    )

    class Meta:
        model = StudentHistory

        fields = [
            "student",
            "session",
            "term",
            "school_class",
            "status",
            "admission_number",
            "student_name",
            "username",
            "session_name",
            "class_name",
            "arm",
            "recorded_after",
            "recorded_before",
        ]

class StudentFilter(filters.FilterSet):
    """
    Filters students by student attributes and enrollment information.
    """

    # ---------------------------------------------------------
    # Student fields
    # ---------------------------------------------------------

    is_active = filters.BooleanFilter(
        field_name="is_active",
    )

    admission_number = filters.CharFilter(
        field_name="admission_number",
        lookup_expr="icontains",
    )

    # ---------------------------------------------------------
    # Enrollment fields
    # ---------------------------------------------------------

    school_class_id = filters.NumberFilter(
        field_name="enrollments__school_class_id",
    )

    session_id = filters.NumberFilter(
        field_name="enrollments__session_id",
    )

    is_current = filters.BooleanFilter(
        field_name="enrollments__is_current",
    )

    class Meta:
        model = Student

        fields = [
            "is_active",
            "admission_number",
            "school_class_id",
            "session_id",
            "is_current",
        ]
 