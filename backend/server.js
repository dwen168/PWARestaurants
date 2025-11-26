// backend/server.js
import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, "..", "database");
const dbFile = path.join(dbDir, "restaurant.db");
const iconsDir = path.join(__dirname, "..", "frontend", "icons");

// Ensure icons directory exists
await fs.promises.mkdir(iconsDir, { recursive: true });


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, iconsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'icon-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.png', '.jpg', '.jpeg', '.gif', '.svg','.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedTypes.includes(ext)) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});



const app = express();
app.use(cors());
app.use(express.json()); // For parsing application/json

const dbPromise = open({
  filename: dbFile,
  driver: sqlite3.Database,
});

// List all restaurants (id and name)
app.get("/api/restaurants", async (req, res) => {
  try {
    const db = await dbPromise;
    const restaurants = await db.all(`SELECT restaurant_id, restaurant_name FROM restaurant`);
    res.json(restaurants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// Top rated restaurants (top N, default 3)
app.get('/api/restaurants/top', async (req, res) => {
  try {
    const db = await dbPromise;
    const limit = Number(req.query.limit) || 3;
    const rows = await db.all(
      `SELECT r.restaurant_id, r.restaurant_name, r.restaurant_description, r.restaurant_icon,
              AVG(rr.rating) AS avg_rating, COUNT(rr.rating) AS cnt
       FROM restaurant r
       JOIN restaurant_rating rr ON r.restaurant_id = rr.restaurant_id
       GROUP BY r.restaurant_id
       HAVING cnt > 0
       ORDER BY avg_rating DESC, cnt DESC
       LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch top restaurants' });
  }
});

// Get restaurant details and ratings by id
app.get("/api/restaurant/:id", async (req, res) => {
  try {
    const db = await dbPromise;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid restaurant id" });

    const restaurant = await db.get(`SELECT restaurant_id, restaurant_name, restaurant_description FROM restaurant WHERE restaurant_id = ?`, [id]);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    const ratings = await db.all(`SELECT rating_date, rating, comment FROM restaurant_rating WHERE restaurant_id = ? ORDER BY rating_date DESC`, [id]);

    res.json({ restaurant, ratings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch restaurant details" });
  }
});

// Add a rating for a restaurant (by name, create if not exists)
app.post('/api/restaurant/rating', upload.single('icon'), async (req, res) => {
  try {
    const db = await dbPromise;
    let { restaurant_name, rating, comment, restaurant_description } = req.body || {};
    if (!restaurant_name || typeof restaurant_name !== 'string' || restaurant_name.trim().length === 0) {
      return res.status(400).json({ error: 'Missing or invalid restaurant_name' });
    }
    restaurant_name = restaurant_name.trim();
    const numeric = Number(rating);
    if (Number.isNaN(numeric) || numeric < 0 || numeric > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 0 and 5' });
    }

    // Find or create restaurant
    let restaurant = await db.get(`SELECT restaurant_id FROM restaurant WHERE restaurant_name = ?`, [restaurant_name]);
    let restaurant_id;
    if (!restaurant) {
      // allow optional description when creating
      const desc = restaurant_description && typeof restaurant_description === 'string' && restaurant_description.trim().length > 0
        ? restaurant_description.trim()
        : 'There is no description for this restaurant.';
      const iconPath = req.file ? req.file.filename : null;
      const result = await db.run(`INSERT INTO restaurant (restaurant_name, restaurant_description, restaurant_icon) VALUES (?, ?, ?)`, [restaurant_name, desc, iconPath]);
      restaurant_id = result.lastID;
    } else {
      restaurant_id = restaurant.restaurant_id;
    }

    // Format timestamp as DD/MM/YYYY HH:MM:SS
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const rating_date = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    await db.run(`INSERT INTO restaurant_rating (restaurant_id, rating_date, rating, comment) VALUES (?, ?, ?, ?)`, [restaurant_id, rating_date, numeric, comment || null]);

    res.status(201).json({ success: true, restaurant_id, rating_date });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add rating' });
  }
});


// Serve frontend for convenience
app.use(express.static(path.join(__dirname, "../frontend")));

app.listen(3000, () =>
  console.log("🚀 Server running at http://localhost:3000")
);