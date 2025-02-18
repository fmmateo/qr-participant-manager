
export interface ConnectedDevice {
  id: string;
  device_id: string;
  device_label: string;
  device_type: 'camera' | 'usb' | 'mobile';
  last_seen: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Device {
  deviceId: string;
  label: string;
  type: 'camera' | 'usb' | 'mobile';
  isActive?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  qr_code: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  participant_id: string;
  session_date: string;
  attendance_time: string;
  status: string;
  created_at: string;
  updated_at: string;
  participant?: Participant;
}
