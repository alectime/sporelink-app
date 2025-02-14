import { Request, Response, NextFunction } from 'express';
import { EnvironmentService } from '../services/environment.service';
import { AppError } from '../middleware/error.middleware';

export class EnvironmentController {
  private environmentService: EnvironmentService;

  constructor() {
    this.environmentService = new EnvironmentService();
  }

  updateEnvironment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new AppError(401, 'Not authenticated');
      }

      const environmentData = req.body;
      const environment = await this.environmentService.updateEnvironment(userId, environmentData);
      
      res.status(200).json({
        status: 'success',
        data: { environment }
      });
    } catch (error) {
      next(error);
    }
  };

  getEnvironment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new AppError(401, 'Not authenticated');
      }

      const environment = await this.environmentService.getEnvironment(userId);
      res.status(200).json({
        status: 'success',
        data: { environment }
      });
    } catch (error) {
      next(error);
    }
  };

  getEnvironmentHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new AppError(401, 'Not authenticated');
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const history = await this.environmentService.getEnvironmentHistory(userId, limit);
      
      res.status(200).json({
        status: 'success',
        data: { history }
      });
    } catch (error) {
      next(error);
    }
  };
} 