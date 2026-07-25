import logging
from io import BytesIO
from django.core.files.base import ContentFile
from celery import shared_task
from django.template.loader import render_to_string
from django.conf import settings
from weasyprint import HTML
import os
from django.db import transaction
from .models import ClassResultPDF, ResultPDF
from celery.exceptions import MaxRetriesExceededError
from .celery_utils import ProgressTask
from .services import (
    generate_result_summary_for_class,
    generate_subject_summaries_for_class, get_student_results,
    merge_class_result_pdfs
)

from academics.models import Class, StudentEnrollment, Term, AcademicSession

import os
from celery import shared_task
from django.conf import settings
from django.template.loader import render_to_string
from weasyprint import HTML



# =================== DJANGO Q FUNCTION ========================== #


import logging

from .utils.services.class_pdf_generator import (
    generate_class_pdfs,
)

logger = logging.getLogger(__name__)


def generate_result_pdfs_task(
    term_id: int,
    session_id: int,
    class_id: int,
):
    """
    Django-Q entry point.

    Generates every student's PDF for one class,
    then merges them into a class PDF.
    """

    logger.info(
        "Starting PDF generation "
        "for class=%s term=%s session=%s",
        class_id,
        term_id,
        session_id,
    )

    return generate_class_pdfs(
        school_class_id=class_id,
        term_id=term_id,
        session_id=session_id,
    )











# =================== DJANGO Q FUNCTION ========================== #

logger = logging.getLogger(__name__)

@shared_task(
    bind=True,
    base=ProgressTask,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def generate_result_pdfs_task_old(self, term_id, session_id):

    session = AcademicSession.objects.get(pk=session_id)
    term = Term.objects.get(pk=term_id)
    
    old_pdfs = ResultPDF.objects.filter(term=term, session=session,)

    for pdf in old_pdfs:
        if pdf.file:
            pdf.file.delete(save=False)

    old_pdfs.delete()
    
    old_class_pdfs = ClassResultPDF.objects.filter(
    term=term, session=session,)

    for pdf in old_class_pdfs:
        if pdf.file:
            pdf.file.delete(save=False)

    old_class_pdfs.delete()
    
    enrollments = (
        StudentEnrollment.objects
        .select_related(
            "student",
            "school_class",
        )
        .filter(
            session_id=session_id,
            is_current=True,
        )
    )

    total = enrollments.count()

    errors = []
    generated = 0
    processed_classes = set()

    for index, enrollment in enumerate(enrollments, start=1):
        
        school_class = enrollment.school_class
        processed_classes.add(school_class.id)        
        pdf_obj = None

        try:

            student = enrollment.student

            pdf_obj, _ = ResultPDF.objects.get_or_create(
                student=student,
                term=term,
                session=session,
                defaults={
                    "status": "PENDING",
                    "task_id": self.request.id,
                },
            )

            pdf_obj.status = "PROCESSING"
            pdf_obj.task_id = self.request.id
            pdf_obj.save(
                update_fields=[
                    "status",
                    "task_id",
                ]
            )

            context = get_student_results(
                student=student,
                term_id=term_id,
                session_id=session_id,
                school_class=school_class,
            )

            html_string = render_to_string(
                "results/pdf/result_sheet.html",
                {
                    **context,
                    "student": student,
                    "term": term,
                    "session": session,
                    "school_class": school_class
                },
            )

            file_name = (
                f"{student.admission_number}"
                f"_result_{session.name}_{term.name}.pdf"
            )

            # file_path = os.path.join(
            #     settings.MEDIA_ROOT,
            #     "results",
            #     "pdfs",
            #     file_name,
            # )

            # os.makedirs(
            #     os.path.dirname(file_path),
            #     exist_ok=True,
            # )

            # HTML(
            #     string=html_string,
            #     base_url=settings.BASE_DIR,
            # ).write_pdf(file_path)

            # pdf_obj.file = f"results/pdfs/{file_name}"
            # pdf_obj.status = "DONE"

            # pdf_obj.save(
            #     update_fields=[
            #         "file",
            #         "status",
            #     ]
            # )
            buffer = BytesIO()

            HTML(
                string=html_string,
                base_url=settings.BASE_DIR,
            ).write_pdf(buffer)

            buffer.seek(0)

            pdf_obj.file.save(
                f"results/pdfs/{file_name}",
                ContentFile(buffer.read()),
                save=False,
            )

            pdf_obj.status = "DONE"

            pdf_obj.save(
                update_fields=[
                    "file",
                    "status",
                ]
            )
            generated += 1

            try:
                self.set_progress(index, total)
            except Exception:
                pass

        except Exception as e:

            errors.append({
                "student": str(enrollment.student),
                "error": str(e),
                "type": e.__class__.__name__,
            })

            if pdf_obj:
                try:
                    pdf_obj.status = "FAILED"
                    pdf_obj.save(
                        update_fields=["status"]
                    )
                except Exception:
                    pass

            continue

    classes = Class.objects.select_related("arm").filter(id__in=processed_classes)
    for school_class in classes:    
        try:

            merge_class_result_pdfs(
                school_class,
                term,
                session,
            )

        except Exception as e:

            errors.append({
                "class": str(school_class),
                "merge_error": str(e),
            })

    return {
        "generated": generated,
        "failed": len(errors),
        "errors": errors,
        "term_id": term_id,
        "session_id": session_id,
        "task_id": self.request.id,
    }
    
@shared_task(
    bind=True,
    base=ProgressTask,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def generate_result_pdfs_for_class_task_old(self, term_id, session_id, class_id):
    # 1. Fetch Core Context Objects
    try:
        session = AcademicSession.objects.get(pk=session_id)
        term = Term.objects.get(pk=term_id)
        school_class = Class.objects.select_related("arm").get(pk=class_id)
    except (AcademicSession.DoesNotExist, Term.DoesNotExist, Class.DoesNotExist) as exc:
        return {"status": "failed", "error": f"Invalid core inputs: {str(exc)}"}

    # 2. Grab All Active Student Enrollments For This Specific Class
    enrollments = (
        StudentEnrollment.objects
        .select_related("student")
        .filter(
            session=session,
            school_class=school_class,
            is_current=True,
        )
    )
    total = enrollments.count()
    
    if total == 0:
        return {"generated": 0, "failed": 0, "message": "No active enrollments found for this class."}

    # Extract student instances to accurately target old individual PDFs
    students_in_class = [enrollment.student for enrollment in enrollments]

    # 3. Safe Cleanup of Existing Student PDFs for THIS Class Only
    old_pdfs = ResultPDF.objects.filter(
        term=term, 
        session=session, 
        student__in=students_in_class
    )
    for pdf in old_pdfs:
        if pdf.file:
            pdf.file.delete(save=False)
    old_pdfs.delete()

    # 4. Safe Cleanup of Existing Merged Class PDF
    old_class_pdfs = ClassResultPDF.objects.filter(
        term=term, 
        session=session, 
        school_class=school_class
    )
    for pdf in old_class_pdfs:
        if pdf.file:
            pdf.file.delete(save=False)
    old_class_pdfs.delete()

    # 5. Process Loops
    errors = []
    generated = 0

    for index, enrollment in enumerate(enrollments, start=1):
        pdf_obj = None
        student = enrollment.student
     

        try:
            # Get or create tracking object
            pdf_obj, _ = ResultPDF.objects.get_or_create(
                student=student,
                term=term,
                session=session,
                defaults={
                    "status": "PENDING",
                    "task_id": self.request.id,
                },
            )

            pdf_obj.status = "PROCESSING"
            pdf_obj.task_id = self.request.id
            pdf_obj.save(update_fields=["status", "task_id"])

            # Gather data and build HTML
            context = get_student_results(
                student=student,
                term_id=term_id,
                session_id=session_id,
                school_class=school_class,
            )

            html_string = render_to_string(
                "results/pdf/result_sheet.html",
                {
                    **context,
                    "student": student,
                    "term": term,
                    "session": session,
                    "school_class": school_class
                },
            )

            # Build and generate file path structure safely
            file_name = f"{student.admission_number}_result_{session.name}_{term.name}.pdf"
            # file_path = os.path.join(settings.MEDIA_ROOT, "results", "pdfs", file_name)
            # os.makedirs(os.path.dirname(file_path), exist_ok=True)

            # HTML(string=html_string, base_url=settings.BASE_DIR).write_pdf(file_path)

            # # Save the final file back to storage
            # pdf_obj.file = f"results/pdfs/{file_name}"
            # pdf_obj.status = "DONE"
            # pdf_obj.save(update_fields=["file", "status"])
            
            buffer = BytesIO()

            HTML(
                string=html_string,
                base_url=settings.BASE_DIR,
            ).write_pdf(buffer)

            buffer.seek(0)

            pdf_obj.file.save(
                f"results/pdfs/{file_name}",
                ContentFile(buffer.read()),
                save=False,
            )

            pdf_obj.status = "DONE"

            pdf_obj.save(update_fields=["file", "status"])
            
            generated += 1

            try:
                self.set_progress(index, total)
            except Exception:
                pass
        except Exception as e:
            
            logger.exception(
                "Failed generating PDF for %s", student
            )

            errors.append({
                "student": str(student),
                "error": str(e),
                "type": e.__class__.__name__,
            })

            if pdf_obj:
                pdf_obj.status = "FAILED"
                pdf_obj.save(update_fields=["status"])

            continue
    # 6. Execute Merged Document Generation
    try:
        merge_class_result_pdfs(
            school_class,
            term,
            session,
        )
    except Exception as e:
        errors.append({
            "class": str(school_class),
            "merge_error": str(e),
        })

    return {
        "generated": generated,
        "failed": len(errors),
        "errors": errors,
        "term_id": term_id,
        "session_id": session_id,
        "task_id": self.request.id,
    }
 
@shared_task(
    bind=True,
    base=ProgressTask,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def compute_all_results_task(self, term_id, session_id):

    classes = Class.objects.all()
    total = classes.count()

    results = []

    self.update_progress(
        0,
        total,
        "Starting full computation...",
    )

    for index, school_class in enumerate(classes, start=1):

        try:
            self.update_progress(
                index,
                total,
                f"Processing {school_class.name}...",
            )

            with transaction.atomic():

                class_result = generate_result_summary_for_class(
                    school_class_id=school_class.id,
                    term_id=term_id,
                    session_id=session_id,
                )

                subject_result = generate_subject_summaries_for_class(
                    school_class_id=school_class.id,
                    term_id=term_id,
                    session_id=session_id,
                )

            results.append({
                "class_id": school_class.id,
                "status": "success",
                "class_rows": class_result,
                "subject_rows": subject_result,
            })

        except Exception as exc:

            # IMPORTANT: do NOT crash entire computation
            results.append({
                "class_id": school_class.id,
                "status": "failed",
                "error": str(exc),
            })

            # retry only THIS task, not loop
            try:
                self.retry(exc=exc)
            except MaxRetriesExceededError:
                pass

    self.update_progress(
        total,
        total,
        "Computation completed",
    )

    return {
        "status": "completed",
        "results": results,
    }

@shared_task(
    bind=True,
    base=ProgressTask,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def compute_all_results_for_class_task(self, term_id, session_id, class_id):
    # 1. Fetch the specific class directly
    try:
        school_class = Class.objects.get(id=class_id)
    except Class.DoesNotExist as exc:
        self.update_progress(0, 1, "Class not found.")
        return {"status": "failed", "error": f"Class with ID:{class_id} does not exist."}

    # 2. Set progress to starting
    self.update_progress(0, 1, f"Starting computation for {school_class.name}...")

    try:
        # 3. Execute database operations inside a transaction block
        with transaction.atomic():
            class_result = generate_result_summary_for_class(
                school_class_id=school_class.id,
                term_id=term_id,
                session_id=session_id,
            )
            subject_result = generate_subject_summaries_for_class(
                school_class_id=school_class.id,
                term_id=term_id,
                session_id=session_id,
            )

        # 4. Mark progress as completed
        self.update_progress(1, 1, f"Computation completed for {school_class.name}")
        
        return {
            "status": "completed",
            "result": {
                "class_id": school_class.id,
                "class": school_class.name,
                "status": "success",
                "class_rows": class_result,
                "subject_rows": subject_result,
            }
        }

    except Exception as exc:
        # 5. Handle errors and trigger Celery's built-in retry mechanism
        self.update_progress(0, 1, f"Computation failed: {str(exc)}")
        
        try:
            raise self.retry(exc=exc)
        except MaxRetriesExceededError:
            return {
                "status": "failed",
                "result": {
                    "class_id": class_id,
                    "class": school_class.name,
                    "status": "failed",
                    "error": f"Max retries exceeded. Original error: {str(exc)}",
                }
            }

# ======================================================
# RECOMPUTE TASK (CLEANS + RE-RUNS)
# ======================================================

@shared_task(
    bind=True,
    base=ProgressTask,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def recompute_all_results_task(self, term_id, session_id):

    self.update_progress(0, 1, "Clearing existing summaries...")

    from .models import ResultSummary, SubjectSummary

    ResultSummary.objects.filter(
        term_id=term_id,
        session_id=session_id,
    ).delete()

    SubjectSummary.objects.filter(
        term_id=term_id,
        session_id=session_id,
    ).delete()

    self.update_progress(1, 2, "Recomputing results...")

    task = compute_all_results_task.delay(
        term_id=term_id,
        session_id=session_id,
    )

    return {
        "task_id": task.id,
        "status": "queued",
    }
