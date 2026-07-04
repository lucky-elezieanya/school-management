from django.apps import AppConfig


class AcademicsConfig(AppConfig):
    name = 'academics'
    def ready(self):
        from . import signals
