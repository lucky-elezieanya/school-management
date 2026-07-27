from decimal import Decimal
import os
from academics.models import  Class, SchoolAsset, StudentEnrollment, Term
from django.db import transaction
from django.db.models import (
    Count, 
    Sum,
    )
from .utils.helpers import weasyprint_src
from .models import (
    ResultWorkflow,
    SubjectResultStatus, 
    Result, 
    ResultSummary, 
    SubjectSummary,    
)
from django.conf import settings
import logging
from collections import defaultdict
from .utils.chart_svg import generate_chart
logger = logging.getLogger(__name__)

def format_position(position):
    n = int(position)

    if 11 <= n % 100 <= 13:
        suffix = "th"
    else:
        suffix = {
            1: "st",
            2: "nd",
            3: "rd"
        }.get(n % 10, "th")

    return f"{n}{suffix}"    
      
def update_result_workflow(school_class, term, session):
    workflow, _ = ResultWorkflow.objects.get_or_create(
        school_class=school_class,
        term=term,
        session=session,
    )

    statuses = SubjectResultStatus.objects.filter(
        school_class=school_class,
        term=term,
        session=session,
    )

    total_subjects = statuses.count()
    submitted_subjects = statuses.filter(is_submitted=True).count()

    all_submitted = (
        total_subjects > 0
        and total_subjects == submitted_subjects
    )

    # --------------------------------------------------
    # ALWAYS verify actual results exist
    # --------------------------------------------------

    has_results = Result.objects.filter(
        class_subject__school_class=school_class,
        term=term,
        session=session,
    ).exists()

    # If no results exist → force reset
    if not has_results:
        workflow.status = "Draft"
        workflow.all_results_submitted = False
        workflow.approved_by = None
        workflow.approved_at = None
        workflow.released_by = None
        workflow.released_at = None
        workflow.save()
        return workflow

    workflow.all_results_submitted = all_submitted

    # --------------------------------------------------
    
    # Any data change invalidates approval
    # --------------------------------------------------

    if workflow.status == "Approved":
        if not all_submitted:
            workflow.status = "Draft"
            workflow.approved_by = None
            workflow.approved_at = None

    # --------------------------------------------------
    # Normal state transitions
    # --------------------------------------------------

    if workflow.status not in ["Approved", "Released"]:
        workflow.status = (
            "Pending" if all_submitted else "Draft"
        )

    workflow.save()
    return workflow

def generate_result_summary_for_class(
    school_class_id,
    term_id,
    session_id,
):
    with transaction.atomic():

        aggregates = list(
            Result.objects.filter(
                class_subject__school_class_id=school_class_id,
                term_id=term_id,
                session_id=session_id,
            )
            .values("student_id")
            .annotate(
                total_score=Sum("total_score"),
                total_subjects=Count("id"),
            )
        )

        if not aggregates:
            ResultSummary.objects.filter(
                school_class_id=school_class_id,
                term_id=term_id,
                session_id=session_id,
            ).delete()
            return 0

        for row in aggregates:
            row["average_score"] = (
                row["total_score"] / row["total_subjects"]
                if row["total_subjects"]
                else 0
            )

        class_average = (
            sum(r["average_score"] for r in aggregates)
            / len(aggregates)
        )

        aggregates.sort(
            key=lambda x: x["total_score"],
            reverse=True,
        )

        previous_score = None
        previous_position = 0

        for index, row in enumerate(aggregates, start=1):
            if row["total_score"] != previous_score:
                previous_position = index

            row["position"] = previous_position
            previous_score = row["total_score"]

        existing = {
            s.student_id: s
            for s in ResultSummary.objects.filter(
                school_class_id=school_class_id,
                term_id=term_id,
                session_id=session_id,
            )
        }

        to_create = []
        to_update = []

        for row in aggregates:
            student_id = row["student_id"]

            if student_id in existing:
                s = existing[student_id]
                s.total_score = row["total_score"]
                s.average_score = row["average_score"]
                s.position = row["position"]
                s.class_average = class_average
                s.total_subjects = row["total_subjects"]
                to_update.append(s)
            else:
                to_create.append(
                    ResultSummary(
                        student_id=student_id,
                        school_class_id=school_class_id,
                        term_id=term_id,
                        session_id=session_id,
                        total_score=row["total_score"],
                        average_score=row["average_score"],
                        position=row["position"],
                        class_average=class_average,
                        total_subjects=row["total_subjects"],
                    )
                )

        if to_create:
            ResultSummary.objects.bulk_create(to_create, batch_size=500)

        if to_update:
            ResultSummary.objects.bulk_update(
                to_update,
                [
                    "total_score",
                    "average_score",
                    "position",
                    "class_average",
                    "total_subjects",
                ],
                batch_size=500,
            )

        return len(aggregates)

def generate_subject_summaries_for_class(
    school_class_id,
    term_id,
    session_id,
):
    with transaction.atomic():

        results = list(
            Result.objects.filter(
                class_subject__school_class_id=school_class_id,
                term_id=term_id,
                session_id=session_id,
            ).select_related("student", "class_subject")
        )

        if not results:

            SubjectSummary.objects.filter(
                class_subject__school_class_id=school_class_id,
                term_id=term_id,
                session_id=session_id,
            ).delete()

            return 0

        subject_groups = {}

        for r in results:
            subject_groups.setdefault(
                r.class_subject_id,
                []
            ).append(r)

        existing = {
            (s.student_id, s.class_subject_id): s
            for s in SubjectSummary.objects.filter(
                class_subject__school_class_id=school_class_id,
                term_id=term_id,
                session_id=session_id,
            )
        }

        to_create = []
        to_update = []

        for subject_id, subject_results in subject_groups.items():

            class_size = len(subject_results)

            total_score = sum(
                r.total_score for r in subject_results
            )

            subject_average = (
                total_score / class_size
                if class_size else Decimal("0")
            )

            ranked = sorted(
                subject_results,
                key=lambda r: r.total_score,
                reverse=True,
            )

            prev_score = None
            prev_position = 0

            for index, r in enumerate(ranked, start=1):

                if r.total_score != prev_score:
                    prev_position = index

                position = prev_position
                prev_score = r.total_score

                key = (r.student_id, r.class_subject_id)

                if key in existing:
                    s = existing[key]
                    s.score = r.total_score
                    s.subject_average = subject_average
                    s.subject_position = position
                    s.class_size = class_size
                    to_update.append(s)
                else:
                    to_create.append(
                        SubjectSummary(
                            student_id=r.student_id,
                            class_subject_id=r.class_subject_id,
                            term_id=term_id,
                            session_id=session_id,
                            score=r.total_score,
                            subject_average=subject_average,
                            subject_position=position,
                            class_size=class_size,
                        )
                    )

        if to_create:
            SubjectSummary.objects.bulk_create(to_create, batch_size=500)

        if to_update:
            SubjectSummary.objects.bulk_update(
                to_update,
                [
                    "score",
                    "subject_average",
                    "subject_position",
                    "class_size",
                ],
                batch_size=500,
            )

        return len(results)
     
def generate_all_results_for_term(term_id, session_id):
    """
    Runs computation for ALL classes in a term/session.
    """

    classes = Class.objects.all()

    results = []

    for c in classes:

        class_summary = generate_result_summary_for_class(
            school_class_id=c.id,
            term_id=term_id,
            session_id=session_id,
        )

        subject_summary = generate_subject_summaries_for_class(
            school_class_id=c.id,
            term_id=term_id,
            session_id=session_id,
        )

        results.append({
            "class_id": c.id,
            "class_name": str(c),
            "class_summary_count": class_summary,
            "subject_summary_count": subject_summary,
        })

    # ✅ RETURN ONLY AFTER LOOP COMPLETES
    return results

