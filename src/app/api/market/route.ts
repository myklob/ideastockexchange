import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBuy, calculateSell } from "@/lib/market-maker";

// POST /api/market: Execute a trade (buy or sell shares).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { userId, claimId, shareType, direction, amount } = body;

  if (!userId || !claimId || !shareType || !direction || !amount) {
    return NextResponse.json(
      { error: "Missing required fields: userId, claimId, shareType, direction, amount." },
      { status: 400 }
    );
  }

  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return NextResponse.json(
      { error: "Amount must be a finite number." },
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

    // Execute the trade atomically. The pool is re-read inside the
    // transaction: pricing from a pre-transaction snapshot lets two
    // concurrent trades both price against the same pool state and the
    // second write clobber the first, breaking the x·y=k invariant.
    const result = await prisma.$transaction(async (tx) => {
      const freshPool = await tx.liquidityPool.findUniqueOrThrow({
        where: { claimId },
      });
      const transaction = calculateBuy(
        {
          yesShares: freshPool.yesShares,
          noShares: freshPool.noShares,
          constantProduct: freshPool.constantProduct,
        },
        shareType as "YES" | "NO",
        amount
      );

      // Update pool state.
      const newYesShares =
        shareType === "YES"
          ? freshPool.yesShares - transaction.sharesReceived
          : freshPool.yesShares + amount;
      const newNoShares =
        shareType === "NO"
          ? freshPool.noShares - transaction.sharesReceived
          : freshPool.noShares + amount;

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

  const result = await prisma.$transaction(async (tx) => {
    const freshPool = await tx.liquidityPool.findUniqueOrThrow({
      where: { claimId },
    });
    const freshShare = await tx.share.findUniqueOrThrow({
      where: {
        userId_claimId_shareType: {
          userId,
          claimId,
          shareType: shareType as "YES" | "NO",
        },
      },
    });
    if (freshShare.quantity < amount) {
      throw new Error("Insufficient shares to sell.");
    }
    const transaction = calculateSell(
      {
        yesShares: freshPool.yesShares,
        noShares: freshPool.noShares,
        constantProduct: freshPool.constantProduct,
      },
      shareType as "YES" | "NO",
      amount
    );

    const newYesShares =
      shareType === "YES"
        ? freshPool.yesShares + amount
        : freshPool.yesShares - transaction.sharesReceived;
    const newNoShares =
      shareType === "NO"
        ? freshPool.noShares + amount
        : freshPool.noShares - transaction.sharesReceived;

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

    const newQuantity = freshShare.quantity - amount;
    if (newQuantity <= 0) {
      await tx.share.delete({ where: { id: freshShare.id } });
    } else {
      await tx.share.update({
        where: { id: freshShare.id },
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
