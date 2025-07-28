const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Database path
const dbPath = path.join(dbDir, 'social_network.db');

// Create database connection
const db = new sqlite3.Database(dbPath);

// Read schema file
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('Setting up database...');

// Execute schema
db.exec(schema, (err) => {
    if (err) {
        console.error('Error creating database schema:', err);
        process.exit(1);
    }
    
    console.log('Database schema created successfully!');
    console.log('Database file:', dbPath);
    
    // Close database connection
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database setup completed!');
        }
    });
}); 