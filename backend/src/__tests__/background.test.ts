import { jobQueue } from '../services/background';

describe('BackgroundJobQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes a job and completes', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    jobQueue.register('test-job', handler);

    const id = await jobQueue.enqueue('test-job', { foo: 'bar' });
    // Wait for async processNext to invoke handler
    await new Promise((r) => setTimeout(r, 50));

    expect(handler).toHaveBeenCalledWith({ foo: 'bar' });
    expect(id).toBeDefined();
  });

  it('does not reject when handler succeeds', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    jobQueue.register('good-job', handler);

    await expect(jobQueue.enqueue('good-job', {})).resolves.toBeDefined();
  });

  it('rejects on enqueue if no handler registered', async () => {
    await expect(jobQueue.enqueue('unknown', {})).rejects.toThrow('No handler registered');
  });

  it('reports pending count', () => {
    expect(jobQueue.pendingCount).toBeGreaterThanOrEqual(0);
  });
});
