import Link from 'next/link';

const RESOURCES = [
  'Schlicht Protocol', 'Product Reviews', 'Cost-Benefit Analysis',
  'Browse Laws', 'Prediction Markets', 'FAQ & Criticisms',
];
const FRAMEWORK = ['Truth', 'Interests', 'Evidence', 'Assumptions', 'Strong-to-Weak Spectrum'];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-16 bg-white">
      <div className="max-w-[1280px] mx-auto px-6 py-10 grid grid-cols-3 gap-8">
        <div>
          <h4 className="m-0 text-sm font-bold text-[var(--foreground)]">Idea Stock Exchange</h4>
          <p className="text-[13px] text-[var(--muted-foreground)] mt-2 leading-relaxed">
            Computational Epistemology Platform. Making confidence inspectable.
          </p>
        </div>
        <div>
          <h4 className="m-0 text-sm font-bold text-[var(--foreground)]">Resources</h4>
          <ul className="list-none p-0 mt-3 flex flex-col gap-2">
            {RESOURCES.map(l => (
              <li key={l}>
                <Link href="#" className="text-[13px] text-[#525252] no-underline hover:text-[var(--foreground)] transition-colors">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="m-0 text-sm font-bold text-[var(--foreground)]">Framework</h4>
          <ul className="list-none p-0 mt-3 flex flex-col gap-2">
            {FRAMEWORK.map(l => (
              <li key={l}>
                <Link href="#" className="text-[13px] text-[#525252] no-underline hover:text-[var(--foreground)] transition-colors">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--border)] px-6 py-5 text-center text-[13px] text-[var(--muted-foreground)]">
        No ideological ownership. Good ideas win by surviving reality.
      </div>
    </footer>
  );
}
