<p align="center">
  <img src="https://img.shields.io/github/workflow/status/azirdamishra/eatery-recommender/CI?style=flat-square" alt="CI Status" />
  <img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square" alt="License" />
  <img src="https://img.shields.io/github/languages/top/azirdamishra/eatery-recommender?style=flat-square" alt="Top Language" />
  <img src="https://img.shields.io/github/issues/azirdamishra/eatery-recommender?style=flat-square" alt="Issues" />
</p>

# Eatery Recommender

A full-stack application for restaurant recommendations, built with FastAPI, React, and TypeScript.

## 🚀 Features

- Modern web interface with React and TypeScript
- RESTful API with FastAPI
- Docker containerization
- Automated testing and CI/CD
- Code quality tools and workflows

## 🛠️ Tech Stack

### Backend
- FastAPI
- Python 3.9
- Pytest for testing
- Black, isort, flake8, mypy, pydocstyle for code quality

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### DevOps
- Docker
- GitHub Actions
- Makefile for development tasks
- Bash scripts for automation

## 📦 Installation

### Prerequisites
- Python 3.9
- Node.js 18
- Docker and Docker Compose

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/azirdamishra/eatery-recommender.git
cd eatery-recommender
```

2. Set up the backend:
```bash
make install-backend
```

3. Set up the frontend:
```bash
make install-frontend
```

4. Start the development servers:
```bash
# Terminal 1 - Backend
make backend-dev

# Terminal 2 - Frontend
make frontend-dev
```

### Docker Setup

To run the entire stack with Docker:
```bash
make up
```

## 🧪 Testing

Run backend tests:
```bash
make test
```

## 🔍 Code Quality

The project includes several code quality tools:

```bash
# Run all code quality checks
make lint format type-check doc-check

# Individual checks
make lint        # Run flake8
make format      # Run isort and black
make type-check  # Run mypy
make doc-check   # Run pydocstyle
```

## 🔄 CI/CD

The project uses GitHub Actions for continuous integration and deployment:

- `backend.yml`: Backend testing and linting
- `frontend.yml`: Frontend testing and building
- `docker.yml`: Docker image building and pushing

## 📁 Project Structure

```
eatery-recommender/
├── backend/           # FastAPI backend
├── frontend/          # React frontend
├── scripts/           # Automation scripts
├── .github/          # GitHub Actions workflows
├── docker-compose.yml # Docker configuration
└── Makefile          # Development tasks
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.