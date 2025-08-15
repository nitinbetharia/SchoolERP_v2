import http from 'k6/http';
import { sleep, check } from 'k6';
import { BASE, TOKEN, authHeaders } from './util.js';

export { options } from './util.js';

export default function () {
  const url = `${BASE}/reports?type=fees`;
  const res = http.get(url, authHeaders());
  check(res, { 'status 200/400/404': (r) => [200,400,404].includes(r.status) });
  sleep(1);
}
