import http from 'k6/http';
import { sleep, check } from 'k6';
import { BASE, TOKEN, authHeaders } from './util.js';

export { options } from './util.js';

export default function () {
  const url = `${BASE}/attendance/bulk`;
  const payload = JSON.stringify([{ student_id:1, date:'2024-06-25', status:'P' }]);
  const res = http.post(url, payload, authHeaders());
  check(res, { 'status 202/200/400': (r) => [202,200,400].includes(r.status) });
  sleep(1);
}
