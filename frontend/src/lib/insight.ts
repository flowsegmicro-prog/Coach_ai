import type { DashboardMetrics } from '@/types';

export function generateInsight(m: DashboardMetrics): string {
  if (m.daysOfHistory < 28) {
    return `Collecte en cours — encore ${Math.max(0, 28 - m.daysOfHistory)} jour(s) pour une analyse fiable de ta charge chronique.`;
  }
  if (m.acwrZone === 'RISQUE') {
    return "Attention, ta charge a fortement augmenté cette semaine. Pense à intégrer une journée de récupération.";
  }
  if (m.monotonyZone === 'RISQUE') {
    return "Ton entraînement manque de variété cette semaine. Varie les intensités pour réduire la monotonie.";
  }
  if (m.acwrZone === 'VIGILANCE') {
    return "Ta charge augmente rapidement. Reste à l'écoute de ton corps cette semaine.";
  }
  if (m.acwrZone === 'SOUS_CHARGE') {
    return "Ta charge actuelle est faible par rapport à ton historique. C'est une bonne fenêtre pour reprendre progressivement.";
  }
  if (m.acwrZone === 'OPTIMAL' && (m.monotonyZone === 'BONNE' || m.monotonyZone === null)) {
    return "Ta charge est bien équilibrée et ta récupération est bonne. Si tu maintiens cette dynamique, tu devrais continuer à progresser.";
  }
  if (m.acwrZone === 'OPTIMAL' && m.monotonyZone === 'VIGILANCE') {
    return "Ta charge est dans la zone optimale mais ton entraînement est un peu monotone. Pense à varier les intensités.";
  }
  return "Continue d'enregistrer tes séances pour affiner les recommandations.";
}
