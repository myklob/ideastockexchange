import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — Idea Stock Exchange',
  description: 'How to reach the founder and contribute to the Idea Stock Exchange.',
}

export default function ContactPage() {
  return (
    <div className="max-w-[960px] mx-auto px-4 py-8 leading-7 text-[#333]">
      <p className="text-right text-sm italic text-gray-600 mb-6">
        <Link href="/" className="text-blue-700 hover:underline">Home</Link>
        {' > '}
        <strong>Contact</strong>
      </p>
      <h1 className="text-3xl font-bold mb-3">Contact</h1>
      <p className="mb-4">
        The Idea Stock Exchange is built by{' '}
        <a
          href="https://github.com/myklob"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 hover:underline"
        >
          Mike Laub (myklob)
        </a>
        . The fastest way to reach the project:
      </p>
      <ul className="list-disc ml-6 mb-4 space-y-1">
        <li>
          <a
            href="https://github.com/myklob/ideastockexchange/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline"
          >
            Open an issue on GitHub
          </a>{' '}
          — bugs, feature ideas, or questions about the method.
        </li>
        <li>
          <a
            href="https://github.com/myklob/ideastockexchange"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline"
          >
            Contribute code or arguments via the repository
          </a>
          .
        </li>
        <li>
          Add a reason directly on any{' '}
          <Link href="/beliefs" className="text-blue-700 hover:underline">belief page</Link> —
          well-formed pro and con arguments are the contribution the project needs most.
        </li>
      </ul>
      <p className="text-sm text-gray-600">
        New here? Start with{' '}
        <Link href="/how-it-works" className="text-blue-700 hover:underline">how it works</Link>.
      </p>
    </div>
  )
}
