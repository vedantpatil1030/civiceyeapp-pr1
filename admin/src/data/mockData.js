export const mockDepartments = [
  {
    _id: "dept1",
    name: "Water Department",
    description: "Handles water supply and sanitation issues",
    head: "John Smith",
    email: "water.dept@civiceye.com",
    phone: "1234567890",
    staffCount: 2,
    createdAt: "2025-09-01T10:00:00.000Z"
  },
  {
    _id: "dept2",
    name: "Roads & Infrastructure",
    description: "Manages road maintenance and infrastructure development",
    head: "Sarah Johnson",
    email: "roads.dept@civiceye.com",
    phone: "9876543210",
    createdAt: "2025-09-01T11:00:00.000Z"
  },
  {
    _id: "dept3",
    name: "Sanitation",
    description: "Handles waste management and cleanliness",
    head: "Mike Wilson",
    email: "sanitation.dept@civiceye.com",
    phone: "5555555555",
    createdAt: "2025-09-01T12:00:00.000Z"
  }
];

export const mockStaff = [
  {
    _id: "staff1",
    name: "John Smith",
    email: "water.dept@civiceye.com",
    phone: "1234567890",
    department: "dept1",
    role: "DEPARTMENT_HEAD",
    joinedAt: "2025-08-15T10:00:00.000Z"
  },
  {
    _id: "staff2",
    name: "Jane Doe",
    email: "jane.doe@civiceye.com",
    phone: "9876543210",
    department: "dept1",
    role: "STAFF",
    joinedAt: "2025-08-20T10:00:00.000Z"
  },
  {
    _id: "staff3",
    name: "Sarah Johnson",
    email: "sarah.j@civiceye.com",
    phone: "5555555555",
    department: "dept2",
    role: "DEPARTMENT_HEAD",
    joinedAt: "2025-08-15T11:00:00.000Z"
  }
];

export const mockUsers = [
  {
    "_id": "68cbe4065a714b8ac7cf8984",
    "fullName": "Vedant Patil",
    "email": "vedant@gmail.com",
    "mobileNumber": "8329315599",
    "aadharNumber": "778794567584",
    "gender": "male",
    "avatar": "",
    "role": "CITIZEN",
    "createdAt": "2025-09-18T10:50:46.574+00:00",
    "updatedAt": "2025-09-18T16:33:13.885+00:00",
    "__v": 0
  },
  {
    "_id": "68cbe4065a714b8ac7cf8985",
    "fullName": "Priya Sharma",
    "email": "priya.sharma@gmail.com",
    "mobileNumber": "9876543210",
    "aadharNumber": "123456789012",
    "gender": "female",
    "avatar": "",
    "role": "ADMIN",
    "department": "dept1",
    "departmentRole": "DEPARTMENT_HEAD",
    "createdAt": "2025-09-17T08:30:00.000+00:00",
    "updatedAt": "2025-09-18T12:15:00.000+00:00",
    "__v": 0
  },
  {
    "_id": "68cbe4065a714b8ac7cf8986",
    "fullName": "Rahul Kumar",
    "email": "rahul.kumar@gmail.com",
    "mobileNumber": "7890123456",
    "aadharNumber": "987654321098",
    "gender": "male",
    "avatar": "",
    "role": "ADMIN",
    "department": "dept2",
    "departmentRole": "STAFF",
    "createdAt": "2025-09-16T14:20:00.000+00:00",
    "updatedAt": "2025-09-16T14:20:00.000+00:00",
    "__v": 0
  },
  {
    "_id": "68cbe4065a714b8ac7cf8987",
    "fullName": "Anjali Desai",
    "email": "anjali.d@gmail.com",
    "mobileNumber": "8765432109",
    "aadharNumber": "456789012345",
    "gender": "female",
    "avatar": "",
    "role": "DEPARTMENTS",
    "createdAt": "2025-09-15T09:00:00.000+00:00",
    "updatedAt": "2025-09-18T10:00:00.000+00:00",
    "__v": 0
  },
  {
    "_id": "68cbe4065a714b8ac7cf8988",
    "fullName": "Amit Singh",
    "email": "amit.singh@gmail.com",
    "mobileNumber": "9988776655",
    "aadharNumber": "112233445566",
    "gender": "male",
    "avatar": "",
    "role": "CITIZEN",
    "createdAt": "2025-09-14T11:45:00.000+00:00",
    "updatedAt": "2025-09-14T11:45:00.000+00:00",
    "__v": 0
  }
];

export const mockIssues = [
  {
    "_id": "68cc4450da5a990fcd98ec41",
    "reportedBy": "68cbe4065a714b8ac7cf8984",
    "title": "Broken Streetlight on Main Road",
    "description": "The streetlight near the main intersection has been broken for 2 weeks",
    "type": "INFRASTRUCTURE",
    "images": [],
    "location": "Main Road Junction",
    "address": "123 Main Road, Downtown",
    "classifiedDept": null,
    "status": "REPORTED",
    "priority": "HIGH",
    "upvotes": [],
    "statusHistory": [],
    "proofOfWork": [],
    "comments": [],
    "createdAt": "2025-09-18T17:41:36.598+00:00",
    "updatedAt": "2025-09-18T17:41:36.598+00:00",
    "__v": 0
  },
  {
    "_id": "68cc4450da5a990fcd98ec42",
    "reportedBy": "68cbe4065a714b8ac7cf8985",
    "title": "Water Leakage in Park",
    "description": "There's a major water pipe leakage in the central park causing water wastage",
    "type": "WATER",
    "images": [],
    "location": "Central Park",
    "address": "45 Park Avenue, Midtown",
    "classifiedDept": null,
    "status": "IN_PROGRESS",
    "priority": "CRITICAL",
    "upvotes": [],
    "statusHistory": [],
    "proofOfWork": [],
    "comments": [],
    "createdAt": "2025-09-17T14:20:00.000+00:00",
    "updatedAt": "2025-09-18T09:30:00.000+00:00",
    "__v": 0
  },
  {
    "_id": "68cc4450da5a990fcd98ec43",
    "reportedBy": "68cbe4065a714b8ac7cf8986",
    "title": "Garbage Collection Issue",
    "description": "Garbage hasn't been collected for a week in sector 5",
    "type": "SANITATION",
    "images": [],
    "location": {},
    "classifiedDept": "dept3",
    "status": "REPORTED",
    "priority": "MEDIUM",
    "upvotes": [],
    "statusHistory": [],
    "proofOfWork": [],
    "comments": [],
    "createdAt": "2025-09-16T10:15:00.000+00:00",
    "updatedAt": "2025-09-16T10:15:00.000+00:00",
    "__v": 0
  },
  {
    "_id": "68cc4450da5a990fcd98ec44",
    "reportedBy": "68cbe4065a714b8ac7cf8987",
    "title": "Pothole on Highway",
    "description": "Large pothole causing accidents on the highway near exit 42",
    "type": "INFRASTRUCTURE",
    "images": [],
    "location": {},
    "classifiedDept": "dept2",
    "status": "RESOLVED",
    "priority": "CRITICAL",
    "upvotes": [],
    "statusHistory": [],
    "proofOfWork": [],
    "comments": [],
    "createdAt": "2025-09-15T08:00:00.000+00:00",
    "updatedAt": "2025-09-17T16:45:00.000+00:00",
    "__v": 0
  },
  {
    "_id": "68cc4450da5a990fcd98ec45",
    "reportedBy": "68cbe4065a714b8ac7cf8984",
    "title": "Noise Pollution from Construction",
    "description": "Excessive noise from construction site during night hours",
    "type": "ENVIRONMENT",
    "images": [],
    "location": {},
    "classifiedDept": "dept3",
    "status": "REPORTED",
    "priority": "LOW",
    "upvotes": [],
    "statusHistory": [],
    "proofOfWork": [],
    "comments": [],
    "createdAt": "2025-09-18T20:30:00.000+00:00",
    "updatedAt": "2025-09-18T20:30:00.000+00:00",
    "__v": 0
  }
];