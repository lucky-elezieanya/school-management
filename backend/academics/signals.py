from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AcademicSession, Term


@receiver(post_save, sender=AcademicSession)
def create_terms(sender, instance, created, **kwargs):
    if created:
        terms = ["First Term", "Second Term", "Third Term"]

        for term in terms:
            Term.objects.create(
                name=term,
                session=instance
            )
