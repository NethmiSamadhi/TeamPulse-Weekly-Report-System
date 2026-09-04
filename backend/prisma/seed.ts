import {
  PrismaClient,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedReports } from "./seed-reports.js";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "TeamPulse@123";

async function main() {
  console.log("Starting TeamPulse database seed...");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const userData = [
    {
      fullName: "System Administrator",
      email: "admin@teampulse.dev",
      role: UserRole.ADMIN,
    },
    {
      fullName: "Maya Fernando",
      email: "manager@teampulse.dev",
      role: UserRole.MANAGER,
    },
    {
      fullName: "Nethmi Samadhi",
      email: "nethmi@teampulse.dev",
      role: UserRole.TEAM_MEMBER,
    },
    {
      fullName: "Kasun Perera",
      email: "kasun@teampulse.dev",
      role: UserRole.TEAM_MEMBER,
    },
    {
      fullName: "Dinithi Silva",
      email: "dinithi@teampulse.dev",
      role: UserRole.TEAM_MEMBER,
    },
    {
      fullName: "Ahamed Rizwan",
      email: "ahamed@teampulse.dev",
      role: UserRole.TEAM_MEMBER,
    },
  ];

  const users = [];

  for (const data of userData) {
    const user = await prisma.user.upsert({
      where: {
        email: data.email,
      },
      update: {
        fullName: data.fullName,
        passwordHash,
        role: data.role,
        isActive: true,
      },
      create: {
        ...data,
        passwordHash,
        isActive: true,
      },
    });

    users.push(user);
  }

  const projectData = [
    {
      name: "Client Portal",
      description:
        "Customer-facing portal development and integration work.",
      color: "#6366F1",
    },
    {
      name: "Internal Tooling",
      description:
        "Internal productivity tools, automation and administration systems.",
      color: "#0EA5E9",
    },
    {
      name: "Research and Development",
      description:
        "Experiments, proof-of-concepts and emerging technology research.",
      color: "#8B5CF6",
    },
    {
      name: "Quality Engineering",
      description:
        "Testing, quality assurance and release-readiness activities.",
      color: "#10B981",
    },
  ];

  const projects = [];

  for (const data of projectData) {
    const project = await prisma.project.upsert({
      where: {
        name: data.name,
      },
      update: {
        description: data.description,
        color: data.color,
        isActive: true,
      },
      create: {
        ...data,
        isActive: true,
      },
    });

    projects.push(project);
  }

  const teamMembers = users.filter(
    (user) => user.role === UserRole.TEAM_MEMBER,
  );

  const memberships = [
    {
      userId: teamMembers[0].id,
      projectId: projects[0].id,
    },
    {
      userId: teamMembers[0].id,
      projectId: projects[2].id,
    },
    {
      userId: teamMembers[1].id,
      projectId: projects[0].id,
    },
    {
      userId: teamMembers[1].id,
      projectId: projects[1].id,
    },
    {
      userId: teamMembers[2].id,
      projectId: projects[3].id,
    },
    {
      userId: teamMembers[3].id,
      projectId: projects[1].id,
    },
    {
      userId: teamMembers[3].id,
      projectId: projects[2].id,
    },
  ];

  for (const membership of memberships) {
    await prisma.projectMember.upsert({
      where: {
        userId_projectId: {
          userId: membership.userId,
          projectId: membership.projectId,
        },
      },
      update: {},
      create: membership,
    });
  }
  await seedReports(prisma);
  console.log("Seed completed successfully.");
  console.log("");
  console.log("Demo accounts:");
  console.log("Admin:       admin@teampulse.dev");
  console.log("Manager:     manager@teampulse.dev");
  console.log("Team member: nethmi@teampulse.dev");
  console.log(`Password:    ${DEMO_PASSWORD}`);
  console.log("");
  console.log(`Users created: ${users.length}`);
  console.log(`Projects created: ${projects.length}`);
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });