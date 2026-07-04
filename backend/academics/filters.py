from django.db.models import Q
from django_filters import rest_framework as filters

from .models import Student


class StudentFilter(filters.FilterSet):
    """
    Filters students by enrollment and student attributes.
    """

    # Student fields
    is_active = filters.BooleanFilter()
    admission_number = filters.CharFilter(
        field_name="admission_number",
        lookup_expr="icontains",
    )
 

    # Enrollment fields
    school_class_id = filters.NumberFilter(
        field_name="enrollments__school_class_id",
    )

    session_id = filters.NumberFilter(
        field_name="enrollments__session_id",
    )

    current = filters.BooleanFilter(
        field_name="enrollments__is_current",
    )

    class Meta:
        model = Student
        fields = [
            "is_active",
            "admission_number",
            "school_class_id",
            "session_id",
            "current",
        ]