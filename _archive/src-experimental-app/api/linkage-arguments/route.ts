import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { argumentId, side, statement, strength } = body;

  if (!argumentId || !side || !statement) {
    return NextResponse.json(
      { error: "argumentId, side, and statement are required" },
      { status: 400 }
    );
  }

  if (!["agree", "disagree"].includes(side)) {
    return NextResponse.json(
      { error: "side must be 'agree' or 'disagree'" },
      { status: 400 }
    );
  }

  const linkageArgument = await prisma.linkageArgument.create({
    data: {
      argumentId,
      side,
      statement,
      strength: strength ?? 0.5,
    },
  });

  return NextResponse.json(linkageArgument, { status: 201 });
}
