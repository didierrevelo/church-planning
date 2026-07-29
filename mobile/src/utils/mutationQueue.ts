import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const QUEUE_KEY = 'mutation_queue';

interface QueuedMutation {
  id: string;
  method: 'post' | 'put' | 'patch' | 'delete';
  url: string;
  data?: any;
  createdAt: string;
}

async function getQueue(): Promise<QueuedMutation[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveQueue(queue: QueuedMutation[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueMutation(
  method: QueuedMutation['method'],
  url: string,
  data?: any,
): Promise<void> {
  const queue = await getQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    method,
    url,
    data,
    createdAt: new Date().toISOString(),
  });
  await saveQueue(queue);
}

export async function processQueue(): Promise<{ processed: number; failed: number }> {
  const queue = await getQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;
  const remaining: QueuedMutation[] = [];

  for (const mutation of queue) {
    try {
      await (api as any)[mutation.method](mutation.url, mutation.data);
      processed++;
    } catch (err) {
      if ((err as any)?.response?.status >= 400 && (err as any)?.response?.status < 500) {
        failed++;
      } else {
        remaining.push(mutation);
      }
    }
  }

  await saveQueue(remaining);
  return { processed, failed };
}

export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
