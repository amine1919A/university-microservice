from django.urls import path
from . import views

urlpatterns = [
    path("", views.ComplaintListCreateView.as_view(), name="complaint-list"),
    path("<int:pk>/", views.ComplaintDetailView.as_view(), name="complaint-detail"),
    path("<int:pk>/respond/", views.respond_complaint, name="complaint-respond"),
]
