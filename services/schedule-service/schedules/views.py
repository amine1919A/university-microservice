from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import Schedule
from .serializers import ScheduleSerializer


class ScheduleListCreateView(generics.ListCreateAPIView):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["class_name", "subject_name", "teacher_name", "room"]
    ordering_fields = ["day_of_week", "start_time"]

    def get_queryset(self):
        qs = super().get_queryset()
        class_id = self.request.query_params.get("class_id")
        teacher_id = self.request.query_params.get("teacher_id")
        day = self.request.query_params.get("day")

        if class_id:
            qs = qs.filter(class_external_id=class_id)
        if teacher_id:
            qs = qs.filter(teacher_external_id=teacher_id)
        if day:
            qs = qs.filter(day_of_week=day)
        return qs


class ScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def class_timetable(request, class_id):
    schedules = Schedule.objects.filter(class_external_id=class_id, is_active=True)
    serializer = ScheduleSerializer(schedules, many=True)
    return Response({"class_id": class_id, "schedules": serializer.data})


@api_view(["GET"])
@permission_classes([AllowAny])
def teacher_timetable(request, teacher_id):
    schedules = Schedule.objects.filter(teacher_external_id=teacher_id, is_active=True)
    serializer = ScheduleSerializer(schedules, many=True)
    return Response({"teacher_id": teacher_id, "schedules": serializer.data})


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok", "service": "schedule-service"})
