import express from 'express';
import { handlers } from './src/auth.js';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use('/api/auth', (req, res) => handlers(req, res));

const port = 3000;
app.listen(port, () => {
  console.log(`Auth server running at http://localhost:${port}`);
});
