"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Profile, TailoredProfile } from "@moonlight/types";

import {
  askAssistant,
  saveProfile,
  type AssistantAction,
  type ChatMessage,
} from "../../lib/client";
import { LunaFace } from "./LunaFace";
import { LunaPanel } from "./LunaPanel";

type AssistantState = {
  /** The hoja de vida Luna adapted last, shown on /cv until the candidate goes back to the original. */
  tailored: TailoredProfile | null;
  clearTailored: () => void;
};

const AssistantContext = createContext<AssistantState>({ tailored: null, clearTailored: () => {} });

export const useAssistant = (): AssistantState => useContext(AssistantContext);

/** A message in the panel; a reply that changed the profile carries the profile from before it. */
export type LunaMessage = ChatMessage & { before?: Profile; undone?: boolean };

/** Remembered once the candidate opens Luna, so the greeting never comes back. */
const GREETED = "luna-greeted";

/**
 * Luna on every page: the mascot button, its chat panel and the state both
 * keep. It wraps the whole app in the root layout, so the conversation and the
 * adapted hoja de vida survive client-side navigation.
 */
export function Assistant({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [greet, setGreet] = useState(false);
  const [messages, setMessages] = useState<LunaMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tailored, setTailored] = useState<TailoredProfile | null>(null);

  // Read after mount: the server cannot know, and guessing would flash the bubble.
  useEffect(() => {
    setGreet(localStorage.getItem(GREETED) === null);
  }, []);

  function toggle(): void {
    if (open) return close();
    setOpen(true);
    setGreet(false);
    localStorage.setItem(GREETED, "1");
  }

  function close(): void {
    setOpen(false);
    button.current?.focus();
  }

  function run(actions: AssistantAction[]): void {
    for (const action of actions) {
      if (action.type === "navigate") router.push(action.path);
      else if (action.type === "refresh") router.refresh();
      else if (action.type === "tailored") {
        setTailored(action.tailored);
        if (path !== "/cv") router.push("/cv");
      }
    }
  }

  /** Sends one message; on failure it is taken back so the panel can return the text to the input. */
  async function send(text: string): Promise<boolean> {
    const history: LunaMessage[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setPending(true);
    setError(null);
    try {
      const { reply, actions } = await askAssistant(
        history.slice(-20).map(({ role, content }) => ({ role, content })),
        path,
        tailored ?? undefined,
      );
      const saved = actions.find((a) => a.type === "saved");
      setMessages([
        ...history,
        { role: "assistant", content: reply, ...(saved ? { before: saved.before } : {}) },
      ]);
      run(actions);
      return true;
    } catch (cause) {
      setMessages(messages);
      setError(cause instanceof Error ? cause.message : "Luna no pudo responder.");
      return false;
    } finally {
      setPending(false);
    }
  }

  /** Puts the profile back as it was before that reply; the conversation keeps a note of it. */
  async function undo(index: number): Promise<boolean> {
    const before = messages[index]?.before;
    if (!before) return false;
    try {
      await saveProfile(before);
      setMessages((list) => list.map((m, i) => (i === index ? { ...m, undone: true } : m)));
      router.refresh();
      return true;
    } catch {
      return false;
    }
  }

  const mood = pending ? "thinking" : open ? "happy" : "idle";

  return (
    <AssistantContext.Provider value={{ tailored, clearTailored: () => setTailored(null) }}>
      {children}
      <div className="print:hidden">
        {open && (
          <LunaPanel
            path={path}
            messages={messages}
            pending={pending}
            error={error}
            onSend={send}
            onUndo={undo}
            onClose={close}
          />
        )}
        <div className="fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6">
          {greet && (
            <p className="absolute right-2 bottom-full mb-3 w-max animate-pop rounded-2xl rounded-br-sm bg-canvas px-3.5 py-2 text-sm font-bold text-ink shadow-[0_12px_30px_-12px_rgba(26,50,76,0.45)] [animation-delay:600ms]">
              ¿Te ayudo?
            </p>
          )}
          <button
            ref={button}
            type="button"
            onClick={toggle}
            aria-label="Abrir a Luna, tu asistente"
            aria-expanded={open}
            className="group grid size-16 place-items-center rounded-full bg-mint shadow-[0_16px_36px_-14px_rgba(124,0,255,0.7)] ring-4 ring-brand-wash/70 transition duration-300 hover:-translate-y-0.5 hover:bg-mint-hover active:scale-95"
          >
            <span className="motion-safe:animate-float">
              <LunaFace
                mood={mood}
                className={`size-14 drop-shadow-[0_2px_2px_rgba(26,50,76,0.22)] ${pending ? "motion-safe:animate-think" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>
    </AssistantContext.Provider>
  );
}
