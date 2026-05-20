/*
   +----------------------------------------------------------------------+
   | Copyright (c) The PHP Group                                          |
   +----------------------------------------------------------------------+
   | This source file is subject to version 3.01 of the PHP license,      |
   | that is bundled with this package in the file LICENSE, and is        |
   | available through the world-wide-web at the following url:           |
   | https://www.php.net/license/3_01.txt                                 |
   | If you did not receive a copy of the PHP license and are unable to   |
   | obtain it through the world-wide-web, please send a note to          |
   | license@php.net so we can mail you a copy immediately.               |
   +----------------------------------------------------------------------+
   | Author: Stig Sæther Bakken <ssb@php.net>                             |
   +----------------------------------------------------------------------+
*/

#define CONFIGURE_COMMAND " './configure'  '--srcdir=../php-8.5.5' '--config-cache' '--prefix=/usr' '--sbindir=/usr/bin' '--sysconfdir=/etc/php' '--localstatedir=/var' '--with-layout=GNU' '--with-config-file-path=/etc/php' '--with-config-file-scan-dir=/etc/php/conf.d' '--disable-rpath' '--mandir=/usr/share/man' '--enable-cgi' '--enable-fpm' '--with-fpm-systemd' '--with-fpm-acl' '--with-fpm-user=http' '--with-fpm-group=http' '--enable-embed=shared' '--enable-bcmath=shared' '--enable-calendar=shared' '--enable-dba=shared' '--enable-exif=shared' '--enable-ftp=shared' '--enable-gd=shared' '--enable-intl=shared' '--enable-mbstring' '--enable-pcntl' '--enable-shmop=shared' '--enable-soap=shared' '--enable-sockets=shared' '--enable-sysvmsg=shared' '--enable-sysvsem=shared' '--enable-sysvshm=shared' '--with-bz2=shared' '--with-curl=shared' '--with-enchant=shared' '--with-external-gd' '--with-external-pcre' '--with-ffi=shared' '--with-gdbm' '--with-gettext=shared' '--with-gmp=shared' '--with-iconv=shared' '--with-ldap=shared' '--with-ldap-sasl' '--with-mhash' '--with-mysql-sock=/run/mysqld/mysqld.sock' '--with-mysqli=shared' '--with-openssl' '--with-openssl-argon2' '--with-password-argon2' '--with-pdo-dblib=shared,/usr' '--with-pdo-mysql=shared' '--with-pdo-odbc=shared,unixODBC,/usr' '--with-pdo-pgsql=shared' '--with-pdo-sqlite=shared' '--with-pgsql=shared' '--with-readline' '--with-snmp=shared' '--with-sodium=shared' '--with-sqlite3=shared' '--with-tidy=shared' '--with-unixODBC=shared' '--with-xsl=shared' '--with-zip=shared' '--with-zlib' 'CFLAGS=-march=x86-64 -mtune=generic -O2 -pipe -fno-plt -fexceptions -Wp,-D_FORTIFY_SOURCE=3 -Wformat -Werror=format-security -fstack-clash-protection -fcf-protection -fno-omit-frame-pointer -mno-omit-leaf-frame-pointer -g -ffile-prefix-map=/build/php/src=/usr/src/debug/php' 'LDFLAGS=-Wl,-O1 -Wl,--sort-common -Wl,--as-needed -Wl,-z,relro -Wl,-z,now -Wl,-z,pack-relative-relocs' 'CXXFLAGS=-march=x86-64 -mtune=generic -O2 -pipe -fno-plt -fexceptions -Wp,-D_FORTIFY_SOURCE=3 -Wformat -Werror=format-security -fstack-clash-protection -fcf-protection -fno-omit-frame-pointer -mno-omit-leaf-frame-pointer -Wp,-D_GLIBCXX_ASSERTIONS -g -ffile-prefix-map=/build/php/src=/usr/src/debug/php' 'EXTENSION_DIR=/usr/lib/php/modules'"
#define PHP_PROG_SENDMAIL	"/usr/bin/sendmail"
#define PEAR_INSTALLDIR         ""
#define PHP_INCLUDE_PATH	".:"
#define PHP_EXTENSION_DIR       "/usr/lib/php/modules"
#define PHP_PREFIX              "/usr"
#define PHP_BINDIR              "/usr/bin"
#define PHP_SBINDIR             "/usr/bin"
#define PHP_MANDIR              "/usr/share/man"
#define PHP_LIBDIR              "/usr/lib/php"
#define PHP_DATADIR             "/usr/share/php"
#define PHP_SYSCONFDIR          "/etc/php"
#define PHP_LOCALSTATEDIR       "/var"
#define PHP_CONFIG_FILE_PATH    "/etc/php"
#define PHP_CONFIG_FILE_SCAN_DIR    "/etc/php/conf.d"
#define PHP_SHLIB_SUFFIX        "so"
#define PHP_SHLIB_EXT_PREFIX    ""
