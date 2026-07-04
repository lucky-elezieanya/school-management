from rembg import remove
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)


def process_signature(uploaded_file):
    """
    Remove background from uploaded signature image
    and return a Django ContentFile suitable for saving
    into an ImageField.
    """

    try:
        input_image = Image.open(uploaded_file)

        # remove background
        output_image = remove(input_image)

        # save PNG with transparency
        buffer = BytesIO()
        output_image.save(buffer, format="PNG")
        buffer.seek(0)

        original_name = uploaded_file.name.rsplit(".", 1)[0]

        return ContentFile(
            buffer.read(),
            name=f"{original_name}_processed.png"
        )

    except Exception:
        logger.exception("Failed to process signature")
        raise
