import logging

import httpx

from django.conf import settings

logger = logging.getLogger(__name__)


class PdfRendererError(Exception):
    """Raised when the frontend PDF renderer fails."""


_client = httpx.Client(
    base_url=settings.FRONTEND_URL,
    timeout=httpx.Timeout(
        connect=10.0,
        read=300.0,
        write=300.0,
        pool=10.0,
    ),
    headers={
        "x-render-secret": settings.PDF_RENDER_SECRET,
    },
)


def render_student_pdf(snapshot: dict) -> bytes:
    """
    Sends a student snapshot to the Next.js renderer
    and returns the generated PDF bytes.
    """

    try:

        response = _client.post(
            "/api/pdf_puppeteer",
            json=snapshot,
        )

    except httpx.HTTPError as exc:

        logger.exception(
            "Unable to contact PDF renderer."
        )

        raise PdfRendererError(
            "Unable to contact frontend renderer."
        ) from exc

    if response.status_code != 200:

        raise PdfRendererError(
            f"Renderer returned "
            f"{response.status_code}: "
            f"{response.text}"
        )

    content_type = response.headers.get(
        "content-type",
        "",
    )

    if "application/pdf" not in content_type:

        raise PdfRendererError(
            "Renderer did not return a PDF."
        )

    return response.content


def close_renderer():
    """
    Close the shared HTTP client.
    """

    _client.close()