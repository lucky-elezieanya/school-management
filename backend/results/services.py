from decimal import Decimal
import os
from academics.models import AcademicSession, Class, SchoolAsset, StudentEnrollment, Term
from django.db import transaction
from django.db.models import (
    Count, 
    Sum,
    Max,
    Min
    )

from django.conf import settings
from .models import (
    Attendance,
    Behaviour,
    ClassFees,
    GradingScale,
    ResultCustomization,
    ResultWorkflow,
    SchoolDays,
    SubjectResultStatus, 
    Result, 
    ResultSummary, 
    SubjectSummary,    
    ClassFees,
    ResumptionDate,
    TermComment,
    ClassTeacherSignature,
    HeadTeacherSignature,
    ResultPDF, 
    ClassResultPDF
)
import io
import base64
import numpy as np
import matplotlib.pyplot as plt
import os
from django.conf import settings
from django.core.files import File
from pypdf import PdfWriter


from django.core.files import File
from pypdf import PdfWriter
import os

import logging
import os
import traceback

from django.conf import settings
from django.core.files import File
from pypdf import PdfWriter
logger = logging.getLogger(__name__)
from collections import defaultdict

def merge_class_result_pdfs(
    school_class,
    term,
    session,
):
    """
    Merge all generated student PDFs for one class.
    """
    try:

        pdfs = (
            ResultPDF.objects.filter(
                student__enrollments__school_class_id=school_class.id,
                student__enrollments__session_id=session.id,
                term=term,
                session=session,
                status="DONE",
                file__isnull=False,
            )
            .select_related("student")
            .distinct()
            .order_by("student__admission_number")
        )

    except Exception:
        print("\nERROR BUILDING QUERYSET")
        traceback.print_exc()
        raise

    if not pdfs.exists():
        print("NO PDFS FOUND FOR THIS CLASS")
        return None

    try:
        merged, created = ClassResultPDF.objects.get_or_create(
            school_class=school_class,
            term=term,
            session=session,
        )

        print(
            f"ClassResultPDF {'CREATED' if created else 'FOUND'}"
        )

    except Exception:
        print("\nERROR CREATING ClassResultPDF")
        traceback.print_exc()
        raise

    try:
        merged.status = "PROCESSING"
        merged.save(update_fields=["status"])

    except Exception:
        print("\nERROR SETTING PROCESSING STATUS")
        traceback.print_exc()
        raise

    output_dir = os.path.join(
        settings.MEDIA_ROOT,
        "results",
        "class_pdfs",
    )

    os.makedirs(output_dir, exist_ok=True)

    filename = (
        f"{school_class.name}_"
        f"{school_class.arm.code if school_class.arm else ''}_"
        f"{term.name}_"
        f"{session.name}.pdf"
    ).replace(" ", "_").replace("/", "-").replace("\\", "-")

    output_path = os.path.join(
        output_dir,
        filename,
    )

    writer = PdfWriter()

    try:
        print("\nSTARTING MERGE")

        for pdf in pdfs:

            print("-" * 60)

            try:
                path = pdf.file.path
            except Exception:
                print("Cannot obtain file.path")
                traceback.print_exc()
                continue

            exists = os.path.exists(path)

            print("Exists:", exists)

            if not exists:
                continue

            try:
                writer.append(path)
                print("APPENDED SUCCESSFULLY")

            except Exception:
                print("FAILED TO APPEND PDF")
                traceback.print_exc()

        print("Total merged pages:", len(writer.pages))

        with open(output_path, "wb") as f:
            writer.write(f)

        print("Merged PDF WRITTEN")

    except Exception:
        print("\nERROR DURING MERGING")
        traceback.print_exc()

        merged.status = "FAILED"
        merged.save(update_fields=["status"])

        raise

    finally:
        writer.close()

    try:

        if merged.file:
            print("Deleting previous merged file")
            merged.file.delete(save=False)

        with open(output_path, "rb") as f:

            merged.file.save(
                filename,
                File(f),
                save=False,
            )

        merged.status = "DONE"

        merged.save(
            update_fields=[
                "file",
                "status",
            ]
        )

        print("MERGED FILE SAVED SUCCESSFULLY")

    except Exception:
        print("\nERROR SAVING MERGED FILE")
        traceback.print_exc()

        merged.status = "FAILED"
        merged.save(update_fields=["status"])

        raise

    print("=" * 80)
    print("MERGE COMPLETE")
    print("=" * 80)

    return merged

def generate_chart(results):
    """
    results = [
        {
            "subject_code": "ENG",
            "total_score": 75,
            "subject_average": 64,
        }
    ]
    """

    subjects = [r["subject_code"] for r in results]
    scores = [float(r["total_score"]) for r in results]
    subject_averages = [
        float(r["subject_average"] or 0)
        for r in results
    ]

    x = np.arange(len(subjects)) * 1.4
    width = 0.5

    plt.figure(figsize=(14, 4))

    plt.bar(
        x,
        scores,
        width=width,
        label="Student Scores",
        zorder=3,
        color="blue"
    )

    plt.bar(
        x + width,
        subject_averages,
        width=width,
        label="Subject Average",
        zorder=3,
        color="purple"
    )

    plt.grid(
        True,
        axis="y",
        linestyle="-",
        alpha=1,
        zorder=0,
    )

    plt.grid(
        True,
        axis="x",
        linestyle="-",
        alpha=1,
        zorder=0,
    )

    plt.xticks(
        x + width / 2,
        subjects,
        rotation=45,
        ha="right",
    )

    plt.ylabel("Subject Scores")
    plt.ylim(0, 120)

    plt.legend()
    plt.tight_layout()

    buffer = io.BytesIO()

    plt.savefig(
        buffer,
        format="png",
        bbox_inches="tight",
    )

    buffer.seek(0)

    image_png = buffer.getvalue()

    graphic = base64.b64encode(image_png)

    buffer.close()
    plt.close()

    return (
        f"data:image/png;base64,"
        f"{graphic.decode('utf-8')}"
    )
    
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
     
def get_student_results(
    student,
    term_id,
    session_id,
    school_class,
):
    """
   RESULT ENGINE
    """
    student_id = student.id if hasattr(student, "id") else student
    days_school_opened = SchoolDays.objects.filter(term_id=term_id, session_id=session_id).first()
    # ==================================================
    # FEES
    # ==================================================
    fees = ClassFees.objects.filter(
        term_id=term_id,
        session_id=session_id,
        school_class=school_class.id,
    ).first()
    
    # ATTENDANCE
    
    attendance = Attendance.objects.filter(
        student_id=student.id,
        term_id=term_id,
        session_id=session_id,
    ).first()

    # BEHAVIOUR 
    behaviour = Behaviour.objects.filter(
        student_id=student.id,
        term_id=term_id,
        session_id=session_id,
    ).first()

    # ==================================================
    # TERM COMMENTS
    # ==================================================
    comments = TermComment.objects.filter(
        student_id=student_id,
        school_class=school_class.id,
        term_id=term_id,
        session_id=session_id,
    ).first()

    # ==================================================
    # RESUMPTION
    # ==================================================
    resumption = ResumptionDate.objects.filter(
        current_term_id=term_id,
        current_session_id=session_id,
    ).first()

    # ==================================================
    # SIGNATURES
    # ==================================================
    teacher_signature = (
        ClassTeacherSignature.objects.filter(
            school_class=school_class.id
        ).select_related("teacher").first()
    )
    # ==================================================
    # RESULT CUSTOMIZATION
    # ==================================================
    customization = (
        ResultCustomization.objects.filter(
            term_id=term_id,
            session_id=session_id,
        ).first()
    )

    # Use model defaults if no customization exists
    if not customization:
        customization = ResultCustomization(
            term_id=term_id,
            session_id=session_id,
        )

    head_teacher_signature = HeadTeacherSignature.objects.first()
    # RAW RESULTS 
    results_qs = (
        Result.objects
        .select_related("class_subject", "class_subject__subject")
        .filter(
            student_id=student.id,
            term_id=term_id,
            session_id=session_id,
            class_subject__school_class=school_class.id,
        )
        .order_by("class_subject__subject__name")
    )
  # CUMULATIVE RATIOS
   
    term_scores = defaultdict(dict)

    all_results = (
        Result.objects.filter(
            student_id=student.id,
            session_id=session_id,
            class_subject__school_class=school_class.id,
        )
        .values(
            "class_subject_id",
            "term_id",
            "total_score",
        )
    )

    for item in all_results:
        term_scores[item["class_subject_id"]][
            item["term_id"]
        ] = item["total_score"]
    # ==================================================
    # SUBJECT SUMMARY
    # ==================================================
    subject_summary_map = {
        s.class_subject_id: s
        for s in SubjectSummary.objects.filter(
            student_id=student_id,
            term_id=term_id,
            session_id=session_id,
        )
    }

    # ==================================================
    # OVERALL SUMMARY
    # ==================================================
    summary = ResultSummary.objects.filter(
        student_id=student_id,
        term_id=term_id,
        session_id=session_id,
        school_class=school_class.id,
    ).first()

        # ==================================================
    # OVERALL GRADE
    # ==================================================
    overall_grade = None
    overall_remark = None

    if summary:
        grading = (
            GradingScale.objects.filter(
                grading_type="overall",
                lower_limit__lte=summary.average_score,
                upper_limit__gte=summary.average_score,
            )
            .first()
        )

        if grading:
            overall_grade = grading.grade
            overall_remark = grading.remark
    # ==================================================
    # CLASS STATS
    # ==================================================
    class_stats = ResultSummary.objects.filter(
        school_class=school_class.id,
        term_id=term_id,
        session_id=session_id,
    ).aggregate(
        highest=Max("average_score"),
        lowest=Min("average_score"),
    )
    highest_average = class_stats["highest"] or 0
    lowest_average = class_stats["lowest"] or 0

    # ==================================================
    # ACTIVE LOGO
    # ==================================================
    active_logo = (
        SchoolAsset.objects
        .filter(asset_type="logo", is_active=True)
        .order_by("-created_at")
        .first()
    )
    active_header = (
        SchoolAsset.objects
        .filter(asset_type="header", is_active=True)
        .order_by("-created_at")
        .first()
    )

    # ==================================================
    # RESULTS BUILD
    # ==================================================
    results = []
    class_size =StudentEnrollment.objects.filter(
        school_class=school_class,
        session_id=session_id).count()

    terms = {
        t.name.lower(): t.id
        for t in Term.objects.filter(session_id=session_id)
    }
    for r in results_qs:
        subject_summary = subject_summary_map.get(r.class_subject_id)
        subject_terms = term_scores.get(
            r.class_subject_id,
            {},
        )

        first_term_total = subject_terms.get(
            terms.get("First Term")
        )

        second_term_total = subject_terms.get(
            terms.get("Second Term")
        )

        third_term_total = subject_terms.get(
            terms.get("Third Term")
        )

        scores = [
            s
            for s in [
                first_term_total,
                second_term_total,
                third_term_total,
            ]
            if s is not None
        ]

        cumulative_average = (
            round(sum(scores) / len(scores), 2)
            if scores
            else None
        )
        
        results.append({
            "subject_name": r.class_subject.subject.name,
            "subject_code": r.class_subject.subject.code,
            

            "first_test": r.first_test,
            "second_test": r.second_test,
            "exam_score": r.exam_score,
            "total_score": r.total_score, 
            "grade": r.grade,
            "remark": r.remark,

            "subject_average": subject_summary.subject_average if subject_summary else None,
            "subject_position": format_position(subject_summary.subject_position if subject_summary else None),
            
            "subject_score": subject_summary.score if subject_summary else None,
            "first_term_total": first_term_total,
            "second_term_total": second_term_total,
            "third_term_total": third_term_total,

            "cumulative_average": cumulative_average,
        })

    # ==================================================
    # CHART
    # ==================================================
    chart_image = generate_chart(results)

    # ==================================================
    # BEHAVIOUR TABLE
    # ==================================================
    behaviours = []

    if behaviour:
        behaviours = [
            ("Skills", behaviour.skills),
            ("Politeness", behaviour.politeness),
            ("Neatness", behaviour.neatness),
            ("Self Control", behaviour.self_control),
            ("Relationship", behaviour.relationship),
            ("Attendance", behaviour.attendance),
            ("Punctuality", behaviour.punctuality),
            ("Leadership", behaviour.leadership),
        ]

    # ==================================================
    # RETURN
    # ==================================================
    return {

    "header_path": (
        active_header.image.path
        if active_header and active_header.image
        else None
    ),

    "logo_path": (
        active_logo.image.path
        if active_logo and active_logo.image
        else None
    ),
    "teacher_signature_path": (
        teacher_signature.signature.path
        if teacher_signature and teacher_signature.signature
        else None
    ),
    "head_teacher_signature_path": (
        head_teacher_signature.signature.path
        if head_teacher_signature and head_teacher_signature.signature
        else None
    ),

    "default_header_path": os.path.join(
        settings.BASE_DIR,
        "static",
        "images",
        "cozzi-header.png",
    ),

    "default_logo_path": os.path.join(
        settings.BASE_DIR,
        "static",
        "images",
        "logo.jpg",
    ),

    "default_avatar_path": os.path.join(
        settings.BASE_DIR,
        "static",
        "images",
        "avatar.png",
    ),
        "student": student,

        "results": results,
        "chart_image": chart_image,

        "overall_total_score": summary.total_score if summary else 0,
        "overall_average_score": summary.average_score if summary else 0,
        "overall_class_average": summary.class_average if summary else 0,
        "class_position": format_position(summary.position) if summary else None,

        "total_subjects": summary.total_subjects if summary else len(results),

        "total_obtainable_score": (
            (summary.total_subjects if summary else len(results)) * 100
        ),

        "highest_score": f"{highest_average:.2f}",
        "lowest_score": f"{lowest_average:.2f}",
        "class_size": class_size,

        "next_fees": fees.amount if fees else 0,

        "attendance": attendance.attendance if attendance else 0,
        "days_school_opened": days_school_opened.days_school_opened if days_school_opened else 0,

        "behaviours": behaviours,
        "overall_grade": overall_grade,
        "overall_remark": overall_remark,
        "customization": customization,

        "teacher_comment": comments.class_teacher_comment if comments else "",
        "principal_comment": comments.principal_comment if comments else "",

        "resumption_date": resumption.resumption_date if resumption else None,

    }
    
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
            sum(r["total_score"] for r in aggregates)
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

