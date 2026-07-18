from .snapshot_sections import (
    build_student,
    build_school,
    build_summary,
    build_subjects,
    build_attendance,
    build_fees,
    build_behaviour,
    build_comments,
    build_assets,
    build_customization,
)


class StudentSnapshotBuilder:
    """
    Builds the frontend snapshot JSON for a single student.

    This class NEVER performs database queries.
    This class NEVER saves anything to the database.
    """

    def __init__(
        self,
        context,
        student_id,
    ):
        self.context = context
        self.student_id = student_id

    def build(self):

        c = self.context

        enrollment = c.enrollments[self.student_id]

        student = enrollment.student

        summary = c.result_summaries.get(self.student_id)

        attendance = c.attendance.get(self.student_id)

        behaviours = c.behaviours.get(
            self.student_id,
            [],
        )

        results = c.results.get(
            self.student_id,
            [],
        )

        comments = c.comments.get(
            self.student_id,
        )

        snapshot = {

            "student": build_student(
                student,
            ),

            "school": build_school(
                enrollment,
                c.session,
                c.term,
            ),

            "summary": build_summary(

                summary=c.summary,

                class_statistics=c.class_statistics,

                grading_scales=c.overall_grading,

                resumption_date=c.resumption_date,

            ),

            "attendance": build_attendance(
                attendance,
                c.school_days,
            ),

            "fees": build_fees(
                c.class_fee,
            ),

            "subjects": build_subjects(
                c
            ),

            "behaviour": build_behaviour(
                behaviours,
            ),

            "comments": build_comments(
                comments,
            ),

            "assets": build_assets(
                c.assets,
            ),

            "customization": build_customization(
                c.customization,
            ),

        }

        return snapshot