import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as projectsController from '../controllers/projects.controller';

const router = Router();

// All project endpoints require authentication (SEC-004)
router.use(authenticate);

router.get('/', projectsController.listProjects);
router.post('/', projectsController.createProject);
router.get('/:id', projectsController.getProject);
router.put('/:id', projectsController.updateProject);
router.delete('/:id', projectsController.deleteProject);

export default router;
