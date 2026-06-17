import requests
from django.conf import settings
from django.db.models import Sum
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Invoice, Payment, Budget, Salary
from .serializers import InvoiceSerializer, PaymentSerializer, BudgetSerializer, SalarySerializer


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


class InvoiceListCreateView(generics.ListCreateAPIView):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["student_name", "label"]
    ordering_fields = ["-due_date"]

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student_id")
        status_param = self.request.query_params.get("status")
        if student_id:
            qs = qs.filter(student_external_id=student_id)
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    def create(self, request, *args, **kwargs):
        user = get_user_from_token(request)
        if not user or user.get("role") != "admin":
            return Response({"detail": "Seuls les administrateurs peuvent créer des factures"}, status=403)
        return super().create(request, *args, **kwargs)


class InvoiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer


class PaymentListCreateView(generics.ListCreateAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["student_name", "reference"]
    ordering_fields = ["-paid_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student_id")
        if student_id:
            qs = qs.filter(student_external_id=student_id)
        return qs

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        user = get_user_from_token(request)
        if user and user.get("role") == "student":
            data["student_external_id"] = user["id"]
            data["student_name"] = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        inv = payment.invoice
        if inv:
            total_paid = Payment.objects.filter(invoice=inv).aggregate(s=Sum("amount"))["s"] or 0
            if total_paid >= inv.amount:
                inv.status = "paid"
                inv.save()
        return Response(PaymentSerializer(payment).data, status=201)


class PaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


class BudgetListCreateView(generics.ListCreateAPIView):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer

    def create(self, request, *args, **kwargs):
        user = get_user_from_token(request)
        if not user or user.get("role") != "admin":
            return Response({"detail": "Seuls les administrateurs peuvent gérer le budget"}, status=403)
        return super().create(request, *args, **kwargs)


class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer


class SalaryListCreateView(generics.ListCreateAPIView):
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["teacher_name"]

    def get_queryset(self):
        qs = super().get_queryset()
        teacher_id = self.request.query_params.get("teacher_id")
        month = self.request.query_params.get("month")
        if teacher_id:
            qs = qs.filter(teacher_external_id=teacher_id)
        if month:
            qs = qs.filter(month=month)
        return qs

    def create(self, request, *args, **kwargs):
        user = get_user_from_token(request)
        if not user or user.get("role") != "admin":
            return Response({"detail": "Seuls les administrateurs peuvent gérer les salaires"}, status=403)
        return super().create(request, *args, **kwargs)


class SalaryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def summary(request):
    total_invoices = Invoice.objects.aggregate(t=Sum("amount"))["t"] or 0
    total_paid = Payment.objects.aggregate(t=Sum("amount"))["t"] or 0
    total_budget = Budget.objects.aggregate(t=Sum("total"))["t"] or 0
    total_spent = Budget.objects.aggregate(t=Sum("spent"))["t"] or 0
    return Response({
        "total_invoices": str(total_invoices),
        "total_paid": str(total_paid),
        "total_budget": str(total_budget),
        "total_spent": str(total_spent),
        "pending_invoices": Invoice.objects.filter(status="pending").count(),
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok", "service": "billing-service"})
