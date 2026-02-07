import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const beliefs = await prisma.belief.findMany({
    include: {
      arguments: { include: { belief: true } },
      evidence: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(beliefs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { statement, slug, category, subcategory, deweyNumber, positivity } = body;

  if (!statement || !slug) {
    return NextResponse.json(
      { error: "statement and slug are required" },
      { status: 400 }
    );
  }

  const belief = await prisma.belief.create({
    data: {
      statement,
      slug,
      category: category || null,
      subcategory: subcategory || null,
      deweyNumber: deweyNumber || null,
      positivity: positivity ?? 0,
    },
  });

  return NextResponse.json(belief, { status: 201 });
}
