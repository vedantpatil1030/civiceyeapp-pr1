import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiUserPlus, FiSearch } from 'react-icons/fi';
import { useToast } from '../hooks/useToast';
import { mockDepartments, mockStaff, mockIssues } from '../data/mockData';

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
    // Simulate API fetch with mock data
    setLoading(true);
    setTimeout(() => {
      setDepartments(mockDepartments);
      setStaff(mockStaff);
      // Filter issues that have classifiedDept assigned
      setIssues(mockIssues.filter(issue => issue.classifiedDept));
      setLoading(false);
    }, 500);
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
    return issues.filter(issue => issue.classifiedDept === deptId);
  };

  const getDepartmentStaff = (deptId) => {
    return staff.filter(s => s.department === deptId);
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

                <p className="text-gray-600 mb-4">{department.description}</p>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Department Head</h3>
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-800">
                        {department.head[0]}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{department.head}</p>
                      <p className="text-sm text-gray-500">{department.email}</p>
                    </div>
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
                              {staffMember.name[0]}
                            </span>
                          </div>
                          <span className="ml-2 text-sm text-gray-600">{staffMember.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{staffMember.role}</span>
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
                          ${issue.status === 'REJECTED' ? 'bg-red-100 text-red-800' : ''}
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
