import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushToUser(
  userId: string,
  churchId: string,
  payload: PushPayload,
) {
  const tokens = await prisma.pushToken.findMany({
    where: { userId, churchId },
  });

  for (const pt of tokens) {
    try {
      const message = {
        to: pt.token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
      };

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
    } catch (err) {
      console.error(`Push send failed for token ${pt.id}:`, err);
    }
  }
}

export async function createInAppNotification(
  userId: string,
  churchId: string,
  type: string,
  message: string,
  referenceId?: string,
  referenceType?: string,
) {
  return prisma.notification.create({
    data: { userId, churchId, type, message, referenceId, referenceType },
  });
}

export async function notifyAndPush(
  userId: string,
  churchId: string,
  type: string,
  message: string,
  pushPayload: PushPayload,
  referenceId?: string,
  referenceType?: string,
) {
  await createInAppNotification(userId, churchId, type, message, referenceId, referenceType);
  await sendPushToUser(userId, churchId, pushPayload);
}
