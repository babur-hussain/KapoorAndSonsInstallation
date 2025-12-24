# Backend Setup Guide

## Prerequisites

You need MongoDB running locally or via Docker.

## Option 1: Install MongoDB via Homebrew (macOS)

```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB service
brew services start mongodb-community@7.0

# Verify MongoDB is running
mongosh --eval "db.version()"
```

## Option 2: Run MongoDB via Docker

```bash
# Start MongoDB and Redis containers
docker compose up -d

# Check container status
docker compose ps

# View logs
docker compose logs mongodb

# Stop containers
docker compose down
```

## Option 3: Use MongoDB Atlas (Cloud)

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string
4. Update `backend/.env`:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/kapoorsons?retryWrites=true&w=majority
   ```

## Install Dependencies

```bash
cd backend
npm install
```

## Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Verify Installation

1. **API Health Check**: http://localhost:4000/health
2. **Bookings Endpoint**: http://localhost:4000/api/v1/bookings
3. **AdminJS Dashboard**: http://localhost:4000/admin

## Test API with curl

```bash
# Get all bookings (should return empty array initially)
curl http://localhost:4000/api/v1/bookings

# Create a booking
curl -X POST http://localhost:4000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "1234567890",
    "address": "123 Main St, City, State",
    "brand": "Samsung",
    "model": "Galaxy S21",
    "invoiceNo": "INV-12345",
    "preferredAt": "2025-11-10T14:30:00.000Z"
  }'
```

## Troubleshooting

### MongoDB Connection Error

If you see `MongooseServerSelectionError`, ensure MongoDB is running:

```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Or check Docker containers
docker compose ps
```

### Port Already in Use

If port 4000 is already in use, update the `PORT` in `.env`:

```
PORT=5000
```

## Project Structure

```
backend/
├── src/
│   ├── models/          # Mongoose models
│   │   └── Booking.js
│   ├── routes/          # API routes
│   │   └── bookingRoutes.js
│   ├── config/          # Configuration files
│   │   └── db.js
│   ├── admin/           # AdminJS setup
│   │   └── admin.js
│   ├── app.js           # Express app configuration
│   └── server.js        # Server entry point
├── .env                 # Environment variables
├── .env.example         # Example environment variables
├── package.json         # Dependencies
└── SETUP.md            # This file
```

