from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import Subject, SubjectAssignment
from .serializers import SubjectSerializer, SubjectAssignmentSerializer


class SubjectListCreateView(generics.ListCreateAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "code"]
    ordering_fields = ["name"]


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


class AssignmentListCreateView(generics.ListCreateAPIView):
    queryset = SubjectAssignment.objects.select_related("subject").all()
    serializer_class = SubjectAssignmentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["subject__name", "teacher_name", "class_name"]


class AssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SubjectAssignment.objects.all()
    serializer_class = SubjectAssignmentSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok", "service": "subject-service"})
