import secrets, requests
from django.utils import timezone
from django.conf import settings
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import LiveSession, LiveParticipant, ChatMessage
from .serializers import LiveSessionSerializer, LiveParticipantSerializer, ChatMessageSerializer

def get_user(request):
    auth = request.headers.get("Authorization","").split()
    if not auth or auth[0].lower() != "bearer":
        return None
    try:
        r = requests.get(f"{settings.AUTH_SERVICE_URL}/api/auth/me/", headers={"Authorization":f"Bearer {auth[1]}"}, timeout=5)
        if r.status_code == 200:
            return r.json()
    except:
        pass
    return None

class LiveSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = LiveSessionSerializer
    def get_queryset(self):
        qs = LiveSession.objects.all()
        user = get_user(self.request)
        if user and user.get("role") == "student":
            try:
                r = requests.get(f"http://class-service:8000/api/classes/enrollments/?student_id={user['id']}", timeout=5)
                if r.status_code == 200:
                    enrollments = r.json()
                    if isinstance(enrollments, dict) and "results" in enrollments:
                        enrollments = enrollments["results"]
                    class_ids = [e.get("classe") for e in enrollments if e.get("classe")]
                    if class_ids:
                        qs = qs.filter(class_id__in=class_ids)
                    else:
                        qs = qs.none()
            except:
                pass
        status_f = self.request.query_params.get("status")
        if status_f:
            qs = qs.filter(status=status_f)
        class_id = self.request.query_params.get("class_id")
        if class_id:
            qs = qs.filter(class_id=class_id)
        teacher_id = self.request.query_params.get("teacher_id")
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        return qs
    def perform_create(self, ser):
        user = get_user(self.request)
        if not user:
            raise PermissionDenied("Non authentifié")
        if user.get("role") == "admin":
            raise PermissionDenied("Les administrateurs ne peuvent pas créer de sessions live")
        stream_key = secrets.token_urlsafe(32)
        ser.save(teacher_id=user["id"] if user else 0, teacher_name=f"{user.get('first_name','')} {user.get('last_name','')}".strip() if user else "", stream_key=stream_key)

class LiveSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LiveSession.objects.all()
    serializer_class = LiveSessionSerializer

@api_view(["POST"])
def start_session(request, pk):
    user = get_user(request)
    if not user:
        return Response({"detail":"Non authentifié"}, status=401)
    try:
        s = LiveSession.objects.get(id=pk)
    except LiveSession.DoesNotExist:
        return Response({"detail":"Session introuvable"}, status=404)
    if s.teacher_id != user["id"]:
        return Response({"detail":"Seul le créateur peut démarrer"}, status=403)
    s.status = "live"
    s.started_at = timezone.now()
    s.save()
    return Response(LiveSessionSerializer(s).data)

@api_view(["POST"])
def end_session(request, pk):
    user = get_user(request)
    if not user:
        return Response({"detail":"Non authentifié"}, status=401)
    try:
        s = LiveSession.objects.get(id=pk)
    except LiveSession.DoesNotExist:
        return Response({"detail":"Session introuvable"}, status=404)
    if s.teacher_id != user["id"]:
        return Response({"detail":"Seul le créateur peut terminer"}, status=403)
    s.participants.all().delete()
    s.messages.all().delete()
    s.delete()
    return Response({"status":"deleted"})

@api_view(["POST"])
def join_session(request, pk):
    user = get_user(request)
    if not user:
        return Response({"detail":"Non authentifié"}, status=401)
    try:
        s = LiveSession.objects.get(id=pk)
    except LiveSession.DoesNotExist:
        return Response({"detail":"Session introuvable"}, status=404)
    if s.status != "live":
        return Response({"detail":"La session n'est pas en direct"}, status=400)
    if user.get("role") == "student" and s.class_id:
        try:
            r = requests.get(f"http://class-service:8000/api/classes/enrollments/?student_id={user['id']}&classe_id={s.class_id}", timeout=5)
            if r.status_code == 200:
                enrollments = r.json()
                if isinstance(enrollments, dict) and "results" in enrollments:
                    enrollments = enrollments["results"]
                if not enrollments:
                    return Response({"detail":"Vous n'êtes pas inscrit dans cette classe"}, status=403)
        except:
            return Response({"detail":"Erreur de vérification"}, status=500)
    p, _ = LiveParticipant.objects.get_or_create(session=s, user_id=user["id"], defaults={"user_name":f"{user.get('first_name','')} {user.get('last_name','')}".strip()})
    return Response(LiveParticipantSerializer(p).data)

@api_view(["POST"])
def leave_session(request, pk):
    user = get_user(request)
    if not user:
        return Response({"detail":"Non authentifié"}, status=401)
    try:
        p = LiveParticipant.objects.get(session_id=pk, user_id=user["id"], left_at__isnull=True)
    except LiveParticipant.DoesNotExist:
        return Response({"detail":"Pas dans la session"}, status=404)
    p.left_at = timezone.now()
    p.save()
    return Response({"status":"left"})

@api_view(["GET"])
def session_messages(request, pk):
    msgs = ChatMessage.objects.filter(session_id=pk)[:200]
    return Response(ChatMessageSerializer(msgs, many=True).data)
