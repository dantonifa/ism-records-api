"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { courseRequest } from "../../lib/courseApi";
import { EmptyState, ErrorMessage, LoadingState } from "../../components/students/Feedback";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await courseRequest("/api/courses");
        setCourses(result.data);
        setCanManage(result.canManage);
      } catch (loadError) {
        setError(loadError.message || "Unable to load courses.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="student-page">
      <Link className="student-back" href="/">Back to home</Link>
      <section className="student-panel">
        <div className="student-header">
          <div><h1>Courses</h1><p>Browse active courses.</p></div>
          {canManage && <div className="student-actions"><Link href="/courses/new">Add course</Link></div>}
        </div>
        <ErrorMessage message={error} />
        {loading && <LoadingState message="Loading courses..." />}
        {!loading && !error && !courses.length && <EmptyState message="No active courses found." />}
        {!loading && courses.length > 0 && (
          <ul>
            {courses.map((course) => (
              <li key={course._id}><Link href={`/courses/${course._id}`}>{course.code} — {course.name}</Link></li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
