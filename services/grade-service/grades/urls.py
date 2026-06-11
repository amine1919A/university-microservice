from django.urls import path
from . import views

urlpatterns = [
    path("", views.GradeListCreateView.as_view(), name="grade-list"),
    path("<int:pk>/", views.GradeDetailView.as_view(), name="grade-detail"),
    path("student/<int:student_id>/average/", views.student_average, name="student-average"),
    path("class/<int:class_id>/average/", views.class_average, name="class-average"),
    path("health/", views.health_check, name="health"),
]
