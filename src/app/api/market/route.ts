import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBuy, calculateSell, getPrices } from "@/lib/market-maker";

// POST /api/market: Execute a trade (buy or sell shares).
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, claimId, shareType, direction, amount } = body;

  if (!userId || !claimId || !shareType || !direction || !amount) {
    return NextResponse.json(
      { error: "Missing required fields: userId, claimId, shareType, direction, amount." },
      { status: 400 }
    );
  }

  if (!["YES", "NO"].includes(shareType)) {
    return NextResponse.json(
      { error: "shareType must be YES or NO." },
      { status: 400 }
    );
  }

  if (!["BUY", "SELL"].includes(direction)) {
    return NextResponse.json(
      { error: "direction must be BUY or SELL." },
      { status: 400 }
    );
  }

  if (amount <= 0) {
    return NextResponse.json(
      { error: "Amount must be positive." },
      { status: 400 }
    );
  }

  const pool = await prisma.liquidityPool.findUnique({
    where: { claimId },
  });

  if (!pool) {
    return NextResponse.json(
      { error: "No liquidity pool found for this claim." },
      { status: 404 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json(
      { error: "User not found." },
      { status: 404 }
    );
  }

  if (direction === "BUY") {
    if (user.currentBalance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance." },
        { status: 400 }
      );
    }

    const transaction = calculateBuy(
      {
        yesShares: pool.yesShares,
        noShares: pool.noShares,
        constantProduct: pool.constantProduct,
      },
      shareType as "YES" | "NO",
      amount
    );

    // Execute the trade atomically.
    const result = await prisma.$transaction(async (tx) => {
      // Update pool state.
      const newYesShares =
        shareType === "YES"
          ? pool.yesShares - transaction.sharesReceived
          : pool.yesShares + amount;
      const newNoShares =
        shareType === "NO"
          ? pool.noShares - transaction.sharesReceived
          : pool.noShares + amount;

      await tx.liquidityPool.update({
        where: { claimId },
        data: {
          yesShares: newYesShares,
          noShares: newNoShares,
          totalVolume: { increment: amount },
        },
      });

      // Deduct user balance.
      await tx.user.update({
        where: { id: userId },
        data: {
          currentBalance: { decrement: amount },
          totalInvested: { increment: amount },
        },
      });

      // Update or create share holding.
      const existingShare = await tx.share.findUnique({
        where: {
          userId_claimId_shareType: {
            userId,
            claimId,
            shareType: shareType as "YES" | "NO",
          },
        },
      });

      if (existingShare) {
        const totalQuantity = existingShare.quantity + transaction.sharesReceived;
        const totalCost =
          existingShare.quantity * existingShare.avgPurchasePrice + amount;
        const newAvgPrice = totalCost / totalQuantity;

        await tx.share.update({
          where: { id: existingShare.id },
          data: {
            quantity: totalQuantity,
            avgPurchasePrice: newAvgPrice,
          },
        });
      } else {
        await tx.share.create({
          data: {
            userId,
            claimId,
            shareType: shareType as "YES" | "NO",
            quantity: transaction.sharesReceived,
            avgPurchasePrice: transaction.pricePerShare,
          },
        });
      }

      // Record trade.
      const trade = await tx.trade.create({
        data: {
          userId,
          claimId,
          shareType: shareType as "YES" | "NO",
          direction: "BUY",
          quantity: transaction.sharesReceived,
          pricePerShare: transaction.pricePerShare,
          totalCost: amount,
        },
      });

      return { trade, transaction };
    });

    return NextResponse.json(result);
  }

  // SELL direction.
  const existingShare = await prisma.share.findUnique({
    where: {
      userId_claimId_shareType: {
        userId,
        claimId,
        shareType: shareType as "YES" | "NO",
      },
    },
  });

  if (!existingShare || existingShare.quantity < amount) {
    return NextResponse.json(
      { error: "Insufficient shares to sell." },
      { status: 400 }
    );
  }

  const transaction = calculateSell(
    {
      yesShares: pool.yesShares,
      noShares: pool.noShares,
      constantProduct: pool.constantProduct,
    },
    shareType as "YES" | "NO",
    amount
  );

  const result = await prisma.$transaction(async (tx) => {
    const newYesShares =
      shareType === "YES"
        ? pool.yesShares + amount
        : pool.yesShares - transaction.sharesReceived;
    const newNoShares =
      shareType === "NO"
        ? pool.noShares + amount
        : pool.noShares - transaction.sharesReceived;

    await tx.liquidityPool.update({
      where: { claimId },
      data: {
        yesShares: newYesShares,
        noShares: newNoShares,
        totalVolume: { increment: transaction.totalCost },
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        currentBalance: { increment: transaction.sharesReceived },
      },
    });

    const newQuantity = existingShare.quantity - amount;
    if (newQuantity <= 0) {
      await tx.share.delete({ where: { id: existingShare.id } });
    } else {
      await tx.share.update({
        where: { id: existingShare.id },
        data: { quantity: newQuantity },
      });
    }

    const trade = await tx.trade.create({
      data: {
        userId,
        claimId,
        shareType: shareType as "YES" | "NO",
        direction: "SELL",
        quantity: amount,
        pricePerShare: transaction.pricePerShare,
        totalCost: transaction.totalCost,
      },
    });

    return { trade, transaction };
  });

  return NextResponse.json(result);
}
