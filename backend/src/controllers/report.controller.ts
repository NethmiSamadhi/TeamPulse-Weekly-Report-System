import {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  getReportById,
  listReports,
  ReportError,
} from "../services/report.service.js";
import {
  createReportDraft,
  reviewReport,
  submitReport,
  updateReportDraft,
} from "../services/report-workflow.service.js";
import {
  reportContentSchema,
  reportQuerySchema,
  reviewReportSchema,
} from "../validators/report.validator.js";

function handleReportError(
  error: unknown,
  response: Response,
  next: NextFunction,
) {
  if (error instanceof ReportError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  next(error);
}

function requireCurrentUser(
  request: Request,
  response: Response,
) {
  if (!request.user) {
    response.status(401).json({
      success: false,
      message: "Authentication is required",
    });

    return false;
  }

  return true;
}

export async function getReports(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const validation = reportQuerySchema.safeParse(
    request.query,
  );

  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: "Invalid report filters",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  if (!requireCurrentUser(request, response)) {
    return;
  }

  try {
    const result = await listReports(
      request.user!,
      validation.data,
    );

    response.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleReportError(error, response, next);
  }
}

export async function getReport(
  request: Request<{ reportId: string }>,
  response: Response,
  next: NextFunction,
) {
  if (!requireCurrentUser(request, response)) {
    return;
  }

  try {
    const report = await getReportById(
      request.params.reportId,
      request.user!,
    );

    response.status(200).json({
      success: true,
      data: {
        report,
      },
    });
  } catch (error) {
    handleReportError(error, response, next);
  }
}

export async function createDraft(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const validation = reportContentSchema.safeParse(
    request.body,
  );

  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: "Report validation failed",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  if (!requireCurrentUser(request, response)) {
    return;
  }

  try {
    const report = await createReportDraft(
      request.user!,
      validation.data,
    );

    response.status(201).json({
      success: true,
      message: "Report draft created successfully",
      data: {
        report,
      },
    });
  } catch (error) {
    handleReportError(error, response, next);
  }
}

export async function updateDraft(
  request: Request<{ reportId: string }>,
  response: Response,
  next: NextFunction,
) {
  const validation = reportContentSchema.safeParse(
    request.body,
  );

  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: "Report validation failed",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  if (!requireCurrentUser(request, response)) {
    return;
  }

  try {
    const report = await updateReportDraft(
      request.params.reportId,
      request.user!,
      validation.data,
    );

    response.status(200).json({
      success: true,
      message: "Report draft updated successfully",
      data: {
        report,
      },
    });
  } catch (error) {
    handleReportError(error, response, next);
  }
}

export async function submitDraft(
  request: Request<{ reportId: string }>,
  response: Response,
  next: NextFunction,
) {
  if (!requireCurrentUser(request, response)) {
    return;
  }

  try {
    const report = await submitReport(
      request.params.reportId,
      request.user!,
    );

    response.status(200).json({
      success: true,
      message: "Report submitted for review",
      data: {
        report,
      },
    });
  } catch (error) {
    handleReportError(error, response, next);
  }
}

export async function reviewSubmittedReport(
  request: Request<{ reportId: string }>,
  response: Response,
  next: NextFunction,
) {
  const validation = reviewReportSchema.safeParse(
    request.body,
  );

  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: "Review validation failed",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  if (!requireCurrentUser(request, response)) {
    return;
  }

  try {
    const report = await reviewReport(
      request.params.reportId,
      request.user!,
      validation.data,
    );

    response.status(200).json({
      success: true,
      message:
        validation.data.action === "APPROVED"
          ? "Report approved successfully"
          : "Report returned for correction",
      data: {
        report,
      },
    });
  } catch (error) {
    handleReportError(error, response, next);
  }
}