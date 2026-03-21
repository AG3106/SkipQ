"""
File handling utilities for canteen images, dish images, and registration documents.

Directory structure under Backend/files/:
  canteen_images/   — public, <canteen_id>.jpg
  dish_images/      — public, <dish_id>.jpg
  documents/        — admin-only, <canteen_id>/aadhar_card.<ext> & hall_approval_form.<ext>
"""

import os
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def _ensure_dir(path):
    """Create directory (and parents) if it doesn't exist."""
    os.makedirs(path, exist_ok=True)


def _get_extension(filename):
    """Extract file extension from filename (e.g. '.jpg')."""
    _, ext = os.path.splitext(filename)
    return ext.lower() if ext else ".jpg"


# ---------------------------------------------------------------------------
# Canteen Images  —  files/canteen_images/<canteen_id>.jpg
# ---------------------------------------------------------------------------
# TODO: Change in server according to its global path
def save_canteen_image(canteen_id, image_file):
    """
    Save a canteen cover image as files/canteen_images/<canteen_id>.jpg.
    Converts/renames regardless of upload extension — always stored as .jpg.
    Returns the relative URL path.
    """
    dest_dir = os.path.join(settings.FILES_ROOT, "canteen_images")
    _ensure_dir(dest_dir)
    filename = f"{canteen_id}.jpg"
    dest_path = os.path.join(dest_dir, filename)

    with open(dest_path, "wb+") as f:
        for chunk in image_file.chunks():
            f.write(chunk)

    logger.info("Saved canteen image: %s", dest_path)
    return f"/files/canteen_images/{filename}"


def delete_canteen_image(canteen_id):
    """Remove the canteen image file if it exists."""
    path = os.path.join(settings.FILES_ROOT, "canteen_images", f"{canteen_id}.jpg")
    if os.path.exists(path):
        os.remove(path)
        logger.info("Deleted canteen image: %s", path)


def canteen_image_exists(canteen_id):
    """Check whether a canteen image file exists on disk."""
    path = os.path.join(settings.FILES_ROOT, "canteen_images", f"{canteen_id}.jpg")
    return os.path.isfile(path)


# ---------------------------------------------------------------------------
# Dish Images  —  files/dish_images/<dish_id>.jpg
# ---------------------------------------------------------------------------

def save_dish_image(dish_id, image_file):
    """
    Save a dish photo as files/dish_images/<dish_id>.jpg.
    Returns the relative URL path.
    """
    dest_dir = os.path.join(settings.FILES_ROOT, "dish_images")
    _ensure_dir(dest_dir)
    filename = f"{dish_id}.jpg"
    dest_path = os.path.join(dest_dir, filename)

    with open(dest_path, "wb+") as f:
        for chunk in image_file.chunks():
            f.write(chunk)

    logger.info("Saved dish image: %s", dest_path)
    return f"/files/dish_images/{filename}"


def delete_dish_image(dish_id):
    """Remove the dish image file if it exists."""
    path = os.path.join(settings.FILES_ROOT, "dish_images", f"{dish_id}.jpg")
    if os.path.exists(path):
        os.remove(path)
        logger.info("Deleted dish image: %s", path)


def dish_image_exists(dish_id):
    """Check whether a dish image file exists on disk."""
    path = os.path.join(settings.FILES_ROOT, "dish_images", f"{dish_id}.jpg")
    return os.path.isfile(path)


# ---------------------------------------------------------------------------
# Documents  —  files/documents/<canteen_id>/{aadhar_card,hall_approval_form}.<ext>
# ---------------------------------------------------------------------------

VALID_DOC_TYPES = ("aadhar_card", "hall_approval_form")


def save_canteen_document(canteen_id, doc_type, doc_file):
    """
    Save a registration document for a canteen.

    Args:
        canteen_id: PK of the canteen.
        doc_type:   One of 'aadhar_card' or 'hall_approval_form'.
        doc_file:   The uploaded file object.

    Returns the relative URL path for the saved document.
    """
    if doc_type not in VALID_DOC_TYPES:
        raise ValueError(f"Invalid doc_type '{doc_type}'. Must be one of {VALID_DOC_TYPES}")

    dest_dir = os.path.join(settings.FILES_ROOT, "documents", str(canteen_id))
    _ensure_dir(dest_dir)

    ext = _get_extension(doc_file.name)
    filename = f"{doc_type}{ext}"
    dest_path = os.path.join(dest_dir, filename)

    with open(dest_path, "wb+") as f:
        for chunk in doc_file.chunks():
            f.write(chunk)

    logger.info("Saved canteen document: %s", dest_path)
    return f"/files/documents/{canteen_id}/{filename}"


def get_canteen_documents(canteen_id):
    """
    Return a dict of existing document paths for a canteen.

    Returns:
        {
            "aadhar_card": "/files/documents/<id>/aadhar_card.<ext>" or None,
            "hall_approval_form": "/files/documents/<id>/hall_approval_form.<ext>" or None,
        }
    """
    doc_dir = os.path.join(settings.FILES_ROOT, "documents", str(canteen_id))
    result = {"aadhar_card": None, "hall_approval_form": None}

    if not os.path.isdir(doc_dir):
        return result

    for fname in os.listdir(doc_dir):
        for doc_type in VALID_DOC_TYPES:
            if fname.startswith(doc_type):
                result[doc_type] = f"/files/documents/{canteen_id}/{fname}"
                break

    return result


def get_document_path(canteen_id, filename):
    """Return the absolute filesystem path for a specific document file."""
    return os.path.join(settings.FILES_ROOT, "documents", str(canteen_id), filename)
