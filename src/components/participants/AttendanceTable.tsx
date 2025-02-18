
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
import { Pencil, Trash2, Download, Eye } from "lucide-react";
import { useState, useMemo } from "react";
import type { AttendanceRecord } from "../attendance/types";

interface AttendanceTableProps {
  attendanceRecords: AttendanceRecord[];
  onUpdate: (id: string, data: { session_date: string; attendance_time: string; status: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const AttendanceTable = ({ 
  attendanceRecords,
  onUpdate,
  onDelete 
}: AttendanceTableProps) => {
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [formData, setFormData] = useState({
    session_date: "",
    attendance_time: "",
    status: "valid"
  });
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');

  // Agrupar registros por fecha
  const groupedRecords = useMemo(() => {
    const groups = new Map<string, AttendanceRecord[]>();
    
    attendanceRecords.forEach(record => {
      const date = new Date(record.session_date).toLocaleDateString();
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)?.push(record);
    });

    return new Map([...groups.entries()].sort().reverse());
  }, [attendanceRecords]);

  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setFormData({
      session_date: record.session_date.split('T')[0],
      attendance_time: new Date(record.attendance_time).toTimeString().split(' ')[0],
      status: record.status || 'valid'
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    await onUpdate(editingRecord.id, formData);
    setEditingRecord(null);
  };

  const exportToCSV = () => {
    // Preparar los datos para exportar
    const csvRows = [
      // Encabezados
      ['Fecha', 'Participante', 'Email', 'Hora de Registro', 'Estado'],
    ];

    // Agregar los datos
    groupedRecords.forEach((records, date) => {
      records.forEach(record => {
        csvRows.push([
          date,
          record.participant?.name || '',
          record.participant?.email || '',
          new Date(record.attendance_time).toLocaleTimeString(),
          record.status || 'valid'
        ]);
      });
    });

    // Convertir a CSV
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Descargar archivo
    link.setAttribute('href', url);
    link.setAttribute('download', `asistencia_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderListView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Participante</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Hora de Registro</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {attendanceRecords.map((record) => (
          <TableRow key={record.id}>
            <TableCell>{new Date(record.session_date).toLocaleDateString()}</TableCell>
            <TableCell>{record.participant?.name}</TableCell>
            <TableCell>{record.participant?.email}</TableCell>
            <TableCell>
              {new Date(record.attendance_time).toLocaleTimeString()}
            </TableCell>
            <TableCell>{record.status || 'valid'}</TableCell>
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
                    <div className="space-y-2">
                      <Label htmlFor="status">Estado</Label>
                      <Input
                        id="status"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            status: e.target.value,
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

  const renderGroupedView = () => (
    <>
      {Array.from(groupedRecords.entries()).map(([date, records]) => (
        <div key={date} className="mb-8">
          <h3 className="text-lg font-semibold mb-4">
            {date} ({records.length} registros)
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participante</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Hora de Registro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.participant?.name}</TableCell>
                  <TableCell>{record.participant?.email}</TableCell>
                  <TableCell>
                    {new Date(record.attendance_time).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>{record.status || 'valid'}</TableCell>
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
                          <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <Input
                              id="status"
                              value={formData.status}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  status: e.target.value,
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
        </div>
      ))}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            <Eye className="mr-2 h-4 w-4" />
            Vista Lista
          </Button>
          <Button
            variant={viewMode === 'grouped' ? 'default' : 'outline'}
            onClick={() => setViewMode('grouped')}
          >
            <Eye className="mr-2 h-4 w-4" />
            Vista Agrupada
          </Button>
        </div>
        <Button onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Exportar a CSV
        </Button>
      </div>

      {viewMode === 'list' ? renderListView() : renderGroupedView()}
    </div>
  );
};
