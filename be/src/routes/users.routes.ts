// src/routes/users.routes.ts
import { Router } from 'express';
import { getProfile, updateAvatar } from '../controllers/users.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadAvatar } from '../middlewares/upload.middleware';

const router = Router();

router.get('/me', authenticate, getProfile);
router.put('/me/avatar', authenticate, uploadAvatar.single('avatar'), updateAvatar);

export default router;
