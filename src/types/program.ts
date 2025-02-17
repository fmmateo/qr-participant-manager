
export interface Program {
  id: string;
  name: string;
  type: 'curso' | 'taller' | 'diplomado';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
