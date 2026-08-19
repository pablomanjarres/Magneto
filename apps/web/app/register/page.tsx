"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Field } from "../../components/primitives";
import { registerCandidate } from "../../lib/client";

/** Name and email in, an empty profile out. The wizard fills the rest. */
export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await registerCandidate(fullName.trim(), email.trim());
      router.push("/onboarding");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "could not register");
      setSaving(false);
    }
  }

  return (
    <main
      className="stack"
      style={{ minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <form
        className="panel stack"
        style={{ gap: 18, width: "100%", maxWidth: 400 }}
        onSubmit={(event) => void submit(event)}
      >
        <div className="logo" style={{ padding: 0 }}>
          <Image src="/brand/crescent.svg" alt="" width={28} height={28} priority />
          <span className="logo__word">Moon Light</span>
        </div>

        <div className="stack" style={{ gap: 6 }}>
          <h1 className="display" style={{ fontSize: 26 }}>
            Register
          </h1>
          <p className="lead">
            Nothing is imported from LinkedIn yet, so your profile starts empty and the wizard fills
            it.
          </p>
        </div>

        <Field label="Full name">
          <input
            className="input"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Ana Gómez"
            autoComplete="name"
          />
        </Field>

        <Field label="Email">
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ana.gomez@example.com"
            autoComplete="email"
          />
        </Field>

        {error && (
          <p className="lead" role="alert" style={{ color: "var(--gold-deep)" }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Creating your profile…" : "Create my profile"}
        </button>
      </form>
    </main>
  );
}
