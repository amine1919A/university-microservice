from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path("me/", views.MeView.as_view(), name="auth-me"),
    path("admin-create/", views.AdminCreateUserView.as_view(), name="auth-admin-create"),
    path("change-password/", views.ChangePasswordView.as_view(), name="auth-change-password"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("users/", views.UserListView.as_view(), name="auth-user-list"),
    path("users/<int:pk>/", views.UserDetailView.as_view(), name="auth-user-detail"),
    path("admin-set-password/", views.AdminSetPasswordView.as_view(), name="auth-admin-set-password"),
    path("health/", views.health_check, name="auth-health"),
]
