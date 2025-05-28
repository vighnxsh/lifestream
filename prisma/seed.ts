import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Check if admin already exists
  const adminExists = await prisma.user.findUnique({
    where: {
      email: 'admin@bloodbank.com',
    },
  });

  // Only create admin if it doesn't exist
  if (!adminExists) {
    const hashedPassword = await hash('admin123', 10);
    
    await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@bloodbank.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    
    console.log('Default admin user created:');
    console.log('Email: admin@bloodbank.com');
    console.log('Password: admin123');
  } else {
    console.log('Admin user already exists');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
