import { createChurchSchema, updateChurchSchema, addMemberSchema } from '../validation/churches';
import { loginSchema, inviteSchema, updateProfileSchema, changePasswordSchema } from '../validation/auth';
import { createServiceSchema } from '../validation/services';
import { createSongSchema, updateSongSchema } from '../validation/songs';
import { createMinistrySchema } from '../validation/ministries';
import { uploadFileSchema } from '../validation/files';
import { createTemplateSchema } from '../validation/templates';

function expectValid(schema: any, data: any) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);
}

function expectInvalid(schema: any, data: any) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
}

describe('Validation Schemas', () => {
  describe('churches', () => {
    it('createChurchSchema accepts valid data', () => {
      expectValid(createChurchSchema, { body: { name: 'Iglesia Central', slug: 'central' } });
    });

    it('createChurchSchema rejects missing name', () => {
      expectInvalid(createChurchSchema, { body: { slug: 'test' } });
    });

    it('updateChurchSchema accepts partial data', () => {
      expectValid(updateChurchSchema, { body: { name: 'Renamed' } });
    });

    it('addMemberSchema accepts valid role', () => {
      expectValid(addMemberSchema, { body: { userId: '550e8400-e29b-41d4-a716-446655440000', role: 'leader' } });
    });

    it('addMemberSchema rejects invalid role', () => {
      expectInvalid(addMemberSchema, { body: { userId: '550e8400-e29b-41d4-a716-446655440000', role: 'superadmin' } });
    });
  });

  describe('auth', () => {
    it('loginSchema accepts valid email+password', () => {
      expectValid(loginSchema, { body: { email: 'test@test.com', password: '123456' } });
    });

    it('loginSchema rejects invalid email', () => {
      expectInvalid(loginSchema, { body: { email: 'not-email', password: '123456' } });
    });

    it('updateProfileSchema accepts valid data', () => {
      expectValid(updateProfileSchema, { body: { name: 'Juan', phone: '555-0100' } });
    });

    it('updateProfileSchema rejects empty name', () => {
      expectInvalid(updateProfileSchema, { body: { name: '' } });
    });

    it('inviteSchema rejects empty churchId', () => {
      expectInvalid(inviteSchema, { body: { email: 'a@b.com', name: 'Test', churchId: '' } });
    });

    it('changePasswordSchema accepts valid passwords', () => {
      expectValid(changePasswordSchema, { body: { currentPassword: 'old', newPassword: 'newpass12' } });
    });

    it('changePasswordSchema rejects short new password', () => {
      expectInvalid(changePasswordSchema, { body: { currentPassword: 'old', newPassword: 'short' } });
    });
  });

  describe('services', () => {
    it('createServiceSchema accepts valid data', () => {
      expectValid(createServiceSchema, {
        body: { title: 'Culto Domingo', date: '2025-01-15', time: '10:00' },
      });
    });

    it('createServiceSchema rejects missing title', () => {
      expectInvalid(createServiceSchema, { body: { date: '2025-01-15', time: '10:00' } });
    });

    it('createServiceSchema rejects invalid date', () => {
      expectInvalid(createServiceSchema, { body: { title: 'Test', date: 'bad-date', time: '10:00' } });
    });
  });

  describe('songs', () => {
    it('createSongSchema accepts valid data', () => {
      expectValid(createSongSchema, { body: { title: 'Amazing Grace', order: 1 } });
    });

    it('updateSongSchema rejects negative order', () => {
      expectInvalid(updateSongSchema, { body: { order: -1 } });
    });
  });

  describe('ministries', () => {
    it('createMinistrySchema accepts valid name', () => {
      expectValid(createMinistrySchema, { body: { name: 'Alabanza' } });
    });

    it('createMinistrySchema rejects empty name', () => {
      expectInvalid(createMinistrySchema, { body: { name: '' } });
    });
  });

  describe('files', () => {
    it('uploadFileSchema accepts valid metadata', () => {
      expectValid(uploadFileSchema, { body: { filename: 'doc.pdf', filetype: 'pdf', filesize: 1024 } });
    });

    it('uploadFileSchema rejects oversized file', () => {
      expectInvalid(uploadFileSchema, { body: { filename: 'big.pdf', filetype: 'pdf', filesize: 100_000_001 } });
    });
  });

  describe('templates', () => {
    const validSegment = { title: 'Alabanza', durationMin: 20 };

    it('createTemplateSchema accepts valid data', () => {
      expectValid(createTemplateSchema, { body: { name: 'Template 1', segments: [validSegment] } });
    });

    it('createTemplateSchema rejects empty segments', () => {
      expectInvalid(createTemplateSchema, { body: { name: 'T', segments: [] } });
    });
  });
});
