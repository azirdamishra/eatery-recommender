import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import AddGroupMember from './AddGroupMember';

interface GroupMember {
  id: number;
  user_id: number;
  group_id: number;
  is_admin: boolean;
  joined_at: string;
  username: string;
  email: string;
}

interface GroupDetails {
  id: number;
  name: string;
  description: string;
  radius: number;
  created_by: number;
  created_at: string;
  group_members: GroupMember[];
}

interface AdminAction {
  type: 'remove' | 'promote' | 'demote' | 'update' | 'delete' | 'leave' | 'add_member';
  member?: GroupMember;
  data?: any;
}

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Admin actions state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<AdminAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Group settings edit state
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    radius: 5.0
  });

  // Add member state
  const [showAddMember, setShowAddMember] = useState(false);

  const isUserAdmin = (): boolean => {
    if (!user || !group) return false;
    const userMember = group.group_members.find(member => member.user_id === user.id);
    return userMember?.is_admin || false;
  };

  const getAdminCount = (): number => {
    return group?.group_members.filter(member => member.is_admin).length || 0;
  };

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/group/${groupId}/details`);
      setGroup(response.data);
      setEditForm({
        name: response.data.name,
        description: response.data.description || '',
        radius: response.data.radius
      });
    } catch (err: any) {
      console.error('Error fetching group details:', err);
      setError(err.response?.data?.detail || 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  // Clear messages after timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const showConfirmation = (action: AdminAction) => {
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !group) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      switch (confirmAction.type) {
        case 'remove':
          await api.delete(`/group/${group.id}/admin/members/${confirmAction.member?.user_id}`);
          setSuccess(`${confirmAction.member?.username} has been removed from the group`);
          break;
          
        case 'promote':
          await api.post(`/group/${group.id}/admin/promote`, {
            user_id: confirmAction.member?.user_id
          });
          setSuccess(`${confirmAction.member?.username} has been promoted to admin`);
          break;
          
        case 'demote':
          await api.post(`/group/${group.id}/admin/demote`, {
            user_id: confirmAction.member?.user_id
          });
          setSuccess(`${confirmAction.member?.username} has been demoted to member`);
          break;
          
        case 'update':
          await api.put(`/group/${group.id}/admin/update`, confirmAction.data);
          setSuccess('Group settings updated successfully');
          setIsEditingSettings(false);
          break;
          
        case 'delete':
          await api.delete(`/group/${group.id}/admin/delete`);
          setSuccess('Group deleted successfully');
          setTimeout(() => navigate('/groups'), 2000);
          break;
          
        case 'leave':
          await api.post(`/group/${group.id}/leave`);
          setSuccess('Left group successfully');
          setTimeout(() => navigate('/groups'), 2000);
          break;
      }

      // Refresh group details after successful action (except delete/leave)
      if (confirmAction.type !== 'delete' && confirmAction.type !== 'leave') {
        await fetchGroupDetails();
      }
      
    } catch (err: any) {
      console.error('Error performing action:', err);
      setError(err.response?.data?.detail || 'Failed to perform action');
    } finally {
      setActionLoading(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const handleUpdateSettings = () => {
    if (!editForm.name.trim()) {
      setError('Group name is required');
      return;
    }
    
    showConfirmation({
      type: 'update',
      data: {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        radius: editForm.radius
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-red-600">Group not found or you don't have access to this group.</p>
        </div>
      </div>
    );
  }

  const userAdmin = isUserAdmin();
  const adminCount = getAdminCount();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/groups')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <div className="flex items-center mt-1 space-x-4">
                <span className="text-sm text-gray-500">
                  {group.group_members.length} member{group.group_members.length !== 1 ? 's' : ''}
                </span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">
                  {adminCount} admin{adminCount !== 1 ? 's' : ''}
                </span>
                {userAdmin && (
                  <>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                      </svg>
                      You're an admin
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {userAdmin && (
              <button
                onClick={() => setIsEditingSettings(!isEditingSettings)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            )}
            
            <button
              onClick={() => showConfirmation({ type: 'leave' })}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Leave Group
            </button>
          </div>
        </div>

        {group.description && (
          <p className="mt-4 text-gray-600">{group.description}</p>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        </div>
      )}

      {/* Group Settings Edit */}
      {isEditingSettings && userAdmin && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Group Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Group Name
              </label>
              <input
                type="text"
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700">
                Search Radius (km)
              </label>
              <input
                type="number"
                id="radius"
                min="0.1"
                max="100"
                step="0.1"
                value={editForm.radius}
                onChange={(e) => setEditForm({ ...editForm, radius: parseFloat(e.target.value) || 5.0 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setIsEditingSettings(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateSettings}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Add Member Component */}
      {showAddMember && userAdmin && (
        <div className="mb-6">
          <AddGroupMember
            groupId={parseInt(groupId!)}
            currentMembers={group.group_members.map(member => member.user_id)}
            onMemberAdded={() => {
              fetchGroupDetails();
              setShowAddMember(false);
            }}
            onCancel={() => setShowAddMember(false)}
          />
        </div>
      )}

      {/* Members List */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">Group Members</h2>
          <div className="flex items-center space-x-3">
            {userAdmin && (
              <button
                onClick={() => setShowAddMember(true)}
                className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Member
              </button>
            )}
            {userAdmin && (
              <button
                onClick={() => showConfirmation({ type: 'delete' })}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Group
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          {group.group_members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {member.username[0].toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">{member.username}</p>
                    {member.is_admin && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                        </svg>
                        Admin
                      </span>
                    )}
                    {member.user_id === group.created_by && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Creator
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{member.email}</p>
                  <p className="text-xs text-gray-400">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {/* Admin Actions */}
              {userAdmin && member.user_id !== user?.id && (
                <div className="flex items-center space-x-2">
                  {member.is_admin ? (
                    <button
                      onClick={() => showConfirmation({ type: 'demote', member })}
                      disabled={adminCount <= 1}
                      className="inline-flex items-center px-2 py-1 border border-yellow-300 text-xs font-medium rounded text-yellow-700 bg-white hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={adminCount <= 1 ? "Cannot demote the last admin" : "Demote to member"}
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Demote
                    </button>
                  ) : (
                    <button
                      onClick={() => showConfirmation({ type: 'promote', member })}
                      className="inline-flex items-center px-2 py-1 border border-green-300 text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      Promote
                    </button>
                  )}
                  
                  <button
                    onClick={() => showConfirmation({ type: 'remove', member })}
                    disabled={member.is_admin && adminCount <= 1}
                    className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={member.is_admin && adminCount <= 1 ? "Cannot remove the last admin" : "Remove from group"}
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                confirmAction.type === 'delete' || confirmAction.type === 'remove' ? 'bg-red-100' :
                confirmAction.type === 'leave' ? 'bg-yellow-100' :
                confirmAction.type === 'demote' ? 'bg-orange-100' :
                'bg-blue-100'
              }`}>
                {(confirmAction.type === 'delete' || confirmAction.type === 'remove') && (
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {confirmAction.type === 'leave' && (
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {(confirmAction.type === 'promote' || confirmAction.type === 'update') && (
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {confirmAction.type === 'demote' && (
                  <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmAction.type === 'remove' && `Remove ${confirmAction.member?.username}`}
                {confirmAction.type === 'promote' && `Promote ${confirmAction.member?.username}`}
                {confirmAction.type === 'demote' && `Demote ${confirmAction.member?.username}`}
                {confirmAction.type === 'update' && 'Update Group Settings'}
                {confirmAction.type === 'delete' && 'Delete Group'}
                {confirmAction.type === 'leave' && 'Leave Group'}
              </h3>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              {confirmAction.type === 'remove' && 
                `Are you sure you want to remove ${confirmAction.member?.username} from the group? This action cannot be undone.`
              }
              {confirmAction.type === 'promote' && 
                `Are you sure you want to promote ${confirmAction.member?.username} to admin? They will have full admin privileges.`
              }
              {confirmAction.type === 'demote' && 
                `Are you sure you want to demote ${confirmAction.member?.username} from admin to regular member?`
              }
              {confirmAction.type === 'update' && 
                'Are you sure you want to save these changes to the group settings?'
              }
              {confirmAction.type === 'delete' && 
                `Are you sure you want to permanently delete "${group.name}"? This action cannot be undone and all members will be removed.`
              }
              {confirmAction.type === 'leave' && 
                `Are you sure you want to leave "${group.name}"? ${userAdmin && adminCount <= 1 ? 'As the last admin, the group will be deleted.' : ''}`
              }
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                  confirmAction.type === 'delete' || confirmAction.type === 'remove' ? 'bg-red-600 hover:bg-red-700' :
                  confirmAction.type === 'leave' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {actionLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    {confirmAction.type === 'remove' && 'Remove Member'}
                    {confirmAction.type === 'promote' && 'Promote to Admin'}
                    {confirmAction.type === 'demote' && 'Demote to Member'}
                    {confirmAction.type === 'update' && 'Save Changes'}
                    {confirmAction.type === 'delete' && 'Delete Group'}
                    {confirmAction.type === 'leave' && 'Leave Group'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 