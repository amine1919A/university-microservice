from django.db import models


class Subject(models.Model):
    name = models.CharField(max_length=100, verbose_name="Matière")
    code = models.CharField(max_length=20, unique=True, verbose_name="Code")
    coefficient = models.DecimalField(max_digits=4, decimal_places=2, default=1.0, verbose_name="Coefficient")
    description = models.TextField(blank=True, verbose_name="Description")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Matière"
        verbose_name_plural = "Matières"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class SubjectAssignment(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="assignments", verbose_name="Matière")
    teacher_external_id = models.IntegerField(verbose_name="ID enseignant")
    teacher_name = models.CharField(max_length=300, blank=True, verbose_name="Nom enseignant")
    class_external_id = models.IntegerField(verbose_name="ID classe")
    class_name = models.CharField(max_length=100, blank=True, verbose_name="Nom classe")
    hours_per_week = models.PositiveIntegerField(default=2, verbose_name="Heures/semaine")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Affectation matière"
        verbose_name_plural = "Affectations matières"
        unique_together = ["subject", "teacher_external_id", "class_external_id"]

    def __str__(self):
        return f"{self.subject.name} → {self.class_name} ({self.teacher_name})"
