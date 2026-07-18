from academics.models import Student
from django.conf import settings
from .calculations import (
    format_position,
    calculate_overall_grade,
    calculate_cumulative_average
)

def build_subjects(
   
    context
):
    results = context.results

    subject_summaries = context.subject_summaries

    term_history = context.term_history

    terms = context.terms
    subjects = []

    term_ids = [term.id for term in terms]

    first_term = term_ids[0] if len(term_ids) > 0 else None
    second_term = term_ids[1] if len(term_ids) > 1 else None
    third_term = term_ids[2] if len(term_ids) > 2 else None

    for result in results:

        summary = subject_summaries.get(
            result.class_subject_id
        )

        history = term_history.get(

            (
                result.student_id,
                result.class_subject_id,
            ),

            {},

        )

        first_term_total = history.get(first_term)

        second_term_total = history.get(second_term)

        third_term_total = history.get(third_term)

        cumulative_average = calculate_cumulative_average(

            [

                first_term_total,

                second_term_total,

                third_term_total,

            ]

        )

        subjects.append(

            {

                "subjectId":
                    result.class_subject.subject.id,

                "subjectName":
                    result.class_subject.subject.name,

                "subjectCode":
                    result.class_subject.subject.code,

                "firstTest":
                    result.first_test,

                "secondTest":
                    result.second_test,

                "examScore":
                    result.exam_score,

                "totalScore":
                    result.total_score,

                "grade":
                    result.grade,

                "remark":
                    result.remark,

                "subjectAverage":

                    summary.subject_average
                    if summary
                    else None,

                "subjectPosition":

                    format_position(
                        summary.subject_position
                    )
                    if summary
                    else None,

                "subjectScore":

                    summary.score
                    if summary
                    else None,

                "firstTermTotal":
                    first_term_total,

                "secondTermTotal":
                    second_term_total,

                "thirdTermTotal":
                    third_term_total,

                "cumulativeAverage":
                    cumulative_average,

            }

        )

    return subjects

def build_summary(
    summary,
    class_statistics,
    grading_scales,
    resumption_date,
):

    if summary:

        overall_grade, overall_remark = (
            calculate_overall_grade(
                average_score=summary.average_score,
                grading_scales=grading_scales,
            )
        )

        total_subjects = summary.total_subjects or 0

        return {

            "totalScore":
                summary.total_score,

            "totalObtainableScore":
                total_subjects * 100,

            "averageScore":
                summary.average_score,

            "classAverage":
                summary.class_average,

            "classPosition":
                format_position(summary.position),

            "classSize":
                summary.class_size,

            "totalSubjects":
                total_subjects,

            "highestScore":
                class_statistics.get("highest"),

            "lowestScore":
                class_statistics.get("lowest"),

            "overallGrade":
                overall_grade,

            "overallRemark":
                overall_remark,

            "resumptionDate":
                (
                    resumption_date.resumption_date
                    if resumption_date
                    else None
                ),

        }

    return {

        "totalScore": 0,

        "totalObtainableScore": 0,

        "averageScore": 0,

        "classAverage": 0,

        "classPosition": None,

        "classSize": 0,

        "totalSubjects": 0,

        "highestScore": None,

        "lowestScore": None,

        "overallGrade": None,

        "overallRemark": None,

        "resumptionDate": (
            resumption_date.resumption_date
            if resumption_date
            else None
        ),

    }

def build_student(student: Student):
    return {
        "id": student.id,
        "fullName": student.user.full_name,
        "gender": student.user.gender,
        "admissionNumber": student.admission_number,
        "profilePicture": (
            student.user.profile_picture.url
            if student.user.profile_picture
            else None
        ),
    }
    
def build_school(enrollment, session, term):
    return {

        "name": settings.SCHOOL_NAME,

        "schoolClass": {
            "id": enrollment.school_class.id,
            "name": enrollment.school_class.name,
            "arm": enrollment.school_class.arm.name,
        },

        "session": {
            "id": session.id,
            "name": session.name,
            "is_active": session.is_active,
        },

        "term": {
            "id": term.id,
            "name": term.name,
            "is_active": term.is_active,
        },
    }
    
def build_attendance(
    attendance,
    school_days,
):

    return {

        "attendance": attendance.attendance,

        "daysSchoolOpened":
            school_days.days_school_opened
            if school_days
            else 0,
    }
        
def build_fees(class_fee):

    return {

        "nextFees":
            class_fee.amount
            if class_fee
            else 0,
    }
    
def build_behaviour(behaviours):
    return {
        "items": [
            {
                "item":
                    b.behaviour.name,
                "grade":
                    b.grade,
            }
            for b in behaviours
        ]

    }

def build_comments(
    teacher_comment,
    principal_comment,
    teacher_signature,
    principal_signature,
):

    return {

        "teacher": {

            "text":
                teacher_comment or "",

            "signature":
                teacher_signature,
        },

        "principal": {

            "text":
                principal_comment or "",

            "signature":
                principal_signature,
        },

    }

def build_assets(settings):

    return {

        "logo":

            settings.logo.url
            if settings.logo
            else None,

        "header":

            settings.header.url
            if settings.header
            else None,

        "defaultLogo":
            settings.default_logo.url,

        "defaultHeader":
            settings.default_header.url,

        "defaultAvatar":
            settings.default_avatar.url,
    }

def build_customization(customization):

    return {

        "testScores":
            customization.test_scores,

        "subjectAverage":
            customization.subject_average,

        "subjectPosition":
            customization.subject_position,

        "subjectScore":
            customization.subject_score,

        "cumulativeAverage":
            customization.cumulative_average,

        "classAverage":
            customization.class_average,

        "classPosition":
            customization.class_position,

        "classSize":
            customization.class_size,

        "overallGrade":
            customization.overall_grade,

        "highestLowestScores":
            customization.highest_lowest_scores,

        "showBehaviour":
            customization.show_behaviour,

        "showTeacherComment":
            customization.show_teacher_comment,

        "showPrincipalComment":
            customization.show_principal_comment,

        "showPerformanceChart":
            customization.show_performance_chart,
    }