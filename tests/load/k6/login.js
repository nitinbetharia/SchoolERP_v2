import http from 'k6/http';
import { sleep, check } from 'k6';
export const options = { vus: 10, duration: '15s' };

export default function () {
  const url = `${__ENV.BASE || 'http://localhost:3000/api/v1'}/auth/login`;
  const res = http.post(url, JSON.stringify({ email: 'admin@example.com', password: 'Secret!234' }), { headers: { 'Content-Type': 'application/json' } });
  check(res, { 'status 200/401': (r) => [200,401].includes(r.status) });
  sleep(1);
}
