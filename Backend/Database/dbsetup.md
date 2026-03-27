# SkipQ PostgreSQL Setup Guide

This guide covers how to install and configure PostgreSQL for the SkipQ Django Backend, replacing the default SQLite database.

## 1. Install PostgreSQL

Install PostgreSQL and its contrib packages (tested on Ubuntu/Debian):

```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
```

## 2. Start and Enable the Service

Ensure the PostgreSQL server is running and set to start automatically on boot:

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 3. Configure the Database and User

The Django backend is configured to use the `skipq_db` database, accessed by the default `postgres` user with the password `sppsql` (as defined in `Backend/config/settings.py` and `Backend/Database/database.py`).

Set up the database and user password using the following commands:

```bash
# Set the password for the 'postgres' user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'sppsql';"

# Create the application database
sudo -u postgres psql -c "CREATE DATABASE skipq_db;"
```

*(Note: If you see a warning `could not change directory to... Permission denied`, it can be safely ignored.)*

## 4. Install Python Dependencies

Ensure your virtual environment is activated, then install the required database adapter (`psycopg2-binary` is already added to `requirements.txt`):

```bash
cd Backend
source .venv/bin/activate
pip install -r requirements.txt
```

## 5. Run Migrations

To create all the necessary tables in your new PostgreSQL database, run the Django migrations:

```bash
python manage.py migrate
```

## 6. Seed the Database (Optional)

To populate the database with mock users, canteens, dishes, and orders for testing:

```bash
python manage.py seed_data
```

## 7. Start the Server

You're all set! Start the development server as usual:

```bash
python manage.py runserver 0.0.0.0:8000
```
