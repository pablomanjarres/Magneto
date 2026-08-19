"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthLayout } from "../../components/AuthLayout";
import { Field } from "../../components/primitives";
import { signIn } from "../../lib/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const ready = email.trim() !== "" && password !== "";

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!ready || pending) return;

    setPending(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      router.push("/dashboard");
      router.refresh();
      // pending stays true: the navigation is already in flight.
    } catch (cause) {
      // Shown exactly as the server wrote it. It answers "email or password is
      // wrong" for both, and saying which would out whoever has an account here.
      setError(cause instanceof Error ? cause.message : "sign in failed");
      setPending(false);
    }
  }

  return (
    <AuthLayout>
      <section className="panel stack" style={{ gap: 18 }}>
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="display" style={{ fontSize: 26 }}>
            Sign in
          </h1>
          <p className="lead">Your profile, your score, and the vacancies ranked against it.</p>
        </div>

        <form className="stack" style={{ gap: 16 }} onSubmit={(e) => void submit(e)}>
          <Field label="Email">
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana.gomez@example.com"
              autoComplete="email"
            />
          </Field>

          <Field label="Password">
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>

          {error && (
            <p className="lead" role="alert" style={{ color: "var(--gold-deep)" }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--primary" disabled={!ready || pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="meta" style={{ textAlign: "center" }}>
          No account yet? <Link href="/register">Create one</Link>
        </p>
      </section>

      <div className="card stack" style={{ gap: 3 }}>
        <span className="meta">Demo seed data, created by pnpm db:seed:</span>
        <span className="meta" style={{ color: "var(--ink-secondary)" }}>
          ana.gomez@example.com · moonlight-demo
        </span>
      </div>
    </AuthLayout>
  );
}
