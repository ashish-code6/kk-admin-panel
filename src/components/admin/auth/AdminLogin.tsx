"use client";

import { useState, type FormEvent } from "react";
import Icon from "@/components/admin/shared/Icon";

type AdminLoginProps = {
  error: string;
  isSigningIn: boolean;
  onSignIn: (email: string, password: string) => Promise<boolean>;
};

export default function AdminLogin({
  error,
  isSigningIn,
  onSignIn,
}: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onSignIn(email, password)) setPassword("");
  }

  return (
    <main className="login-shell">
      <section className="login-brand-panel">
        <div className="login-brand">
          <span className="brand-symbol">ॐ</span>
          <span>KALASH <b>&amp;</b> KUMKUM</span>
        </div>
        <div className="login-brand-copy">
          <span className="overline">ADMINISTRATION</span>
          <h1>Thoughtful commerce, beautifully managed.</h1>
          <p>One secure workspace for your store operations and customer relationships.</p>
        </div>
        <span className="login-brand-foot">KALASH &amp; KUMKUM · ADMIN CONSOLE</span>
      </section>
      <section className="login-form-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <span className="login-mobile-mark">ॐ &nbsp; KALASH &amp; KUMKUM</span>
          <span className="overline">WELCOME BACK</span>
          <h2>Sign in to your workspace</h2>
          <p>Use your administrator account to continue.</p>
          <label htmlFor="admin-email">Email address</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
          />
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="sign-in-button" type="submit" disabled={isSigningIn}>
            {isSigningIn ? "Signing in…" : "Sign in securely"}
            <span aria-hidden="true">→</span>
          </button>
          <span className="secure-note"><Icon name="shield" size={15} /> Protected administrator access</span>
        </form>
      </section>
    </main>
  );
}
