import { Request, Response, NextFunction } from 'express';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  projectQuerySchema,
} from '../schemas/project.schemas';
import * as projectsService from '../services/projects.service';

export async function listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = projectQuerySchema.parse(req.query);
    const userId = req.user!.id;
    const projects = await projectsService.listProjects(userId, query);
    res.status(200).json({ data: projects });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = projectIdParamSchema.parse(req.params);
    const userId = req.user!.id;
    const project = await projectsService.getProjectById(userId, id);
    res.status(200).json({ data: project });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createProjectSchema.parse(req.body);
    const userId = req.user!.id;
    const project = await projectsService.createProject(userId, body);
    res.status(201).json({ data: project });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = projectIdParamSchema.parse(req.params);
    const body = updateProjectSchema.parse(req.body);
    const userId = req.user!.id;
    const project = await projectsService.updateProject(userId, id, body);
    res.status(200).json({ data: project });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = projectIdParamSchema.parse(req.params);
    const userId = req.user!.id;
    await projectsService.deleteProject(userId, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
