
import type { Json } from "@/integrations/supabase/types";

export interface Program {
  id: string;
  name: string;
  type: string;
}

export interface Template {
  id: string;
  name: string;
  template_url: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
}

export interface CertificateDesign {
  id: string;
  name: string;
  format: string;
  metadata: Json;
  design_params: Json;
  template_id?: string;
  created_at: string;
  updated_at: string;
}

