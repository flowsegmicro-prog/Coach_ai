import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court (8 caractères min)'),
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
});

export default function Register() {
  const navigate = useNavigate();
  const { refetch } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await api.register(parsed.data);
      await refetch();
      toast.success('Compte créé !');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création');
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
        <h1 className="text-2xl font-semibold text-app-ink">Créer un compte</h1>
        <p className="mt-1 text-sm text-app-muted">Commence à suivre ta charge en quelques secondes.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="label">Prénom</label>
              <input
                className="input"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="label">Nom</label>
              <input
                className="input"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="label">Email</label>
            <input
              type="email"
              autoComplete="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="label">Mot de passe</label>
            <input
              type="password"
              autoComplete="new-password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-app-muted">
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
