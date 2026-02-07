import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeReasonRank } from "@/lib/reason-rank";

// GET /api/claims: List all active claims with their market data.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "ACTIVE";
  const category = searchParams.get("category");
  const sortBy = searchParams.get("sortBy") || "reasonRank";

  const where: Record<string, unknown> = { status };
  if (category) {
    where.category = category;
  }

  const claims = await prisma.claim.findMany({
    where,
    include: {
      liquidityPool: true,
      subArguments: { include: { evidence: true } },
      evidence: true,
    },
    orderBy: { [sortBy]: "desc" },
  });

  const enriched = claims.map((claim) => {
    const pool = claim.liquidityPool;
    const yesPrice = pool
      ? pool.noShares / (pool.yesShares + pool.noShares)
      : 0.5;
    const noPrice = pool
      ? pool.yesShares / (pool.yesShares + pool.noShares)
      : 0.5;

    return {
      ...claim,
      marketPrice: {
        yes: yesPrice,
        no: noPrice,
      },
      divergence: claim.reasonRank - yesPrice,
    };
  });

  return NextResponse.json(enriched);
}

// POST /api/claims: Create a new claim with initial liquidity pool.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, category, initialLiquidity } = body;

  if (!title || !description) {
    return NextResponse.json(
      { error: "Title and description are required." },
      { status: 400 }
    );
  }

  const liquidity = initialLiquidity || 1000;

  const claim = await prisma.claim.create({
    data: {
      title,
      description,
      category: category || "general",
      reasonRank: 0,
      truthScore: 0,
      logicalValidity: 0,
      evidenceQuality: 0,
      liquidityPool: {
        create: {
          yesShares: liquidity,
          noShares: liquidity,
          constantProduct: liquidity * liquidity,
          totalVolume: 0,
        },
      },
    },
    include: {
      liquidityPool: true,
    },
  });

  return NextResponse.json(claim, { status: 201 });
}
