import http from 'http';

function check(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, length: body.length }));
    }).on('error', (e) => resolve({ status: 0, error: e.message }));
  });
}

async function main() {
  const login = await check('http://localhost:3000/login');
  console.log('/login:', login.status, 'bytes:', login.length);
  
  const dashboard = await check('http://localhost:3000/dashboard');
  console.log('/dashboard:', dashboard.status, 'bytes:', dashboard.length);
  
  process.exit(0);
}

main();
