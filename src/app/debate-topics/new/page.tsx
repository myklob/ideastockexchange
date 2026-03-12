'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function NewDebateTopicPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGenerate = searchParams.get('generate') === '1';

  const [mode, setMode] = useState<'generate' | 'manual'>(isGenerate ? 'generate' : 'generate');
  const [topicName, setTopicName] = useState('');
  const [categoryPath, setCategoryPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topicName.trim()) return;

    setLoading(true);
    setError('');
    setStatus('Generating topic page with AI — this may take 30–60 seconds...');

    try {
      const catPath = categoryPath.trim()
        ? categoryPath.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;

      const res = await fetch('/api/debate-topics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicName: topicName.trim(), categoryPath: catPath }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const topic = await res.json();
      router.push(`/debate-topics/${topic.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/debate-topics" className="text-blue-600 hover:underline text-sm">
            ← Debate Topics
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Create Debate Topic Page</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Mode toggle */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setMode('generate')}
            className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
              mode === 'generate'
                ? 'bg-green-700 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            🤖 AI Generate
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
              mode === 'manual'
                ? 'bg-blue-700 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            ✏️ Manual / API
          </button>
        </div>

        {mode === 'generate' && (
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-xl font-bold mb-2">🤖 AI-Generate a Full Debate Topic Page</h2>
            <p className="text-gray-600 text-sm mb-6">
              Enter any debate topic and the AI will generate the complete structured page — all 9 sections including positions, escalation levels, assumptions, values conflict, evidence, objective criteria, and media resources. Requires an AI API key configured in environment variables.
            </p>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Marriage, Universal Basic Income, Gun Control, Capital Punishment"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Path{' '}
                  <span className="text-gray-400 font-normal">(optional, comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={categoryPath}
                  onChange={(e) => setCategoryPath(e.target.value)}
                  placeholder="e.g. Society &amp; Culture, Family"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  disabled={loading}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Breadcrumb categories for this topic, from broad to specific.
                </p>
              </div>

              {status && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded">
                  ⏳ {status}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded">
                  ❌ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !topicName.trim()}
                className="w-full py-3 bg-green-700 text-white rounded font-medium hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '⏳ Generating...' : '🤖 Generate Debate Topic Page'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded text-xs text-gray-600">
              <strong>What gets generated:</strong> Definition & scope, 5-point position spectrum, escalation levels (1–6), foundational assumptions by position range, abstraction ladder, core values conflict, common ground & compromise, evidence ledger, objective criteria table, media resources, and related topics.
            </div>
          </div>
        )}

        {mode === 'manual' && (
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-xl font-bold mb-2">✏️ Create via API</h2>
            <p className="text-gray-600 text-sm mb-4">
              Use the REST API to create topics programmatically. This is ideal for bots, scripts, and bulk imports.
            </p>

            <div className="bg-gray-900 text-green-400 rounded p-4 text-xs font-mono overflow-x-auto">
              <div className="text-gray-400 mb-2"># Create a topic via POST</div>
              <div>curl -X POST /api/debate-topics \</div>
              <div className="ml-2">-H &apos;Content-Type: application/json&apos; \</div>
              <div className="ml-2">-d &apos;&#123;</div>
              <div className="ml-4">&quot;slug&quot;: &quot;universal-basic-income&quot;,</div>
              <div className="ml-4">&quot;title&quot;: &quot;Universal Basic Income&quot;,</div>
              <div className="ml-4">&quot;categoryPath&quot;: [&quot;Economics&quot;, &quot;Social Policy&quot;],</div>
              <div className="ml-4">&quot;external&quot;: &#123; &quot;wikipediaUrl&quot;: &quot;...&quot; &#125;,</div>
              <div className="ml-4">&quot;definition&quot;: &quot;A government program...&quot;,</div>
              <div className="ml-4">&quot;scope&quot;: &quot;This page covers...&quot;,</div>
              <div className="ml-4">&quot;positions&quot;: [...],</div>
              <div className="ml-4">&quot;escalationLevels&quot;: [...],</div>
              <div className="ml-4">&quot;assumptions&quot;: [...],</div>
              <div className="ml-4">&quot;abstractionRungs&quot;: [...],</div>
              <div className="ml-4">&quot;coreValues&quot;: &#123;...&#125;,</div>
              <div className="ml-4">&quot;commonGround&quot;: &#123;...&#125;,</div>
              <div className="ml-4">&quot;evidenceItems&quot;: [...],</div>
              <div className="ml-4">&quot;objectiveCriteria&quot;: [...],</div>
              <div className="ml-4">&quot;mediaResources&quot;: [...],</div>
              <div className="ml-4">&quot;relatedTopics&quot;: [...]</div>
              <div className="ml-2">&#125;&apos;</div>
              <br />
              <div className="text-gray-400 mb-2"># Or AI-generate via POST</div>
              <div>curl -X POST /api/debate-topics/generate \</div>
              <div className="ml-2">-H &apos;Content-Type: application/json&apos; \</div>
              <div className="ml-2">-d &apos;&#123;&quot;topicName&quot;: &quot;Universal Basic Income&quot;&#125;&apos;</div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded text-xs text-blue-800">
              <strong>API Endpoints:</strong>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li><code>GET /api/debate-topics</code> — list all topics</li>
                <li><code>GET /api/debate-topics/[slug]</code> — get topic by slug</li>
                <li><code>POST /api/debate-topics</code> — create topic with full data</li>
                <li><code>POST /api/debate-topics/generate</code> — AI-generate from topic name</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
