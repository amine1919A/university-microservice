from rest_framework import serializers
from .models import Student, Teacher


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            "id", "external_id", "first_name", "last_name", "email",
            "phone", "enrollment_date", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "enrollment_date", "created_at", "updated_at"]


class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = [
            "id", "external_id", "first_name", "last_name", "email",
            "phone", "specialization", "hire_date", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "hire_date", "created_at", "updated_at"]
