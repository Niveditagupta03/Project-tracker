-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "owner" TEXT,
    "status" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "uatDate" TIMESTAMP(3),
    "prodDate" TIMESTAMP(3),
    "dependencyWith" TEXT,
    "comments" TEXT,
    "progress" INTEGER DEFAULT 0,
    "priority" TEXT DEFAULT 'Medium',
    "health" TEXT DEFAULT 'On Track',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
