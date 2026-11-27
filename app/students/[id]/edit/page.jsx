"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "../../students.css";
import StudentForm from "../../../../components/students/StudentForm";
import {
  ErrorMessage,
  LoadingState,
} from "../../../../components/students/Feedback";
import { studentRequest } from "../../../../lib/studentApi";

export default function EditStudentPage() {
  const params = useParams();
  const studentId = params?.id;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStudent() {
      if (!studentId) {
        return;
      }

      setLoading(true);
      const { response, payload } = await studentRequest(
        `/api/students/${encodeURIComponent(studentId)}`,
      );

      if (!response.ok || !payload.success) {
        setError(payload.message || "Student profile not found.");
        setStudent(null);
        setLoading(false);
        return;
      }

      if (!payload.canManage) {
        setError("Administrator access is required to edit student profiles.");
        setStudent(null);
        setLoading(false);
        return;
      }

      setStudent(payload.data);
      setLoading(false);
    }

    loadStudent();
  }, [studentId]);

  async function updateStudent(payload) {
    const { response, payload: body } = await studentRequest(
      `/api/students/${encodeURIComponent(studentId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok || !body.success) {
      return {
        ok: false,
        message: body.message || "Unable to update student profile.",
      };
    }

    setStudent(body.data);
    return {
      ok: true,
      message: body.message || "Student profile updated successfully.",
    };
  }

  return (
    <main className="student-page">
      <a className="student-back" href={`/students/${studentId || ""}`}>
        Back to profile
      </a>

      <section className="student-panel">
        <div className="student-header">
          <div>
            <h1>Edit student</h1>
            <p>Update contact and academic placement details.</p>
          </div>
        </div>

        <ErrorMessage message={error} />
        {loading ? <LoadingState message="Loading student profile..." /> : null}

        {!loading && student ? (
          <StudentForm
            mode="edit"
            initialValues={{
              firstName: student.firstName,
              lastName: student.lastName,
              email: student.email,
              phone: student.phone || "",
              gradeLevel: student.gradeLevel,
              section: student.section,
              year: String(student.year),
            }}
            onSubmit={updateStudent}
            submitLabel="Save changes"
          />
        ) : null}
      </section>
    </main>
  );
}
