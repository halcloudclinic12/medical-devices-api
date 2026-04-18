# Copilot Workspace Instructions for Healthbox API

## Overview
This project is a Node.js/TypeScript backend API for health data management, using MongoDB, Docker, Kubernetes, and Helm for deployment. All essential setup, build, and deployment steps are documented in [Readme.md](../Readme.md). 

## Key Conventions
- **Node version:** 18.x or better (use nvm)
- **Environment:** Copy `.env.example` to `.env` and update as needed
- **Build:** `npm install` → `npm run build` (see [Readme.md](../Readme.md#setting-up-environment))
- **Run:** `pm2 start dist/server.js` or `npm start` (see [Readme.md](../Readme.md#to-run-server-manually))
- **Test data:** `node dist/seeder/init.js` and `npm run seed:summary`
- **Docker:** `docker build` and `docker-compose up --build` (see [Readme.md](../Readme.md#build-docker-image))
- **Kubernetes:** Apply manifests in `k8s/` and use Helm charts in `helm-charts/`
- **CI/CD:** GitHub Actions pipeline, see [Readme.md](../Readme.md#running-github-pipleline)

## Project Structure
- `src/` — Main source code (controllers, services, models, etc.)
- `k8s/` — Kubernetes manifests
- `helm-charts/` — Helm deployment files
- `tests/` — Test setup

## Build & Test Commands
- **Install:** `npm install`
- **Build:** `npm run build`
- **Seed DB:** `node dist/seeder/init.js`
- **Test Data:** `npm run seed:summary`
- **Run:** `pm2 start dist/server.js` or `npm start`
- **Docker Compose:** `docker-compose up --build`
- **K8s:** `kubectl apply -f k8s/`
- **Helm:** `helm install healthbox-api-v1.0.0 ./helm-charts`

## Troubleshooting & Environment
- See [Readme.md](../Readme.md) for:
  - Node, MongoDB, AWS, Nginx, SSL setup
  - Common issues and solutions
  - CI/CD secrets and deployment

## Link, Don’t Embed
For detailed instructions, always refer to [Readme.md](../Readme.md) instead of duplicating content here.

---

## Example Prompts
- "How do I build and run the API locally?"
- "How do I deploy to Kubernetes or Helm?"
- "How do I seed the database with test data?"
- "What is the required Node version?"

## Next Steps
- Consider agent customizations for:
  - Automated environment setup
  - CI/CD troubleshooting
  - Kubernetes/Helm deployment helpers

For more, see [Readme.md](../Readme.md).
