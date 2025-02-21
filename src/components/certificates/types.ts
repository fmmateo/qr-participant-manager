
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

interface DesignParam<T> {
  type: string;
  [key: string]: T | string;
}

interface ImageParam extends DesignParam<string> {
  url: string;
  type: 'image';
}

interface TextParam extends DesignParam<string> {
  text: string;
  type: 'text' | 'html';
}

export interface CertificateDesignParams {
  title?: TextParam;
  logo_url?: ImageParam;
  signature_url?: ImageParam;
  template_html?: TextParam;
}

export interface CertificateDesign {
  id: string;
  name: string;
  format: string;
  metadata: Json;
  design_params: CertificateDesignParams;
  template_id?: string;
  created_at: string;
  updated_at: string;
}
