import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  HeartPulse,
  CalendarDays,
  BarChart3,
  Apple,
  Stethoscope,
  Settings,
  LogOut,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const items: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/entrainements', label: 'Entraînements', icon: Activity },
  { to: '/charge-performance', label: 'Charge & performance', icon: TrendingUp },
  { to: '/recuperation', label: 'Récupération', icon: HeartPulse, disabled: true },
  { to: '/calendrier', label: 'Calendrier', icon: CalendarDays, disabled: true },
  { to: '/analyses', label: 'Analyses', icon: BarChart3 },
  { to: '/nutrition', label: 'Nutrition', icon: Apple, disabled: true },
  { to: '/medecine', label: 'Médecine', icon: Stethoscope, disabled: true },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
];

export default function Sidebar() {
  const { user, refetch } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await api.logout();
      await refetch();
      navigate('/login');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  }

  return (
    <aside className="sticky top-0 flex h-screen w-[240px] flex-col border-r border-app-border bg-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple text-white">
          <Activity className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold text-app-ink">Coach AI</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </nav>
      <div className="border-t border-app-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-semibold">
            {user ? `${user.firstName[0]}${user.lastName[0]}` : '—'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-medium text-app-ink">
              {user ? `${user.firstName} ${user.lastName[0]}.` : ''}
            </div>
            <div className="text-xs text-app-muted">Athlète</div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-1.5 text-app-muted hover:bg-app-bg"
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  if (item.disabled) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-app-muted/70 cursor-not-allowed',
        )}
        title="Bientôt disponible"
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1">{item.label}</span>
        <span className="rounded-full bg-app-bg px-2 py-0.5 text-[10px] font-medium text-app-muted">
          Bientôt
        </span>
      </div>
    );
  }
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-600 font-medium'
            : 'text-app-ink/80 hover:bg-app-bg',
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </NavLink>
  );
}
