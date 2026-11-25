"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function GradeReviewPage() {
  const [submissions, setSubmissions] = useState([]);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadVersion = useRef(0);

  async function load(activeFilters = {}) {
    const version = ++loadVersion.current;
    setLoading(true);
    try {
      const params = new URLSearchParams(activeFilters);
      const response = await fetch(`/api/secretary/grades?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (version !== loadVersion.current) return;
      setSubmissions(data.data);
      setSelected([]);
    } catch (error) {
      if (version !== loadVersion.current) return;
      setSubmissions([]);
      setSelected([]);
      setMessage(error.message || "Unable to load submissions");
    } finally {
      if (version === loadVersion.current) setLoading(false);
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
      await load(filters);
    } catch (error) {
      setMessage(error.message || "Unable to review submission");
    }
  }

  function filterSubmissions(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextFilters = {};
    for (const field of ["teacherId", "subjectId", "term"]) {
      const value = String(form.get(field)).trim();
      if (value) nextFilters[field] = value;
    }
    setMessage("");
    setFilters(nextFilters);
    load(nextFilters);
  }

  async function approveBatch(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/secretary/grades/batch-approve", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: Number(form.get("year")), submissionIds: selected }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage(`${data.data.length} submissions approved.`);
      await load(filters);
    } catch (error) {
      setMessage(error.message || "Unable to approve submissions");
    }
  }

  return (
    <main>
      <Link href="/">Back to home</Link>
      <h1>Pending grades</h1>
      <form onSubmit={filterSubmissions}>
        <label>Teacher database ID <input name="teacherId" /></label>
        <label>Subject <input name="subjectId" /></label>
        <label>Term <input name="term" /></label>
        <button type="submit">Filter</button>
      </form>
      <p role="status">{message}</p>
      {loading && <p>Loading submissions...</p>}
      {!loading && !submissions.length && !message && <p>No pending submissions.</p>}
      <p>All selected submissions must be for the same school year.</p>
      <form onSubmit={approveBatch}>
        <label>School year <input name="year" type="number" min="1" required /></label>
        <button type="submit" disabled={!selected.length || loading}>Approve selected ({selected.length})</button>
      </form>
      {submissions.map((submission) => (
        <section key={submission._id}>
          <label>
            <input
              type="checkbox"
              checked={selected.includes(submission._id)}
              disabled={loading || (!selected.includes(submission._id) && selected.length >= 50)}
              onChange={(event) => {
                const checked = event.target.checked;
                setSelected((current) => checked
                  ? [...current, submission._id]
                  : current.filter((id) => id !== submission._id));
              }}
            />
            Select for batch approval
          </label>
          <h2>{submission.subjectId} — {submission.courseSection}, {submission.term}</h2>
          <p>Teacher database ID: {submission.teacherId}</p>
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
