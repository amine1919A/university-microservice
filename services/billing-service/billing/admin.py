from django.contrib import admin
from .models import Invoice, Payment, Budget, Salary

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ["student_name", "label", "amount", "due_date", "status"]
    list_filter = ["status", "due_date"]

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["student_name", "amount", "method", "paid_at"]
    list_filter = ["method"]

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ["label", "total", "spent", "academic_year"]

@admin.register(Salary)
class SalaryAdmin(admin.ModelAdmin):
    list_display = ["teacher_name", "month", "amount", "paid"]
    list_filter = ["paid", "month"]
