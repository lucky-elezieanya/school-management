import base64
import io
from django.utils import timezone

from django.conf import settings
from django.db.models import Max, Min
from collections import defaultdict

from ..models import (
    Attendance,
    Behaviour,
    ClassFees,
    ClassTeacherSignature,
    HeadTeacherSignature,
    ResumptionDate,
    SchoolDays,
    Result,
    ResultCustomization,
    ResultSummary,
    SubjectSummary,
    TermComment,
    GradingScale

)
from academics.models import (
    SchoolAsset,
    StudentEnrollment,
    Term,
    Student   
)
from ..services import generate_chart, format_position
from django.db.models import Max, Min

def absolute_media_url(request, file_field):
    """
    Returns an absolute URL for a FileField/ImageField.
    """

    if not file_field:
        return None

    return request.build_absolute_uri(file_field.url)

def school_asset_url(request, asset_type):
    asset = (
        SchoolAsset.objects
        .filter(
            asset_type=asset_type,
            is_active=True,
        )
        .order_by("-created_at")
        .first()
    )

    if not asset:
        return None

    return absolute_media_url(
        request,
        asset.image,
    )
    
def teacher_signature_url(
    request,
    school_class,
):
    signature = (
        ClassTeacherSignature.objects
        .filter(
            school_class=school_class
        )
        .select_related("teacher")
        .first()
    )

    if not signature:
        return None

    return absolute_media_url(
        request,
        signature.signature,
    )
    
def head_teacher_signature_url(request):

    signature = HeadTeacherSignature.objects.first()

    if not signature:
        return None

    return absolute_media_url(
        request,
        signature.signature,
    )
    
def student_passport_url(
    request,
    student,
):
    if (
        hasattr(student, "user")
        and student.user.profile_picture
    ):
        return absolute_media_url(
            request,
            student.user.profile_picture,
        )

    return None

def build_school_data(
    request,
    school_class,
):
    return {

        "name": settings.SCHOOL_NAME,

        "logo": school_asset_url(
            request,
            "logo",
        ),

        "header": school_asset_url(
            request,
            "header",
        ),

        "teacherSignature": teacher_signature_url(
            request,
            school_class,
        ),

        "principalSignature": head_teacher_signature_url(
            request,
        ),

    }
    
def build_student_data(
    request,
    student,
    school_class,
):
    return {

        "id": student.id,

        "name": student.user.full_name,

        "gender": student.user.gender,

        "passport": student_passport_url(
            request,
            student,
        ),

        "admissionNumber": student.admission_number,

        "className": (
            school_class.description
            or f"{school_class.name} {school_class.arm.name}"
        ),

    }
    
def build_chart_data(results):
    """
    Build chart data for the frontend.
    """

    chart = []

    for result in results:
        chart.append({
            "subject": result["subjectName"],
            "student": result["totalScore"],
            "average": result["subjectAverage"] or 0,
        })

    return chart

def build_summary_data(
    summary,
    school_class,
    session_id,
    attendance,
    fees,
    days_school_opened,
    resumption,
    highest_average,
    lowest_average,
    overall_grade,
    overall_remark,
    results,
):
    """
    Builds the summary section consumed by the React report card.
    """

    class_size = StudentEnrollment.objects.filter(
        school_class=school_class,
        session_id=session_id,
    ).count()

    total_subjects = (
        summary.total_subjects
        if summary
        else len(results)
    )

    return {

        "totalScore": summary.total_score if summary else 0,

        "obtainableScore": total_subjects * 100,

        "average": summary.average_score if summary else 0,

        "classAverage": (
            summary.class_average
            if summary
            else 0
        ),

        "position": (
            format_position(summary.position)
            if summary
            else None
        ),

        "classSize": class_size,

        "overallGrade": overall_grade,

        "overallRemark": overall_remark,

        "highestScore": round(highest_average, 2),

        "lowestScore": round(lowest_average, 2),

        "totalSubjects": total_subjects,

        "attendance": (
            attendance.attendance
            if attendance
            else 0
        ),

        "schoolOpened": (
            days_school_opened.days_school_opened
            if days_school_opened
            else 0
        ),

        "resumptionDate": (
            resumption.resumption_date
            if resumption
            else None
        ),

        "nextFees": (
            fees.amount
            if fees
            else 0
        ),
    }
    
def build_behaviour_data(behaviour):

    if not behaviour:
        return []

    return [

        {
            "item": "Skills",
            "grade": behaviour.skills,
        },

        {
            "item": "Politeness",
            "grade": behaviour.politeness,
        },

        {
            "item": "Neatness",
            "grade": behaviour.neatness,
        },

        {
            "item": "Self Control",
            "grade": behaviour.self_control,
        },

        {
            "item": "Relationship",
            "grade": behaviour.relationship,
        },

        {
            "item": "Attendance",
            "grade": behaviour.attendance,
        },

        {
            "item": "Punctuality",
            "grade": behaviour.punctuality,
        },

        {
            "item": "Leadership",
            "grade": behaviour.leadership,
        },

    ]
    
def build_comments(comments):

    return {

        "teacherComment": (
            comments.class_teacher_comment
            if comments
            else ""
        ),

        "principalComment": (
            comments.principal_comment
            if comments
            else ""
        ),

    }
    
def build_customization(customization):

    return {

        "class_position": customization.class_position,

        "class_size": customization.class_size,

        "class_average": customization.class_average,

        "overall_grade": customization.overall_grade,

        "highest_lowest_scores":
            customization.highest_lowest_scores,

        "test_scores":
            customization.test_scores,

        "cumulative_average":
            customization.cumulative_average,

        "subject_average":
            customization.subject_average,

        "subject_score":
            customization.subject_score,

        "subject_position":
            customization.subject_position,

        "performance_chart":
            customization.performance_chart,

        "show_behaviour":
            customization.show_behaviour,

        "show_teacher_comment":
            customization.show_teacher_comment,

        "show_principal_comment":
            customization.show_principal_comment,

    }
    
def build_results_data(
    results_qs,
    subject_summary_map,
    term_scores,
    terms,
):
    """
    Returns the complete subject result list.
    """

    results = []

    for r in results_qs:

        subject_summary = subject_summary_map.get(
            r.class_subject_id
        )

        subject_terms = term_scores.get(
            r.class_subject_id,
            {},
        )

        first_term_total = subject_terms.get(
            terms.get("first term")
        )

        second_term_total = subject_terms.get(
            terms.get("second term")
        )

        third_term_total = subject_terms.get(
            terms.get("third term")
        )

        scores = [

            score

            for score in (

                first_term_total,

                second_term_total,

                third_term_total,

            )

            if score is not None

        ]

        cumulative_average = (

            round(sum(scores) / len(scores), 2)

            if scores

            else None

        )

        results.append({

            "id": r.id,

            "subjectName":
                r.class_subject.subject.name,

            "subjectCode":
                r.class_subject.subject.code,

            "firstTest":
                r.first_test,

            "secondTest":
                r.second_test,

            "examScore":
                r.exam_score,

            "totalScore":
                r.total_score,

            "grade":
                r.grade,

            "remark":
                r.remark,

            "subjectAverage": (
                subject_summary.subject_average
                if subject_summary
                else None
            ),

            "subjectPosition": (
                format_position(
                    subject_summary.subject_position
                )
                if subject_summary
                and subject_summary.subject_position
                else None
            ),

            "subjectScore": (
                subject_summary.score
                if subject_summary
                else None
            ),

            "firstTermTotal":
                first_term_total,

            "secondTermTotal":
                second_term_total,

            "thirdTermTotal":
                third_term_total,

            "cumulativeAverage":
                cumulative_average,

        })

    return results



def get_student_report_data(request, student, school_class, term, session,):
    
    attendance = Attendance.objects.filter(
        student=student,
        term=term,
        session=session,
    ).first()
        
    behaviour = Behaviour.objects.filter(
        student=student,
        term=term,
        session=session,
    ).first()
    
    fees = ClassFees.objects.filter(
        school_class=school_class,
        term=term,
        session=session,
    ).first()
    
    school_days = SchoolDays.objects.filter(
        term=term,
        session=session,
    ).first()

    comments = TermComment.objects.filter(
        student=student,
        school_class=school_class,
        term=term,
        session=session,
    ).first()
    
    resumption = ResumptionDate.objects.filter(
        current_term=term,
        current_session=session,
    ).first()
    
    customization = (
        ResultCustomization.objects.filter(
            term=term,
            session=session,
        ).first()
    )

    if not customization:

        customization = ResultCustomization(
            term=term,
            session=session,
        )
        
    results_qs = (
        Result.objects
        .select_related(
            "class_subject",
            "class_subject__subject",
        )
        .filter(
            student=student,
            term=term,
            session=session,
            class_subject__school_class=school_class,
        )
        .order_by(
            "class_subject__subject__name"
        )
    )
    
    term_scores = defaultdict(dict)

    all_results = (
        Result.objects.filter(
            student=student,
            session=session,
            class_subject__school_class=school_class,
        ).values(
            "class_subject_id",
            "term_id",
            "total_score",
        )
    )

    for item in all_results:

        term_scores[item["class_subject_id"]][
            item["term_id"]
        ] = item["total_score"]
        
    subject_summary_map = {

        summary.class_subject_id: summary

        for summary in SubjectSummary.objects.filter(

            student=student,

            term=term,

            session=session,

        )

    }
    
    summary = ResultSummary.objects.filter(
        student=student,
        school_class=school_class,
        term=term,
        session=session,
    ).first()
    
    overall_grade = None
    overall_remark = None

    if summary:

        grading = (
            GradingScale.objects.filter(
                grading_type="overall",
                lower_limit__lte=summary.average_score,
                upper_limit__gte=summary.average_score,
            ).first()
        )

        if grading:

            overall_grade = grading.grade

            overall_remark = grading.remark
            
    class_stats = ResultSummary.objects.filter(
        school_class=school_class,
        term=term,
        session=session,
    ).aggregate(

        highest=Max("average_score"),

        lowest=Min("average_score"),

    )
    
    terms = {

        t.name.lower(): t.id

        for t in Term.objects.filter(
            session=session
        )

    }
    
    results = build_results_data(
        results_qs,
        subject_summary_map,
        term_scores,
        terms,
    )
    
    chart = build_chart_data(results)
    
    return {

        "school": build_school_data(
            request,
            school_class,
        ),

        "student": build_student_data(
            request,
            student,
            school_class,
        ),

        "summary": build_summary_data(

            summary,

            school_class,

            session.id,

            attendance,

            fees,

            school_days,

            resumption,

            class_stats["highest"] or 0,

            class_stats["lowest"] or 0,

            overall_grade,

            overall_remark,

            results,

        ),

        "session": session.name,

        "term": term.name,

        "results": results,

        "behaviours": build_behaviour_data(
            behaviour
        ),

        "comments": build_comments(
            comments
        ),

        "customization": build_customization(
            customization
        ),

        "chart": chart,

        "generatedDate": timezone.now().strftime(
            "%d/%m/%Y"
        ),

    }