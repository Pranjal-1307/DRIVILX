# 🚗 DRIVILX

DRIVILX is a modern, premium driver booking platform. It features individual portals for customers, professional drivers, and administrators, built with a robust Django + MongoDB backend and a fast, responsive React + Vite frontend.

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Django 5.2.5
- **API:** Django REST Framework (DRF)
- **Database:** MongoDB (handled via `pymongo`)
- **Authentication:** JWT (JSON Web Tokens) & `bcrypt` password hashing

### Frontend
- **Framework:** React 19 + Vite 7
- **Styling:** TailwindCSS 4
- **Icons:** Lucide React
- **Routing:** React Router DOM 7
- **HTTP Client:** Axios

---

## 📂 Project Structure

```
DRIVILX/
├── backend/
│   ├── apps/            # Django Apps (authentication, users, bookings, drivers, admin_portal)
│   ├── config/          # Project configurations & settings
│   ├── database/        # MongoDB helper connections & seeds
│   ├── .env             # Backend environment variables
│   ├── manage.py        # Django CLI entry point
│   └── requirements.txt # Python dependency file
└── frontend/
    ├── src/             # React application source code
    ├── .env             # Frontend environment variables
    ├── index.html       # Single Page Application template
    └── package.json     # Node.js dependencies & scripts
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB running locally on port `27017`

### 1. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env` file (already set up in workspace):
   ```env
   SECRET_KEY=drivilx-django-secret-key
   DEBUG=True
   MONGO_URI=mongodb://localhost:27017/
   MONGO_DB_NAME=drivilx
   JWT_SECRET=drivilx-jwt-secret-key
   ADMIN_EMAIL=admin@drivilx.com
   ADMIN_PASSWORD=Admin@12345
   ```
5. Run the server:
   ```bash
   python manage.py runserver
   ```
   *The backend will start on **`http://localhost:8000/`***.

### 2. Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure `.env` file (already set up in workspace):
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
   *The frontend will start on **`http://localhost:5173/`***.

---

## 🔑 Default Credentials

The database is automatically seeded with these credentials when the Django backend initializes:

| Portal / Role | Email | Password |
| :--- | :--- | :--- |
| **Admin Portal** | `admin123@gmail.com` | `admin@1234` |
| **User (Customer) Portal** | `user123@gmail.com` | `user@1234` |
| **Driver Portal** | `rajesh.driver@drivilx.com` | `driver@1234` |
