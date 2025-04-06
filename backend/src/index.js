// server/app.js
import express from 'express';
import repoRoutes from './routes/repoRoutes.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/repos', repoRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
