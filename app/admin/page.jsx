"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const responses = await Promise.all([
        fetch("/api/admin/users"), fetch("/api/admin/teachers"), fetch("/api/admin/assignments"),
      ]);
      const results = await Promise.all(responses.map((response) => response.json()));
      if (responses.some((response) => !response.ok)) throw new Error("Unable to load administration data");
      setUsers(results[0].data);
      setTeachers(results[1].data);
      setAssignments(results[2].data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function send(url, method, data) {
    setMessage("");
    try {
      const response = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        ...(data ? { body: JSON.stringify(data) } : {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Request failed");
      setMessage("Saved successfully.");
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main>
      <Link href="/">Back to home</Link>
      <h1>Administration</h1>
      <p role="status">{message}</p>
      <section>
        <h2>Accounts</h2>
        {users.map((user) => (
          <form key={user._id} onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            send("/api/admin/users", "PATCH", {
              userId: user._id, role: form.get("role"), isActive: form.get("isActive") === "on",
              ...(form.get("teacherId") ? { teacherId: form.get("teacherId") } : {}),
            });
          }}>
            <p>{user.name} — {user.email}</p>
            <label>Role <select name="role" defaultValue={user.role}>
              <option value="staff">Staff</option><option value="teacher">Teacher</option><option value="admin">Admin</option>
            </select></label>
            <label>Teacher record <select name="teacherId" defaultValue={user.teacherId || ""}>
              <option value="">None</option>
              {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name} ({teacher.teacherId})</option>)}
            </select></label>
            <label><input name="isActive" type="checkbox" defaultChecked={user.isActive} /> Approved</label>
            <button type="submit">Save account</button>
          </form>
        ))}
      </section>
      <section>
        <h2>Add teacher record</h2>
        <form onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("/api/admin/teachers", "POST", Object.fromEntries(form));
        }}>
          <label>Teacher ID <input name="teacherId" required /></label>
          <label>Name <input name="name" required /></label>
          <label>Department <input name="department" required /></label>
          <label>Email <input name="email" type="email" required /></label>
          <button type="submit">Add teacher</button>
        </form>
      </section>
      <section>
        <h2>Assign a class</h2>
        <p>Enter existing active student IDs separated by commas.</p>
        <form onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("/api/admin/assignments", "PUT", {
            teacherId: form.get("teacherId"), subjectId: form.get("subjectId"),
            courseSection: form.get("courseSection"), year: Number(form.get("year")),
            studentIds: String(form.get("studentIds")).split(",").map((id) => id.trim()).filter(Boolean),
          });
        }}>
          <label>Teacher <select name="teacherId" required defaultValue=""><option value="">Choose</option>
            {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name} ({teacher.teacherId})</option>)}
          </select></label>
          <label>Subject <input name="subjectId" required /></label>
          <label>Section <input name="courseSection" required /></label>
          <label>Year <input name="year" type="number" min="2000" max="2100" required /></label>
          <label>Student IDs <textarea name="studentIds" required /></label>
          <button type="submit">Save assignment</button>
        </form>
        {assignments.map((item) => (
          <p key={item._id}>
            {teachers.find((teacher) => teacher._id === item.teacherId)?.name || "Teacher"} — {item.subjectId}, {item.courseSection}, {item.year}
            {" "}<button type="button" onClick={() => send(`/api/admin/assignments?id=${encodeURIComponent(item._id)}`, "DELETE")}>Remove assignment</button>
          </p>
        ))}
      </section>
    </main>
  );
}
