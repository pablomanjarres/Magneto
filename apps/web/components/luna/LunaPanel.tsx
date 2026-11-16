"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { Icon } from "../Icon";
import { buttonClass } from "../primitives";
import type { LunaMessage } from "./Assistant";
import { LunaFace } from "./LunaFace";

/** What Luna offers to do first, by the page the candidate is on. */
function suggestions(path: string): string[] {
  if (path.startsWith("/cv")) return ["Adapta mi hoja de vida para backend", "Hazla más corta"];
  if (path.startsWith("/jobs")) return ["Muéstrame vacantes remotas"];
  if (path.startsWith("/onboarding") || path.startsWith("/profile")) {
    return ["Agrega Docker a mis habilidades"];
  }
  return ["¿Qué me falta para completar mi perfil?"];
}

const BUBBLE = "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line text-pretty";

/**
 * The conversation with Luna: a card above the mascot on desktop, a bottom
 * sheet on phones. Escape closes it; a failed message comes back to the input.
 */
export function LunaPanel({
  path,
  messages,
  pending,
  error,
  onSend,
  onUndo,
  onClose,
}: {
  path: string;
  messages: LunaMessage[];
  pending: boolean;
  error: string | null;
  onSend: (text: string) => Promise<boolean>;
  onUndo: (index: number) => Promise<boolean>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const lastReply = messages.filter((m) => m.role === "assistant").at(-1)?.content ?? "";
  // Only the latest change can be undone: going back further would also wipe the ones after it.
  const lastChange = messages.reduce((last, m, i) => (m.before ? i : last), -1);
  const [undoing, setUndoing] = useState(false);
  const [undoFailed, setUndoFailed] = useState(false);

  async function undo(index: number): Promise<void> {
    setUndoing(true);
    setUndoFailed(false);
    setUndoFailed(!(await onUndo(index)));
    setUndoing(false);
  }

  useEffect(() => {
    input.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages, pending, error]);

  async function send(text: string): Promise<void> {
    const message = text.trim();
    if (!message || pending) return;
    setDraft("");
    if (!(await onSend(message))) setDraft(message);
    input.current?.focus();
  }

  function submit(event: FormEvent): void {
    event.preventDefault();
    void send(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(draft);
    }
  }

  return (
    <section
      role="dialog"
      aria-label="Luna, tu asistente"
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] animate-pop flex-col overflow-hidden rounded-t-3xl border border-line bg-canvas shadow-[0_28px_60px_-20px_rgba(26,50,76,0.45)] sm:inset-x-auto sm:right-6 sm:bottom-28 sm:max-h-[70vh] sm:w-[400px] sm:rounded-3xl"
    >
      <header className="flex items-center gap-3 border-b border-line bg-brand-wash/60 px-4 py-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint">
          <LunaFace mood={pending ? "thinking" : "happy"} className="size-9" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-black text-slate">Luna</h2>
          <p className="text-xs text-pretty text-muted">
            Tu asistente: edita tu perfil, adapta tu hoja de vida y busca vacantes
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar a Luna"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-canvas hover:text-ink"
        >
          <Icon name="close" size={18} />
        </button>
      </header>

      <div className="flex min-h-40 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <p className={`${BUBBLE} self-start rounded-bl-sm bg-surface text-ink`}>
          ¡Hola! Soy Luna. Puedo cambiar tu perfil, adaptar tu hoja de vida, buscar vacantes o
          llevarte a cualquier página. ¿Qué hacemos?
        </p>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col gap-1.5 ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <p
              className={`${BUBBLE} ${
                m.role === "user"
                  ? "rounded-br-sm bg-brand text-white"
                  : "rounded-bl-sm bg-surface text-ink"
              }`}
            >
              {m.content}
            </p>
            {m.undone ? (
              <p className="flex items-center gap-1 px-1 text-xs font-bold text-muted">
                <Icon name="undo" size={12} strokeWidth={2.4} />
                Deshice estos cambios
              </p>
            ) : (
              i === lastChange && (
                <button
                  type="button"
                  className={buttonClass("quiet", "sm")}
                  onClick={() => void undo(i)}
                  disabled={undoing || pending}
                  aria-busy={undoing}
                >
                  <Icon name="undo" size={14} strokeWidth={2.4} />
                  {undoing ? "Deshaciendo…" : "Deshacer estos cambios"}
                </button>
              )
            )}
            {i === lastChange && undoFailed && (
              <p role="alert" className="px-1 text-xs font-bold text-danger">
                No pude deshacerlos. Intenta de nuevo.
              </p>
            )}
          </div>
        ))}
        {pending && (
          <p className={`${BUBBLE} flex items-center gap-1.5 self-start rounded-bl-sm bg-surface`}>
            <span className="sr-only">Luna está pensando…</span>
            {["", "[animation-delay:150ms]", "[animation-delay:300ms]"].map((delay) => (
              <span
                key={delay}
                aria-hidden="true"
                className={`size-2 rounded-full bg-brand-soft motion-safe:animate-bounce ${delay}`}
              />
            ))}
          </p>
        )}
        {messages.length === 0 && !pending && (
          <div className="flex flex-wrap gap-2 pt-1">
            {suggestions(path).map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => void send(text)}
                className="rounded-full border border-brand/30 bg-canvas px-3 py-1.5 text-left text-[13px] font-bold text-brand transition hover:bg-brand-wash"
              >
                {text}
              </button>
            ))}
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="flex flex-col items-start gap-2 rounded-2xl bg-danger-wash p-3 text-sm"
          >
            <p className="font-bold text-danger">{error}</p>
            <button
              type="button"
              onClick={() => void send(draft)}
              className={buttonClass("danger", "sm")}
            >
              Intentar de nuevo
            </button>
          </div>
        )}
        <div ref={end} />
      </div>

      <p aria-live="polite" className="sr-only">
        {lastReply}
      </p>

      <form onSubmit={submit} className="flex items-end gap-2 border-t border-line p-3">
        <label htmlFor="luna-input" className="sr-only">
          Escríbele a Luna
        </label>
        <textarea
          id="luna-input"
          ref={input}
          rows={1}
          value={draft}
          maxLength={2000}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Escríbele a Luna…"
          className="max-h-32 min-h-11 flex-1 resize-none [field-sizing:content] rounded-3xl border border-control bg-canvas px-4 py-2.5 text-[15px] text-ink outline-none placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-brand-wash"
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          aria-label="Enviar"
          className={`${buttonClass("primary")} size-11 px-0`}
        >
          <Icon name="arrowRight" size={18} strokeWidth={2.4} />
        </button>
      </form>
    </section>
  );
}
