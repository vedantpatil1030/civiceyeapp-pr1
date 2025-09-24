import { users, authTokens } from './userData';
import { departments } from './departmentData';
import { mockResponses } from './responses';
import { issueTypes, issueStatus, issuePriorities } from './constants';
import { issues } from './issueData';

// Mock data service for handling all mock data operations
class MockDataService {
    constructor() {
        this.users = users;
        this.authTokens = authTokens;
        this.departments = departments;
        this.issues = issues;
        this.responses = mockResponses;
    }

    // User related methods
    getUserById(id) {
        return this.users.find(user => user.id === id);
    }

    getUserByCredentials(username, password) {
        // In mock data we're not storing passwords, so just match username
        const user = this.users.find(user => user.username === username);
        return user ? { user, token: this.authTokens[user.id] } : null;
    }

    // Issue related methods
    getIssues() {
        return this.issues;
    }

    getIssueById(id) {
        return this.issues.find(issue => issue.id === id);
    }

    getIssuesByUser(userId) {
        return this.issues.filter(issue => issue.userId === userId);
    }

    getIssuesByDepartment(departmentId) {
        return this.issues.filter(issue => issue.departmentId === departmentId);
    }

    // Department related methods
    getDepartments() {
        return this.departments;
    }

    getDepartmentById(id) {
        return this.departments.find(dept => dept.id === id);
    }

    // Helper methods
    getIssueTypes() {
        return issueTypes;
    }

    getIssueStatuses() {
        return issueStatus;
    }

    getIssuePriorities() {
        return issuePriorities;
    }
}

// Export a singleton instance
export const mockDataService = new MockDataService();