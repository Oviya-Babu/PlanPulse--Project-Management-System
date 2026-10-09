import { Request, Response, NextFunction } from 'express';
import { getDashboardMetrics } from '../services/dashboard.service';

export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const metrics = await getDashboardMetrics(userId);
    res.status(200).json({ data: metrics });
  } catch (error) {
    next(error);
  }
}
