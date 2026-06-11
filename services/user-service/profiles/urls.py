from django.urls import path
from . import views

urlpatterns = [
    path("", views.AddressListCreateView.as_view(), name="address-list"),
    path("<int:pk>/", views.AddressDetailView.as_view(), name="address-detail"),
]
