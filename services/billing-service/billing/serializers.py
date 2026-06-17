from rest_framework import serializers
from .models import Invoice, Payment, Budget, Salary


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ["id", "student_external_id", "student_name", "label", "amount",
                  "due_date", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "status", "created_at", "updated_at"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "student_external_id", "student_name", "invoice",
                  "amount", "method", "reference", "paid_at", "notes"]
        read_only_fields = ["id", "paid_at"]


class BudgetSerializer(serializers.ModelSerializer):
    remaining = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Budget
        fields = ["id", "label", "total", "spent", "remaining", "academic_year", "created_at"]
        read_only_fields = ["id", "spent", "created_at"]


class SalarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Salary
        fields = ["id", "teacher_external_id", "teacher_name", "month",
                  "amount", "paid", "paid_at", "notes"]
        read_only_fields = ["id", "paid_at"]
