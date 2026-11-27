"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import FormField from "../../components/students/FormField";
import { ErrorMessage, LoadingState, SuccessMessage } from "../../components/students/Feedback";
import { apiRequest } from "../../lib/apiRequest";

interface Account {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Status {
  error?: string;
  success?: string;
}

export default function AccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loadError, setLoadError] = useState("");
  const [profileStatus, setProfileStatus] = useState<Status>({});
  const [passwordStatus, setPasswordStatus] = useState<Status>({});

  useEffect(() => {
    apiRequest<Account>("/api/account", {}, "Unable to load your account.")
      .then((result) => setAccount(result.data))
      .catch((error: Error) => setLoadError(error.message));
  }, []);

  async function updateName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileStatus({});
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest<Account>(
        "/api/account",
        { method: "PATCH", body: JSON.stringify({ name: form.get("name") }) },
        "Unable to update your name.",
      );
      setAccount(result.data);
      setProfileStatus({ success: result.message });
    } catch (error) {
      setProfileStatus({ error: (error as Error).message });
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordStatus({});
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (form.get("newPassword") !== form.get("confirmPassword")) {
      setPasswordStatus({ error: "New passwords do not match." });
      return;
    }
    try {
      const result = await apiRequest(
        "/api/account/password",
        {
          method: "PUT",
          body: JSON.stringify({
            currentPassword: form.get("currentPassword"),
            newPassword: form.get("newPassword"),
          }),
        },
        "Unable to change your password.",
      );
      formElement.reset();
      setPasswordStatus({ success: result.message });
    } catch (error) {
      setPasswordStatus({ error: (error as Error).message });
    }
  }

  return (
    <main className="student-page">
      <Link className="student-back" href="/">Back to home</Link>
      <header className="student-header">
        <h1>My account</h1>
      </header>

      {loadError ? <ErrorMessage message={loadError} /> : null}
      {!account && !loadError ? <LoadingState message="Loading your account..." /> : null}

      {account ? (
        <>
          <section className="student-panel student-profile" aria-labelledby="details-heading">
            <h2 id="details-heading">Account details</h2>
            <dl>
              <dt>Name</dt>
              <dd>{account.name}</dd>
              <dt>Email</dt>
              <dd>{account.email}</dd>
              <dt>Role</dt>
              <dd>{account.role}</dd>
            </dl>
          </section>

          <section className="student-panel" aria-labelledby="name-heading">
            <h2 id="name-heading">Update name</h2>
            <form className="student-form" onSubmit={updateName}>
              <FormField id="account-name" label="Name">
                <input
                  id="account-name"
                  name="name"
                  defaultValue={account.name}
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                />
              </FormField>
              <ErrorMessage message={profileStatus.error} />
              <SuccessMessage message={profileStatus.success} />
              <button type="submit">Save name</button>
            </form>
          </section>

          <section className="student-panel" aria-labelledby="password-heading">
            <h2 id="password-heading">Change password</h2>
            <form className="student-form" onSubmit={changePassword}>
              <FormField id="current-password" label="Current password">
                <input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </FormField>
              <FormField id="new-password" label="New password" hint="At least 8 characters.">
                <input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                />
              </FormField>
              <FormField id="confirm-password" label="Confirm new password">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                />
              </FormField>
              <ErrorMessage message={passwordStatus.error} />
              <SuccessMessage message={passwordStatus.success} />
              <button type="submit">Change password</button>
            </form>
          </section>
        </>
      ) : null}
    </main>
  );
}
