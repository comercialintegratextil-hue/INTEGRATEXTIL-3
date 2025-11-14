import React, { useState, useMemo, useEffect } from 'react';
import { Button, Tabs, Modal, Table, Card, FileInput } from '../components/Common';
import { MaintenanceTechnician, Machine, MachineUpdate, MaintenanceRecord, MaintenanceTicket, MachineTraceability } from '../types';
import * as Icons from '../components/Icons';

// --- MOCK DATA ---
const mockTechnicians: MaintenanceTechnician[] = [
    { id: 'tech-1', fullName: 'Carlos Rodriguez', idNumber: '11223344', specialty: 'Mecánica', phone: '3112223344', email: 'carlos.r@example.com', status: 'Activo', photoUrl: 'https://i.pravatar.cc/150?u=tech-1' },
    { id: 'tech-2', fullName: 'Lucia Fernandez', idNumber: '55667788', specialty: 'Eléctrica', phone: '3223334455', email: 'lucia.f@example.com', status: 'Activo', photoUrl: 'https://i.pravatar.cc/150?u=tech-2' },
];

const mockMachines: Machine[] = [
    { id: 'maq-1', code: 'MQ-01', name: 'Plana 1 aguja', type: 'Plana', brand: 'Juki', model: 'DDL-8700', serialNumber: 'SN-A123', purchaseDate: '2022-01-15', provider: 'MaquiCostura', acquisitionCost: 2500000, responsibleTechnicianId: 'tech-1', currentLocation: 'Módulo 1', status: 'Operativa', photoUrl: 'https://picsum.photos/seed/MQ-01/200' },
    { id: 'maq-2', code: 'MQ-02', name: 'Fileteadora 3 hilos', type: 'Fileteadora', brand: 'Brother', model: 'B551', serialNumber: 'SN-B456', purchaseDate: '2021-11-20', provider: 'Insemoda', acquisitionCost: 3200000, responsibleTechnicianId: 'tech-2', currentLocation: 'Mantenimiento', status: 'En mantenimiento', photoUrl: 'https://picsum.photos/seed/MQ-02/200' },
    { id: 'maq-3', code: 'MQ-03', name: 'Cortadora Vertical', type: 'Cortadora', brand: 'Eastman', model: 'Blue Streak II', serialNumber: 'SN-C789', purchaseDate: '2023-03-10', provider: 'MaquiCostura', acquisitionCost: 5500000, currentLocation: 'Bodega', status: 'En bodega', photoUrl: 'https://picsum.photos/seed/MQ-03/200' },
];

const mockUpdates: MachineUpdate[] = [
    { id: 'NV-MQ-01', machineId: 'maq-2', reportedBy: 'Operario Módulo 2', reportDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), description: 'El motor presenta un ruido extraño al arrancar.', type: 'Mecánica', priority: 'Media', status: 'En proceso', comments: 'Técnico asignado para revisión.' },
    { id: 'NV-MQ-02', machineId: 'maq-1', reportedBy: 'Supervisor A', reportDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), description: 'Requiere cambio de aguja por desgaste.', type: 'Operativa', priority: 'Baja', status: 'Abierta', comments: '' },
];


const mockTickets: MaintenanceTicket[] = [
    { id: 'TK-MQ-01', machineId: 'maq-2', openedBy: 'Supervisor A', openDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), requestType: 'Correctivo', problemDescription: 'La máquina salta puntadas.', status: 'En reparación', assignedTechnicianId: 'tech-2' },
];

const mockScheduled: MaintenanceRecord[] = [
    { id: 'MT-01', machineIds: ['maq-1'], type: 'Preventivo', scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().slice(0,10), scheduledTime: '08:00', assignedTechnicianId: 'tech-1', plannedTasks: 'Limpieza, lubricación, cambio de aguja.', requiredSpares: 'Aguja DPx5 #11', status: 'Programado', totalDurationMinutes: 240 },
    { id: 'MT-02', machineIds: ['maq-2', 'maq-3'], type: 'Correctivo', scheduledDate: new Date().toISOString().slice(0,10), scheduledTime: '10:00', assignedTechnicianId: 'tech-2', plannedTasks: 'Revisión general de sistema eléctrico.', requiredSpares: 'Fusibles', status: 'En ejecución', totalDurationMinutes: 180 }
];

const mockTraceability: MachineTraceability[] = [
    { id: 'trace-1', machineId: 'maq-2', currentLocation: 'Mantenimiento', responsible: 'Carlos Rodriguez', moveDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), machineStatus: 'Mantenimiento', reason: 'Ticket TK-MQ-01 Abierto' },
    { id: 'trace-2', machineId: 'maq-3', currentLocation: 'Bodega', responsible: 'Admin', moveDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), machineStatus: 'Inactiva', reason: 'Baja temporal de producción' },
    { id: 'trace-3', machineId: 'maq-1', currentLocation: 'Módulo 1', responsible: 'Supervisor A', moveDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), machineStatus: 'Operativa', reason: 'Asignación a OP-123' },
];


// --- SUBMODULES ---

const DashboardTab: React.FC<{ machines: Machine[], tickets: MaintenanceTicket[], scheduled: MaintenanceRecord[] }> = ({ machines, tickets, scheduled }) => {
    const kpis = useMemo(() => {
        const total = machines.length;
        const operational = machines.filter(m => m.status === 'Operativa').length;
        const openTickets = tickets.filter(t => t.status !== 'Cerrado').length;
        const upcomingMaintenance = scheduled.filter(s => s.status === 'Programado' && new Date(s.scheduledDate) > new Date()).length;
        
        return [
            { title: '% Máquinas Operativas', value: total > 0 ? `${((operational/total)*100).toFixed(0)}%` : '0%', icon: Icons.EngineeringIcon },
            { title: 'Tickets Abiertos', value: `${openTickets}`, icon: Icons.PlanningIcon },
            { title: 'Mant. Programados', value: `${upcomingMaintenance}`, icon: Icons.SchedulingIcon },
        ]
    }, [machines, tickets, scheduled]);

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {kpis.map(kpi => (
                    <Card key={kpi.title}>
                        <div className="flex items-center">
                            <div className="p-3 rounded-full mr-4 bg-blue-100 dark:bg-blue-900">
                                <kpi.icon className="h-6 w-6 text-blue-600 dark:text-blue-300"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.title}</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{kpi.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const MachineFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (machine: Machine) => void;
    editingMachine: Machine | null;
    machines: Machine[];
    technicians: MaintenanceTechnician[];
}> = ({ isOpen, onClose, onSave, editingMachine, machines, technicians }) => {
    
    const getInitialState = (): Omit<Machine, 'id'> => ({
        code: '', name: '', type: '', brand: '', model: '', serialNumber: '',
        purchaseDate: '', provider: '', acquisitionCost: 0,
        currentLocation: '', status: 'Operativa',
    });

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if(isOpen) {
            if (editingMachine) {
                setFormData(editingMachine);
            } else {
                const lastCodeNum = machines.map(m => parseInt(m.code.split('-')[1])).filter(Boolean).sort((a,b) => b-a)[0] || 0;
                const newCode = `MQ-${String(lastCodeNum + 1).padStart(2, '0')}`;
                setFormData({...getInitialState(), code: newCode});
            }
        }
    }, [isOpen, editingMachine, machines]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = () => {
        const finalMachine: Machine = {
            ...formData,
            id: editingMachine?.id || `maq-${Date.now()}`
        };
        onSave(finalMachine);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingMachine ? "Editar Máquina" : "Nueva Máquina"} size="4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <FileInput 
                        label="Foto de la Máquina"
                        previewUrl={formData.photoUrl}
                        onFileChange={() => {}}
                        onUrlChange={url => setFormData(p => ({...p, photoUrl: url}))}
                    />
                     <div><label className="label">Código Máquina</label><input type="text" name="code" value={formData.code} onChange={handleChange} className="input"/></div>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="label">Nombre Máquina</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Tipo de Máquina</label><input type="text" name="type" value={formData.type} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Marca</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Modelo</label><input type="text" name="model" value={formData.model} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Número de Serie</label><input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Fecha de Compra</label><input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Proveedor</label><input type="text" name="provider" value={formData.provider} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Costo de Adquisición</label><input type="number" name="acquisitionCost" value={formData.acquisitionCost} onChange={handleChange} className="input"/></div>
                    <div>
                        <label className="label">Técnico Responsable</label>
                        <select name="responsibleTechnicianId" value={formData.responsibleTechnicianId || ''} onChange={handleChange} className="input w-full">
                            <option value="">No asignado</option>
                            {technicians.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                        </select>
                    </div>
                    <div><label className="label">Ubicación Actual</label><input type="text" name="currentLocation" value={formData.currentLocation} onChange={handleChange} className="input"/></div>
                    <div>
                        <label className="label">Estado Actual</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="input w-full">
                            <option value="Operativa">Operativa</option>
                            <option value="En mantenimiento">En mantenimiento</option>
                            <option value="Inactiva">Inactiva</option>
                            <option value="En bodega">En bodega</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar Máquina</Button>
            </div>
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};

const MachineDetailView: React.FC<{
    machine: Machine;
    technicians: MaintenanceTechnician[];
    tickets: MaintenanceTicket[];
    onBack: () => void;
    onEdit: (machine: Machine) => void;
}> = ({ machine, technicians, tickets, onBack, onEdit }) => {
    const responsibleTechnician = technicians.find(t => t.id === machine.responsibleTechnicianId);
    const machineTickets = tickets.filter(t => t.machineId === machine.id && t.status !== 'Cerrado');

    const TABS = [
        { id: 'data', label: 'Datos Técnicos' },
        { id: 'history', label: 'Historial de Mantenimientos' },
        { id: 'tickets', label: `Tickets Abiertos (${machineTickets.length})` },
        { id: 'traceability', label: 'Trazabilidad' },
    ];
    
    const statusColor = {
        'Operativa': 'bg-green-100 text-green-800',
        'En mantenimiento': 'bg-yellow-100 text-yellow-800',
        'Inactiva': 'bg-gray-100 text-gray-800',
        'En bodega': 'bg-purple-100 text-purple-800',
    };

    return (
        <Card>
            <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                <div className="flex items-center gap-4">
                    <img src={machine.photoUrl} alt={machine.name} className="h-24 w-24 rounded-lg object-cover"/>
                    <div>
                        <h2 className="text-2xl font-bold">{machine.name} <span className="text-lg font-normal text-gray-500">({machine.code})</span></h2>
                        <p className="text-gray-600 dark:text-gray-300">{machine.type} - {machine.brand} {machine.model}</p>
                        <span className={`mt-2 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${statusColor[machine.status]}`}>{machine.status}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onBack}>← Volver al Listado</Button>
                    <Button onClick={() => onEdit(machine)}>Editar</Button>
                </div>
            </div>

            <Tabs tabs={TABS}>
                {(activeTab) => (
                    <div>
                        {activeTab === 'data' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm p-4">
                                <div><strong># Serie:</strong><p>{machine.serialNumber}</p></div>
                                <div><strong>Fecha Compra:</strong><p>{machine.purchaseDate}</p></div>
                                <div><strong>Proveedor:</strong><p>{machine.provider}</p></div>
                                <div><strong>Costo:</strong><p>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(machine.acquisitionCost)}</p></div>
                                <div><strong>Técnico Resp.:</strong><p>{responsibleTechnician?.fullName || 'N/A'}</p></div>
                                <div><strong>Ubicación:</strong><p>{machine.currentLocation}</p></div>
                            </div>
                        )}
                        {activeTab === 'tickets' && (
                            <Table headers={['# Ticket', 'Reportado Por', 'Fecha', 'Problema', 'Estado']}>
                                {machineTickets.map(ticket => (
                                    <tr key={ticket.id}>
                                        <td className="px-4 py-2">{ticket.id}</td>
                                        <td className="px-4 py-2">{ticket.openedBy}</td>
                                        <td className="px-4 py-2">{new Date(ticket.openDate).toLocaleString()}</td>
                                        <td className="px-4 py-2">{ticket.problemDescription}</td>
                                        <td className="px-4 py-2">{ticket.status}</td>
                                    </tr>
                                ))}
                                {machineTickets.length === 0 && <tr><td colSpan={5} className="text-center p-4">No hay tickets abiertos para esta máquina.</td></tr>}
                            </Table>
                        )}
                         {activeTab !== 'data' && activeTab !== 'tickets' && <p className="p-4 text-center text-gray-500">Esta sección está en construcción.</p>}
                    </div>
                )}
            </Tabs>
        </Card>
    );
};

const MachineryTab: React.FC<{
    machines: Machine[],
    technicians: MaintenanceTechnician[],
    tickets: MaintenanceTicket[],
    onSave: (machine: Machine) => void,
    onDelete: (id: string) => void,
}> = ({ machines, technicians, tickets, onSave, onDelete }) => {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMachines = useMemo(() => machines.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.type.toLowerCase().includes(searchTerm.toLowerCase())
    ), [machines, searchTerm]);

    const handleViewDetails = (machine: Machine) => {
        setSelectedMachine(machine);
        setView('detail');
    };

    const handleAddNew = () => {
        setEditingMachine(null);
        setFormOpen(true);
    };

    const handleEdit = (machine: Machine) => {
        setEditingMachine(machine);
        setFormOpen(true);
    };
    
    if (view === 'detail' && selectedMachine) {
        return <MachineDetailView 
            machine={selectedMachine} 
            technicians={technicians}
            tickets={tickets}
            onBack={() => setView('list')}
            onEdit={handleEdit}
        />
    }

    return (
        <div>
             <div className="flex justify-between items-center mb-4">
                <input 
                    type="text" 
                    placeholder="Buscar por código, nombre, tipo..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="input w-1/3"
                />
                <Button onClick={handleAddNew}>+ Nueva Máquina</Button>
            </div>
            <Card>
                <Table headers={['Foto', 'Código', 'Nombre', 'Tipo', 'Ubicación', 'Estado', 'Acciones']}>
                    {filteredMachines.map(machine => (
                        <tr key={machine.id}>
                            <td className="px-4 py-2"><img src={machine.photoUrl} alt={machine.name} className="h-10 w-10 rounded-md object-cover"/></td>
                            <td className="px-4 py-2 font-mono">{machine.code}</td>
                            <td className="px-4 py-2 font-medium">{machine.name}</td>
                            <td className="px-4 py-2">{machine.type}</td>
                            <td className="px-4 py-2">{machine.currentLocation}</td>
                            <td className="px-4 py-2">{machine.status}</td>
                            <td className="px-4 py-2 space-x-2">
                                <Button variant="secondary" className="text-xs" onClick={() => handleViewDetails(machine)}>Ver Ficha</Button>
                                <Button variant="danger" className="text-xs" onClick={() => onDelete(machine.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <MachineFormModal 
                isOpen={isFormOpen}
                onClose={() => setFormOpen(false)}
                onSave={onSave}
                editingMachine={editingMachine}
                machines={machines}
                technicians={technicians}
            />
        </div>
    );
};

const UpdateFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (update: MachineUpdate) => void;
    editingUpdate: MachineUpdate | null;
    updates: MachineUpdate[];
    machines: Machine[];
}> = ({ isOpen, onClose, onSave, editingUpdate, updates, machines }) => {
    
    const getInitialState = (): MachineUpdate => ({
        id: '', // Will be generated on save if new
        machineId: '',
        reportedBy: '',
        reportDate: new Date().toISOString(),
        description: '',
        type: 'Operativa',
        priority: 'Media',
        status: 'Abierta',
        comments: '',
    });

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            if (editingUpdate) {
                setFormData(editingUpdate);
            } else {
                const lastCodeNum = updates.map(u => parseInt(u.id.split('-')[2])).filter(Boolean).sort((a, b) => b - a)[0] || 0;
                const newId = `NV-MQ-${String(lastCodeNum + 1).padStart(2, '0')}`;
                setFormData({...getInitialState(), id: newId});
            }
        }
    }, [isOpen, editingUpdate, updates]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        onSave(formData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingUpdate ? 'Editar Novedad' : 'Nueva Novedad'} size="2xl">
            <div className="space-y-4">
                <div>
                    <label className="label">Máquina Relacionada</label>
                    <select name="machineId" value={formData.machineId} onChange={handleChange} className="input w-full">
                        <option value="">Seleccione una máquina...</option>
                        {machines.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
                    </select>
                </div>
                <div><label className="label">Reportado Por</label><input type="text" name="reportedBy" value={formData.reportedBy} onChange={handleChange} className="input"/></div>
                <div><label className="label">Descripción de la Novedad</label><textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="input w-full"/></div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="label">Tipo de Novedad</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="input w-full">
                           <option>Operativa</option><option>Mecánica</option><option>Eléctrica</option><option>Preventiva</option><option>Correctiva</option>
                        </select>
                    </div>
                     <div>
                        <label className="label">Prioridad</label>
                        <select name="priority" value={formData.priority} onChange={handleChange} className="input w-full">
                            <option>Baja</option><option>Media</option><option>Alta</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="label">Estado</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="input w-full">
                        <option>Abierta</option><option>En proceso</option><option>Cerrada</option>
                    </select>
                </div>
                <div><label className="label">Comentarios del Técnico</label><textarea name="comments" value={formData.comments} onChange={handleChange} rows={2} className="input w-full"/></div>
                <FileInput 
                    label="Evidencia (Opcional)" 
                    previewUrl={formData.evidenceUrl}
                    onFileChange={() => {}}
                    onUrlChange={url => setFormData(p => ({...p, evidenceUrl: url}))}
                />
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar Novedad</Button>
            </div>
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};


const UpdatesTab: React.FC<{
    updates: MachineUpdate[],
    machines: Machine[],
    onSave: (update: MachineUpdate) => void,
    onDelete: (id: string) => void,
}> = ({ updates, machines, onSave, onDelete }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState<MachineUpdate | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const priorityColors: Record<MachineUpdate['priority'], string> = {
        'Alta': 'bg-red-100 text-red-800', 'Media': 'bg-yellow-100 text-yellow-800', 'Baja': 'bg-blue-100 text-blue-800'
    };
    const statusColors: Record<MachineUpdate['status'], string> = {
        'Abierta': 'bg-gray-200 text-gray-800', 'En proceso': 'bg-blue-200 text-blue-800', 'Cerrada': 'bg-green-200 text-green-800'
    };

    const getMachineName = (id: string) => machines.find(m => m.id === id)?.name || 'N/A';

    const filteredUpdates = useMemo(() => updates.filter(u => 
        getMachineName(u.machineId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.priority.toLowerCase().includes(searchTerm.toLowerCase())
    ), [updates, searchTerm, machines]);
    
    const handleAddNew = () => {
        setEditingUpdate(null);
        setFormOpen(true);
    };

    const handleEdit = (update: MachineUpdate) => {
        setEditingUpdate(update);
        setFormOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <input type="text" placeholder="Buscar por máquina, tipo, prioridad..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input w-1/3"/>
                <Button onClick={handleAddNew}>+ Nueva Novedad</Button>
            </div>
            <Card>
                <Table headers={['Máquina', 'Reportado Por', 'Fecha', 'Prioridad', 'Estado', 'Acciones']}>
                    {filteredUpdates.map(upd => (
                        <tr key={upd.id}>
                            <td className="px-4 py-2 font-medium">{getMachineName(upd.machineId)}</td>
                            <td className="px-4 py-2">{upd.reportedBy}</td>
                            <td className="px-4 py-2">{new Date(upd.reportDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[upd.priority]}`}>{upd.priority}</span></td>
                            <td className="px-4 py-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[upd.status]}`}>{upd.status}</span></td>
                            <td className="px-4 py-2 space-x-2">
                                <Button variant="secondary" className="text-xs" onClick={() => handleEdit(upd)}>Ver/Editar</Button>
                                <Button variant="danger" className="text-xs" onClick={() => onDelete(upd.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
             <UpdateFormModal
                isOpen={isFormOpen}
                onClose={() => setFormOpen(false)}
                onSave={onSave}
                editingUpdate={editingUpdate}
                updates={updates}
                machines={machines}
            />
        </div>
    );
};

const SchedulingFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: MaintenanceRecord) => void;
    editingRecord: MaintenanceRecord | null;
    records: MaintenanceRecord[];
    machines: Machine[];
    technicians: MaintenanceTechnician[];
}> = ({ isOpen, onClose, onSave, editingRecord, records, machines, technicians }) => {

    const getInitialState = (): Omit<MaintenanceRecord, 'id'> => ({
        machineIds: [],
        type: 'Preventivo',
        scheduledDate: new Date().toISOString().slice(0, 10),
        scheduledTime: '08:00',
        assignedTechnicianId: '',
        plannedTasks: '',
        requiredSpares: '',
        status: 'Programado',
    });

    const [formData, setFormData] = useState(getInitialState());
    const [machineToAdd, setMachineToAdd] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editingRecord) {
                setFormData({
                    ...editingRecord,
                    machineIds: editingRecord.machineIds || [],
                });
            } else {
                setFormData(getInitialState());
            }
             setMachineToAdd('');
        }
    }, [isOpen, editingRecord]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleAddMachine = () => {
        if (machineToAdd && !formData.machineIds.includes(machineToAdd)) {
            setFormData(prev => ({ ...prev, machineIds: [...prev.machineIds, machineToAdd] }));
            setMachineToAdd('');
        }
    };
    
    const handleRemoveMachine = (idToRemove: string) => {
        setFormData(prev => ({ ...prev, machineIds: prev.machineIds.filter(id => id !== idToRemove) }));
    };

    const handleSubmit = () => {
        let finalRecord: MaintenanceRecord;
        if (editingRecord) {
            finalRecord = { ...editingRecord, ...formData };
        } else {
            const lastCodeNum = records.map(r => parseInt(r.id.split('-')[1])).filter(Boolean).sort((a, b) => b - a)[0] || 0;
            const newId = `MT-${String(lastCodeNum + 1).padStart(2, '0')}`;
            finalRecord = {
                ...formData,
                id: newId,
            };
        }
        onSave(finalRecord);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingRecord ? "Editar Mantenimiento" : "Programar Mantenimiento"} size="2xl">
            <div className="space-y-4">
                 <div>
                    <label className="label">Máquinas</label>
                    <div className="flex items-center gap-2">
                        <select 
                            value={machineToAdd} 
                            onChange={e => setMachineToAdd(e.target.value)} 
                            className="input flex-grow"
                        >
                            <option value="">Seleccionar para añadir...</option>
                            {machines
                                .filter(m => !formData.machineIds.includes(m.id))
                                .map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
                        </select>
                        <Button onClick={handleAddMachine} disabled={!machineToAdd}>Añadir</Button>
                    </div>
                    <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                        {formData.machineIds.map(id => {
                            const machine = machines.find(m => m.id === id);
                            return (
                                <div key={id} className="flex justify-between items-center p-1 px-2 bg-gray-100 dark:bg-dark-accent rounded">
                                    <span className="text-sm">{machine?.name || 'ID Desconocido'}</span>
                                    <button onClick={() => handleRemoveMachine(id)} className="text-red-500 font-bold text-sm">×</button>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Tipo de Mantenimiento</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="input w-full">
                            <option>Preventivo</option>
                            <option>Predictivo</option>
                            <option>Correctivo</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Técnico Asignado</label>
                        <select name="assignedTechnicianId" value={formData.assignedTechnicianId} onChange={handleChange} className="input w-full">
                            <option value="">Seleccionar técnico...</option>
                            {technicians.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Fecha Programada</label>
                        <input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleChange} className="input w-full"/>
                    </div>
                     <div>
                        <label className="label">Hora Programada</label>
                        <input type="time" name="scheduledTime" value={formData.scheduledTime} onChange={handleChange} className="input w-full"/>
                    </div>
                </div>
                <div><label className="label">Tareas o Procedimientos</label><textarea name="plannedTasks" value={formData.plannedTasks} onChange={handleChange} rows={3} className="input w-full"/></div>
                <div><label className="label">Repuestos Requeridos</label><input type="text" name="requiredSpares" value={formData.requiredSpares} onChange={handleChange} className="input w-full"/></div>
                 <div>
                    <label className="label">Estado</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="input w-full">
                        <option>Programado</option>
                        <option>En ejecución</option>
                        <option>Finalizado</option>
                        <option>Cancelado</option>
                    </select>
                </div>
                 <div><label className="label">Observaciones</label><textarea name="observations" value={formData.observations || ''} onChange={handleChange} rows={2} className="input w-full"/></div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </div>
             <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};

const SchedulingTab: React.FC<{
    scheduled: MaintenanceRecord[];
    machines: Machine[];
    technicians: MaintenanceTechnician[];
    onSave: (record: MaintenanceRecord) => void;
    onDelete: (id: string) => void;
}> = ({ scheduled, machines, technicians, onSave, onDelete }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewDate, setViewDate] = useState(new Date());

    const getMachineNames = (ids: string[]) => {
        if (!ids || ids.length === 0) return 'N/A';
        return ids.map(id => machines.find(m => m.id === id)?.name || id).join(', ');
    };
    
    const getTechnicianName = (id: string) => technicians.find(t => t.id === id)?.fullName || 'N/A';

    const filteredRecords = useMemo(() => scheduled.filter(r => 
        getMachineNames(r.machineIds).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTechnicianName(r.assignedTechnicianId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.status.toLowerCase().includes(searchTerm.toLowerCase())
    ), [scheduled, searchTerm, machines, technicians]);

    const { timeScale, dateRange } = useMemo(() => {
        const d = new Date(viewDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(d.setDate(diff));
        start.setHours(0, 0, 0, 0);
        const scale = Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(start);
            day.setDate(day.getDate() + i);
            return { label: day.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }), date: day };
        });
        const end = new Date(scale[scale.length - 1].date);
        end.setHours(23, 59, 59, 999);
        return { timeScale: scale, dateRange: { start, end } };
    }, [viewDate]);

    const handleNav = (direction: 'prev' | 'next' | 'today') => {
        setViewDate(current => {
            if (direction === 'today') return new Date();
            const d = new Date(current);
            const increment = direction === 'prev' ? -7 : 7;
            d.setDate(d.getDate() + increment);
            return d;
        });
    };

    const getTaskPosition = (record: MaintenanceRecord) => {
        const taskStart = new Date(`${record.scheduledDate}T${record.scheduledTime}`);
        const duration = record.totalDurationMinutes || 240; // Default 4 hours
        const taskEnd = new Date(taskStart.getTime() + duration * 60 * 1000);

        const totalRange = dateRange.end.getTime() - dateRange.start.getTime();
        const clampedStart = Math.max(taskStart.getTime(), dateRange.start.getTime());
        const clampedEnd = Math.min(taskEnd.getTime(), dateRange.end.getTime());

        if (clampedEnd < clampedStart) return { left: 0, width: 0 };

        const left = ((clampedStart - dateRange.start.getTime()) / totalRange) * 100;
        const width = ((clampedEnd - clampedStart) / totalRange) * 100;

        return { left, width };
    };
    
    const statusColors: Record<MaintenanceRecord['status'], string> = {
        'Programado': 'bg-blue-500',
        'En ejecución': 'bg-yellow-500',
        'Finalizado': 'bg-green-500',
        'Cancelado': 'bg-red-500',
    };

    const handleAddNew = () => {
        setEditingRecord(null);
        setFormOpen(true);
    };

    const handleEdit = (record: MaintenanceRecord) => {
        setEditingRecord(record);
        setFormOpen(true);
    };

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                 <div className="flex items-center gap-2">
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input w-48"/>
                    <Button variant="secondary" onClick={() => handleNav('prev')}>‹</Button>
                    <Button variant="secondary" onClick={() => handleNav('today')}>Hoy</Button>
                    <Button variant="secondary" onClick={() => handleNav('next')}>›</Button>
                    <span className="font-semibold text-lg ml-2">{dateRange.start.toLocaleDateString('es-CO', {month: 'long', year: 'numeric'})}</span>
                </div>
                <Button onClick={handleAddNew}>+ Nuevo Mantenimiento</Button>
            </div>
            
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-[1200px]">
                        {/* Header */}
                        <div className="grid grid-cols-[300px_1fr] bg-gray-50 dark:bg-dark-accent sticky top-0 z-10">
                            <div className="p-3 font-semibold border-r dark:border-gray-700">Máquina / Tarea</div>
                            <div className="grid grid-cols-7">
                                {timeScale.map(d => <div key={d.label} className="p-3 text-center font-semibold border-r dark:border-gray-700">{d.label}</div>)}
                            </div>
                        </div>
                        {/* Body */}
                        <div className="divide-y dark:divide-gray-700">
                           {filteredRecords.map(rec => {
                               const {left, width} = getTaskPosition(rec);
                               return (
                                <div key={rec.id} className="grid grid-cols-[300px_1fr] group cursor-pointer" onClick={() => handleEdit(rec)}>
                                    <div className="p-3 border-r dark:border-gray-700 group-hover:bg-gray-50 dark:group-hover:bg-dark-accent">
                                        <p className="font-bold truncate">{getMachineNames(rec.machineIds)}</p>
                                        <p className="text-xs text-gray-500">{rec.type} - {getTechnicianName(rec.assignedTechnicianId)}</p>
                                    </div>
                                    <div className="relative border-r dark:border-gray-700">
                                        <div className="grid grid-cols-7 h-full">
                                            {timeScale.map((_, i) => <div key={i} className="border-r dark:border-gray-700 h-full"></div>)}
                                        </div>
                                        {width > 0 && (
                                            <div 
                                                className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-md flex items-center px-2 text-white text-xs font-semibold shadow-md ${statusColors[rec.status]}`}
                                                style={{ left: `${left}%`, width: `${width}%` }}
                                            >
                                                <span className="truncate">{rec.id} - {rec.status}</span>
                                                 <div className="absolute hidden group-hover:block top-full left-1/2 -translate-x-1/2 mt-2 p-3 bg-gray-800 text-white rounded-lg shadow-lg z-30 w-64 whitespace-normal text-sm">
                                                    <p className="font-bold text-base">{rec.id}: {rec.type}</p>
                                                    <p><strong>Máquinas:</strong> {getMachineNames(rec.machineIds)}</p>
                                                    <p><strong>Técnico:</strong> {getTechnicianName(rec.assignedTechnicianId)}</p>
                                                    <p><strong>Fecha/Hora:</strong> {new Date(`${rec.scheduledDate}T${rec.scheduledTime}`).toLocaleString()}</p>
                                                    <p><strong>Tareas:</strong> {rec.plannedTasks}</p>
                                                    <p><strong>Estado:</strong> {rec.status}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                               )
                           })}
                        </div>
                    </div>
                </div>
                 {filteredRecords.length === 0 && <p className="text-center p-8 text-gray-500">No hay mantenimientos programados para esta vista.</p>}
            </Card>

            <SchedulingFormModal 
                isOpen={isFormOpen}
                onClose={() => setFormOpen(false)}
                onSave={onSave}
                editingRecord={editingRecord}
                records={scheduled}
                machines={machines}
                technicians={technicians}
            />
        </div>
    );
};


const TicketFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (ticket: MaintenanceTicket) => void;
    editingTicket: MaintenanceTicket | null;
    tickets: MaintenanceTicket[];
    machines: Machine[];
    technicians: MaintenanceTechnician[];
}> = ({ isOpen, onClose, onSave, editingTicket, tickets, machines, technicians }) => {

    const getInitialState = (): Omit<MaintenanceTicket, 'id'> => ({
        machineId: '',
        openedBy: 'Supervisor',
        openDate: new Date().toISOString(),
        requestType: 'Correctivo',
        problemDescription: '',
        status: 'Abierto',
    });

    const [formData, setFormData] = useState(getInitialState());
    
    useEffect(() => {
        if(isOpen) {
            if (editingTicket) {
                setFormData(editingTicket);
            } else {
                 setFormData(getInitialState());
            }
        }
    }, [isOpen, editingTicket]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let finalValue: any = value;
        if (name === 'supervisorConfirmation') {
            finalValue = (e.target as HTMLInputElement).checked;
        }

        const newFormData = { ...formData, [name]: finalValue };

        if (name === 'status' && value === 'Cerrado' && !newFormData.closeDate) {
            newFormData.closeDate = new Date().toISOString();
            const openTime = new Date(newFormData.openDate).getTime();
            const closeTime = new Date(newFormData.closeDate).getTime();
            newFormData.totalRepairTimeMinutes = Math.round((closeTime - openTime) / (1000 * 60));
        }
        
        setFormData(newFormData);
    };

    const handleSubmit = () => {
        let finalTicket: MaintenanceTicket;
        if (editingTicket) {
            finalTicket = { ...editingTicket, ...formData };
        } else {
            const lastCodeNum = tickets.map(t => parseInt(t.id.split('-')[2])).filter(Boolean).sort((a,b) => b-a)[0] || 0;
            const newId = `TK-MQ-${String(lastCodeNum + 1).padStart(2, '0')}`;
            finalTicket = { ...formData, id: newId };
        }
        onSave(finalTicket);
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingTicket ? `Gestionar Ticket ${editingTicket.id}`: 'Nuevo Ticket de Mantenimiento'} size="2xl">
             <div className="space-y-4">
                <div>
                    <label className="label">Máquina</label>
                    <select name="machineId" value={formData.machineId} onChange={handleChange} className="input w-full" disabled={!!editingTicket}>
                         <option value="">Seleccione una máquina...</option>
                         {machines.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
                    </select>
                </div>
                <div><label className="label">Descripción del Problema</label><textarea name="problemDescription" value={formData.problemDescription} onChange={handleChange} rows={3} className="input w-full"/></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Tipo de Solicitud</label>
                        <select name="requestType" value={formData.requestType} onChange={handleChange} className="input w-full">
                            <option>Correctivo</option><option>Ajuste</option><option>Emergencia</option>
                        </select>
                    </div>
                     <div>
                        <label className="label">Estado del Ticket</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="input w-full">
                           <option>Abierto</option><option>En revisión</option><option>En reparación</option><option>Cerrado</option>
                        </select>
                    </div>
                </div>
                 <div className="border-t pt-4 mt-4 dark:border-gray-700 space-y-4">
                     <h3 className="font-semibold">Seguimiento del Técnico</h3>
                      <div>
                        <label className="label">Técnico Asignado</label>
                        <select name="assignedTechnicianId" value={formData.assignedTechnicianId || ''} onChange={handleChange} className="input w-full">
                             <option value="">Asignar técnico...</option>
                             {technicians.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                        </select>
                    </div>
                     <div><label className="label">Diagnóstico del Técnico</label><textarea name="technicianDiagnosis" value={formData.technicianDiagnosis || ''} onChange={handleChange} rows={2} className="input w-full"/></div>
                     <div><label className="label">Procedimiento Aplicado</label><textarea name="procedureApplied" value={formData.procedureApplied || ''} onChange={handleChange} rows={2} className="input w-full"/></div>
                 </div>
                 {formData.status === 'Cerrado' && (
                    <div className="border-t pt-4 mt-4 dark:border-gray-700 space-y-4">
                        <h3 className="font-semibold">Cierre del Ticket</h3>
                        <div><strong>Tiempo total de reparación:</strong> {formData.totalRepairTimeMinutes} minutos</div>
                        <label className="flex items-center">
                            <input type="checkbox" name="supervisorConfirmation" checked={!!formData.supervisorConfirmation} onChange={handleChange} className="h-4 w-4 rounded"/>
                            <span className="ml-2">Confirmación del supervisor que recibe la máquina operativa</span>
                        </label>
                    </div>
                 )}
            </div>
             <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </div>
             <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    )
};


const TicketsTab: React.FC<{
    tickets: MaintenanceTicket[];
    machines: Machine[];
    technicians: MaintenanceTechnician[];
    onSave: (ticket: MaintenanceTicket) => void;
    onDelete: (id: string) => void;
}> = ({ tickets, machines, technicians, onSave, onDelete }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const calculateDuration = (openDate: string) => {
        const start = new Date(openDate).getTime();
        const now = currentTime.getTime();
        const diffMinutes = Math.round((now - start) / (1000 * 60));
        const days = Math.floor(diffMinutes / 1440);
        const hours = Math.floor((diffMinutes % 1440) / 60);
        const mins = diffMinutes % 60;
        return `${days > 0 ? `${days}d ` : ''}${hours}h ${mins}m`;
    };

    const getMachineName = (id: string) => machines.find(m => m.id === id)?.name || 'N/A';
    
    const filteredTickets = useMemo(() => tickets.filter(t => 
        getMachineName(t.machineId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.status.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => new Date(b.openDate).getTime() - new Date(a.openDate).getTime()), [tickets, searchTerm, machines]);
    
    const handleAddNew = () => {
        setEditingTicket(null);
        setFormOpen(true);
    };

    const handleEdit = (ticket: MaintenanceTicket) => {
        setEditingTicket(ticket);
        setFormOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <input type="text" placeholder="Buscar por máquina, estado..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input w-1/3"/>
                <Button onClick={handleAddNew}>+ Nuevo Ticket</Button>
            </div>
            <Card>
                <Table headers={['# Ticket', 'Máquina', 'Fecha Apertura', 'Tiempo Abierto', 'Estado', 'Acciones']}>
                    {filteredTickets.map(ticket => (
                        <tr key={ticket.id}>
                            <td className="px-4 py-2 font-medium">{ticket.id}</td>
                            <td className="px-4 py-2">{getMachineName(ticket.machineId)}</td>
                            <td className="px-4 py-2">{new Date(ticket.openDate).toLocaleString('es-CO')}</td>
                            <td className="px-4 py-2 font-mono">
                                {ticket.status !== 'Cerrado' ? calculateDuration(ticket.openDate) : `${ticket.totalRepairTimeMinutes || 0} min`}
                            </td>
                             <td className="px-4 py-2">{ticket.status}</td>
                            <td className="px-4 py-2 space-x-2">
                                <Button variant="secondary" className="text-xs" onClick={() => handleEdit(ticket)}>Gestionar</Button>
                                <Button variant="danger" className="text-xs" onClick={() => onDelete(ticket.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <TicketFormModal
                isOpen={isFormOpen}
                onClose={() => setFormOpen(false)}
                onSave={onSave}
                editingTicket={editingTicket}
                tickets={tickets}
                machines={machines}
                technicians={technicians}
            />
        </div>
    );
};

const MachineInfoModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    machine: Machine | null;
    technicianName: string;
}> = ({ isOpen, onClose, machine, technicianName }) => {
    if (!machine) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Ficha Técnica: ${machine.name}`} size="2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                     <img src={machine.photoUrl} alt={machine.name} className="w-full rounded-lg object-cover aspect-square"/>
                </div>
                <div className="md:col-span-2 space-y-3 text-sm">
                    <p><strong>Código:</strong> {machine.code}</p>
                    <p><strong>Tipo:</strong> {machine.type}</p>
                    <p><strong>Marca / Modelo:</strong> {machine.brand} / {machine.model}</p>
                    <p><strong># Serie:</strong> {machine.serialNumber}</p>
                    <p><strong>Fecha Compra:</strong> {machine.purchaseDate}</p>
                    <p><strong>Proveedor:</strong> {machine.provider}</p>
                    <p><strong>Costo:</strong> {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(machine.acquisitionCost)}</p>
                    <p><strong>Técnico Responsable:</strong> {technicianName}</p>
                    <p><strong>Ubicación Actual:</strong> {machine.currentLocation}</p>
                    <p><strong>Estado:</strong> {machine.status}</p>
                </div>
            </div>
             <div className="flex justify-end mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cerrar</Button>
            </div>
        </Modal>
    );
};

const TraceabilityTab: React.FC<{ 
    records: MachineTraceability[],
    machines: Machine[],
    technicians: MaintenanceTechnician[]
}> = ({ records, machines, technicians }) => {
    const [filters, setFilters] = useState({ type: '', machineId: '', location: '' });
    const [viewingMachine, setViewingMachine] = useState<Machine | null>(null);

    const filterOptions = useMemo(() => {
        const types = [...new Set(machines.map(m => m.type))];
        const locations = [...new Set(records.map(r => r.currentLocation))];
        return { types, locations };
    }, [machines, records]);

    const filteredRecords = useMemo(() => {
        return records.filter(rec => {
            const machine = machines.find(m => m.id === rec.machineId);
            if (!machine) return false;
            const typeMatch = !filters.type || machine.type === filters.type;
            const machineMatch = !filters.machineId || rec.machineId === filters.machineId;
            const locationMatch = !filters.location || rec.currentLocation.toLowerCase().includes(filters.location.toLowerCase());
            return typeMatch && machineMatch && locationMatch;
        }).sort((a, b) => new Date(b.moveDate).getTime() - new Date(a.moveDate).getTime());
    }, [records, machines, filters]);

    const handleViewMachine = (machineId: string) => {
        setViewingMachine(machines.find(m => m.id === machineId) || null);
    };

    return(
        <div>
            <Card className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select value={filters.type} onChange={e => setFilters(f => ({...f, type: e.target.value, machineId: ''}))} className="input">
                        <option value="">Filtrar por tipo...</option>
                        {filterOptions.types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={filters.machineId} onChange={e => setFilters(f => ({...f, machineId: e.target.value}))} className="input">
                        <option value="">Filtrar por máquina...</option>
                        {machines.filter(m => !filters.type || m.type === filters.type).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <input type="text" value={filters.location} onChange={e => setFilters(f => ({...f, location: e.target.value}))} placeholder="Filtrar por ubicación..." className="input" />
                </div>
            </Card>
            <Card>
                <Table headers={['Máquina', 'Ubicación', 'Responsable', 'Fecha', 'Estado Máquina', 'Motivo']}>
                    {filteredRecords.map(rec => {
                        const machine = machines.find(m => m.id === rec.machineId);
                        return (
                            <tr key={rec.id}>
                                <td className="px-4 py-2 font-medium">
                                    <button onClick={() => handleViewMachine(rec.machineId)} className="text-brand-blue hover:underline text-left">
                                        {machine?.name || 'N/A'}
                                        <span className="block text-xs text-gray-500">{machine?.code}</span>
                                    </button>
                                </td>
                                <td className="px-4 py-2">{rec.currentLocation}</td>
                                <td className="px-4 py-2">{rec.responsible}</td>
                                <td className="px-4 py-2">{new Date(rec.moveDate).toLocaleString()}</td>
                                <td className="px-4 py-2">{rec.machineStatus}</td>
                                <td className="px-4 py-2">{rec.reason}</td>
                            </tr>
                        )
                    })}
                </Table>
            </Card>
            <MachineInfoModal
                isOpen={!!viewingMachine}
                onClose={() => setViewingMachine(null)}
                machine={viewingMachine}
                technicianName={technicians.find(t => t.id === viewingMachine?.responsibleTechnicianId)?.fullName || 'N/A'}
            />
        </div>
    );
};

const TechnicianFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (tech: MaintenanceTechnician) => void;
    editingTechnician: MaintenanceTechnician | null;
}> = ({ isOpen, onClose, onSave, editingTechnician }) => {
    
    const getInitialState = (): Omit<MaintenanceTechnician, 'id'> => ({
        fullName: '', idNumber: '', specialty: 'General', phone: '', email: '', status: 'Activo'
    });

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            setFormData(editingTechnician || getInitialState());
        }
    }, [isOpen, editingTechnician]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        onSave({ ...formData, id: editingTechnician?.id || `tech-${Date.now()}` });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingTechnician ? "Editar Técnico" : "Nuevo Técnico"} size="2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <FileInput 
                        label="Foto del Técnico"
                        previewUrl={formData.photoUrl}
                        onFileChange={() => {}}
                        onUrlChange={url => setFormData(p => ({...p, photoUrl: url}))}
                    />
                </div>
                <div className="space-y-4">
                    <div><label className="label">Nombre Completo</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Cédula</label><input type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Teléfono</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="input"/></div>
                    <div>
                        <label className="label">Especialidad</label>
                        <select name="specialty" value={formData.specialty} onChange={handleChange} className="input w-full">
                            <option>General</option><option>Mecánica</option><option>Eléctrica</option><option>Electrónica</option><option>Neumática</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Estado</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="input w-full">
                            <option>Activo</option><option>Inactivo</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </div>
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};

const TechniciansTab: React.FC<{
    technicians: MaintenanceTechnician[],
    onSave: (tech: MaintenanceTechnician) => void;
    onDelete: (id: string) => void;
}> = ({ technicians, onSave, onDelete }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingTechnician, setEditingTechnician] = useState<MaintenanceTechnician | null>(null);

    const handleAddNew = () => {
        setEditingTechnician(null);
        setFormOpen(true);
    };

    const handleEdit = (tech: MaintenanceTechnician) => {
        setEditingTechnician(tech);
        setFormOpen(true);
    };

    return(
         <div>
            <div className="flex justify-end items-center mb-4">
                <Button onClick={handleAddNew}>+ Nuevo Técnico</Button>
            </div>
            <Card>
                <Table headers={['Foto', 'Nombre', 'Cédula', 'Especialidad', 'Estado', 'Acciones']}>
                    {technicians.map(tech => (
                        <tr key={tech.id}>
                            <td className="px-4 py-2"><img src={tech.photoUrl} alt={tech.fullName} className="h-10 w-10 rounded-full object-cover"/></td>
                            <td className="px-4 py-2 font-medium">{tech.fullName}</td>
                            <td className="px-4 py-2">{tech.idNumber}</td>
                            <td className="px-4 py-2">{tech.specialty}</td>
                            <td className="px-4 py-2">{tech.status}</td>
                            <td className="px-4 py-2 space-x-2">
                                <Button variant="secondary" className="text-xs" onClick={() => handleEdit(tech)}>Editar</Button>
                                <Button variant="danger" className="text-xs" onClick={() => onDelete(tech.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <TechnicianFormModal
                isOpen={isFormOpen}
                onClose={() => setFormOpen(false)}
                onSave={onSave}
                editingTechnician={editingTechnician}
            />
        </div>
    );
};


// --- MAIN MODULE COMPONENT ---

const MaintenanceModule: React.FC = () => {
    const TABS = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'machinery', label: 'Maquinaria' },
        { id: 'updates', label: 'Novedades' },
        { id: 'scheduling', label: 'Programación' },
        { id: 'tickets', label: 'Tickets' },
        { id: 'traceability', label: 'Trazabilidad' },
        { id: 'technicians', label: 'Técnicos' },
    ];

    // State management for all data in the module
    const [machines, setMachines] = useState<Machine[]>(mockMachines);
    const [technicians, setTechnicians] = useState<MaintenanceTechnician[]>(mockTechnicians);
    const [updates, setUpdates] = useState<MachineUpdate[]>(mockUpdates);
    const [scheduled, setScheduled] = useState<MaintenanceRecord[]>(mockScheduled);
    const [tickets, setTickets] = useState<MaintenanceTicket[]>(mockTickets);
    const [traceability, setTraceability] = useState<MachineTraceability[]>(mockTraceability);
    
    const handleSaveMachine = (machineToSave: Machine) => {
        setMachines(prev => {
            const index = prev.findIndex(m => m.id === machineToSave.id);
            if (index > -1) {
                const newMachines = [...prev];
                newMachines[index] = machineToSave;
                return newMachines;
            }
            return [machineToSave, ...prev];
        });
    };
    
    const handleDeleteMachine = (id: string) => {
        if(window.confirm('¿Está seguro de que desea eliminar esta máquina?')) {
            setMachines(prev => prev.filter(m => m.id !== id));
        }
    };
    
    const handleSaveUpdate = (updateToSave: MachineUpdate) => {
        setUpdates(prev => {
            const index = prev.findIndex(u => u.id === updateToSave.id);
            if (index > -1) {
                const newUpdates = [...prev];
                newUpdates[index] = updateToSave;
                return newUpdates;
            }
            return [updateToSave, ...prev];
        });
    };

    const handleDeleteUpdate = (id: string) => {
        if(window.confirm('¿Está seguro de que desea eliminar esta novedad?')) {
            setUpdates(prev => prev.filter(u => u.id !== id));
        }
    };

    const handleSaveScheduled = (recordToSave: MaintenanceRecord) => {
        setScheduled(prev => {
            const index = prev.findIndex(r => r.id === recordToSave.id);
            if (index > -1) {
                const newRecords = [...prev];
                newRecords[index] = recordToSave;
                return newRecords;
            }
            return [recordToSave, ...prev];
        });
    };

    const handleDeleteScheduled = (id: string) => {
        if(window.confirm('¿Está seguro de que desea eliminar esta programación?')) {
            setScheduled(prev => prev.filter(r => r.id !== id));
        }
    };
    
    const handleSaveTicket = (ticketToSave: MaintenanceTicket) => {
        setTickets(prev => {
            const index = prev.findIndex(t => t.id === ticketToSave.id);
            if (index > -1) {
                const newTickets = [...prev];
                newTickets[index] = ticketToSave;
                return newTickets;
            }
            return [ticketToSave, ...prev];
        });
    };

    const handleDeleteTicket = (id: string) => {
        if(window.confirm('¿Está seguro de que desea eliminar este ticket?')) {
            setTickets(prev => prev.filter(t => t.id !== id));
        }
    };
    
    const handleSaveTechnician = (techToSave: MaintenanceTechnician) => {
        setTechnicians(prev => {
            const index = prev.findIndex(t => t.id === techToSave.id);
            if (index > -1) {
                const newTechs = [...prev];
                newTechs[index] = techToSave;
                return newTechs;
            }
            return [techToSave, ...prev];
        });
    };

    const handleDeleteTechnician = (id: string) => {
        if(window.confirm('¿Está seguro de que desea eliminar este técnico?')) {
            setTechnicians(prev => prev.filter(t => t.id !== id));
        }
    };

    return (
        <Tabs tabs={TABS}>
            {(activeTab) => (
                <div>
                    {activeTab === 'dashboard' && <DashboardTab machines={machines} tickets={tickets} scheduled={scheduled} />}
                    {activeTab === 'machinery' && <MachineryTab machines={machines} technicians={technicians} tickets={tickets} onSave={handleSaveMachine} onDelete={handleDeleteMachine} />}
                    {activeTab === 'updates' && <UpdatesTab updates={updates} machines={machines} onSave={handleSaveUpdate} onDelete={handleDeleteUpdate} />}
                    {activeTab === 'scheduling' && <SchedulingTab scheduled={scheduled} machines={machines} technicians={technicians} onSave={handleSaveScheduled} onDelete={handleDeleteScheduled} />}
                    {activeTab === 'tickets' && <TicketsTab tickets={tickets} machines={machines} technicians={technicians} onSave={handleSaveTicket} onDelete={handleDeleteTicket} />}
                    {activeTab === 'traceability' && <TraceabilityTab records={traceability} machines={machines} technicians={technicians} />}
                    {activeTab === 'technicians' && <TechniciansTab technicians={technicians} onSave={handleSaveTechnician} onDelete={handleDeleteTechnician} />}
                </div>
            )}
        </Tabs>
    );
};

export default MaintenanceModule;