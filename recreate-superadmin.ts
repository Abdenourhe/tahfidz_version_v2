import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'ton-email-verifie@gmail.com'
  const password = 'Tahfidz2024!'
  const hashed = await bcrypt.hash(password, 12)

  // 1. Recreer l'ecole platform
  const school = await prisma.school.upsert({
    where: { slug: 'platform' },
    update: {},
    create: {
      name: 'TAHFIDZ Platform',
      slug: 'platform',
      plan: 'ENTERPRISE',
      isActive: true,
      settings: {},
      country: 'DZ',
    },
  })
  console.log('School created:', school.id, school.slug)

  // 2. Creer le SuperAdmin
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      fullName: 'Super Admin',
      role: 'SUPERADMIN',
      isActive: true,
      schoolId: school.id,
    },
  })
  console.log('SuperAdmin created:', user.id, user.email)
  console.log('Password:', password)
}

main().catch(console.error).finally(() => prisma.$disconnect())
