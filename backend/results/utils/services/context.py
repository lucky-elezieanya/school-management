from collections import defaultdict
from django.conf import settings
from academics.models import (
    StudentEnrollment,
    SchoolAsset,
    Term,
)
from urllib.parse import urljoin
from ...models import (
    ClassFees,
    ClassTeacherSignature,
    HeadTeacherSignature,
    ResultCustomization,
    Attendance,
    Behaviour,
    ResumptionDate,
    Result,
    ResultSummary,
    SubjectSummary,
    TermComment,
    SchoolDays,
    GradingScale
)
from .calculations import calculate_class_statistics

class ResultSnapshotContext:
    """
    Loads every object required to build all student snapshots
    for a class in one pass.

    After this class is instantiated, NO MORE DATABASE QUERIES
    should be required while building snapshots.
    """

    def __init__(
        self,
        *,
        school_class,
        session,
        term,
        request=None
    ):
        self.school_class = school_class
        self.session = session
        self.term = term
        self.request=request
        self.load()
        
    def load(self):

            self.load_enrollments()
            self.load_terms()
            self.load_signatures()
            self.load_results()

            self.load_result_summaries()

            self.load_attendance()

            self.load_behaviour()

            self.load_comments()

            self.load_globals()
            self.load_term_history()

            self.load_grading_scales()

            self.load_class_statistics()

            self.attach_subject_summaries()

    

    def absolute_url(self, obj):
        if not obj:
            return None

        if isinstance(obj, str):
            url = obj
        else:
            try:
                url = obj.url
            except ValueError:
                return None

        if self.request:
            return self.request.build_absolute_uri(url)

        return urljoin(settings.SITE_URL, url)

    def load_terms(self):
        self.terms = Term.objects.filter(session=self.session)
     
        
    def load_signatures(self): 
        class_teacher_signature = ClassTeacherSignature.objects.filter(school_class=self.school_class, is_active=True).first()
        head_teacher_signature = HeadTeacherSignature.objects.filter(is_active=True).first()
        self.teacher_signature = (self.absolute_url(class_teacher_signature.signature)
            if class_teacher_signature
            else None
        )

        self.principal_signature = (
            self.absolute_url(head_teacher_signature.signature)
            if head_teacher_signature
            else None
        )
        
    def load_term_history(self):

        history = (
            Result.objects
            .filter(
                session=self.session,
                class_subject__school_class=self.school_class,
            )
            .values(
                "student_id",
                "class_subject_id",
                "term_id",
                "total_score",
            )
        )

        self.term_history = defaultdict(dict)

        for row in history:

            key = (
                row["student_id"],
                row["class_subject_id"],
            )

            self.term_history[key][
                row["term_id"]
            ] = row["total_score"]
      
    def load_grading_scales(self):

        self.overall_grading = list(

            GradingScale.objects.filter(
                grading_type="overall",
            )

        )

    def load_class_statistics(self):

        summaries = list(

            self.result_summaries.values()

        )

        self.class_statistics = calculate_class_statistics(
            summaries,
        )
        
    def load_enrollments(self):

        enrollments = (
            StudentEnrollment.objects
            .filter(
                school_class=self.school_class,
                session=self.session,
                is_current=True,
            )
            .select_related(
                "student",
                "student__user",
                "school_class",
                "school_class__arm",
            )
        )

        self.enrollments = {
            enrollment.student_id: enrollment
            for enrollment in enrollments
        }
        
    def load_results(self):

        results = (
            Result.objects
            .filter(
                class_subject__school_class=self.school_class,
                session=self.session,
                term=self.term,
            )
            .select_related(
                
                "student",
                "class_subject",
                "class_subject__subject",
            )
            .order_by(
                "class_subject__subject__name"
            )
        )

        self.results = defaultdict(list)

        for result in results:
            self.results[result.student_id].append(result)
            
    def load_result_summaries(self):

        summaries = (
            ResultSummary.objects.filter(
                school_class=self.school_class,
                session=self.session,
                term=self.term,
            )
        )

        self.result_summaries = {
            summary.student_id: summary
            for summary in summaries
        }
        
    def load_attendance(self):

        attendance = Attendance.objects.filter(
            school_class=self.school_class,
            session=self.session,
            term=self.term,
        )

        self.attendance = {
            item.student_id: item
            for item in attendance
        }
        
    def load_behaviour(self):

        behaviours = Behaviour.objects.filter(
            session=self.session,
            term=self.term,
            student__enrollments__school_class=self.school_class,
        )

        self.behaviours = defaultdict(list)

        for behaviour in behaviours:
            self.behaviours[
                behaviour.student_id
            ].append(behaviour)
            
    def load_comments(self):

        comments = TermComment.objects.filter(
            session=self.session,
            term=self.term,
            student__enrollments__school_class=self.school_class,
        )

        self.comments = {
            comment.student_id: comment
            for comment in comments
        }
        
    def load_globals(self):

        self.class_fee = (
            ClassFees.objects.filter(
                school_class=self.school_class,
                session=self.session,
                term=self.term,
            ).first()
        )

        self.customization = (
            ResultCustomization.objects.filter(
                session=self.session,
                term=self.term,
            ).first()
        )

        logo = SchoolAsset.objects.filter(asset_type="logo", is_active=True).first()
        header = SchoolAsset.objects.filter(asset_type="header", is_active=True).first()

        self.assets = {
            "logo": self.absolute_url(logo.image) if logo else None,
            "header": self.absolute_url(header.image) if header else None,
        }
        self.school_days = (
            SchoolDays.objects.filter(
                term=self.term,
            ).first()
        )

        self.resumption_date = (
            ResumptionDate.objects.filter(
                current_session=self.session,
                current_term=self.term,
            ).first()
        )
        
    def attach_subject_summaries(self):

        summaries = SubjectSummary.objects.filter(
            session=self.session,
            term=self.term,
            class_subject__school_class=self.school_class,
        )

        lookup = {

            (
                summary.student_id,
                summary.class_subject_id,
            ): summary

            for summary in summaries
        }

        for student_results in self.results.values():

            for result in student_results:

                result.summary = lookup.get(

                    (
                        result.student_id,
                        result.class_subject_id,
                    )

                )