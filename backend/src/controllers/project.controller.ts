import {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  archiveProject,
  createProject,
  listProjects,
  ProjectError,
  updateProject,
} from "../services/project.service.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project.validator.js";

function handleProjectError(
  error: unknown,
  response: Response,
  next: NextFunction,
) {
  if (error instanceof ProjectError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  next(error);
}

export async function getProjects(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const projects = await listProjects();

    response.status(200).json({
      success: true,
      data: {
        projects,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addProject(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const validation = createProjectSchema.safeParse(
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
    const project = await createProject(
      validation.data,
    );

    response.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        project,
      },
    });
  } catch (error) {
    handleProjectError(error, response, next);
  }
}

export async function editProject(
  request: Request<{ projectId: string }>,
  response: Response,
  next: NextFunction,
) {
  const validation = updateProjectSchema.safeParse(
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
    const project = await updateProject(
      request.params.projectId,
      validation.data,
    );

    response.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: {
        project,
      },
    });
  } catch (error) {
    handleProjectError(error, response, next);
  }
}

export async function removeProject(
  request: Request<{ projectId: string }>,
  response: Response,
  next: NextFunction,
) {
  try {
    const project = await archiveProject(
      request.params.projectId,
    );

    response.status(200).json({
      success: true,
      message: "Project archived successfully",
      data: {
        project,
      },
    });
  } catch (error) {
    handleProjectError(error, response, next);
  }
}