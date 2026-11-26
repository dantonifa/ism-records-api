"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import CourseForm from "../../../components/courses/CourseForm";
import { courseRequest } from "../../../lib/courseApi";

export default function NewCoursePage() {
  const router = useRouter();

  async function createCourse(data) {
    const result = await courseRequest("/api/courses", { method: "POST", body: JSON.stringify(data) });
    router.push(`/courses/${result.data._id}`);
  }

  return (
    <main className="student-page">
      <Link className="student-back" href="/courses">Back to courses</Link>
      <section className="student-panel">
        <h1>Add course</h1>
        <CourseForm onSubmit={createCourse} />
      </section>
    </main>
  );
}
