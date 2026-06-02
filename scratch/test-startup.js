const net = require('net');
const tls = require('tls');

const HOST = '52.1.58.3';
const PORT = 5432;
const USER = 'neondb_owner';
const DATABASE = 'neondb';
const ENDPOINT = 'ep-bitter-rice-aqwg7o16';

console.log(`Connecting to ${HOST}:${PORT}...`);
const socket = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log('TCP Connected! Sending SSLRequest...');
  const buf = Buffer.alloc(8);
  buf.writeInt32BE(8, 0);
  buf.writeInt32BE(80877103, 4); // 0x04d2162f
  socket.write(buf);
});

socket.once('data', (data) => {
  const code = data.toString('ascii', 0, 1);
  if (code !== 'S') {
    console.log('Server rejected SSL. Closing.');
    socket.end();
    return;
  }
  
  console.log('SSL supported. Upgrading to TLS...');
  const secureSocket = tls.connect({
    socket: socket,
    rejectUnauthorized: false,
    servername: `${ENDPOINT}.c-8.us-east-1.aws.neon.tech`
  }, () => {
    console.log('TLS Handshake Succeeded! Sending StartupMessage...');
    
    // Construct StartupMessage
    const parts = [
      Buffer.from(`user\0${USER}\0`, 'ascii'),
      Buffer.from(`database\0${DATABASE}\0`, 'ascii'),
      Buffer.from(`options\0project=${ENDPOINT}\0`, 'ascii'),
      Buffer.from('\0', 'ascii')
    ];
    const payload = Buffer.concat(parts);
    const startupMsg = Buffer.alloc(8 + payload.length);
    startupMsg.writeInt32BE(startupMsg.length, 0);
    startupMsg.writeInt32BE(196608, 4); // v3.0
    payload.copy(startupMsg, 8);
    
    secureSocket.write(startupMsg);
  });
  
  secureSocket.on('data', (res) => {
    const type = res.toString('ascii', 0, 1);
    console.log(`Received packet type from server: '${type}'`);
    
    // Print the raw string data to extract readable error text
    console.log('--- Raw Response Snippet ---');
    console.log(res.toString('ascii'));
    console.log('----------------------------');
    
    secureSocket.end();
  });
  
  secureSocket.on('error', (err) => {
    console.error('TLS socket error:', err.message);
  });
});

socket.on('error', (err) => {
  console.error('TCP socket error:', err.message);
});
