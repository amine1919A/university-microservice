from rest_framework import serializers
from .models import LiveSession, LiveParticipant, ChatMessage

class LiveSessionSerializer(serializers.ModelSerializer):
    participant_count = serializers.SerializerMethodField()
    class Meta:
        model = LiveSession
        fields = ["id","title","description","class_id","teacher_id","teacher_name","status","stream_key","scheduled_at","started_at","ended_at","participant_count","created_at"]
        read_only_fields = ["id","teacher_id","teacher_name","stream_key","started_at","ended_at","participant_count","created_at"]
    def get_participant_count(self, obj):
        return obj.participants.filter(left_at__isnull=True).count()

class LiveParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveParticipant
        fields = ["id","session","user_id","user_name","joined_at","left_at"]
        read_only_fields = ["id","joined_at"]

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id","session","user_id","user_name","message","created_at"]
        read_only_fields = ["id","created_at"]
