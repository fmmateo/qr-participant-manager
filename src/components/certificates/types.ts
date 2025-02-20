
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
  metadata?: string;
  design_params: {
    params: Array<{
      name: string;
      text?: string;
      color?: string;
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: string;
      borderRadius?: string;
      opacity?: number;
      imageUrl?: string;
    }>;
  };
  template_id?: string;
}

