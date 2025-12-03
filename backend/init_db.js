// backend/init_db.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbDir = path.join(__dirname, "..", "database");
const dbFile = path.join(dbDir, "restaurant.db");

(async () => {
  await fs.promises.mkdir(dbDir, { recursive: true });

  const db = await open({
    filename: dbFile,
    driver: sqlite3.Database,
  });

  // Create restaurant table
  await db.exec(`DROP TABLE IF EXISTS restaurant`);
  await db.exec(`
    CREATE TABLE restaurant (
      restaurant_id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_name TEXT,
      restaurant_description TEXT,
      restaurant_icon TEXT
    )
  `);

  // Create rating table
  await db.exec(`DROP TABLE IF EXISTS restaurant_rating`);   
  await db.exec(`
    CREATE TABLE restaurant_rating (
      restaurant_id INTEGER NOT NULL,
      rating_date TEXT NOT NULL,
      rating REAL NOT NULL,
      comment TEXT,
      PRIMARY KEY (restaurant_id, rating_date),
      FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `);


  const sampleData_restaurant = [
    // Restaurant A, B, C with descriptions
    ["Restaurant A", "A restaurant offers Korean BBQ"],
    ["Restaurant B", "A restaurant offers Australian BBQ"],
    ["Restaurant C", "A restaurant offers Japanese BBQ"],
  ];

  for (const item of sampleData_restaurant) {
    await db.run(
      `INSERT INTO restaurant (restaurant_name, restaurant_description) VALUES (?, ?)`,
      item
    );
  }


  const sampleData_rating = [
    // Restaurant A, B, C with ratings
    [1, "01/12/2025 00:00:01", 4.5, "Great food!"],
    [2, "01/12/2025 00:00:01", 4.5, "Great food!"],
    [3, "01/12/2025 00:00:01", 3, "Just Ok!"]
  ];

  for (const item of sampleData_rating) {
    await db.run(
      `INSERT INTO restaurant_rating (restaurant_id, rating_date, rating, comment) VALUES (?, ?, ?, ?)`,
      item
    );
  }


  console.log("✅ Database initialized with 3 restaurants and sample data");
  await db.close();
})();