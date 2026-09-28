import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { quarantineRouter } from './routes/quarantine';
import { parseLogRouter } from './routes/parseLog';
import { verifyRouter } from './routes/verify';
import { registryRouter } from './routes/registry';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ULPF Backend', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', quarantineRouter);
app.use('/api', parseLogRouter);
app.use('/api', verifyRouter);
app.use('/api', registryRouter);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ULPF Error]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🟢 ULPF Backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Env: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
