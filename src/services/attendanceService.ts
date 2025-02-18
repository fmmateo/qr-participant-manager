
import { supabase } from "@/integrations/supabase/client";

export interface QrData {
  name: string;
  email: string;
  qrCode: string;
  timestamp: string;
}

export const sendQrEmail = async (name: string, email: string, qrCode: string) => {
  console.log('Enviando email con QR a:', { name, email, qrCode });
  
  try {
    const { error } = await supabase.functions.invoke('send-qr-email', {
      body: { name, email, qrCode },
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (error) {
      console.error('Error al enviar email:', error);
      throw error;
    }

    return true;
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
    .select('id, name, status')
    .eq('status', 'active')
    .or(`email.eq.${searchQuery},qr_code.eq.${searchQuery}`)
    .single();

  if (participantError || !participant) {
    throw new Error("Participante no encontrado o inactivo");
  }

  const sessionDate = date.toISOString().split('T')[0];

  const { data: existingAttendance, error: checkError } = await supabase
    .from('attendance')
    .select('id, attendance_time')
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

  const { error: attendanceError } = await supabase
    .from('attendance')
    .insert({
      participant_id: participant.id,
      session_date: sessionDate,
      attendance_time: new Date().toISOString(),
      status: 'valid'
    });

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
    participant
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
