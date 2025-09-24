import { mockIssues } from './mockData';

class MockDataService {
    constructor() {
        this.issues = mockIssues;
    }

    // Get all issues
    async getAllIssues() {
        return {
            data: {
                success: true,
                data: {
                    issues: this.issues
                },
                message: "Issues fetched successfully"
            }
        };
    }

    // Get issues by status
    async getIssuesByStatus(status) {
        const filteredIssues = this.issues.filter(issue => issue.status === status);
        return {
            data: {
                success: true,
                data: {
                    issues: filteredIssues
                },
                message: "Issues fetched successfully"
            }
        };
    }

    // Get issues by category
    async getIssuesByCategory(category) {
        const filteredIssues = this.issues.filter(
            issue => issue.category === category || issue.type === category
        );
        return {
            data: {
                success: true,
                data: {
                    issues: filteredIssues
                },
                message: "Issues fetched successfully"
            }
        };
    }

    // Get issues by location
    async getIssuesByLocation(lat, lng, radiusKm = 5) {
        // Simple distance calculation (not accurate for large distances)
        const filteredIssues = this.issues.filter(issue => {
            const issueLat = issue.location.coordinates[1];
            const issueLng = issue.location.coordinates[0];
            const distance = Math.sqrt(
                Math.pow(lat - issueLat, 2) + Math.pow(lng - issueLng, 2)
            ) * 111; // Rough conversion to kilometers
            return distance <= radiusKm;
        });
        return {
            data: {
                success: true,
                data: {
                    issues: filteredIssues
                },
                message: "Issues fetched successfully"
            }
        };
    }

    // Get issue statistics
    async getStatistics() {
        const stats = {
            total: this.issues.length,
            byStatus: {
                REPORTED: this.issues.filter(i => i.status === 'REPORTED').length,
                IN_PROGRESS: this.issues.filter(i => i.status === 'IN_PROGRESS').length,
                RESOLVED: this.issues.filter(i => i.status === 'RESOLVED').length
            },
            byCategory: {
                infrastructure: this.issues.filter(i => i.category === 'infrastructure').length,
                safety: this.issues.filter(i => i.category === 'safety').length,
                environment: this.issues.filter(i => i.category === 'environment').length,
                cleanliness: this.issues.filter(i => i.category === 'cleanliness').length,
                transport: this.issues.filter(i => i.category === 'transport').length
            },
            highPriority: this.issues.filter(i => i.priority === 'high').length
        };
        return {
            data: {
                success: true,
                data: stats,
                message: "Statistics fetched successfully"
            }
        };
    }
}

export const mockDataService = new MockDataService();