type JobHandler<T = any> = (payload: T) => Promise<void>;

interface Job<T = any> {
  id: string;
  type: string;
  payload: T;
  handler: JobHandler<T>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
}

class BackgroundJobQueue {
  private queue: Job[] = [];
  private processing = false;
  private handlers = new Map<string, JobHandler>();
  private listeners = new Map<string, Set<(job: Job) => void>>();

  register<T>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler);
  }

  on(event: string, callback: (job: Job) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  private emit(event: string, job: Job): void {
    this.listeners.get(event)?.forEach((cb) => cb(job));
  }

  async enqueue<T>(type: string, payload: T): Promise<string> {
    const handler = this.handlers.get(type);
    if (!handler) throw new Error(`No handler registered for job type: ${type}`);

    const id = crypto.randomUUID();
    const job: Job<T> = {
      id,
      type,
      payload,
      handler,
      status: 'pending',
      createdAt: new Date(),
    };

    this.queue.push(job);
    this.emit('enqueued', job);
    this.processNext();
    return id;
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const job = this.queue.shift()!;
    job.status = 'processing';
    this.emit('processing', job);

    try {
      await job.handler(job.payload);
      job.status = 'completed';
      this.emit('completed', job);
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      this.emit('failed', job);
      console.error(`[BackgroundJob] Failed: ${job.type} (${job.id}):`, error.message);
    } finally {
      this.processing = false;
      this.processNext();
    }
  }

  get pendingCount(): number {
    return this.queue.length;
  }
}

export const jobQueue = new BackgroundJobQueue();

export async function waitForAll(): Promise<void> {
  while (jobQueue.pendingCount > 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
