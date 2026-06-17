from django.urls import path
from . import views

urlpatterns = [
    path("", views.InvoiceListCreateView.as_view(), name="invoice-list"),
    path("<int:pk>/", views.InvoiceDetailView.as_view(), name="invoice-detail"),
    path("payments/", views.PaymentListCreateView.as_view(), name="payment-list"),
    path("payments/<int:pk>/", views.PaymentDetailView.as_view(), name="payment-detail"),
    path("budgets/", views.BudgetListCreateView.as_view(), name="budget-list"),
    path("budgets/<int:pk>/", views.BudgetDetailView.as_view(), name="budget-detail"),
    path("salaries/", views.SalaryListCreateView.as_view(), name="salary-list"),
    path("salaries/<int:pk>/", views.SalaryDetailView.as_view(), name="salary-detail"),
    path("summary/", views.summary, name="billing-summary"),
    path("health/", views.health_check, name="health"),
]
