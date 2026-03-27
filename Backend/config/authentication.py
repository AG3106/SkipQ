"""
Custom authentication class for the SkipQ API.

DRF's built-in SessionAuthentication enforces CSRF on unsafe methods (POST, PUT, etc.),
which blocks programmatic API clients. Since CORS middleware already validates origins,
CSRF enforcement on API endpoints is redundant.
"""

from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication subclass that skips CSRF validation.

    Used as the default authentication class for DRF API endpoints.
    The CORS middleware (django-cors-headers) already handles
    origin validation for cross-origin requests.
    """

    def enforce_csrf(self, request):
        # Skip CSRF check for API endpoints
        return
