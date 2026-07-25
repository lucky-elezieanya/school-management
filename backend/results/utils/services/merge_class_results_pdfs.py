import logging
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.utils import timezone
import re

from pypdf import PdfWriter

from results.models import (
    ClassResultPDF,
    ResultPDF,
)

logger = logging.getLogger(__name__)


@transaction.atomic
def merge_class_result_pdfs(
    *,
    school_class,
    term,
    session,
):
    """
    Merge all successfully generated student PDFs for a class.

    Compatible with:
        • Local filesystem
        • Backblaze B2
        • Amazon S3
        • Cloudflare R2
        • Any Django storage backend

    Only PDFs with status="DONE" are merged.
    """

    pdfs = list(
        ResultPDF.objects
        .filter(
            student__enrollments__school_class=school_class,
            student__enrollments__session=session,
            term=term,
            session=session,
            status="DONE",
            file__isnull=False,
        )
        .select_related("student")
        .distinct()
        .order_by("student__admission_number")
    )

    if not pdfs:
        logger.warning(
            "No student PDFs found for %s (%s - %s)",
            school_class,
            term,
            session,
        )
        return None

    merged, _ = (
        ClassResultPDF.objects
        .select_for_update()
        .get_or_create(
            school_class=school_class,
            term=term,
            session=session,
        )
    )

    merged.status = "PROCESSING"
    merged.error_message = ""

    merged.save(
        update_fields=[
            "status",
            "error_message",
            "updated_at",
        ]
    )

    writer = PdfWriter()

    try:

        skipped = 0

        for pdf in pdfs:

            if not pdf.file:
                skipped += 1
                continue

            try:

                with default_storage.open(
                    pdf.file.name,
                    "rb",
                ) as stream:

                    writer.append(stream)

            except Exception:

                skipped += 1

                logger.exception(
                    "Unable to append PDF for student %s",
                    pdf.student_id,
                )

        if len(writer.pages) == 0:

            raise ValueError(
                "No valid PDFs were available for merging."
            )

        output = BytesIO()

        writer.write(output)

        output.seek(0)
        
        filename = (
            f"{school_class.name}_"
            f"{school_class.arm.code if school_class.arm else ''}_"
            f"{term.name}_"
            f"{session.name}.pdf"
        ).replace(" ", "_").replace("/", "-")

        if merged.file:
            merged.file.delete(save=False)

        merged.file.save(
            filename,
            ContentFile(output.read()),
            save=False,
        )

        merged.status = "DONE"
        merged.generated_at = timezone.now()
        merged.error_message = ""

        merged.save(
            update_fields=[
                "file",
                "status",
                "generated_at",
                "error_message",
                "updated_at",
            ]
        )

        logger.info(
            "Class PDF generated. "
            "Total=%s, "
            "Merged=%s, "
            "Skipped=%s",
            len(pdfs),
            len(writer.pages),
            skipped,
        )

        return {
            "class_pdf": merged,
            "merged": len(writer.pages),
            "skipped": skipped,
            "total": len(pdfs),
        }

    except Exception as exc:

        logger.exception(
            "Failed merging PDFs for class %s",
            school_class.id,
        )

        merged.status = "FAILED"
        merged.error_message = str(exc)

        merged.save(
            update_fields=[
                "status",
                "error_message",
                "updated_at",
            ]
        )

        raise

    finally:

        writer.close()

        if "output" in locals():
            output.close()
            