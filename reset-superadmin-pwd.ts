import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'he.abdenour@gmail.com'
  const newPassword = 'Tahfidz2024!'
  const hashed = await bcrypt.hash(newPassword, 12)

  const user = await prisma.user.updateMany({
    where: { email },
    data: { password: hashed },
  })

  console.log('User updated:', user.count)
  console.log('New password:', newPassword)
}

main().catch(console.error).finally(() => prisma.$disconnect())
