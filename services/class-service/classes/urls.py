from django.urls import path
from . import views

urlpatterns = [
    path("", views.ClasseListCreateView.as_view(), name="classe-list"),
    path("<int:pk>/", views.ClasseDetailView.as_view(), name="classe-detail"),
    path("enrollments/", views.EnrollmentListCreateView.as_view(), name="enrollment-list"),
    path("enrollments/<int:pk>/", views.EnrollmentDetailView.as_view(), name="enrollment-detail"),
    path("health/", views.health_check, name="health"),
]
