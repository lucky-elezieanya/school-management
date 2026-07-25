from django.core.files.base import ContentFile
import re

def save_result_pdf(
    result_pdf,
    pdf_bytes,
):
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