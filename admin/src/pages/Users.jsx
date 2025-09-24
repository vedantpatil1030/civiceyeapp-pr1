import React, { useState, useEffect } from 'react';
import { FiTrash2, FiUserPlus, FiSearch, FiEdit2 } from 'react-icons/fi';
import { useToast } from '../hooks/useToast';
import api from '../config/axios';
import Cookies from 'js-cookie';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  // const [editingUser, setEditingUser] = useState(null);
  const toast = useToast();

  // 🔹 Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get('accessToken');
      const res = await api.get('/stats/getAllUsers', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      console.log('Users API response:', res.data);

      // Support both res.data.data.users and res.data.users
      const userList = res.data?.data?.users || res.data?.users || [];
      setUsers(Array.isArray(userList) ? userList : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔹 Add user (mock for now)
  const handleAddUser = (userData) => {
    const newUser = {
      _id: Math.random().toString(36).substr(2, 9),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      __v: 0
    };
    setUsers([...users, newUser]);
    toast.success('User added successfully');
    setShowAddModal(false);
  };

  // 🔹 Edit user
  const handleEditUser = (userId, updatedData) => {
    const updatedUsers = users.map((u) =>
      u._id === userId ? { ...u, ...updatedData, updatedAt: new Date().toISOString() } : u
    );
    setUsers(updatedUsers);
    toast.success('User updated successfully');
    setEditingUser(null);
  };

  // 🔹 Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/stats/delete/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete user';
      toast.error(errorMsg);
    }
  };

  // 🔹 Date formatter
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 🔹 Search + filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.mobileNumber || '').includes(searchTerm);

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
        role="alert"
      >
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Users Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition duration-200"
        >
          <FiUserPlus className="w-5 h-5" />
          Add New User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="CITIZEN">Citizen</option>
          <option value="DEPARTMENT">Department</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Full Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mobile Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aadhar Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gender
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-sky-950 divide-y bg-sky-950">
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4">{user.fullName || 'N/A'}</td>
                <td className="px-6 py-4">{user.email || 'N/A'}</td>
                <td className="px-6 py-4">{user.mobileNumber || 'N/A'}</td>
                <td className="px-6 py-4">{user.aadharNumber || 'N/A'}</td>
                <td className="px-6 py-4">{user.gender || 'N/A'}</td>
                <td className="px-6 py-4">{user.role || 'N/A'}</td>
                <td className="px-6 py-4">{formatDate(user.createdAt)}</td>
                <td className="px-6 py-4 text-center flex gap-2 justify-center">

                  {/* <button
                    onClick={() => setEditingUser(user)}
                    className="text-blue-500 hover:text-blue-700"
                  > */}
                    {/* <FiEdit2 />
                  </button> */}

                  <button
                    onClick={() => setEditingUser(user)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <FiEdit2 />
                  </button>

                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Add New User</h2>
            <UserForm
              onSubmit={handleAddUser}
              onCancel={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
