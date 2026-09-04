import {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  getManagerDashboard,
} from "../services/dashboard.service.js";
import {
  dashboardQuerySchema,
} from "../validators/dashboard.validator.js";

export async function getDashboard(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const validation =
    dashboardQuerySchema.safeParse(
      request.query,
    );

  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: "Invalid dashboard filters",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const dashboard =
      await getManagerDashboard(
        validation.data,
      );

    response.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
}