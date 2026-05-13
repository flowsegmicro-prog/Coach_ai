import { useAuth } from '@/hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-app-ink">Paramètres</h1>
        <p className="mt-1 text-sm text-app-muted">Gère ton compte et tes préférences.</p>
      </div>
      <div className="card p-5">
        <h2 className="mb-3 text-base font-semibold text-app-ink">Mon compte</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Prénom" value={user?.firstName ?? '—'} />
          <Field label="Nom" value={user?.lastName ?? '—'} />
          <Field label="Email" value={user?.email ?? '—'} />
          <Field
            label="Compte créé le"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '—'}
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mt-1 text-app-ink">{value}</div>
    </div>
  );
}
