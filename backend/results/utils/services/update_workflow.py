from ...models import (
    ResultWorkflow,
    SubjectResultStatus, 
    Result, 
 
)

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
