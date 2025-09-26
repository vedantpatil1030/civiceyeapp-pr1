export const mockIssues = [
    {
        _id: "1",
        title: "Large Pothole on Main Road",
        description: "Deep pothole causing traffic and vehicle damage",
        type: "infrastructure",
        category: "infrastructure",
        priority: "high",
        status: "REPORTED",
        location: {
            type: "Point",
            coordinates: [77.2090, 28.6139], // [longitude, latitude] for Delhi
            address: "MG Road, New Delhi"
        },
        images: ["https://example.com/pothole1.jpg"],
        reportedBy: "user123",
        date: "2025-09-15",
        estimatedCost: "₹25,000",
        expectedResolution: "3 days",
        assignedDept: "Public Works",
        createdAt: "2025-09-15T10:00:00Z"
    },
    {
        _id: "2",
        title: "Broken Street Light",
        description: "Street light not working for past week, safety concern",
        type: "safety",
        category: "safety",
        priority: "medium",
        status: "IN_PROGRESS",
        location: {
            type: "Point",
            coordinates: [77.2300, 28.6200], // Different location in Delhi
            address: "Connaught Place, New Delhi"
        },
        images: ["https://example.com/light1.jpg"],
        reportedBy: "user124",
        date: "2025-09-14",
        estimatedCost: "₹5,000",
        expectedResolution: "1 day",
        assignedDept: "Electrical",
        createdAt: "2025-09-14T15:30:00Z"
    },
    {
        _id: "3",
        title: "Garbage Collection Issue",
        description: "Regular garbage collection not happening in the area",
        type: "cleanliness",
        category: "cleanliness",
        priority: "medium",
        status: "RESOLVED",
        location: {
            type: "Point",
            coordinates: [77.2400, 28.6300], // Another Delhi location
            address: "Karol Bagh, New Delhi"
        },
        images: ["https://example.com/garbage1.jpg"],
        reportedBy: "user125",
        date: "2025-09-13",
        estimatedCost: "₹10,000",
        expectedResolution: "2 days",
        assignedDept: "Sanitation",
        createdAt: "2025-09-13T09:15:00Z"
    },
    {
        _id: "4",
        title: "Park Maintenance Required",
        description: "Park equipment damaged and needs repair",
        type: "environment",
        category: "environment",
        priority: "low",
        status: "ASSIGNED_DEPT",
        location: {
            type: "Point",
            coordinates: [77.2500, 28.6400], // Different Delhi location
            address: "Lodhi Gardens, New Delhi"
        },
        images: ["https://example.com/park1.jpg"],
        reportedBy: "user126",
        date: "2025-09-12",
        estimatedCost: "₹15,000",
        expectedResolution: "5 days",
        assignedDept: "Parks & Recreation",
        createdAt: "2025-09-12T14:20:00Z"
    },
    {
        _id: "5",
        title: "Traffic Signal Malfunction",
        description: "Traffic signal not working at major intersection",
        type: "transport",
        category: "transport",
        priority: "high",
        status: "IN_PROGRESS",
        location: {
            type: "Point",
            coordinates: [77.2600, 28.6500], // Another Delhi location
            address: "ITO, New Delhi"
        },
        images: ["https://example.com/signal1.jpg"],
        reportedBy: "user127",
        date: "2025-09-11",
        estimatedCost: "₹30,000",
        expectedResolution: "1 day",
        assignedDept: "Traffic Management",
        createdAt: "2025-09-11T11:45:00Z"
    },
    {
        _id: "6",
        title: "Water Pipeline Leakage",
        description: "Major water leakage causing wastage",
        type: "infrastructure",
        category: "infrastructure",
        priority: "high",
        status: "ASSIGNED_STAFF",
        location: {
            type: "Point",
            coordinates: [77.2700, 28.6600], // Different Delhi location
            address: "Dwarka, New Delhi"
        },
        images: ["https://example.com/water1.jpg"],
        reportedBy: "user128",
        date: "2025-09-10",
        estimatedCost: "₹40,000",
        expectedResolution: "2 days",
        assignedDept: "Water Department",
        createdAt: "2025-09-10T16:30:00Z"
    },
    {
        _id: "7",
        title: "Unauthorized Construction",
        description: "Illegal construction activity in residential area",
        type: "safety",
        category: "safety",
        priority: "medium",
        status: "VERIFIED",
        location: {
            type: "Point",
            coordinates: [77.2800, 28.6700], // Another Delhi location
            address: "Rohini, New Delhi"
        },
        images: ["https://example.com/construction1.jpg"],
        reportedBy: "user129",
        date: "2025-09-09",
        estimatedCost: "Investigation Required",
        expectedResolution: "7 days",
        assignedDept: "Building Department",
        createdAt: "2025-09-09T13:15:00Z"
    }
];