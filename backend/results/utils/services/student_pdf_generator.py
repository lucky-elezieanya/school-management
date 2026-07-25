from __future__ import annotations

import logging

from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
import re

from .pdf_renderer import (
    PdfRendererError,
    render_student_pdf,
)

logger = logging.getLogger(__name__)


@transaction.atomic
def generate_student_pdf(
    *,
    result_pdf,
    snapshot,
    renderer=render_student_pdf
):
    """
    Generates a PDF from an already-built snapshot.

    This service NEVER performs database queries.

    Parameters
    ----------
    result_pdf:
        ResultPDF instance.

    snapshot:
        StudentResultSnapshot instance
        (already loaded by the caller).
    """

    result_pdf.status = "PROCESSING"
    result_pdf.error_message = ""

    result_pdf.save(
        update_fields=[
            "status",
            "error_message",
            "updated_at",
        ]
    )

    try:

        pdf_bytes = renderer(
            snapshot.data,
        )
        formatted_name = re.sub(
            r"\s+",
            "_",
            (
                f"{result_pdf.student.admission_number}_"
                f"{result_pdf.term.name}_"
                f"{result_pdf.session.name}"
            ),
        )

        filename = f"{formatted_name}.pdf"

        result_pdf.file.save(
            filename,
            ContentFile(pdf_bytes),
            save=False,
        )

        result_pdf.status = "DONE"
        result_pdf.generated_at = timezone.now()
        result_pdf.error_message = ""

        result_pdf.save(
            update_fields=[
                "file",
                "status",
                "generated_at",
                "error_message",
                "updated_at",
            ]
        )

        logger.info(
            "Generated PDF for student %s",
            result_pdf.student_id,
        )

        return result_pdf

    except PdfRendererError as exc:

        logger.exception(
            "Renderer failed for student %s",
            result_pdf.student_id,
        )

        result_pdf.status = "FAILED"
        result_pdf.error_message = str(exc)

        result_pdf.save(
            update_fields=[
                "status",
                "error_message",
                "updated_at",
            ]
        )

        raise

    except Exception:

        logger.exception(
            "Unexpected PDF error for student %s",
            result_pdf.student_id,
        )

        result_pdf.status = "FAILED"
        result_pdf.error_message = "Unexpected PDF generation error."

        result_pdf.save(
            update_fields=[
                "status",
                "error_message",
                "updated_at",
            ]
        )

        raise