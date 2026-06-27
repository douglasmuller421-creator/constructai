import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { ok, created } from "../utils/response.js";
import { asyncHandler } from "../middleware/index.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validations/auth.js";

export const register = [
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    created(res, result, "Registration successful");
  }),
];

export const login = [
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    ok(res, result, "Login successful");
  }),
];

export const getProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await authService.getProfile(req.user!.id);
    ok(res, user);
  }
);