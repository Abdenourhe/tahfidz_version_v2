import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ParentProfileAttendance } from "@/components/parent/ParentProfileAttendance"

export default async function ParentAttendancePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "PARENT") {
    redirect("/login")
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      childrenLinks: {
        where: { isVerified: true },
        include: {
          student: {
            include: {
              user: { select: { fullName: true, fullNameAr: true, avatar: true } },
              group: { select: { id: true, name: true, schedule: true } },
              teacher: { include: { user: { select: { fullName: true } } } },
            },
          },
        },
      },
    },
  })

  if (!parent) {
    redirect("/login")
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <ParentProfileAttendance>{parent.childrenLinks as any}</ParentProfileAttendance>
    </div>
  )
}
