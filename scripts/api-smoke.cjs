const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3000/api';
const DEFAULT_MINI_OPEN_ID = 'dev-openid-yoga';

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

async function requestAllowBusinessError(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  return {
    ok: response.ok && Boolean(payload?.success),
    status: response.status,
    payload,
  };
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
    const latestBookings = await request('/bookings/my?page=1&pageSize=100', { token });
    const bookedSessionIds = new Set((latestBookings.data || []).map((booking) => booking.sessionId));
    const bookingTarget = (sessions.data || []).find((session) => {
      const availableSeats = session.capacity - (session.bookedCount || 0);
      return availableSeats > 0 && !bookedSessionIds.has(session.id);
    });

    assert(bookingTarget?.id, 'No available unbooked upcoming session for booking mutation smoke');

    const createdBooking = await request('/bookings', {
      method: 'POST',
      token,
      body: JSON.stringify({
        memberId: profile.data.id,
        sessionId: bookingTarget.id,
        source: 'MINI_PROGRAM',
      }),
    });
    assert(createdBooking.data?.id, 'bookings create did not return booking id');

    const createdBookingDetail = await request(`/bookings/${createdBooking.data.id}`, { token });
    assert(createdBookingDetail.data?.id === createdBooking.data.id, 'created booking detail lookup failed');

    const refreshedBookings = await request('/bookings/my?page=1&pageSize=100', { token });
    assert(
      (refreshedBookings.data || []).some((booking) => booking.id === createdBooking.data.id),
      'created booking was not visible in bookings/my',
    );

    const cancelledBooking = await request(`/bookings/${createdBooking.data.id}/cancel`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ reason: 'API smoke cleanup' }),
    });
    assert(
      ['CANCELLED', 'NO_SHOW'].includes(cancelledBooking.data?.status),
      'bookings cancel did not return CANCELLED or NO_SHOW status',
    );

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

    const deletionStatus = await request('/support/account-deletion-request/status', { token });
    if (!['pending', 'processed'].includes(String(deletionStatus.data?.status || '').toLowerCase())) {
      const deletionRequest = await request('/support/account-deletion-request', {
        method: 'POST',
        token,
        body: JSON.stringify({ reason: `API smoke deletion request ${new Date().toISOString()}` }),
      });
      assert(deletionRequest.data.submitted === true, 'support/account-deletion-request did not return submitted=true');
    }

    const currentMembershipPlanId = memberships.data.memberships?.[0]?.planId;
    const renewalPlanId = plans.data.find((plan) => plan.id === currentMembershipPlanId)?.id || firstPlanId;
    assert(renewalPlanId, 'No active plan available for renewal smoke');

    const renewal = await requestAllowBusinessError('/membership-renewals', {
      method: 'POST',
      token,
      body: JSON.stringify({ planId: renewalPlanId }),
    });

    if (renewal.ok) {
      assert(renewal.payload.data.submitted === true, 'membership-renewals did not return submitted=true');
    } else {
      const renewalMessage = renewal.payload?.error?.message || '';
      const allowedBusinessErrors = [
        'Current membership has not expired; only same-plan renewal is supported',
        'An account deletion request is already pending',
      ];
      assert(
        allowedBusinessErrors.includes(renewalMessage),
        `/membership-renewals unexpected business error: ${renewalMessage || renewal.status}`,
      );
    }
  }

  console.log('API smoke passed');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
