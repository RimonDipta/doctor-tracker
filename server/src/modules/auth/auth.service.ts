import type { Types } from "mongoose";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { AppError, unauthorized } from "../../lib/errors.js";
import { hashToken, SESSION_TTL_MS } from "../../middleware/auth.js";
import { Admin } from "../../models/admin.model.js";
import { Session } from "../../models/session.model.js";

const BCRYPT_COST = 12;
// Compared against for unknown emails so response time doesn't reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync(randomBytes(16).toString("hex"), BCRYPT_COST);

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST);

export async function createSession(adminId: Types.ObjectId) {
  const token = randomBytes(32).toString("base64url");
  await Session.create({
    tokenHash: hashToken(token),
    admin: adminId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export async function login(email: string, password: string) {
  const admin = await Admin.findOne({ email }).select("+passwordHash");
  const matches = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !matches) throw unauthorized("Incorrect email or password");

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = await createSession(admin._id);
  return { token, admin: { id: admin._id.toString(), name: admin.name, email: admin.email } };
}

export async function changePassword(
  adminId: string,
  currentSessionId: string,
  currentPassword: string,
  newPassword: string,
) {
  const admin = await Admin.findById(adminId).select("+passwordHash");
  if (!admin) throw unauthorized();
  if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    throw new AppError(400, "VALIDATION_ERROR", "Current password is incorrect", {
      fieldErrors: { currentPassword: "Current password is incorrect" },
    });
  }
  admin.passwordHash = await hashPassword(newPassword);
  await admin.save();
  // A password change signs out every other device.
  await Session.deleteMany({ admin: admin._id, _id: { $ne: currentSessionId } });
}
