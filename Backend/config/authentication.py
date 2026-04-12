"""
Custom authentication class for the SkipQ API.

Uses standard SessionAuthentication with CSRF enforcement.
The frontend must send the CSRF token via the X-CSRFToken header.
"""

from rest_framework.authentication import SessionAuthentication


class CsrfSessionAuthentication(SessionAuthentication):
    """
    Standard SessionAuthentication that enforces CSRF validation.

    The frontend should:
      1. Read the 'csrftoken' cookie set by Django.
      2. Send it as the 'X-CSRFToken' header on all unsafe requests (POST, PUT, DELETE).
    """
    pass
