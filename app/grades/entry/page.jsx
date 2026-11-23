"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function GradeEntryPage() {
  const [checked, setChecked] = useState(false);

  function checkEntry(event) {
    event.preventDefault();
    setChecked(true);
  }

  return (
    <main className={styles.page}>
      <a className={styles.backLink} href="/">← Back to home</a>

      <div className={styles.card}>
        <div className={styles.brand}>
          <img
            src="/images/ism-logo.webp"
            alt=""
            className={styles.logo}
          />
          <div>
            <p className={styles.school}>Instituto Salvador Moncada</p>
            <p className={styles.brandSubtitle}>Academic records</p>
          </div>
          <span className={styles.badge}>Preview</span>
        </div>

        <div className={styles.content}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Teacher workspace</p>
            <h1>Grade entry</h1>
            <p>Enter the class details and a student’s score below.</p>
          </div>

          <div className={styles.notice}>
            <strong>Sample information only</strong>
            <p>
              This preview does not save or submit grades. Secure sign-in is
              still being developed.
            </p>
          </div>

          <form
            className={styles.form}
            onSubmit={checkEntry}
            onChange={() => setChecked(false)}
          >
            <div className={styles.sectionHeading}>
              <h2>Class details</h2>
              <p>Identify the class and term.</p>
            </div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="subject">Subject</label>
                <input id="subject" type="text" placeholder="e.g. Mathematics" required />
              </div>
              <div className={styles.field}>
                <label htmlFor="course-section">Course section</label>
                <input id="course-section" type="text" placeholder="e.g. 10-A" required />
              </div>
              <div className={styles.field}>
                <label htmlFor="term">Term <span>Optional</span></label>
                <input id="term" type="text" placeholder="e.g. Q1" />
              </div>
            </div>

            <div className={styles.sectionHeading}>
              <h2>Student grade</h2>
              <p>Add a sample student and score.</p>
            </div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="student">Student ID</label>
                <input id="student" type="text" placeholder="e.g. student-001" required />
              </div>
              <div className={styles.field}>
                <label htmlFor="score">Score <span>0–100</span></label>
                <input id="score" type="number" min="0" max="100" step="any" placeholder="e.g. 85" required />
              </div>
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="comments">Comments <span>Optional</span></label>
                <textarea id="comments" rows="3" placeholder="Add a note about this grade" />
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit">Check sample entry</button>
              <p role="status" aria-live="polite">
                {checked ? "The sample entry is valid. Nothing was saved or submitted." : ""}
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
