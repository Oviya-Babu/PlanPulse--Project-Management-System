#!/usr/bin/env bash
set -e

echo "Updating apt and installing postgresql..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq postgresql postgresql-contrib

echo "Starting PostgreSQL service..."
service postgresql start

echo "Configuring PostgreSQL user and databases..."
su - postgres <<'EOF'
psql -c "DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pms') THEN
    CREATE ROLE pms WITH LOGIN SUPERUSER PASSWORD 'pms_dev_password';
  END IF;
END
\$\$;"

psql -tc "SELECT 1 FROM pg_database WHERE datname = 'pms_dev'" | grep -q 1 || psql -c "CREATE DATABASE pms_dev OWNER pms;"
psql -tc "SELECT 1 FROM pg_database WHERE datname = 'pms_test'" | grep -q 1 || psql -c "CREATE DATABASE pms_test OWNER pms;"
EOF

echo "Configuring pg_hba.conf and postgresql.conf for local password connections..."
PG_CONF=$(find /etc/postgresql -name postgresql.conf)
PG_HBA=$(find /etc/postgresql -name pg_hba.conf)

sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" "$PG_CONF"
# Ensure md5/scram-sha-256 for local pms user
grep -q "host all pms all md5" "$PG_HBA" || echo "host all pms 127.0.0.1/32 md5" >> "$PG_HBA"
grep -q "host all pms ::1/128 md5" "$PG_HBA" || echo "host all pms ::1/128 md5" >> "$PG_HBA"

service postgresql restart
echo "PostgreSQL setup complete!"
