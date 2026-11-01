import { Schema, model } from "mongoose";

const sessionSchema = new Schema(
  {
    // SHA-256 of the cookie value: a database leak does not expose usable sessions.
    tokenHash: { type: String, required: true, unique: true },
    admin: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = model("Session", sessionSchema);
