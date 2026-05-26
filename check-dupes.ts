import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const all = await prisma.student.findMany({ select: { studentCode: true }, orderBy: { studentCode: "asc" }, take: 30 })
  console.log("Codes:", all.map((s: any) => s.studentCode))
}
main().catch(console.error).finally(() => prisma.$disconnect())
