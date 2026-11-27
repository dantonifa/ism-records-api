import { z } from "zod";
import User from "../models/User.js";
import { dbConnect } from "./db.js";
import { readBody } from "./requestBody.js";

const ROLES = ["admin", "staff", "teacher"];

const profileSchema = z.object({ name: z.string().trim().min(2).max(100) }).strict();

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
  })
  .strict();

function failure(status, message) {
  return Response.json({ success: false, message }, { status });
}

function toAccount(user) {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

export function createAccountHandlers(authorize) {
  return {
    async get() {
      try {
        const auth = await authorize(ROLES);
        if (auth.response) return auth.response;
        return Response.json({ success: true, data: toAccount(auth.user) });
      } catch (error) {
        console.error("Unable to load account:", error.name);
        return failure(500, "Unable to load your account.");
      }
    },

    async updateProfile(request) {
      try {
        const auth = await authorize(ROLES);
        if (auth.response) return auth.response;
        const input = await readBody(request);
        if (input.error) return failure(400, input.error);
        const parsed = profileSchema.safeParse(input.body);
        if (!parsed.success) return failure(400, "Name must be between 2 and 100 characters.");
        await dbConnect();
        const user = await User.findByIdAndUpdate(
          auth.user._id,
          { name: parsed.data.name },
          { new: true, runValidators: true },
        ).lean();
        if (!user) return failure(404, "Account not found.");
        return Response.json({ success: true, data: toAccount(user), message: "Name updated." });
      } catch (error) {
        console.error("Unable to update account:", error.name);
        return failure(500, "Unable to update your account.");
      }
    },

    async changePassword(request) {
      try {
        const auth = await authorize(ROLES);
        if (auth.response) return auth.response;
        const input = await readBody(request);
        if (input.error) return failure(400, input.error);
        const parsed = passwordSchema.safeParse(input.body);
        if (!parsed.success) return failure(400, "New password must be between 8 and 72 characters.");
        const { currentPassword, newPassword } = parsed.data;
        if (Buffer.byteLength(newPassword, "utf8") > 72) return failure(400, "New password is too long.");
        await dbConnect();
        const user = await User.findById(auth.user._id).select("+password");
        if (!user) return failure(404, "Account not found.");
        if (!(await user.comparePassword(currentPassword))) {
          return failure(400, "Current password is incorrect.");
        }
        user.password = newPassword;
        await user.save();
        return Response.json({ success: true, message: "Password changed." });
      } catch (error) {
        console.error("Unable to change password:", error.name);
        return failure(500, "Unable to change your password.");
      }
    },
  };
}
