from rest_framework import serializers
from .models import Schedule


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = [
            "id", "class_external_id", "class_name", "subject_external_id",
            "subject_name", "teacher_external_id", "teacher_name",
            "day_of_week", "start_time", "end_time", "room",
            "academic_year", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
