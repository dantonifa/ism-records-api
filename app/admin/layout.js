import { redirect } from "next/navigation";
import { authorize } from "../../lib/authorization.js";

export default async function AdminLayout({ children }) {
  const access = await authorize(["admin"]);
  if (access.response) redirect("/login");
  return children;
}
