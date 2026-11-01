/**
 * Creates an administrator, or resets the password of an existing one.
 * Usage: npm run create-admin -- --name "Jo Rivera" --email jo@clinic.org --password "..."
 */
import { parseArgs } from "node:util";
import { connectDb, disconnectDb } from "../src/config/db.js";
import { Admin } from "../src/models/admin.model.js";
import { changePasswordBody, updateProfileBody } from "../src/modules/auth/auth.schemas.js";
import { hashPassword } from "../src/modules/auth/auth.service.js";

const { values } = parseArgs({
  options: {
    name: { type: "string" },
    email: { type: "string" },
    password: { type: "string" },
  },
});

const { name, email } = updateProfileBody.parse(values);
const { newPassword } = changePasswordBody.parse({
  currentPassword: "-",
  newPassword: values.password,
});

await connectDb();
await Admin.updateOne(
  { email },
  { name, email, passwordHash: await hashPassword(newPassword) },
  { upsert: true },
);
console.log(`Admin ready: ${email}`);
await disconnectDb();
