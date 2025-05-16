import { createMocks } from 'node-mocks-http';
import handler from '../app/api/onboarding';

describe('/api/onboarding', () => {
  it('rejects non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('returns 400 if threadId is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().message).toBe('Missing threadId');
  });

  it('updates profile with name', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { threadId: 'test123', name: 'Alex' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().message).toBe('Profile updated');
  });

  it('updates profile with tone + concerns', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { threadId: 'test456', emotionalTone: ['calm'], concerns: ['sleep'] },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().message).toBe('Profile updated');
  });

  it('marks onboarding complete', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { threadId: 'test789', completeOnboarding: true },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().message).toBe('Profile updated');
  });
});
