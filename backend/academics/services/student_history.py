from django.db import transaction

from ..models import (
    StudentHistory,
    StudentEnrollment,
)



def build_student_snapshot(student):
    user = student.user

    return {
        "student_id": student.id,
        "admission_number": student.admission_number,
        "date_admitted": (
            student.date_admitted.isoformat()
            if student.date_admitted
            else None
        ),
        "is_active": student.is_active,

        "user": {
            "id": user.id if user else None,
            "username": user.username if user else None,
            "email": user.email if user else None,
            "first_name": (
                getattr(user, "first_name", None)
                if user else None
            ),
            "middle_name": (
                getattr(user, "middle_name", None)
                if user else None
            ),
            "last_name": (
                getattr(user, "last_name", None)
                if user else None
            ),
            "full_name": (
                getattr(user, "full_name", None)
                if user else None
            ),
            "gender": (
                getattr(user, "gender", None)
                if user else None
            ),
            "date_of_birth": (
                user.date_of_birth.isoformat()
                if user and user.date_of_birth
                else None
            ),
        },

        "parent": {
            "first_name": student.parent_first_name,
            "last_name": student.parent_last_name,
            "phone": student.parent_phone,
            "email": student.parent_email,
            "address": student.parent_address,
        },
    }


def build_class_snapshot(school_class):
    if not school_class:
        return {}

    arm = school_class.arm

    return {
        "class_id": school_class.id,
        "name": school_class.name,
        "display_name": (
            f"{school_class.name} {arm.name}"
            if arm
            else school_class.name
        ),
        "description": school_class.description,

        "arm": {
            "id": arm.id if arm else None,
            "name": arm.name if arm else None,
            "code": arm.code if arm else None,
        },
    }


def build_session_snapshot(session):
    if not session:
        return {}

    return {
        "session_id": session.id,
        "name": session.name,
        "is_active": session.is_active,
    }


def build_term_snapshot(term):
    if not term:
        return {}

    return {
        "term_id": term.id,
        "name": term.name,
        "session_id": term.session_id,
        "session_name": (
            term.session.name
            if term.session
            else None
        ),
        "is_active": term.is_active,
    }


@transaction.atomic
def create_student_history(
    enrollment,
    status="ENROLLED",
    term=None,
    remarks="",
):
    """
    Create exactly one immutable history record
    for a student's academic session.

    The history captures the student's state at
    the time of enrollment.

    It must NEVER be updated later.
    """

    enrollment = (
        StudentEnrollment.objects
        .select_related(
            "student",
            "student__user",
            "session",
            "school_class",
            "school_class__arm",
        )
        .get(pk=enrollment.pk)
    )

    student = enrollment.student
    session = enrollment.session
    school_class = enrollment.school_class

    # -----------------------------------------
    # Resolve term for this session only
    # -----------------------------------------

    if term is None:
        term = (
            session.terms
            .filter(is_active=True)
            .first()
        )

    if term is None:
        term = (
            session.terms
            .filter(name="First Term")
            .first()
        )

    # -----------------------------------------
    # Prevent duplicate session history
    # -----------------------------------------

    history = (
        StudentHistory.objects
        .filter(
            student=student,
            session=session,
        )
        .first()
    )

    if history:
        return history, False

    # -----------------------------------------
    # Create immutable snapshot
    # -----------------------------------------

    history = StudentHistory.objects.create(
        student=student,
        enrollment=enrollment,
        session=session,
        term=term,
        school_class=school_class,

        status=status,

        student_snapshot=build_student_snapshot(
            student
        ),

        class_snapshot=build_class_snapshot(
            school_class
        ),

        session_snapshot=build_session_snapshot(
            session
        ),

        term_snapshot=build_term_snapshot(
            term
        ),

        remarks=remarks,
    )

    return history, True