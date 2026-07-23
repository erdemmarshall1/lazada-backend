const https = require('https');
const HOST = 'lazada-backend-production-3b57.up.railway.app';

const request = (method, path, body, token) => new Promise((resolve, reject) => {
  const data = body ? JSON.stringify(body) : '';
  const opts = {
    hostname: HOST, port: 443, path, method,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  };
  if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  const req = https.request(opts, (res) => {
    let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve({ code: -1, msg: d }); } });
  });
  req.on('error', reject);
  if (data) req.write(data);
  req.end();
});

async function main() {
  // 1. Login as existing admin to get token
  console.log('Logging in as admin...');
  const loginRes = await request('POST', '/main/sendMsg/login', { username: 'admin', password: 'admin123' });
  if (!loginRes?.data?.token) {
    console.error('Login failed:', loginRes?.msg || JSON.stringify(loginRes).slice(0,200));
    return;
  }
  const adminToken = loginRes.data.token;
  console.log('Admin token obtained');

  let userId = null;

  // 2. Try registering, or find existing user
  console.log('Checking if alextaylor11011@gmail.com exists...');
  const usersRes = await request('GET', '/home/admin/users?pageSize=100', null, adminToken);
  if (usersRes?.data?.list) {
    const existing = usersRes.data.list.find(u => u.email === 'alextaylor11011@gmail.com');
    if (existing) {
      console.log('User already exists, ID:', existing._id, 'current role:', existing.role);
      userId = existing._id;
    }
  }

  if (!userId) {
    console.log('Registering new user...');
    const registerRes = await request('POST', '/main/sendMsg/reg', {
      username: 'alextaylor11011',
      email: 'alextaylor11011@gmail.com',
      password: 'admin11011@}',
      phone: '',
    });
    if (!registerRes?.data?.token && !registerRes?.data?.user?._id) {
      console.error('Register failed:', registerRes?.msg || 'No data');
      return;
    }
    userId = registerRes.data?.user?._id || registerRes.data?._id;
    console.log('Registered, user ID:', userId);
  }

  // 3. Promote to admin
  console.log('Promoting to admin role...');
  const roleRes = await request('POST', '/home/admin/users/' + userId + '/set-role', { role: 'admin' }, adminToken);
  if (roleRes?.code === 0) {
    console.log('SUCCESS: alextaylor11011@gmail.com is now admin');
  } else {
    console.error('Role promotion failed:', roleRes?.msg);
  }
}

main().catch(console.error);
