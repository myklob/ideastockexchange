import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const beliefId = parseInt(id, 10);

  const belief = await prisma.belief.findUnique({
    where: { id: beliefId },
    include: {
      arguments: {
        include: {
          belief: true,
          linkageArguments: true,
        },
      },
      evidence: true,
      objectiveCriteria: true,
      valuesAnalysis: true,
      interestsAnalysis: true,
      assumptions: true,
      costBenefitAnalysis: true,
      impactAnalysis: true,
      compromises: true,
      obstacles: true,
      biases: true,
      mediaResources: true,
      legalEntries: true,
    },
  });

  if (!belief) {
    return NextResponse.json({ error: "Belief not found" }, { status: 404 });
  }

  return NextResponse.json(belief);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const beliefId = parseInt(id, 10);
  const body = await req.json();

  const belief = await prisma.belief.update({
    where: { id: beliefId },
    data: body,
  });

  return NextResponse.json(belief);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const beliefId = parseInt(id, 10);

  await prisma.belief.delete({ where: { id: beliefId } });

  return NextResponse.json({ success: true });
}
