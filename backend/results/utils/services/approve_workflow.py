from django.utils import timezone
from .compute import compute

def approve_workflow(
    request,
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
    
    # Run calculation without strict precheck blocking
    compute(request, school_class_id, session_id, term_id, enforce_prechecks=False)
    return True