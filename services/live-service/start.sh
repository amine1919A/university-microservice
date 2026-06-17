#!/bin/sh
set -e
python manage.py makemigrations live --noinput
python manage.py migrate --noinput
python manage.py collectstatic --noinput --clear 2>/dev/null || true
exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
