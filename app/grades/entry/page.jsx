"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function GradeEntryPage() {
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/assignments");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setAssignments(data.data);
      } catch (error) {
        setMessage(error.message || "Unable to load assignments.");
      }
    }
    load();
  }, []);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const assignment = assignments.find((item) => item._id === selected);
    if (!assignment) {
      setMessage("Select an assigned class.");
      return;
    }
    try {
      const response = await fetch("/api/grades/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: assignment.subjectId,
          courseSection: assignment.courseSection,
          year: assignment.year,
          term: form.get("term"),
          grades: [{
            studentId: form.get("studentId"),
            score: Number(form.get("score")),
            comments: form.get("comments"),
          }],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage("Grade submitted for review.");
    } catch (error) {
      setMessage(error.message || "Unable to submit the grade.");
    }
  }

  const assignment = assignments.find((item) => item._id === selected);
  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/">Back to home</Link>
      <div className={styles.card}>
        <div className={styles.brand}>
          <img src="/images/ism-logo.webp" alt="" className={styles.logo} />
          <div><p className={styles.school}>Instituto Salvador Moncada</p><p className={styles.brandSubtitle}>Academic records</p></div>
        </div>
        <div className={styles.content}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Teacher workspace</p>
            <h1>Grade entry</h1>
            <p>Submit a grade for review. Contact an administrator if your class is not assigned.</p>
          </div>
          <form className={styles.form} onSubmit={submit}>
            <label className={styles.field}>Assigned class
              <select value={selected} onChange={(event) => setSelected(event.target.value)} required>
                <option value="">Select a class</option>
                {assignments.map((item) => <option key={item._id} value={item._id}>{item.subjectId} — {item.courseSection} ({item.year})</option>)}
              </select>
            </label>
            <label className={styles.field}>Student
              <select name="studentId" key={selected} required defaultValue="">
                <option value="">Select a student</option>
                {assignment?.studentIds.map((id) => <option key={id} value={id}>{id}</option>)}
              </select>
            </label>
            <label className={styles.field}>Term
              <select name="term" required defaultValue=""><option value="">Select a term</option>
                {["Q1", "Q2", "Q3", "Q4"].map((term) => <option key={term} value={term}>{term}</option>)}
              </select>
            </label>
            <label className={styles.field}>Score <input name="score" type="number" min="0" max="100" step="any" required /></label>
            <label className={styles.field}>Comments <textarea name="comments" rows="3" /></label>
            <div className={styles.actions}><button type="submit">Submit grade</button></div>
          </form>
          <p role="status" aria-live="polite">{message}</p>
        </div>
      </div>
    </main>
  );
}
