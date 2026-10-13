-- Align the existing local database with the current Prisma schema.

-- AlterTable
ALTER TABLE `forum_comments` ADD COLUMN `attachments` TEXT NULL;

-- AlterTable
ALTER TABLE `forum_posts` ADD COLUMN `attachments` TEXT NULL;

-- AlterTable
ALTER TABLE `user_settings` ADD COLUMN `notifyAnnouncement` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyDeadline` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyOverdue` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyReminder` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `resetToken` VARCHAR(191) NULL,
    ADD COLUMN `resetTokenExpiry` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_resetToken_key` ON `users`(`resetToken`);
