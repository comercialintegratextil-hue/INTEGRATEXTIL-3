
import React, { useState, useMemo, useEffect } from 'react';
import { Button, Tabs, Modal, Card, Table } from '../components/Common';
import { Shift, DailyShift, Break, DayOfWeek, ProcessDefinition, Workstation, GanttTask, ProductionOrder, ServiceOrder, Product, KanbanOrderProgress, KanbanTaskProgress } from '../types';

// MOCK DATA - In a real app, this would come from the PlanningModule or an API
const mockProductionOrders: ProductionOrder[] = [
    { id: 'OP-101', customerOrderId: 'PED-001', productId: 'prod-001', productName: 'Camisa Oxford Clásica', reference: 'C-OX-01', client: 'Zara', status: 'In Progress', sizeCurve: [], totalQuantity: 250, creationDate: '2024-07-15' },
    { id: 'OP-102', productId: 'prod-002', productName: 'Pantalón Chino Slim', reference: 'P-CH-03', client: 'H&M', status: 'Pending', sizeCurve: [], totalQuantity: 300, creationDate: '2024-07-18' },
];
const mockServiceOrders: ServiceOrder[] = [
    // Fix: Added missing 'orderType' property to satisfy the ServiceOrder type.
    { id: 'OS-001', productionOrderId: 'OP-101', orderType: 'Externo', productId: 'prod-001', productName: 'Camisa Oxford Clásica', providerId: 'prov-01', providerName: 'Corte y Confección SAS', status: 'Enviado', creationDate: '2024-07-20', totalQuantity: 50, items: [], materials: [] }
];
const mockProducts: Product[] = [
  { id: 'prod-001', name: 'Camisa Oxford Clásica', reference: 'C-OX-01', imageUrl: '', client: 'Zara', collection: '', standardTimePerUnit: 2.5, },
  { id: 'prod-002', name: 'Pantalón Chino Slim', reference: 'P-CH-03', imageUrl: '', client: 'H&M', collection: '', standardTimePerUnit: 3.0, },
];

const WEEK_DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const initialShifts: Shift[] = [
    {
        id: 'shift-1', name: 'Turno 1 (Mañana)',
        weeklySchedule: WEEK_DAYS.map((day, index) => ({
            day,
            isWorkDay: index < 5, // Monday to Friday
            startTime: '06:00',
            endTime: '14:00',
            breaks: [{ id: `b-1-${day}`, name: 'Almuerzo', durationMinutes: 30 }]
        }))
    },
    {
        id: 'shift-2', name: 'Turno 2 (Tarde)',
        weeklySchedule: WEEK_DAYS.map((day, index) => ({
            day,
            isWorkDay: index < 5, // Monday to Friday
            startTime: '14:00',
            endTime: '22:00',
            breaks: [{ id: `b-2-${day}`, name: 'Cena', durationMinutes: 30 }]
        }))
    }
];

const initialProcesses: ProcessDefinition[] = [
    { id: 'proc-1', name: 'Proceso de Corte', workstations: [{id: 'ws-1', name: 'MESA 1'}] },
    { id: 'proc-2', name: 'Proceso de Confección', workstations: [{id: 'ws-2', name: 'MÓDULO 1'}, {id: 'ws-3', name: 'MÓDULO 2'}] },
    { id: 'proc-3', name: 'Proceso de Bordado', workstations: [{id: 'ws-4', name: 'BORDADORA 1'}] },
];

const mockKanbanData: KanbanOrderProgress[] = [
    {
        productionOrderId: 'OP-101',
        tasks: [
            { processId: 'proc-1', processName: 'Proceso de Corte', stationName: 'MESA 1', status: 'Terminado', progress: 100 },
            { processId: 'proc-2', processName: 'Proceso de Confección', stationName: 'MÓDULO 1', status: 'En Proceso', progress: 60 },
            { processId: 'proc-3', processName: 'Proceso de Bordado', stationName: 'BORDADORA 1', status: 'Pendiente', progress: 0 },
        ]
    },
    {
        productionOrderId: 'OP-102',
        tasks: [
            { processId: 'proc-1', processName: 'Proceso de Corte', stationName: 'MESA 1', status: 'En Proceso', progress: 85 },
            { processId: 'proc-2', processName: 'Proceso de Confección', stationName: 'MÓDULO 2', status: 'Pendiente', progress: 0 },
        ]
    }
];


const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const minutesToHoursString = (totalMinutes: number) => {
    if (isNaN(totalMinutes) || totalMinutes < 0) return '0h 0m';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
};


const ShiftFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (shift: Shift) => void;
    editingShift: Shift | null;
}> = ({ isOpen, onClose, onSave, editingShift }) => {
    
    const getInitialState = (): Shift => {
         if (editingShift) return editingShift;
         return {
            id: '',
            name: '',
            weeklySchedule: WEEK_DAYS.map(day => ({
                day, isWorkDay: true, startTime: '00:00', endTime: '00:00', breaks: [],
            }))
         }
    };

    const [shiftData, setShiftData] = useState<Shift>(getInitialState());

    useEffect(() => {
        setShiftData(getInitialState());
    }, [editingShift, isOpen]);

    const handleDayChange = (day: DayOfWeek, field: keyof DailyShift, value: any) => {
        setShiftData(prev => ({
            ...prev,
            weeklySchedule: prev.weeklySchedule.map(d => d.day === day ? { ...d, [field]: value } : d)
        }));
    };

    const addBreak = (day: DayOfWeek) => {
        const newBreak: Break = { id: `b-${Date.now()}`, name: 'Descanso', durationMinutes: 15 };
        handleDayChange(day, 'breaks', [...shiftData.weeklySchedule.find(d => d.day === day)!.breaks, newBreak]);
    };
    
    const updateBreak = (day: DayOfWeek, breakId: string, field: keyof Break, value: any) => {
        const daySchedule = shiftData.weeklySchedule.find(d => d.day === day)!;
        const newBreaks = daySchedule.breaks.map(b => b.id === breakId ? {...b, [field]: value } : b);
        handleDayChange(day, 'breaks', newBreaks);
    };

    const removeBreak = (day: DayOfWeek, breakId: string) => {
         const daySchedule = shiftData.weeklySchedule.find(d => d.day === day)!;
         handleDayChange(day, 'breaks', daySchedule.breaks.filter(b => b.id !== breakId));
    };

    const totalWeeklyMinutes = useMemo(() => {
        return shiftData.weeklySchedule.reduce((total, day) => {
            if (!day.isWorkDay) return total;
            const workMinutes = timeToMinutes(day.endTime) - timeToMinutes(day.startTime);
            const breakMinutes = day.breaks.reduce((sum, b) => sum + b.durationMinutes, 0);
            return total + Math.max(0, workMinutes - breakMinutes);
        }, 0);
    }, [shiftData.weeklySchedule]);


    const handleSubmit = () => {
        const finalShift = { ...shiftData, id: shiftData.id || `shift-${Date.now()}` };
        onSave(finalShift);
        onClose();
    }
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingShift ? "Editar Turno" : "Nuevo Turno"} size="4xl">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Nombre del Turno</label>
                    <input type="text" value={shiftData.name} onChange={e => setShiftData(p => ({...p, name: e.target.value}))} className="w-full mt-1 input"/>
                </div>
                
                <div className="space-y-3">
                    {shiftData.weeklySchedule.map(day => (
                        <div key={day.day} className="p-3 border rounded-md dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                           <div className="col-span-1 md:col-span-4 flex items-center">
                               <input type="checkbox" checked={day.isWorkDay} onChange={e => handleDayChange(day.day, 'isWorkDay', e.target.checked)} className="h-5 w-5 rounded mr-3"/>
                               <h4 className="font-semibold text-lg">{day.day}</h4>
                           </div>
                           {day.isWorkDay && <>
                               <div>
                                   <label className="text-sm">Entrada</label>
                                   <input type="time" value={day.startTime} onChange={e => handleDayChange(day.day, 'startTime', e.target.value)} className="w-full input"/>
                               </div>
                               <div>
                                   <label className="text-sm">Salida</label>
                                   <input type="time" value={day.endTime} onChange={e => handleDayChange(day.day, 'endTime', e.target.value)} className="w-full input"/>
                               </div>
                               <div className="md:col-span-2">
                                   <label className="text-sm">Descansos</label>
                                   <div className="space-y-2">
                                    {day.breaks.map(b => (
                                        <div key={b.id} className="flex gap-2 items-center">
                                            <input type="text" value={b.name} onChange={e => updateBreak(day.day, b.id, 'name', e.target.value)} placeholder="Nombre" className="input flex-grow"/>
                                            <input type="number" value={b.durationMinutes} onChange={e => updateBreak(day.day, b.id, 'durationMinutes', parseInt(e.target.value) || 0)} className="input w-20"/>
                                            <span>min</span>
                                            <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => removeBreak(day.day, b.id)}>X</Button>
                                        </div>
                                    ))}
                                    <Button onClick={() => addBreak(day.day)} className="text-xs px-2 py-1">+ Descanso</Button>
                                   </div>
                               </div>
                                <div className="md:col-span-4 text-right font-medium text-sm">
                                   Horas Laboradas: {minutesToHoursString(Math.max(0, timeToMinutes(day.endTime) - timeToMinutes(day.startTime) - day.breaks.reduce((s,b) => s + b.durationMinutes, 0)))}
                               </div>
                           </>}
                        </div>
                    ))}
                </div>

                 <div className="text-right font-bold text-lg border-t pt-4 dark:border-gray-700">
                    Total Horas Semanales: {minutesToHoursString(totalWeeklyMinutes)}
                </div>

            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar Turno</Button>
            </div>
        </Modal>
    );
};

const TurnsTab: React.FC<{shifts: Shift[], onSave: (s: Shift) => void, onDelete: (id: string) => void}> = ({shifts, onSave, onDelete}) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);

    const handleAddNew = () => {
        setEditingShift(null);
        setModalOpen(true);
    };

    const handleEdit = (shift: Shift) => {
        setEditingShift(shift);
        setModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button onClick={handleAddNew}>+ Nuevo Turno</Button>
            </div>
            <Card>
                 <Table headers={['Nombre del Turno', 'Horas Semanales', 'Acciones']}>
                    {shifts.map(shift => (
                        <tr key={shift.id}>
                            <td className="px-6 py-4 font-medium">{shift.name}</td>
                            <td className="px-6 py-4">{minutesToHoursString(shift.weeklySchedule.reduce((total, day) => total + (day.isWorkDay ? Math.max(0, timeToMinutes(day.endTime) - timeToMinutes(day.startTime) - day.breaks.reduce((s, b) => s + b.durationMinutes, 0)) : 0), 0))}</td>
                            <td className="px-6 py-4">
                                <Button variant="secondary" onClick={() => handleEdit(shift)}>Editar</Button>
                                <Button variant="danger" className="ml-2" onClick={() => onDelete(shift.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                 </Table>
            </Card>
            <ShiftFormModal 
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={onSave}
                editingShift={editingShift}
            />
        </div>
    );
};

const ProcessesTab: React.FC<{processes: ProcessDefinition[], onUpdate: (p: ProcessDefinition[]) => void}> = ({processes, onUpdate}) => {
    const [newProcessName, setNewProcessName] = useState('');
    const [newWorkstationNames, setNewWorkstationNames] = useState<{[key: string]: string}>({});

    const handleAddProcess = () => {
        if(newProcessName.trim() === '') return;
        const newProcess: ProcessDefinition = {
            id: `proc-${Date.now()}`,
            name: newProcessName,
            workstations: []
        };
        onUpdate([...processes, newProcess]);
        setNewProcessName('');
    };

    const handleAddWorkstation = (processId: string) => {
        const name = newWorkstationNames[processId]?.trim();
        if(!name) return;
        const newWorkstation: Workstation = { id: `ws-${Date.now()}`, name };
        onUpdate(processes.map(p => p.id === processId ? {...p, workstations: [...p.workstations, newWorkstation]} : p));
        setNewWorkstationNames(prev => ({...prev, [processId]: ''}));
    };
    
    const handleRemoveWorkstation = (processId: string, workstationId: string) => {
        onUpdate(processes.map(p => p.id === processId ? {...p, workstations: p.workstations.filter(ws => ws.id !== workstationId)} : p));
    }
    
    const handleDeleteProcess = (processId: string) => {
        if(window.confirm('¿Eliminar este proceso y todas sus estaciones de trabajo?')) {
            onUpdate(processes.filter(p => p.id !== processId));
        }
    }
    
    return (
        <div>
             <div className="mb-6 max-w-md">
                <h3 className="text-lg font-semibold mb-2">Crear Nuevo Proceso</h3>
                <div className="flex gap-2">
                    <input type="text" value={newProcessName} onChange={e => setNewProcessName(e.target.value)} placeholder="Ej: Proceso de Termofijado" className="input flex-grow"/>
                    <Button onClick={handleAddProcess}>+ Añadir Proceso</Button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processes.map(proc => (
                    <Card key={proc.id}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">{proc.name}</h3>
                            <Button variant="danger" className="text-xs px-2 py-1" onClick={() => handleDeleteProcess(proc.id)}>Eliminar</Button>
                        </div>
                        <div className="space-y-2">
                           {proc.workstations.map(ws => (
                               <div key={ws.id} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-dark-accent rounded">
                                   <span>{ws.name}</span>
                                   <button onClick={() => handleRemoveWorkstation(proc.id, ws.id)} className="text-red-500 hover:text-red-700 text-xs">Quitar</button>
                               </div>
                           ))}
                        </div>
                        <div className="flex gap-2 mt-4">
                            <input 
                                type="text" 
                                value={newWorkstationNames[proc.id] || ''} 
                                onChange={e => setNewWorkstationNames(prev => ({...prev, [proc.id]: e.target.value}))} 
                                placeholder="Nombre de estación..." 
                                className="input flex-grow text-sm"
                            />
                            <Button onClick={() => handleAddWorkstation(proc.id)} className="text-xs px-2 py-1">+ Estación</Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
};

const GanttTaskFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: GanttTask) => void;
    processes: ProcessDefinition[];
    shifts: Shift[];
    editingTask: GanttTask | null;
}> = ({ isOpen, onClose, onSave, processes, shifts, editingTask }) => {
    
    const getInitialState = () => ({
        orderType: editingTask?.orderType || 'OP',
        orderId: editingTask?.orderId || '',
        processId: editingTask?.processId || '',
        workstationId: editingTask?.workstationId || '',
        shiftId: editingTask?.shiftId || '',
        efficiency: editingTask?.efficiency || 100,
        startDate: editingTask ? new Date(editingTask.startDate.getTime() - editingTask.startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        startTime: editingTask ? editingTask.startDate.toTimeString().slice(0,5) : '06:00',
        progress: editingTask?.progress || 0,
        status: editingTask?.status || 'On Track',
    });

    const [formData, setFormData] = useState(getInitialState());
    
    useEffect(() => {
        if(isOpen) setFormData(getInitialState());
    }, [isOpen, editingTask])

    const [calculation, setCalculation] = useState<{endDate: Date | null, requiredHours: number, requiredShifts: number} | null>(null);

    const availableWorkstations = useMemo(() => {
        if (!formData.processId) return [];
        return processes.find(p => p.id === formData.processId)?.workstations || [];
    }, [formData.processId, processes]);

    // Calculation Logic
    useEffect(() => {
        const { orderType, orderId, shiftId, efficiency, startDate, startTime } = formData;
        if (!orderId || !shiftId || !efficiency) {
            setCalculation(null);
            return;
        }

        const order = (orderType === 'OP' ? mockProductionOrders : mockServiceOrders).find(o => o.id === orderId);
        const product = mockProducts.find(p => p.id === order?.productId);
        const shift = shifts.find(s => s.id === shiftId);

        if (!order || !product || !shift || !product.standardTimePerUnit) {
            setCalculation(null);
            return;
        }

        const totalMinutesRequired = (order.totalQuantity * product.standardTimePerUnit) / (efficiency / 100);
        let minutesRemaining = totalMinutesRequired;
        
        let currentDate = new Date(`${startDate}T${startTime}:00`);
        let shiftsPassed = 0;

        const dayMapping: Record<DayOfWeek, number> = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 };

        while (minutesRemaining > 0 && shiftsPassed < 1000) { // Safety break
            const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon...
            const shiftDay = shift.weeklySchedule.find(d => dayMapping[d.day] === dayOfWeek);

            if (shiftDay && shiftDay.isWorkDay) {
                const shiftStartMinutes = timeToMinutes(shiftDay.startTime);
                const shiftEndMinutes = timeToMinutes(shiftDay.endTime);
                let currentMinuteOfDay = currentDate.getHours() * 60 + currentDate.getMinutes();
                
                if(currentMinuteOfDay < shiftStartMinutes) {
                    currentMinuteOfDay = shiftStartMinutes;
                    currentDate.setHours(Math.floor(shiftStartMinutes/60), shiftStartMinutes % 60, 0, 0);
                }

                if (currentMinuteOfDay < shiftEndMinutes) {
                    if (shiftsPassed === 0) shiftsPassed = 1;
                    const breakMinutes = shiftDay.breaks.reduce((sum, b) => sum + b.durationMinutes, 0);
                    const availableMinutesInShift = shiftEndMinutes - currentMinuteOfDay;
                    // This is a simplified calculation, a real one would need to check breaks within the timeframe
                    const minutesToWork = Math.min(minutesRemaining, availableMinutesInShift);
                    minutesRemaining -= minutesToWork;
                    currentDate.setMinutes(currentDate.getMinutes() + minutesToWork);
                }
            }
             if (minutesRemaining > 0) {
                currentDate.setDate(currentDate.getDate() + 1);
                currentDate.setHours(0,0,0,0);
                const nextShiftDay = shift.weeklySchedule.find(d => dayMapping[d.day] === currentDate.getDay());
                if (nextShiftDay && nextShiftDay.isWorkDay) {
                    if (shiftsPassed > 0) shiftsPassed++;
                    const nextShiftStartMinutes = timeToMinutes(nextShiftDay.startTime);
                    currentDate.setHours(Math.floor(nextShiftStartMinutes/60), nextShiftStartMinutes % 60);
                }
            }
        }
        
        setCalculation({
            endDate: currentDate,
            requiredHours: totalMinutesRequired / 60,
            requiredShifts: shiftsPassed || 1,
        });

    }, [formData, shifts]);

    const handleSubmit = () => {
        if (!calculation || !calculation.endDate) return;

        const order = (formData.orderType === 'OP' ? mockProductionOrders : mockServiceOrders).find(o => o.id === formData.orderId)!;
        const process = processes.find(p => p.id === formData.processId)!;
        const workstation = process.workstations.find(w => w.id === formData.workstationId)!;
        const shift = shifts.find(s => s.id === formData.shiftId)!;

        const newTask: GanttTask = {
            id: editingTask?.id || `task-${Date.now()}`,
            orderId: formData.orderId,
            orderType: formData.orderType as 'OP' | 'OS',
            productName: order.productName,
            quantity: order.totalQuantity,
            processId: formData.processId,
            workstationId: formData.workstationId,
            shiftId: formData.shiftId,
            efficiency: formData.efficiency,
            startDate: new Date(`${formData.startDate}T${formData.startTime}:00`),
            endDate: calculation.endDate,
            progress: formData.progress,
            status: formData.status as GanttTask['status'],
            processName: process.name,
            workstationName: workstation.name,
            shiftName: shift.name,
            requiredHours: calculation.requiredHours,
            requiredShifts: calculation.requiredShifts,
        };
        onSave(newTask);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingTask ? "Editar Tarea" : "Programar Nueva Tarea"} size="2xl">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium">Tipo de Orden</label>
                        <select value={formData.orderType} onChange={e => setFormData({...formData, orderType: e.target.value as 'OP' | 'OS', orderId: ''})} className="w-full mt-1 input">
                            <option value="OP">Orden de Producción</option>
                            <option value="OS">Orden de Servicio</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Orden</label>
                         <select value={formData.orderId} onChange={e => setFormData({...formData, orderId: e.target.value})} className="w-full mt-1 input">
                            <option value="">Seleccionar...</option>
                            {(formData.orderType === 'OP' ? mockProductionOrders : mockServiceOrders).map(o => <option key={o.id} value={o.id}>{o.id} - {o.productName}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Proceso</label>
                         <select value={formData.processId} onChange={e => setFormData({...formData, processId: e.target.value, workstationId: ''})} className="w-full mt-1 input">
                            <option value="">Seleccionar...</option>
                            {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Estación de Trabajo</label>
                         <select value={formData.workstationId} onChange={e => setFormData({...formData, workstationId: e.target.value})} className="w-full mt-1 input" disabled={!formData.processId}>
                            <option value="">Seleccionar...</option>
                            {availableWorkstations.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Turno de Trabajo</label>
                         <select value={formData.shiftId} onChange={e => setFormData({...formData, shiftId: e.target.value})} className="w-full mt-1 input">
                            <option value="">Seleccionar...</option>
                            {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Eficiencia Proyectada (%)</label>
                        <input type="number" value={formData.efficiency} onChange={e => setFormData({...formData, efficiency: parseInt(e.target.value) || 0})} className="w-full mt-1 input"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Fecha de Inicio</label>
                        <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full mt-1 input"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Hora de Inicio</label>
                        <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full mt-1 input"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Progreso (%)</label>
                        <input type="number" value={formData.progress} onChange={e => setFormData({...formData, progress: parseInt(e.target.value) || 0})} max="100" min="0" className="w-full mt-1 input"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Estado</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as GanttTask['status']})} className="w-full mt-1 input">
                            <option value="On Track">A tiempo</option>
                            <option value="At Risk">En Riesgo</option>
                            <option value="Delayed">Retrasado</option>
                        </select>
                    </div>
                </div>

                {calculation && (
                     <div className="p-4 bg-gray-50 dark:bg-dark-accent rounded-md space-y-2 mt-4">
                        <h4 className="font-semibold text-lg">Resumen del Cálculo</h4>
                        <p><strong>Fecha y Hora Fin (Estimada):</strong> {calculation.endDate?.toLocaleString('es-CO')}</p>
                        <p><strong>Tiempo Requerido (Horas):</strong> {calculation.requiredHours.toFixed(2)} horas</p>
                    </div>
                )}
            </div>
             <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={!calculation?.endDate}>Guardar Tarea</Button>
            </div>
        </Modal>
    );
};

const GanttTab: React.FC<{
    ganttTasks: GanttTask[];
    processes: ProcessDefinition[];
    shifts: Shift[];
    onSaveTask: (task: GanttTask) => void;
}> = ({ ganttTasks, processes, shifts, onSaveTask }) => {
    
    const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [viewDate, setViewDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
    const [isCompact, setIsCompact] = useState(false);
    const [filters, setFilters] = useState({ process: 'all', station: 'all', status: 'all' });

    const filteredTasks = useMemo(() => {
        return ganttTasks.filter(task => {
            const processMatch = filters.process === 'all' || task.processId === filters.process;
            const stationMatch = filters.station === 'all' || task.workstationId === filters.station;
            const statusMatch = filters.status === 'all' || task.status === filters.status;
            return processMatch && stationMatch && statusMatch;
        });
    }, [ganttTasks, filters]);
    
    const { timeScale, gridTemplateColumns, gridCols, dateRange } = useMemo(() => {
        const d = new Date(viewDate);
        let scale = [];
        let range = { start: new Date(), end: new Date() };

        if (viewMode === 'weekly') {
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const start = new Date(d.setDate(diff));
            start.setHours(0,0,0,0);
            range.start = start;
            scale = Array.from({ length: 7 }).map((_, i) => {
                const day = new Date(start);
                day.setDate(day.getDate() + i);
                return { label: day.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric'}), date: day };
            });
            const end = new Date(scale[scale.length - 1].date);
            end.setHours(23,59,59,999);
            range.end = end;
        } else if (viewMode === 'monthly') {
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            range.start = start;
            const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
             scale = Array.from({ length: daysInMonth }).map((_, i) => {
                const day = new Date(start);
                day.setDate(day.getDate() + i);
                return { label: `${day.getDate()}`, date: day };
            });
            const end = new Date(scale[scale.length - 1].date);
            end.setHours(23,59,59,999);
            range.end = end;
        } else { // daily
             const start = new Date(d);
             start.setHours(0,0,0,0);
             range.start = start;
             scale = Array.from({ length: 24 }).map((_, i) => {
                const hour = new Date(start);
                hour.setHours(i);
                return { label: `${i}:00`, date: hour };
             });
             const end = new Date(start);
             end.setHours(23,59,59,999);
             range.end = end;
        }

        const cols = `minmax(150px, 1.5fr) minmax(100px, 1fr) 80px 80px 80px 100px 100px`;
        return {
            timeScale: scale,
            gridTemplateColumns: `[tasks] ${cols} [timeline] repeat(${scale.length}, 1fr)`,
            gridCols: cols,
            dateRange: range,
        };
    }, [viewDate, viewMode]);

    const handleNav = (direction: 'prev' | 'next' | 'today') => {
        setViewDate(current => {
            if(direction === 'today') return new Date();
            const d = new Date(current);
            const increment = direction === 'prev' ? -1 : 1;
            if(viewMode === 'weekly') d.setDate(d.getDate() + 7 * increment);
            if(viewMode === 'monthly') d.setMonth(d.getMonth() + increment);
            if(viewMode === 'daily') d.setDate(d.getDate() + increment);
            return d;
        });
    };
    
    const handleOpenModal = (task: GanttTask | null) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const getTaskPosition = (task: GanttTask) => {
        const totalRange = dateRange.end.getTime() - dateRange.start.getTime();
        const taskStart = Math.max(task.startDate.getTime(), dateRange.start.getTime());
        const taskEnd = Math.min(task.endDate.getTime(), dateRange.end.getTime());

        if (taskEnd < taskStart) return { left: 0, width: 0 };
        
        const left = ((taskStart - dateRange.start.getTime()) / totalRange) * 100;
        const width = ((taskEnd - taskStart) / totalRange) * 100;

        return { left, width };
    };

    const statusColors: Record<GanttTask['status'], {bg: string, text: string}> = {
        'On Track': { bg: 'bg-green-500', text: 'text-green-800' },
        'At Risk': { bg: 'bg-yellow-500', text: 'text-yellow-800' },
        'Delayed': { bg: 'bg-red-500', text: 'text-red-800' },
    };
    
    const efficiencyColor = (eff: number) => {
        if(eff >= 95) return 'text-green-600 dark:text-green-400';
        if(eff >= 85) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { height: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
          .dark .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
        `}</style>

        {/* Toolbar */}
        <Card className="flex-shrink-0 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button onClick={() => handleOpenModal(null)}>+ Programar Tarea</Button>
                     <div className="flex items-center rounded-md border dark:border-gray-600">
                        <Button variant="secondary" onClick={() => setViewMode('daily')} className={`rounded-r-none ${viewMode === 'daily' ? 'bg-brand-blue text-white' : ''}`}>Diario</Button>
                        <Button variant="secondary" onClick={() => setViewMode('weekly')} className={`rounded-none border-x dark:border-gray-600 ${viewMode === 'weekly' ? 'bg-brand-blue text-white' : ''}`}>Semanal</Button>
                        <Button variant="secondary" onClick={() => setViewMode('monthly')} className={`rounded-l-none ${viewMode === 'monthly' ? 'bg-brand-blue text-white' : ''}`}>Mensual</Button>
                    </div>
                     <div className="flex items-center gap-1">
                        <Button variant="secondary" onClick={() => handleNav('prev')}>‹</Button>
                        <Button variant="secondary" onClick={() => handleNav('today')}>Hoy</Button>
                        <Button variant="secondary" onClick={() => handleNav('next')}>›</Button>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <select onChange={e => setFilters(f => ({...f, process: e.target.value}))} className="input text-sm"><option value="all">Todos los Procesos</option>{processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <select onChange={e => setFilters(f => ({...f, status: e.target.value}))} className="input text-sm"><option value="all">Todos los Estados</option><option value="On Track">A tiempo</option><option value="At Risk">En Riesgo</option><option value="Delayed">Retrasado</option></select>
                    <Button variant="secondary" onClick={() => setIsCompact(!isCompact)}>{isCompact ? 'Vista Expandida' : 'Vista Compacta'}</Button>
                </div>
            </div>
        </Card>

        {/* Gantt View */}
        <div className="flex-grow bg-white dark:bg-dark-secondary rounded-md shadow-md overflow-hidden relative">
            {/* Headers */}
            <div className="grid sticky top-0 z-20 bg-gray-50 dark:bg-dark-accent text-xs font-semibold uppercase text-gray-500 dark:text-gray-400" style={{ gridTemplateColumns }}>
                <div className="gantt-header-cell border-b" style={{ gridColumn: 'tasks' }}>
                    <div className="grid h-full" style={{gridTemplateColumns: gridCols}}>
                        <div className="g-h-cell">Proceso / Estación</div>
                        <div className="g-h-cell">Orden</div>
                        <div className="g-h-cell text-center">Cant</div>
                        <div className="g-h-cell text-center">Efic</div>
                        <div className="g-h-cell text-center">Hrs Req</div>
                        <div className="g-h-cell">Inicio</div>
                        <div className="g-h-cell">Fin</div>
                    </div>
                </div>
                <div className="gantt-header-cell border-l border-b" style={{ gridColumn: 'timeline' }}>
                    <div className="grid h-full" style={{gridTemplateColumns: `repeat(${timeScale.length}, 1fr)`}}>
                        {timeScale.map(d => <div key={d.label} className="g-h-cell text-center">{d.label}</div>)}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="h-[calc(100%-40px)] overflow-auto custom-scrollbar">
                <div className="grid relative" style={{ gridTemplateColumns }}>
                    {/* Task Details (Left Pane) */}
                    <div className="sticky left-0 z-10 bg-white dark:bg-dark-secondary" style={{ gridColumn: 'tasks' }}>
                        {filteredTasks.map(task => (
                            <div key={task.id} className={`grid items-center border-b dark:border-gray-700 ${isCompact ? 'h-10' : 'h-16'} hover:bg-gray-50 dark:hover:bg-dark-accent/50 cursor-pointer`} style={{gridTemplateColumns: gridCols}} onClick={() => handleOpenModal(task)}>
                                <div className="g-cell truncate"><strong>{task.processName}</strong><br/><span className="text-xs text-gray-500">{task.workstationName}</span></div>
                                <div className="g-cell truncate">{task.orderId}<br/><span className="text-xs text-gray-500">{task.productName}</span></div>
                                <div className="g-cell text-center">{task.quantity}</div>
                                <div className={`g-cell text-center font-bold ${efficiencyColor(task.efficiency)}`}>{task.efficiency}%</div>
                                <div className="g-cell text-center">{task.requiredHours.toFixed(1)}</div>
                                <div className="g-cell text-xs">{task.startDate.toLocaleDateString()}<br/>{task.startDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                <div className="g-cell text-xs">{task.endDate.toLocaleDateString()}<br/>{task.endDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                            </div>
                        ))}
                    </div>
                    {/* Timeline (Right Pane) */}
                    <div className="relative border-l dark:border-gray-700" style={{ gridColumn: 'timeline' }}>
                        {/* Day separators */}
                        <div className="absolute inset-0 grid" style={{gridTemplateColumns: `repeat(${timeScale.length}, 1fr)`}}>
                            {timeScale.map((_, i) => <div key={i} className="border-r dark:border-gray-700"></div>)}
                        </div>
                        {/* Task rows */}
                        {filteredTasks.map(task => {
                            const { left, width } = getTaskPosition(task);
                            if (width <= 0) return null;
                            const statusColor = statusColors[task.status].bg;
                            return (
                            <div key={task.id} className={`flex items-center relative ${isCompact ? 'h-10' : 'h-16'} border-b dark:border-gray-700 group`}>
                                <div className={`absolute h-3/5 rounded ${statusColor}`} style={{ left: `${left}%`, width: `${width}%`}}>
                                    <div className="bg-brand-blue/60 h-full rounded" style={{width: `${task.progress}%`}}></div>
                                </div>
                                {/* Tooltip */}
                                 <div className="absolute hidden group-hover:block top-full left-1/2 -translate-x-1/2 mt-2 p-3 bg-gray-800 text-white rounded-lg shadow-lg z-30 w-64 whitespace-normal text-sm">
                                    <p className="font-bold text-base">{task.orderId}: {task.productName}</p>
                                    <p><span className={`inline-block w-3 h-3 rounded-full mr-2 ${statusColor}`}></span>{task.status}</p>
                                    <p><strong>Progreso:</strong> {task.progress}%</p>
                                    <p><strong>Proceso:</strong> {task.processName} ({task.workstationName})</p>
                                    <p><strong>Turno:</strong> {task.shiftName}</p>
                                    <p><strong>Inicio:</strong> {task.startDate.toLocaleString('es-CO')}</p>
                                    <p><strong>Fin:</strong> {task.endDate.toLocaleString('es-CO')}</p>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
            </div>
        </div>

        <style>{`
          .g-h-cell, .g-cell { padding: 4px 8px; border-right: 1px solid #e5e7eb; }
          .dark .g-h-cell, .dark .g-cell { border-color: #374151; }
          .g-h-cell:last-child, .g-cell:last-child { border-right: none; }
        `}</style>
         <GanttTaskFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={onSaveTask}
            processes={processes}
            shifts={shifts}
            editingTask={editingTask}
        />
      </div>
    );
};


const getKanbanStatusColor = (status: KanbanTaskProgress['status']) => {
    switch (status) {
        case 'Terminado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'En Proceso': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'Pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
}

const KanbanTab: React.FC<{ganttTasks: GanttTask[]}> = ({ganttTasks}) => {
    const [selectedOrderId, setSelectedOrderId] = useState<string>(mockProductionOrders[0]?.id || '');
    
    const currentOrderProgress = useMemo(() => {
        const orderTasks = ganttTasks.filter(t => t.orderId === selectedOrderId);
        if (orderTasks.length === 0) return null;
        
        const tasks: KanbanTaskProgress[] = orderTasks.map(t => ({
            processId: t.processId,
            processName: t.processName,
            stationName: t.workstationName,
            status: t.progress === 100 ? 'Terminado' : t.progress > 0 ? 'En Proceso' : 'Pendiente',
            progress: t.progress
        }));
        
        return { productionOrderId: selectedOrderId, tasks };
    }, [selectedOrderId, ganttTasks]);

    const selectedOrder = useMemo(() => {
        return mockProductionOrders.find(op => op.id === selectedOrderId);
    }, [selectedOrderId]);

     return (
        <div>
            <div className="max-w-md mb-6">
                <label htmlFor="op-select-kanban" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Seleccionar Orden de Producción
                </label>
                <select 
                    id="op-select-kanban"
                    value={selectedOrderId} 
                    onChange={e => setSelectedOrderId(e.target.value)}
                    className="mt-1 block w-full input"
                >
                    <option value="">Seleccionar OP...</option>
                    {mockProductionOrders.map(op => (
                        <option key={op.id} value={op.id}>{op.id} - {op.productName}</option>
                    ))}
                </select>
            </div>

            {currentOrderProgress && selectedOrder ? (
                <div className="flex overflow-x-auto space-x-4 pb-4">
                    {currentOrderProgress.tasks.map(task => {
                        const advancedUnits = Math.floor((task.progress / 100) * selectedOrder.totalQuantity);
                        const ganttTask = ganttTasks.find(t => t.orderId === selectedOrderId && t.processId === task.processId);
                        return (
                        <Card key={task.processId} className="flex-shrink-0 w-80">
                            <h3 className="font-bold text-lg truncate">{task.processName}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{task.stationName}</p>
                            <div className="my-3">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getKanbanStatusColor(task.status)}`}>
                                    {task.status}
                                </span>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso</span>
                                    <span className="text-sm font-medium text-brand-blue">{task.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div 
                                        className="bg-brand-blue h-2.5 rounded-full" 
                                        style={{ width: `${task.progress}%` }}
                                    ></div>
                                </div>
                                 <div className="text-right text-sm mt-1 text-gray-600 dark:text-gray-400">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{advancedUnits}</span> / {selectedOrder.totalQuantity} uds.
                                </div>
                            </div>
                            {ganttTask && (
                                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 border-t pt-2 dark:border-gray-700">
                                    <p><strong>Inicio:</strong> {ganttTask.startDate.toLocaleDateString()}</p>
                                    <p><strong>Fin Prog.:</strong> {ganttTask.endDate.toLocaleDateString()}</p>
                                </div>
                            )}
                        </Card>
                        )
                    })}
                </div>
            ) : (
                <Card className="text-center p-8">
                    <p className="text-gray-500">
                        {selectedOrderId ? `No se encontró información de progreso para la OP ${selectedOrderId}.` : 'Por favor, seleccione una Orden de Producción para ver su avance.'}
                    </p>
                </Card>
            )}
        </div>
    );
};

const SchedulingModule: React.FC = () => {
    const TABS = [
        { id: 'kanban', label: 'Kanban' },
        { id: 'gantt', label: 'Diagrama de Gantt' },
        { id: 'processes', label: 'Procesos' },
        { id: 'shifts', label: 'Turnos' },
    ];
    
    // Centralized state for the module
    const [shifts, setShifts] = useState<Shift[]>(initialShifts);
    const [processes, setProcesses] = useState<ProcessDefinition[]>(initialProcesses);
    const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);

    const handleSaveShift = (shiftToSave: Shift) => {
        const exists = shifts.some(s => s.id === shiftToSave.id);
        if (exists) {
            setShifts(shifts.map(s => s.id === shiftToSave.id ? shiftToSave : s));
        } else {
            setShifts([...shifts, shiftToSave]);
        }
    };
    
    const handleDeleteShift = (shiftId: string) => {
        if(window.confirm('¿Eliminar este turno?')) {
            setShifts(shifts.filter(s => s.id !== shiftId));
        }
    }

    const handleSaveTask = (task: GanttTask) => {
        setGanttTasks(prev => [...prev.filter(t => t.id !== task.id), task].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()));
    };

    return (
        <Tabs tabs={TABS}>
            {(activeTab) => (
                <div>
                    {activeTab === 'kanban' && <KanbanTab ganttTasks={ganttTasks}/>}
                    {activeTab === 'gantt' && <GanttTab ganttTasks={ganttTasks} processes={processes} shifts={shifts} onSaveTask={handleSaveTask} />}
                    {activeTab === 'processes' && <ProcessesTab processes={processes} onUpdate={setProcesses}/>}
                    {activeTab === 'shifts' && <TurnsTab shifts={shifts} onSave={handleSaveShift} onDelete={handleDeleteShift}/>}
                </div>
            )}
        </Tabs>
    );
};

export default SchedulingModule;
