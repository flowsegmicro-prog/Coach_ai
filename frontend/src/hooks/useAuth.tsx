import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/types';

export function useAuth() {
  const qc = useQueryClient();
  const query = useQuery<User | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await api.me();
      } catch {
        return null;
      }
    },
  });
  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    refetch: () => qc.invalidateQueries({ queryKey: ['me'] }),
  };
}
