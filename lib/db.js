import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sports_inventory',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let isInitialized = false;

// Initialize database tables
const initDb = async () => {
  if (isInitialized) return;
  
  try {
    const connection = await pool.getConnection();
    
    // Create inventory table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sku_id VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        sub_category VARCHAR(255) NOT NULL,
        image_path VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(255) NOT NULL,
        sub_category VARCHAR(255)
      )
    `);

    connection.release();
    isInitialized = true;
    console.log('Database tables verified/created successfully.');
  } catch (error) {
    console.error('Database initialization failed. MariaDB might still be starting up:', error);
    throw error;
  }
};

export const query = async (sql, params) => {
  if (!isInitialized) {
    await initDb(); // Lazy load the tables on the first query
  }
  const [results] = await pool.execute(sql, params);
  return results;
};

export default pool;
