import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadConversations() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    loadUnreadCount();
    const cleanup = subscribeToChanges();
    return cleanup;
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .select("unread_count")
      .eq("user_id", user.id)
      .eq("status", "open");

    if (error) {
      console.error("Error loading unread count:", error);
      return;
    }

    const total = data?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
    setUnreadCount(total);
  };

  const subscribeToChanges = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel("unread-conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadUnreadCount();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return { unreadCount };
}
