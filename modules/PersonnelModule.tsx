
import React, { useState, useMemo, useEffect } from 'react';
import { Button, Tabs, Modal, Table, Card, FileInput } from '../components/Common';
import { Employee, AttendanceRecord, ProductivityRecord, PayrollRecord, ProcessDefinition } from '../types';

const mockInitialEmployees: Employee[] = [
    {
        id: 'emp-1', employeeCode: 'EMP-01', fullName: 'Juan Pérez', idNumber: '12345678',
        photoUrl: 'https://i.pravatar.cc/150?u=emp-1', birthDate: '1990-05-15', age: 34,
        phone: '3001234567', address: 'Calle 10 # 20-30', birthPlace: 'Bogotá',
        hireDate: '2020-01-10', serviceYears: 4, serviceMonths: 6,
        profession: 'Bachiller', specialty: 'Operario máquina plana', position: 'Operario',
        assignedProcess: 'Proceso de Confección', monthlySalary: 1500000, bonusPercentage: 5, status: 'Activo'
    },
    {
        id: 'emp-2', employeeCode: 'EMP-02', fullName: 'María García', idNumber: '87654321',
        photoUrl: 'https://i.pravatar.cc/150?u=emp-2', birthDate: '1995-11-20', age: 28,
        phone: '3109876543', address: 'Carrera 5a # 15-02', birthPlace: 'Medellín',
        hireDate: '2022-06-01', serviceYears: 2, serviceMonths: 1,
        profession: 'Técnico en Confección', specialty: 'Fileteadora', position: 'Operario',
        assignedProcess: 'Proceso de Confección', monthlySalary: 1650000, bonusPercentage: 0, status: 'Activo'
    },
];

const mockProcesses: ProcessDefinition[] = [
    { id: 'proc-1', name: 'Proceso de Corte', workstations: [{id: 'ws-1', name: 'MESA 1'}] },
    { id: 'proc-2', name: 'Proceso de Confección', workstations: [{id: 'ws-2', name: 'MÓDULO 1'}, {id: 'ws-3', name: 'MÓDULO 2'}] },
    { id: 'proc-3', name: 'Proceso de Bordado', workstations: [{id: 'ws-4', name: 'BORDADORA 1'}] },
];

const TRANSPORT_SUBSIDY = 162000; // Valor 2024, COP

const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

const calculateServiceTime = (hireDate: string): { years: number, months: number } => {
    if (!hireDate) return { years: 0, months: 0 };
    const today = new Date();
    const start = new Date(hireDate);
    let years = today.getFullYear() - start.getFullYear();
    let months = today.getMonth() - start.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < start.getDate())) {
        years--;
        months += 12;
    }
    if (today.getDate() < start.getDate()) {
        months--;
    }

    return { years, months: months < 0 ? 11 : months };
};

const EmployeeFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (employee: Employee) => void;
    editingEmployee: Employee | null;
    employees: Employee[];
}> = ({ isOpen, onClose, onSave, editingEmployee, employees }) => {

    const getInitialState = (): Omit<Employee, 'id'|'age'|'serviceYears'|'serviceMonths'> => ({
        employeeCode: '', fullName: '', idNumber: '', birthDate: '', phone: '', address: '',
        birthPlace: '', hireDate: '', profession: '', specialty: '', position: '',
        assignedProcess: '', monthlySalary: 0, bonusPercentage: 0, status: 'Activo', photoUrl: undefined,
    });

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            if (editingEmployee) {
                setFormData(editingEmployee);
            } else {
                const lastCodeNum = employees.map(e => parseInt(e.employeeCode.split('-')[1])).sort((a,b) => b-a)[0] || 0;
                const newCode = `EMP-${String(lastCodeNum + 1).padStart(2, '0')}`;
                setFormData({...getInitialState(), employeeCode: newCode});
            }
        }
    }, [isOpen, editingEmployee, employees]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };
    
    const handleSubmit = () => {
        // Validation
        if (!formData.fullName || !formData.idNumber || !formData.hireDate) {
            alert("Nombre, Cédula y Fecha de Ingreso son campos requeridos.");
            return;
        }

        const age = calculateAge(formData.birthDate);
        const { years, months } = calculateServiceTime(formData.hireDate);
        
        const finalEmployee: Employee = {
            ...formData,
            id: editingEmployee?.id || `emp-${Date.now()}`,
            age,
            serviceYears: years,
            serviceMonths: months,
        };
        onSave(finalEmployee);
        onClose();
    };

    const { years: serviceYears, months: serviceMonths } = calculateServiceTime(formData.hireDate);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingEmployee ? "Editar Empleado" : "Registrar Nuevo Empleado"} size="4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <FileInput 
                        label="Foto del Empleado" 
                        previewUrl={formData.photoUrl} 
                        onFileChange={() => {}} 
                        onUrlChange={url => setFormData(p => ({...p, photoUrl: url}))} 
                    />
                    <div><label className="label">Código Empleado</label><input type="text" name="employeeCode" value={formData.employeeCode} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Estado</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="input w-full">
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </div>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="label">Nombre Completo</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Cédula</label><input type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Fecha de Nacimiento</label><input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Edad</label><input type="text" value={`${calculateAge(formData.birthDate)} años`} className="input bg-gray-100 dark:bg-dark-accent" readOnly/></div>
                    <div><label className="label">Teléfono</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Lugar de Nacimiento</label><input type="text" name="birthPlace" value={formData.birthPlace} onChange={handleChange} className="input"/></div>
                    <div className="col-span-2"><label className="label">Dirección</label><input type="text" name="address" value={formData.address} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Fecha de Ingreso</label><input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Tiempo de Servicio</label><input type="text" value={`${serviceYears} años, ${serviceMonths} meses`} className="input bg-gray-100 dark:bg-dark-accent" readOnly/></div>
                    <div><label className="label">Profesión</label><input type="text" name="profession" value={formData.profession} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Especialidad</label><input type="text" name="specialty" value={formData.specialty} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Cargo</label><input type="text" name="position" value={formData.position} onChange={handleChange} className="input"/></div>
                    <div>
                        <label className="label">Proceso Asignado</label>
                        <select name="assignedProcess" value={formData.assignedProcess} onChange={handleChange} className="input w-full">
                            <option value="">Seleccione un proceso...</option>
                            {mockProcesses.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div><label className="label">Salario Mensual (COP)</label><input type="number" name="monthlySalary" value={formData.monthlySalary} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Bonificación Fija (%)</label><input type="number" name="bonusPercentage" value={formData.bonusPercentage} onChange={handleChange} className="input"/></div>
                </div>
            </div>
             <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar Empleado</Button>
            </div>
             <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #374151; } .dark .label { color: #D1D5DB; }`}</style>
        </Modal>
    );
};

const EmployeeListTab: React.FC<{
    employees: Employee[];
    onSave: (employee: Employee) => void;
    onDelete: (id: string) => void;
}> = ({ employees, onSave, onDelete }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEmployees = useMemo(() => employees.filter(e => 
        e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.idNumber.includes(searchTerm)
    ), [employees, searchTerm]);

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingEmployee(null);
        setModalOpen(true);
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <input type="text" placeholder="Buscar por nombre o cédula..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input w-1/3"/>
                <Button onClick={handleAddNew}>+ Nuevo Empleado</Button>
            </div>
            <Card>
                <Table headers={['Foto', 'Código', 'Nombre Completo', 'Cédula', 'Cargo', 'Estado', 'Acciones']}>
                    {filteredEmployees.map(emp => (
                        <tr key={emp.id}>
                            <td className="px-6 py-2"><img src={emp.photoUrl} alt={emp.fullName} className="h-10 w-10 rounded-full object-cover"/></td>
                            <td className="px-6 py-2 font-mono">{emp.employeeCode}</td>
                            <td className="px-6 py-2 font-medium">{emp.fullName}</td>
                            <td className="px-6 py-2">{emp.idNumber}</td>
                            <td className="px-6 py-2">{emp.position}</td>
                            <td className="px-6 py-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${emp.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {emp.status}
                                </span>
                            </td>
                            <td className="px-6 py-2 space-x-2">
                                <Button variant="secondary" className="text-xs" onClick={() => handleEdit(emp)}>Ver/Editar</Button>
                                <Button variant="danger" className="text-xs" onClick={() => onDelete(emp.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <EmployeeFormModal 
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={onSave}
                editingEmployee={editingEmployee}
                employees={employees}
            />
        </div>
    );
};

const AttendanceDetailsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: AttendanceRecord) => void;
    record: AttendanceRecord | null;
    employee: Employee | null;
}> = ({ isOpen, onClose, onSave, record, employee }) => {
    const [formData, setFormData] = useState<AttendanceRecord | null>(null);

    useEffect(() => {
        if (record) {
            setFormData({ ...record });
        }
    }, [record]);

    const calculateWorkedHours = (checkIn?: string, checkOut?: string): number => {
        if (!checkIn || !checkOut) return 0;
        try {
            const start = new Date(`1970-01-01T${checkIn}`);
            const end = new Date(`1970-01-01T${checkOut}`);
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
            const diffMs = end.getTime() - start.getTime();
            return diffMs / (1000 * 60 * 60); // convert ms to hours
        } catch (e) {
            return 0;
        }
    };

    useEffect(() => {
        if (formData) {
            const hours = calculateWorkedHours(formData.checkIn, formData.checkOut);
            // Only update if the calculated value is different to avoid infinite loops
            if (hours !== formData.workedHours) {
                 setFormData(prev => prev ? { ...prev, workedHours: hours } : null);
            }
        }
    }, [formData?.checkIn, formData?.checkOut]);

    if (!isOpen || !formData || !employee) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleFileChange = (url?: string) => {
        setFormData(prev => prev ? { ...prev, evidenceUrl: url } : null);
    };

    const handleSubmit = () => {
        onSave(formData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalles de Asistencia - ${employee.fullName}`} size="2xl">
            <div className="space-y-4">
                <p className="text-lg">Fecha: <span className="font-semibold">{new Date(formData.date + 'T00:00:00').toLocaleDateString('es-CO')}</span></p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Estado</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="input w-full">
                            <option>Asistió</option>
                            <option>Inasistencia Parcial</option>
                            <option>Inasistencia Total</option>
                        </select>
                    </div>
                     <div>
                        <label className="label">Horas Trabajadas (Calculado)</label>
                        <input type="text" value={`${formData.workedHours.toFixed(2)} horas`} readOnly className="input bg-gray-100 dark:bg-dark-accent"/>
                    </div>
                    <div>
                        <label className="label">Hora Entrada</label>
                        <input type="time" name="checkIn" value={formData.checkIn || ''} onChange={handleChange} className="input w-full"/>
                    </div>
                     <div>
                        <label className="label">Hora Salida</label>
                        <input type="time" name="checkOut" value={formData.checkOut || ''} onChange={handleChange} className="input w-full"/>
                    </div>
                     <div className="col-span-2">
                        <label className="label">Motivo Novedad</label>
                        <input type="text" name="reason" value={formData.reason || ''} onChange={handleChange} placeholder="Ej: Cita médica" className="input w-full"/>
                    </div>
                    <div className="col-span-2">
                        <label className="label">Observaciones</label>
                        <textarea name="observations" value={formData.observations || ''} onChange={handleChange} rows={2} className="input w-full"/>
                    </div>
                     <div className="col-span-2">
                         <FileInput 
                            label="Evidencia" 
                            previewUrl={formData.evidenceUrl} 
                            onFileChange={() => {}} 
                            onUrlChange={handleFileChange} 
                        />
                    </div>
                </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar Cambios</Button>
            </div>
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #374151; } .dark .label { color: #D1D5DB; }`}</style>
        </Modal>
    );
};

const AttendanceTab: React.FC<{ employees: Employee[] }> = ({ employees }) => {
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

    const dailyRecords = useMemo(() => {
        const activeEmployees = employees.filter(e => e.status === 'Activo');
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        
        let recordsForRange: AttendanceRecord[] = [];
        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0, 10);
            activeEmployees.forEach(emp => {
                const recordId = `${emp.id}_${dateStr}`;
                const defaultRecord: AttendanceRecord = {
                    id: recordId, employeeId: emp.id, date: dateStr, status: 'Asistió', workedHours: 8,
                };
                recordsForRange.push(attendanceRecords[recordId] || defaultRecord);
            });
        }
        
        recordsForRange.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || employees.find(e=>e.id === a.employeeId)!.fullName.localeCompare(employees.find(e=>e.id === b.employeeId)!.fullName))

        if (!searchTerm.trim()) {
            return recordsForRange;
        }

        return recordsForRange.filter(rec => {
            const emp = employees.find(e => e.id === rec.employeeId);
            return emp && (
                emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.idNumber.includes(searchTerm)
            );
        });
    }, [employees, startDate, endDate, attendanceRecords, searchTerm]);

    const handleOpenDetails = (record: AttendanceRecord) => {
        setSelectedRecord(record);
        setDetailsModalOpen(true);
    };

    const handleSaveDetails = (updatedRecord: AttendanceRecord) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [updatedRecord.id]: updatedRecord
        }));
    };
    
    const selectedEmployeeForModal = useMemo(() => {
        if (!selectedRecord) return null;
        return employees.find(e => e.id === selectedRecord.employeeId) || null;
    }, [selectedRecord, employees]);

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <label htmlFor="start-date" className="font-medium">Desde:</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input"/>
                     <label htmlFor="end-date" className="font-medium">Hasta:</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input"/>
                </div>
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o cédula..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="input w-full md:w-1/3"
                />
            </div>
            <Card>
                <Table headers={['Empleado', 'Cédula', 'Fecha', 'Estado', 'Entrada', 'Salida', 'Horas Trab.', 'Acciones']}>
                    {dailyRecords.map(rec => {
                        const employee = employees.find(e => e.id === rec.employeeId);
                        if (!employee) return null;
                        return (
                        <tr key={rec.id}>
                            <td className="px-6 py-2 flex items-center gap-2">
                                <img src={employee.photoUrl} className="h-8 w-8 rounded-full" />
                                {employee.fullName}
                            </td>
                            <td className="px-6 py-2">{employee.idNumber}</td>
                            <td className="px-6 py-2">{rec.date}</td>
                            <td className="px-6 py-2">{rec.status}</td>
                            <td className="px-6 py-2">{rec.checkIn || '--:--'}</td>
                            <td className="px-6 py-2">{rec.checkOut || '--:--'}</td>
                            <td className="px-6 py-2">{rec.workedHours.toFixed(1)}</td>
                            <td className="px-6 py-2">
                                <Button variant="secondary" className="text-xs" onClick={() => handleOpenDetails(rec)}>Detalles</Button>
                            </td>
                        </tr>
                        )
                    })}
                </Table>
                 {dailyRecords.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        No se encontraron registros de asistencia para el rango y búsqueda seleccionada.
                    </div>
                )}
            </Card>
            <AttendanceDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                onSave={handleSaveDetails}
                record={selectedRecord}
                employee={selectedEmployeeForModal}
            />
        </div>
    );
};

const ProductivityTab: React.FC<{employees: Employee[]}> = ({employees}) => {
    // This would be populated from Production Control or manual entry
    const [records, setRecords] = useState<ProductivityRecord[]>([]);
    
    return (
        <div>
            <div className="flex justify-end items-center mb-4">
                <Button disabled>+ Ingreso Manual</Button>
            </div>
            <Card>
                <Table headers={['Fecha', 'Empleado', 'OP', 'Operación', 'Unidades', 'Eficiencia']}>
                    {/* Fix: Provide children to the Table component to resolve the missing property error. */}
                    {records.length === 0 && (
                        <tr>
                            <td colSpan={6} className="text-center p-8 text-gray-500">
                                No hay registros de productividad. Esta función se integra con el Módulo de Control de Producción.
                            </td>
                        </tr>
                    )}
                    {/* Rows would be mapped here */}
                </Table>
            </Card>
        </div>
    )
}

const PayrollTab: React.FC<{employees: Employee[]}> = ({employees}) => {
    const [monthYear, setMonthYear] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    
    const payrollData = useMemo(() => {
        return employees.filter(e => e.status === 'Activo').map(emp => {
            const baseSalary = emp.monthlySalary;
            const transportSubsidy = baseSalary <= 2 * 1300000 ? TRANSPORT_SUBSIDY : 0; // Approx 2 SMLV
            const fixedBonus = baseSalary * (emp.bonusPercentage / 100);
            const totalEarnings = baseSalary + transportSubsidy + fixedBonus;
            const deductions = totalEarnings * 0.08; // Health and pension approx
            const totalPaid = totalEarnings - deductions;
            
            return {
                employeeId: emp.id,
                daysWorked: 30, // Assuming full month from attendance
                baseSalary,
                transportSubsidy,
                fixedBonus,
                totalEarnings,
                deductions,
                totalPaid,
            };
        });
    }, [employees, monthYear]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);

    return (
         <div>
            <div className="flex items-center gap-4 mb-4">
                <label htmlFor="payroll-date">Mes de Nómina:</label>
                <input type="month" id="payroll-date" value={monthYear} onChange={e => setMonthYear(e.target.value)} className="input"/>
            </div>
            <Card>
                <Table headers={['Empleado', 'Salario Base', 'Sub. Transporte', 'Bonificación', 'Total Devengado', 'Deducciones', 'Total a Pagar']}>
                   {payrollData.map(p => {
                       const emp = employees.find(e => e.id === p.employeeId);
                       if(!emp) return null;
                       return (
                           <tr key={p.employeeId}>
                               <td className="px-4 py-2 font-medium">{emp.fullName}</td>
                               <td className="px-4 py-2">{formatCurrency(p.baseSalary)}</td>
                               <td className="px-4 py-2">{formatCurrency(p.transportSubsidy)}</td>
                               <td className="px-4 py-2">{formatCurrency(p.fixedBonus)}</td>
                               <td className="px-4 py-2 font-semibold">{formatCurrency(p.totalEarnings)}</td>
                               <td className="px-4 py-2">{formatCurrency(p.deductions)}</td>
                               <td className="px-4 py-2 font-bold text-lg text-green-600">{formatCurrency(p.totalPaid)}</td>
                           </tr>
                       )
                   })}
                </Table>
            </Card>
        </div>
    )
};

const PersonnelModule: React.FC = () => {
    const TABS = [
        { id: 'data', label: 'Datos Personales' },
        { id: 'attendance', label: 'Asistencia' },
        { id: 'productivity', label: 'Productividad' },
        { id: 'payroll', label: 'Nómina' },
    ];
    
    const [employees, setEmployees] = useState<Employee[]>(mockInitialEmployees);

    const handleSaveEmployee = (empToSave: Employee) => {
        setEmployees(prev => {
            const index = prev.findIndex(e => e.id === empToSave.id);
            if (index > -1) {
                const newEmps = [...prev];
                newEmps[index] = empToSave;
                return newEmps;
            }
            return [empToSave, ...prev];
        });
    };

    const handleDeleteEmployee = (id: string) => {
        if(window.confirm('¿Está seguro de que desea eliminar este empleado?')) {
            setEmployees(prev => prev.filter(e => e.id !== id));
        }
    };
    
    return (
        <Tabs tabs={TABS}>
            {(activeTab) => (
                <div>
                    {activeTab === 'data' && 
                        <EmployeeListTab 
                            employees={employees}
                            onSave={handleSaveEmployee}
                            onDelete={handleDeleteEmployee}
                        />
                    }
                    {activeTab === 'attendance' && <AttendanceTab employees={employees} />}
                    {activeTab === 'productivity' && <ProductivityTab employees={employees}/>}
                    {activeTab === 'payroll' && <PayrollTab employees={employees} />}
                </div>
            )}
        </Tabs>
    );
};

export default PersonnelModule;
