#!/bin/sh
set -e
python manage.py makemigrations billing --noinput
python manage.py migrate --noinput
python manage.py collectstatic --noinput --clear 2>/dev/null || true
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
