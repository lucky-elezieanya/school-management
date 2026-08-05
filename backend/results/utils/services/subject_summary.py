from decimal import Decimal

from ...models import Result, SubjectSummary
from django.db import transaction

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
   