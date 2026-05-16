FROM php:8.2-apache

# 1. Install dependencies and the MongoDB PHP Extension
RUN apt-get update && apt-get install -y \
    libssl-dev \
    libcurl4-openssl-dev \
    pkg-config \
    && pecl install mongodb \
    && docker-php-ext-enable mongodb

# 2. Enable Apache's rewrite module
RUN a2enmod rewrite

# 3. Copy the entire project into Apache's web root
COPY . /var/www/html/

# 4. Configure Apache routing
# Set the main DocumentRoot to the frontend folder, 
# but create an Alias so /backend still routes correctly.
RUN sed -i 's!DocumentRoot /var/www/html!DocumentRoot /var/www/html/frontend\n\tAlias /backend /var/www/html/backend!g' /etc/apache2/sites-available/000-default.conf

# 5. Grant permissions to the backend directory
RUN echo "<Directory /var/www/html/backend>\n    Options Indexes FollowSymLinks\n    AllowOverride All\n    Require all granted\n</Directory>" >> /etc/apache2/apache2.conf

# 6. Ensure proper ownership
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
