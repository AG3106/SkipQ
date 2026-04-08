"""
File handling utilities for canteen images, dish images, cake images,
and registration documents.

Directory structure under Backend/files/:
  canteen_images/   — public, <canteen_id>.jpg
  dish_images/      — public, <dish_id>.jpg
  cake_images/      — public, <cake_flavor_id>.jpg
  documents/        — admin-only, <canteen_id>/aadhar_card.<ext> & hall_approval_form.<ext>
"""

import os
import io
import logging

from PIL import Image
from django.conf import settings

logger = logging.getLogger(__name__)


def _ensure_dir(path):
    """Create directory (and parents) if it doesn't exist."""
    os.makedirs(path, exist_ok=True)


def _get_extension(filename):
    """Extract file extension from filename (e.g. '.pdf')."""
    _, ext = os.path.splitext(filename)
    return ext.lower() if ext else ""


def _convert_to_jpg(image_file):
    """
    Convert any uploaded image (PNG, WEBP, BMP, etc.) to JPEG bytes.

    Opens the uploaded file with Pillow, converts RGBA/P modes to RGB
    (JPEG doesn't support transparency), then writes JPEG bytes to a
    BytesIO buffer and returns it.
    """
    img = Image.open(image_file)

    # JPEG doesn't support transparency — flatten onto white background
    if img.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1])  # use alpha as mask
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85, optimize=True)
    buf.seek(0)
    return buf


# ---------------------------------------------------------------------------
# Canteen Images  —  files/canteen_images/<canteen_id>.jpg
# ---------------------------------------------------------------------------

def save_canteen_image(canteen_id, image_file):
    """
    Convert any uploaded image to JPEG and save as
    files/canteen_images/<canteen_id>.jpg.

    Returns the relative URL path.
    """
    dest_dir = os.path.join(settings.FILES_ROOT, "canteen_images")
    _ensure_dir(dest_dir)
    filename = f"{canteen_id}.jpg"
    dest_path = os.path.join(dest_dir, filename)

    jpg_buf = _convert_to_jpg(image_file)
    with open(dest_path, "wb") as f:
        f.write(jpg_buf.read())

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
    Convert any uploaded image to JPEG and save as
    files/dish_images/<dish_id>.jpg.

    Returns the relative URL path.
    """
    dest_dir = os.path.join(settings.FILES_ROOT, "dish_images")
    _ensure_dir(dest_dir)
    filename = f"{dish_id}.jpg"
    dest_path = os.path.join(dest_dir, filename)

    jpg_buf = _convert_to_jpg(image_file)
    with open(dest_path, "wb") as f:
        f.write(jpg_buf.read())

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
# Cake Images  —  files/cake_images/<canteen_id>/<cake_flavor_id>.jpg
# ---------------------------------------------------------------------------

def save_cake_image(canteen_id, cake_flavor_id, image_file):
    """
    Convert any uploaded image to JPEG and save as
    files/cake_images/<canteen_id>/<cake_flavor_id>.jpg.

    Returns the relative URL path.
    """
    dest_dir = os.path.join(settings.FILES_ROOT, "cake_images", str(canteen_id))
    _ensure_dir(dest_dir)
    filename = f"{cake_flavor_id}.jpg"
    dest_path = os.path.join(dest_dir, filename)

    jpg_buf = _convert_to_jpg(image_file)
    with open(dest_path, "wb") as f:
        f.write(jpg_buf.read())

    logger.info("Saved cake image: %s", dest_path)
    return f"/files/cake_images/{canteen_id}/{filename}"


def delete_cake_image(canteen_id, cake_flavor_id):
    """Remove the cake flavor image file if it exists."""
    path = os.path.join(
        settings.FILES_ROOT, "cake_images", str(canteen_id), f"{cake_flavor_id}.jpg"
    )
    if os.path.exists(path):
        os.remove(path)
        logger.info("Deleted cake image: %s", path)


def cake_image_exists(canteen_id, cake_flavor_id):
    """Check whether a cake flavor image file exists on disk."""
    path = os.path.join(
        settings.FILES_ROOT, "cake_images", str(canteen_id), f"{cake_flavor_id}.jpg"
    )
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
    Return a dict of authenticated document URLs for a canteen.

    Returns:
        {
            "aadhar_card": "/api/canteens/<id>/documents/aadhar_card.<ext>/" or None,
            "hall_approval_form": "/api/canteens/<id>/documents/hall_approval_form.<ext>/" or None,
        }
    """
    doc_dir = os.path.join(settings.FILES_ROOT, "documents", str(canteen_id))
    result = {"aadhar_card": None, "hall_approval_form": None}

    if not os.path.isdir(doc_dir):
        return result

    for fname in os.listdir(doc_dir):
        for doc_type in VALID_DOC_TYPES:
            if fname.startswith(doc_type):
                result[doc_type] = f"/api/canteens/{canteen_id}/documents/{fname}/"
                break

    return result


def get_document_path(canteen_id, filename):
    """Return the absolute filesystem path for a specific document file."""
    # Prevent path traversal — only allow the basename (no slashes or '..')
    safe_filename = os.path.basename(filename)
    if not safe_filename or safe_filename != filename:
        raise ValueError("Invalid filename")
    return os.path.join(settings.FILES_ROOT, "documents", str(canteen_id), safe_filename)
