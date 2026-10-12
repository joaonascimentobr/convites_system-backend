-- Fresh MySQL baseline for the Convites application.
-- The previous local migrations targeted SQLite and were replaced because the
-- Dokploy production database is provisioned as a new MySQL instance.

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Theme` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `bgUrl` VARCHAR(191) NULL,
    `musicUrl` VARCHAR(191) NULL,
    `fontUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Theme_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `themeId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `age` INTEGER NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `zipCode` VARCHAR(191) NOT NULL DEFAULT '',
    `street` VARCHAR(191) NOT NULL DEFAULT '',
    `addressNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `neighborhood` VARCHAR(191) NOT NULL DEFAULT '',
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `stateCode` VARCHAR(191) NOT NULL DEFAULT '',
    `complement` VARCHAR(191) NOT NULL DEFAULT '',
    `referencePoint` VARCHAR(191) NOT NULL DEFAULT '',
    `inviteImageUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `giftIdeas` VARCHAR(191) NOT NULL DEFAULT '',
    `possibleGuests` VARCHAR(191) NOT NULL DEFAULT '[]',
    `slug` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `amountCents` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `transactionId` VARCHAR(191) NOT NULL,
    `amountCents` INTEGER NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_transactionId_key`(`transactionId`),
    UNIQUE INDEX `Payment_orderId_key`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_themeId_fkey` FOREIGN KEY (`themeId`) REFERENCES `Theme`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
