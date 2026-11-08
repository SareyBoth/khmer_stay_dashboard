"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { API_URL } from "@/src/lib/api";
import { useAppStore } from "@/src/stores/app-store";

type SocketEnvelope = {
  type: string;
  data?: Record<string, unknown>;
};

function socketURL(token: string) {
  const url = new URL(API_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `${url.pathname.replace(/\/$/, "")}/ws`;
  url.search = new URLSearchParams({ token }).toString();
  return url.toString();
}

export function useChatSocket() {
  const token = useAppStore((state) => state.session?.token);
  const language = useAppStore((state) => state.language);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !token || token === "demo-local") return;

    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retryAttempt = 0;

    function announce(connected: boolean) {
      window.dispatchEvent(
        new CustomEvent("khmerstay:chat-connection", { detail: { connected } }),
      );
    }

    function connect() {
      if (!active || !token) return;
      const socket = new WebSocket(socketURL(token));
      socketRef.current = socket;

      socket.onopen = () => {
        retryAttempt = 0;
        announce(true);
      };
      socket.onmessage = (event) => {
        try {
          const envelope = JSON.parse(event.data) as SocketEnvelope;
          if (envelope.type !== "new_message" || !envelope.data) return;
          const data = envelope.data;
          const sender = String(data.senderName || (language === "km" ? "សារថ្មី" : "New message"));
          const preview = String(data.text || "");
          useAppStore.getState().incrementUnreadMessages();
          toast.info(language === "km" ? `សារថ្មីពី ${sender}` : `New message from ${sender}`, {
            description: preview,
            duration: 5000,
          });
          window.dispatchEvent(
            new CustomEvent("khmerstay:new-message", {
              detail: { type: envelope.type, data },
            }),
          );
        } catch {
          // Ignore malformed frames and keep the connection alive.
        }
      };
      socket.onerror = () => socket.close();
      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        announce(false);
        if (!active) return;
        const delay = Math.min(15_000, 1000 * 2 ** retryAttempt);
        retryAttempt += 1;
        retryTimer = setTimeout(connect, delay);
      };
    }

    connect();
    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      socketRef.current?.close(1000, "Page closed");
      socketRef.current = null;
    };
  }, [language, token]);

  return socketRef;
}
