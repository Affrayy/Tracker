const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Setup SQLite database
const db = new sqlite3.Database('./locations.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    db.run(`CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to receive location data
app.post('/api/location', (req, res) => {
  const { latitude, longitude } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'Invalid latitude or longitude' });
  }
  const stmt = db.prepare('INSERT INTO locations (latitude, longitude) VALUES (?, ?)');
  stmt.run(latitude, longitude, function(err) {
    if (err) {
      console.error('Error inserting location', err.message);
      return res.status(500).json({ error: 'Failed to save location' });
    }
    res.json({ success: true, id: this.lastID });
  });
  stmt.finalize();
});

// API endpoint to get all stored locations
app.get('/api/locations', (req, res) => {
  db.all('SELECT * FROM locations ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching locations', err.message);
      return res.status(500).json({ error: 'Failed to fetch locations' });
    }
    res.json(rows);
  });
});

// Serve locations.html for /locations route
app.get('/locations', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'locations.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
