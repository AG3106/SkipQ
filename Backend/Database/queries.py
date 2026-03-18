from database import get_connection, release_connection

# ==========================================
# AUTHENTICATION & USER MANAGEMENT
# ==========================================

def get_user_credentials(email):
    """Retrieves stored hash to verify login."""
    conn = get_connection()
    if not conn: return None
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, password_hash FROM Users WHERE email = %s;", (email,))
        return cursor.fetchone()
    except Exception as e:
        print("Error fetching credentials:", e)
        return None
    finally:
        cursor.close()
        release_connection(conn)

def create_user_record(name, email, password_hash):
    """Inserts a newly verified user into the database."""
    conn = get_connection()
    if not conn: return False
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO Users (name, email, password_hash) VALUES (%s, %s, %s);",
            (name, email, password_hash)
        )
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print("Error creating user:", e)
        return False
    finally:
        cursor.close()
        release_connection(conn)

# ==========================================
# CUSTOMER: MENUS & BROWSING
# ==========================================

def get_menu(canteen_id):
    """Fetches the available menu for a selected canteen."""
    conn = get_connection()
    if not conn: return []
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, name, price, discount, is_available FROM Dishes WHERE canteen_id = %s;", 
            (canteen_id,)
        )
        return cursor.fetchall()
    except Exception as e:
        print("Error fetching menu:", e)
        return []
    finally:
        cursor.close()
        release_connection(conn)

def query_active_orders(canteen_id):
    """Returns the current queue length to estimate wait times."""
    conn = get_connection()
    if not conn: return 0
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM Orders WHERE canteen_id = %s AND status IN ('PENDING', 'ACCEPTED', 'PREPARING');",
            (canteen_id,)
        )
        result = cursor.fetchone()
        return result[0] if result else 0
    except Exception as e:
        print("Error querying queue:", e)
        return 0
    finally:
        cursor.close()
        release_connection(conn)

# ==========================================
# CUSTOMER: WALLET & ORDERING
# ==========================================

def verify_wallet_pin(user_id, pin_hash):
    """Validates the transaction PIN before deducting funds."""
    conn = get_connection()
    if not conn: return False
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT wallet_pin_hash FROM Users WHERE id = %s;", (user_id,))
        result = cursor.fetchone()
        return result and result[0] == pin_hash
    except Exception as e:
        print("Error verifying PIN:", e)
        return False
    finally:
        cursor.close()
        release_connection(conn)

def deduct_funds(user_id, amount):
    """Subtracts the order total from the user's SkipQ wallet."""
    conn = get_connection()
    if not conn: return False
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Users SET wallet_balance = wallet_balance - %s WHERE id = %s AND wallet_balance >= %s;",
            (amount, user_id, amount)
        )
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print("Error deducting funds:", e)
        return False
    finally:
        cursor.close()
        release_connection(conn)

def place_order(user_id, canteen_id, order_amount, items):
    """
    Executes a multi-table transaction to create an order.
    'items' should be a list of tuples: [(dish_id, quantity, price_at_booking), ...]
    """
    conn = get_connection()
    if not conn: return None
    try:
        cursor = conn.cursor()
        
        # 1. Create the parent order record
        cursor.execute(
            """
            INSERT INTO Orders (user_id, canteen_id, status, order_amount) 
            VALUES (%s, %s, 'PENDING', %s) RETURNING id;
            """,
            (user_id, canteen_id, order_amount)
        )
        order_id = cursor.fetchone()[0]
        
        # 2. Insert the individual dishes mapped to this order
        for dish in items:
            cursor.execute(
                """
                INSERT INTO Order_Items (order_id, dish_id, quantity, price_at_booking) 
                VALUES (%s, %s, %s, %s);
                """,
                (order_id, dish[0], dish[1], dish[2])
            )
            
        conn.commit()
        return order_id
    except Exception as e:
        conn.rollback()
        print("Transaction failed. Order rolled back:", e)
        return None
    finally:
        cursor.close()
        release_connection(conn)

def add_to_order_history(user_id):
    """Retrieves completed orders for the user profile."""
    conn = get_connection()
    if not conn: return []
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Orders WHERE user_id = %s ORDER BY booking_time DESC;", (user_id,))
        return cursor.fetchall()
    except Exception as e:
        print("Error fetching history:", e)
        return []
    finally:
        cursor.close()
        release_connection(conn)

# ==========================================
# CANTEEN MANAGER: QUEUE & MENU CONTROL
# ==========================================

def view_pending_orders(canteen_id):
    """Retrieves orders awaiting manager approval."""
    conn = get_connection()
    if not conn: return []
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Orders WHERE canteen_id = %s AND status = 'PENDING';", (canteen_id,))
        return cursor.fetchall()
    except Exception as e:
        print("Error fetching pending orders:", e)
        return []
    finally:
        cursor.close()
        release_connection(conn)

def update_order_status(order_id, new_status):
    """Updates the status (e.g., ACCEPTED, READY, COMPLETED, REJECTED)."""
    conn = get_connection()
    if not conn: return False
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE Orders SET status = %s WHERE id = %s;", (new_status, order_id))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print("Error updating status:", e)
        return False
    finally:
        cursor.close()
        release_connection(conn)

def process_refund(user_id, amount):
    """Refunds wallet balance if a manager rejects an order."""
    conn = get_connection()
    if not conn: return False
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Users SET wallet_balance = wallet_balance + %s WHERE id = %s;",
            (amount, user_id)
        )
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print("Error processing refund:", e)
        return False
    finally:
        cursor.close()
        release_connection(conn)

def update_price(dish_id, new_price):
    """Modifies the live price of a menu item."""
    conn = get_connection()
    if not conn: return False
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE Dishes SET price = %s WHERE id = %s;", (new_price, dish_id))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print("Error updating price:", e)
        return False
    finally:
        cursor.close()
        release_connection(conn)

# ==========================================
# ADMIN: ANALYTICS & MODERATION
# ==========================================

def view_global_analytics():
    """Aggregates platform-wide statistics for the admin dashboard."""
    conn = get_connection()
    if not conn: return None
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(id) FROM Users;")
        total_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(order_amount) FROM Orders WHERE status = 'COMPLETED';")
        total_revenue = cursor.fetchone()[0]
        
        return {"total_users": total_users, "total_revenue": total_revenue}
    except Exception as e:
        print("Error fetching global analytics:", e)
        return None
    finally:
        cursor.close()
        release_connection(conn)