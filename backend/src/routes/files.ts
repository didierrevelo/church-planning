import express from 'express';
const router = express.Router();
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, requireChurch, AuthRequest, publicUserSelect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadFileSchema } from '../validation/files';
import { jobQueue } from '../services/background';
import { prisma } from '../lib/prisma';

const s3 = process.env.AWS_ACCESS_KEY_ID
  ? new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

router.get('/:serviceId', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.serviceId },
      select: { churchId: true },
    });
    if (!service || service.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const files = await prisma.file.findMany({
      where: { serviceId: req.params.serviceId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: publicUserSelect },
        ministry: true,
      },
    });
    res.json(files);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:serviceId/upload', authenticate, requireChurch, validate(uploadFileSchema), async (req: AuthRequest, res: express.Response) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.serviceId },
      select: { churchId: true },
    });
    if (!service || service.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { filename, filetype, filesize, ministryId } = req.body;
    const key = `services/${req.params.serviceId}/${uuidv4()}-${filename}`;

    let presignedUrl: string | null = null;
    if (s3) {
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        ContentType: filetype,
        ContentLength: filesize,
      });
      presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    }

    const file = await prisma.file.create({
      data: {
        serviceId: req.params.serviceId,
        uploadedById: req.userId!,
        name: filename,
        type: filetype.split('/').pop() || 'unknown',
        url: s3
          ? `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
          : `/local-files/${key}`,
        size: filesize,
        ministryId: ministryId || null,
      },
    });

    jobQueue.enqueue('process-file', { fileId: file.id, serviceId: req.params.serviceId });

    res.json({ presignedUrl, file });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, requireChurch, async (req: AuthRequest, res: express.Response) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
      include: { service: { select: { churchId: true } } },
    });
    if (!file || file.service.churchId !== req.churchId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await prisma.file.delete({ where: { id: req.params.id } });
    res.json({ message: 'File deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
