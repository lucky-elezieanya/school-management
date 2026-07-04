from django.contrib import admin
from atexit import register
from .models import User

# Register your models here.


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'first_name', 'middle_name', 'last_name', 'role', 'gender', 'date_of_birth', 'is_staff', 'email')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    list_filter = ('role', 'gender')
