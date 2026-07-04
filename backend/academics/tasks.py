from results.celery_utils import ProgressTask
from celery import shared_task
from django.utils import timezone
from .models import StudentImport
from .services.student_import import import_students


@shared_task(
    bind=True,
    base=ProgressTask,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def import_students_task(self, import_id):
    """
    Background task for importing students from an uploaded file.
    """

    student_import = StudentImport.objects.get(pk=import_id)

    student_import.status = "processing"
    student_import.started_at = timezone.now()
    student_import.save(update_fields=["status", "started_at"])

    try:
        self.update_progress(
            current=0,
            total=100,
            message="Preparing student import...",
        )

        result = import_students(
            file_path=student_import.file.path,
            progress_callback=self.update_progress,
        )

        student_import.status = "completed"
        student_import.completed_at = timezone.now()

        student_import.created_count = result["created_count"]
        student_import.skipped_count = result["skipped_count"]
        student_import.result = result

        student_import.save(
            update_fields=[
                "status",
                "completed_at",
                "created_count",
                "skipped_count",
                "result",
            ]
        )

        return result

    except Exception as exc:

        student_import.status = "failed"
        student_import.completed_at = timezone.now()
        student_import.error = str(exc)

        student_import.save(
            update_fields=[
                "status",
                "completed_at",
                "error",
            ]
        )

        raise