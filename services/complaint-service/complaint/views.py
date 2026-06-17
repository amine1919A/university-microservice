import requests
from django.conf import settings
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Complaint
from .serializers import ComplaintSerializer


def get_user_from_token(request):
    auth = request.headers.get("Authorization", "").split()
    if not auth or auth[0].lower() != "bearer":
        return None
    try:
        r = requests.get(
            f"{settings.AUTH_SERVICE_URL}/api/auth/me/",
            headers={"Authorization": f"Bearer {auth[1]}"},
            timeout=5,
        )
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return None


class ComplaintListCreateView(generics.ListCreateAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["student_name", "subject_name", "description"]
    ordering_fields = ["-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student_id")
        subject_id = self.request.query_params.get("subject_id")
        status_param = self.request.query_params.get("status")
        grade_type = self.request.query_params.get("grade_type")

        if student_id:
            qs = qs.filter(student_external_id=student_id)
        if subject_id:
            qs = qs.filter(subject_external_id=subject_id)
        if status_param:
            qs = qs.filter(status=status_param)
        if grade_type:
            qs = qs.filter(grade_type=grade_type)
        return qs

    def create(self, request, *args, **kwargs):
        user = get_user_from_token(request)
        if not user:
            return Response({"detail": "Non authentifié"}, status=401)
        if user.get("role") != "student":
            return Response({"detail": "Seuls les étudiants peuvent soumettre des réclamations"}, status=403)
        data = request.data.copy()
        data["student_external_id"] = user["id"]
        data["student_name"] = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ComplaintDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer

    def perform_update(self, serializer):
        user = get_user_from_token(self.request)
        if user and user.get("role") == "admin":
            serializer.save()
        else:
            serializer.save(status="pending")


@api_view(["POST"])
def respond_complaint(request, pk):
    user = get_user_from_token(request)
    if not user:
        return Response({"detail": "Non authentifié"}, status=401)
    if user.get("role") != "admin":
        return Response({"detail": "Seuls les administrateurs peuvent répondre"}, status=403)
    try:
        complaint = Complaint.objects.get(id=pk)
    except Complaint.DoesNotExist:
        return Response({"detail": "Réclamation introuvable"}, status=404)

    status_value = request.data.get("status", complaint.status)
    admin_response = request.data.get("admin_response", "")

    complaint.status = status_value
    complaint.admin_response = admin_response
    complaint.save()
    return Response(ComplaintSerializer(complaint).data)
