import { RequestHandler, Router } from 'express';
import { UserController } from '../controllers/UserController';

export const createUserRoutes = (
  controller: UserController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.post('/', (req, res, next) => {
    controller.create(req, res).catch(next);
  });

  router.get('/me', authMiddleware, (req, res) => {
    res.json({ success: true, data: req.user });
  });

  return router;
};
