import {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { env } from "../config/env.js";
import {
  AuthenticationError,
  loginUser,
  registerUser,
} from "../services/auth.service.js";
import {
  loginSchema,
  registerSchema,
} from "../validators/auth.validator.js";

const cookieSettings = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite:
    env.NODE_ENV === "production"
      ? ("none" as const)
      : ("lax" as const),
  maxAge: 24 * 60 * 60 * 1000,
};

function handleAuthenticationError(
  error: unknown,
  response: Response,
  next: NextFunction,
) {
  if (error instanceof AuthenticationError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  next(error);
}

export async function register(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const validation = registerSchema.safeParse(
    request.body,
  );

  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const result = await registerUser(
      validation.data,
    );

    response.cookie(
      "accessToken",
      result.token,
      cookieSettings,
    );

    response.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    handleAuthenticationError(
      error,
      response,
      next,
    );
  }
}

export async function login(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const validation = loginSchema.safeParse(
    request.body,
  );

  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const result = await loginUser(
      validation.data,
    );

    response.cookie(
      "accessToken",
      result.token,
      cookieSettings,
    );

    response.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    handleAuthenticationError(
      error,
      response,
      next,
    );
  }
}

export function logout(
  _request: Request,
  response: Response,
) {
  response.clearCookie("accessToken", {
    httpOnly: true,
    secure: cookieSettings.secure,
    sameSite: cookieSettings.sameSite,
  });

  response.status(200).json({
    success: true,
    message: "Logout successful",
  });
}

export function getCurrentUser(
  request: Request,
  response: Response,
) {
  response.status(200).json({
    success: true,
    data: {
      user: request.user,
    },
  });
}