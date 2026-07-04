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

@shared_task(
    bind=True,
    base=ProgressTask,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def generate_result_pdfs_task(self, term_id, session_id):

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

            file_path = os.path.join(
                settings.MEDIA_ROOT,
                "results",
                "pdfs",
                file_name,
            )

            os.makedirs(
                os.path.dirname(file_path),
                exist_ok=True,
            )

            HTML(
                string=html_string,
                base_url=settings.BASE_DIR,
            ).write_pdf(file_path)

            pdf_obj.file = f"results/pdfs/{file_name}"
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
