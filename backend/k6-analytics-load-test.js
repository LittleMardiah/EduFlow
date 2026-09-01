import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3001/api/v1';

// Dummy credentials for load testing
const USER_EMAIL = 'load@test.com';
const USER_PASSWORD = 'Load123!';

export default function () {
  // Login
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
  });

  const token = loginRes.json('data.accessToken');
  if (!token) return;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Get notifications (unread)
  const notifRes = http.get(`${BASE_URL}/notifications?unread=true`, { headers });
  check(notifRes, {
    'notifications status 200': (r) => r.status === 200,
  });

  // Get analytics (student)
  const analyticsRes = http.get(`${BASE_URL}/analytics/student`, { headers });
  check(analyticsRes, {
    'analytics status 200': (r) => r.status === 200,
  });

  sleep(1);
}
