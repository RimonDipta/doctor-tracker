import { Router, type RequestHandler } from "express";
import {
  cookieOptions,
  hashToken,
  requireAuth,
  SESSION_COOKIE,
  setSessionCookie,
} from "../../middleware/auth.js";
import { Admin } from "../../models/admin.model.js";
import { Session } from "../../models/session.model.js";
import { changePasswordBody, loginBody, updateProfileBody } from "./auth.schemas.js";
import { changePassword, login } from "./auth.service.js";

export function authRoutes(ipLimiter: RequestHandler, accountLimiter: RequestHandler) {
  const router = Router();

  router.post("/login", ipLimiter, accountLimiter, async (req, res) => {
    const { email, password } = loginBody.parse(req.body);
    const { token, admin } = await login(email, password);
    setSessionCookie(res, token);
    res.json({ data: admin });
  });

  router.post("/logout", async (req, res) => {
    const token: unknown = req.cookies?.[SESSION_COOKIE];
    if (typeof token === "string") await Session.deleteOne({ tokenHash: hashToken(token) });
    res.clearCookie(SESSION_COOKIE, cookieOptions());
    res.status(204).end();
  });

  router.get("/me", requireAuth, (req, res) => {
    res.json({ data: req.admin });
  });

  router.patch("/me", requireAuth, async (req, res) => {
    const body = updateProfileBody.parse(req.body);
    await Admin.updateOne({ _id: req.admin!.id }, body, { runValidators: true });
    res.json({ data: { ...req.admin, ...body } });
  });

  router.post("/change-password", ipLimiter, requireAuth, accountLimiter, async (req, res) => {
    const { currentPassword, newPassword } = changePasswordBody.parse(req.body);
    await changePassword(req.admin!.id, req.sessionId!, currentPassword, newPassword);
    res.status(204).end();
  });

  return router;
}
