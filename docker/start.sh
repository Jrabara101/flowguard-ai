#!/bin/sh
set -e
cd /var/www/html

# Cloud Run tells us which port to listen on
sed -i "s/__PORT__/${PORT:-8080}/" /etc/nginx/http.d/default.conf

# SQLite fallback (local Docker test, or before Cloud SQL exists): create the file so migrations can run
if [ "${DB_CONNECTION}" = "sqlite" ]; then
    DB_FILE="${DB_DATABASE:-/var/www/html/database/database.sqlite}"
    [ -f "$DB_FILE" ] || { touch "$DB_FILE"; chown www-data:www-data "$DB_FILE"; }
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache

if [ "${RUN_MIGRATIONS}" = "true" ]; then
    php artisan migrate --force
    # Seed only an empty database, so a restart never duplicates the demo data
    if [ "$(php artisan tinker --execute='echo App\Models\Order::count();' 2>/dev/null | tail -n1)" = "0" ]; then
        php artisan db:seed --force
    fi
fi

chown -R www-data:www-data storage bootstrap/cache

php-fpm -D
exec nginx -g 'daemon off;'
