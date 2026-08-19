"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MAX_PASSWORD, MIN_PASSWORD } from "@moonlight/core";

import { AuthLayout } from "../../components/AuthLayout";
import { Field } from "../../components/primitives";
import { registerAccount } from "../../lib/client";

interface Form {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = { fullName: "", email: "", password: "", confirmPassword: "" };

/**
 * The same rules parseRegistration enforces on the server, so the form never
 * promises something the API then refuses.
 */
function validate(form: Form): Errors {
  const errors: Errors = {};
  const email = form.email.trim();

  if (form.fullName.trim() === "") errors.fullName = "Your name is required.";

  if (email === "") errors.email = "Your email is required.";
  else if (!/^[^@\s]+@[^@\s]+$/.test(email)) errors.email = "That is not an email address.";

  // Never trimmed: a space is a legitimate character in a password.
  if (form.password.length < MIN_PASSWORD) {
    errors.password = `At least ${MIN_PASSWORD} characters.`;
  } else if (form.password.length > MAX_PASSWORD) {
    errors.password = `At most ${MAX_PASSWORD} characters.`;
  }

  if (form.confirmPassword === "") errors.confirmPassword = "Repeat your password.";
  else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "The passwords do not match.";
  }

  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set(key: keyof Form, value: string): void {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setServerError(null);

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await registerAccount({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      router.push("/onboarding");
      router.refresh();
    } catch (cause) {
      setServerError(cause instanceof Error ? cause.message : "Could not create your account.");
      setSubmitting(false);
    }
  }

  // The server owns this answer, so it is matched on rather than reworded.
  const emailTaken = serverError?.includes("already has an account") ?? false;

  return (
    <AuthLayout>
      <form className="panel stack" style={{ gap: 18 }} onSubmit={submit} noValidate>
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="display">Create your account</h1>
          <p className="lead">
            Nothing is imported from LinkedIn in this delivery. Your profile starts empty and the
            wizard fills it, field by field, the moment you sign up.
          </p>
        </div>

        <Field label="Full name">
          <input
            className="input"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="Ana Gómez"
            autoComplete="name"
            aria-invalid={errors.fullName ? true : undefined}
          />
          {errors.fullName && <ErrorText>{errors.fullName}</ErrorText>}
        </Field>

        <Field label="Email">
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="ana.gomez@example.com"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
          />
          {errors.email && <ErrorText>{errors.email}</ErrorText>}
        </Field>

        <Field label="Password" hint={`Between ${MIN_PASSWORD} and ${MAX_PASSWORD} characters.`}>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
          />
          {errors.password && <ErrorText>{errors.password}</ErrorText>}
        </Field>

        <Field label="Confirm password">
          <input
            className="input"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
            autoComplete="new-password"
            aria-invalid={errors.confirmPassword ? true : undefined}
          />
          {errors.confirmPassword && <ErrorText>{errors.confirmPassword}</ErrorText>}
        </Field>

        {serverError && (
          <p className="lead" role="alert" style={{ color: "var(--gold-deep)" }}>
            {serverError}
            {emailTaken && (
              <>
                {" — "}
                <Link href="/login">sign in instead</Link>.
              </>
            )}
          </p>
        )}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? "Creating your account…" : "Create account"}
        </button>

        <p className="meta" style={{ textAlign: "center" }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <span className="field__hint" role="alert" style={{ color: "var(--gold-deep)" }}>
      {children}
    </span>
  );
}
