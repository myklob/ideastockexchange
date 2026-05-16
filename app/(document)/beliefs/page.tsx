import { beliefs } from '@/lib/data';
import { BeliefsClient } from './BeliefsClient';

export const metadata = { title: 'Beliefs — Idea Stock Exchange' };

export default function BeliefsPage() {
  return (
    <div className="max-w-[1080px] mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold m-0">Beliefs</h1>
      <p className="text-sm text-[var(--muted-foreground)] mt-1.5 mb-6">
        Every belief has its own canonical page — a verification dashboard, not a text dump.
      </p>
      <BeliefsClient beliefs={beliefs} />
    </div>
  );
}
