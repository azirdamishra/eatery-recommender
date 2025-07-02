import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
  const { user } = useAuth();

  const isUserAdmin = (group: Group): boolean => {
    if (!user) return false;
    const userMember = group.group_members.find(member => member.user_id === user.id);
    return userMember?.is_admin || false;
  };

  const getAdminCount = (group: Group): number => {
    return group.group_members.filter(member => member.is_admin).length;
  };

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
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No groups yet</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new group with your friends.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => {
        const userIsAdmin = isUserAdmin(group);
        const adminCount = getAdminCount(group);
        
        return (
          <Link
            key={group.id}
            to={`/groups/${group.id}`}
            className="relative block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200"
          >
            {/* Admin Badge */}
            {userIsAdmin && (
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                  </svg>
                  Admin
                </span>
              </div>
            )}
            
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate pr-16">{group.name}</h3>
                {group.description && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{group.description}</p>
                )}
              </div>
            </div>
            
            {/* Group Stats */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  {group.group_members.length} member{group.group_members.length !== 1 ? 's' : ''}
                </span>
                
                {adminCount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                    </svg>
                    {adminCount} admin{adminCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Created {new Date(group.created_at).toLocaleDateString()}
            </div>
            
            {/* Hover indicator */}
            <div className="absolute inset-0 rounded-lg ring-2 ring-transparent group-hover:ring-blue-500 transition-all duration-200 pointer-events-none"></div>
          </Link>
        );
      })}
    </div>
  );
} 