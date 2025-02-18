
export interface AdminUser {
  id: string;
  user_id: string;
  is_super_admin: boolean | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUserWithEmail extends Omit<AdminUser, 'user_id'> {
  email: string;
  is_super_admin: boolean;
  is_active: boolean;
}

declare global {
  type Database = {
    public: {
      Tables: {
        admin_users: {
          Row: AdminUser;
          Insert: Omit<AdminUser, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<AdminUser, 'id' | 'created_at' | 'updated_at'>>;
        };
      };
    };
  };
}
