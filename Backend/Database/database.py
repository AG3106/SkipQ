import psycopg2
from psycopg2 import pool
import sys

# Initialize the connection pool variable
db_pool = None

try:
    # A ThreadedConnectionPool is used to safely handle multiple concurrent requests 
    # from the backend API, supporting up to 500 simultaneous users.
    db_pool = psycopg2.pool.ThreadedConnectionPool(
        minconn=1,
        maxconn=500,
        host="localhost",
        database="skipq_db",
        user="postgres",
        password="sppsql", # Update this string
        port="5432"
    )
    if db_pool:
        print("Database connection pool established successfully.")

except psycopg2.DatabaseError as error:
    print(f"Failed to create database connection pool: {error}")
    sys.exit(1) # Halts the application if the database cannot be reached


def get_connection():
    """
    Retrieves an active connection from the pool.
    The business logic layer will call this function before executing any query.
    """
    try:
        if db_pool:
            connection = db_pool.getconn()
            return connection
    except psycopg2.DatabaseError as error:
        print(f"Error retrieving connection from pool: {error}")
        return None


def release_connection(connection):
    """
    Returns the connection to the pool.
    The business logic layer must call this function after a query completes 
    to free the resource for other concurrent users.
    """
    try:
        if db_pool and connection:
            db_pool.putconn(connection)
    except psycopg2.DatabaseError as error:
        print(f"Error releasing connection back to pool: {error}")