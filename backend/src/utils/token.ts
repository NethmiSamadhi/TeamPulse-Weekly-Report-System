import jwt, {
  type SignOptions,
} from "jsonwebtoken";
import {
  UserRole,
} from "@prisma/client";
import { env } from "../config/env.js";

export type AuthTokenPayload = {
  userId: string;
  role: UserRole;
};

const tokenOptions: SignOptions = {
  expiresIn: "1d",
};

export function createAccessToken(
  payload: AuthTokenPayload,
): string {
  return jwt.sign(
    payload,
    env.JWT_SECRET,
    tokenOptions,
  );
}

export function verifyAccessToken(
  token: string,
): AuthTokenPayload {
  return jwt.verify(
    token,
    env.JWT_SECRET,
  ) as AuthTokenPayload;
}