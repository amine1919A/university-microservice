from rest_framework import generics, filters, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.db.models import Avg, Sum, F, Value
from django.db.models.functions import Coalesce
from decimal import Decimal

from .models import Grade
from .serializers import GradeSerializer


class GradeListCreateView(generics.ListCreateAPIView):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["student_name", "subject_name"]
    ordering_fields = ["-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student_id")
        class_id = self.request.query_params.get("class_id")
        subject_id = self.request.query_params.get("subject_id")
        semester = self.request.query_params.get("semester")

        if student_id:
            qs = qs.filter(student_external_id=student_id)
        if class_id:
            qs = qs.filter(class_external_id=class_id)
        if subject_id:
            qs = qs.filter(subject_external_id=subject_id)
        if semester:
            qs = qs.filter(semester=semester)
        return qs


class GradeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def student_average(request, student_id):
    semester = request.query_params.get("semester")
    qs = Grade.objects.filter(student_external_id=student_id)
    if semester:
        qs = qs.filter(semester=semester)

    total_weighted = Decimal("0.0")
    total_coeff = Decimal("0.0")

    for grade in qs:
        total_weighted += grade.grade * grade.coefficient
        total_coeff += grade.coefficient

    average = round(total_weighted / total_coeff, 2) if total_coeff > 0 else 0

    return Response({
        "student_external_id": student_id,
        "semester": semester or "all",
        "average": str(average),
        "total_grades": qs.count(),
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def class_average(request, class_id):
    semester = request.query_params.get("semester")
    qs = Grade.objects.filter(class_external_id=class_id)
    if semester:
        qs = qs.filter(semester=semester)

    result = qs.aggregate(avg=Avg("grade"))
    return Response({
        "class_external_id": class_id,
        "semester": semester or "all",
        "average": str(round(result["avg"], 2)) if result["avg"] else "0",
        "total_grades": qs.count(),
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok", "service": "grade-service"})
