"""
Base Django settings.

Shared between development and production.

Environment-specific settings are in:
    - development.py
    - production.py
"""

from pathlib import Path
from datetime import timedelta
from decouple import config

# ==============================================================================
# PATHS
# ==============================================================================

BASE_DIR = Path(__file__).resolve().parent.parent.parent


# ==============================================================================
# CORE
# ==============================================================================

SECRET_KEY = config("SECRET_KEY")

FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3000")
PDF_RENDER_SECRET = config("PDF_RENDER_SECRET", default="")


# ==============================================================================
# APPLICATIONS
# ==============================================================================

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "storages",
]

LOCAL_APPS = [
    "accounts",
    "academics",
    "results",
    "news",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS


# ==============================================================================
# MIDDLEWARE
# ==============================================================================

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",

    "whitenoise.middleware.WhiteNoiseMiddleware",

    "corsheaders.middleware.CorsMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",

    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ==============================================================================
# URLS
# ==============================================================================

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"

ASGI_APPLICATION = "config.asgi.application"


# ==============================================================================
# TEMPLATES
# ==============================================================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ==============================================================================
# DATABASE
# ==============================================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DATABASE_NAME"),
        "USER": config("DATABASE_USER"),
        "PASSWORD": config("DATABASE_PASSWORD"),
        "HOST": config("DATABASE_HOST"),
        "PORT": config("DATABASE_PORT", default="5432"),
        "CONN_MAX_AGE": 600,
    }
}


# ==============================================================================
# PASSWORD VALIDATION
# ==============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# ==============================================================================
# INTERNATIONALIZATION
# ==============================================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Africa/Lagos"

USE_I18N = True

USE_TZ = True


# ==============================================================================
# STATIC FILES
# ==============================================================================

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_DIRS = [
    BASE_DIR / "static",
]

STATICFILES_STORAGE = (
    "whitenoise.storage.CompressedManifestStaticFilesStorage"
)


# ==============================================================================
# MEDIA STORAGE
# ==============================================================================

USE_S3_STORAGE = False

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


# ==============================================================================
# BACKBLAZE B2
# ==============================================================================

AWS_ACCESS_KEY_ID = config("B2_KEY_ID", default="")

AWS_SECRET_ACCESS_KEY = config("B2_APPLICATION_KEY", default="")

AWS_STORAGE_BUCKET_NAME = config("B2_BUCKET_NAME", default="")

AWS_S3_REGION_NAME = config("B2_REGION", default="")

AWS_S3_ENDPOINT_URL = (
    f"https://s3.{AWS_S3_REGION_NAME}.backblazeb2.com"
    if AWS_S3_REGION_NAME
    else ""
)

AWS_S3_SIGNATURE_VERSION = "s3v4"

AWS_DEFAULT_ACL = None

AWS_QUERYSTRING_AUTH = True

AWS_QUERYSTRING_EXPIRE = 3600

AWS_S3_FILE_OVERWRITE = True

AWS_S3_VERIFY = True


# ==============================================================================
# STORAGES
# ==============================================================================

if USE_S3_STORAGE:

    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3.S3Storage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }

else:

    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }


# ==============================================================================
# REST FRAMEWORK
# ==============================================================================

REST_FRAMEWORK = {

    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),

    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),

    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],

    "DEFAULT_PAGINATION_CLASS":
        "rest_framework.pagination.PageNumberPagination",

    "PAGE_SIZE": 1000,

    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ],
}


# ==============================================================================
# JWT
# ==============================================================================

SIMPLE_JWT = {

    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=120),

    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),

    "ROTATE_REFRESH_TOKENS": True,

    "BLACKLIST_AFTER_ROTATION": False,

    "UPDATE_LAST_LOGIN": True,

    "TOKEN_OBTAIN_SERIALIZER":
        "accounts.serializers.CustomTokenObtainPairSerializer",

    "AUTH_HEADER_TYPES": ("Bearer",),

    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",

    "USER_ID_FIELD": "id",

    "USER_ID_CLAIM": "user_id",
}


# ==============================================================================
# AUTHENTICATION
# ==============================================================================

AUTH_USER_MODEL = "accounts.User"


# ==============================================================================
# DEFAULT PRIMARY KEY
# ==============================================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ==============================================================================
# CORS
# ==============================================================================

CORS_ALLOW_CREDENTIALS = True

WHITENOISE_ALLOW_ALL_ORIGINS = True


# ==============================================================================
# PROJECT SETTINGS
# ==============================================================================

SCHOOL_NAME = "Cozzi Schools"

DEFAULT_AVATAR = f"{STATIC_URL}images/avatar.png"

DEFAULT_HEADER = f"{STATIC_URL}images/cozzi-header.png"

DEFAULT_LOGO = f"{STATIC_URL}images/logo.jpg"

APPEND_SLASH = False