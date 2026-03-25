# SkipQ
CS253 Course Project Development Branch

## Frontend

## Backend

## Database

## Setup

### 1. Backend Setup
First, we will set up and start the Django backend server.

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
5. Start the backend server:
   ```bash
   python manage.py runserver
   ```

### 2. Frontend Setup
Next, open a **new terminal window** to set up and start the frontend React application.

1. Navigate to the frontend directory from the project root:
   ```bash
   cd Frontend
   ```
2. Install the necessary NPM dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
