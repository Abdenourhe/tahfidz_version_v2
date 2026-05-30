import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const superadmins = await prisma.user.findMany({
    where: { role: 'SUPERADMIN' },
    select: { id: true, email: true, fullName: true, schoolId: true },
  })
  console.log('SuperAdmins found:', superadmins.length)
  superadmins.forEach(u => console.log(u))

  const schools = await prisma.school.findMany({
    select: { id: true, name: true, slug: true },
  })
  console.log('\nSchools:')
  schools.forEach(s => console.log(s))
}

main().catch(console.error).finally(() => prisma.$disconnect())
