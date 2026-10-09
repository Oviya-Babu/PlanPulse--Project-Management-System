import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as tasksController from '../controllers/tasks.controller';

const router = Router();

// All task endpoints require authentication (SEC-004)
router.use(authenticate);

router.get('/', tasksController.listTasks);
router.post('/', tasksController.createTask);
router.get('/:id', tasksController.getTask);
router.put('/:id', tasksController.updateTask);
router.delete('/:id', tasksController.deleteTask);

export default router;
