import { redirect } from "next/navigation";
import { authorize } from "../../lib/authorization.js";

export default async function GradesLayout({ children }) {
  const access = await authorize(["admin", "staff", "teacher"]);
  if (access.response) redirect("/login");
  return children;
}
