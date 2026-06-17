from django.db import models

class Invoice(models.Model):
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("paid", "Payée"),
        ("overdue", "En retard"),
        ("cancelled", "Annulée"),
    ]
    student_external_id = models.IntegerField(verbose_name="ID étudiant")
    student_name = models.CharField(max_length=300, blank=True)
    label = models.CharField(max_length=200, verbose_name="Libellé")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Montant")
    due_date = models.DateField(verbose_name="Date d'échéance")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Facture"
        verbose_name_plural = "Factures"
        ordering = ["-due_date"]

    def __str__(self):
        return f"{self.student_name} - {self.label} ({self.amount} DH)"


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ("cash", "Espèces"),
        ("card", "Carte bancaire"),
        ("transfer", "Virement"),
        ("check", "Chèque"),
    ]
    student_external_id = models.IntegerField(verbose_name="ID étudiant")
    student_name = models.CharField(max_length=300, blank=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Montant")
    method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default="cash")
    reference = models.CharField(max_length=100, blank=True, verbose_name="Référence")
    paid_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Paiement"
        verbose_name_plural = "Paiements"
        ordering = ["-paid_at"]

    def __str__(self):
        return f"{self.student_name} - {self.amount} DH ({self.get_method_display()})"


class Budget(models.Model):
    label = models.CharField(max_length=200, verbose_name="Libellé")
    total = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Budget total")
    spent = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Dépensé")
    academic_year = models.CharField(max_length=9, default="2025-2026")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Budget"
        verbose_name_plural = "Budgets"
        ordering = ["-created_at"]

    @property
    def remaining(self):
        return self.total - self.spent


class Salary(models.Model):
    teacher_external_id = models.IntegerField(verbose_name="ID enseignant")
    teacher_name = models.CharField(max_length=300, blank=True)
    month = models.CharField(max_length=7, verbose_name="Mois (YYYY-MM)")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Salaire")
    paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Salaire"
        verbose_name_plural = "Salaires"
        unique_together = ["teacher_external_id", "month"]
        ordering = ["-month"]

    def __str__(self):
        return f"{self.teacher_name} - {self.month} ({self.amount} DH)"
