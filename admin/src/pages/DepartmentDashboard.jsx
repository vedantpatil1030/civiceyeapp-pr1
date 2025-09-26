import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../config/axios";
import { API_BASE_URL } from "../config/api";
import {
  FiUsers,
  FiUpload,
  FiX,
  FiClock,
  FiUser,
  FiFileText,
  FiAlertCircle
} from "react-icons/fi";

const DepartmentDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [proofFiles, setProofFiles] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);

  // Memoize auth values with fallbacks and debugging
  const authData = useMemo(() => {
    // Try to get department _id, departmentName, or type
    const deptId = localStorage.getItem("departmentId") || localStorage.getItem("department_id") || localStorage.getItem("deptId");
    const deptName = localStorage.getItem("departmentName") || localStorage.getItem("department") || localStorage.getItem("dept") || localStorage.getItem("departmentType");
    const token = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken");
    // Debug logging (remove in production)
    console.log("Auth Debug:", { 
      deptId,
      deptName, 
      token: token ? "present" : "missing",
      allKeys: Object.keys(localStorage)
    });
    return { deptId, deptName, token };
  }, []);

  const { deptId, deptName, token } = authData;

  // Fetch issues with error handling and loading management
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend route is under /issues router: /issues/departments/:deptName/issues
      const key = deptName || deptId || 'ROADS';
      const res = await api.get(`/issues/departments/${key}/issues`, { timeout: 10000 });
      setIssues(res.data.data || res.data.issues || []);
    } catch (err) {
      console.error("Failed to fetch department issues:", err);
      let message = "Failed to fetch department issues";
      if (err.response?.status === 403) {
        message = "Access denied. You don't have permission to view this department's issues.";
      } else if (err.response?.status === 404) {
        message = "Department not found. Please check the department name or ID.";
      } else if (err.code === 'ECONNABORTED') {
        message = "Request timeout - please try again";
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [deptId, deptName, token]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Open assign staff modal
  const openAssignStaff = useCallback(async (issue) => {
    if (globalLoading) return;
    
    setSelectedIssue(issue);
    setGlobalLoading(true);
    setStaffList([]);
    
    try {
      const res = await api.get(`/departments/${deptName || 'ROADS'}/members`, { timeout: 8000 });
      setStaffList(res.data.data?.members || res.data.members || []);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
      setStaffList([]);
      alert("Failed to load staff members. Please try again.");
    } finally {
      setGlobalLoading(false);
    }
  }, [deptName, token, globalLoading]);

  // Handle staff assignment
  const handleAssignStaff = useCallback(async () => {
    if (!selectedIssue || !selectedStaff || globalLoading) return;
    
    setGlobalLoading(true);
    
    try {
      await api.post(
        `/issues/${selectedIssue._id}/assign-staff`,
        { staffId: selectedStaff },
        { timeout: 8000 }
      );
      
      // Update local state
      const assignedStaff = staffList.find(s => s._id === selectedStaff);
      setIssues(prev => prev.map(iss => 
        iss._id === selectedIssue._id 
          ? { ...iss, assignedToStaff: assignedStaff }
          : iss
      ));
      
      // Reset modal state
      setSelectedStaff("");
      setSelectedIssue(null);
      alert("Staff assigned successfully");
      
    } catch (err) {
      console.error("Failed to assign staff:", err);
      const message = err.response?.data?.message || "Failed to assign staff";
      alert(message);
    } finally {
      setGlobalLoading(false);
    }
  }, [selectedIssue, selectedStaff, token, staffList, globalLoading]);

  // Handle proof upload
  const handleProofUpload = useCallback(async (issueId) => {
    const file = proofFiles[issueId];
    if (!file || globalLoading) return;
    
    setGlobalLoading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      await api.post(`/issues/${issueId}/proof`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000
      });
      
      alert("Proof uploaded successfully");
      
      // Clear the file input
      setProofFiles(prev => ({ ...prev, [issueId]: null }));
      
      // Optionally refresh issues to get updated data
      fetchIssues();
      
    } catch (err) {
      console.error("Failed to upload proof:", err);
      const message = err.response?.data?.message || "Failed to upload proof";
      alert(message);
    } finally {
      setGlobalLoading(false);
    }
  }, [proofFiles, token, globalLoading, fetchIssues]);

  // Handle file selection
  const handleFileSelect = useCallback((issueId, file) => {
    setProofFiles(prev => ({ ...prev, [issueId]: file }));
  }, []);

  // Format date helper
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  }, []);

  // Get status color
  const getStatusColor = useCallback((status) => {
    const colors = {
      reported: "bg-yellow-100 text-yellow-800",
      verified: "bg-green-100 text-green-800", 
      completed: "bg-blue-100 text-blue-800",
      "in-progress": "bg-purple-100 text-purple-800",
      resolved: "bg-gray-100 text-gray-800"
    };
    return colors[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-blue-700">Loading department issues...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            <p className="font-bold">Error</p>
          </div>
          <p className="mt-2">{error}</p>
          <button 
            onClick={fetchIssues}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Global Loading Overlay */}
      {globalLoading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-gray-700 font-medium">Processing...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Department Dashboard</h1>
      <p className="text-gray-600 mt-1">Department: <span className="font-medium">{deptName || deptId}</span></p>
        </div>
        <button 
          onClick={fetchIssues}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
          disabled={globalLoading}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Issues Count */}
      <div className="mb-4 text-sm text-gray-600">
        Total Issues: <span className="font-medium">{issues.length}</span>
      </div>

      {/* Issues Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <FiFileText className="inline w-4 h-4 mr-1" />
                  Issue Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <FiClock className="inline w-4 h-4 mr-1" />
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <FiUser className="inline w-4 h-4 mr-1" />
                  Assigned Staff
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No issues assigned to this department
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{issue.title || "No Title"}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {issue.description ? 
                            `${issue.description.substring(0, 100)}${issue.description.length > 100 ? '...' : ''}` : 
                            "No description available"
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                        {issue.status || "REPORTED"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(issue.deadline)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {issue.assignedToStaff?.name || issue.assignedToStaff?.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col gap-2 items-center">
                        <button 
                          onClick={() => openAssignStaff(issue)} 
                          className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition duration-200"
                          disabled={globalLoading}
                        >
                          <FiUsers className="w-3 h-3" />
                          Assign Staff
                        </button>
                        
                        <div className="flex items-center gap-1">
                          <input 
                            type="file" 
                            onChange={e => handleFileSelect(issue._id, e.target.files[0])}
                            className="text-xs w-20"
                            accept="image/*,.pdf,.doc,.docx"
                            disabled={globalLoading}
                          />
                          <button 
                            onClick={() => handleProofUpload(issue._id)} 
                            className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition duration-200"
                            disabled={globalLoading || !proofFiles[issue._id]}
                          >
                            <FiUpload className="w-3 h-3" />
                            Upload
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Staff Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FiUsers className="w-5 h-5" />
                Assign Staff
              </h3>
              <button 
                onClick={() => setSelectedIssue(null)}
                className="text-gray-500 hover:text-gray-700"
                disabled={globalLoading}
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Issue: {selectedIssue.title}</p>
              <select 
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={selectedStaff} 
                onChange={e => setSelectedStaff(e.target.value)}
                disabled={globalLoading}
              >
                <option value="">-- Select Staff Member --</option>
                {staffList.length === 0 ? (
                  <option value="" disabled>(No staff members available)</option>
                ) : (
                  staffList.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name || staff.email}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition duration-200" 
                onClick={() => setSelectedIssue(null)}
                disabled={globalLoading}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 transition duration-200" 
                onClick={handleAssignStaff} 
                disabled={globalLoading || !selectedStaff}
              >
                {globalLoading ? "Assigning..." : "Assign Staff"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDashboard;