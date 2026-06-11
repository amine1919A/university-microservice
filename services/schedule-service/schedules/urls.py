from django.urls import path
from . import views

urlpatterns = [
    path("", views.ScheduleListCreateView.as_view(), name="schedule-list"),
    path("<int:pk>/", views.ScheduleDetailView.as_view(), name="schedule-detail"),
    path("class/<int:class_id>/", views.class_timetable, name="class-timetable"),
    path("teacher/<int:teacher_id>/", views.teacher_timetable, name="teacher-timetable"),
    path("health/", views.health_check, name="health"),
]
