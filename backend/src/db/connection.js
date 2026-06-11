
const { Pool } = require('pg');
 
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
 
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
    process.exit(1);
  }
  release();
  console.log('✅ PostgreSQL conectado');
});
 
module.exports = pool;
 