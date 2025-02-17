
import { supabase } from "@/integrations/supabase/client";

export interface QrData {
  name: string;
  email: string;
  qrCode: string;
  timestamp: string;
}

export const registerAttendance = async (
  participantIdentifier: string,
  date: Date
) => {
  console.log('Procesando identificador:', participantIdentifier);
  
  let searchQuery;
  
  try {
    const qrData: QrData = JSON.parse(participantIdentifier);
    searchQuery = qrData.qrCode;
    console.log('Datos del QR:', qrData);
  } catch {
    searchQuery = participantIdentifier;
  }
  
  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id, name')
    .or(`email.eq."${searchQuery}",qr_code.eq."${searchQuery}"`)
    .single();

  if (participantError) {
    throw new Error("Participante no encontrado");
  }

  const { data: existingAttendance, error: checkError } = await supabase
    .from('attendance')
    .select('id, attendance_time')
    .eq('participant_id', participant.id)
    .eq('session_date', date.toISOString().split('T')[0])
    .maybeSingle();

  if (checkError) {
    throw checkError;
  }

  if (existingAttendance) {
    const attendanceTime = new Date(existingAttendance.attendance_time).toLocaleTimeString();
    return {
      status: 'already_registered',
      message: `${participant.name} ya registró asistencia hoy a las ${attendanceTime}`,
      participant
    };
  }

  const { error: attendanceError } = await supabase
    .from('attendance')
    .insert([
      {
        participant_id: participant.id,
        session_date: date.toISOString().split('T')[0],
        attendance_time: new Date().toISOString(),
      }
    ]);

  if (attendanceError) {
    throw attendanceError;
  }

  return {
    status: 'success',
    message: `Se registró la asistencia de ${participant.name} correctamente.`,
    participant
  };
};
