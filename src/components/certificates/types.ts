
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

interface DesignParam {
  type: string;
  url?: string;
  text?: string;
}

interface DesignParams {
  logo_url?: DesignParam;
  signature_url?: DesignParam;
  speaker_signature_url?: DesignParam;
  title?: DesignParam;
  template_html?: DesignParam;
  director_name?: string;
  speaker_name?: string;
}

export interface CertificateDesign {
  id: string;
  name: string;
  format: string;
  metadata: Json;
  design_params: DesignParams;
  template_id?: string;
  created_at: string;
  updated_at: string;
}
