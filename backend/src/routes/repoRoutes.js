// server/routes/repoRoutes.js
import express from 'express';
import { cloneRepoHandler } from '../controllers/repoControllers.js';

const router = express.Router();

router.post('/clone', cloneRepoHandler);

export default router;
