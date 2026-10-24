-- CreateTable
CREATE TABLE "Country" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "iso3166-1Alpha-2" TEXT,
    "icon" TEXT
);

-- CreateTable
CREATE TABLE "Author" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "language" TEXT,
    "birthDate" DATETIME,
    "deathDate" DATETIME,
    "country" TEXT,
    "icon" TEXT,
    "icons" REAL,
    CONSTRAINT "Author_country_fkey" FOREIGN KEY ("country") REFERENCES "Country" ("uuid") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Publisher" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "icon" TEXT,
    CONSTRAINT "Publisher_country_fkey" FOREIGN KEY ("country") REFERENCES "Country" ("uuid") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Book" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "year" INTEGER,
    "author" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    CONSTRAINT "Book_author_fkey" FOREIGN KEY ("author") REFERENCES "Author" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Book_publisher_fkey" FOREIGN KEY ("publisher") REFERENCES "Publisher" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT,
    CONSTRAINT "User_country_fkey" FOREIGN KEY ("country") REFERENCES "Country" ("uuid") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LendingHistoryItem" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "user" TEXT NOT NULL,
    "book" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "note" TEXT,
    CONSTRAINT "LendingHistoryItem_user_fkey" FOREIGN KEY ("user") REFERENCES "User" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LendingHistoryItem_book_fkey" FOREIGN KEY ("book") REFERENCES "Book" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE
);
