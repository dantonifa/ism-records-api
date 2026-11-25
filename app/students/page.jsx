"use client";

import { useEffect, useState } from "react";
import "./students.css";
import SearchFilter from "../../components/students/SearchFilter";
import StudentTable from "../../components/students/StudentTable";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
} from "../../components/students/Feedback";
import { studentRequest } from "../../lib/studentApi";

export default function StudentsPage() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStudents(searchValue = "") {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({ status: "active" });
    if (searchValue.trim()) {
      params.set("q", searchValue.trim());
    }

    const { response, payload } = await studentRequest(
      `/api/students?${params.toString()}`,
    );

    if (!response.ok || !payload.success) {
      setStudents([]);
      setError(payload.message || "Unable to load students.");
      setLoading(false);
      return;
    }

    setStudents(payload.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadStudents();
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    loadStudents(query);
  }

  return (
    <main className="student-page">
      <a className="student-back" href="/">
        Back to home
      </a>

      <section className="student-panel">
        <div className="student-header">
          <div>
            <h1>Students</h1>
            <p>Search, browse, and manage student profiles.</p>
          </div>
          <div className="student-actions">
            <a href="/students/new">Add student</a>
          </div>
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
          <StudentTable students={students} />
        ) : null}
      </section>
    </main>
  );
}
