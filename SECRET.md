# SkipQ - Secret Variables

> ⚠️ **NEVER commit the `.env` file to version control.**

## Backend Secrets (`Backend/.env`)

| Variable               | Description                                                                                                  | Example                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `DJANGO_SECRET_KEY`    | Django cryptographic signing key. Must be unique and unpredictable in production.                            | `django-insecure-skipq-dev-key-change-in-production` |
| `DJANGO_DEBUG`         | Enable/disable Django debug mode. **Must be `False` in production.**                                         | `True`                                               |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated list of allowed hostnames.                                                                   | `*`                                                  |
| `DB_NAME`              | PostgreSQL database name.                                                                                    | `skipq_db`                                           |
| `DB_USER`              | PostgreSQL database user.                                                                                    | `postgres`                                           |
| `DB_PASSWORD`          | PostgreSQL database password.                                                                                | `sppsql`                                             |
| `DB_HOST`              | PostgreSQL database host.                                                                                    | `localhost`                                          |
| `DB_PORT`              | PostgreSQL database port.                                                                                    | `5433`                                               |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins for frontend dev servers.                                       | `http://localhost:3000,http://localhost:5173`        |
| `EMAIL_HOST_USER`      | Gmail account used for sending OTP/transactional emails.                                                     | `skipqiitk@gmail.com`                                |
| `EMAIL_HOST_PASSWORD`  | Gmail App Password (not your Google account password). Generate at https://myaccount.google.com/apppasswords | `xxxx xxxx xxxx xxxx`                                |
