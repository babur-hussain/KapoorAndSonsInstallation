# Kapoor & Sons — Demo Booking App (Initial scaffold)

## This initial scaffold includes:
- backend/ (Express + Prisma)
- docker-compose for Postgres + Redis

## To run locally:
1. Start infra: `docker-compose up -d`
2. In `backend/` install deps: `cd backend && npm install`
3. Create `.env` in backend:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kapoor_demo?schema=public"
   ```
4. Run Prisma migrate (when ready): `npx prisma migrate dev --name init`
5. Start backend: `node server.js`

