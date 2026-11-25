"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../students/students.css";
import { apiRequest } from "../../lib/apiRequest";
import ConfirmDialog from "../../components/students/ConfirmDialog";
import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../../components/students/Feedback";

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [archiveId, setArchiveId] = useState(null);

  async function load() {
    const [enrollmentResult, studentResult, courseResult] = await Promise.all([
      apiRequest("/api/enrollments"),
      apiRequest("/api/students?status=active"),
      apiRequest("/api/courses"),
    ]);
    setEnrollments(enrollmentResult.data);
    setStudents(studentResult.data);
    setCourses(courseResult.data);
    setReady(true);
  }

  useEffect(() => {
    load().catch((loadError) => setError(loadError.message)).finally(() => setLoading(false));
  }, []);

  async function create(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest("/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ studentId, courseId }),
      });
      setStudentId("");
      setCourseId("");
      setSuccess("Enrollment created.");
      try {
        await load();
      } catch (refreshError) {
        setError(`Enrollment created, but refreshing failed: ${refreshError.message}`);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(id, restore) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest(`/api/enrollments/${id}`, restore
        ? { method: "PATCH", body: JSON.stringify({ status: "active" }) }
        : { method: "DELETE" });
      setArchiveId(null);
      setSuccess(restore ? "Enrollment restored." : "Enrollment archived.");
      try {
        await load();
      } catch (refreshError) {
        setError(`Enrollment updated, but refreshing failed: ${refreshError.message}`);
      }
    } catch (requestError) {
      setArchiveId(null);
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="student-page">
      <Link className="student-back" href="/">Back to home</Link>
      <section className="student-panel">
        <div className="student-header">
          <div><h1>Enrollments</h1><p>Manage student course enrollments.</p></div>
        </div>
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />
        {loading && <LoadingState message="Loading enrollments..." />}
        {!loading && ready && (
          <>
            <form className="student-form" onSubmit={create}>
              <div className="student-form-grid">
                <div className="student-field">
                  <label htmlFor="enrollment-student">Student</label>
                  <select id="enrollment-student" value={studentId} onChange={(event) => setStudentId(event.target.value)} required>
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>{student.lastName}, {student.firstName} ({student.studentId})</option>
                    ))}
                  </select>
                </div>
                <div className="student-field">
                  <label htmlFor="enrollment-course">Course</label>
                  <select id="enrollment-course" value={courseId} onChange={(event) => setCourseId(event.target.value)} required>
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>{course.code} — {course.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div><button type="submit" disabled={busy || !students.length || !courses.length}>Add enrollment</button></div>
              {(!students.length || !courses.length) && <p className="student-hint">An active student and course are required.</p>}
            </form>
            <h2>Current and archived enrollments</h2>
            {!enrollments.length && <EmptyState message="No enrollments found." />}
            {enrollments.length > 0 && (
              <div className="student-table-wrap">
                <table className="student-table">
                  <thead><tr><th>Student</th><th>Course</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment._id}>
                        <td>{enrollment.student ? `${enrollment.student.lastName}, ${enrollment.student.firstName} (${enrollment.student.studentId})${enrollment.student.status !== "active" ? " — archived" : ""}` : "Student unavailable"}</td>
                        <td>{enrollment.course ? `${enrollment.course.code} — ${enrollment.course.name}${enrollment.course.status !== "active" ? " — archived" : ""}` : "Course unavailable"}</td>
                        <td>{enrollment.status}</td>
                        <td className="student-inline-actions">
                          {enrollment.status === "active"
                            ? <button type="button" className="student-danger" disabled={busy} onClick={() => setArchiveId(enrollment._id)}>Archive</button>
                            : <button type="button" disabled={busy} onClick={() => changeStatus(enrollment._id, true)}>Restore</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
      <ConfirmDialog open={Boolean(archiveId)} title="Archive enrollment?" message="The enrollment can be restored later if the student and course are active." confirmLabel="Archive" busy={busy} onConfirm={() => changeStatus(archiveId, false)} onCancel={() => setArchiveId(null)} />
    </main>
  );
}
