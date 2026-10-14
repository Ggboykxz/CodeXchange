-- CreateTable
CREATE TABLE "TagFollow" (
    "userId" INTEGER NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "tag"),
    CONSTRAINT "TagFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
