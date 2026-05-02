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

  const preferences = await request('/members/preferences', { token });
  assert(typeof preferences.data?.preferences?.courseReminder === 'boolean', 'members/preferences did not return courseReminder');
  assert(typeof preferences.data?.preferences?.systemNotification === 'boolean', 'members/preferences did not return systemNotification');

  const sessions = await request('/course-sessions/upcoming?page=1&pageSize=5', { token });
  assert(Array.isArray(sessions.data), 'course-sessions/upcoming did not return array data');
  assert(sessions.meta?.pageSize, 'course-sessions/upcoming did not return pagination meta');

  const firstSessionId = sessions.data[0]?.id;
  assert(firstSessionId, 'No upcoming session available for detail smoke');

  const sessionDetail = await request(`/course-sessions/${firstSessionId}`, { token });
  assert(sessionDetail.data?.id === firstSessionId, 'course-sessions/:id did not return requested session');

  const seats = await request(`/course-sessions/${firstSessionId}/available-seats`, { token });
  assert(Number.isFinite(seats.data?.availableSeats), 'course-sessions/:id/available-seats did not return availableSeats');

  const courses = await request('/courses?page=1&pageSize=5', { token });
  assert(Array.isArray(courses.data), 'courses did not return array data');
  const firstCourseId = courses.data[0]?.id;
  assert(firstCourseId, 'No course available for detail smoke');

  const course = await request(`/courses/${firstCourseId}`, { token });
  assert(course.data?.id === firstCourseId, 'courses/:id did not return requested course');

  const courseSessions = await request(`/courses/${firstCourseId}/sessions?upcoming=true`, { token });
  assert(Array.isArray(courseSessions.data) || Array.isArray(courseSessions.data?.sessions), 'courses/:id/sessions did not return sessions');

  const coaches = await request('/coaches/active?page=1&pageSize=5', { token });
  assert(Array.isArray(coaches.data), 'coaches/active did not return array data');
  const firstCoachId = coaches.data[0]?.id;
  assert(firstCoachId, 'No coach available for detail smoke');

  const coach = await request(`/coaches/${firstCoachId}`, { token });
  assert(coach.data?.id === firstCoachId, 'coaches/:id did not return requested coach');

  const coachSchedule = await request(`/coaches/${firstCoachId}/schedule`, { token });
  assert(
    Array.isArray(coachSchedule.data) || Array.isArray(coachSchedule.data?.sessions),
    'coaches/:id/schedule did not return schedule data',
  );

  const bookings = await request('/bookings/my?page=1&pageSize=5', { token });
  assert(Array.isArray(bookings.data), 'bookings/my did not return array data');

  const firstBookingId = bookings.data[0]?.id;
  if (firstBookingId) {
    const booking = await request(`/bookings/${firstBookingId}`, { token });
    assert(booking.data?.id === firstBookingId, 'bookings/:id did not return requested booking');
  }

  const transactions = await request('/transactions/my?page=1&pageSize=5', { token });
  assert(Array.isArray(transactions.data), 'transactions/my did not return array data');

  const transactionSummary = await request('/transactions/my-summary', { token });
  assert(Number.isFinite(transactionSummary.data?.transactionCount), 'transactions/my-summary did not return transactionCount');

  const firstTransactionId = transactions.data[0]?.id;
  if (firstTransactionId) {
    const transaction = await request(`/transactions/${firstTransactionId}`, { token });
    assert(transaction.data?.id === firstTransactionId, 'transactions/:id did not return requested transaction');
  }

  const notifications = await request('/notifications/my?page=1&pageSize=5', { token });
  assert(Array.isArray(notifications.data), 'notifications/my did not return array data');

  const plans = await request('/membership-plans/active', { token });
  assert(Array.isArray(plans.data), 'membership-plans/active did not return array data');

  const firstPlanId = plans.data[0]?.id;
  assert(firstPlanId, 'No active plan available for detail smoke');

  const plan = await request(`/membership-plans/${firstPlanId}`, { token });
  assert(plan.data?.id === firstPlanId, 'membership-plans/:id did not return requested plan');

  if (runMutations) {
    const nextCourseReminder = !preferences.data.preferences.courseReminder;
    const nextSystemNotification = !preferences.data.preferences.systemNotification;

    const updatedPreferences = await request('/members/preferences', {
      method: 'PUT',
      token,
      body: JSON.stringify({
        courseReminder: nextCourseReminder,
        systemNotification: nextSystemNotification,
      }),
    });
    assert(updatedPreferences.data.preferences.courseReminder === nextCourseReminder, 'members/preferences did not update courseReminder');
    assert(updatedPreferences.data.preferences.systemNotification === nextSystemNotification, 'members/preferences did not update systemNotification');

    const feedback = await request('/support/feedback', {
      method: 'POST',
      token,
      body: JSON.stringify({ content: `API smoke feedback ${new Date().toISOString()}` }),
    });
    assert(feedback.data.submitted === true, 'support/feedback did not return submitted=true');

    const deletionRequest = await request('/support/account-deletion-request', {
      method: 'POST',
      token,
      body: JSON.stringify({ reason: `API smoke deletion request ${new Date().toISOString()}` }),
    });
    assert(deletionRequest.data.submitted === true, 'support/account-deletion-request did not return submitted=true');

    const planId = firstPlanId;
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
