// k6 common options and helpers
export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(90)<1000', 'p(95)<1500'],
    http_req_failed: ['rate<0.01']
  }
};

export const BASE = __ENV.BASE || 'http://localhost:3000/api/v1';
export const TOKEN = __ENV.TOKEN || '';

export function authHeaders() {
  return { headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } };
}
