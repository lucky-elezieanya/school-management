from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import date


class User(AbstractUser):
    ROLES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    )
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
    )
    role = models.CharField(max_length=20, choices=ROLES, default='admin')
    middle_name = models.CharField(max_length=30, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True, default="2010-01-01")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)

    @property
    def full_name(self):
        if self.middle_name:
            return f"{self.last_name}, {self.first_name} {self.middle_name} "
        return f"{self.last_name}, {self.first_name}"
    
    @property
    def age(self):
       
        if self.date_of_birth:
            today = date.today()
            age = today.year - self.date_of_birth.year
            if (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day):
                age -= 1
            return age
        return None

    def __str__(self):
        return self.username
    
    class Meta:
        ordering = [ "last_name", "first_name", "middle_name",]
