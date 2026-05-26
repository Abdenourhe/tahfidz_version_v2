import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  await prisma.student.update({
    where: { id: "74b8a984-e9f1-43c3-acbd-4372c4586d9f" },
    data: { studentCode: "TAH-2026-005" },
  })
  console.log("Doublon corrigé : farah → TAH-2026-005")
}
main().catch(console.error).finally(() => prisma.$disconnect())
