from django.urls import path
from . import views

urlpatterns = [
    path("", views.SubjectListCreateView.as_view(), name="subject-list"),
    path("<int:pk>/", views.SubjectDetailView.as_view(), name="subject-detail"),
    path("assignments/", views.AssignmentListCreateView.as_view(), name="assignment-list"),
    path("assignments/<int:pk>/", views.AssignmentDetailView.as_view(), name="assignment-detail"),
    path("health/", views.health_check, name="health"),
]
