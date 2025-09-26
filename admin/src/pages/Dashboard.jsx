import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiAlertTriangle, FiCheckCircle, FiActivity, FiArrowRight, FiPlus, FiRefreshCw, FiUser, FiShield, FiMapPin } from 'react-icons/fi';
import api from '../config/axios';

const Dashboard = () => {
  const [stats, setStats] = useState([
    { key: 'users', title: 'Total Users', value: 0, icon: FiUsers, color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'issues', title: 'Total Issues', value: 0, icon: FiAlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { key: 'resolved', title: 'Resolved Issues', value: 0, icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { key: 'critical', title: 'Critical Issues', value: 0, icon: FiActivity, color: 'text-rose-600', bg: 'bg-rose-50' },
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
          { key: 'users', title: 'Total Users', value: usersRes.data.data.totalUsers || 0, icon: FiUsers, color: 'text-blue-600', bg: 'bg-blue-50' },
          { key: 'issues', title: 'Total Issues', value: totalIssuesRes.data.data.totalIssues || 0, icon: FiAlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { key: 'resolved', title: 'Resolved Issues', value: resolvedIssuesRes.data.data.resolvedIssues || 0, icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { key: 'critical', title: 'Critical Issues', value: criticalIssuesRes.data.data.criticalIssues || 0, icon: FiActivity, color: 'text-rose-600', bg: 'bg-rose-50' },
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

  const headerDate = useMemo(() => new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date()), []);

  const roleMeta = useMemo(() => ([
    { key: 'ADMIN', label: 'Admins', color: 'bg-indigo-500', icon: FiShield },
    { key: 'DEPARTMENTS', label: 'Departments', color: 'bg-blue-500', icon: FiUsers },
    { key: 'CITIZEN', label: 'Citizens', color: 'bg-emerald-500', icon: FiUser },
  ]), []);

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return { wrap: 'border-rose-300/60 hover:bg-rose-50', badge: 'bg-rose-100 text-rose-700' };
      case 'HIGH':
        return { wrap: 'border-amber-300/60 hover:bg-amber-50', badge: 'bg-amber-100 text-amber-700' };
      case 'MEDIUM':
        return { wrap: 'border-yellow-300/60 hover:bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700' };
      default:
        return { wrap: 'border-slate-200 hover:bg-slate-50', badge: 'bg-slate-100 text-slate-600' };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">{headerDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100"
          >
            <FiRefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => navigate('/issues')}
            className="inline-flex items-center gap-2 rounded-md border border-sky-200 bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-200 active:bg-sky-300"
          >
            <FiArrowRight className="h-4 w-4" /> View All
          </button>
          <button
            onClick={() => navigate('/issues?new=1')}
            className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-200 active:bg-emerald-300"
          >
            <FiPlus className="h-4 w-4" /> New Issue
          </button>
          <button
            onClick={() => navigate('/map')}
            className="inline-flex items-center gap-2 rounded-md border border-green-200 bg-green-100 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-200 active:bg-green-300"
          >
            <FiMapPin className="h-4 w-4" /> Map View
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.key} className="group relative overflow-hidden rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{stat.title}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-800">{stat.value}</p>
                </div>
                <div className={`rounded-lg ${stat.bg} p-3`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full opacity-10 blur-0 transition group-hover:opacity-20 group-hover:blur-sm ${stat.bg}" />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Issues */}
        <div className="xl:col-span-2 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Issues</h2>
            <button
              onClick={() => navigate('/issues')}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              View all <FiArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentIssues.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-slate-500">No recent issues found.</p>
              </div>
            ) : (
              recentIssues.map((issue) => {
                const styles = getPriorityStyles(issue.priority);
                return (
                  <div
                    key={issue._id}
                    className={`flex items-start justify-between gap-4 py-4 cursor-pointer border-l-4 pl-4 rounded ${styles.wrap}`}
                    onClick={() => navigate(`/issues/${issue._id}`)}
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-800">{issue.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{issue.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles.badge}`}>
                          {issue.priority}
                        </span>
                        <span className="text-xs text-slate-500">{issue.status}</span>
                      </div>
                    </div>
                    <FiArrowRight className="mt-1 h-5 w-5 text-slate-300 group-hover:text-slate-400" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Roles */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">User Roles Distribution</h2>
          <div className="space-y-4">
            {roleMeta.map(({ key, label, color, icon: Icon }) => {
              const count = userRoles[key] || 0;
              const percentage = userRoles.total ? Math.round((count / userRoles.total) * 100) : 0;
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-white ${color}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                    </div>
                    <span className="text-sm text-slate-600">{count} users</span>
                  </div>
                  <div className="w-full rounded-full bg-slate-100 h-2">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="text-xs text-slate-500">{percentage}%</div>
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