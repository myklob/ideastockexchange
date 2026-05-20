import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { addTrade, getBelief, users } from '@/lib/data';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: { beliefSlug: string; side: 'YES' | 'NO'; amount: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { beliefSlug, side, amount } = body;

  if (!beliefSlug || !side || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const belief = getBelief(beliefSlug);
  if (!belief) return NextResponse.json({ error: 'Belief not found' }, { status: 404 });

  const userId = (session.user as { id?: string }).id ?? '';
  const user = users.find(u => u.id === userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (user.credits < amount) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
  }

  const price  = side === 'YES' ? belief.marketPrice / 100 : 1 - belief.marketPrice / 100;
  const shares = amount / price;

  const trade = addTrade({ userId, beliefSlug, side, amount, price, shares });
  user.credits -= amount;

  return NextResponse.json({ trade, newMarketPrice: belief.marketPrice });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ trades: [] });
  const { getTradesByUser } = await import('@/lib/data');
  const userId = (session.user as { id?: string }).id ?? '';
  return NextResponse.json({ trades: getTradesByUser(userId) });
}
