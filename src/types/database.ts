
export interface AdminUser {
  id: string;
  user_id: string;
  is_super_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
        // ... otras tablas existentes
      };
    };
  };
}
