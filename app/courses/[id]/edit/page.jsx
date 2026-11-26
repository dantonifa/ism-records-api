"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import CourseForm from "../../../../components/courses/CourseForm";
import { ErrorMessage, LoadingState } from "../../../../components/students/Feedback";
import { courseRequest } from "../../../../lib/courseApi";

export default function EditCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await courseRequest(`/api/courses/${encodeURIComponent(id)}`);
        setCourse(result.data);
      } catch (loadError) {
        setError(loadError.message || "Unable to load course.");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  async function save(data) {
    await courseRequest(`/api/courses/${encodeURIComponent(id)}`, {
      method: "PATCH", body: JSON.stringify(data),
    });
    router.push(`/courses/${encodeURIComponent(id)}`);
  }

  return (
    <main className="student-page">
      <Link className="student-back" href={`/courses/${id}`}>Back to course</Link>
      <section className="student-panel">
        <h1>Edit course</h1>
        <ErrorMessage message={error} />
        {loading && <LoadingState message="Loading course..." />}
        {course && <CourseForm initialCourse={course} onSubmit={save} />}
      </section>
    </main>
  );
}
