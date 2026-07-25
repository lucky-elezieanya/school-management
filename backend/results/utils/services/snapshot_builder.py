from ...utils.chart_svg import generate_chart

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
        
        subjects = build_subjects(
                results=results,
                context=c,
            )

        snapshot = {

            "student": build_student(
                student,
          c.absolute_url
            ),

            "school": build_school(
                enrollment,
                c.session,
                c.term,
            ),

            "summary": build_summary(

                summary=summary,

                class_statistics=c.class_statistics,

                grading_scales=c.overall_grading,

                resumption_date=c.resumption_date,
                enrollments=c.enrollments

            ),

            "attendance": build_attendance(
                attendance,
                c.school_days,
            ),

            "fees": build_fees(
                c.class_fee,
            ),

            "subjects": subjects,
            "charts": {
            "performance": generate_chart(subjects),
                },
            "behaviour": build_behaviour(
                behaviours,
            ),

            "comments": build_comments(
                    teacher_comment=comments.class_teacher_comment,
                    principal_comment=comments.principal_comment,
                    teacher_signature=c.teacher_signature,
                    principal_signature=c.principal_signature,
            ),

            "assets": build_assets(
                c.assets,
            ),

            "customization": build_customization(
                c.customization,
            ),

        }

        return snapshot