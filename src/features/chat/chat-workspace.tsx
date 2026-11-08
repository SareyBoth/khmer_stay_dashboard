"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Headphones,
  Home,
  Send,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button, Card, EmptyState, PageHeader, StatusBadge, cn } from "@/src/components/shared/ui";
import { Textarea } from "@/components/ui/textarea";
import { api, json } from "@/src/lib/api";

type ChatConversation = {
  id: string;
  kind: "property" | "support";
  subject: string;
  status: "open" | "resolved" | "closed";
  travelerName: string;
  ownerName: string;
  propertyId: string;
  property: string;
  assignedAdminName: string;
  preview: string;
  unreadCount: number;
  updatedAt: string;
  lastMessageAt?: string | null;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  fromMe: boolean;
  sentAt: string;
};

export function ChatWorkspace({ mode }: { mode: "owner" | "admin" }) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);

  const active = useMemo(
    () => conversations.find((item) => item.id === activeId) || conversations[0],
    [activeId, conversations],
  );

  const loadConversations = useCallback(async () => {
    const result = await api<{ conversations: ChatConversation[] }>("/conversations");
    setConversations(result.conversations);
    setActiveId((current) =>
      result.conversations.some((item) => item.id === current)
        ? current
        : result.conversations[0]?.id || "",
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    api<{ conversations: ChatConversation[] }>("/conversations")
      .then((result) => {
        if (!mounted) return;
        setConversations(result.conversations);
        setActiveId(result.conversations[0]?.id || "");
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load conversations"))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!active?.id) {
      return;
    }
    let mounted = true;
    api<{ messages: ChatMessage[] }>(`/conversations/${active.id}/messages`)
      .then((result) => {
        if (mounted) {
          setMessages(result.messages);
          setConversations((items) =>
            items.map((item) =>
              item.id === active.id ? { ...item, unreadCount: 0 } : item,
            ),
          );
        }
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load messages"));
    void api(`/conversations/${active.id}/read`, { method: "POST" }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, [active?.id]);

  useEffect(() => {
    function connection(event: Event) {
      setConnected(Boolean((event as CustomEvent<{ connected: boolean }>).detail?.connected));
    }
    function incoming(event: Event) {
      const message = (event as CustomEvent<{ data: ChatMessage }>).detail?.data;
      if (!message?.conversationId) return;
      setMessages((items) => {
        if (message.conversationId !== activeId || items.some((item) => item.id === message.id)) return items;
        return [...items, { ...message, fromMe: false }];
      });
      setConversations((items) => {
        const exists = items.some((item) => item.id === message.conversationId);
        if (!exists) {
          void loadConversations();
          return items;
        }
        return items
          .map((item) =>
            item.id === message.conversationId
              ? {
                  ...item,
                  preview: message.text,
                  lastMessageAt: message.sentAt,
                  unreadCount: item.id === activeId ? 0 : item.unreadCount + 1,
                }
              : item,
          )
          .sort((a, b) => Date.parse(b.lastMessageAt || b.updatedAt) - Date.parse(a.lastMessageAt || a.updatedAt));
      });
      if (message.conversationId === activeId) {
        void api(`/conversations/${activeId}/read`, { method: "POST" }).catch(() => {});
      }
    }
    window.addEventListener("khmerstay:chat-connection", connection);
    window.addEventListener("khmerstay:new-message", incoming);
    return () => {
      window.removeEventListener("khmerstay:chat-connection", connection);
      window.removeEventListener("khmerstay:new-message", incoming);
    };
  }, [activeId, loadConversations]);

  async function send() {
    if (!active || !draft.trim() || sending) return;
    setSending(true);
    try {
      const result = await api<{ message: ChatMessage }>(
        `/conversations/${active.id}/messages`,
        json("POST", { body: draft.trim() }),
      );
      setMessages((items) =>
        items.some((item) => item.id === result.message.id)
          ? items
          : [...items, result.message],
      );
      setConversations((items) =>
        items.map((item) =>
          item.id === active.id
            ? { ...item, preview: result.message.text, lastMessageAt: result.message.sentAt }
            : item,
        ),
      );
      setDraft("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  async function resolveConversation() {
    if (!active || mode !== "admin") return;
    try {
      await api(`/conversations/${active.id}/status`, json("POST", { status: "resolved" }));
      setConversations((items) =>
        items.map((item) => (item.id === active.id ? { ...item, status: "resolved" } : item)),
      );
      toast.success("Support conversation resolved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resolve conversation");
    }
  }

  if (!loading && conversations.length === 0) {
    return (
      <div>
        <ChatHeader mode={mode} connected={connected} />
        <EmptyState
          title={mode === "admin" ? "No support conversations" : "No guest conversations yet"}
          description={
            mode === "admin"
              ? "Traveler support requests will appear here in real time."
              : "A conversation appears when a traveler contacts you from a property or booking."
          }
        />
      </div>
    );
  }

  return (
    <div>
      <ChatHeader mode={mode} connected={connected} />
      <Card className="grid min-h-[670px] overflow-hidden lg:grid-cols-[340px_1fr]">
        <aside className="border-b border-[#e5dac9] lg:border-b-0 lg:border-r">
          {conversations.map((conversation) => (
            <button
              type="button"
              key={conversation.id}
              onClick={() => setActiveId(conversation.id)}
              className={cn(
                "flex w-full gap-3 border-t border-[#eee5d8] p-4 text-left transition-colors hover:bg-[#faf5ec]",
                active?.id === conversation.id && "bg-[#f6eddd]",
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e9decc]">
                {conversation.kind === "support" ? <Headphones className="size-4" /> : <Home className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <strong className="truncate text-sm">{conversation.travelerName}</strong>
                  {conversation.unreadCount > 0 && (
                    <span className="grid min-w-5 place-items-center rounded-full bg-[#8e652c] px-1.5 text-xs text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs font-medium text-[#5d5148]">{conversation.subject || conversation.property}</span>
                <span className="mt-1 block truncate text-xs text-[#8a7e74]">{conversation.preview || "No messages yet"}</span>
              </span>
            </button>
          ))}
        </aside>
        {active ? (
          <section className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-[#e5dac9] p-4">
              <div>
                <p className="font-extrabold">{active.travelerName}</p>
                <p className="text-xs text-[#776d64]">
                  {active.kind === "support" ? active.subject : active.property}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={active.status} />
                {mode === "admin" && active.status === "open" && (
                  <Button size="sm" variant="secondary" onClick={resolveConversation}>
                    <CheckCircle2 className="size-4" /> Resolve
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto bg-[#fdf9f2] p-4 sm:p-6">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-[#776d64]">Start the conversation with a helpful message.</p>
              ) : (
                messages.map((item) => (
                  <div key={item.id} className={cn("flex", item.fromMe && "justify-end")}>
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6",
                        item.fromMe
                          ? "rounded-br-md bg-[#2b2118] text-white"
                          : "rounded-bl-md border border-[#e3d7c5] bg-white text-[#4e453d]",
                      )}
                    >
                      {!item.fromMe && <p className="mb-1 text-xs font-bold text-[#8e652c]">{item.senderName}</p>}
                      <p className="whitespace-pre-wrap">{item.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 border-t border-[#e5dac9] bg-white p-4">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                className="min-h-11 flex-1 resize-none rounded-xl border border-[#d9ccb9] px-3 py-2 text-sm"
                placeholder="Write a message…"
                maxLength={2000}
              />
              <Button size="icon" aria-label="Send message" disabled={sending || !draft.trim()} onClick={() => void send()}>
                <Send className="size-4" />
              </Button>
            </div>
          </section>
        ) : null}
      </Card>
    </div>
  );
}

function ChatHeader({ mode, connected }: { mode: "owner" | "admin"; connected: boolean }) {
  return (
    <PageHeader
      eyebrow={mode === "admin" ? "Customer care" : "Guest communication"}
      title={mode === "admin" ? "Traveler support" : "Messages"}
      description={
        mode === "admin"
          ? "Help travelers through private real-time support conversations."
          : "Reply to travelers who contact you about a property or booking."
      }
      actions={
        <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold", connected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
          {connected ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
          {connected ? "Live" : "Reconnecting"}
        </span>
      }
    />
  );
}
