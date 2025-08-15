import http from 'k6/http';
import { sleep, check } from 'k6';
import { BASE, TOKEN, authHeaders } from './util.js';

export { options } from './util.js';

export default function () {
  const url = `${BASE}/students/admissions`;
  const payload = JSON.stringify({ first_name:'John', last_name:'Doe', dob:'2015-06-01', class_id:1 });
  const res = http.post(url, payload, authHeaders());
  check(res, { 'status 200/201/400': (r) => [200,201,400].includes(r.status) });
  sleep(1);
}
