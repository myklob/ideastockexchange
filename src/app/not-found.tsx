import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-4xl font-bold mb-4">Topic Not Found</h2>
      <p className="text-gray-600 mb-8">
        The topic you&apos;re looking for doesn&apos;t exist or hasn&apos;t been created yet.
      </p>
      <Link
        href="/"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
