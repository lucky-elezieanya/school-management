from django.db.models.signals import (
    post_save,
    post_delete,
    pre_save,
)
from django.db import transaction
from django.dispatch import receiver

from .models import (
    ResultCustomization, SubjectResultStatus, Result
)
from .services import (
    update_result_workflow, 
)
from .tasks import generate_result_pdfs_task



# @receiver(pre_save, sender=ResultCustomization)
# def remember_previous(sender, instance, **kwargs):
#     if not instance.pk:
#         instance._changed = True
#         return

#     old = sender.objects.get(pk=instance.pk)
#     FIELDS_TO_TRACK = [
#     field.name
#     for field in ResultCustomization._meta.fields
#     if field.name not in {"id", "term", "session", "created_at", "updated_at"}
# ]

#     instance._changed = any(
#         getattr(old, field) != getattr(instance, field)
#         for field in FIELDS_TO_TRACK
#     )

# @receiver(post_save, sender=ResultCustomization)
# def regenerate_results(sender, instance, created, **kwargs):
#     if created or getattr(instance, "_changed", False):
#         generate_result_pdfs_task.delay(
#             instance.term_id,
#             instance.session_id,
#         )

@receiver(
    post_save,
    sender=SubjectResultStatus,
)
def update_workflow_after_save(sender, instance, **kwargs,):
    update_result_workflow(school_class=instance.school_class, term=instance.term, session=instance.session, )
    
@receiver(
    post_delete, sender=SubjectResultStatus,)
def update_workflow_after_delete(sender, instance, **kwargs,):
    update_result_workflow(
        school_class=instance.school_class,
        term=instance.term,
        session=instance.session,
    )
    

@receiver(post_save, sender=Result)
def update_workflow_after_result_save(sender, instance, **kwargs):
    transaction.on_commit(lambda: update_result_workflow(
        instance.class_subject.school_class,
        instance.term,
        instance.session,
    ))
@receiver(post_delete, sender=Result)
def update_workflow_after_result_delete(sender, instance, **kwargs):
    update_result_workflow(
        school_class=instance.class_subject.school_class,
        term=instance.term,
        session=instance.session,
    )