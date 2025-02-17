
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

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
  onUpdate: (id: string, data: { session_date: string; attendance_time: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const AttendanceTable = ({ 
  attendanceRecords,
  onUpdate,
  onDelete 
}: AttendanceTableProps) => {
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [formData, setFormData] = useState({
    session_date: "",
    attendance_time: "",
  });

  const handleEdit = (record: Attendance) => {
    setEditingRecord(record);
    setFormData({
      session_date: record.session_date.split('T')[0],
      attendance_time: new Date(record.attendance_time).toTimeString().split(' ')[0]
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    await onUpdate(editingRecord.id, formData);
    setEditingRecord(null);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Participante</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Fecha de Sesión</TableHead>
          <TableHead>Hora de Registro</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
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
            <TableCell className="text-right space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(record)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Registro de Asistencia</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="session_date">Fecha de Sesión</Label>
                      <Input
                        id="session_date"
                        type="date"
                        value={formData.session_date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            session_date: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attendance_time">Hora de Registro</Label>
                      <Input
                        id="attendance_time"
                        type="time"
                        value={formData.attendance_time}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            attendance_time: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Actualizar
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(record.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
