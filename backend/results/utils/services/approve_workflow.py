
from time import timezone

from academics.models import Class, SchoolAsset, StudentEnrollment
from ...models import Attendance, Behaviour, ClassFees, ClassTeacherSignature, GradingScale, HeadTeacherSignature, ResumptionDate, SchoolDays, TermComment
from .engine import ResultEngine


def approve_workflow(
        self,
        workflow,
        user,
        school_class_id,
        session_id,
        term_id,
    ):
        if workflow.status == "Approved":
            return False

        workflow.status = "Approved"
        workflow.approved_by = user
        workflow.approved_at = timezone.now()
        workflow.save(update_fields=[
            "status",
            "approved_by",
            "approved_at",
        ])

        enrollment_count = StudentEnrollment.objects.filter(
            session_id=session_id,
            school_class_id=school_class_id,
            is_current=True,
        ).count()

        attendance_count = Attendance.objects.filter(
            term_id=term_id,
            session_id=session_id,
            school_class_id=school_class_id,
        ).count()

        behaviour_count = Behaviour.objects.filter(
            term_id=term_id,
            session_id=session_id,
            school_class_id=school_class_id,
        ).count()

        comment_count = TermComment.objects.filter(
            term_id=term_id,
            session_id=session_id,
            school_class_id=school_class_id,
        ).count()

        class_count = Class.objects.count()

        checks = {
            "attendance": attendance_count == enrollment_count,
            "behaviour": behaviour_count == enrollment_count,
            "comments": comment_count == enrollment_count,

            "grades": GradingScale.objects.filter(
                grading_type="subject"
            ).exists(),

            "school_days": SchoolDays.objects.filter(
                term_id=term_id,
                session_id=session_id,
            ).exists(),

            "school_assets": SchoolAsset.objects.filter(
                is_active=True,
                asset_type="logo",
            ).exists(),

            "class_teacher_signatures": (
                ClassTeacherSignature.objects.filter(
                    is_active=True,
                ).count()
                == class_count
            ),

            "head_teacher_signature": (
                HeadTeacherSignature.objects.filter(
                    is_active=True
                ).exists()
            ),

            "class_fees": (
                ClassFees.objects.filter(
                    term_id=term_id,
                    session_id=session_id,
                ).count()
                == class_count
            ),

            "resumption_date": ResumptionDate.objects.filter(
                current_term_id=term_id,
                current_session_id=session_id,
            ).exists(),
        }

        if all(checks.values()):
            ResultEngine(
                school_class=workflow.school_class,
                session=workflow.session,
                term=workflow.term,
                request=self.request
            ).compute()
            
            return True

        return False

 