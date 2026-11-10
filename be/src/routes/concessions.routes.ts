import { Router } from 'express';
import {
  getAll,
  getById,
  create,
  update,
  updateImage,
  remove,
} from '../controllers/concessions.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadImage, validateImageSignature } from '../middlewares/upload.middleware';

const router: Router = Router();

router.get('/', authenticate, getAll);
router.get('/:id', getById);
router.post('/', authenticate, uploadImage.single('image'), validateImageSignature, create);
router.put('/:id', authenticate, update);
router.put(
  '/:id/image',
  authenticate,
  uploadImage.single('image'),
  validateImageSignature,
  updateImage,
);
router.delete('/:id', authenticate, remove);

export default router;
