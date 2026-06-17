from django.urls import path
from . import views
urlpatterns = [
    path("conversations/", views.ConversationListView.as_view(), name="conversation-list"),
    path("conversations/<int:pk>/", views.ConversationDetailView.as_view(), name="conversation-detail"),
    path("send/", views.send_message, name="send-message"),
    path("conversations/<int:pk>/read/", views.mark_read, name="mark-read"),
    path("unread/", views.unread_count, name="unread-count"),
    path("contacts/", views.contacts_list, name="contacts-list"),
]
