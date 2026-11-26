"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ConfirmDialog from "../../../components/students/ConfirmDialog";
import { ErrorMessage, LoadingState } from "../../../components/students/Feedback";
import { courseRequest } from "../../../lib/courseApi";

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await courseRequest(`/api/courses/${encodeURIComponent(id)}`);
        setCourse(result.data);
        setCanManage(result.canManage);
      } catch (loadError) {
        setError(loadError.message || "Unable to load course.");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  async function archive() {
    setBusy(true);
    setError("");
    try {
      await courseRequest(`/api/courses/${encodeURIComponent(id)}`, { method: "DELETE" });
      router.push("/courses");
    } catch (archiveError) {
      setError(archiveError.message || "Unable to archive course.");
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="student-page">
      <Link className="student-back" href="/courses">Back to courses</Link>
      <section className="student-panel">
        <ErrorMessage message={error} />
        {loading && <LoadingState message="Loading course..." />}
        {course && (
          <>
            <h1>{course.name}</h1>
            <p>Course code: {course.code}</p>
            <p>Status: {course.status}</p>
            <p>{course.description || "No description provided."}</p>
            {canManage && (
              <div className="student-actions">
                <Link href={`/courses/${course._id}/edit`}>Edit</Link>
                <button type="button" className="student-danger" onClick={() => setConfirmOpen(true)}>Archive</button>
              </div>
            )}
          </>
        )}
      </section>
      <ConfirmDialog
        open={confirmOpen}
        title="Archive course"
        message="This course will no longer appear in the active course list."
        confirmLabel="Archive"
        onConfirm={archive}
        onCancel={() => setConfirmOpen(false)}
        busy={busy}
      />
    </main>
  );
}
