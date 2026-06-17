from rest_framework import serializers
from .models import Grade


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = [
            "id", "student_external_id", "student_name", "subject_external_id",
            "subject_name", "class_external_id", "teacher_external_id",
            "grade_type", "semester", "academic_year", "grade", "coefficient",
            "comment", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class GradeBulkSerializer(serializers.Serializer):
    grades = GradeSerializer(many=True)


class StudentReportSerializer(serializers.Serializer):
    student_external_id = serializers.IntegerField()
    student_name = serializers.CharField()
    semester = serializers.CharField()
    academic_year = serializers.CharField()
    subjects = serializers.ListField()
    total_average = serializers.DecimalField(max_digits=5, decimal_places=2)
