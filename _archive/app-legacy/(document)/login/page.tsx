'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail]       = useState('demo@ise.io');
  const [password, setPassword] = useState('password');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('Invalid email or password');
    } else {
      router.push('/');
      router.refresh();
    }
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: 6,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', marginTop: 6,
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 6px' }}>Sign in</h1>
      <p style={{ fontSize: 14, color: '#737373', margin: '0 0 32px' }}>
        Demo credentials: <code style={{ fontFamily: 'var(--font-mono)', background: '#f5f5f5', padding: '1px 6px', borderRadius: 3 }}>demo@ise.io</code> / <code style={{ fontFamily: 'var(--font-mono)', background: '#f5f5f5', padding: '1px 6px', borderRadius: 3 }}>password</code>
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ fontSize: 14 }}>
          Email
          <input
            type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            style={input} required
          />
        </label>
        <label style={{ fontSize: 14 }}>
          Password
          <input
            type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            style={input} required
          />
        </label>
        {error && <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px', background: '#2563eb', color: '#fff', border: 'none',
            borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
