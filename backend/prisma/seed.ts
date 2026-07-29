import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const password = await bcrypt.hash('admin123', 10);

  const church = await prisma.church.upsert({
    where: { slug: 'iglesia-central' },
    update: {},
    create: {
      name: 'Iglesia Central',
      slug: 'iglesia-central',
    },
  });
  console.log('Church created:', church.name);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@iglesia.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@iglesia.com',
      password,
    },
  });
  console.log('Admin user created:', admin.email);

  await prisma.userChurch.upsert({
    where: { userId_churchId: { userId: admin.id, churchId: church.id } },
    update: {},
    create: {
      userId: admin.id,
      churchId: church.id,
      role: 'admin',
    },
  });
  console.log('Admin linked to church');

  const ministries = [
    { name: 'Alabanza', roles: ['Vocalista', 'Batería', 'Bajo', 'Guitarra', 'Teclado', 'Director de Alabanza'] },
    { name: 'Danzas', roles: ['Bailarín', 'Coreógrafo'] },
    { name: 'Producción', roles: ['Sonido', 'Video', 'Luces', 'Transmisión'] },
    { name: 'Predicación', roles: ['Predicador', 'Invitado'] },
    { name: 'Niños', roles: ['Maestro', 'Ayudante'] },
    { name: 'Ujieres', roles: ['Ujier', 'Coordinador'] },
  ];

  for (const m of ministries) {
    const ministry = await prisma.ministry.create({
      data: {
        churchId: church.id,
        name: m.name,
      },
    });
    for (const role of m.roles) {
      await prisma.ministryRole.create({
        data: { name: role, ministryId: ministry.id },
      });
    }
  }
  console.log('Ministries and roles created');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
