import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-tenant";

export async function GET(request: NextRequest) {
  // Vérifier le secret interne
  const secret = request.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug requis" }, { status: 400 });
  }

  const school = await prisma.school.findUnique({
    where:  { slug },
    select: { id: true, isActive: true },
  });

  if (!school || !school.isActive) {
    return NextResponse.json({ schoolId: null }, { status: 404 });
  }

  return NextResponse.json(
    { schoolId: school.id },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    }
  );
}
