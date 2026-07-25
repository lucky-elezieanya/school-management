from __future__ import annotations

import logging

from django.db import transaction

from academics.models import (
    AcademicSession,
    StudentEnrollment,
    Term,
    Class,
)

from .merge_class_results_pdfs import merge_class_result_pdfs
from .student_pdf_generator import generate_student_pdf
from results.models import (
    ClassResultPDF,
    ResultPDF,
    StudentResultSnapshot,
)





logger = logging.getLogger(__name__)


@transaction.atomic
def generate_class_pdfs(
    *,
    school_class_id: int,
    term_id: int,
    session_id: int,
):
    """
    Generate every student's PDF for one class and
    merge them into a single class PDF.

    Optimizations
    -------------
    ✓ No database queries inside loops.
    ✓ Bulk preloading.
    ✓ Continues when one student fails.
    ✓ Merges only when ALL students succeed.
    """

    school_class = Class.objects.select_related(
        "arm",
    ).get(
        pk=school_class_id,
    )

    term = Term.objects.get(
        pk=term_id,
    )

    session = AcademicSession.objects.get(
        pk=session_id,
    )

    class_pdf, _ = (
        ClassResultPDF.objects.select_for_update()
        .get_or_create(
            school_class=school_class,
            term=term,
            session=session,
        )
    )

    class_pdf.status = "PROCESSING"
    class_pdf.error_message = ""
    class_pdf.save(
        update_fields=[
            "status",
            "error_message",
            "updated_at",
        ]
    )

    enrollments = list(
        StudentEnrollment.objects
        .filter(
            school_class=school_class,
            session=session,
            is_current=True,
        )
        .select_related(
            "student",
        )
        .order_by(
            "student__admission_number",
        )
    )

    if not enrollments:

        class_pdf.status = "FAILED"
        class_pdf.error_message = (
            "No enrolled students found."
        )

        class_pdf.save(
            update_fields=[
                "status",
                "error_message",
                "updated_at",
            ]
        )

        logger.warning(
            "No students found for class %s",
            school_class.id,
        )

        return None

    student_ids = [
        e.student_id
        for e in enrollments
    ]

    snapshots = {
        snapshot.student_id: snapshot
        for snapshot in
        StudentResultSnapshot.objects.filter(
            student_id__in=student_ids,
            school_class=school_class,
            term=term,
            session=session,
        )
    }

    pdfs = {
        pdf.student_id: pdf
        for pdf in
        ResultPDF.objects.filter(
            student_id__in=student_ids,
            term=term,
            session=session,
        ).select_related(
            "student",
            "term",
            "session",
        )
    }

    generated = 0
    failed = 0
    skipped = 0

    for enrollment in enrollments:

        snapshot = snapshots.get(
            enrollment.student_id,
        )

        if snapshot is None:

            logger.warning(
                "Snapshot missing for student %s",
                enrollment.student_id,
            )

            skipped += 1
            continue

        result_pdf = pdfs.get(
            enrollment.student_id,
        )

        if result_pdf is None:

            result_pdf = ResultPDF.objects.create(
                student=enrollment.student,
                term=term,
                session=session,
            )

            pdfs[
                enrollment.student_id
            ] = result_pdf

        try:

            generate_student_pdf(
                result_pdf=result_pdf,
                snapshot=snapshot,
            )

            generated += 1

        except Exception:

            failed += 1

            logger.exception(
                "Failed generating PDF for student %s",
                enrollment.student_id,
            )

            continue

    logger.info(
        "Class %s finished. Generated=%s Failed=%s Skipped=%s",
        school_class.id,
        generated,
        failed,
        skipped,
    )

    if failed or skipped:

        class_pdf.status = "FAILED"

        class_pdf.error_message = (
            f"{failed} failed, "
            f"{skipped} skipped."
        )

        class_pdf.save(
            update_fields=[
                "status",
                "error_message",
                "updated_at",
            ]
        )

        logger.warning(
            "Skipping merge because generation was incomplete."
        )

        return None

    merge_result = merge_class_result_pdfs(
        school_class=school_class,
        term=term,
        session=session,
    )

    logger.info(
        "Merged class PDF for class %s",
        school_class.id,
    )

    return merge_result