import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { contains: 'abdenour', mode: 'insensitive' } },
    select: { id: true, email: true, fullName: true, role: true, schoolId: true },
  })
  console.log('Users found:', users.length)
  users.forEach(u => console.log(u))
}

main().catch(console.error).finally(() => prisma.$disconnect())
