import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

export type NotificationType = 'conversa' | 'solicitacao' | 'reivindicacao' | 'destaque' | 'sistema';

interface NotificationCounts {
  conversa: number;
  solicitacao: number;
  reivindicacao: number;
  destaque: number;
  sistema: number;
  total: number;
}

const emptyCounts: NotificationCounts = {
  conversa: 0,
  solicitacao: 0,
  reivindicacao: 0,
  destaque: 0,
  sistema: 0,
  total: 0,
};

export function useAdminNotifications() {
  const { user } = useAuth();
  const { isAdmin, isAdmMaster, isLoading: roleLoading } = useUserRole();
  const [counts, setCounts] = useState<NotificationCounts>(emptyCounts);
  const [loading, setLoading] = useState(true);

  const isAdminUser = isAdmin || isAdmMaster;

  const fetchCounts = useCallback(async () => {
    if (!user || !isAdminUser) {
      setCounts(emptyCounts);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("tipo")
        .eq("lido", false)
        .eq("destino", "admin");

      if (error) {
        console.error("Error fetching notifications:", error);
        setLoading(false);
        return;
      }

      const newCounts: NotificationCounts = { ...emptyCounts };
      (data || []).forEach((n: { tipo: string }) => {
        const key = n.tipo as NotificationType;
        if (key in newCounts) {
          newCounts[key]++;
        }
        newCounts.total++;
      });

      setCounts(newCounts);
    } catch (err) {
      console.error("Error in fetchCounts:", err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdminUser]);

  useEffect(() => {
    if (roleLoading) return;
    fetchCounts();
  }, [fetchCounts, roleLoading]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !isAdminUser || roleLoading) return;

    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdminUser, roleLoading, fetchCounts]);

  const markAsRead = useCallback(async (tipo: NotificationType) => {
    if (!user || !isAdminUser) return;

    const { error } = await supabase
      .from("notifications")
      .update({ lido: true, lido_em: new Date().toISOString() })
      .eq("tipo", tipo)
      .eq("lido", false)
      .eq("destino", "admin");

    if (error) {
      console.error("Error marking notifications as read:", error);
      return;
    }

    fetchCounts();
  }, [user, isAdminUser, fetchCounts]);

  const markAllAsRead = useCallback(async () => {
    if (!user || !isAdminUser) return;

    const { error } = await supabase
      .from("notifications")
      .update({ lido: true, lido_em: new Date().toISOString() })
      .eq("lido", false)
      .eq("destino", "admin");

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return;
    }

    fetchCounts();
  }, [user, isAdminUser, fetchCounts]);

  return { counts, loading, markAsRead, markAllAsRead, refetch: fetchCounts };
}
