
export interface ConnectedDevice {
  id: string;
  device_id: string;
  device_label: string;
  last_seen: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Device {
  deviceId: string;
  label: string;
  isActive?: boolean;
}
