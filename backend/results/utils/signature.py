from rembg import remove
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)


def process_signature(uploaded_file, canvas_size=(300, 100)):
    """
    Remove the background from a signature image,
    crop the result to the visible signature,
    resize it proportionally,
    and place it on a transparent canvas.
    """

    try:
        # Make sure we start from the beginning of the uploaded file
        uploaded_file.seek(0)

        # Open image
        input_image = Image.open(uploaded_file)

        # Convert to RGBA
        input_image = input_image.convert("RGBA")

        logger.info(
            "Processing signature: size=%s mode=%s",
            input_image.size,
            input_image.mode,
        )

        # -------------------------------------------------
        # 1. REMOVE BACKGROUND
        # -------------------------------------------------
        output_image = remove(input_image)

        # Make absolutely sure result is RGBA
        output_image = output_image.convert("RGBA")

        logger.info(
            "Background removed: size=%s mode=%s",
            output_image.size,
            output_image.mode,
        )

        # -------------------------------------------------
        # 2. USE ALPHA CHANNEL TO FIND SIGNATURE
        # -------------------------------------------------
        alpha = output_image.getchannel("A")

        bbox = alpha.getbbox()

        if bbox:
            output_image = output_image.crop(bbox)
        else:
            logger.warning("No visible signature detected.")
            raise ValueError("Could not detect signature in image.")

        # -------------------------------------------------
        # 3. RESIZE PROPORTIONALLY
        # -------------------------------------------------
        target_w, target_h = canvas_size

        # Leave some padding around signature
        max_w = int(target_w * 0.90)
        max_h = int(target_h * 0.80)

        output_image.thumbnail(
            (max_w, max_h),
            Image.Resampling.LANCZOS
        )

        # -------------------------------------------------
        # 4. CREATE TRANSPARENT CANVAS
        # -------------------------------------------------
        canvas = Image.new(
            "RGBA",
            (target_w, target_h),
            (255, 255, 255, 0)
        )

        # -------------------------------------------------
        # 5. CENTER SIGNATURE
        # -------------------------------------------------
        offset_x = (target_w - output_image.width) // 2
        offset_y = (target_h - output_image.height) // 2

        canvas.alpha_composite(
            output_image,
            (offset_x, offset_y)
        )

        # -------------------------------------------------
        # 6. SAVE PNG WITH TRANSPARENCY
        # -------------------------------------------------
        buffer = BytesIO()

        canvas.save(
            buffer,
            format="PNG",
            optimize=True
        )

        buffer.seek(0)

        original_name = uploaded_file.name.rsplit(".", 1)[0]

        processed_file = ContentFile(
            buffer.getvalue(),
            name=f"{original_name}_processed.png"
        )

        logger.info(
            "Signature processed successfully: %s",
            processed_file.name
        )

        return processed_file

    except Exception:
        logger.exception("Failed to process signature")
        raise
    
    
    