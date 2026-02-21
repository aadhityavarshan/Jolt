import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/upload', uploadRouter);
// app.use('/api/patients', patientsRouter);
// app.use('/api/cpt', cptRouter);
// app.use('/api/evaluate', evaluateRouter);

app.listen(PORT, () => {
  console.log(`Jolt backend running on http://localhost:${PORT}`);
});

export default app;
