# ---------- Configuration ----------
.PHONY: install-backend backend-dev test install-frontend frontend-dev \
        up down build restart logs backend-build backend-down backend-logs \
        lint format

# ---------- Backend Commands ----------
install-backend:
	cd backend && pip install -r requirements.txt

backend-dev:
	cd backend && uvicorn app.main:app --reload

test:
	cd backend && pytest

backend-build:
	docker compose build backend

backend-down:
	docker compose stop backend

backend-logs:
	docker compose logs backend

# ---------- Frontend Commands ----------
install-frontend:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

# ---------- Docker Full Stack ----------
up:
	docker compose up --build

down:
	docker compose down

build:
	docker compose build

restart:
	docker compose down && docker compose up --build

logs:
	docker compose logs -f

# ---------- Code Quality (Optional) ----------
lint:
	cd backend && flake8 .

format:
	cd backend && isort . && black .

type-check:
	cd backend && mypy .

doc-check:
	cd backend && pydocstyle . 
