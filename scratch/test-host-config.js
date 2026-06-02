const dns = require('dns');
const { Client } = require('pg');

const HOST = 'ep-bitter-rice-aqwg7o16-pooler.c-8.us-east-1.aws.neon.tech';

async function run() {
  console.log(`Performing DNS lookup on ${HOST}...`);
  dns.lookup(HOST, { all: true }, async (err, addresses) => {
    if (err) {
      console.error('DNS Lookup failed:', err.message);
      return;
    }
    console.log('Resolved addresses:', addresses);
    
    // Pick the first address and try to connect
    const firstIP = addresses[0].address;
    const isIPv6 = addresses[0].family === 6;
    console.log(`Connecting to resolved IP: ${firstIP} (IPv${addresses[0].family})...`);
    
    const client = new Client({
      user: 'neondb_owner',
      password: 'npg_C4YNkf8pDJqH',
      host: firstIP,
      database: 'neondb',
      port: 5432,
      connectionTimeoutMillis: 10000,
      options: 'project=ep-bitter-rice-aqwg7o16',
      ssl: {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
      }
    });

    try {
      await client.connect();
      console.log('Connected successfully!');
      const res = await client.query('SELECT 1 as result');
      console.log('Query result:', res.rows[0]);
    } catch (err) {
      console.error('Connection failed with error:', err.message);
    } finally {
      await client.end().catch(() => {});
    }
  });
}

run();
