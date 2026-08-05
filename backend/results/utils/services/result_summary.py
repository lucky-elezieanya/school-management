from academics.models import  Class
from django.db import transaction
from django.db.models import (
    Count, 
    Sum,
    )
from ...models import (
    Result, 
    ResultSummary
)

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
