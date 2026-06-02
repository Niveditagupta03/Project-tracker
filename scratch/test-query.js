const { Client } = require('pg');

async function run() {
  console.log('--- Testing IP-based Connection with raw Config and SNI bypass ---');
  
  const client = new Client({
    user: 'neondb_owner',
    password: 'npg_C4YNkf8pDJqH',
    host: '52.1.58.3',
    database: 'neondb',
    port: 5432,
    connectionTimeoutMillis: 15000,
    options: 'project=ep-bitter-rice-aqwg7o16',
    ssl: {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined
    }
  });

  try {
    console.log('Connecting to IP 52.1.58.3 with custom TLS options...');
    await client.connect();
    console.log('Connected successfully!');
    
    console.log('Running query SELECT 1...');
    const res = await client.query('SELECT 1 as result');
    console.log('Query result:', res.rows[0]);
    
    console.log('Checking database contents: Fetching projects...');
    const dbRes = await client.query('SELECT COUNT(*) FROM "Project"');
    console.log('Total projects in DB:', dbRes.rows[0].count);
    
  } catch (err) {
    console.error('Connection failed with error:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
  } finally {
    await client.end().catch(() => {});
  }
}

run();
