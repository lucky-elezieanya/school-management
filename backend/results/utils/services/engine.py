from django.db import transaction

from academics.models import StudentEnrollment
from ..helpers import make_json_safe

from ...models import StudentResultSnapshot

from .context import ResultSnapshotContext

from .snapshot_builder import StudentSnapshotBuilder

from ...services import (
    generate_subject_summaries_for_class,
    generate_result_summary_for_class,
)


class ResultEngine:

    def __init__(
        self,
        school_class,
        session,
        term,
        request=None
    ):
        self.school_class = school_class
        self.session = session
        self.term = term
        self.request = request

    def save_snapshots(self, snapshots):

        existing = {

            snapshot.student_id: snapshot

            for snapshot in StudentResultSnapshot.objects.filter(
                school_class=self.school_class,
                session=self.session,
                term=self.term,
            )

        }

        to_create = []

        to_update = []

        for item in snapshots:

            student = item["student"]

            data = item["snapshot"]

            if student.id in existing:

                snapshot = existing[student.id]

                snapshot.data = data

                snapshot.status = StudentResultSnapshot.STATUS_READY
                snapshot.version += 1

                to_update.append(snapshot)

            else:

                to_create.append(

                    StudentResultSnapshot(

                        student_id=student.id,

                        school_class=self.school_class,

                        session=self.session,

                        term=self.term,

                        status=StudentResultSnapshot.STATUS_READY,

                        data=data,

                    )

                )

        if to_create:

            StudentResultSnapshot.objects.bulk_create(
                to_create,
                batch_size=500,
            )

        if to_update:

            StudentResultSnapshot.objects.bulk_update(

                to_update,

                [
                    "data",
                    "status",
                    "version"
                ],

                batch_size=500,

            )

    @transaction.atomic
    def compute(self):

        # ----------------------------------------------------
        # Step 1
        # Compute summaries
        # ----------------------------------------------------

        generate_subject_summaries_for_class(
            self.school_class.id,
            self.term.id,
            self.session.id,
        )

        generate_result_summary_for_class(
            self.school_class.id,
            self.term.id,
            self.session.id,
        )

        # ----------------------------------------------------
        # Step 2
        # Load EVERYTHING once
        # ----------------------------------------------------

        context = ResultSnapshotContext(
            school_class=self.school_class,
            session=self.session,
            term=self.term,
            request=self.request
        )

        # ----------------------------------------------------
        # Step 3
        # Build snapshots
        # ----------------------------------------------------

        snapshots = []

        for enrollment in context.enrollments.values():

            snapshot = StudentSnapshotBuilder(
                context=context,
                student_id=enrollment.student_id,
            ).build()
            
            snapshot = make_json_safe(snapshot)

            snapshots.append(
                {
                    "student": enrollment.student,
                    "snapshot": snapshot,
                }
            )

        # ----------------------------------------------------
        # Step 4
        # Persist
        # ----------------------------------------------------

        self.save_snapshots(snapshots)

        return len(snapshots)