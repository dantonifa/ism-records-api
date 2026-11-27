"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import "../students.css";
import ConfirmDialog from "../../../components/students/ConfirmDialog";
import {
  ErrorMessage,
  LoadingState,
  SuccessMessage,
} from "../../../components/students/Feedback";
import { studentRequest } from "../../../lib/studentApi";

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id;

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStudent() {
      if (!studentId) {
        return;
      }

      setLoading(true);
      setError("");
      setStudent(null);
      setCanManage(false);
      setHistory(null);
      setHistoryError("");
      setHistoryLoading(false);
      let response, payload;
      try {
        ({ response, payload } = await studentRequest(
          `/api/students/${encodeURIComponent(studentId)}`,
        ));
      } catch {
        if (!active) return;
        setStudent(null);
        setError("Unable to load the student profile. Check your connection.");
        setLoading(false);
        return;
      }

      if (!active) return;
      if (!response.ok || !payload.success) {
        setStudent(null);
        setError(payload.message || "Student profile not found.");
        setLoading(false);
        return;
      }

      setStudent(payload.data);
      setCanManage(payload.canManage === true);
      setLoading(false);
      if (payload.canViewHistory) {
        setHistoryLoading(true);
        try {
          const result = await studentRequest(`/api/students/${encodeURIComponent(studentId)}/history`);
          if (!active) return;
          if (result.response.ok && result.payload.success) setHistory(result.payload.data);
          else setHistoryError(result.payload.message || "Unable to load academic history.");
        } catch {
          if (active) setHistoryError("Unable to load academic history. Check your connection.");
        } finally {
          if (active) setHistoryLoading(false);
        }
      }
    }

    loadStudent();
    return () => { active = false; };
  }, [studentId]);

  async function archiveStudent() {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const { response, payload } = await studentRequest(
        `/api/students/${encodeURIComponent(studentId)}`,
        { method: "DELETE" },
      );
      if (!response.ok || !payload.success) {
        setError(payload.message || "Unable to remove student profile.");
        return;
      }
      setSuccess(payload.message || "Student profile removed from normal use.");
      setStudent(payload.data);
    } catch {
      setError("Unable to remove student profile. Check your connection.");
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  return (
    <main className="student-page">
      <Link className="student-back" href="/students">
        Back to students
      </Link>

      <section className="student-panel student-profile">
        <div className="student-header">
          <div>
            <h1>Student profile</h1>
            <p>View identity, contact, and academic placement details.</p>
          </div>
          {student && canManage ? (
            <div className="student-actions">
              <a href={`/students/${student.studentId}/edit`}>Edit</a>
              {student.status === "active" ? (
                <button
                  type="button"
                  className="student-danger"
                  onClick={() => setConfirmOpen(true)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <ErrorMessage message={error} />
        <SuccessMessage message={success} />
        {loading ? <LoadingState message="Loading student profile..." /> : null}

        {!loading && student ? (
          <>
            <dl>
              <div>
                <dt>Student ID</dt>
                <dd>{student.studentId}</dd>
              </div>
              <div>
                <dt>Name</dt>
                <dd>
                  {student.firstName} {student.lastName}
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{student.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{student.phone || "Not provided"}</dd>
              </div>
              <div>
                <dt>Grade level</dt>
                <dd>{student.gradeLevel}</dd>
              </div>
              <div>
                <dt>Section</dt>
                <dd>{student.section}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{student.year}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{student.status}</dd>
              </div>
            </dl>

            <div className="student-inline-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => router.push("/students")}
              >
                Return to list
              </button>
            </div>
          </>
        ) : null}
      </section>

      {student && (historyLoading || historyError || history) ? (
        <section className="student-panel">
          <h2>Academic history</h2>
          {historyLoading ? <LoadingState message="Loading academic history..." /> : null}
          <ErrorMessage message={historyError} />
          {history ? (
            <>
              {history.enrollments.length === 0 && history.records.length === 0 ? <p>No enrollments or grades recorded.</p> : null}
              {history.enrollments.length > 0 ? (
                <>
                  <h3>Enrollments</h3>
                  <ul>{history.enrollments.map((enrollment) => (
                    <li key={enrollment._id}>{enrollment.course ? `${enrollment.course.code} — ${enrollment.course.name}` : "Course unavailable"} ({enrollment.status})</li>
                  ))}</ul>
                </>
              ) : null}
              {history.records.length > 0 ? (
                <>
                  <h3>Grades</h3>
                  <ul>{history.records.map((record) => (
                    <li key={record._id}>
                      {record.course} — {record.year}, {record.seccion}{record.status === "archived" ? " (archived)" : ""}
                      {" — "}{["parcial1", "parcial2", "parcial3", "parcial4"].map((key, index) => `Q${index + 1}: ${record.grades?.[key] ?? "Not graded"}`).join(", ")}
                    </li>
                  ))}</ul>
                </>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Remove student profile?"
        message="This archives the profile so it is removed from normal use. Related history can still be retained by other modules."
        confirmLabel="Remove profile"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={archiveStudent}
        busy={busy}
      />
    </main>
  );
}
