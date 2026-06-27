import http from 'http';

http.get('http://localhost:3000/dashboard', (res) => {
  console.log('Dashboard status:', res.statusCode);
}).on('error', (e) => console.log('Error:', e.message));

setTimeout(() => process.exit(0), 3000);
