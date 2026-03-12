import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrices } from "@/lib/market-maker";
import { computePortfolioSummary } from "@/lib/portfolio";

// GET /api/portfolio?userId=xxx: Get a user's portfolio summary.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json(
      { error: "User not found." },
      { status: 404 }
    );
  }

  const shares = await prisma.share.findMany({
    where: { userId },
    include: {
      claim: {
        include: { liquidityPool: true },
      },
    },
  });

  const holdings = shares.map((share) => {
    const pool = share.claim.liquidityPool;
    let currentPrice = 0.5;
    if (pool) {
      const prices = getPrices({
        yesShares: pool.yesShares,
        noShares: pool.noShares,
        constantProduct: pool.constantProduct,
      });
      currentPrice =
        share.shareType === "YES" ? prices.yesPrice : prices.noPrice;
    }

    return {
      claimId: share.claimId,
      claimTitle: share.claim.title,
      shareType: share.shareType as "YES" | "NO",
      quantity: share.quantity,
      avgPurchasePrice: share.avgPurchasePrice,
      currentPrice,
    };
  });

  const summary = computePortfolioSummary(
    holdings,
    user.realizedPnl,
    user.currentBalance
  );

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      currentBalance: user.currentBalance,
    },
    ...summary,
  });
}
