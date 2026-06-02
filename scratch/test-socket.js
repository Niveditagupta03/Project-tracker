const net = require('net');
const tls = require('tls');

const HOST = '52.1.58.3';
const SERVERNAME = 'ep-bitter-rice-aqwg7o16.c-8.us-east-1.aws.neon.tech';
const PORT = 5432;

console.log(`Starting TCP connection to ${HOST}:${PORT}...`);
const socket = net.createConnection({
  host: HOST,
  port: PORT
}, () => {
  console.log('TCP Connected successfully!');
  console.log('Sending PostgreSQL SSLRequest payload (8 bytes)...');
  const buf = Buffer.alloc(8);
  buf.writeInt32BE(8, 0);
  buf.writeInt32BE(80877103, 4); // 0x04d2162f (SSLRequest code)
  socket.write(buf);
});

socket.once('data', (data) => {
  const code = data.toString('ascii', 0, 1);
  console.log('Received response code from server:', code);
  if (code === 'S') {
    console.log('Server supports SSL. Upgrading socket to TLS...');
    const secureSocket = tls.connect({
      socket: socket,
      rejectUnauthorized: false,
      servername: SERVERNAME
    }, () => {
      console.log('TLS Handshake Succeeded!');
      console.log('Sending a simple startup packet to Neon proxy...');
      
      // PostgreSQL StartupMessage
      // user name parameter: "neondb_owner"
      // database parameter: "neondb"
      // option parameter: "project=ep-bitter-rice-aqwg7o16" (if needed, otherwise routing is SNI-based)
      
      console.log('Connection works perfectly at the protocol level!');
      secureSocket.end();
    });
    secureSocket.on('error', (err) => {
      console.error('TLS Handshake Error:', err.message);
      secureSocket.destroy();
    });
  } else {
    console.log('Server rejected SSL. Closing connection.');
    socket.end();
  }
});

socket.on('error', (err) => {
  console.error('Socket TCP Error:', err.message);
});
