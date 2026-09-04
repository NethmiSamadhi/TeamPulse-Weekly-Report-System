import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  type LoginInput,
  type RegisterInput,
} from "../validators/auth.validator.js";
import { createAccessToken } from "../utils/token.js";

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

const publicUserFields = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export async function registerUser(
  input: RegisterInput,
) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (existingUser) {
    throw new AuthenticationError(
      "An account with this email already exists",
      409,
    );
  }

  const passwordHash = await bcrypt.hash(
    input.password,
    12,
  );

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: UserRole.TEAM_MEMBER,
    },
    select: publicUserFields,
  });

  const token = createAccessToken({
    userId: user.id,
    role: user.role,
  });

  return {
    user,
    token,
  };
}

export async function loginUser(
  input: LoginInput,
) {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (!user || !user.isActive) {
    throw new AuthenticationError(
      "Invalid email or password",
      401,
    );
  }

  const passwordIsCorrect = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordIsCorrect) {
    throw new AuthenticationError(
      "Invalid email or password",
      401,
    );
  }

  const token = createAccessToken({
    userId: user.id,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
    token,
  };
}