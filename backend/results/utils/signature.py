from rembg import remove
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)


def process_signature(uploaded_file, canvas_size=(300, 100)):
    """
    Removes background, crops empty space, and places the signature 
    centered inside a horizontal canvas (e.g., 300x100) with transparency.
    """
    try:
        input_image = Image.open(uploaded_file)

        # 1. Remove background (transparent background)
        output_image = remove(input_image)

        # 2. Crop strictly around the signature ink
        bbox = output_image.getbbox()
        if bbox:
            output_image = output_image.crop(bbox)

        # 3. Scale signature to fit inside the horizontal bounding box
        target_w, target_h = canvas_size
        output_image.thumbnail((target_w, target_h), Image.Resampling.LANCZOS)

        # 4. Create a transparent horizontal canvas
        canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))

        # 5. Center the signature on the canvas
        offset_x = (target_w - output_image.width) // 2
        offset_y = (target_h - output_image.height) // 2
        canvas.paste(output_image, (offset_x, offset_y), output_image)

        # 6. Save PNG
        buffer = BytesIO()
        canvas.save(buffer, format="PNG", optimize=True)
        buffer.seek(0)

        original_name = uploaded_file.name.rsplit(".", 1)[0]

        return ContentFile(
            buffer.read(),
            name=f"{original_name}_processed.png"
        )

    except Exception:
        logger.exception("Failed to process signature")
        raise