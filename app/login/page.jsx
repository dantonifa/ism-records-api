"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: form.get("email"), password: form.get("password"), redirect: false,
      });
      if (!result?.ok) {
        setMessage("Sign-in failed. Check your details and confirm your account is approved.");
      } else {
        window.location.assign("/");
      }
    } catch {
      setMessage("Unable to sign in. Please try again.");
    }
  }

  return (
    <main>
      <h1>Sign in</h1>
      <form onSubmit={submit}>
        <label>Email <input name="email" type="email" required autoComplete="email" /></label>
        <label>Password <input name="password" type="password" required autoComplete="current-password" /></label>
        <button type="submit">Sign in</button>
      </form>
      <p role="status">{message}</p>
      <p><a href="/signup">Request an account</a></p>
    </main>
  );
}
