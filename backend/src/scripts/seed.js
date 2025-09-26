import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { Department } from '../models/department.model.js';
import { User } from '../models/user.model.js';
import { Issue } from '../models/issue.model.js';
import { Staff } from '../models/staff.model.js';

async function upsertOne(model, where, data) {
  const doc = await model.findOneAndUpdate(
    where,
    { $set: data },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc.toObject();
}

async function seed() {
  await connectDB();

  // 1) Departments
  const departmentsData = [
    { name: 'Sanitation', type: 'SANITATION', email: 'sanitation@jh.gov.in', phone: '0651-123456', priorities: ['LOW','MEDIUM','HIGH'] },
    { name: 'Roads & PWD', type: 'ROADS', email: 'roads@jh.gov.in', phone: '0651-234567', priorities: ['LOW','MEDIUM','HIGH'] },
    { name: 'Water Supply', type: 'WATER', email: 'water@jh.gov.in', phone: '0651-345678', priorities: ['LOW','MEDIUM','HIGH'] },
  ];

  const departments = {};
  for (const d of departmentsData) {
    const saved = await upsertOne(Department, { name: d.name }, d);
    departments[d.type] = saved;
  }

  // 2) Users: one admin, one dept admin, one citizen
  const usersData = [
    {
      fullName: 'Mahesh kakad',
      email: 'admin@jh.gov.in',
      mobileNumber: '9999999999',
      aadharNumber: '111122223333',
      gender: 'male',
      avatar: '',
      role: 'CITIZEN',
      createdAt: new Date('2025-09-10T10:00:00.000Z'),
      updatedAt: new Date('2025-09-20T03:05:04.221Z'),
    },
    {
      fullName: 'Dept Admin - Roads',
      email: 'dept.roads@jh.gov.in',
      mobileNumber: '8888888888',
      aadharNumber: '444455556666',
      gender: 'male',
      avatar: '',
      role: 'DEPARTMENT_ADMIN',
      department: departments.ROADS?._id,
      createdAt: new Date('2025-09-12T09:30:00.000Z'),
      updatedAt: new Date('2025-09-20T03:05:04.221Z'),
    },
    {
      fullName: 'Vedant Patil',
      email: 'vedant@gmail.com',
      mobileNumber: '8329315599',
      aadharNumber: '778794567584',
      gender: 'male',
      avatar: '',
      role: 'CITIZEN',
      createdAt: new Date('2025-09-18T10:50:46.574Z'),
      updatedAt: new Date('2025-09-20T03:05:04.221Z'),
    },
    {
      fullName: 'Citizen User',
      email: 'citizen@example.com',
      mobileNumber: '7777777777',
      aadharNumber: '777788889999',
      gender: 'female',
      avatar: '',
      role: 'CITIZEN',
      createdAt: new Date('2025-09-15T08:20:10.000Z'),
      updatedAt: new Date('2025-09-20T03:05:04.221Z'),
    },
  ];

  const users = {};
  for (const u of usersData) {
    const saved = await upsertOne(User, { email: u.email }, u);
    users[u.email] = saved;
  }

  // 2b) Seed some staff for departments
  const staffSeed = [
    { name: 'Roads Staff 1', userRef: users['dept.roads@jh.gov.in']?._id, department: departments.ROADS?._id },
    { name: 'Roads Staff 2', userRef: users['dept.roads@jh.gov.in']?._id, department: departments.ROADS?._id },
    { name: 'Sanitation Staff 1', userRef: users['admin@jh.gov.in']?._id, department: departments.SANITATION?._id },
  ];
  for (const s of staffSeed) {
    if (s.userRef && s.department) {
      await upsertOne(Staff, { name: s.name, department: s.department }, s);
    }
  }

  // 3) Issues: minimal required fields
  const citizen = users['vedant@gmail.com'] || users['citizen@example.com'];
  const sampleImg = (w, h, text) => `https://images.unsplash.it/photo-1500${Math.floor(Math.random()*99)}?auto=format&fit=crop&w=${w}&h=${h}&q=60&${encodeURIComponent(text)}`;
  const sampleIssues = [
    {
      reportedBy: citizen?._id,
      title: 'Dangerous Pothole at Main Market Road',
      description: 'A deep pothole near the main market is causing vehicles to swerve suddenly, creating a major safety hazard for pedestrians and riders. Needs immediate patching by PWD.',
      type: 'ROADS',
      images: [
        'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1080&auto=format&fit=crop',
      ],
      location: {
        type: 'Point',
        coordinates: [85.3096, 23.3441], // lng, lat (Ranchi)
        address: 'Main Market Rd, Ranchi, Jharkhand',
      },
      priority: 'HIGH',
      status: 'REPORTED',
      assignedDept: 'ROADS',
      finalDept: 'ROADS',
    },
    {
      reportedBy: citizen?._id,
      title: 'Overflowing Garbage in Sector 5',
      description: 'Garbage bins have not been cleared in Sector 5 for three days. The area smells bad and stray animals are scattering waste. Requesting urgent cleanup and regular schedule restoration.',
      type: 'SANITATION',
      images: [
        'https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=1080&auto=format&fit=crop',
      ],
      location: {
        type: 'Point',
        coordinates: [85.3215, 23.3803],
        address: 'Sector 5, Ranchi, Jharkhand',
      },
      priority: 'MEDIUM',
      status: 'REPORTED',
      assignedDept: 'SANITATION',
      finalDept: 'SANITATION',
    },
    {
      reportedBy: citizen?._id,
      title: 'Broken Streetlight Near City Park',
      description: 'The streetlight near the southern gate of the city park has been broken for a week, leaving the path unlit and unsafe. Please replace the bulb/fixture.',
      type: 'ROADS',
      images: [
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1080&auto=format&fit=crop',
      ],
      location: {
        type: 'Point',
        coordinates: [85.3362, 23.3585],
        address: 'City Park, Ranchi, Jharkhand',
      },
      priority: 'LOW',
      status: 'REPORTED',
      assignedDept: 'ROADS',
      finalDept: 'ROADS',
    },
    {
      reportedBy: citizen?._id,
      title: 'Water Leakage in Sector 3',
      description: 'A continuous water leak from a roadside pipeline is creating puddles and water wastage. Risk of slippery surface for bikes. Please repair the pipeline and restore normal flow.',
      type: 'WATER',
      images: [
        'https://images.unsplash.com/photo-1509817316-4656a1cc3e4e?q=80&w=1080&auto=format&fit=crop',
      ],
      location: {
        type: 'Point',
        coordinates: [85.3172, 23.3691],
        address: 'Sector 3, Ranchi, Jharkhand',
      },
      priority: 'HIGH',
      status: 'REPORTED',
      assignedDept: 'WATER',
      finalDept: 'WATER',
    },
    {
      reportedBy: citizen?._id,
      title: 'Clogged Drain Near Bus Stand',
      description: 'Storm drain near the main bus stand is clogged with plastic and debris, causing water to stagnate after rainfall. Needs immediate cleaning.',
      type: 'SANITATION',
      images: [
        'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?q=80&w=1080&auto=format&fit=crop',
      ],
      location: {
        type: 'Point',
        coordinates: [85.3248, 23.3478],
        address: 'Main Bus Stand, Ranchi, Jharkhand',
      },
      priority: 'MEDIUM',
      status: 'REPORTED',
      assignedDept: 'SANITATION',
      finalDept: 'SANITATION',
    },
    {
      reportedBy: citizen?._id,
      title: 'Fallen Tree Branch Blocking Lane',
      description: 'A large tree branch has fallen after last night’s storm and is partially blocking a residential lane. Requires clearing by municipal team.',
      type: 'ROADS',
      images: [
        'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1080&auto=format&fit=crop',
      ],
      location: {
        type: 'Point',
        coordinates: [85.3301, 23.3523],
        address: 'Residential Lane 2, Ranchi, Jharkhand',
      },
      priority: 'MEDIUM',
      status: 'REPORTED',
      assignedDept: 'ROADS',
      finalDept: 'ROADS',
    },
  ].filter(i => i.reportedBy);

  for (const issue of sampleIssues) {
    // Avoid duplicates by title+reportedBy
    const exists = await Issue.findOne({ title: issue.title, reportedBy: issue.reportedBy }).lean();
    if (!exists) {
      await Issue.create(issue);
    }
  }

  console.log('Seed complete.');
  await mongoose.connection.close();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});


