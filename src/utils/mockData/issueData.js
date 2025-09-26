// Mock data for issues
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
            coordinates: [77.2300, 28.6200],
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
    // Add more mock issues as needed
];