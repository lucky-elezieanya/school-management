from django.db.models.signals import (
    post_save,
    post_delete,
  
)
from django.db import transaction
from django.dispatch import receiver

from .models import (
    SubjectResultStatus, Result
)
from .utils.services.update_workflow import update_result_workflow


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