-- Users Table
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    wallet_balance NUMERIC(10, 2) DEFAULT 0.00,
    wallet_pin_hash VARCHAR(255),
    CONSTRAINT valid_iitk_email CHECK (email LIKE '%@iitk.ac.in')
);

-- Canteens Table
CREATE TABLE Canteens (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL,
    contact_details TEXT
);

-- Dishes Table
CREATE TABLE Dishes (
    id SERIAL PRIMARY KEY,
    canteen_id INT NOT NULL REFERENCES Canteens(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    discount NUMERIC(5, 2) DEFAULT 0.00,
    photo_url TEXT,
    rating NUMERIC(3, 2) DEFAULT 0.00
);

-- Favorite Dishes Junction Table
CREATE TABLE Favorite_Dishes (
    user_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    dish_id INT NOT NULL REFERENCES Dishes(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, dish_id)
);

-- Orders Table
CREATE TABLE Orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(id) ON DELETE RESTRICT,
    canteen_id INT NOT NULL REFERENCES Canteens(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    receive_time TIMESTAMP,
    order_amount NUMERIC(10, 2) NOT NULL,
    CONSTRAINT valid_status CHECK (
        status IN (
            'PENDING', 
            'ACCEPTED', 
            'PREPARING', 
            'READY', 
            'COMPLETED', 
            'REJECTED', 
            'CONFIRMED', 
            'PENDING_APPROVAL'
        )
    )
);

-- Order Items Junction Table
CREATE TABLE Order_Items (
    order_id INT NOT NULL REFERENCES Orders(id) ON DELETE CASCADE,
    dish_id INT NOT NULL REFERENCES Dishes(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_booking NUMERIC(10, 2) NOT NULL,
    PRIMARY KEY (order_id, dish_id)
);

-- Payments Table
CREATE TABLE Payments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(id) ON DELETE RESTRICT,
    order_id INT NOT NULL REFERENCES Orders(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL,
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL,
    status BOOLEAN NOT NULL
);

-- Admins Table
CREATE TABLE Admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_level VARCHAR(50) NOT NULL
);

-- Admin Activity Logs Table
CREATE TABLE Admin_Activity_Logs (
    id SERIAL PRIMARY KEY,
    admin_id INT NOT NULL REFERENCES Admins(id) ON DELETE CASCADE,
    action_description TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);