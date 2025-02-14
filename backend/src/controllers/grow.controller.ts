import { Request, Response, NextFunction } from 'express';
import { GrowService } from '../services/grow.service';
import { AppError } from '../middleware/error.middleware';

export class GrowController {
  private growService: GrowService;

  constructor() {
    this.growService = new GrowService();
  }

  createGrow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new AppError(401, 'Not authenticated');
      }

      const growData = req.body;
      const grow = await this.growService.createGrow(userId, growData);
      
      res.status(201).json({
        status: 'success',
        data: { grow }
      });
    } catch (error) {
      next(error);
    }
  };

  getGrows = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new AppError(401, 'Not authenticated');
      }

      const grows = await this.growService.getGrows(userId);
      res.status(200).json({
        status: 'success',
        data: { grows }
      });
    } catch (error) {
      next(error);
    }
  };

  getGrowById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new AppError(401, 'Not authenticated');
      }

      const { growId } = req.params;
      const grow = await this.growService.getGrowById(growId, userId);
      
      res.status(200).json({
        status: 'success',
        data: { grow }
      });
    } catch (error) {
      next(error);
    }
  };

  updateGrow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new AppError(401, 'Not authenticated');
      }

      const { growId } = req.params;
      const updateData = req.body;
      const updatedGrow = await this.growService.updateGrow(growId, userId, updateData);
      
      res.status(200).json({
        status: 'success',
        data: { grow: updatedGrow }
      });
    } catch (error) {
      next(error);
    }
  };

  deleteGrow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        throw new AppError(401, 'Not authenticated');
      }

      const { growId } = req.params;
      await this.growService.deleteGrow(growId, userId);
      
      res.status(200).json({
        status: 'success',
        message: 'Grow deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
} 