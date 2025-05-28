import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Group {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
  group_members: {
    id: number;
    user_id: number;
    group_id: number;
    is_admin: boolean;
    joined_at: string;
  }[];
}

export default function GroupList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/group/user/groups');
        setGroups(response.data);
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroups();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">No groups</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new group.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Link
          key={group.id}
          to={`/groups/${group.id}`}
          className="relative block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {group.group_members.length} members
            </span>
          </div>
          {group.description && (
            <p className="mt-2 text-sm text-gray-500 line-clamp-2">{group.description}</p>
          )}
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Created {new Date(group.created_at).toLocaleDateString()}
          </div>
        </Link>
      ))}
    </div>
  );
} 