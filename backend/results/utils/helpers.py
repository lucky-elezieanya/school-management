from django.conf import settings

def weasyprint_src(file_field):
    if not file_field:
        return None

    if settings.DEBUG:
        return f"file://{file_field.path}"

    return file_field.url