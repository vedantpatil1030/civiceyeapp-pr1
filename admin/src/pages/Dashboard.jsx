import { mockUsers, mockIssues } from '../data/mockData';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Users',
      value: mockUsers.length,
      icon: '👥',
      bgColor: 'bg-blue-500',
    },
    {
      title: 'Total Issues',
      value: mockIssues.length,
      icon: '⚠️',
      bgColor: 'bg-yellow-500',
    },
    {
      title: 'Resolved Issues',
      value: mockIssues.filter(issue => issue.status === 'RESOLVED').length,
      icon: '✅',
      bgColor: 'bg-green-500',
    },
    {
      title: 'Critical Issues',
      value: mockIssues.filter(issue => issue.priority === 'CRITICAL').length,
      icon: '🚨',
      bgColor: 'bg-red-500',
    },
  ];

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
            {mockIssues.slice(0, 3).map((issue) => (
              <div key={issue._id} className="border-l-4 border-blue-500 pl-4 py-2">
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
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">User Roles Distribution</h2>
          <div className="space-y-3">
            {['ADMIN', 'DEPARTMENTS', 'CITIZEN'].map((role) => {
              const count = mockUsers.filter(user => user.role === role).length;
              const percentage = (count / mockUsers.length) * 100;
              
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