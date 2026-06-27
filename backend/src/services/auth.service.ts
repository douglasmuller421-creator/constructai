import bcrypt from "bcryptjs";
import type { Role } from "../utils/auth.types.js";
import prisma from "../config/database.js";
import { signToken } from "../utils/jwt.js";
import { ConflictError, UnauthorizedError, NotFoundError } from "../utils/errors.js";

const SALT_ROUNDS = 12;

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: Role;
  companyId?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    companyId: string | null;
  };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ConflictError("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      name: input.name,
      role: input.role ?? "MANAGER",
      companyId: input.companyId ?? null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      companyId: true,
    },
  });

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  });

  return { token, user };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.active) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await bcrypt.compare(input.password, user.password);

  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    },
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      companyId: true,
      createdAt: true,
      company: {
        select: { id: true, name: true },
      },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
}