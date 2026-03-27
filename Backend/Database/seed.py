from database import get_connection, release_connection

def seed_database():
    """Populates the database with boundary-testing mock data."""
    conn = get_connection()
    if not conn:
        print("Failed to acquire connection for seeding.")
        return

    try:
        cursor = conn.cursor()

        # 1. TEARDOWN (Idempotency control)
        # Clears all existing data and resets auto-incrementing IDs to 1.
        print("Clearing existing database tables...")
        cursor.execute("""
            TRUNCATE TABLE 
                Order_Items, Payments, Favorite_Dishes, Orders, 
                Dishes, Canteens, Users, Admin_Activity_Logs, Admins 
            RESTART IDENTITY CASCADE;
        """)

        # 2. SEED USERS
        # Tests the domain constraint ensuring emails end in '@iitk.ac.in'
        print("Seeding Users...")
        users_data = [
            # (name, email, password_hash, wallet_balance, wallet_pin_hash)
            ("Standard User", "standard@iitk.ac.in", "hash1", 500.00, "pin1"),
            ("Zero Balance User", "zero@iitk.ac.in", "hash2", 0.00, "pin2"),      # Edge Case: Boundary testing for insufficient funds
            ("High Net Worth User", "rich@iitk.ac.in", "hash3", 99999.99, "pin3") # Edge Case: Testing NUMERIC(10,2) upper limits
        ]
        cursor.executemany("""
            INSERT INTO Users (name, email, password_hash, wallet_balance, wallet_pin_hash) 
            VALUES (%s, %s, %s, %s, %s);
        """, users_data)

        # 3. SEED CANTEENS
        print("Seeding Canteens...")
        canteens_data = [
            # (name, password_hash, opening_time, closing_time, contact_details)
            ("Hall 1 Canteen", "hash_c1", "14:00", "02:00", "hall1@iitk.ac.in"), # [cite: 1063, 1089-1090]
            ("Hall 2 Canteen", "hash_c2", "14:00", "02:00", "hall2@iitk.ac.in"), # [cite: 1034]
            ("Closed Canteen", "hash_c3", "00:00", "00:01", "closed@iitk.ac.in") # Edge Case: Testing out-of-hours logic
        ]
        cursor.executemany("""
            INSERT INTO Canteens (name, password_hash, opening_time, closing_time, contact_details) 
            VALUES (%s, %s, %s, %s, %s);
        """, canteens_data)

        # 4. SEED DISHES
        print("Seeding Dishes...")
        dishes_data = [
            # (canteen_id, name, description, price, is_available, discount, rating)
            (1, "Masala Dosa", "Crispy dosa with potato filling", 60.00, True, 0.00, 4.5), # Standard item [cite: 1073-1074]
            (1, "Idli Sambar", "Soft idlis with sambar", 50.00, True, 10.00, 4.2),         # Discounted item [cite: 1075-1076]
            (1, "Unavailable Item", "Out of stock", 100.00, False, 0.00, 0.00),            # Edge Case: Testing cart validation for unavailable items
            (2, "Free Sample", "Promotional item", 0.00, True, 0.00, 5.0),                 # Edge Case: Zero-price transaction logic
            (2, "Poha", "Flattened rice with vegetables", 40.00, True, 0.00, 4.0)          # [cite: 1079-1080]
        ]
        cursor.executemany("""
            INSERT INTO Dishes (canteen_id, name, description, price, is_available, discount, rating) 
            VALUES (%s, %s, %s, %s, %s, %s, %s);
        """, dishes_data)

        # 5. SEED ORDERS
        print("Seeding Orders...")
        orders_data = [
            # (user_id, canteen_id, status, order_amount)
            (1, 1, 'PENDING', 60.00),   # Standard active order
            (2, 1, 'REJECTED', 50.00),  # Edge Case: Requires refund processing logic
            (3, 2, 'COMPLETED', 0.00)   # Edge Case: Zero-amount completed order
        ]
        cursor.executemany("""
            INSERT INTO Orders (user_id, canteen_id, status, order_amount) 
            VALUES (%s, %s, %s, %s);
        """, orders_data)

        # 6. SEED ORDER ITEMS
        print("Seeding Order Items...")
        order_items_data = [
            # (order_id, dish_id, quantity, price_at_booking)
            (1, 1, 1, 60.00),
            (2, 2, 1, 50.00),
            (3, 4, 50, 0.00) # Edge Case: Abnormally high quantity
        ]
        cursor.executemany("""
            INSERT INTO Order_Items (order_id, dish_id, quantity, price_at_booking) 
            VALUES (%s, %s, %s, %s);
        """, order_items_data)

        # Commit all transactions
        conn.commit()
        print("Database seeding completed successfully.")

    except Exception as e:
        conn.rollback()
        print("Database seeding failed. Transaction rolled back.", e)
    
    finally:
        cursor.close()
        release_connection(conn)

if __name__ == "__main__":
    seed_database()