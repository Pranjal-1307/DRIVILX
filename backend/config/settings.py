import os

from pathlib import Path

from dotenv import load_dotenv


load_dotenv()


BASE_DIR = Path(
    __file__
).resolve().parent.parent


# ============================================================
# SECURITY
# ============================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "drivilx-secret-key"
)

DEBUG = os.getenv(
    "DEBUG",
    "True"
).lower() == "true"


ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1"
]


# ============================================================
# APPS
# ============================================================

INSTALLED_APPS = [

    "django.contrib.admin",

    "django.contrib.auth",

    "django.contrib.contenttypes",

    "django.contrib.sessions",

    "django.contrib.messages",

    "django.contrib.staticfiles",

    "corsheaders",

    "rest_framework",

    "apps.authentication",
    "apps.users",
    "apps.bookings",
    "apps.drivers",
    "apps.admin_portal",
]


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [

    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",

    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",

]


# ============================================================
# URL
# ============================================================

ROOT_URLCONF = "config.urls"


# ============================================================
# TEMPLATES
# ============================================================

TEMPLATES = [

    {

        "BACKEND":
            "django.template.backends.django.DjangoTemplates",

        "DIRS": [],

        "APP_DIRS": True,

        "OPTIONS": {

            "context_processors": [

                "django.template.context_processors.request",

                "django.contrib.auth.context_processors.auth",

                "django.contrib.messages.context_processors.messages",

            ],

        },

    },

]


WSGI_APPLICATION = "config.wsgi.application"


# ============================================================
# DATABASE
# ============================================================

# MongoDB is handled through PyMongo.
# Django's default database is not used for application data.

DATABASES = {}


# ============================================================
# CORS
# ============================================================

CORS_ALLOWED_ORIGINS = [

    "http://localhost:5173",

]


# ============================================================
# REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {

    "DEFAULT_PERMISSION_CLASSES": [

        "rest_framework.permissions.AllowAny"

    ]

}


# ============================================================
# STATIC
# ============================================================

STATIC_URL = "static/"


DEFAULT_AUTO_FIELD = (
    "django.db.models.BigAutoField"
)