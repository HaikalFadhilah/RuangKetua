-- AlterTable
ALTER TABLE `shared_files` ADD COLUMN `courseId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user_settings` MODIFY `aiModel` VARCHAR(191) NOT NULL DEFAULT 'llama-3.3-70b-versatile';

-- CreateIndex
CREATE INDEX `shared_files_courseId_idx` ON `shared_files`(`courseId`);
