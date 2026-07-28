import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import type { HubConnection } from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

interface MarketplaceChatContextValue {
  connection: HubConnection | null;
  isConnected: boolean;
  unreadTotal: number;
  unreadByConversation: Record<string, number>;
  setActiveConversationId: (conversationId: string | null) => void;
  clearUnread: (conversationId: string) => void;
}

const MarketplaceChatContext = createContext<MarketplaceChatContextValue | undefined>(undefined);

function isMarketplaceConversationsQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey.includes("marketplace") && queryKey.includes("conversations");
}

export function MarketplaceChatProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const activeConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return undefined;
    }

    const hubConnection = new HubConnectionBuilder()
      .withUrl("/hubs/marketplace-chat", { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    hubConnection.on("NewMarketplaceMessage", (conversationId: string) => {
      if (activeConversationIdRef.current === conversationId) {
        return;
      }

      setUnreadByConversation((previous) => ({
        ...previous,
        [conversationId]: (previous[conversationId] ?? 0) + 1,
      }));

      void queryClient.invalidateQueries({
        predicate: (query) => isMarketplaceConversationsQueryKey(query.queryKey),
      });
    });

    hubConnection.on("NewMarketplaceConversation", () => {
      void queryClient.invalidateQueries({
        predicate: (query) => isMarketplaceConversationsQueryKey(query.queryKey),
      });
    });

    hubConnection.onreconnected(() => setIsConnected(true));
    hubConnection.onreconnecting(() => setIsConnected(false));
    hubConnection.onclose(() => setIsConnected(false));

    hubConnection
      .start()
      .then(() => setIsConnected(true))
      .catch(() => setIsConnected(false));

    setConnection(hubConnection);

    return () => {
      void hubConnection.stop();
      setConnection(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, token, queryClient]);

  const setActiveConversationId = useCallback((conversationId: string | null) => {
    activeConversationIdRef.current = conversationId;
    if (conversationId) {
      setUnreadByConversation((previous) => {
        if (!previous[conversationId]) {
          return previous;
        }
        const next = { ...previous };
        delete next[conversationId];
        return next;
      });
    }
  }, []);

  const clearUnread = useCallback((conversationId: string) => {
    setUnreadByConversation((previous) => {
      if (!previous[conversationId]) {
        return previous;
      }
      const next = { ...previous };
      delete next[conversationId];
      return next;
    });
  }, []);

  const unreadTotal = useMemo(
    () => Object.values(unreadByConversation).reduce((sum, count) => sum + count, 0),
    [unreadByConversation],
  );

  const value = useMemo<MarketplaceChatContextValue>(
    () => ({ connection, isConnected, unreadTotal, unreadByConversation, setActiveConversationId, clearUnread }),
    [connection, isConnected, unreadTotal, unreadByConversation, setActiveConversationId, clearUnread],
  );

  return <MarketplaceChatContext.Provider value={value}>{children}</MarketplaceChatContext.Provider>;
}

export function useMarketplaceChatHub(): MarketplaceChatContextValue {
  const context = useContext(MarketplaceChatContext);
  if (!context) {
    throw new Error("useMarketplaceChatHub must be used within a MarketplaceChatProvider");
  }
  return context;
}

export { HubConnectionState };
export type { HubConnection };
