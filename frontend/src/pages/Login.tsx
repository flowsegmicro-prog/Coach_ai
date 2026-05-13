import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export default function Login() {
  const navigate = useNavigate();
  const { refetch } = useAuth();
  const [email, setEmail] = useState('thomas@coach.ai');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await api.login({ email, password });
      await refetch();
      toast.success('Bienvenue !');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple text-white">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Coach AI</span>
        </div>
        <h1 className="text-2xl font-semibold text-app-ink">Connexion</h1>
        <p className="mt-1 text-sm text-app-muted">Heureux de te revoir.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="label">Email</label>
            <input
              type="email"
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="label">Mot de passe</label>
            <input
              type="password"
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-app-muted">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
