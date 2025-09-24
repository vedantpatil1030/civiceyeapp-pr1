// Mock user data
export const users = [
    {
        id: "u1",
        username: "john.doe",
        email: "john.doe@example.com",
        role: "citizen",
        firstName: "John",
        lastName: "Doe",
        phone: "123-456-7890",
        address: "123 Main St, City"
    },
    {
        id: "u2",
        username: "jane.smith",
        email: "jane.smith@example.com",
        role: "admin",
        firstName: "Jane",
        lastName: "Smith",
        phone: "987-654-3210",
        address: "456 Oak Ave, City"
    }
];

// Mock authentication tokens
export const authTokens = {
    "u1": "mock-token-citizen-123",
    "u2": "mock-token-admin-456"
};