"use client";

import "../students.css";
import Link from "next/link";
import StudentForm from "../../../components/students/StudentForm";
import { studentRequest } from "../../../lib/studentApi";

export default function NewStudentPage() {
  async function createStudent(payload) {
    const { response, payload: body } = await studentRequest("/api/students", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok || !body.success) {
      return {
        ok: false,
        message: body.message || "Unable to create student profile.",
      };
    }

    return {
      ok: true,
      message: body.message || "Student profile created successfully.",
    };
  }

  return (
    <main className="student-page">
      <Link className="student-back" href="/students">
        Back to students
      </Link>

      <section className="student-panel">
        <div className="student-header">
          <div>
            <h1>Add student</h1>
            <p>Create a student profile with required identity and contact details.</p>
          </div>
        </div>

        <StudentForm
          mode="create"
          onSubmit={createStudent}
          submitLabel="Create student"
        />
      </section>
    </main>
  );
}
