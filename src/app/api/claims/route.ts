import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, parseEnumParam, readJsonBody } from "@/lib/api-params";

const SORTABLE_CLAIM_FIELDS = [
  "reasonRank",
  "truthScore",
  "logicalValidity",
  "evidenceQuality",
  "createdAt",
  "updatedAt",
] as const;

// GET /api/claims: List all active claims with their market data.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "ACTIVE";
  const category = searchParams.get("category");
  const sortBy = parseEnumParam(
    searchParams.get("sortBy"),
    SORTABLE_CLAIM_FIELDS,
    "reasonRank"
  );
  if (sortBy === null) {
    return badRequest(
      `sortBy must be one of: ${SORTABLE_CLAIM_FIELDS.join(", ")}`
    );
  }

  const where: Record<string, unknown> = { status };
  if (category) {
    where.category = category;
  }

  const claims = await prisma.claim.findMany({
    where,
    include: {
      liquidityPool: true,
      subArguments: { include: { claimEvidence: true } },
      claimEvidence: true,
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
      evidence: claim.claimEvidence,
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
  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return badRequest("Request body must be a JSON object");
  }
  const { title, description, category, initialLiquidity } = parsed.body;

  if (typeof title !== "string" || !title || typeof description !== "string" || !description) {
    return NextResponse.json(
      { error: "Title and description are required." },
      { status: 400 }
    );
  }
  if (category !== undefined && typeof category !== "string") {
    return badRequest("category must be a string");
  }

  const liquidity = initialLiquidity === undefined ? 1000 : Number(initialLiquidity);
  if (!Number.isFinite(liquidity) || liquidity <= 0) {
    return badRequest("initialLiquidity must be a positive number");
  }

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
