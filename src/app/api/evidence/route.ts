import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    beliefId,
    side,
    description,
    sourceUrl,
    evidenceType,
    sourceIndependenceWeight,
    replicationQuantity,
    conclusionRelevance,
    replicationPercentage,
    linkageScore,
  } = body;

  if (!beliefId || !side || !description) {
    return NextResponse.json(
      { error: "beliefId, side, and description are required" },
      { status: 400 }
    );
  }

  if (!["supporting", "weakening"].includes(side)) {
    return NextResponse.json(
      { error: "side must be 'supporting' or 'weakening'" },
      { status: 400 }
    );
  }

  const evidence = await prisma.evidence.create({
    data: {
      beliefId,
      side,
      description,
      sourceUrl: sourceUrl || null,
      evidenceType: evidenceType || "T3",
      sourceIndependenceWeight: sourceIndependenceWeight ?? 0.5,
      replicationQuantity: replicationQuantity ?? 1,
      conclusionRelevance: conclusionRelevance ?? 0.5,
      replicationPercentage: replicationPercentage ?? 1.0,
      linkageScore: linkageScore ?? 0.5,
    },
  });

  return NextResponse.json(evidence, { status: 201 });
}
