"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import "./students.css";
import SearchFilter from "../../components/students/SearchFilter";
import StudentTable from "../../components/students/StudentTable";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
} from "../../components/students/Feedback";
import { studentRequest } from "../../lib/studentApi";
import type { Student } from "../../types/records";

export default function StudentsPage() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [canCreate, setCanCreate] = useState(false);

  async function loadStudents(searchValue = "") {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({ status: "active" });
    if (searchValue.trim()) {
      params.set("q", searchValue.trim());
    }

    const { response, payload } = await studentRequest<Student[]>(
      `/api/students?${params.toString()}`,
    );

    if (!response.ok || !payload.success) {
      setStudents([]);
      setError(payload.message || "Unable to load students.");
      setLoading(false);
      return;
    }

    setStudents(payload.data || []);
    setCanManage(payload.canManage === true);
    setCanCreate(payload.canCreate === true);
    setLoading(false);
  }

  useEffect(() => {
    loadStudents();
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadStudents(query);
  }

  return (
    <main className="student-page">
      <Link className="student-back" href="/">
        Back to home
      </Link>

      <section className="student-panel">
        <div className="student-header">
          <div>
            <h1>Students</h1>
            <p>Search, browse, and manage student profiles.</p>
          </div>
          {canCreate && (
            <div className="student-actions">
              <Link href="/students/new">Add student</Link>
            </div>
          )}
        </div>

        <SearchFilter
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSearch}
        />

        <ErrorMessage message={error} />

        {loading ? <LoadingState /> : null}

        {!loading && !error && students.length === 0 ? (
          <EmptyState message="No student profiles match your search." />
        ) : null}

        {!loading && students.length > 0 ? (
          <StudentTable students={students} canManage={canManage} />
        ) : null}
      </section>
    </main>
  );
}
