import { Priority, Task } from '@prisma/client';

interface QueueTask {
  id: string;
  priority: Priority;
  createdAt: Date;
  title: string;
  description: string;
}

export class TaskQueue {
  private heap: QueueTask[] = [];

  private getPriorityValue(priority: Priority): number {
    switch (priority) {
      case Priority.high:
        return 1;
      case Priority.medium:
        return 2;
      case Priority.low:
        return 3;
      default:
        return 3;
    }
  }

  private getParentIndex(index: number): number {
    return Math.floor((index - 1) / 2);
  }

  private getLeftChildIndex(index: number): number {
    return 2 * index + 1;
  }

  private getRightChildIndex(index: number): number {
    return 2 * index + 2;
  }

  private swap(index1: number, index2: number): void {
    const temp = this.heap[index1];
    this.heap[index1] = this.heap[index2];
    this.heap[index2] = temp;
  }

  private compareTasks(task1: QueueTask, task2: QueueTask): number {
    const priority1 = this.getPriorityValue(task1.priority);
    const priority2 = this.getPriorityValue(task2.priority);

    if (priority1 !== priority2) {
      return priority1 - priority2;
    }
    return task1.createdAt.getTime() - task2.createdAt.getTime();
  }

  private heapifyUp(index: number): void {
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      if (this.compareTasks(this.heap[index], this.heap[parentIndex]) < 0) {
        this.swap(index, parentIndex);
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private heapifyDown(index: number): void {
    while (true) {
      let smallest = index;
      const leftChild = this.getLeftChildIndex(index);
      const rightChild = this.getRightChildIndex(index);

      if (leftChild < this.heap.length && 
          this.compareTasks(this.heap[leftChild], this.heap[smallest]) < 0) {
        smallest = leftChild;
      }

      if (rightChild < this.heap.length && 
          this.compareTasks(this.heap[rightChild], this.heap[smallest]) < 0) {
        smallest = rightChild;
      }

      if (smallest !== index) {
        this.swap(index, smallest);
        index = smallest;
      } else {
        break;
      }
    }
  }

  enqueue(task: QueueTask): void {
    this.heap.push(task);
    this.heapifyUp(this.heap.length - 1);
  }

  dequeue(): QueueTask | undefined {
    if (this.heap.length === 0) return undefined;

    const result = this.heap[0];
    const last = this.heap.pop()!;

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.heapifyDown(0);
    }

    return result;
  }

  peek(): QueueTask | undefined {
    return this.heap[0];
  }

  get size(): number {
    return this.heap.length;
  }

  getAll(): QueueTask[] {
    return [...this.heap].sort((a, b) => this.compareTasks(a, b));
  }
} 