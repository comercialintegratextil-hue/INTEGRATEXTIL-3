

import React, { useState, useMemo, useEffect } from 'react';
import { Button, Tabs, Modal, Table, Card } from '../components/Common';
import { CostCenter, LaborCost, FixedCost, ProductionOrderCosting, ProductionOrder, InventoryProduct, MaterialExplosion, ProductAssembly, ServiceOrder, ExternalWorkshop, Product, CompanyInfo } from '../types';

// --- MOCK DATA (Simulating data from other modules) ---
const mockProductionOrders: ProductionOrder[] = [
    { id: 'OP-101', customerOrderId: 'PED-001', productId: 'prd-3', productName: 'Camisa Oxford Talla M', reference: 'C-OX-01', client: 'Zara', status: 'Completed', sizeCurve: [], totalQuantity: 50, creationDate: '2024-07-15', costCenterId: 'cc-1' },
    { id: 'OP-102', productId: 'prd-3', productName: 'Camisa Oxford Talla M', reference: 'C-OX-01', client: 'H&M', status: 'In Progress', sizeCurve: [], totalQuantity: 100, creationDate: '2024-07-18', costCenterId: 'cc-1' },
];
const mockInventoryProducts: InventoryProduct[] = [
    { id: 'prd-1', code: 'PRD-01', name: 'Tela Oxford Celeste', family: 'Materia Prima', unit: 'm', unitCost: 8500, costCenter: 'Telas', minStock: 100, status: 'Activo' },
    { id: 'prd-2', code: 'PRD-02', name: 'Botones Nácar 12mm', family: 'Insumo', unit: 'un', unitCost: 150, costCenter: 'Insumos', minStock: 1000, status: 'Activo' },
    { id: 'prd-3', code: 'PRD-03', name: 'Camisa Oxford Talla M', family: 'Producto Terminado', unit: 'un', unitCost: 18000, costCenter: 'Producción', minStock: 20, status: 'Activo' },
];
const mockProducts: Product[] = [
    { id: 'prd-3', name: 'Camisa Oxford Talla M', reference: 'C-OX-01', client: 'Zara', collection: 'Verano 2024', standardTimePerUnit: 25 },
];
const mockMaterialExplosions: MaterialExplosion[] = [
    { id: 'EXP-001', productionOrderId: 'OP-101', productName: 'Camisa Oxford Talla M', totalQuantity: 50, creationDate: '2024-07-16', materials: [
        { materialId: 'prd-1', name: 'Tela Oxford Celeste', requiredQuantity: 75, materialCode: 'PRD-01', provider: 'N/A', unit: 'm' },
        { materialId: 'prd-2', name: 'Botones Nácar 12mm', requiredQuantity: 400, materialCode: 'PRD-02', provider: 'N/A', unit: 'un' },
    ]}
];
const mockAssemblies: ProductAssembly[] = [
    { id: 'asm-1', productionOrderId: 'OP-101', assemblyDate: '2024-07-20', sourceWarehouseId: 'wh-2', destinationWarehouseId: 'wh-1',
      finishedProduct: { productId: 'prd-3', name: 'Camisa Oxford Talla M', quantity: 50 },
      consumedMaterials: [
        { productId: 'prd-1', name: 'Tela Oxford Celeste', quantity: 78 }, // Real consumption is higher
        { productId: 'prd-2', name: 'Botones Nácar 12mm', quantity: 400 },
      ]
    }
];
const mockServiceOrders: ServiceOrder[] = [
    // Fix: Added missing 'orderType' property to satisfy the ServiceOrder type.
    { id: 'OS-003', productionOrderId: 'OP-102', orderType: 'Externo', productId: 'prd-3', productName: 'Camisa Oxford Talla M', providerId: 'ws-ext-1', providerName: 'Bordados ABC', status: 'Completado', creationDate: '2024-07-22', totalQuantity: 100, items: [], materials: [] }
];
const mockExternalWorkshops: ExternalWorkshop[] = [
    { id: 'ws-ext-1', code: 'TL-03', name: 'Bordados ABC', serviceType: 'Bordado', costPerUnit: 1200, contactPerson: '', dailyCapacity: 0, email: '', phone: '', address: '', businessDays: '', status: 'Activo' },
];

const mockInitialCostCenters: CostCenter[] = [
    { id: 'cc-1', code: 'CC-01', name: 'Módulo de Confección 1', type: 'Producción', status: 'Activo', responsible: 'Supervisor A' },
    { id: 'cc-2', code: 'CC-02', name: 'Administración', type: 'Administrativo', status: 'Activo', responsible: 'Gerencia' },
];

const mockInitialLaborCosts: LaborCost[] = [
    { id: 'lc-1', costCenterId: 'cc-1', costPerMinute: 250, effectiveDate: '2024-01-01', status: 'Activo' },
];

const mockInitialFixedCosts: FixedCost[] = [
    { id: 'fc-1', type: 'Arriendo', name: 'Arriendo Bodega Principal', amount: 5000000, costCenterId: 'cc-2', recordDate: '2024-07', isRecurring: true },
    { id: 'fc-2', type: 'Servicios Públicos', name: 'Energía Planta', amount: 1200000, costCenterId: 'cc-1', recordDate: '2024-07', isRecurring: true },
];

interface CostsModuleProps {
    companyInfo: CompanyInfo;
}

// --- Helper Functions ---
const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

// --- Submodule Components ---

const CRUDComponent: React.FC<{
    title: string;
    itemName: string;
    items: any[];
    headers: string[];
    renderRow: (item: any) => React.ReactNode;
    onSave: (item: any) => void;
    onDelete: (id: string) => void;
    FormComponent: React.FC<any>;
    formProps?: object;
}> = ({ title, itemName, items, headers, renderRow, onSave, onDelete, FormComponent, formProps }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    const handleNew = () => { setEditingItem(null); setFormOpen(true); };
    const handleEdit = (item: any) => { setEditingItem(item); setFormOpen(true); };

    return (
        <div>
            <div className="flex justify-end mb-4"><Button onClick={handleNew}>+ Nuevo {itemName}</Button></div>
            <Card>
                <Table headers={headers}>
                    {items.map(item => renderRow({
                        item,
                        onEdit: () => handleEdit(item),
                        onDelete: () => onDelete(item.id),
                    }))}
                </Table>
            </Card>
            {isFormOpen && <FormComponent isOpen={isFormOpen} onClose={() => setFormOpen(false)} onSave={onSave} editingItem={editingItem} items={items} {...formProps} />}
        </div>
    );
};

const CostCenterForm: React.FC<any> = ({ isOpen, onClose, onSave, editingItem, items }) => {
    const getInitialState = () => ({ code: '', name: '', type: 'Producción', status: 'Activo', responsible: '' });
    const [formData, setFormData] = useState(editingItem || getInitialState());

    useEffect(() => {
        if (!editingItem) {
            const lastCodeNum = items.map((i: any) => parseInt(i.code.split('-')[1])).filter(Boolean).sort((a: number, b: number) => b - a)[0] || 0;
            setFormData({...getInitialState(), code: `CC-${String(lastCodeNum + 1).padStart(2, '0')}`});
        } else {
            setFormData(editingItem);
        }
    }, [editingItem, items]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = () => { onSave({ ...formData, id: editingItem?.id || `cc-${Date.now()}` }); onClose(); };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${editingItem ? 'Editar' : 'Nuevo'} Centro de Costo`}>
            <div className="space-y-4">
                <div><label className="label">Código</label><input type="text" name="code" value={formData.code} onChange={handleChange} className="input"/></div>
                <div><label className="label">Nombre</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="input"/></div>
                <div><label className="label">Tipo</label><select name="type" value={formData.type} onChange={handleChange} className="input w-full"><option>Producción</option><option>Administrativo</option><option>Comercial</option><option>Servicios</option><option>Talleres Externos</option><option>Otro</option></select></div>
                <div><label className="label">Responsable</label><input type="text" name="responsible" value={formData.responsible} onChange={handleChange} className="input"/></div>
                <div><label className="label">Estado</label><select name="status" value={formData.status} onChange={handleChange} className="input w-full"><option>Activo</option><option>Inactivo</option></select></div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </div>
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};

const LaborCostForm: React.FC<any> = ({ isOpen, onClose, onSave, editingItem, items, costCenters }) => {
    const getInitialState = () => ({ costCenterId: '', costPerMinute: 0, effectiveDate: new Date().toISOString().slice(0, 10), status: 'Activo' });
    const [formData, setFormData] = useState(editingItem || getInitialState());

    useEffect(() => { setFormData(editingItem || getInitialState()); }, [editingItem]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = () => { onSave({ ...formData, id: editingItem?.id || `lc-${Date.now()}` }); onClose(); };
    
    return (
         <Modal isOpen={isOpen} onClose={onClose} title={`${editingItem ? 'Editar' : 'Nuevo'} Costo de Mano de Obra`}>
            <div className="space-y-4">
                <div><label className="label">Centro de Costo</label><select name="costCenterId" value={formData.costCenterId} onChange={handleChange} className="input w-full"><option value="">Seleccionar...</option>{costCenters.map((c: CostCenter) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="label">Costo por Minuto (COP)</label><input type="number" name="costPerMinute" value={formData.costPerMinute} onChange={handleChange} className="input"/></div>
                <div><label className="label">Fecha Efectiva</label><input type="date" name="effectiveDate" value={formData.effectiveDate} onChange={handleChange} className="input"/></div>
                <div><label className="label">Estado</label><select name="status" value={formData.status} onChange={handleChange} className="input w-full"><option>Activo</option><option>Inactivo</option></select></div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </div>
             <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};

const FixedCostForm: React.FC<any> = ({ isOpen, onClose, onSave, editingItem, items, costCenters }) => {
    const getInitialState = () => ({ type: 'Otro', name: '', amount: 0, costCenterId: '', recordDate: new Date().toISOString().slice(0, 7), isRecurring: true });
    const [formData, setFormData] = useState(editingItem || getInitialState());

    useEffect(() => { setFormData(editingItem || getInitialState()); }, [editingItem]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };
    const handleSubmit = () => { onSave({ ...formData, id: editingItem?.id || `fc-${Date.now()}` }); onClose(); };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${editingItem ? 'Editar' : 'Nuevo'} Costo Fijo`}>
             <div className="space-y-4">
                <div><label className="label">Tipo</label><select name="type" value={formData.type} onChange={handleChange} className="input w-full"><option>Arriendo</option><option>Servicios Públicos</option><option>Internet</option><option>Vigilancia</option><option>Otro</option></select></div>
                <div><label className="label">Nombre/Descripción</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="input"/></div>
                <div><label className="label">Monto (COP)</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} className="input"/></div>
                <div><label className="label">Centro de Costo (Opcional)</label><select name="costCenterId" value={formData.costCenterId} onChange={handleChange} className="input w-full"><option value="">General</option>{costCenters.map((c: CostCenter) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="label">Periodo (Año-Mes)</label><input type="month" name="recordDate" value={formData.recordDate} onChange={handleChange} className="input"/></div>
                <div className="flex items-center"><input type="checkbox" name="isRecurring" checked={formData.isRecurring} onChange={handleChange} className="h-4 w-4 rounded mr-2"/><label>Es Recurrente</label></div>
             </div>
             <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </div>
             <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};

const CostingAnalysisTab: React.FC<any> = ({
    productionOrders, products, inventoryProducts, materialExplosions, assemblies, serviceOrders, externalWorkshops, laborCosts,
}) => {
    const [selectedOrderId, setSelectedOrderId] = useState(productionOrders[0]?.id || '');
    
    const costingData = useMemo(() => {
        if (!selectedOrderId) return null;
        const order = productionOrders.find((o: ProductionOrder) => o.id === selectedOrderId);
        if (!order) return null;

        // Budgeted Costs
        const explosion = materialExplosions.find((e: MaterialExplosion) => e.productionOrderId === order.id);
        const budgetedMaterials = explosion?.materials.reduce((sum: number, mat: any) => {
            const product = inventoryProducts.find((p: InventoryProduct) => p.id === mat.materialId);
            return sum + (mat.requiredQuantity * (product?.unitCost || 0));
        }, 0) || 0;

        const productInfo = products.find((p: Product) => p.id === order.productId);
        const laborCost = laborCosts.find((lc: LaborCost) => lc.costCenterId === order.costCenterId && lc.status === 'Activo');
        const budgetedLabor = (productInfo?.standardTimePerUnit || 0) * (laborCost?.costPerMinute || 0) * order.totalQuantity;

        const orderSo = serviceOrders.find((so: ServiceOrder) => so.productionOrderId === order.id);
        const workshop = externalWorkshops.find((w: ExternalWorkshop) => w.id === orderSo?.providerId);
        const budgetedExternal = (workshop?.costPerUnit || 0) * (orderSo?.totalQuantity || 0);

        // Real Costs
        const assembly = assemblies.find((a: ProductAssembly) => a.productionOrderId === order.id);
        const realMaterials = assembly?.consumedMaterials.reduce((sum: number, mat: any) => {
            const product = inventoryProducts.find((p: InventoryProduct) => p.id === mat.productId);
            return sum + (mat.quantity * (product?.unitCost || 0));
        }, 0) || 0;
        
        // Real labor/external would come from Production Control module, here we'll use budgeted as a placeholder
        const realLabor = budgetedLabor;
        const realExternal = budgetedExternal;
        
        const budgetedTotal = budgetedMaterials + budgetedLabor + budgetedExternal;
        const realTotal = realMaterials + realLabor + realExternal;
        const variation = realTotal - budgetedTotal;

        return {
            budgeted: { materials: budgetedMaterials, labor: budgetedLabor, external: budgetedExternal, total: budgetedTotal },
            real: { materials: realMaterials, labor: realLabor, external: realExternal, total: realTotal },
            variation: { total: variation, percentage: budgetedTotal > 0 ? (variation / budgetedTotal) * 100 : 0 }
        };

    }, [selectedOrderId, productionOrders, products, inventoryProducts, materialExplosions, assemblies, serviceOrders, externalWorkshops, laborCosts]);

    return (
        <Card>
            <div className="max-w-md mb-6">
                <label className="label">Seleccionar Orden de Producción (OP)</label>
                <select value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)} className="input w-full">
                    <option value="">Seleccionar OP...</option>
                    {productionOrders.map((op: ProductionOrder) => <option key={op.id} value={op.id}>{op.id} - {op.productName}</option>)}
                </select>
            </div>

            {costingData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CostCard title="Presupuestado" data={costingData.budgeted}/>
                    <CostCard title="Real" data={costingData.real}/>
                    <VariationCard title="Variación" data={costingData.variation}/>
                </div>
            ) : <p className="text-center p-8 text-gray-500">Seleccione una OP para ver el análisis de costeo.</p>}
        </Card>
    );
};

const CostCard = ({title, data}: {title: string, data: any}) => (
    <Card className="bg-gray-50 dark:bg-dark-accent">
        <h3 className="font-bold text-xl mb-3">{title}</h3>
        <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Materiales:</span><span>{formatCurrency(data.materials)}</span></div>
            <div className="flex justify-between"><span>Mano de Obra:</span><span>{formatCurrency(data.labor)}</span></div>
            <div className="flex justify-between"><span>Servicios Ext.:</span><span>{formatCurrency(data.external)}</span></div>
            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span>Total:</span><span>{formatCurrency(data.total)}</span></div>
        </div>
    </Card>
);

const VariationCard = ({title, data}: {title: string, data: any}) => {
    const color = data.total > 0 ? 'text-red-600' : 'text-green-600';
    return (
    <Card className="bg-gray-50 dark:bg-dark-accent">
        <h3 className="font-bold text-xl mb-3">{title}</h3>
        <div className="text-center space-y-2">
            <p className={`text-4xl font-bold ${color}`}>{formatCurrency(data.total)}</p>
            <p className={`text-2xl font-semibold ${color}`}>({data.percentage.toFixed(2)}%)</p>
        </div>
    </Card>
    );
};

// --- MAIN MODULE ---
// Fix: Added the main CostsModule component which was missing.
const CostsModule: React.FC<CostsModuleProps> = ({ companyInfo }) => {
    const TABS = [
        { id: 'costing', label: 'Costeo de OP' },
        { id: 'centers', label: 'Centros de Costo' },
        { id: 'labor', label: 'Costos de Mano de Obra' },
        { id: 'fixed', label: 'Costos Fijos' },
    ];

    const [costCenters, setCostCenters] = useState<CostCenter[]>(mockInitialCostCenters);
    const [laborCosts, setLaborCosts] = useState<LaborCost[]>(mockInitialLaborCosts);
    const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(mockInitialFixedCosts);

    const handleSave = <T extends { id: string }>(setState: React.Dispatch<React.SetStateAction<T[]>>) => (itemToSave: T) => {
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

    const handleDelete = <T extends { id: string }>(setState: React.Dispatch<React.SetStateAction<T[]>>) => (id: string) => {
        if (window.confirm("¿Está seguro de que desea eliminar este registro?")) {
            setState(prev => prev.filter(i => i.id !== id));
        }
    };

    return (
        <Tabs tabs={TABS}>
            {(activeTab) => (
                <div>
                    {activeTab === 'costing' && (
                        <CostingAnalysisTab 
                            productionOrders={mockProductionOrders}
                            products={mockProducts}
                            inventoryProducts={mockInventoryProducts}
                            materialExplosions={mockMaterialExplosions}
                            assemblies={mockAssemblies}
                            serviceOrders={mockServiceOrders}
                            externalWorkshops={mockExternalWorkshops}
                            laborCosts={laborCosts}
                        />
                    )}
                    {activeTab === 'centers' && (
                        <CRUDComponent
                            title="Centros de Costo"
                            itemName="Centro de Costo"
                            items={costCenters}
                            headers={['Código', 'Nombre', 'Tipo', 'Responsable', 'Estado', 'Acciones']}
                            renderRow={({ item, onEdit, onDelete }: any) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-2">{item.code}</td>
                                    <td className="px-4 py-2 font-medium">{item.name}</td>
                                    <td className="px-4 py-2">{item.type}</td>
                                    <td className="px-4 py-2">{item.responsible}</td>
                                    <td className="px-4 py-2">{item.status}</td>
                                    <td className="px-4 py-2 space-x-2">
                                        <Button variant="secondary" className="text-xs" onClick={onEdit}>Editar</Button>
                                        <Button variant="danger" className="text-xs" onClick={onDelete}>Eliminar</Button>
                                    </td>
                                </tr>
                            )}
                            onSave={handleSave(setCostCenters)}
                            onDelete={handleDelete(setCostCenters)}
                            FormComponent={CostCenterForm}
                        />
                    )}
                    {activeTab === 'labor' && (
                        <CRUDComponent
                            title="Costos de Mano de Obra"
                            itemName="Costo MOD"
                            items={laborCosts}
                            headers={['Centro de Costo', 'Costo/Minuto', 'Fecha Efectiva', 'Estado', 'Acciones']}
                            renderRow={({ item, onEdit, onDelete }: any) => {
                                const center = costCenters.find(c => c.id === item.costCenterId);
                                return (
                                <tr key={item.id}>
                                    <td className="px-4 py-2 font-medium">{center?.name || 'N/A'}</td>
                                    <td className="px-4 py-2">{formatCurrency(item.costPerMinute)}</td>
                                    <td className="px-4 py-2">{item.effectiveDate}</td>
                                    <td className="px-4 py-2">{item.status}</td>
                                    <td className="px-4 py-2 space-x-2">
                                        <Button variant="secondary" className="text-xs" onClick={onEdit}>Editar</Button>
                                        <Button variant="danger" className="text-xs" onClick={onDelete}>Eliminar</Button>
                                    </td>
                                </tr>
                            )}}
                            onSave={handleSave(setLaborCosts)}
                            onDelete={handleDelete(setLaborCosts)}
                            FormComponent={LaborCostForm}
                            formProps={{ costCenters }}
                        />
                    )}
                    {activeTab === 'fixed' && (
                        <CRUDComponent
                            title="Costos Fijos"
                            itemName="Costo Fijo"
                            items={fixedCosts}
                            headers={['Nombre', 'Tipo', 'Monto', 'Centro de Costo', 'Periodo', 'Acciones']}
                            renderRow={({ item, onEdit, onDelete }: any) => {
                                const center = costCenters.find(c => c.id === item.costCenterId);
                                return (
                                <tr key={item.id}>
                                    <td className="px-4 py-2 font-medium">{item.name}</td>
                                    <td className="px-4 py-2">{item.type}</td>
                                    <td className="px-4 py-2">{formatCurrency(item.amount)}</td>
                                    <td className="px-4 py-2">{center?.name || 'General'}</td>
                                    <td className="px-4 py-2">{item.recordDate}</td>
                                    <td className="px-4 py-2 space-x-2">
                                        <Button variant="secondary" className="text-xs" onClick={onEdit}>Editar</Button>
                                        <Button variant="danger" className="text-xs" onClick={onDelete}>Eliminar</Button>
                                    </td>
                                </tr>
                            )}}
                            onSave={handleSave(setFixedCosts)}
                            onDelete={handleDelete(setFixedCosts)}
                            FormComponent={FixedCostForm}
                            formProps={{ costCenters }}
                        />
                    )}
                </div>
            )}
        </Tabs>
    );
};

export default CostsModule;
