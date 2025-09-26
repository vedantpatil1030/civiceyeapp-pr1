import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiUserPlus, FiSearch } from 'react-icons/fi';
import { useToast } from '../hooks/useToast';
import api from '../config/axios';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Fetch departments (public route)
        const depRes = await api.get('/departments/get-all-departments');
        const deps = (depRes.data?.data || []).map(d => ({
          _id: d._id,
          name: d.name || d.departmentName || d.type || 'Department',
          type: d.type,
          email: d.email,
          phone: d.phone,
        }));
        setDepartments(deps);

        // Fetch all issues once and group by department
        let allIssues = [];
        try {
          const issuesRes = await api.get('/issues/all');
          allIssues = issuesRes.data?.data || issuesRes.data?.issues || [];
        } catch (e) {
          allIssues = [];
        }
        const issuesByDept = deps.reduce((acc, d) => {
          acc[d._id] = allIssues.filter(i => (i.finalDept || i.assignedDept) === (d.type || d.name));
          return acc;
        }, {});
        setIssues(issuesByDept);

        // Fetch members per department (few requests only)
        const membersList = await Promise.all(
          deps.map(async (d) => {
            try {
              const res = await api.get(`/departments/${d.type || d.name}/members`);
              return { key: d._id, members: res.data?.data?.members || [] };
            } catch {
              return { key: d._id, members: [] };
            }
          })
        );
        const staffByDept = membersList.reduce((acc, cur) => { acc[cur.key] = cur.members; return acc; }, {});
        setStaff(staffByDept);
      } catch (e) {
        toast.error('Failed to load departments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddDepartment = (departmentData) => {
    const newDepartment = {
      _id: Math.random().toString(36).substr(2, 9),
      ...departmentData,
      createdAt: new Date().toISOString()
    };
    setDepartments([...departments, newDepartment]);
    toast.success('Department added successfully');
    setShowAddDepartmentModal(false);
  };

  const handleAddStaff = (staffData) => {
    const newStaff = {
      _id: Math.random().toString(36).substr(2, 9),
      ...staffData,
      joinedAt: new Date().toISOString()
    };
    setStaff([...staff, newStaff]);
    toast.success('Staff member added successfully');
    setShowAddStaffModal(false);
  };

  const handleDeleteDepartment = (deptId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    setDepartments(departments.filter(dept => dept._id !== deptId));
    toast.success('Department deleted successfully');
  };

  const handleDeleteStaff = (staffId) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    setStaff(staff.filter(s => s._id !== staffId));
    toast.success('Staff member removed successfully');
  };

  const getDepartmentIssues = (deptId) => {
    return issues[deptId] || [];
  };

  const getDepartmentStaff = (deptId) => {
    return staff[deptId] || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Departments Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition duration-200"
          >
            <FiUserPlus className="w-5 h-5" />
            Add Staff
          </button>
          <button
            onClick={() => setShowAddDepartmentModal(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition duration-200"
          >
            <FiPlus className="w-5 h-5" />
            Add Department
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments
          .filter(dept => dept.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((department) => (
            <div
              key={department._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">{department.name}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDepartment(department)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(department._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">Type: {department.type || 'N/A'}</p>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contact</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>Email: {department.email || '—'}</p>
                    <p>Phone: {department.phone || '—'}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-500">Staff Members</h3>
                    <span className="text-sm text-gray-500">
                      {getDepartmentStaff(department._id).length} members
                    </span>
                  </div>
                  <div className="space-y-2">
                    {getDepartmentStaff(department._id).map(staffMember => (
                      <div key={staffMember._id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {(staffMember.name || 'S')[0]}
                            </span>
                          </div>
                          <span className="ml-2 text-sm text-gray-600">{staffMember.name || staffMember.email || 'Staff'}</span>
                        </div>
                        <span className="text-xs text-gray-500">{staffMember.role || 'STAFF'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-500">Assigned Issues</h3>
                    <span className="text-sm text-gray-500">
                      {getDepartmentIssues(department._id).length} issues
                    </span>
                  </div>
                  <div className="space-y-2">
                    {getDepartmentIssues(department._id).map(issue => (
                      <div key={issue._id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{issue.title}</span>
                        <span className={`px-2 py-1 text-xs rounded-full
                          ${issue.status === 'REPORTED' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${issue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : ''}
                          ${issue.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : ''}
                          ${issue.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : ''}
                        `}>
                          {issue.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Add Department Modal */}
      {showAddDepartmentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Add New Department</h2>
            {/* Add form here */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddDepartmentModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddDepartment({
                  name: 'New Department',
                  description: 'Department Description',
                  head: 'Department Head',
                  email: 'department@email.com',
                  phone: '1234567890'
                })}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Add New Staff Member</h2>
            {/* Add form here */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddStaff({
                  name: 'New Staff',
                  email: 'staff@email.com',
                  phone: '1234567890',
                  department: departments[0]._id,
                  role: 'STAFF'
                })}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
