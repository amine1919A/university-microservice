from rest_framework import serializers
from .models import Subject, SubjectAssignment


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name", "code", "coefficient", "description", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class SubjectAssignmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    class Meta:
        model = SubjectAssignment
        fields = [
            "id", "subject", "subject_name", "teacher_external_id", "teacher_name",
            "class_external_id", "class_name", "hours_per_week", "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
