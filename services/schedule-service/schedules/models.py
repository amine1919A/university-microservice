from django.db import models


class Schedule(models.Model):
    DAY_CHOICES = [
        ("monday", "Lundi"),
        ("tuesday", "Mardi"),
        ("wednesday", "Mercredi"),
        ("thursday", "Jeudi"),
        ("friday", "Vendredi"),
        ("saturday", "Samedi"),
    ]

    class_external_id = models.IntegerField(verbose_name="ID classe")
    class_name = models.CharField(max_length=100, blank=True, verbose_name="Nom classe")
    subject_external_id = models.IntegerField(verbose_name="ID matière")
    subject_name = models.CharField(max_length=200, blank=True, verbose_name="Matière")
    teacher_external_id = models.IntegerField(verbose_name="ID enseignant")
    teacher_name = models.CharField(max_length=300, blank=True, verbose_name="Enseignant")
    day_of_week = models.CharField(max_length=10, choices=DAY_CHOICES, verbose_name="Jour")
    start_time = models.TimeField(verbose_name="Début")
    end_time = models.TimeField(verbose_name="Fin")
    room = models.CharField(max_length=50, blank=True, verbose_name="Salle")
    academic_year = models.CharField(max_length=9, default="2025-2026", verbose_name="Année scolaire")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Emploi du temps"
        verbose_name_plural = "Emplois du temps"
        ordering = ["day_of_week", "start_time"]

    def __str__(self):
        return f"{self.class_name} - {self.subject_name} ({self.get_day_of_week_display()})"
