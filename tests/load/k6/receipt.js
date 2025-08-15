import http from 'k6/http';
import { sleep, check } from 'k6';
import { BASE, TOKEN, authHeaders } from './util.js';

export { options } from './util.js';

export default function () {
  const url = `${BASE}/fees/receipts`;
  const payload = JSON.stringify({ student_id: 1, amount: 500, mode: 'ONLINE' });
  const res = http.post(url, payload, authHeaders());
  check(res, { 'status 200/201/400': (r) => [200,201,400].includes(r.status) });
  sleep(1);
}
