import { Request, Response, NextFunction } from 'express';
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  taskQuerySchema,
} from '../schemas/task.schemas';
import * as tasksService from '../services/tasks.service';

export async function listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = taskQuerySchema.parse(req.query);
    const userId = req.user!.id;
    const tasks = await tasksService.listTasks(userId, query);
    res.status(200).json({ data: tasks });
  } catch (err) {
    next(err);
  }
}

export async function getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = taskIdParamSchema.parse(req.params);
    const userId = req.user!.id;
    const task = await tasksService.getTaskById(userId, id);
    res.status(200).json({ data: task });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createTaskSchema.parse(req.body);
    const userId = req.user!.id;
    const task = await tasksService.createTask(userId, body);
    res.status(201).json({ data: task });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = taskIdParamSchema.parse(req.params);
    const body = updateTaskSchema.parse(req.body);
    const userId = req.user!.id;
    const task = await tasksService.updateTask(userId, id, body);
    res.status(200).json({ data: task });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = taskIdParamSchema.parse(req.params);
    const userId = req.user!.id;
    await tasksService.deleteTask(userId, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
