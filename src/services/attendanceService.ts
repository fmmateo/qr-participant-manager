
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
  
  // Usar el índice creado para email y qr_code
  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id, name, status')
    .or(`email.eq."${searchQuery}",qr_code.eq."${searchQuery}"`)
    .eq('status', 'active')
    .single();

  if (participantError) {
    throw new Error("Participante no encontrado o inactivo");
  }

  // Usar el índice compuesto para búsqueda de asistencia
  const { data: existingAttendance, error: checkError } = await supabase
    .from('attendance')
    .select('id, attendance_time')
    .eq('participant_id', participant.id)
    .eq('session_date', date.toISOString().split('T')[0])
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

  // Insertar nuevo registro de asistencia con status
  const { error: attendanceError } = await supabase
    .from('attendance')
    .insert([
      {
        participant_id: participant.id,
        session_date: date.toISOString().split('T')[0],
        attendance_time: new Date().toISOString(),
        status: 'valid'
      }
    ]);

  if (attendanceError) {
    throw attendanceError;
  }

  // Refrescar la vista materializada en segundo plano
  try {
    await supabase.rpc('refresh_attendance_summary');
  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
    // No lanzamos el error ya que no es crítico para el registro de asistencia
  }

  return {
    status: 'success',
    message: `Se registró la asistencia de ${participant.name} correctamente.`,
    participant
  };
};

// Función para obtener el resumen de asistencia usando la vista materializada
export const getAttendanceSummary = async () => {
  const { data, error } = await supabase
    .from('mv_attendance_summary')
    .select('*');

  if (error) {
    throw error;
  }

  return data;
};
