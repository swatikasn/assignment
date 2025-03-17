import { Router } from "express";
import { PrismaClient, Priority, Status } from '@prisma/client';
import { Request, Response } from 'express';

const router = Router();
const prisma = new PrismaClient();

const taskCache: Map<string, any[]> = new Map();

router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, description, priority } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not found' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: Status.pending,
        priority: priority as Priority,
        userId: userId!
      }
    });

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating task' });
  }
});

router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 10, priority, status } = req.query;
    const cacheKey = JSON.stringify({ userId, page, limit, priority, status });
    if (taskCache.has(cacheKey)) {
      return res.json(taskCache.get(cacheKey));
    }
    const whereClause: any = {
      userId: userId!
    };

    if (priority) {
      whereClause.priority = priority;
    }
    if (status) {
      whereClause.status = status;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    taskCache.set(cacheKey, tasks);

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: userId!
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching task' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;
    const userId = req.user?.userId;

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: userId!
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status: status as Status,
        priority: priority as Priority,
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating task' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: userId!
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting task' });
  }
});

export default router; 