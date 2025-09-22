// /src/pages/Issues.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../hooks/useToast";
import {
  FiTrash2,
  FiFilter,
  FiSearch,
  FiUserCheck,
  FiUserPlus,
  FiCheckCircle,
  FiFileText,
  FiClock,
  FiUsers,
  FiMessageCircle,
  FiUploadCloud,
  FiArrowRightCircle,
  FiAlertCircle
} from "react-icons/fi";
import { API_BASE_URL } from "../config/api";

/**
 * Issues Management page
 * - Fixed loading states to prevent simultaneous loading indicators
 * - Improved user experience with proper loading management
 */

const Issues = () => {
  const toast = useToast();

  // top-level state
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filters/search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // selection
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Global loading state to prevent multiple simultaneous operations
  const [globalLoading, setGlobalLoading] = useState(false);

  // report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);

  // comments modal
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // proof modal
  const [showProofModal, setShowProofModal] = useState(false);

  // complaint modal
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintReason, setComplaintReason] = useState("");

  // change status modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // assign dept modal
  const [showAssignDeptModal, setShowAssignDeptModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [assignDeptMode, setAssignDeptMode] = useState("auto"); // 'auto' | 'manual'

  // assign staff modal
  const [showAssignStaffModal, setShowAssignStaffModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [staffDeadline, setStaffDeadline] = useState("");

  const statusOptions = [
    { value: "REPORTED", label: "Reported" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "VERIFIED", label: "Verified" },
    { value: "COMPLETED", label: "Completed" },
    { value: "RESOLVED", label: "Resolved" }
  ];

  // -----------------------
  // Fetch issues (initial)
  // -----------------------
  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/issues/getAllIssues`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setIssues(res.data.data || res.data.issues || []);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to fetch issues";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []); // Only run once on mount

  // -----------------------
  // Helper formatting
  // -----------------------
  const formatDate = (dateString) => {
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
  };

  const getStatusColor = (status) => {
    const colors = {
      reported: "bg-yellow-100 text-yellow-800",
      verified: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      "in-progress": "bg-purple-100 text-purple-800",
      pending: "bg-gray-100 text-gray-800"
    };
    return colors[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: "text-red-600",
      medium: "text-yellow-600",
      low: "text-green-600"
    };
    return colors[priority?.toLowerCase()] || "text-gray-600";
  };

  // -----------------------
  // Filters (computed)
  // -----------------------
  const filteredIssues = issues.filter((issue) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      issue.title?.toLowerCase().includes(q) ||
      issue.description?.toLowerCase().includes(q) ||
      issue.location?.address?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || issue.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === "all" || issue.priority?.toLowerCase() === priorityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // -----------------------
  // Handlers: Update Status (local + server)
  // -----------------------
  const handleChangeStatus = async () => {
    if (!selectedIssue || !newStatus || globalLoading) {
      toast.error("Please select a status");
      return;
    }
    setGlobalLoading(true);

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_BASE_URL}/issues/${selectedIssue._id}/status`,
        { status: newStatus },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      setIssues((prev) => prev.map((iss) => (iss._id === selectedIssue._id ? { ...iss, status: newStatus } : iss)));
      setSelectedIssue((prev) => (prev ? { ...prev, status: newStatus } : prev));
      toast.success("Status updated successfully");
      setShowStatusModal(false);
      setNewStatus("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setGlobalLoading(false);
    }
  };

  // -----------------------
  // Delete (client-side only)
  // -----------------------
  const handleDeleteIssue = (issueId) => {
    if (!window.confirm("Are you sure you want to delete this issue?") || globalLoading) return;
    setIssues((prev) => prev.filter((issue) => issue._id !== issueId));
    toast.success("Issue deleted successfully (locally)");
  };

  // -----------------------
  // Assign Department
  // -----------------------
  useEffect(() => {
    if (!showAssignDeptModal) return;

    const fetchDepartments = async () => {
      if (globalLoading) return;
      setGlobalLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/departments/get-all-departments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setDepartments(res.data.data || res.data.departments || []);
      } catch (err) {
        setDepartments([]);
      } finally {
        setGlobalLoading(false);
      }
    };
    fetchDepartments();
  }, [showAssignDeptModal, globalLoading]);

  const handleAssignDept = async () => {
    if (!selectedIssue || !selectedDept || globalLoading) {
      toast.error("Please select a department");
      return;
    }
    setGlobalLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_BASE_URL}/issues/${selectedIssue._id}/reassign-dept`,
        { newDept: selectedDept },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      setIssues((prev) => prev.map((iss) => (iss._id === selectedIssue._id ? { ...iss, assignedDept: selectedDept, finalDept: selectedDept } : iss)));
      setSelectedIssue((prev) => (prev ? { ...prev, assignedDept: selectedDept, finalDept: selectedDept } : prev));
      toast.success("Department assigned successfully");
      setShowAssignDeptModal(false);
      setSelectedDept("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign department");
    } finally {
      setGlobalLoading(false);
    }
  };

  // -----------------------
  // Assign Staff
  // -----------------------
  useEffect(() => {
    if (!showAssignStaffModal || !selectedIssue) return;
    const fetchStaff = async () => {
      if (globalLoading) return;
      setGlobalLoading(true);
      try {
        const token = localStorage.getItem("token");
        const deptName = selectedIssue.finalDept || selectedIssue.classifiedDept;
        if (!deptName) {
          setStaffList([]);
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/departments/${deptName}/members`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        setStaffList(res.data.data?.members || res.data.members || []);
      } catch (err) {
        try {
          const token2 = localStorage.getItem("token");
          const res2 = await axios.get(`${API_BASE_URL}/issues/${selectedIssue._id}/staff`, {
            headers: token2 ? { Authorization: `Bearer ${token2}` } : {}
          });
          const staff = res2.data.data?.staff ? [res2.data.data.staff] : [];
          setStaffList(staff);
        } catch (err2) {
          setStaffList([]);
          toast.error("Failed to fetch staff for department");
        }
      } finally {
        setGlobalLoading(false);
      }
    };

    fetchStaff();
  }, [showAssignStaffModal, selectedIssue, toast, globalLoading]);

  const handleAssignStaff = async () => {
    if (!selectedIssue || !selectedStaff || globalLoading) {
      toast.error("Please select a staff member");
      return;
    }
    setGlobalLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/issues/${selectedIssue._id}/assign-staff`,
        { staffId: selectedStaff, deadline: staffDeadline },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      setIssues((prev) => prev.map((iss) => (iss._id === selectedIssue._id ? { ...iss, assignedToStaff: staffList.find(s => s._id === selectedStaff) || { _id: selectedStaff }, deadline: staffDeadline } : iss)));
      setSelectedIssue((prev) => prev ? { ...prev, assignedToStaff: staffList.find(s => s._id === selectedStaff) || { _id: selectedStaff }, deadline: staffDeadline } : prev);
      toast.success("Staff assigned successfully");
      setShowAssignStaffModal(false);
      setSelectedStaff("");
      setStaffDeadline("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign staff");
    } finally {
      setGlobalLoading(false);
    }
  };

  // -----------------------
  // Report modal (fetch)
  // -----------------------
  const openReport = async (issue) => {
    if (globalLoading) return;
    setSelectedIssue(issue);
    setShowReportModal(true);
    setReportData(null);
    setGlobalLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/issues/${issue._id}/report`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = res.data.data || res.data;
      setReportData(data);
    } catch (err) {
      setReportData({ error: err.response?.data?.message || "Failed to fetch report" });
    } finally {
      setGlobalLoading(false);
    }
  };

  // -----------------------
  // Comments (open & add)
  // -----------------------
  const openComments = async (issue) => {
    if (globalLoading) return;
    setSelectedIssue(issue);
    setShowCommentsModal(true);
    setGlobalLoading(true);
    setComments([]);
    try {
      const token = localStorage.getItem("token");

      try {
        const res = await axios.get(`${API_BASE_URL}/issues/${issue._id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setComments(res.data.data?.comments || []);
      } catch (getErr) {
        setComments(issue.comments || []);
      }
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || globalLoading) return;

    setGlobalLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/issues/${selectedIssue._id}/comment`,
        { text: newComment },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      const added = res.data.data || res.data.comment || { text: newComment, author: "You", createdAt: new Date().toISOString() };
      setComments((prev) => [...prev, added]);
      setNewComment("");
      toast.success("Comment added");
    } catch (err) {
      setComments((prev) => [...prev, { text: newComment, author: "You", createdAt: new Date().toISOString() }]);
      setNewComment("");
      toast.error(err.response?.data?.message || "Failed to add comment (saved locally)");
    } finally {
      setGlobalLoading(false);
    }
  };

  // -----------------------
  // Complaint (raise complaint against dept)
  // -----------------------
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintReason.trim() || !selectedIssue || globalLoading) return;
    setGlobalLoading(true);
    try {
      const token = localStorage.getItem("token");
      const deptId = selectedIssue.finalDept || selectedIssue.classifiedDept;
      if (!deptId) throw new Error("No department assigned");

      await axios.post(
        `${API_BASE_URL}/departments/${deptId}/complaint`,
        { issueId: selectedIssue._id, reason: complaintReason },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      toast.success("Complaint submitted successfully");
      setShowComplaintModal(false);
      setComplaintReason("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit complaint");
    } finally {
      setGlobalLoading(false);
    }
  };

  // -----------------------
  // UI Render
  // -----------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        <span className="ml-3 text-blue-700">Loading issues...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Global Loading Overlay */}
      {globalLoading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <span className="text-gray-700 font-medium">Processing...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Issues Management</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition duration-200">
            <FiFilter className="w-5 h-5" />
            Advanced Filters
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={globalLoading}
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={globalLoading}
        >
          <option value="all">All Status</option>
          <option value="reported">Reported</option>
          <option value="verified">Verified</option>
          <option value="completed">Completed</option>
        </select>

        <select 
          value={priorityFilter} 
          onChange={(e) => setPriorityFilter(e.target.value)} 
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={globalLoading}
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {/* Issues Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classified Dept</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Dept</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Dept</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upvotes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported At</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIssues.map((issue) => (
                <tr key={issue._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{issue.title || "No Title"}</div>
                      <div className="text-sm text-gray-500">{issue.description ? `${issue.description.substring(0, 100)}...` : "No description available"}</div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{issue.location?.address || "No Address"}</div></td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(issue.status || "REPORTED")}`}>
                      {issue.status || "REPORTED"}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap"><span className={`text-sm font-medium ${getPriorityColor(issue.priority || "low")}`}>{issue.priority || "Low"}</span></td>

                  <td className="px-6 py-4 whitespace-nowrap">{issue.classifiedDept || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{issue.finalDept || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{issue.assignedDept || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{issue.assignedToStaff?.name || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{issue.upvoteCount ?? (issue.upvotes ? issue.upvotes.length : 0)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{issue.deadline ? formatDate(issue.deadline) : "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{issue.reportedBy?.email || "Unknown"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(issue.createdAt)}</td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-center space-x-3">
                      <button 
                        onClick={() => setSelectedIssue(issue)} 
                        className="text-blue-600 hover:text-blue-900" 
                        title="View Details"
                        disabled={globalLoading}
                      >
                        <FiFileText className="w-5 h-5" />
                      </button>

                      <button 
                        onClick={() => handleDeleteIssue(issue._id)} 
                        className="text-red-600 hover:text-red-900" 
                        title="Delete"
                        disabled={globalLoading}
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-3xl w-full">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-blue-800 flex items-center gap-2"><FiFileText className="w-6 h-6" /> Issue Details</h2>
              <button onClick={() => setSelectedIssue(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div><span className="font-semibold text-gray-600">Title:</span> {selectedIssue.title}</div>
                <div><span className="font-semibold text-gray-600">Description:</span> {selectedIssue.description}</div>
                <div><span className="font-semibold text-gray-600">Type:</span> {selectedIssue.type}</div>
                <div><span className="font-semibold text-gray-600">Classified Dept:</span> {selectedIssue.classifiedDept || "-"}</div>
                <div><span className="font-semibold text-gray-600">Final Dept:</span> {selectedIssue.finalDept || "-"}</div>
                <div><span className="font-semibold text-gray-600">Assigned Dept:</span> {selectedIssue.assignedDept || "-"}</div>
                <div><span className="font-semibold text-gray-600">Assigned Staff:</span> {selectedIssue.assignedToStaff?.name || "-"}</div>
                <div><span className="font-semibold text-gray-600">Upvotes:</span> {selectedIssue.upvoteCount || (selectedIssue.upvotes ? selectedIssue.upvotes.length : 0)}</div>
                <div><span className="font-semibold text-gray-600">Deadline:</span> {selectedIssue.deadline ? formatDate(selectedIssue.deadline) : "-"}</div>
                <div><span className="font-semibold text-gray-600">Status:</span> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedIssue.status)}`}>{selectedIssue.status}</span></div>
                <div><span className="font-semibold text-gray-600">Priority:</span> <span className={`font-semibold ${getPriorityColor(selectedIssue.priority)}`}>{selectedIssue.priority}</span></div>
              </div>

              <div className="space-y-3">
                <div><span className="font-semibold text-gray-600">Reported By:</span> {selectedIssue.reportedBy?.email || "-"}</div>
                <div><span className="font-semibold text-gray-600">Reported At:</span> {formatDate(selectedIssue.createdAt)}</div>
                <div><span className="font-semibold text-gray-600">Location:</span> {selectedIssue.location?.address || "-"}</div>
                <div><span className="font-semibold text-gray-600">Coordinates:</span> {selectedIssue.location?.coordinates?.join(", ") || "-"}</div>
                <div><span className="font-semibold text-gray-600">Comments:</span> {selectedIssue.comments?.length || 0}</div>
                <div><span className="font-semibold text-gray-600">Proof of Work:</span> {selectedIssue.proofOfWork?.length || 0}</div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <button 
                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs disabled:opacity-50" 
                    title="Assign Department" 
                    onClick={() => { setAssignDeptMode("auto"); setSelectedDept(""); setShowAssignDeptModal(true); }}
                    disabled={globalLoading}
                  >
                    <FiUserCheck />Assign Dept
                  </button>

                  <button 
                    className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-xs disabled:opacity-50" 
                    title="Assign Staff" 
                    onClick={() => { setShowAssignStaffModal(true); }}
                    disabled={globalLoading}
                  >
                    <FiUsers />Assign Staff
                  </button>

                  <button 
                    className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs disabled:opacity-50" 
                    title="Change Status" 
                    onClick={() => { setShowStatusModal(true); setNewStatus(selectedIssue.status || ""); }}
                    disabled={globalLoading}
                  >
                    <FiCheckCircle />Change Status
                  </button>

                  <button 
                    className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-xs disabled:opacity-50" 
                    title="Generate/View Report" 
                    onClick={() => openReport(selectedIssue)}
                    disabled={globalLoading}
                  >
                    <FiFileText />Report
                  </button>

                  <button 
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs disabled:opacity-50" 
                    title="View Comments" 
                    onClick={() => openComments(selectedIssue)}
                    disabled={globalLoading}
                  >
                    <FiMessageCircle />Comments
                  </button>

                  <button 
                    className="flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded hover:bg-pink-200 text-xs disabled:opacity-50" 
                    title="Proof of Work" 
                    onClick={() => setShowProofModal(true)}
                    disabled={globalLoading}
                  >
                    <FiUploadCloud />Proof
                  </button>

                  <button
                    className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs disabled:opacity-50"
                    title="Raise Complaint"
                    onClick={() => setShowComplaintModal(true)}
                    disabled={globalLoading || (() => {
                      if (!selectedIssue.deadline) return true;
                      if (!selectedIssue.finalDept && !selectedIssue.classifiedDept) return true;
                      const deadline = new Date(selectedIssue.deadline);
                      return deadline > new Date();
                    })()}
                  >
                    <FiAlertCircle />Complain
                  </button>
                </div>
              </div>
            </div>

            {selectedIssue.images && selectedIssue.images.length > 0 && (
              <div className="mt-6">
                <div className="font-semibold text-gray-600 mb-2">Issue Images</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedIssue.images.map((image, idx) => (
                    <img key={idx} src={image} alt={`Issue ${idx + 1}`} className="h-24 w-full object-cover rounded-lg border" />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button onClick={() => setSelectedIssue(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Assign Dept Modal --- */}
      {showAssignDeptModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Assign Department</h3>

            <div className="mb-4">
              <label className="block font-medium mb-2">Select Department:</label>
              <select 
                className="w-full border border-gray-300 rounded px-3 py-2" 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value)} 
                disabled={globalLoading}
              >
                <option value="">-- Select Department --</option>
                {departments.length === 0 ? 
                  <option value="">(No departments loaded)</option> : 
                  departments.map((dept) => (
                    <option key={dept._id || dept.name} value={dept.name}>{dept.name}</option>
                  ))
                }
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" 
                onClick={() => setShowAssignDeptModal(false)} 
                disabled={globalLoading}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60" 
                onClick={handleAssignDept} 
                disabled={globalLoading || !selectedDept}
              >
                {globalLoading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Change Status Modal --- */}
      {showStatusModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Change Issue Status</h3>

            <div className="mb-4">
              <label className="block font-medium mb-2">Select Status:</label>
              <select 
                className="w-full border border-gray-300 rounded px-3 py-2" 
                value={newStatus} 
                onChange={(e) => setNewStatus(e.target.value)}
                disabled={globalLoading}
              >
                <option value="">-- Select Status --</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" 
                onClick={() => setShowStatusModal(false)} 
                disabled={globalLoading}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60" 
                onClick={handleChangeStatus} 
                disabled={globalLoading || !newStatus}
              >
                {globalLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Report Modal --- */}
      {showReportModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Issue Report</h3>
              <button className="text-gray-500 hover:text-gray-700 text-2xl" onClick={() => setShowReportModal(false)}>×</button>
            </div>

            {globalLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
                <span className="ml-3 text-yellow-700">Loading report...</span>
              </div>
            ) : reportData && !reportData.error ? (
              <div className="space-y-2">
                {reportData.pdfUrl || reportData.url ? (
                  <a href={reportData.pdfUrl || reportData.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">Download/View Report</a>
                ) : (
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto max-h-96">{JSON.stringify(reportData, null, 2)}</pre>
                )}
              </div>
            ) : (
              <div className="text-red-600 font-medium">{reportData?.error || "No report available."}</div>
            )}

            <div className="mt-6 flex justify-end">
              <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setShowReportModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Comments Modal --- */}
      {showCommentsModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Comments</h3>
              <button className="text-gray-500 hover:text-gray-700 text-2xl" onClick={() => setShowCommentsModal(false)}>×</button>
            </div>

            {globalLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
                <span className="ml-3 text-gray-700">Loading comments...</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {comments.length === 0 ? (
                  <div className="text-gray-500 text-sm">No comments yet.</div>
                ) : (
                  comments.map((c, idx) => (
                    <div key={idx} className="bg-gray-100 rounded p-2">
                      <div className="text-sm text-gray-800">{c.text || c.comment || c}</div>
                      <div className="text-xs text-gray-500 mt-1">{c.author?.email || c.author || c.user?.email || "Anonymous"} {c.createdAt ? `· ${new Date(c.createdAt).toLocaleString()}` : ""}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            <form className="flex gap-2 mt-2" onSubmit={handleAddComment}>
              <input 
                type="text" 
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" 
                placeholder="Add a comment..." 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
                disabled={globalLoading} 
              />
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 text-sm" 
                disabled={globalLoading || !newComment.trim()}
              >
                {globalLoading ? "Adding..." : "Add"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- Proof of Work Modal --- */}
      {showProofModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Proof of Work</h3>
              <button className="text-gray-500 hover:text-gray-700 text-2xl" onClick={() => setShowProofModal(false)}>×</button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(!selectedIssue.proofOfWork || selectedIssue.proofOfWork.length === 0) ? (
                <div className="text-gray-500 text-sm">No proof of work submitted yet.</div>
              ) : (
                selectedIssue.proofOfWork.map((proof, idx) => (
                  <div key={idx} className="bg-pink-50 rounded p-2 flex flex-col gap-1">
                    {proof.imageUrl || proof.url ? (
                      <img src={proof.imageUrl || proof.url} alt={`Proof ${idx + 1}`} className="h-32 w-auto object-contain rounded border" />
                    ) : proof.text ? (
                      <div className="text-gray-800 text-sm">{proof.text}</div>
                    ) : (
                      <div className="text-gray-800 text-sm">{typeof proof === "string" ? proof : JSON.stringify(proof)}</div>
                    )}
                    {proof.uploadedBy && <div className="text-xs text-gray-500">Submitted by: {proof.uploadedBy.email || proof.uploadedBy}</div>}
                    {proof.createdAt && <div className="text-xs text-gray-400">{new Date(proof.createdAt).toLocaleString()}</div>}
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setShowProofModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Assign Staff Modal --- */}
      {showAssignStaffModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Assign Staff</h3>

            <div className="mb-4">
              <label className="block font-medium mb-2">Select Staff:</label>
              <select 
                className="w-full border border-gray-300 rounded px-3 py-2" 
                value={selectedStaff} 
                onChange={(e) => setSelectedStaff(e.target.value)}
                disabled={globalLoading}
              >
                <option value="">-- Select Staff --</option>
                {staffList.length === 0 ? 
                  <option value="">(No staff loaded)</option> : 
                  staffList.map((staff) => (
                    <option key={staff._id} value={staff._id}>{staff.name || staff.email}</option>
                  ))
                }
              </select>
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-2">Deadline (optional):</label>
              <input 
                type="date" 
                className="w-full border border-gray-300 rounded px-3 py-2" 
                value={staffDeadline} 
                onChange={(e) => setStaffDeadline(e.target.value)} 
                disabled={globalLoading}
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" 
                onClick={() => setShowAssignStaffModal(false)} 
                disabled={globalLoading}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-60" 
                onClick={handleAssignStaff} 
                disabled={globalLoading}
              >
                {globalLoading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Complaint Modal --- */}
      {showComplaintModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Raise Complaint</h3>
              <button className="text-gray-500 hover:text-gray-700 text-2xl" onClick={() => setShowComplaintModal(false)}>×</button>
            </div>

            <div className="mb-4 text-sm text-gray-700">
              {selectedIssue.deadline ? (
                new Date(selectedIssue.deadline) < new Date() ? (
                  <span>Deadline missed on <b>{formatDate(selectedIssue.deadline)}</b>. You can raise a complaint against the responsible department or staff.</span>
                ) : (
                  <span className="text-yellow-700">Deadline not yet missed. Complaints can only be raised after the deadline.</span>
                )
              ) : (
                <span className="text-gray-500">No deadline set for this issue.</span>
              )}
            </div>

            <form onSubmit={handleSubmitComplaint}>
              <textarea 
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3" 
                rows={3} 
                placeholder="Describe the reason for complaint..." 
                value={complaintReason} 
                onChange={(e) => setComplaintReason(e.target.value)} 
                disabled={globalLoading} 
                required 
              />
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  type="button" 
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" 
                  onClick={() => setShowComplaintModal(false)} 
                  disabled={globalLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60" 
                  disabled={globalLoading || !complaintReason.trim() || !selectedIssue.deadline || (new Date(selectedIssue.deadline) > new Date())}
                >
                  {globalLoading ? "Submitting..." : "Submit Complaint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Issues;