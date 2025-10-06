# LaundryApp

Online Laundry Booking Mobile-Web Application.

- Backend: FastAPI + Neo4j Aura (neo4j Python driver)
- Frontend: React (Vite) + Tailwind CSS (mobile-first, minimalist theme)

## Project Structure

```
LaundryApp3/
├─ backend/
│  ├─ main.py
│  ├─ auth.py
│  ├─ models.py
│  ├─ db.py
│  ├─ users.py
│  ├─ services.py
│  ├─ orders.py
│  ├─ receipts.py
│  ├─ routes/
│  │  ├─ bookings.py
│  │  ├─ categories.py
│  │  └─ admin.py
│  ├─ notifications.py
│  ├─ config.py
│  ├─ requirements.txt
│  └─ __init__.py
├─ frontend-react/
│  ├─ index.html
│  ├─ src/
│  │  ├─ api/
│  │  ├─ components/
│  │  ├─ context/
│  │  ├─ pages/
│  │  └─ styles.css
│  ├─ package.json
│  └─ vite.config.js
├─ README.md
└─ .gitignore
```

## Backend Setup (Windows)

1) Create a virtual environment and activate it:

```
py -m venv .venv
.\.venv\Scripts\activate
```

2) Install dependencies:

```
pip install -r backend/requirements.txt
```

3) Configure environment variables (Neo4j Aura + JWT):

Create a `.env` file in `backend/` with:

```
JWT_SECRET=change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXP_MINUTES=120

NEO4J_URI=neo4j+s://<your-aura-uri>
NEO4J_USER=neo4j
NEO4J_PASSWORD=<your-password>
```

4) Run the API server:

```
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API should be available at http://localhost:8000

Open Swagger docs: http://localhost:8000/docs

### Notes on Neo4j schema

- Users are stored as `(:User {id, role, email, contact_number, ...})`
- Services are `(:Service {id, name, description, price_per_kg})-[:OFFERED_BY]->(:User {role:'provider'})`
- Orders are `(:Order {...})-[:PLACED_BY]->(:User {role:'customer'})` and `(:Order)-[:FOR_PROVIDER]->(:User {role:'provider'})`
- Items are relationships `(:Order)-[:HAS_ITEM {weight_kg}]->(:Service)`
- Receipts are `(:Receipt {...})-[:FOR_ORDER]->(:Order)` plus `(:Receipt)-[:FOR_CUSTOMER]->(:User)` and `(:Receipt)-[:FOR_PROVIDER]->(:User)`

## Frontend Setup (React + Vite + Tailwind)

1) Install Node.js 18+.

2) Configure API base URL:

Create `frontend-react/.env` with:

```
VITE_API_URL=http://127.0.0.1:8000
```

3) Install and run dev server:

```
cd frontend-react
npm install
npm run dev
```

Vite will serve at http://localhost:5173

## Key Features Implemented

- JWT auth with `/auth/login` and `/auth/me`
- Separate registration for customers and providers
- Providers manage services (create, update, delete)
- Customers browse provider categories and create bookings
- Providers manage services and booking statuses
- Receipts are generated when a booking is completed (and appear for both customer and provider)
- Authorization:
  - Customers only see/manage their own orders/receipts
  - Providers only manage their own services and view linked orders/receipts

## Validation

- Email validation by `pydantic` + `email-validator`
- Contact number basic regex: `^[0-9+\-()\s]{7,20}$`

## Deploy to Render (Backend + Frontend)

Backend (FastAPI):

- Service Type: Web Service
- Root directory: `backend/`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment: add variables from `backend/.env` (NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, JWT_SECRET, etc.)
- CORS in `backend/main.py`: add your Render frontend URL to `allow_origins`

Frontend (Vite React):

- Service Type: Static Site
- Root directory: `frontend-react/`
- Build: `npm ci && npm run build`
- Publish directory: `dist`
- Env: `VITE_API_URL=https://your-backend.onrender.com`

After the frontend is live, add its URL to backend CORS and redeploy the backend.

## Troubleshooting

- If you see `Could not validate credentials`, ensure you pass the Bearer token from `/auth/login` to subsequent calls.
- If connecting to Neo4j Aura fails, verify `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD`.
- If CORS fails in production, ensure your frontend Render URL is in `allow_origins` in `backend/main.py`.
