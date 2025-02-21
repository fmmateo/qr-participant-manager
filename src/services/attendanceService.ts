
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ParticipantRow = Database['public']['Tables']['participants']['Row'];
type AttendanceRow = Database['public']['Tables']['attendance']['Row'];

export interface QrData {
  name: string;
  email: string;
  qrCode: string;
  timestamp: string;
}

export const sendQrEmail = async (name: string, email: string, qrCode: string) => {
  console.log('Enviando email con QR a:', { name, email, qrCode });
  
  try {
    const { data, error } = await supabase.functions.invoke('send-qr-email', {
      body: { 
        name: name.trim(), 
        email: email.toLowerCase().trim(), 
        qrCode 
      }
    });

    if (error) {
      console.error('Error al enviar email:', error);
      throw error;
    }

    console.log('Respuesta del servidor:', data);
    return data;
  } catch (error) {
    console.error('Error en sendQrEmail:', error);
    throw error;
  }
};

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
    .select('*')
    .eq('status', 'active')
    .or(`email.eq.${searchQuery},qr_code.eq.${searchQuery}`)
    .single();

  if (participantError || !participant) {
    throw new Error("Participante no encontrado o inactivo");
  }

  const sessionDate = date.toISOString().split('T')[0];

  const { data: existingAttendance, error: checkError } = await supabase
    .from('attendance')
    .select('*')
    .eq('participant_id', participant.id)
    .eq('session_date', sessionDate)
    .eq('status', 'valid')
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

  const { data: newAttendance, error: attendanceError } = await supabase
    .from('attendance')
    .insert([{
      participant_id: participant.id,
      session_date: sessionDate,
      attendance_time: new Date().toISOString(),
      status: 'valid'
    }])
    .select()
    .single();

  if (attendanceError) {
    throw attendanceError;
  }

  try {
    await supabase.rpc('refresh_attendance_summary');
  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
  }

  return {
    status: 'success',
    message: `Se registró la asistencia de ${participant.name} correctamente.`,
    participant,
    attendance: newAttendance
  };
};

export const getAttendanceSummary = async () => {
  const { data, error } = await supabase
    .from('mv_attendance_summary')
    .select('*');

  if (error) {
    throw error;
  }

  return data;
};
