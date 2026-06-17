from django.urls import path
from . import views
urlpatterns = [
    path("sessions/", views.LiveSessionListCreateView.as_view(), name="session-list"),
    path("sessions/<int:pk>/", views.LiveSessionDetailView.as_view(), name="session-detail"),
    path("sessions/<int:pk>/start/", views.start_session, name="session-start"),
    path("sessions/<int:pk>/end/", views.end_session, name="session-end"),
    path("sessions/<int:pk>/join/", views.join_session, name="session-join"),
    path("sessions/<int:pk>/leave/", views.leave_session, name="session-leave"),
    path("sessions/<int:pk>/messages/", views.session_messages, name="session-messages"),
]
