from django.conf import settings
from decimal import Decimal
from datetime import date, datetime
from uuid import UUID
from django.db.models import Model
from django.db.models.fields.files import FieldFile


def make_json_safe(value):

    if isinstance(value, dict):
        return {
            k: make_json_safe(v)
            for k, v in value.items()
        }

    if isinstance(value, list):
        return [
            make_json_safe(v)
            for v in value
        ]

    if isinstance(value, tuple):
        return [
            make_json_safe(v)
            for v in value
        ]

    if isinstance(value, Decimal):
        return str(value)

    if isinstance(value, UUID):
        return str(value)

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, FieldFile):
        return value.url if value else None

    if isinstance(value, Model):
        return value.pk

    return value

def weasyprint_src(file_field):
    if not file_field:
        return None

    if settings.DEBUG:
        return f"file://{file_field.path}"

    return file_field.url

