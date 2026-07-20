import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4080);
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRouter);

// Production: serve built React app from frontend/dist
const distPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`FlowForge Node API listening on http://localhost:${PORT}`);
  if (fs.existsSync(distPath)) {
    console.log(`Serving frontend from ${distPath}`);
  }
});
