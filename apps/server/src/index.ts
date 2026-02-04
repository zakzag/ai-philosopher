import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectToMongo } from './db/index.js';
import debatesRouter from './routes/debates.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (_req, res) => {
  res.json({
    message: 'Philosopher API Server',
    version: '1.0.0',
    endpoints: {
      debates: '/api/debates',
      health: '/health'
    }
  });
});

app.use('/api/debates', debatesRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start server
async function start() {
  try {
    await connectToMongo();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
