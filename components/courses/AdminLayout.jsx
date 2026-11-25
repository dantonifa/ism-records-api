import { redirect } from "next/navigation";
import { authorize } from "../../lib/authorization.js";

export default async function AdminCourseLayout({ children }) {
  const access = await authorize(["admin"]);
  if (access.response) redirect(access.response.status === 401 ? "/login" : "/courses");
  return children;
}
