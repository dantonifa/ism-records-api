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

  useEffect(() => {
    async function loadStudent() {
      if (!studentId) {
        return;
      }

      setLoading(true);
      setError("");
      const { response, payload } = await studentRequest(
        `/api/students/${encodeURIComponent(studentId)}`,
      );

      if (!response.ok || !payload.success) {
        setStudent(null);
        setError(payload.message || "Student profile not found.");
        setLoading(false);
        return;
      }

      setStudent(payload.data);
      setLoading(false);
    }

    loadStudent();
  }, [studentId]);

  async function archiveStudent() {
    setBusy(true);
    setError("");
    setSuccess("");

    const { response, payload } = await studentRequest(
      `/api/students/${encodeURIComponent(studentId)}`,
      { method: "DELETE" },
    );

    setBusy(false);
    setConfirmOpen(false);

    if (!response.ok || !payload.success) {
      setError(payload.message || "Unable to remove student profile.");
      return;
    }

    setSuccess(payload.message || "Student profile removed from normal use.");
    setStudent(payload.data);
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
          {student ? (
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
