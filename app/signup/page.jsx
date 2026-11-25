"use client";

import { useState } from "react";

export default function SignupPage() {
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password") }),
      });
      const data = await response.json();
      setMessage(response.ok ? data.message : data.error);
      if (response.ok) event.target.reset();
    } catch {
      setMessage("Unable to request an account. Please try again.");
    }
  }

  return (
    <main>
      <h1>Request an account</h1>
      <p>An administrator must approve your account before you can sign in.</p>
      <form onSubmit={submit}>
        <label>Name <input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label>
        <label>Email <input name="email" type="email" required autoComplete="email" /></label>
        <label>Password <input name="password" type="password" required minLength={8} autoComplete="new-password" /></label>
        <button type="submit">Request account</button>
      </form>
      <p role="status">{message}</p>
      <p><a href="/login">Sign in</a></p>
    </main>
  );
}
