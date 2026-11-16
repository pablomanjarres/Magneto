"use client";

import { useEffect, useRef, useState, type FocusEvent, type FormEvent } from "react";

/** What the laptop mirrors: the field in use, what it holds, and a count of keystrokes. */
export interface Typing {
  prompt: string;
  text: string;
  keystrokes: number;
  writing: boolean;
}

/** Fields whose value is typed, not clicked or picked. */
const TYPED =
  "input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=range]):not([type=file]):not([type=button]):not([type=submit]), textarea";

type TypedField = HTMLInputElement | HTMLTextAreaElement;

/** What the laptop shows for a field: numbers grouped the Colombian way, "10.000.000". */
function shown(field: TypedField): string {
  const n = Number(field.value);
  return field.type === "number" && field.value !== "" && Number.isFinite(n)
    ? n.toLocaleString("es-CO")
    : field.value;
}

function typedField(target: EventTarget): TypedField | null {
  return target instanceof HTMLElement && target.matches(TYPED) ? (target as TypedField) : null;
}

/** The field's name the way the laptop's prompt shows it: its label, in lower case. */
function promptOf(field: TypedField): string {
  const label =
    field.getAttribute("aria-label") ??
    field.labels?.[0]?.querySelector("span")?.textContent ??
    field.placeholder;
  return label.trim().toLowerCase();
}

/**
 * Follows typing anywhere inside `area`, by event delegation, so no step has
 * to report its own fields. Focusing a field opens the laptop; leaving every
 * field closes it again.
 */
export function useTyping() {
  const [typing, setTyping] = useState<Typing>({
    prompt: "",
    text: "",
    keystrokes: 0,
    writing: false,
  });
  const area = useRef<HTMLDivElement>(null);
  const closing = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(closing.current), []);

  function onFocus(e: FocusEvent): void {
    const field = typedField(e.target);
    if (!field) return;
    window.clearTimeout(closing.current);
    setTyping((t) => ({ ...t, prompt: promptOf(field), text: shown(field), writing: true }));
  }

  function onBlur(e: FocusEvent): void {
    if (!typedField(e.target)) return;
    // Moving to the next field blurs this one first; wait a beat so the lid does not flap.
    closing.current = window.setTimeout(() => setTyping((t) => ({ ...t, writing: false })), 500);
  }

  function onInput(e: FormEvent): void {
    const field = typedField(e.target);
    if (!field) return;
    setTyping((t) => ({ ...t, text: shown(field), keystrokes: t.keystrokes + 1 }));
  }

  /** Clicking the laptop starts typing in the step's first field, after what it already holds. */
  function focusFirstField(): void {
    const field = area.current?.querySelector<TypedField>(TYPED);
    if (!field) return;
    field.focus();
    try {
      field.setSelectionRange(field.value.length, field.value.length);
    } catch {
      // Email and number inputs have no caret position to set.
    }
  }

  return { typing, area, fieldEvents: { onFocus, onBlur, onInput }, focusFirstField };
}
