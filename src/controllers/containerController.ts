import { Request, Response, NextFunction } from 'express';
import { ContainerService } from '../services/containerService';
import { createContainerSchema, updateContainerSchema } from '../utils/validator';

export class ContainerController {
  constructor(private containerService: ContainerService) {}

  public createContainer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = createContainerSchema.parse(req.body);
      const container = this.containerService.createContainer(validated);
      res.status(201).json({ message: 'Container created successfully', container });
    } catch (err) {
      next(err);
    }
  };

  public getContainers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const containers = this.containerService.getContainers();
      res.status(200).json({ containers });
    } catch (err) {
      next(err);
    }
  };

  public getContainerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const container = this.containerService.getContainerById(req.params.id as string);
      if (!container) {
        res.status(404).json({ error: 'Container not found' });
        return;
      }
      res.status(200).json({ container });
    } catch (err) {
      next(err);
    }
  };

  public updateContainer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = updateContainerSchema.parse(req.body);
      const updated = this.containerService.updateContainer(req.params.id as string, validated as any);
      res.status(200).json({ message: 'Container updated successfully', container: updated });
    } catch (err) {
      next(err);
    }
  };

  public assignPackages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { package_ids } = req.body;
      if (!Array.isArray(package_ids) || package_ids.length === 0) {
        res.status(400).json({ error: 'package_ids must be a non-empty array of package IDs' });
        return;
      }

      this.containerService.assignPackages(req.params.id as string, package_ids);
      res.status(200).json({ message: `Successfully assigned ${package_ids.length} packages to container` });
    } catch (err) {
      next(err);
    }
  };
}
