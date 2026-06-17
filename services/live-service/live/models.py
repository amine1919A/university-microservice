from django.db import models

class LiveSession(models.Model):
    STATUS_CHOICES = [("scheduled","Planifié"),("live","En direct"),("ended","Terminé")]
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    class_id = models.IntegerField(blank=True, null=True)
    teacher_id = models.IntegerField()
    teacher_name = models.CharField(max_length=300)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")
    stream_key = models.CharField(max_length=100, blank=True, unique=True)
    scheduled_at = models.DateTimeField(blank=True, null=True)
    started_at = models.DateTimeField(blank=True, null=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["-created_at"]
    def __str__(self):
        return f"{self.title} ({self.status})"

class LiveParticipant(models.Model):
    session = models.ForeignKey(LiveSession, on_delete=models.CASCADE, related_name="participants")
    user_id = models.IntegerField()
    user_name = models.CharField(max_length=300)
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(blank=True, null=True)
    class Meta:
        unique_together = [["session", "user_id"]]
    def __str__(self):
        return f"{self.user_name} in {self.session.title}"

class ChatMessage(models.Model):
    session = models.ForeignKey(LiveSession, on_delete=models.CASCADE, related_name="messages")
    user_id = models.IntegerField()
    user_name = models.CharField(max_length=300)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["created_at"]
    def __str__(self):
        return f"{self.user_name}: {self.message[:50]}"
