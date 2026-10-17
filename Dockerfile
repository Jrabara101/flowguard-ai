# FlowGuard AI: one Cloud Run service. Nginx serves the React app and sends /api to Laravel (PHP-FPM).

# 1. Build the React frontend
FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund
COPY index.html vite.config.js tailwind.config.js postcss.config.js ./
COPY src ./src
COPY public ./public
RUN npm run build

# 2. Laravel runtime
FROM php:8.4-fpm-alpine

RUN apk add --no-cache nginx icu-libs \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS icu-dev \
    && docker-php-ext-install pdo_mysql intl bcmath opcache \
    && apk del .build-deps

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dependencies first so code changes don't reinstall them
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && php artisan package:discover --ansi

# React build goes next to index.php: Nginx serves it, PHP only answers /api and /up
COPY --from=frontend /app/dist/ ./public/

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-flowguard.ini
COPY docker/fpm-pool.conf /usr/local/etc/php-fpm.d/zz-flowguard.conf
COPY docker/start.sh /usr/local/bin/start

RUN chmod +x /usr/local/bin/start \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs \
    && chown -R www-data:www-data storage bootstrap/cache database

ENV PORT=8080
EXPOSE 8080
CMD ["start"]
