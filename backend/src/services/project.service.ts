import { prisma } from "../lib/prisma.js";
import {
  type CreateProjectInput,
  type UpdateProjectInput,
} from "../validators/project.validator.js";

export class ProjectError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ProjectError";
  }
}

const projectSelection = {
  id: true,
  name: true,
  description: true,
  color: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      members: true,
      reports: true,
    },
  },
} as const;

export async function listProjects() {
  return prisma.project.findMany({
    where: {
      isActive: true,
    },
    select: projectSelection,
    orderBy: {
      name: "asc",
    },
  });
}

export async function createProject(
  input: CreateProjectInput,
) {
  const existingProject =
    await prisma.project.findUnique({
      where: {
        name: input.name,
      },
    });

  if (existingProject) {
    throw new ProjectError(
      "A project with this name already exists",
      409,
    );
  }

  return prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      color: input.color ?? "#6366F1",
    },
    select: projectSelection,
  });
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project || !project.isActive) {
    throw new ProjectError(
      "Project not found",
      404,
    );
  }

  if (input.name && input.name !== project.name) {
    const duplicate = await prisma.project.findUnique({
      where: {
        name: input.name,
      },
    });

    if (duplicate) {
      throw new ProjectError(
        "A project with this name already exists",
        409,
      );
    }
  }

  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: input,
    select: projectSelection,
  });
}

export async function archiveProject(
  projectId: string,
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project || !project.isActive) {
    throw new ProjectError(
      "Project not found",
      404,
    );
  }

  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      isActive: false,
    },
    select: projectSelection,
  });
}