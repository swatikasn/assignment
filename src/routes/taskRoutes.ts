import { Router } from "express";
import { PrismaClient, Priority, Status } from '@prisma/client';
import { Request, Response } from 'express';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, description, priority } = req.body;
    const userId = req.user?.userId;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: Status.pending,
        priority: priority as Priority,
        userId: userId!
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating task' });
  }
});

router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const tasks = await prisma.task.findMany({
      where: {
        userId: userId!
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

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