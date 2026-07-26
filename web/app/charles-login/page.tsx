'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get('next') || 'coalition';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('api/charles-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.message || 'No se pudo iniciar sesión.');
      return;
    }
    router.push(next.startsWith('/') ? next.slice(1) : next);
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        maxWidth: 360,
        margin: '15vh auto',
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Charles — acceso interno</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        autoFocus
        style={{ width: '100%', padding: 10, fontSize: 16, marginBottom: 12 }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{ width: '100%', padding: 10, fontSize: 16, cursor: 'pointer' }}
      >
        {loading ? 'Entrando…' : 'Entrar'}
      </button>
      {error && <p style={{ color: '#c00', marginTop: 12 }}>{error}</p>}
    </form>
  );
}

export default function CharlesLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
