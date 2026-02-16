// tests/unit/admin.test.js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const adminRouter = require('../../src/routes/admin');
const prisma = require('../../src/db.cjs');

// Mock audit queue
jest.mock('../../src/queue/auditQueue', () => ({
  addAuditLog: jest.fn(async () => ({ id: 'mock-job' })),
}));

const app = express();
app.use(express.json());
app.use('/api/admin', adminRouter);

// tests/unit/admin.test.js
const createAdmin = async () => {
  const timestamp = Date.now();
  const user = await prisma.user.create({
    data: {
      email: `admin-${timestamp}@test.com`,  // ← Unique email
      password: await bcrypt.hash('Admin123!', 12),
      role: 'ADMIN'
    }
  });
  await prisma.admin.create({
    data: { userId: user.id, name: `Admin-${timestamp}` }
  });
  return user;
};





const getToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};

describe('Admin - Critical Tests', () => {
  let token;

  beforeEach(async () => {
    await prisma.application.deleteMany();
    await prisma.jobAssignment.deleteMany();
    await prisma.job.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.recruiter.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.user.deleteMany();
    
    const admin = await createAdmin();
    token = getToken(admin.id, 'ADMIN');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('POST /recruiters - should create recruiter', async () => {
    const response = await request(app)
      .post('/api/admin/recruiters')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Recruiter',
email: `recruiter-${Date.now()}@test.com`,
        password: 'Pass123!',
        department: 'HR'
      })
      .expect(201);

    expect(response.body.name).toBe('Recruiter');
  });

  test('POST /jobs - should create job', async () => {
    const response = await request(app)
      .post('/api/admin/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Engineer',
        department: 'Tech',
        location: 'Remote',
        type: 'FULL_TIME'
      })
      .expect(201);

    expect(response.body.title).toBe('Engineer');
  });
});
