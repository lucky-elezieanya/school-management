from rest_framework import status
from rest_framework.response import Response
from academics.models import AcademicSession, Class, SchoolAsset, StudentEnrollment, Term
from ...models import (
    Attendance,
    Behaviour,
    ClassFees,
    ClassTeacherSignature,
    GradingScale,
    HeadTeacherSignature,
    ResumptionDate,
    SchoolDays,
    TermComment,
)
from .engine import ResultEngine

def compute(request, school_class_id, session_id, term_id, enforce_prechecks=False):
    if not term_id or not session_id:
        return Response(
            {"detail": "term_id and session_id are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    school_class = None
    term = Term.objects.get(id=term_id)
    session = AcademicSession.objects.get(id=session_id)

    if school_class_id:
        school_class = Class.objects.get(id=school_class_id)

    if enforce_prechecks:
        # Precheck validation logic
        if school_class_id:
            enrollment_count = StudentEnrollment.objects.filter(
                session_id=session_id,
                school_class_id=school_class_id,
                is_current=True,
            ).count()

            attendance_count = Attendance.objects.filter(
                term_id=term_id,
                session_id=session_id,
                school_class_id=school_class_id,
            ).count()

            behaviour_count = Behaviour.objects.filter(
                term_id=term_id,
                session_id=session_id,
                school_class_id=school_class_id,
                student__enrollments__is_current=True,
            ).count()

            comment_count = TermComment.objects.filter(
                term_id=term_id,
                session_id=session_id,
                school_class_id=school_class_id,
                student__enrollments__is_current=True,
            ).count()

            has_class_teacher_signature = ClassTeacherSignature.objects.filter(
                school_class_id=school_class_id,
                is_active=True,
            ).exists()

            has_class_fees = ClassFees.objects.filter(
                term_id=term_id,
                session_id=session_id,
                school_class_id=school_class_id,
            ).exists()
        else:
            enrollment_count = StudentEnrollment.objects.filter(
                session_id=session_id,
                is_current=True,
            ).count()

            attendance_count = Attendance.objects.filter(
                term_id=term_id,
                session_id=session_id,
            ).count()

            behaviour_count = Behaviour.objects.filter(
                term_id=term_id,
                session_id=session_id,
            ).count()

            comment_count = TermComment.objects.filter(
                term_id=term_id,
                session_id=session_id,
            ).count()

            total_classes = Class.objects.count()

            signed_classes = ClassTeacherSignature.objects.filter(
                is_active=True
            ).values("school_class_id").distinct().count()

            fees_configured_classes = ClassFees.objects.filter(
                term_id=term_id,
                session_id=session_id,
            ).values("school_class_id").distinct().count()

            has_class_teacher_signature = (total_classes > 0 and signed_classes == total_classes)
            has_class_fees = (total_classes > 0 and fees_configured_classes == total_classes)

        checks = {
            "attendance": (enrollment_count > 0 and attendance_count == enrollment_count),
            "behaviours": (enrollment_count > 0 and behaviour_count == enrollment_count),
            "comments": (enrollment_count > 0 and comment_count == enrollment_count),
            "grades": GradingScale.objects.filter(grading_type="subject").exists() and GradingScale.objects.filter(grading_type="overall").exists(),
            "school_days": SchoolDays.objects.filter(term_id=term_id, session_id=session_id).exists(),
            "school_assets": SchoolAsset.objects.filter(is_active=True, asset_type="logo").exists() and SchoolAsset.objects.filter(is_active=True, asset_type="header").exists(),
            "class_teacher_signatures": has_class_teacher_signature,
            "head_teacher_signature": HeadTeacherSignature.objects.filter(is_active=True).exists(),
            "class_fees": has_class_fees,
            "resumption_date": ResumptionDate.objects.filter(
                current_term_id=term_id, current_session_id=session_id
            ).exists(),
        }

        if not all(checks.values()):
            return False

    # Execute Calculation directly
    engine = ResultEngine(
        school_class=school_class,
        session=session,
        term=term,
        request=request
    )
    count = engine.compute()
    return count