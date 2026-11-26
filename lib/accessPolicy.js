import mongoose from "mongoose";

export function createAuthorization(getSession, connect, findUser) {
  return async function authorize(roles) {
    const session = await getSession();
    if (!session?.user?.id || !mongoose.isObjectIdOrHexString(session.user.id)) {
      return { response: Response.json({ success: false, error: "Authentication required" }, { status: 401 }) };
    }

    await connect();
    const user = await findUser(session.user.id);
    if (!user?.isActive || !roles.includes(user.role)) {
      return { response: Response.json({ success: false, error: "Access denied" }, { status: 403 }) };
    }
    return { user };
  };
}
