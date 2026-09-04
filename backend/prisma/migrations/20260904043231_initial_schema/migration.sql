-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('TEAM_MEMBER', 'MANAGER', 'ADMIN') NOT NULL DEFAULT 'TEAM_MEMBER',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_role_idx`(`role`),
    INDEX `User_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(191) NULL DEFAULT '#6366F1',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Project_name_key`(`name`),
    INDEX `Project_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectMember` (
    `userId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectMember_projectId_idx`(`projectId`),
    PRIMARY KEY (`userId`, `projectId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WeeklyReport` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `weekStart` DATE NOT NULL,
    `weekEnd` DATE NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'NEEDS_CORRECTION', 'APPROVED') NOT NULL DEFAULT 'DRAFT',
    `currentVersionNumber` INTEGER NOT NULL DEFAULT 1,
    `latestReviewerComment` TEXT NULL,
    `submittedAt` DATETIME(3) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WeeklyReport_status_idx`(`status`),
    INDEX `WeeklyReport_weekStart_idx`(`weekStart`),
    INDEX `WeeklyReport_projectId_idx`(`projectId`),
    INDEX `WeeklyReport_userId_status_idx`(`userId`, `status`),
    UNIQUE INDEX `WeeklyReport_userId_weekStart_key`(`userId`, `weekStart`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportVersion` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `versionNumber` INTEGER NOT NULL,
    `optionalNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NULL,

    INDEX `ReportVersion_reportId_idx`(`reportId`),
    UNIQUE INDEX `ReportVersion_reportId_versionNumber_key`(`reportId`, `versionNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompletedTask` (
    `id` VARCHAR(191) NOT NULL,
    `reportVersionId` VARCHAR(191) NOT NULL,
    `taskName` VARCHAR(191) NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `plannedPercentage` DECIMAL(5, 2) NOT NULL,
    `actualPercentage` DECIMAL(5, 2) NOT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED') NOT NULL,
    `plannedMinutes` INTEGER NOT NULL,
    `spentMinutes` INTEGER NOT NULL,
    `deliverable` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `CompletedTask_reportVersionId_idx`(`reportVersionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NextWeekTask` (
    `id` VARCHAR(191) NOT NULL,
    `reportVersionId` VARCHAR(191) NOT NULL,
    `taskName` VARCHAR(191) NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `notes` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `NextWeekTask_reportVersionId_idx`(`reportVersionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Blocker` (
    `id` VARCHAR(191) NOT NULL,
    `reportVersionId` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `isKeyIssue` BOOLEAN NOT NULL DEFAULT false,
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `Blocker_reportVersionId_idx`(`reportVersionId`),
    INDEX `Blocker_isResolved_idx`(`isResolved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Achievement` (
    `id` VARCHAR(191) NOT NULL,
    `reportVersionId` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `isKeyAchievement` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `Achievement_reportVersionId_idx`(`reportVersionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimeEntry` (
    `id` VARCHAR(191) NOT NULL,
    `reportVersionId` VARCHAR(191) NOT NULL,
    `category` ENUM('DEVELOPMENT', 'TESTING', 'MEETINGS', 'DOCUMENTATION', 'RESEARCH', 'DESIGN', 'OTHER') NOT NULL,
    `minutes` INTEGER NOT NULL,

    UNIQUE INDEX `TimeEntry_reportVersionId_category_key`(`reportVersionId`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportReview` (
    `id` VARCHAR(191) NOT NULL,
    `reportVersionId` VARCHAR(191) NOT NULL,
    `managerId` VARCHAR(191) NOT NULL,
    `action` ENUM('REQUEST_CHANGES', 'APPROVED') NOT NULL,
    `comment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReportReview_reportVersionId_idx`(`reportVersionId`),
    INDEX `ReportReview_managerId_idx`(`managerId`),
    INDEX `ReportReview_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ActivityLog_actorId_idx`(`actorId`),
    INDEX `ActivityLog_createdAt_idx`(`createdAt`),
    INDEX `ActivityLog_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjectMember` ADD CONSTRAINT `ProjectMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectMember` ADD CONSTRAINT `ProjectMember_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeeklyReport` ADD CONSTRAINT `WeeklyReport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeeklyReport` ADD CONSTRAINT `WeeklyReport_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportVersion` ADD CONSTRAINT `ReportVersion_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `WeeklyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompletedTask` ADD CONSTRAINT `CompletedTask_reportVersionId_fkey` FOREIGN KEY (`reportVersionId`) REFERENCES `ReportVersion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NextWeekTask` ADD CONSTRAINT `NextWeekTask_reportVersionId_fkey` FOREIGN KEY (`reportVersionId`) REFERENCES `ReportVersion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Blocker` ADD CONSTRAINT `Blocker_reportVersionId_fkey` FOREIGN KEY (`reportVersionId`) REFERENCES `ReportVersion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Achievement` ADD CONSTRAINT `Achievement_reportVersionId_fkey` FOREIGN KEY (`reportVersionId`) REFERENCES `ReportVersion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeEntry` ADD CONSTRAINT `TimeEntry_reportVersionId_fkey` FOREIGN KEY (`reportVersionId`) REFERENCES `ReportVersion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportReview` ADD CONSTRAINT `ReportReview_reportVersionId_fkey` FOREIGN KEY (`reportVersionId`) REFERENCES `ReportVersion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportReview` ADD CONSTRAINT `ReportReview_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
