const request = require('supertest');
const app = require('../src/server');
const { users, refreshTokens } = require('../src/models/store');

// Clear state between tests
beforeEach(() => {
  users.clear();
  refreshTokens.clear();
});

// ─── Registration ─────────────────────────────────────────────────────────────
describe('POST /auth/register', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'test@example.com',
      password: 'SecurePass123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.password).toBeUndefined();
  });

  it('should reject duplicate emails', async () => {
    await request(app).post('/auth/register').send({ email: 'dup@example.com', password: 'pass1234' });
    const res = await request(app).post('/auth/register').send({ email: 'dup@example.com', password: 'pass1234' });
    expect(res.status).toBe(409);
  });

  it('should reject short passwords', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'short@example.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('should reject invalid emails', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'not-an-email', password: 'pass1234' });
    expect(res.status).toBe(400);
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/auth/register').send({ email: 'login@example.com', password: 'password123' });
  });

  it('should return access and refresh tokens on valid credentials', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'login@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('should reject wrong password', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'login@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials.');
  });

  it('should reject non-existent user', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'ghost@example.com', password: 'pass1234' });
    expect(res.status).toBe(401);
  });
});

// ─── Token Refresh ────────────────────────────────────────────────────────────
describe('POST /auth/refresh', () => {
  let refreshToken;

  beforeEach(async () => {
    await request(app).post('/auth/register').send({ email: 'refresh@example.com', password: 'password123' });
    const loginRes = await request(app).post('/auth/login').send({ email: 'refresh@example.com', password: 'password123' });
    refreshToken = loginRes.body.refreshToken;
  });

  it('should issue a new access token with valid refresh token', async () => {
    const res = await request(app).post('/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('should reject an invalid refresh token', async () => {
    const res = await request(app).post('/auth/refresh').send({ refreshToken: 'bad.token.here' });
    expect(res.status).toBe(401);
  });
});

// ─── Protected Routes (RBAC) ──────────────────────────────────────────────────
describe('RBAC protected endpoints', () => {
  let adminToken, userToken;

  beforeEach(async () => {
    // Register and log in as admin
    await request(app).post('/auth/register').send({ email: 'admin@example.com', password: 'adminpass', role: 'admin' });
    const adminLogin = await request(app).post('/auth/login').send({ email: 'admin@example.com', password: 'adminpass' });
    adminToken = adminLogin.body.accessToken;

    // Register and log in as regular user
    await request(app).post('/auth/register').send({ email: 'user@example.com', password: 'userpass' });
    const userLogin = await request(app).post('/auth/login').send({ email: 'user@example.com', password: 'userpass' });
    userToken = userLogin.body.accessToken;
  });

  it('should allow admin to get all users', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('should allow user to get all users (users:read permission)', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });

  it('should deny user from accessing settings (admin only)', async () => {
    const res = await request(app).get('/api/settings').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('should allow admin to access settings', async () => {
    const res = await request(app).get('/api/settings').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('should reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('should reject requests with invalid token', async () => {
    const res = await request(app).get('/api/users').set('Authorization', 'Bearer invalid.token');
    expect(res.status).toBe(401);
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
describe('POST /auth/logout', () => {
  it('should revoke the refresh token', async () => {
    await request(app).post('/auth/register').send({ email: 'logout@example.com', password: 'password123' });
    const loginRes = await request(app).post('/auth/login').send({ email: 'logout@example.com', password: 'password123' });
    const { refreshToken } = loginRes.body;

    await request(app).post('/auth/logout').send({ refreshToken });

    // Token should now be invalid
    const res = await request(app).post('/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });
});
