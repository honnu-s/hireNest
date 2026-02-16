// tests/unit/auth.test.js
const request = require('supertest');
const express = require('express');
const authRouter = require('../../src/routes/auth');
const prisma = require('../../src/db.cjs');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth - Critical Tests', () => {
  beforeEach(async () => {
    // Clean database
    await prisma.application.deleteMany();
    await prisma.jobAssignment.deleteMany();
    await prisma.job.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.recruiter.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('POST /signup - should create user', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@test.com',
        password: 'Pass123!',
        name: 'Test User',
        phone: '1234567890'
      })
      .expect(201);

    expect(response.body.token).toBeDefined();
    expect(response.body.role).toBe('CANDIDATE');
  });

  test('POST /signin - should login', async () => {
    // Create user
    await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'login@test.com',
        password: 'Pass123!',
        name: 'Test',
        phone: '1234567890'
      });

    // Login
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'login@test.com',
        password: 'Pass123!'
      })
      .expect(200);

    expect(response.body.token).toBeDefined();
  });
});
