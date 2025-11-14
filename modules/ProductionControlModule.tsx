
import React, { useState, useMemo, useEffect } from 'react';
import { Button, Tabs, Modal, Table, Card, FileInput } from '../components/Common';
import { ProductionControlSession, ProductionOrder, ServiceOrder, ProcessDefinition, Employee, Machine, Product, EngineeringOperation, ProductionPause, ProductionQualityIssue } from '../types';

// Mock data from other modules
const mockProductionOrders: ProductionOrder[] = [
    { id: 'OP-101', customerOrderId: 'PED-001', productId: 'prod-001', productName: 'Camisa Oxford Clásica', reference: 'C-OX-01', client: 'Zara', status: 'In Progress', sizeCurve: [], totalQuantity: 250, creationDate: '2024-07-15' },
    { id: 'OP-102', productId: 'prod-002', productName: 'Pantalón Chino Slim', reference: 'P-CH-03', client: 'H&M', status: 'Pending', sizeCurve: [], totalQuantity: 300, creationDate: '2024-07-18' },
];
const mockServiceOrders: ServiceOrder[] = [
    { id: 'OS-001', productionOrderId: 'OP-101', orderType: 'Interno', processId: 'proc-2', workstationId: 'ws-2', productId: 'prod-001', productName: 'Camisa Oxford Clásica', status: 'Enviado', creationDate: '2024-07-20', totalQuantity: 250, items: [], materials: [] }
];
const mockProcesses: ProcessDefinition[] = [
    { id: 'proc-1', name: 'Proceso de Corte', workstations: [{id: 'ws-1', name: 'MESA 1'}] },
    { id: 'proc-2', name: 'Proceso de Confección', workstations: [{id: 'ws-2', name: 'MÓDULO 1'}, {id: 'ws-3', name: 'MÓDULO 2'}] },
];
const mockEmployees: Employee[] = [
    { id: 'emp-1', employeeCode: 'EMP-01', fullName: 'Juan Pérez', specialty: 'Operario máquina plana', status: 'Activo', assignedProcess: 'Proceso de Confección' } as Employee,
    { id: 'emp-2', employeeCode: 'EMP-02', fullName: 'María García', specialty: 'Fileteadora', status: 'Activo', assignedProcess: 'Proceso de Confección' } as Employee,
    { id: 'emp-3', employeeCode: 'EMP-03', fullName: 'Pedro Lopez', specialty: 'Revisor', status: 'Activo', assignedProcess: 'Proceso de Corte' } as Employee,
];
const mockMachines: Machine[] = [
    { id: 'maq-1', code: 'MQ-01', name: 'Plana 1 aguja', status: 'Operativa' } as Machine,
    { id: 'maq-2', code: 'MQ-02', name: 'Fileteadora 3 hilos', status: 'Operativa' } as Machine,
    { id: 'maq-3', code: 'MQ-03', name: 'Recubridora', status: 'Operativa' } as Machine,
];
const mockProducts: Product[] = [
    { id: 'prod-001', name: 'Camisa Oxford Clásica', reference: 'C-OX-01', client: 'Zara', collection: 'Verano 2024', standardTimePerUnit: 2.5, operationIds: ['op-eng-1', 'op-eng-2'] },
    { id: 'prod-002', name: 'Pantalón Chino Slim', reference: 'P-CH-03', client: 'H&M', collection: 'Verano 2024', standardTimePerUnit: 3.0, operationIds: [] },
];
const mockOperations: EngineeringOperation[] = [
    { id: 'op-eng-1', name: 'Cerrar Costados', process: 'Confección', standardTime: 0.2933 } as EngineeringOperation,
    { id: 'op-eng-2', name: 'Pegar Cuello', process: 'Confección', standardTime: 0.490 } as EngineeringOperation,
];

// Helper functions
const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

const QualityIssueModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (issue: Omit<ProductionQualityIssue, 'id' | 'reportedBy'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [type, setType] = useState<ProductionQualityIssue['type']>('Otro');
    const [description, setDescription] = useState('');
    const [photoUrl, setPhotoUrl] = useState<string | undefined>();

    const handleSave = () => {
        if (!description) {
            alert("La descripción es requerida.");
            return;
        }
        onSave({ type, description, photoUrl });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reportar Novedad de Calidad">
            <div className="space-y-4">
                <div>
                    <label className="label">Tipo de Novedad</label>
                    <select value={type} onChange={e => setType(e.target.value as any)} className="input w-full">
                        <option>Corte</option><option>Tela</option><option>Moldería</option>
                        <option>Manchas</option><option>Hilos</option><option>Agujas</option>
                        <option>Tensión</option><option>Otro</option>
                    </select>
                </div>
                <div>
                    <label className="label">Descripción Detallada</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input w-full"/>
                </div>
                <FileInput label="Evidencia Fotográfica (Opcional)" previewUrl={photoUrl} onFileChange={() => {}} onUrlChange={setPhotoUrl} />
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Reporte</Button>
            </div>
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};

const PauseProductionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onPause: (reason: ProductionPause['reason'], description?: string) => void;
}> = ({ isOpen, onClose, onPause }) => {
    const [reason, setReason] = useState<ProductionPause['reason']>('Descanso');
    const [description, setDescription] = useState('');

    const handlePause = () => {
        if (reason === 'Otro' && !description.trim()) {
            alert('Por favor, especifique el motivo de la pausa.');
            return;
        }
        onPause(reason, description);
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            setReason('Descanso');
            setDescription('');
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pausar Producción">
            <div className="space-y-4">
                <div>
                    <label className="label">Motivo de la Pausa</label>
                    <select value={reason} onChange={e => setReason(e.target.value as any)} className="input w-full">
                        <option>Almuerzo</option>
                        <option>Falta de material</option>
                        <option>Daño máquina</option>
                        <option>Calidad</option>
                        <option>Descanso</option>
                        <option>Reunión</option>
                        <option>Otro</option>
                    </select>
                </div>
                {reason === 'Otro' && (
                    <div>
                        <label className="label">Especifique el Motivo</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="input w-full"/>
                    </div>
                )}
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handlePause}>Confirmar Pausa</Button>
            </div>
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};


const InteractiveControlTab: React.FC<{
    sessions: ProductionControlSession[],
    onSessionChange: (session: ProductionControlSession) => void,
    onNewSession: () => void,
}> = ({ sessions, onSessionChange, onNewSession }) => {
    
    const activeSessions = sessions.filter(s => s.status !== 'Finalizado');

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button onClick={onNewSession}>+ Iniciar Control</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-8">
                {activeSessions.map(session => (
                    <ProductionControlCard key={session.id} session={session} onSessionChange={onSessionChange} />
                ))}
            </div>
            {activeSessions.length === 0 && <Card className="text-center p-8 text-gray-500">No hay controles de producción activos. Inicie uno nuevo para empezar.</Card>}
        </div>
    );
};

const ProductionControlCard: React.FC<{
    session: ProductionControlSession;
    onSessionChange: (session: ProductionControlSession) => void;
}> = ({ session, onSessionChange }) => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [unitsToAdd, setUnitsToAdd] = useState('');
    const [isQualityModalOpen, setQualityModalOpen] = useState(false);
    const [isPauseModalOpen, setPauseModalOpen] = useState(false);

    useEffect(() => {
        if (session.status !== 'Activo') {
            const start = new Date(session.startTime).getTime();
            const end = new Date(session.endTime || session.startTime).getTime();
            const totalPauseMs = session.pauses.reduce((acc, p) => acc + (p.durationMinutes || 0) * 60000, 0);
            setElapsedTime(end - start - totalPauseMs);
            return;
        }

        const calculateElapsedTime = () => {
            const start = new Date(session.startTime).getTime();
            const now = new Date().getTime();
            const totalPauseMs = session.pauses.reduce((acc, p) => {
                if (p.endTime) return acc + (new Date(p.endTime).getTime() - new Date(p.startTime).getTime());
                return acc;
            }, 0);
            return now - start - totalPauseMs;
        };
        
        const timer = setInterval(() => setElapsedTime(calculateElapsedTime()), 1000);
        return () => clearInterval(timer);
    }, [session]);

    useEffect(() => {
        const newTaskPerHour = session.samProcess > 0 ? (60 / session.samProcess) * session.personnelIds.length : 0;
        if (newTaskPerHour !== session.taskPerHour) {
            onSessionChange({ ...session, taskPerHour: newTaskPerHour });
        }
    }, [session.personnelIds, session.samProcess, onSessionChange]);

    const produced = useMemo(() => session.producedUnits.reduce((sum, u) => sum + u.quantity, 0), [session.producedUnits]);
    const progress = useMemo(() => (produced / session.totalUnits) * 100, [produced, session.totalUnits]);
    const efficiency = useMemo(() => {
        const elapsedMinutes = elapsedTime / 60000;
        const earnedMinutes = produced * session.samProcess;
        return elapsedMinutes > 0 ? (earnedMinutes / elapsedMinutes) * 100 : 0;
    }, [elapsedTime, produced, session.samProcess]);

    const handleAddUnits = () => {
        const quantity = parseInt(unitsToAdd);
        if (quantity > 0) {
            const newSession = {
                ...session,
                producedUnits: [...session.producedUnits, { quantity, timestamp: new Date().toISOString() }],
            };
            onSessionChange(newSession);
            setUnitsToAdd('');
        }
    };
    
    const handleConfirmPause = (reason: ProductionPause['reason'], description?: string) => {
        const newPause: ProductionPause = {
            id: `p-${Date.now()}`,
            reason,
            description,
            startTime: new Date().toISOString(),
        };
        onSessionChange({ ...session, status: 'Pausado', pauses: [...session.pauses, newPause] });
        setPauseModalOpen(false);
    };

    const handleResume = () => {
        const lastPause = session.pauses[session.pauses.length - 1];
        if (lastPause && !lastPause.endTime) {
            lastPause.endTime = new Date().toISOString();
            lastPause.durationMinutes = (new Date(lastPause.endTime).getTime() - new Date(lastPause.startTime).getTime()) / 60000;
        }
        onSessionChange({ ...session, status: 'Activo' });
    };

    const handleFinish = () => {
        if (window.confirm("¿Está seguro de que desea finalizar esta sesión de producción?")) {
            onSessionChange({ ...session, status: 'Finalizado', endTime: new Date().toISOString() });
        }
    };
    
    const handlePersonnelChange = (id: string, action: 'add' | 'remove') => {
        let newPersonnelIds = [...session.personnelIds];
        if (action === 'add' && !newPersonnelIds.includes(id)) {
            newPersonnelIds.push(id);
        } else if (action === 'remove') {
            newPersonnelIds = newPersonnelIds.filter(pId => pId !== id);
        }
        onSessionChange({ ...session, personnelIds: newPersonnelIds });
    };

    const handleMachineChange = (id: string, action: 'add' | 'remove') => {
        let newMachineIds = [...session.machineIds];
        if (action === 'add' && !newMachineIds.includes(id)) {
            newMachineIds.push(id);
        } else if (action === 'remove') {
            newMachineIds = newMachineIds.filter(mId => mId !== id);
        }
        onSessionChange({ ...session, machineIds: newMachineIds });
    };

    const handleSaveQualityIssue = (issue: Omit<ProductionQualityIssue, 'id' | 'reportedBy'>) => {
        const newIssue: ProductionQualityIssue = {
            ...issue,
            id: `qi-${Date.now()}`,
            reportedBy: 'Supervisor' // Or logged in user
        };
        onSessionChange({ ...session, qualityIssues: [...session.qualityIssues, newIssue] });
    };
    
    const orderInfo = useMemo(() => mockProductionOrders.find(op => op.id === session.productionOrderId), [session.productionOrderId]);
    const processInfo = useMemo(() => mockProcesses.find(p => p.id === session.processId), [session.processId]);
    const stationInfo = useMemo(() => processInfo?.workstations.find(w => w.id === session.workstationId), [processInfo, session.workstationId]);

    return (
        <Card className={`col-span-1 lg:col-span-1 xl:col-span-1 flex flex-col border-t-4 ${session.status === 'Activo' ? 'border-blue-500' : 'border-yellow-500'}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-2xl">{session.productionOrderId} - {orderInfo?.productName}</h3>
                    <p className="text-md text-gray-500">{processInfo?.name} / {stationInfo?.name}</p>
                </div>
                <span className={`font-mono text-3xl font-semibold p-2 rounded-lg ${session.status === 'Pausado' ? 'bg-yellow-100 text-yellow-800 animate-pulse' : ''}`}>{formatTime(elapsedTime)}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4 flex-grow">
                {/* Col 1: Progress */}
                <div className="flex flex-col space-y-4">
                     <div>
                        <div className="flex justify-between text-lg mb-1 font-semibold">
                            <span>Progreso</span>
                            <span>{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-blue-600 h-4 rounded-full" style={{ width: `${progress}%` }}></div></div>
                        <div className="text-right text-lg mt-1 font-semibold">
                            {produced} / {session.totalUnits} <span className="text-sm font-normal">uds.</span>
                        </div>
                    </div>
                     <div className="flex-grow flex flex-col items-center justify-center p-4 border dark:border-gray-700 rounded-lg">
                        <label className="label self-start">Registrar Unidades</label>
                        <input type="number" value={unitsToAdd} onChange={e => setUnitsToAdd(e.target.value)} placeholder="Cantidad" className="input w-full text-2xl text-center h-16 mb-2" disabled={session.status !== 'Activo'}/>
                        <Button onClick={handleAddUnits} disabled={session.status !== 'Activo'} className="w-full">+ Agregar</Button>
                    </div>
                </div>

                {/* Col 2: KPIs & Personnel */}
                <div className="flex flex-col space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 bg-gray-100 dark:bg-dark-accent rounded-lg">
                            <p className="text-sm text-gray-500">Eficiencia</p>
                            <p className="font-bold text-3xl">{efficiency.toFixed(1)}%</p>
                        </div>
                        <div className="p-3 bg-gray-100 dark:bg-dark-accent rounded-lg">
                            <p className="text-sm text-gray-500">Tarea / Hora</p>
                            <p className="font-bold text-3xl">{session.taskPerHour.toFixed(1)}</p>
                        </div>
                    </div>
                    <div className="flex-grow p-3 border dark:border-gray-700 rounded-lg">
                        <h4 className="font-semibold mb-2">Personal Asignado ({session.personnelIds.length})</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto mb-2">
                           {session.personnelIds.map(id => {
                               const emp = mockEmployees.find(e => e.id === id);
                               return <div key={id} className="flex justify-between items-center text-sm p-1 bg-gray-50 dark:bg-dark-accent rounded"><span className="truncate">{emp?.fullName}</span><button onClick={() => handlePersonnelChange(id, 'remove')} className="p-1 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">X</button></div>
                           })}
                        </div>
                        <select className="input text-sm w-full" value="" onChange={e => handlePersonnelChange(e.target.value, 'add')}>
                            <option value="">+ Añadir personal...</option>
                            {mockEmployees.filter(e => !session.personnelIds.includes(e.id)).map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                        </select>
                    </div>
                </div>

                {/* Col 3: Machines & Actions */}
                <div className="flex flex-col space-y-4">
                    <div className="flex-grow p-3 border dark:border-gray-700 rounded-lg">
                        <h4 className="font-semibold mb-2">Máquinas Asignadas ({session.machineIds.length})</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto mb-2">
                            {session.machineIds.map(id => {
                               const mac = mockMachines.find(m => m.id === id);
                               return <div key={id} className="flex justify-between items-center text-sm p-1 bg-gray-50 dark:bg-dark-accent rounded"><span className="truncate">{mac?.name}</span><button onClick={() => handleMachineChange(id, 'remove')} className="p-1 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">X</button></div>
                           })}
                        </div>
                         <select className="input text-sm w-full" value="" onChange={e => handleMachineChange(e.target.value, 'add')}>
                            <option value="">+ Añadir máquina...</option>
                            {mockMachines.filter(m => m.status === 'Operativa' && !session.machineIds.includes(m.id)).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                     <div className="mt-auto pt-4 border-t dark:border-gray-700 grid grid-cols-2 gap-2">
                        {session.status === 'Activo' && <Button variant="secondary" onClick={() => setPauseModalOpen(true)} className="w-full text-lg py-3">Pausar</Button>}
                        {session.status === 'Pausado' && <Button variant="primary" onClick={handleResume} className="w-full text-lg py-3">Reanudar</Button>}
                        <Button variant="secondary" onClick={() => setQualityModalOpen(true)} className="w-full text-lg py-3">
                            Calidad <span className="ml-2 inline-block bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{session.qualityIssues.length}</span>
                        </Button>
                        <Button variant="danger" onClick={handleFinish} className="col-span-2 w-full text-lg py-3">Finalizar Producción</Button>
                    </div>
                </div>
            </div>
            
            <QualityIssueModal 
                isOpen={isQualityModalOpen}
                onClose={() => setQualityModalOpen(false)}
                onSave={handleSaveQualityIssue}
            />
            <PauseProductionModal
                isOpen={isPauseModalOpen}
                onClose={() => setPauseModalOpen(false)}
                onPause={handleConfirmPause}
            />
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Card>
    );
};

const StartProductionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onStart: (session: ProductionControlSession) => void;
    sessions: ProductionControlSession[];
}> = ({ isOpen, onClose, onStart, sessions }) => {
    const [opId, setOpId] = useState('');
    const [serviceOrderId, setServiceOrderId] = useState<string | undefined>('');
    const [processId, setProcessId] = useState('');
    const [workstationId, setWorkstationId] = useState('');
    const [personnelIds, setPersonnelIds] = useState<string[]>([]);
    const [machineIds, setMachineIds] = useState<string[]>([]);

    useEffect(() => {
        if (!isOpen) {
            setOpId('');
            setServiceOrderId('');
            setProcessId('');
            setWorkstationId('');
            setPersonnelIds([]);
            setMachineIds([]);
        }
    }, [isOpen]);

    const selectedOrder = useMemo(() => mockProductionOrders.find(op => op.id === opId), [opId]);
    const availableWorkstations = useMemo(() => mockProcesses.find(p => p.id === processId)?.workstations || [], [processId]);
    
    const availableServiceOrders = useMemo(() => {
        if (!opId) return [];
        return mockServiceOrders.filter(so => so.productionOrderId === opId);
    }, [opId]);
    
    const busyPersonnelIds = useMemo(() => sessions.filter(s => s.status === 'Activo' || s.status === 'Pausado').flatMap(s => s.personnelIds), [sessions]);
    const busyMachineIds = useMemo(() => sessions.filter(s => s.status === 'Activo' || s.status === 'Pausado').flatMap(s => s.machineIds), [sessions]);
    
    const availableEmployees = useMemo(() => {
        const selectedProcess = mockProcesses.find(p => p.id === processId);
        const selectedProcessName = selectedProcess?.name;

        return mockEmployees.filter(emp => {
            // Must be active and not busy in another session
            const isAvailable = emp.status === 'Activo' && !busyPersonnelIds.includes(emp.id);
            if (!isAvailable) {
                return false;
            }

            // If a process is selected, filter by it.
            if (selectedProcessName) {
                return emp.assignedProcess === selectedProcessName;
            }

            // If no process is selected, show all available employees
            return true;
        });
    }, [busyPersonnelIds, processId]);

    const availableMachines = useMemo(() => mockMachines.filter(mac => mac.status === 'Operativa' && !busyMachineIds.includes(mac.id)), [busyMachineIds]);

    const handleAddPersonnel = (id: string) => { if (id && !personnelIds.includes(id)) setPersonnelIds(prev => [...prev, id]); };
    const handleRemovePersonnel = (id: string) => setPersonnelIds(prev => prev.filter(pId => pId !== id));
    const handleAddMachine = (id: string) => { if (id && !machineIds.includes(id)) setMachineIds(prev => [...prev, id]); };
    const handleRemoveMachine = (id: string) => setMachineIds(prev => prev.filter(mId => mId !== id));

    const handleStart = () => {
        if (!selectedOrder || !processId || !workstationId || personnelIds.length === 0) {
            alert("Complete todos los campos requeridos.");
            return;
        }

        const product = mockProducts.find(p => p.id === selectedOrder.productId);
        const samProcess = (product?.operationIds || [])
            .map(id => mockOperations.find(op => op.id === id))
            .reduce((sum, op) => sum + (op?.standardTime || 0), 0);

        const newSession: ProductionControlSession = {
            id: `pcs-${Date.now()}`,
            productionOrderId: opId,
            serviceOrderId: serviceOrderId || undefined,
            processId,
            workstationId,
            personnelIds,
            machineIds,
            startTime: new Date().toISOString(),
            status: 'Activo',
            totalUnits: selectedOrder.totalQuantity,
            producedUnits: [],
            pauses: [],
            qualityIssues: [],
            samProcess,
            taskPerHour: samProcess > 0 ? (60 / samProcess) * personnelIds.length : 0,
        };
        onStart(newSession);
        onClose();
    };
    
    return(
        <Modal isOpen={isOpen} onClose={onClose} title="Iniciar Control de Producción" size="4xl">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Orden de Producción (OP)</label><select value={opId} onChange={e => {setOpId(e.target.value); setServiceOrderId('');}} className="input w-full"><option value="">Seleccionar OP...</option>{mockProductionOrders.map(op => <option key={op.id} value={op.id}>{op.id} - {op.productName}</option>)}</select></div>
                    <div><label className="label">Orden de Servicio (Opcional)</label><select value={serviceOrderId} onChange={e => setServiceOrderId(e.target.value)} className="input w-full" disabled={!opId}><option value="">Seleccionar OS...</option>{availableServiceOrders.map(so => <option key={so.id} value={so.id}>{so.id}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Proceso</label><select value={processId} onChange={e => {setProcessId(e.target.value); setWorkstationId('')}} className="input w-full"><option value="">Seleccionar Proceso...</option>{mockProcesses.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                    <div><label className="label">Estación de Trabajo</label><select value={workstationId} onChange={e => setWorkstationId(e.target.value)} className="input w-full" disabled={!processId}><option value="">Seleccionar Estación...</option>{availableWorkstations.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="label">Personal Asignado</label>
                        <div className="p-2 border rounded-md min-h-[80px] space-y-1 bg-gray-50 dark:bg-dark-accent">
                            {personnelIds.map(id => {
                                const emp = mockEmployees.find(e => e.id === id);
                                return <div key={id} className="flex justify-between items-center text-sm p-1 bg-white dark:bg-dark-secondary rounded shadow-sm"><span>{emp?.fullName}</span><button onClick={() => handleRemovePersonnel(id)} className="font-bold text-red-500 px-2 rounded-full hover:bg-red-100">×</button></div>;
                            })}
                        </div>
                        <select value="" onChange={e => handleAddPersonnel(e.target.value)} className="input w-full mt-2 text-sm">
                            <option value="">+ Añadir personal disponible...</option>
                            {availableEmployees.filter(e => !personnelIds.includes(e.id)).map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Máquinas Asignadas</label>
                        <div className="p-2 border rounded-md min-h-[80px] space-y-1 bg-gray-50 dark:bg-dark-accent">
                            {machineIds.map(id => {
                                const mac = mockMachines.find(m => m.id === id);
                                return <div key={id} className="flex justify-between items-center text-sm p-1 bg-white dark:bg-dark-secondary rounded shadow-sm"><span>{mac?.name}</span><button onClick={() => handleRemoveMachine(id)} className="font-bold text-red-500 px-2 rounded-full hover:bg-red-100">×</button></div>;
                            })}
                        </div>
                        <select value="" onChange={e => handleAddMachine(e.target.value)} className="input w-full mt-2 text-sm">
                            <option value="">+ Añadir máquina disponible...</option>
                            {availableMachines.filter(m => !machineIds.includes(m.id)).map(mac => <option key={mac.id} value={mac.id}>{mac.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>
             <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleStart}>Iniciar Producción</Button>
            </div>
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};

const SessionDetailsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    session: ProductionControlSession | null;
}> = ({ isOpen, onClose, session }) => {
    if (!session) return null;

    const order = mockProductionOrders.find(op => op.id === session.productionOrderId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalles de Sesión: ${session.productionOrderId}`} size="4xl">
            <div className="space-y-4">
                <Card>
                    <h3 className="font-bold text-lg">{order?.productName} ({session.productionOrderId})</h3>
                    <p><strong>Unidades:</strong> {session.producedUnits.reduce((s, u) => s + u.quantity, 0)} / {session.totalUnits}</p>
                </Card>
                <Card>
                    <h3 className="font-semibold text-lg mb-2">Historial de Pausas</h3>
                    <Table headers={['Motivo', 'Descripción', 'Inicio', 'Fin', 'Duración (min)']}>
                        {session.pauses.map(pause => (
                            <tr key={pause.id}>
                                <td className="px-4 py-2">{pause.reason}</td>
                                <td className="px-4 py-2">{pause.description || '-'}</td>
                                <td className="px-4 py-2">{new Date(pause.startTime).toLocaleString()}</td>
                                <td className="px-4 py-2">{pause.endTime ? new Date(pause.endTime).toLocaleString() : 'En curso'}</td>
                                <td className="px-4 py-2">{pause.durationMinutes ? pause.durationMinutes.toFixed(2) : '-'}</td>
                            </tr>
                        ))}
                        {session.pauses.length === 0 && (
                            <tr><td colSpan={5} className="text-center p-4 text-gray-500">No se registraron pausas.</td></tr>
                        )}
                    </Table>
                </Card>
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cerrar</Button>
            </div>
        </Modal>
    );
};


const ProductionReportTab: React.FC<{
    sessions: ProductionControlSession[],
    onView: (session: ProductionControlSession) => void,
}> = ({ sessions, onView }) => {
    const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
    const [viewingSession, setViewingSession] = useState<ProductionControlSession | null>(null);

    const handleViewDetails = (session: ProductionControlSession) => {
        setViewingSession(session);
        setDetailsModalOpen(true);
    };

    return (
        <>
            <Card>
                <Table headers={['OP', 'Proceso', 'Estación', 'Avance', '%', 'Pausas', 'Estado', 'Acciones']}>
                    {sessions.map(s => {
                        const produced = s.producedUnits.reduce((sum, u) => sum + u.quantity, 0);
                        const progress = s.totalUnits > 0 ? (produced / s.totalUnits) * 100 : 0;
                        return(
                        <tr key={s.id}>
                            <td className="px-4 py-2">{s.productionOrderId}</td>
                            <td className="px-4 py-2">{mockProcesses.find(p=>p.id===s.processId)?.name}</td>
                            <td className="px-4 py-2">{mockProcesses.find(p=>p.id===s.processId)?.workstations.find(w=>w.id===s.workstationId)?.name}</td>
                            <td className="px-4 py-2">{produced} / {s.totalUnits}</td>
                            <td className="px-4 py-2">{progress.toFixed(1)}%</td>
                            <td className="px-4 py-2 text-center">{s.pauses.length}</td>
                            <td className="px-4 py-2">{s.status}</td>
                            <td className="px-4 py-2 space-x-2">
                                <Button variant="secondary" className="text-xs" onClick={() => handleViewDetails(s)}>Ver Detalles</Button>
                                {s.status !== 'Finalizado' && <Button variant="secondary" className="text-xs" onClick={() => onView(s)}>Retomar</Button>}
                            </td>
                        </tr>
                    )})}
                </Table>
            </Card>
            <SessionDetailsModal 
                isOpen={isDetailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                session={viewingSession}
            />
        </>
    );
};

const ProgressCard: React.FC<{
    session: ProductionControlSession;
    onView: (session: ProductionControlSession) => void;
    onSessionChange: (session: ProductionControlSession) => void;
}> = ({ session, onView, onSessionChange }) => {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        if (session.status !== 'Activo') {
            const start = new Date(session.startTime).getTime();
            const lastPauseStart = session.pauses.find(p => !p.endTime)?.startTime;
            const end = lastPauseStart ? new Date(lastPauseStart).getTime() : (session.endTime ? new Date(session.endTime).getTime() : new Date().getTime());
            const totalPauseMs = session.pauses.reduce((acc, p) => {
                 if (p.endTime) return acc + (new Date(p.endTime).getTime() - new Date(p.startTime).getTime());
                return acc;
            }, 0);
            setElapsedTime(end - start - totalPauseMs);
            return;
        }

        const calculateElapsedTime = () => {
            const start = new Date(session.startTime).getTime();
            const now = new Date().getTime();
            const totalPauseMs = session.pauses.reduce((acc, p) => {
                if (p.endTime) return acc + (new Date(p.endTime).getTime() - new Date(p.startTime).getTime());
                return acc;
            }, 0);
            return now - start - totalPauseMs;
        };
        
        const timer = setInterval(() => setElapsedTime(calculateElapsedTime()), 1000);
        return () => clearInterval(timer);
    }, [session]);

    const order = useMemo(() => mockProductionOrders.find(op => op.id === session.productionOrderId), [session.productionOrderId]);
    const product = useMemo(() => mockProducts.find(p => p.id === order?.productId), [order]);
    const process = useMemo(() => mockProcesses.find(p => p.id === session.processId), [session.processId]);

    const produced = useMemo(() => session.producedUnits.reduce((sum, u) => sum + u.quantity, 0), [session.producedUnits]);
    const progress = useMemo(() => (produced / session.totalUnits) * 100, [produced, session.totalUnits]);
    const efficiency = useMemo(() => {
        const elapsedMinutes = elapsedTime / 60000;
        const earnedMinutes = produced * session.samProcess;
        return elapsedMinutes > 0 ? (earnedMinutes / elapsedMinutes) * 100 : 0;
    }, [elapsedTime, produced, session.samProcess]);
    
    const handleFinish = () => {
        if (window.confirm("¿Está seguro de que desea finalizar esta sesión de producción?")) {
            onSessionChange({ ...session, status: 'Finalizado', endTime: new Date().toISOString() });
        }
    };

    return (
        <Card className="flex flex-col space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg truncate">{product?.name || 'Producto Desconocido'}</h3>
                    <p className="text-sm text-gray-500">{session.productionOrderId}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${session.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {session.status}
                </span>
            </div>
            
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Progreso</span>
                    <span className="text-sm font-medium text-brand-blue">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-brand-blue h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                <div className="text-right text-sm mt-1">
                    <span className="font-semibold">{produced}</span> / {session.totalUnits} uds.
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center text-sm border-y dark:border-gray-700 py-3">
                <div>
                    <p className="text-gray-500">Eficiencia</p>
                    <p className="font-bold text-xl">{efficiency.toFixed(1)}%</p>
                </div>
                <div>
                    <p className="text-gray-500">Tarea / Hora</p>
                    <p className="font-bold text-xl">{session.taskPerHour.toFixed(1)}</p>
                </div>
                 <div>
                    <p className="text-gray-500">Proceso</p>
                    <p className="font-bold text-md truncate">{process?.name}</p>
                </div>
                 <div>
                    <p className="text-gray-500">Tiempo Transcurrido</p>
                    <p className="font-bold text-md font-mono">{formatTime(elapsedTime)}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto">
                <Button variant="secondary" onClick={() => onView(session)}>Ver Control Interactivo</Button>
                <Button variant="danger" onClick={handleFinish}>Finalizar Producción</Button>
            </div>
        </Card>
    );
};

const ProgressViewTab: React.FC<{
    sessions: ProductionControlSession[],
    onView: (session: ProductionControlSession) => void,
    onSessionChange: (session: ProductionControlSession) => void,
}> = ({ sessions, onView, onSessionChange }) => {
    const activeSessions = sessions.filter(s => s.status === 'Activo' || s.status === 'Pausado');

    return (
        <div>
            {activeSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeSessions.map(session => (
                        <ProgressCard 
                            key={session.id} 
                            session={session} 
                            onView={onView} 
                            onSessionChange={onSessionChange} 
                        />
                    ))}
                </div>
            ) : (
                <Card className="text-center p-8 text-gray-500">
                    No hay ninguna producción en curso para mostrar.
                </Card>
            )}
        </div>
    );
};

const ProductionControlModule: React.FC = () => {
    const TABS = [
        { id: 'interactive', label: 'Control Interactivo' },
        { id: 'report', label: 'Reporte de Producción' },
        { id: 'progress', label: 'Avance por Proceso' },
    ];

    const [sessions, setSessions] = useState<ProductionControlSession[]>([]);
    const [isStartModalOpen, setStartModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('interactive');

    const handleSaveSession = (sessionToSave: ProductionControlSession) => {
        setSessions(prev => prev.map(s => s.id === sessionToSave.id ? sessionToSave : s));
    };

    const handleStartSession = (newSession: ProductionControlSession) => {
        setSessions(prev => [newSession, ...prev]);
    };
    
    const handleViewSession = (session: ProductionControlSession) => {
        setActiveTab('interactive');
        // Logic to maybe highlight the card could be added here
    };

    return (
        <>
            <Tabs tabs={TABS}>
                {(currentTab) => {
                    setActiveTab(currentTab); // A bit of a hack to sync parent state
                    return(
                    <div>
                        {currentTab === 'interactive' && <InteractiveControlTab sessions={sessions} onSessionChange={handleSaveSession} onNewSession={() => setStartModalOpen(true)} />}
                        {currentTab === 'report' && <ProductionReportTab sessions={sessions} onView={handleViewSession} />}
                        {currentTab === 'progress' && <ProgressViewTab sessions={sessions} onView={handleViewSession} onSessionChange={handleSaveSession}/>}
                    </div>
                )}}
            </Tabs>
            <StartProductionModal 
                isOpen={isStartModalOpen}
                onClose={() => setStartModalOpen(false)}
                onStart={handleStartSession}
                sessions={sessions}
            />
        </>
    );
};

export default ProductionControlModule;
