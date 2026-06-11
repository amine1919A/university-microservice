from django.contrib import admin
from .models import Grade

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ["student_name", "subject_name", "grade", "semester", "academic_year"]
    list_filter = ["semester", "academic_year", "subject_name"]
