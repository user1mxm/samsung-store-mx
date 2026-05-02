import { trpc } from "@/providers/trpc";
import { useCallback, useMemo, useState, useEffect } from "react";

export function useAuth() {
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading: queryLoading,
    error,
    refetch,
  } = trpc.localAuth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  /* Force isLoading to false after timeout for static deploys */
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const isLoading = timedOut ? false : queryLoading;

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      window.location.reload();
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isLoading, logoutMutation.isPending, error, logout, refetch],
  );
}
