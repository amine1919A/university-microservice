from rest_framework import serializers
from .models import Student, Teacher, TeacherSpecialty


class TeacherSpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherSpecialty
        fields = ["id", "teacher", "specialty", "created_at"]
        read_only_fields = ["id", "created_at"]


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            "id", "external_id", "first_name", "last_name", "email",
            "phone", "enrollment_date", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "enrollment_date", "created_at", "updated_at"]


class TeacherSerializer(serializers.ModelSerializer):
    specialties = TeacherSpecialtySerializer(many=True, read_only=True)

    class Meta:
        model = Teacher
        fields = [
            "id", "external_id", "first_name", "last_name", "email",
            "phone", "specialization", "specialties", "hire_date", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "hire_date", "created_at", "updated_at"]
