import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../config/axios';
import Cookies from 'js-cookie';

const IssueDetails = () => {
  const { issueId } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIssue = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the correct backend route as per user request
        const token = Cookies.get('accessToken');
        const res = await api.get(`/issues/issues/${issueId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setIssue(res.data.data || res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch issue details');
      } finally {
        setLoading(false);
      }
    };
    fetchIssue();
  }, [issueId]);

  if (loading) return <div className="p-8 text-lg">Loading issue details...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!issue) return <div className="p-8">No issue found.</div>;

  return (
    <div className="max-w-3xl mx-auto bg-gray-50 rounded-2xl shadow-xl p-10 mt-10 border border-gray-200">
      <div className="flex items-center mb-6">
        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg mr-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-blue-800 mb-1 tracking-tight">Issue Details</h2>
          <div className="text-gray-500 text-sm">ID: {issue._id}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <div className="text-gray-600 text-xs font-semibold uppercase">Title</div>
            <div className="text-lg font-semibold text-gray-800">{issue.title || issue.subject || 'N/A'}</div>
          </div>
          <div className="mb-4">
            <div className="text-gray-600 text-xs font-semibold uppercase">Status</div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${issue.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{issue.status || 'N/A'}</span>
          </div>
          <div className="mb-4">
            <div className="text-gray-600 text-xs font-semibold uppercase">Priority</div>
            <div className="text-base text-gray-700">{issue.priority || 'N/A'}</div>
          </div>
        </div>
        <div>
          <div className="mb-4">
            <div className="text-gray-600 text-xs font-semibold uppercase">Reported By</div>
            <div className="text-base text-gray-700">{issue.reportedBy?.name ? `${issue.reportedBy.name} (${issue.reportedBy.email})` : 'N/A'}</div>
          </div>
          <div className="mb-4">
            <div className="text-gray-600 text-xs font-semibold uppercase">Created At</div>
            <div className="text-base text-gray-700">{issue.createdAt ? new Date(issue.createdAt).toLocaleString() : 'N/A'}</div>
          </div>
          <div className="mb-4">
            <div className="text-gray-600 text-xs font-semibold uppercase">Updated At</div>
            <div className="text-base text-gray-700">{issue.updatedAt ? new Date(issue.updatedAt).toLocaleString() : 'N/A'}</div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <div className="text-gray-600 text-xs font-semibold uppercase mb-2">Description</div>
        <div className="text-base text-gray-800 bg-white rounded-lg p-4 border border-gray-100 shadow-sm min-h-[60px]">
          {issue.description || 'N/A'}
        </div>
      </div>
    </div>
  );
};

export default IssueDetails;
