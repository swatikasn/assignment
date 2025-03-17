"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const TaskQueue_1 = require("../utils/TaskQueue");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const taskQueue = new TaskQueue_1.TaskQueue();
const taskCache = new Map();
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, description, priority } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not found' });
        }
        const task = yield prisma.task.create({
            data: {
                title,
                description,
                status: client_1.Status.pending,
                priority: priority,
                userId: userId
            }
        });
        taskQueue.enqueue({
            id: task.id,
            priority: task.priority,
            createdAt: task.createdAt,
            title: task.title,
            description: task.description
        });
        taskCache.clear();
        res.status(201).json({ message: 'Task created successfully', task });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating task' });
    }
}));
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { page = 1, limit = 10, priority, status } = req.query;
        const cacheKey = JSON.stringify({ userId, page, limit, priority, status });
        if (taskCache.has(cacheKey)) {
            return res.json(taskCache.get(cacheKey));
        }
        const whereClause = {
            userId: userId
        };
        if (priority) {
            whereClause.priority = priority;
        }
        if (status) {
            whereClause.status = status;
        }
        const tasks = yield prisma.task.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });
        const tempQueue = new TaskQueue_1.TaskQueue();
        tasks.forEach(task => {
            tempQueue.enqueue({
                id: task.id,
                priority: task.priority,
                createdAt: task.createdAt,
                title: task.title,
                description: task.description
            });
        });
        const sortedTasks = tempQueue.getAll();
        taskCache.set(cacheKey, sortedTasks);
        setTimeout(() => {
            taskCache.delete(cacheKey);
        }, 5 * 60 * 1000);
        res.json(sortedTasks);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching tasks' });
    }
}));
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const task = yield prisma.task.findFirst({
            where: {
                id,
                userId: userId
            }
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching task' });
    }
}));
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { title, description, status, priority } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const existingTask = yield prisma.task.findFirst({
            where: {
                id,
                userId: userId
            }
        });
        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const updatedTask = yield prisma.task.update({
            where: { id },
            data: {
                title,
                description,
                status: status,
                priority: priority,
            }
        });
        res.json(updatedTask);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating task' });
    }
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const existingTask = yield prisma.task.findFirst({
            where: {
                id,
                userId: userId
            }
        });
        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }
        yield prisma.task.delete({
            where: { id }
        });
        res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting task' });
    }
}));
exports.default = router;
