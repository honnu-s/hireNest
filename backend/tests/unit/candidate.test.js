// tests/unit/candidate.test.js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const candidateRouter = require('../../src/routes/candidate');
const prisma = require('../../src/db.cjs');

const app = express();
app.use(express.json());
app.use('/api/candidate', candidateRouter);

const cleanAll = async () => {
  await prisma.application.deleteMany();
  await prisma.jobAssignment.deleteMany();
  await prisma.job.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.recruiter.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
};

const createCandidate = async () => {
  const user = await prisma.user.create({
    data: {
      email: `candidate-${Date.now()}@test.com`,  // Unique email
      password: await bcrypt.hash('Pass123!', 12),
      role: 'CANDIDATE'
    }
  });
  const candidate = await prisma.candidate.create({
    data: {
      userId: user.id,
      name: 'Candidate',
      phone: '1234567890'
    }
  });
  return { user, candidate };
};

const createJob = async () => {
  return await prisma.job.create({
    data: {
      title: `Engineer-${Date.now()}`,  // Unique title
      department: 'Tech',
      location: 'Remote',
      type: 'FULL_TIME',
      status: 'OPEN'
    }
  });
};

const getToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};

describe('Candidate - Critical Tests', () => {
  let token, candidate, job;

  beforeEach(async () => {
    await cleanAll();  // Clean first
    
    const result = await createCandidate();
    candidate = result.candidate;
    token = getToken(result.user.id, 'CANDIDATE');
    job = await createJob();
    
    // Verify job exists
    const jobExists = await prisma.job.findUnique({ where: { id: job.id } });
    if (!jobExists) {
      throw new Error('Job creation failed in test setup');
    }
  });

  afterAll(async () => {
    await cleanAll();
    await prisma.$disconnect();
  });

  test('POST /applications - should apply to job', async () => {
    const response = await request(app)
      .post('/api/candidate/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobId: job.id })
      .expect(201);

    expect(response.body.status).toBe('applied');
  });

  test('POST /applications - should prevent duplicate', async () => {
    // First application
    await request(app)
      .post('/api/candidate/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobId: job.id })
      .expect(201);

    // Duplicate should fail
    const response = await request(app)
      .post('/api/candidate/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobId: job.id })
      .expect(409);
      
    expect(response.body.message).toContain('already applied');
  });
});