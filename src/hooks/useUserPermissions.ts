import { useSelector } from 'react-redux';
import { RootState } from '../store';

export type UserRole = 'user' | 'support_agent' | 'moderator' | 'treasurer' | 'admin';

export interface UserPermissions {
  // Permissions tickets
  canViewAllTickets: boolean;
  canAssignTickets: boolean;
  canEscalateTickets: boolean;
  canViewTicketStats: boolean;
  canModerateTickets: boolean;
  canCreateTickets: boolean;
  
  // Permissions paiements
  canViewAllPayments: boolean;
  canManageRefunds: boolean;
  canViewPaymentStats: boolean;
  
  // Permissions utilisateurs
  canViewAllUsers: boolean;
  canManageUsers: boolean;
  
  // Permissions générales
  isAdmin: boolean;
  isSupportRole: boolean;
  isFinanceRole: boolean;
  canAccessAdminFeatures: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  user: ['read_own_profile', 'update_own_profile', 'create_donation', 'create_ticket'],
  support_agent: ['read_users', 'update_tickets', 'read_donations', 'moderate_content'],
  moderator: ['read_users', 'update_tickets', 'read_donations', 'moderate_content'],
  treasurer: ['read_all_donations', 'read_payments', 'generate_reports', 'manage_refunds'],
  admin: ['*'], // Toutes les permissions
};

const useUserPermissions = (): UserPermissions => {
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = (user?.role as UserRole) || 'user';

  const hasPermission = (permission: string): boolean => {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes('*') || rolePermissions.includes(permission);
  };

  const isRole = (roles: UserRole | UserRole[]): boolean => {
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(userRole);
  };

  const permissions: UserPermissions = {
    // Permissions tickets
    canViewAllTickets: isRole(['admin', 'moderator', 'support_agent']),
    canAssignTickets: isRole(['admin', 'moderator', 'support_agent']),
    canEscalateTickets: isRole(['admin', 'moderator', 'support_agent']),
    canViewTicketStats: isRole(['admin', 'moderator', 'support_agent']),
    canModerateTickets: hasPermission('moderate_content'),
    canCreateTickets: userRole === 'user',
    
    // Permissions paiements
    canViewAllPayments: isRole(['admin', 'treasurer']),
    canManageRefunds: hasPermission('manage_refunds'),
    canViewPaymentStats: isRole(['admin', 'treasurer']),
    
    // Permissions utilisateurs
    canViewAllUsers: hasPermission('read_users'),
    canManageUsers: isRole(['admin']),
    
    // Permissions générales
    isAdmin: isRole('admin'),
    isSupportRole: isRole(['admin', 'moderator', 'support_agent']),
    isFinanceRole: isRole(['admin', 'treasurer']),
    canAccessAdminFeatures: isRole(['admin', 'moderator', 'support_agent', 'treasurer']),
  };

  return permissions;
};

export const getUserRoleLabel = (role: UserRole | undefined | null): string => {
  if (!role) return 'Utilisateur';
  
  const labels: Record<UserRole, string> = {
    user: 'Utilisateur',
    support_agent: 'Agent Support',
    moderator: 'Modérateur',
    treasurer: 'Trésorier',
    admin: 'Administrateur',
  };
  return labels[role] || 'Utilisateur';
};

export const getUserRoleColor = (role: UserRole | undefined | null): string => {
  if (!role) return '#2196F3';
  
  const colors: Record<UserRole, string> = {
    user: '#2196F3',
    support_agent: '#4CAF50',
    moderator: '#FF9800',
    treasurer: '#9C27B0',
    admin: '#F44336',
  };
  return colors[role] || '#2196F3';
};

export default useUserPermissions; 