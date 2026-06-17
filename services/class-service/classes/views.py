from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import Classe, Enrollment
from .serializers import ClasseSerializer, EnrollmentSerializer


class ClasseListCreateView(generics.ListCreateAPIView):
    queryset = Classe.objects.all()
    serializer_class = ClasseSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "level"]
    ordering_fields = ["level", "name"]


class ClasseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Classe.objects.all()
    serializer_class = ClasseSerializer


class EnrollmentListCreateView(generics.ListCreateAPIView):
    queryset = Enrollment.objects.select_related("classe").all()
    serializer_class = EnrollmentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["student_name", "classe__name"]

    def get_queryset(self):
        qs = super().get_queryset()
        classe_id = self.request.query_params.get("classe_id")
        student_id = self.request.query_params.get("student_id")
        if classe_id:
            qs = qs.filter(classe_id=classe_id)
        if student_id:
            qs = qs.filter(student_external_id=student_id)
        return qs


class EnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok", "service": "class-service"})
