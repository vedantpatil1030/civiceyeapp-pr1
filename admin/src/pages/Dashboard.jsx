
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';

const Dashboard = () => {
  const [stats, setStats] = useState([
    { title: 'Total Users', value: 0, icon: '👥', bgColor: 'bg-blue-500' },
    { title: 'Total Issues', value: 0, icon: '⚠️', bgColor: 'bg-yellow-500' },
    { title: 'Resolved Issues', value: 0, icon: '✅', bgColor: 'bg-green-500' },
    { title: 'Critical Issues', value: 0, icon: '🚨', bgColor: 'bg-red-500' },
  ]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [userRoles, setUserRoles] = useState({ ADMIN: 0, DEPARTMENTS: 0, CITIZEN: 0, total: 0 });

  const navigate = useNavigate();
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, totalIssuesRes, resolvedIssuesRes, criticalIssuesRes, recentIssuesRes, userRolesRes] = await Promise.all([
          api.get('/stats/users/total'),
          api.get('/stats/issues/total'),
          api.get('/stats/issues/resolved'),
          api.get('/stats/issues/critical'),
          api.get('/stats/issues/recent'),
          api.get('/stats/users/roles-distribution'),
        ]);

        setStats([
          { title: 'Total Users', value: usersRes.data.data.totalUsers || 0, icon: '👥', bgColor: 'bg-blue-500' },
          { title: 'Total Issues', value: totalIssuesRes.data.data.totalIssues || 0, icon: '⚠️', bgColor: 'bg-yellow-500' },
          { title: 'Resolved Issues', value: resolvedIssuesRes.data.data.resolvedIssues || 0, icon: '✅', bgColor: 'bg-green-500' },
          { title: 'Critical Issues', value: criticalIssuesRes.data.data.criticalIssues || 0, icon: '🚨', bgColor: 'bg-red-500' },
        ]);
        setRecentIssues(recentIssuesRes.data.data.recentIssues || []);

        // Set user roles distribution
        const roles = userRolesRes.data.data.roleCounts || {};
        const total = userRolesRes.data.data.total || 0;
        setUserRoles({
          ADMIN: (roles.MUNICIPAL_ADMIN || 0) + (roles.DEPARTMENT_ADMIN || 0),
          DEPARTMENTS: roles.DEPARTMENT_ADMIN || 0,
          CITIZEN: roles.CITIZEN || 0,
          total,
        });
      } catch (err) {
        // handle error, optionally show toast
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg text-white text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Issues</h2>
          <div className="space-y-3">
            {recentIssues.length === 0 ? (
              <p className="text-gray-500">No recent issues found.</p>
            ) : (
              recentIssues.map((issue) => (
                <div
                  key={issue._id}
                  className="border-l-4 border-blue-500 pl-4 py-2 cursor-pointer hover:bg-blue-50"
                  onClick={() => navigate(`/issues/${issue._id}`)}
                >
                  <h3 className="font-semibold text-gray-800">{issue.title}</h3>
                  <p className="text-sm text-gray-600">{issue.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      issue.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                      issue.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                      issue.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {issue.priority}
                    </span>
                    <span className="text-xs text-gray-500">{issue.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">User Roles Distribution</h2>
          <div className="space-y-3">
            {['ADMIN', 'DEPARTMENTS', 'CITIZEN'].map((role) => {
              const count = userRoles[role] || 0;
              const percentage = userRoles.total ? (count / userRoles.total) * 100 : 0;
              return (
                <div key={role}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{role}</span>
                    <span className="text-sm text-gray-600">{count} users</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;