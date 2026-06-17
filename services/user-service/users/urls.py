from django.urls import path
from . import views

urlpatterns = [
    path("students/", views.StudentListCreateView.as_view(), name="student-list"),
    path("students/<int:pk>/", views.StudentDetailView.as_view(), name="student-detail"),
    path("teachers/", views.TeacherListCreateView.as_view(), name="teacher-list"),
    path("teachers/<int:pk>/", views.TeacherDetailView.as_view(), name="teacher-detail"),
    path("specialties/", views.TeacherSpecialtyListCreateView.as_view(), name="specialty-list"),
    path("specialties/<int:pk>/", views.TeacherSpecialtyDetailView.as_view(), name="specialty-detail"),
    path("unassigned-students/", views.unassigned_students, name="unassigned-students"),
]
