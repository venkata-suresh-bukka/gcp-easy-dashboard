#!/bin/bash

# Restart SSH
/etc/init.d/ssh restart

# Install mysqlclient
apk --no-cache add mariadb-connector-c-dev
pip install mysqlclient

# Start Nginx
nginx

# Apply database migrations
python manage.py makemigrations
python manage.py migrate

# Start Gunicorn
gunicorn -c g_config/config.py gcp_easy_dashboard.wsgi

# Execute additional commands if needed
exec "$@"
