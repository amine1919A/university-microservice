from rest_framework import serializers
from .models import Classe, Enrollment


class ClasseSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    level = serializers.ChoiceField(choices=Classe.LEVEL_CHOICES, required=False, allow_blank=True)

    class Meta:
        model = Classe
        fields = [
            "id", "name", "level", "main_teacher", "academic_year",
            "capacity", "is_active", "student_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_student_count(self, obj):
        return obj.enrollments.filter(is_active=True).count()


class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ["id", "student_external_id", "student_name", "classe", "enrolled_at", "is_active"]
        read_only_fields = ["id", "enrolled_at"]


class EnrollmentBulkSerializer(serializers.Serializer):
    student_ids = serializers.ListField(child=serializers.IntegerField())
    classe_id = serializers.IntegerField()
