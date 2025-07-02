import api from './api';

export interface GroupMember {
  id: number;
  user_id: number;
  group_id: number;
  is_admin: boolean;
  joined_at: string;
  username: string;
  email: string;
}

export interface GroupDetails {
  id: number;
  name: string;
  description: string;
  radius: number;
  created_by: number;
  created_at: string;
  group_members: GroupMember[];
}

export interface AdminActionResponse {
  success: boolean;
  message: string;
  group?: GroupDetails;
}

export interface AdminGroupUpdate {
  name?: string;
  description?: string;
  radius?: number;
}

export interface AdminPromoteRequest {
  user_id: number;
}

export interface AdminDemoteRequest {
  user_id: number;
}

export const groupAdminService = {
  // Get group details with member information
  getGroupDetails: async (groupId: number): Promise<GroupDetails> => {
    const response = await api.get(`/group/${groupId}/details`);
    return response.data;
  },

  // Admin-only: Update group settings
  updateGroupSettings: async (groupId: number, updateData: AdminGroupUpdate): Promise<AdminActionResponse> => {
    const response = await api.put(`/group/${groupId}/admin/update`, updateData);
    return response.data;
  },

  // Admin-only: Remove a member from the group
  removeMember: async (groupId: number, memberId: number): Promise<AdminActionResponse> => {
    const response = await api.delete(`/group/${groupId}/admin/members/${memberId}`);
    return response.data;
  },

  // Admin-only: Promote a member to admin
  promoteMember: async (groupId: number, userId: number): Promise<AdminActionResponse> => {
    const response = await api.post(`/group/${groupId}/admin/promote`, { user_id: userId });
    return response.data;
  },

  // Admin-only: Demote an admin to regular member
  demoteMember: async (groupId: number, userId: number): Promise<AdminActionResponse> => {
    const response = await api.post(`/group/${groupId}/admin/demote`, { user_id: userId });
    return response.data;
  },

  // Admin-only: Add a new member to the group
  addMember: async (groupId: number, userId: number): Promise<AdminActionResponse> => {
    const response = await api.post(`/group/${groupId}/admin/add-member`, { user_id: userId });
    return response.data;
  },

  // Admin-only: Delete the entire group
  deleteGroup: async (groupId: number): Promise<AdminActionResponse> => {
    const response = await api.delete(`/group/${groupId}/admin/delete`);
    return response.data;
  },

  // Member function: Leave the group
  leaveGroup: async (groupId: number): Promise<AdminActionResponse> => {
    const response = await api.post(`/group/${groupId}/leave`);
    return response.data;
  },

  // Check if current user is admin of a group
  isUserAdmin: (group: GroupDetails, userId: number): boolean => {
    const userMember = group.group_members.find(member => member.user_id === userId);
    return userMember?.is_admin || false;
  },

  // Get admin count for a group
  getAdminCount: (group: GroupDetails): number => {
    return group.group_members.filter(member => member.is_admin).length;
  },

  // Check if user can perform admin actions
  canPerformAdminAction: (group: GroupDetails, userId: number, action: string, targetMember?: GroupMember): boolean => {
    const isAdmin = groupAdminService.isUserAdmin(group, userId);
    if (!isAdmin) return false;

    const adminCount = groupAdminService.getAdminCount(group);

    switch (action) {
      case 'remove':
        if (targetMember?.is_admin && adminCount <= 1) return false;
        return targetMember?.user_id !== userId; // Can't remove yourself
      
      case 'demote':
        if (adminCount <= 1) return false;
        return targetMember?.user_id !== userId; // Can't demote yourself
      
      case 'promote':
        return !targetMember?.is_admin; // Can only promote non-admins
      
      case 'delete':
      case 'update':
        return true;
      
      default:
        return false;
    }
  },

  // Validate group update data
  validateGroupUpdate: (updateData: AdminGroupUpdate): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (updateData.name !== undefined) {
      if (!updateData.name.trim()) {
        errors.push('Group name cannot be empty');
      }
      if (updateData.name.length > 100) {
        errors.push('Group name cannot exceed 100 characters');
      }
    }

    if (updateData.description !== undefined && updateData.description.length > 500) {
      errors.push('Group description cannot exceed 500 characters');
    }

    if (updateData.radius !== undefined) {
      if (updateData.radius <= 0 || updateData.radius > 100) {
        errors.push('Radius must be between 0.1 and 100 kilometers');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

export default groupAdminService; 