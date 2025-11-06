require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

app.get('/', (req, res) => res.send('Kapoor & Sons backend running'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// simple booking sample route (will return count)
app.get('/bookings/count', async (req, res) => {
  const count = await prisma.booking.count();
  res.json({ count });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

