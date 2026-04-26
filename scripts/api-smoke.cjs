const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3000/api';
const DEFAULT_MINI_OPEN_ID = 'dev-openid-pilates';

const apiBaseUrl = process.env.API_BASE_URL || DEFAULT_API_BASE_URL;
const miniOpenId = process.env.MINI_OPEN_ID || DEFAULT_MINI_OPEN_ID;
const runMutations = process.env.API_SMOKE_MUTATIONS === '1';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    const message = payload?.error?.message || response.statusText || `Request failed: ${path}`;
    throw new Error(`${path}: ${message}`);
  }

  return payload;
}

async function main() {
  console.log(`API smoke target: ${apiBaseUrl}`);
  console.log(`Mini OpenID: ${miniOpenId}`);

  const login = await request('/mini-auth/login', {
    method: 'POST',
    body: JSON.stringify({ openId: miniOpenId }),
  });

  const token = login.data.accessToken;
  assert(token, 'mini-auth/login did not return accessToken');

  const profile = await request('/members/profile', { token });
  assert(profile.data?.id, 'members/profile did not return member profile');

  const memberships = await request('/members/my-memberships', { token });
  assert(Array.isArray(memberships.data.memberships), 'members/my-memberships did not return memberships array');

  const sessions = await request('/course-sessions/upcoming?page=1&pageSize=5', { token });
  assert(Array.isArray(sessions.data), 'course-sessions/upcoming did not return array data');
  assert(sessions.meta?.pageSize, 'course-sessions/upcoming did not return pagination meta');

  const bookings = await request('/bookings/my?page=1&pageSize=5', { token });
  assert(Array.isArray(bookings.data), 'bookings/my did not return array data');

  const transactions = await request('/transactions/my?page=1&pageSize=5', { token });
  assert(Array.isArray(transactions.data), 'transactions/my did not return array data');

  const plans = await request('/membership-plans/active', { token });
  assert(Array.isArray(plans.data), 'membership-plans/active did not return array data');

  if (runMutations) {
    const feedback = await request('/support/feedback', {
      method: 'POST',
      token,
      body: JSON.stringify({ content: `API smoke feedback ${new Date().toISOString()}` }),
    });
    assert(feedback.data.submitted === true, 'support/feedback did not return submitted=true');

    const planId = plans.data[0]?.id;
    assert(planId, 'No active plan available for renewal smoke');

    const renewal = await request('/membership-renewals', {
      method: 'POST',
      token,
      body: JSON.stringify({ planId }),
    });
    assert(renewal.data.submitted === true, 'membership-renewals did not return submitted=true');
  }

  console.log('API smoke passed');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
