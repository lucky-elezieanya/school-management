"""
Production settings.
"""

from .base import *

# ==============================================================================
# CORE
# ==============================================================================

DEBUG = False

USE_S3_STORAGE = True


# ==============================================================================
# HOSTS
# ==============================================================================

ALLOWED_HOSTS = config("ALLOWED_HOSTS").split(",")

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS"
).split(",")

CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS"
).split(",")


# ==============================================================================
# STORAGE
# ==============================================================================

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}


MEDIA_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.backblazeb2.com/"


# ==============================================================================
# SECURITY
# ==============================================================================

SESSION_COOKIE_SECURE = True

CSRF_COOKIE_SECURE = True

SESSION_COOKIE_HTTPONLY = True

CSRF_COOKIE_HTTPONLY = False

SECURE_CONTENT_TYPE_NOSNIFF = True

SECURE_SSL_REDIRECT = True

SECURE_PROXY_SSL_HEADER = (
    ("HTTP_X_FORWARDED_PROTO", "https")
)

X_FRAME_OPTIONS = "DENY"

SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"


# ==============================================================================
# HSTS
# ==============================================================================

SECURE_HSTS_SECONDS = 31536000

SECURE_HSTS_INCLUDE_SUBDOMAINS = True

SECURE_HSTS_PRELOAD = True


# ==============================================================================
# WHITE NOISE
# ==============================================================================

WHITENOISE_MAX_AGE = 31536000


# ==============================================================================
# LOGGING
# ==============================================================================

LOGGING = {

    "version": 1,

    "disable_existing_loggers": False,

    "formatters": {

        "standard": {

            "format":
            "[{asctime}] {levelname} {name}: {message}",

            "style": "{",
        },

    },

    "handlers": {

        "console": {

            "class": "logging.StreamHandler",

            "formatter": "standard",

        },

    },

    "root": {

        "handlers": ["console"],

        "level": "INFO",

    },

}