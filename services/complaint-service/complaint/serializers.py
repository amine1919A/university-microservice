from rest_framework import serializers
from .models import Complaint


class ComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = [
            "id", "student_external_id", "student_name", "subject_external_id",
            "subject_name", "grade_type", "grade_value", "description",
            "status", "admin_response", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "status", "admin_response", "created_at", "updated_at"]
