import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { registerLimiter, loginLimiter } from '../middleware/rateLimiter';
import { registerSchema, loginSchema } from '../schemas/auth.schemas';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/auth/register', registerLimiter, validate({ body: registerSchema }), authController.register);
router.post('/auth/login', loginLimiter, validate({ body: loginSchema }), authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authenticate, authController.getMe);

export default router;
