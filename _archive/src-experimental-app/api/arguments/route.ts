import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { parentBeliefId, beliefId, side, linkageScore } = body;

  if (!parentBeliefId || !beliefId || !side) {
    return NextResponse.json(
      { error: "parentBeliefId, beliefId, and side are required" },
      { status: 400 }
    );
  }

  if (!["agree", "disagree"].includes(side)) {
    return NextResponse.json(
      { error: "side must be 'agree' or 'disagree'" },
      { status: 400 }
    );
  }

  const argument = await prisma.argument.create({
    data: {
      parentBeliefId,
      beliefId,
      side,
      linkageScore: linkageScore ?? 0.5,
    },
    include: { belief: true },
  });

  return NextResponse.json(argument, { status: 201 });
}
