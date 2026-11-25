"use client";

import { useEffect, useState } from "react";

export default function GradeReviewPage() {
  const [submissions, setSubmissions] = useState([]);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/secretary/grades");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSubmissions(data.data);
    } catch (error) {
      setMessage(error.message || "Unable to load submissions");
    }
  }
  useEffect(() => { load(); }, []);

  async function review(event, submission, action) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/secretary/grades/${submission._id}/${action}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "approve" ? { year: Number(form.get("year")) } : { rejectionReason: form.get("reason") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage(`Submission ${action === "approve" ? "approved" : "rejected"}.`);
      await load();
    } catch (error) {
      setMessage(error.message || "Unable to review submission");
    }
  }

  return (
    <main>
      <a href="/">Back to home</a>
      <h1>Pending grades</h1>
      <p role="status">{message}</p>
      {!submissions.length && !message && <p>No pending submissions.</p>}
      {submissions.map((submission) => (
        <section key={submission._id}>
          <h2>{submission.subjectId} — {submission.courseSection}, {submission.term}</h2>
          <ul>{submission.grades.map((grade) => <li key={grade.studentId}>{grade.studentId}: {grade.score}{grade.comments ? ` — ${grade.comments}` : ""}</li>)}</ul>
          <form onSubmit={(event) => review(event, submission, "approve")}>
            <label>Year <input name="year" type="number" min="1" defaultValue={submission.year || ""} required /></label>
            <button type="submit">Approve</button>
          </form>
          <form onSubmit={(event) => review(event, submission, "reject")}>
            <label>Reason <input name="reason" required /></label>
            <button type="submit">Reject</button>
          </form>
        </section>
      ))}
    </main>
  );
}
