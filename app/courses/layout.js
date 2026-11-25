import { redirect } from "next/navigation";
import { authorize } from "../../lib/authorization.js";
import "../students/students.css";

export default async function CoursesLayout({ children }) {
  const access = await authorize(["admin", "staff", "teacher"]);
  if (access.response) redirect("/login");
  return children;
}
