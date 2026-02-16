// tests/unit/recruiter.test.js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const recruiterRouter = require('../../src/routes/recruiter');
const prisma = require('../../src/db.cjs');

// Mock audit queue
jest.mock('../../src/queue/auditQueue', () => ({
  addAuditLog: jest.fn(async () => ({ id: 'mock-job' })),
}));

const app = express();
app.use(express.json());
app.use('/api/recruiter', recruiterRouter);

const createRecruiter = async () => {
  const user = await prisma.user.create({
    data: {
      email: 'recruiter@test.com',
      password: await bcrypt.hash('Pass123!', 12),
      role: 'RECRUITER'
    }
  });
  const recruiter = await prisma.recruiter.create({
    data: {
      userId: user.id,
      name: 'Recruiter',
      department: 'HR',
      status: 'ACTIVE'
    }
  });
  return { user, recruiter };
};

const getToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};

describe('Recruiter - Critical Tests', () => {
  let token, recruiter, job, candidate, application;

  beforeEach(async () => {
    await prisma.application.deleteMany();
    await prisma.jobAssignment.deleteMany();
    await prisma.job.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.recruiter.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.user.deleteMany();
    
    const result = await createRecruiter();
    recruiter = result.recruiter;
    token = getToken(result.user.id, 'RECRUITER');

    // Create candidate
    const candidateUser = await prisma.user.create({
      data: {
        email: 'candidate@test.com',
        password: await bcrypt.hash('Pass123!', 12),
        role: 'CANDIDATE'
      }
    });
    candidate = await prisma.candidate.create({
      data: {
        userId: candidateUser.id,
        name: 'Candidate',
        phone: '1234567890'
      }
    });

    // Create job
    job = await prisma.job.create({
      data: {
        title: 'Engineer',
        department: 'Tech',
        location: 'Remote',
        type: 'FULL_TIME',
        status: 'OPEN'
      }
    });

    // Assign job
    await prisma.jobAssignment.create({
      data: {
        jobId: job.id,
        recruiterId: recruiter.id
      }
    });

    // Create application
    application = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: job.id,
        status: 'APPLIED'
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('PUT /applications/:id/status - should update status', async () => {
    const response = await request(app)
      .put(`/api/recruiter/applications/${application.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'INTERVIEW' })
      .expect(200);

    expect(response.body.status).toBe('interview');
  });
});
