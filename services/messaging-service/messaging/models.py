from django.db import models

class Conversation(models.Model):
    participants = models.JSONField(default=list, help_text="Liste des user_ids participants")
    subject = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["-updated_at"]
    def __str__(self):
        return f"Conversation {self.id} - {self.subject or 'Sans sujet'}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender_id = models.IntegerField()
    sender_name = models.CharField(max_length=300)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["created_at"]
    def __str__(self):
        return f"Msg {self.id} from {self.sender_name}"
