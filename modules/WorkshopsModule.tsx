

import React, { useState, useMemo, useEffect } from 'react';
import { Button, Tabs, Modal, Table, Card, FileInput } from '../components/Common';
import { ExternalWorkshop, WorkshopCRMTracking, CRMHistoryEvent, QualityRelease, ProductionOrder, Product, CRMHistoryEventType, ServiceOrder, ServiceOrderItem, ServiceOrderMaterial, CompanyInfo } from '../types';

declare global {
  interface Window {
    jspdf: any;
  }
}

// --- MOCK DATA ---
const mockWorkshops: ExternalWorkshop[] = [
    { id: 'ws-1', code: 'TL-01', name: 'Confecciones El Hilo Dorado', contactPerson: 'Ana Gomez', phone: '3101234567', email: 'ana.gomez@hilodorado.com', address: 'Calle 45 # 22-10, Bogotá', serviceType: 'Confección', costPerUnit: 3500, dailyCapacity: 500, businessDays: 'L-V', status: 'Activo' },
    { id: 'ws-2', code: 'TL-02', name: 'Estampados Creativos SAS', contactPerson: 'Luis Martinez', phone: '3207654321', email: 'luis.m@estampados.co', address: 'Cra 80 # 10-5, Medellín', serviceType: 'Estampado', costPerUnit: 1200, dailyCapacity: 1000, businessDays: 'L-S', status: 'Activo' },
];

const mockProductionOrders: ProductionOrder[] = [
    { id: 'OP-125', productId: 'prod-001', productName: 'Camisa Oxford', reference: 'C-OX-01', client: 'Zara', status: 'In Progress', sizeCurve: [], totalQuantity: 350, creationDate: '2024-07-19' },
    { id: 'OP-126', productId: 'prod-002', productName: 'Pantalón Chino', reference: 'P-CH-03', client: 'H&M', status: 'Pending', sizeCurve: [], totalQuantity: 600, creationDate: '2024-07-20' },
];

const mockServiceOrders: ServiceOrder[] = [
    { 
        id: 'OS-001', 
        productionOrderId: 'OP-125', 
        // Fix: Added missing 'orderType' property to satisfy the ServiceOrder type.
        orderType: 'Externo',
        productId: 'prod-001', 
        productName: 'Camisa Oxford', 
        providerId: 'ws-1', 
        providerName: 'Confecciones El Hilo Dorado', 
        status: 'Enviado', 
        creationDate: '2024-07-22', 
        totalQuantity: 100, 
        items: [
            { id: 'soi-1', size: 'M', color: 'Azul Celeste', quantity: 60, productionOrderQuantity: 200 },
            { id: 'soi-2', size: 'L', color: 'Azul Celeste', quantity: 40, productionOrderQuantity: 150 },
        ] as ServiceOrderItem[], 
        materials: [
            { materialId: 'prd-1', name: 'Tela Oxford Celeste', unit: 'm', theoreticalQuantity: 150 },
            { materialId: 'prd-2', name: 'Botones Nácar 12mm', unit: 'un', theoreticalQuantity: 800 },
        ] as ServiceOrderMaterial[],
    },
    // Fix: Added missing 'orderType' property to satisfy the ServiceOrder type.
    { id: 'OS-002', productionOrderId: 'OP-126', orderType: 'Externo', productId: 'prod-002', productName: 'Pantalón Chino', providerId: 'ws-2', providerName: 'Estampados Creativos SAS', status: 'Borrador', creationDate: '2024-07-23', totalQuantity: 200, items: [], materials: [] },
];

const mockProducts: Product[] = [
    { id: 'prod-001', name: 'Camisa Oxford', reference: 'C-OX-01', client: 'Zara', collection: 'Verano 2024', standardTimePerUnit: 2.5 },
    { id: 'prod-002', name: 'Pantalón Chino', reference: 'P-CH-03', client: 'H&M', collection: 'Verano 2024', standardTimePerUnit: 3.0 },
];

const mockCrmTrackings: WorkshopCRMTracking[] = [
    {
        id: 'CRM-TL-01', workshopId: 'ws-1', productionOrderId: 'OP-125', serviceOrderId: 'OS-001',
        productId: 'prod-001',
        totalQuantity: 350, startDate: '2024-07-25', estimatedDeliveryDate: '2024-08-15',
        generalStatus: 'En producción', currentStage: 'Corte / Confección',
        history: [
            { id: 'ev-1', date: '2024-07-25T10:00:00Z', type: 'Recepción de materiales' as any, responsible: 'Admin', description: 'Se entregan todos los insumos y telas al taller.', status: 'Cerrada' },
            { id: 'ev-2', date: '2024-07-28T14:30:00Z', type: 'Aprobación de preproducción', responsible: 'Supervisor A', description: 'Muestra de preproducción aprobada sin comentarios.', status: 'Cerrada' },
        ]
    }
];

const mockQualityReleases: QualityRelease[] = [
    { id: 'qr-1', trackingId: 'CRM-TL-01', inspectionDate: '2024-07-28', inspector: 'Supervisor A', stage: 'Preproducción', result: 'Aprobado', observations: 'OK', authorizedBy: 'Supervisor A' }
];

interface WorkshopsModuleProps {
    companyInfo: CompanyInfo;
}

// --- SUBMODULES ---

const WorkshopFormModal: React.FC<{
    isOpen: boolean; onClose: () => void; onSave: (workshop: ExternalWorkshop) => void;
    editingWorkshop: ExternalWorkshop | null; workshops: ExternalWorkshop[]
}> = ({ isOpen, onClose, onSave, editingWorkshop, workshops }) => {
    
    const getInitialState = (): Omit<ExternalWorkshop, 'id'> => ({
        code: '', name: '', contactPerson: '', phone: '', email: '', address: '',
        serviceType: 'Confección', costPerUnit: 0, dailyCapacity: 0, businessDays: 'L-V', status: 'Activo'
    });

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            if (editingWorkshop) setFormData(editingWorkshop);
            else {
                const lastCodeNum = workshops.map(w => parseInt(w.code.split('-')[1])).filter(Boolean).sort((a, b) => b-a)[0] || 0;
                setFormData({...getInitialState(), code: `TL-${String(lastCodeNum + 1).padStart(2, '0')}`});
            }
        }
    }, [isOpen, editingWorkshop, workshops]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(p => ({...p, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = () => {
        onSave({ ...formData, id: editingWorkshop?.id || `ws-${Date.now()}` });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingWorkshop ? "Editar Taller" : "Nuevo Taller Externo"} size="2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Código</label><input type="text" name="code" value={formData.code} onChange={handleChange} className="input"/></div>
                <div><label className="label">Nombre del Taller</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="input"/></div>
                <div><label className="label">Contacto Principal</label><input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="input"/></div>
                <div><label className="label">Teléfono</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input"/></div>
                <div className="md:col-span-2"><label className="label">Correo Electrónico</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="input"/></div>
                <div className="md:col-span-2"><label className="label">Dirección</label><input type="text" name="address" value={formData.address} onChange={handleChange} className="input"/></div>
                <div><label className="label">Tipo de Servicio</label><select name="serviceType" value={formData.serviceType} onChange={handleChange} className="input w-full"><option>Confección</option><option>Bordado</option><option>Estampado</option><option>Lavandería</option><option>Otro</option></select></div>
                <div><label className="label">Capacidad Diaria (uds)</label><input type="number" name="dailyCapacity" value={formData.dailyCapacity} onChange={handleChange} className="input"/></div>
                <div><label className="label">Estado</label><select name="status" value={formData.status} onChange={handleChange} className="input w-full"><option>Activo</option><option>Inactivo</option></select></div>
            </div>
             <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar Taller</Button>
            </div>
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};


const WorkshopsTab: React.FC<{
    workshops: ExternalWorkshop[]; onSave: (w: ExternalWorkshop) => void; onDelete: (id: string) => void;
}> = ({ workshops, onSave, onDelete }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ExternalWorkshop | null>(null);

    const handleEdit = (w: ExternalWorkshop) => { setEditing(w); setFormOpen(true); };
    const handleNew = () => { setEditing(null); setFormOpen(true); };

    return (
        <div>
            <div className="flex justify-end mb-4"><Button onClick={handleNew}>+ Nuevo Taller</Button></div>
            <Card>
                <Table headers={['Código', 'Nombre Taller', 'Contacto', 'Servicio', 'Estado', 'Acciones']}>
                    {workshops.map(w => (
                        <tr key={w.id}>
                            <td className="px-4 py-2 font-mono">{w.code}</td>
                            <td className="px-4 py-2 font-medium">{w.name}</td>
                            <td className="px-4 py-2">{w.contactPerson}</td>
                            <td className="px-4 py-2">{w.serviceType}</td>
                            <td className="px-4 py-2">{w.status}</td>
                            <td className="px-4 py-2 space-x-2">
                                <Button variant="secondary" className="text-xs" onClick={() => handleEdit(w)}>Editar</Button>
                                <Button variant="danger" className="text-xs" onClick={() => onDelete(w.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <WorkshopFormModal isOpen={isFormOpen} onClose={() => setFormOpen(false)} onSave={onSave} editingWorkshop={editing} workshops={workshops}/>
        </div>
    );
};

const CRMFormModal: React.FC<{
    isOpen: boolean; onClose: () => void; onSave: (tracking: WorkshopCRMTracking) => void;
    editingTracking: WorkshopCRMTracking | null; trackings: WorkshopCRMTracking[];
    workshops: ExternalWorkshop[]; productionOrders: ProductionOrder[]; serviceOrders: ServiceOrder[];
}> = ({ isOpen, onClose, onSave, editingTracking, trackings, workshops, productionOrders, serviceOrders }) => {

    const getInitialState = (): Omit<WorkshopCRMTracking, 'id' | 'history'> => {
        const po = productionOrders[0];
        return {
            workshopId: '', productionOrderId: '', productId: '', totalQuantity: 0,
            startDate: new Date().toISOString().slice(0, 10), estimatedDeliveryDate: '',
            generalStatus: 'En preproducción', currentStage: 'Recepción de materiales',
            serviceOrderId: undefined
        };
    };

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            if (editingTracking) setFormData(editingTracking);
            else setFormData(getInitialState());
        }
    }, [isOpen, editingTracking]);

    const handlePoChange = (poId: string) => {
        const po = productionOrders.find(p => p.id === poId);
        if (po) {
            setFormData(p => ({ ...p, productionOrderId: poId, productId: po.productId, totalQuantity: po.totalQuantity }));
        }
    };
    
    const handleSubmit = () => {
        const id = editingTracking?.id || `CRM-TL-${String((trackings.length || 0) + 1).padStart(2, '0')}`;
        onSave({ ...formData, id, history: editingTracking?.history || [] });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingTracking ? "Editar Seguimiento" : "Nuevo Seguimiento CRM"} size="4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Taller</label><select name="workshopId" value={formData.workshopId} onChange={e => setFormData(p => ({...p, workshopId: e.target.value}))} className="input w-full"><option value="">Seleccionar...</option>{workshops.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                <div><label className="label">Orden de Producción (OP)</label><select name="productionOrderId" value={formData.productionOrderId} onChange={e => handlePoChange(e.target.value)} className="input w-full"><option value="">Seleccionar...</option>{productionOrders.map(p=><option key={p.id} value={p.id}>{p.id} - {p.productName}</option>)}</select></div>
                <div>
                    <label className="label">Orden de Servicio (Opcional)</label>
                    <select 
                        name="serviceOrderId" 
                        value={formData.serviceOrderId || ''} 
                        onChange={e => setFormData(p => ({...p, serviceOrderId: e.target.value || undefined}))} 
                        className="input w-full"
                    >
                        <option value="">Seleccionar...</option>
                        {serviceOrders.map(so => <option key={so.id} value={so.id}>{so.id} - {so.providerName}</option>)}
                    </select>
                </div>
                <div><label className="label">Fecha de Inicio en Taller</label><input type="date" name="startDate" value={formData.startDate} onChange={e => setFormData(p => ({...p, startDate: e.target.value}))} className="input"/></div>
                <div><label className="label">Fecha Estimada de Entrega</label><input type="date" name="estimatedDeliveryDate" value={formData.estimatedDeliveryDate} onChange={e => setFormData(p => ({...p, estimatedDeliveryDate: e.target.value}))} className="input"/></div>
                <div><label className="label">Estado General</label><select name="generalStatus" value={formData.generalStatus} onChange={e => setFormData(p => ({...p, generalStatus: e.target.value as any}))} className="input w-full"><option>En preproducción</option><option>En producción</option><option>En control de calidad</option><option>Liberado</option><option>Entregado</option></select></div>
                <div><label className="label">Etapa Actual</label><select name="currentStage" value={formData.currentStage} onChange={e => setFormData(p => ({...p, currentStage: e.target.value as any}))} className="input w-full"><option>Recepción de materiales</option><option>Corte / Confección</option><option>Lavandería / Estampado</option><option>Terminados / Empaque</option><option>Control de calidad final</option></select></div>
            </div>
             <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar Seguimiento</Button>
            </div>
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};

const CRMDetailModal: React.FC<{
    isOpen: boolean; onClose: () => void; onSave: (tracking: WorkshopCRMTracking) => void;
    tracking: WorkshopCRMTracking | null; workshops: ExternalWorkshop[]; products: Product[];
}> = ({ isOpen, onClose, onSave, tracking, workshops, products }) => {

    const [eventData, setEventData] = useState<Omit<CRMHistoryEvent, 'id'>>({
        date: new Date().toISOString(), type: 'Llamada de seguimiento', responsible: 'Supervisor',
        description: '', status: 'Cerrada'
    });
    
    if (!isOpen || !tracking) return null;

    const workshop = workshops.find(w => w.id === tracking.workshopId);
    const product = products.find(p => p.id === tracking.productId);
    
    const handleAddEvent = () => {
        const newEvent: CRMHistoryEvent = { ...eventData, id: `ev-${Date.now()}`, date: new Date().toISOString() };
        const updatedTracking = { ...tracking, history: [newEvent, ...tracking.history] };
        onSave(updatedTracking);
        // Reset form
        setEventData({
            date: new Date().toISOString(), type: 'Llamada de seguimiento', responsible: 'Supervisor',
            description: '', status: 'Cerrada'
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Seguimiento: ${tracking.id}`} size="4xl">
            <div className="space-y-4">
                <Card className="bg-gray-50 dark:bg-dark-accent">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><strong>Taller:</strong><p>{workshop?.name}</p></div>
                        <div><strong>OP:</strong><p>{tracking.productionOrderId}</p></div>
                        <div><strong>OS Asociada:</strong><p>{tracking.serviceOrderId || 'N/A'}</p></div>
                        <div><strong>Producto:</strong><p>{product?.name}</p></div>
                        <div><strong>Cantidad:</strong><p>{tracking.totalQuantity} uds</p></div>
                        <div><strong>Estado:</strong><p className="font-bold">{tracking.generalStatus}</p></div>
                        <div><strong>Etapa:</strong><p className="font-bold">{tracking.currentStage}</p></div>
                        <div><strong>Inicio:</strong><p>{tracking.startDate}</p></div>
                        <div><strong>Entrega Est.:</strong><p>{tracking.estimatedDeliveryDate}</p></div>
                    </div>
                </Card>

                {/* Event Timeline */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Historial de Seguimiento</h3>
                     <div className="p-4 border dark:border-gray-700 rounded-lg space-y-3">
                        <h4 className="font-semibold">Añadir Nuevo Evento</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                           <select value={eventData.type} onChange={e => setEventData(p=>({...p, type: e.target.value as any}))} className="input text-sm"><option>Llamada de seguimiento</option><option>Visita técnica</option><option>Novedad de producción</option></select>
                           <input type="text" placeholder="Responsable" value={eventData.responsible} onChange={e => setEventData(p=>({...p, responsible: e.target.value}))} className="input text-sm"/>
                           <select value={eventData.status} onChange={e => setEventData(p=>({...p, status: e.target.value as any}))} className="input text-sm"><option>Cerrada</option><option>En proceso</option><option>Pendiente</option></select>
                        </div>
                         <textarea value={eventData.description} onChange={e => setEventData(p=>({...p, description: e.target.value}))} rows={2} placeholder="Descripción detallada del evento..." className="input w-full text-sm"/>
                        <div className="text-right"><Button onClick={handleAddEvent}>Añadir al Historial</Button></div>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {tracking.history.map(event => (
                            <div key={event.id} className="p-3 bg-gray-50 dark:bg-dark-accent rounded-md">
                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                    <p><strong className="text-gray-700 dark:text-gray-200">{event.type}</strong> por {event.responsible}</p>
                                    <p>{new Date(event.date).toLocaleString('es-CO')}</p>
                                </div>
                                <p className="mt-1 text-sm">{event.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-end mt-6 pt-4 border-t dark:border-gray-700"><Button variant="secondary" onClick={onClose}>Cerrar</Button></div>
        </Modal>
    );
};

const CRMTrackingTab: React.FC<{
    trackings: WorkshopCRMTracking[]; onSave: (t: WorkshopCRMTracking) => void; onDelete: (id: string) => void;
    workshops: ExternalWorkshop[]; productionOrders: ProductionOrder[]; products: Product[]; serviceOrders: ServiceOrder[];
    generatePdf: (tracking: WorkshopCRMTracking, serviceOrder: ServiceOrder | undefined, workshop: ExternalWorkshop | undefined, product: Product | undefined) => void;
}> = ({ trackings, onSave, onDelete, workshops, productionOrders, products, serviceOrders, generatePdf }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [isDetailOpen, setDetailOpen] = useState(false);
    const [editing, setEditing] = useState<WorkshopCRMTracking | null>(null);
    const [viewing, setViewing] = useState<WorkshopCRMTracking | null>(null);

    const handleEdit = (t: WorkshopCRMTracking) => { setEditing(t); setFormOpen(true); };
    const handleNew = () => { setEditing(null); setFormOpen(true); };
    const handleView = (t: WorkshopCRMTracking) => { setViewing(t); setDetailOpen(true); };
    
    const getWorkshopName = (id: string) => workshops.find(w => w.id === id)?.name || 'N/A';
    const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'N/A';

    return (
        <div>
            <div className="flex justify-end mb-4"><Button onClick={handleNew}>+ Nuevo Seguimiento</Button></div>
            <Card>
                <Table headers={['# Seguimiento', 'Taller', 'OP', 'OS Asociada', 'Producto', 'Estado General', 'Etapa Actual', 'Acciones']}>
                    {trackings.map(t => (
                        <tr key={t.id}>
                            <td className="px-4 py-2 font-mono">{t.id}</td>
                            <td className="px-4 py-2 font-medium">{getWorkshopName(t.workshopId)}</td>
                            <td className="px-4 py-2">{t.productionOrderId}</td>
                            <td className="px-4 py-2">{t.serviceOrderId || '-'}</td>
                            <td className="px-4 py-2">{getProductName(t.productId)}</td>
                            <td className="px-4 py-2">{t.generalStatus}</td>
                            <td className="px-4 py-2">{t.currentStage}</td>
                            <td className="px-4 py-2 space-x-2 whitespace-nowrap">
                                <Button variant="secondary" className="text-xs" onClick={() => handleView(t)}>Ver/Gestionar</Button>
                                <Button 
                                    variant="secondary" 
                                    className="text-xs" 
                                    onClick={() => {
                                        const serviceOrder = serviceOrders.find(so => so.id === t.serviceOrderId);
                                        const workshop = workshops.find(w => w.id === t.workshopId);
                                        const product = products.find(p => p.id === t.productId);
                                        generatePdf(t, serviceOrder, workshop, product);
                                    }}
                                    disabled={!t.serviceOrderId}
                                >
                                    PDF
                                </Button>
                                <Button variant="danger" className="text-xs" onClick={() => onDelete(t.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <CRMFormModal isOpen={isFormOpen} onClose={() => setFormOpen(false)} onSave={onSave} editingTracking={editing} trackings={trackings} workshops={workshops} productionOrders={productionOrders} serviceOrders={serviceOrders}/>
            <CRMDetailModal isOpen={isDetailOpen} onClose={() => setDetailOpen(false)} onSave={onSave} tracking={viewing} workshops={workshops} products={products} />
        </div>
    );
};

const QualityFormModal: React.FC<{
    isOpen: boolean; onClose: () => void; onSave: (release: QualityRelease) => void;
    trackings: WorkshopCRMTracking[];
}> = ({ isOpen, onClose, onSave, trackings }) => {

    const getInitialState = (): Omit<QualityRelease, 'id'> => ({
        trackingId: '', inspectionDate: new Date().toISOString().slice(0, 10), inspector: 'Supervisor Calidad',
        stage: 'Producción', result: 'Aprobado', observations: '', authorizedBy: ''
    });

    const [formData, setFormData] = useState(getInitialState());
    
    useEffect(() => { if (isOpen) setFormData(getInitialState()) }, [isOpen]);

    const handleSubmit = () => {
        onSave({ ...formData, id: `qr-${Date.now()}` });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nueva Liberación de Calidad" size="2xl">
            <div className="space-y-4">
                 <div><label className="label">Seguimiento CRM</label><select name="trackingId" value={formData.trackingId} onChange={e => setFormData(p=>({...p, trackingId: e.target.value}))} className="input w-full"><option value="">Seleccionar...</option>{trackings.map(t => <option key={t.id} value={t.id}>{t.id} ({t.productionOrderId})</option>)}</select></div>
                 <div className="grid grid-cols-2 gap-4">
                     <div><label className="label">Fecha Inspección</label><input type="date" name="inspectionDate" value={formData.inspectionDate} onChange={e => setFormData(p=>({...p, inspectionDate: e.target.value}))} className="input"/></div>
                     <div><label className="label">Inspector</label><input type="text" name="inspector" value={formData.inspector} onChange={e => setFormData(p=>({...p, inspector: e.target.value}))} className="input"/></div>
                     <div><label className="label">Etapa</label><select name="stage" value={formData.stage} onChange={e => setFormData(p=>({...p, stage: e.target.value as any}))} className="input w-full"><option>Preproducción</option><option>Producción</option><option>Final</option></select></div>
                     <div><label className="label">Resultado</label><select name="result" value={formData.result} onChange={e => setFormData(p=>({...p, result: e.target.value as any}))} className="input w-full"><option>Aprobado</option><option>Rechazado</option><option>Reproceso</option></select></div>
                 </div>
                 <div><label className="label">Observaciones</label><textarea name="observations" value={formData.observations} onChange={e => setFormData(p=>({...p, observations: e.target.value}))} rows={3} className="input w-full"/></div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar Liberación</Button>
            </div>
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};

const QualityTab: React.FC<{
    releases: QualityRelease[]; trackings: WorkshopCRMTracking[]; onSave: (r: QualityRelease) => void; onDelete: (id: string) => void;
}> = ({ releases, trackings, onSave, onDelete }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    return (
        <div>
            <div className="flex justify-end mb-4"><Button onClick={() => setFormOpen(true)}>+ Nueva Liberación</Button></div>
            <Card>
                <Table headers={['# Seguimiento', 'Fecha', 'Inspector', 'Etapa', 'Resultado', 'Acciones']}>
                    {releases.map(r => (
                        <tr key={r.id}>
                            <td className="px-4 py-2 font-mono">{r.trackingId}</td>
                            <td className="px-4 py-2">{r.inspectionDate}</td>
                            <td className="px-4 py-2">{r.inspector}</td>
                            <td className="px-4 py-2">{r.stage}</td>
                            <td className="px-4 py-2 font-semibold">{r.result}</td>
                            <td className="px-4 py-2 space-x-2">
                                <Button variant="secondary" className="text-xs">Ver</Button>
                                <Button variant="danger" className="text-xs" onClick={() => onDelete(r.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <QualityFormModal isOpen={isFormOpen} onClose={() => setFormOpen(false)} onSave={onSave} trackings={trackings}/>
        </div>
    );
};


const PerformanceTab: React.FC<{ workshops: ExternalWorkshop[], trackings: WorkshopCRMTracking[], releases: QualityRelease[] }> = ({ workshops, trackings, releases }) => {
    const performanceData = useMemo(() => {
        return workshops.map(w => {
            const workshopTrackings = trackings.filter(t => t.workshopId === w.id);
            const onTime = workshopTrackings.filter(t => new Date(t.history.find(h=>h.type === 'Entrega final')?.date || Date.now()) <= new Date(t.estimatedDeliveryDate)).length;
            const onTimeRate = workshopTrackings.length > 0 ? (onTime / workshopTrackings.length) * 100 : 100;

            const workshopReleases = releases.filter(r => workshopTrackings.some(t => t.id === r.trackingId));
            const approved = workshopReleases.filter(r => r.result === 'Aprobado').length;
            const qualityRate = workshopReleases.length > 0 ? (approved / workshopReleases.length) * 100 : 100;
            
            return {
                id: w.id,
                name: w.name,
                onTimeDeliveryRate: onTimeRate,
                qualityApprovalRate: qualityRate,
            };
        });
    }, [workshops, trackings, releases]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <h3 className="font-semibold mb-2">% Cumplimiento en Fechas</h3>
                {performanceData.map(d => <div key={d.id} className="flex justify-between items-center my-2"><p>{d.name}</p><p className="font-bold">{d.onTimeDeliveryRate.toFixed(1)}%</p></div>)}
            </Card>
            <Card>
                <h3 className="font-semibold mb-2">% Calidad Aprobada</h3>
                {performanceData.map(d => <div key={d.id} className="flex justify-between items-center my-2"><p>{d.name}</p><p className="font-bold">{d.qualityApprovalRate.toFixed(1)}%</p></div>)}
            </Card>
        </div>
    );
};

// --- MAIN MODULE ---
const WorkshopsModule: React.FC<WorkshopsModuleProps> = ({ companyInfo }) => {
    const TABS = [
        { id: 'workshops', label: 'Talleres' },
        { id: 'crm', label: 'Seguimiento CRM' },
        { id: 'quality', label: 'Control de Calidad' },
        { id: 'performance', label: 'Desempeño' },
    ];
    
    const [workshops, setWorkshops] = useState<ExternalWorkshop[]>(mockWorkshops);
    const [crmTrackings, setCrmTrackings] = useState<WorkshopCRMTracking[]>(mockCrmTrackings);
    const [qualityReleases, setQualityReleases] = useState<QualityRelease[]>(mockQualityReleases);
    
    const handleSave = <T extends {id: string}>(setState: React.Dispatch<React.SetStateAction<T[]>>) => (itemToSave: T) => {
        setState(prev => {
            const index = prev.findIndex(i => i.id === itemToSave.id);
            if (index > -1) {
                const newState = [...prev];
                newState[index] = itemToSave;
                return newState;
            }
            return [itemToSave, ...prev];
        });
    };

    const handleDelete = <T extends {id: string}>(setState: React.Dispatch<React.SetStateAction<T[]>>) => (id: string) => {
        if (window.confirm("¿Está seguro de que desea eliminar este registro?")) {
            setState(prev => prev.filter(i => i.id !== id));
        }
    };
    
    const handleSaveQualityRelease = (release: QualityRelease) => {
        handleSave(setQualityReleases)(release);
        // Auto-create history event
        const tracking = crmTrackings.find(t => t.id === release.trackingId);
        if (tracking) {
            const newEvent: CRMHistoryEvent = {
                id: `ev-qr-${release.id}`,
                date: new Date().toISOString(),
                type: 'Control de calidad',
                responsible: release.inspector,
                description: `Inspección de ${release.stage} con resultado: ${release.result}. Observaciones: ${release.observations}`,
                status: 'Cerrada'
            };
            const updatedTracking = {...tracking, history: [newEvent, ...tracking.history]};
            handleSave(setCrmTrackings)(updatedTracking);
        }
    };
    
    const generateServiceOrderPDF = (tracking: WorkshopCRMTracking, serviceOrder: ServiceOrder | undefined, workshop: ExternalWorkshop | undefined, product: Product | undefined) => {
        if (!window.jspdf) return alert("La librería de PDF no está cargada.");
        if (!serviceOrder) return alert("No hay una Orden de Servicio asociada para generar el PDF.");
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
    
        // Header
        if (companyInfo.logoUrl) {
            doc.addImage(companyInfo.logoUrl, 'PNG', 14, 15, 30, 15);
        }
        doc.setFontSize(20);
        doc.text(companyInfo.name, 105, 22, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`NIT: ${companyInfo.nit}`, 105, 28, { align: 'center' });
        
        doc.setFontSize(16);
        doc.text("Orden de Servicio", 200, 22, { align: 'right' });
        doc.setFontSize(12);
        doc.text(`# ${serviceOrder.id}`, 200, 28, { align: 'right' });
    
        // Main Info
        doc.setLineWidth(0.5);
        doc.line(14, 40, 200, 40);
    
        doc.setFontSize(12);
        doc.text("Datos del Proveedor", 14, 48);
        doc.setFontSize(10);
        doc.text(`Taller: ${workshop?.name || 'N/A'}`, 14, 54);
        doc.text(`Contacto: ${workshop?.contactPerson || 'N/A'}`, 14, 58);
        doc.text(`Dirección: ${workshop?.address || 'N/A'}`, 14, 62);
        doc.text(`Teléfono: ${workshop?.phone || 'N/A'}`, 14, 66);
    
        doc.text("Datos de la Orden", 110, 48);
        doc.text(`Fecha de Creación: ${serviceOrder.creationDate}`, 110, 54);
        doc.text(`OP Vinculada: ${tracking.productionOrderId}`, 110, 58);
        
        let startY = 75;
        if (serviceOrder.items.length > 0) {
            (doc as any).autoTable({
                startY, head: [['Talla', 'Color', 'Cantidad a Enviar']], body: serviceOrder.items.map(item => [item.size, item.color, item.quantity]),
                theme: 'grid', headStyles: { fillColor: [15, 23, 42] }
            });
            startY = (doc as any).lastAutoTable.finalY + 10;
        }
        if (serviceOrder.materials.length > 0) {
            (doc as any).autoTable({
                startY, head: [['Material', 'Consumo Teórico', 'Unidad']], body: serviceOrder.materials.map(mat => [mat.name, mat.theoreticalQuantity, mat.unit]),
                theme: 'grid', headStyles: { fillColor: [15, 23, 42] }
            });
            startY = (doc as any).lastAutoTable.finalY + 10;
        }
    
        const finalY = startY > 240 ? 20 : startY;
        doc.setLineWidth(0.2);
        doc.line(20, finalY + 30, 80, finalY + 30);
        doc.text("Elaborado por", 35, finalY + 35);
        doc.line(130, finalY + 30, 190, finalY + 30);
        doc.text("Recibido por (Proveedor)", 140, finalY + 35);
        
        doc.save(`Orden_Servicio_${serviceOrder.id}.pdf`);
    };

    return (
        <Tabs tabs={TABS}>
            {(activeTab) => (
                <div>
                    {activeTab === 'workshops' && <WorkshopsTab workshops={workshops} onSave={handleSave(setWorkshops)} onDelete={handleDelete(setWorkshops)} />}
                    {activeTab === 'crm' && <CRMTrackingTab 
                        trackings={crmTrackings} 
                        onSave={handleSave(setCrmTrackings)} 
                        onDelete={handleDelete(setCrmTrackings)} 
                        workshops={workshops} 
                        productionOrders={mockProductionOrders} 
                        products={mockProducts} 
                        serviceOrders={mockServiceOrders}
                        generatePdf={generateServiceOrderPDF} 
                    />}
                    {activeTab === 'quality' && <QualityTab releases={qualityReleases} trackings={crmTrackings} onSave={handleSaveQualityRelease} onDelete={handleDelete(setQualityReleases)} />}
                    {activeTab === 'performance' && <PerformanceTab workshops={workshops} trackings={crmTrackings} releases={qualityReleases} />}
                </div>
            )}
        </Tabs>
    );
};

export default WorkshopsModule;