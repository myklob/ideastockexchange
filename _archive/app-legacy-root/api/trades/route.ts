import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { addTrade, getBelief, users } from '@/lib/data';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json() as { beliefSlug: string; side: 'YES' | 'NO'; amount: number };
  const { beliefSlug, side, amount } = body;

  if (!beliefSlug || !side || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const belief = getBelief(beliefSlug);
  if (!belief) return NextResponse.json({ error: 'Belief not found' }, { status: 404 });

  const userId = session ? (session.user as { id?: string }).id ?? 'guest' : 'guest';
  const user   = users.find(u => u.id === userId);
  if (user && user.credits < amount) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
  }

  const price  = side === 'YES' ? belief.marketPrice / 100 : 1 - belief.marketPrice / 100;
  const shares = amount / price;

  const trade = addTrade({ userId, beliefSlug, side, amount, price, shares });
  if (user) user.credits -= amount;

  return NextResponse.json({ trade, newMarketPrice: belief.marketPrice });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ trades: [] });
  // Return trades for this user
  const { getTradesByUser } = await import('@/lib/data');
  const userId = (session.user as { id?: string }).id ?? '';
  return NextResponse.json({ trades: getTradesByUser(userId) });
}
