
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Participant {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface Attendance {
  id: string;
  participant_id: string;
  session_date: string;
  attendance_time: string;
  participant: Participant;
}

interface AttendanceTableProps {
  attendanceRecords: Attendance[];
}

export const AttendanceTable = ({ attendanceRecords }: AttendanceTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Participante</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Fecha de Sesión</TableHead>
          <TableHead>Hora de Registro</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {attendanceRecords.map((record) => (
          <TableRow key={record.id}>
            <TableCell>{record.participant?.name}</TableCell>
            <TableCell>{record.participant?.email}</TableCell>
            <TableCell>
              {new Date(record.session_date).toLocaleDateString()}
            </TableCell>
            <TableCell>
              {new Date(record.attendance_time).toLocaleTimeString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
