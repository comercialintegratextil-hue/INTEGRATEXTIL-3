import React, { useState, useMemo, useEffect } from 'react';
import { Button, Tabs, Modal, Table, Card, FileInput } from '../components/Common';
import { InventoryProduct, Warehouse, InventoryMovement, ProductAssembly, ProductionOrder, CompanyInfo } from '../types';

declare global {
  interface Window {
    jspdf: any;
  }
}

// --- MOCK DATA ---
const mockInitialProducts: InventoryProduct[] = [
    { id: 'prd-1', code: 'PRD-01', name: 'Tela Oxford Celeste', family: 'Materia Prima', unit: 'm', unitCost: 8500, costCenter: 'Telas', minStock: 100, status: 'Activo', imageUrl: 'https://picsum.photos/seed/PRD-01/100' },
    { id: 'prd-2', code: 'PRD-02', name: 'Botones Nácar 12mm', family: 'Insumo', unit: 'un', unitCost: 150, costCenter: 'Insumos', minStock: 1000, status: 'Activo', imageUrl: 'https://picsum.photos/seed/PRD-02/100' },
    { 
        id: 'prd-3', code: 'PRD-03', name: 'Camisa Oxford Talla M', family: 'Producto Terminado', unit: 'un', unitCost: 18000, costCenter: 'Producción', minStock: 20, status: 'Activo', imageUrl: 'https://picsum.photos/seed/PRD-03/100',
        bom: [
            { productId: 'prd-1', quantity: 1.5 }, // 1.5m de tela
            { productId: 'prd-2', quantity: 8 },   // 8 botones
        ]
    },
];

const mockInitialWarehouses: Warehouse[] = [
    { id: 'wh-1', code: 'BOD-01', name: 'Bodega Principal', area: 'A1', location: 'Estante 1, Nivel 2' },
    { id: 'wh-2', code: 'BOD-02', name: 'Bodega de Producción', area: 'P1', location: 'Módulo 3' },
];

const mockInitialMovements: InventoryMovement[] = [
    { id: 'mov-1', type: 'Entrada', date: new Date(Date.now() - 2 * 86400000).toISOString(), productId: 'prd-1', destinationWarehouseId: 'wh-1', quantity: 500, actualCost: 8500, supportDocument: 'FC-123', observations: 'Compra a Textiles SAS' },
    { id: 'mov-2', type: 'Entrada', date: new Date(Date.now() - 2 * 86400000).toISOString(), productId: 'prd-2', destinationWarehouseId: 'wh-1', quantity: 5000, actualCost: 150, supportDocument: 'FC-456', observations: 'Compra a Botones World' },
    { id: 'mov-3', type: 'Traslado', date: new Date(Date.now() - 1 * 86400000).toISOString(), productId: 'prd-1', sourceWarehouseId: 'wh-1', destinationWarehouseId: 'wh-2', quantity: 100, actualCost: 8500, supportDocument: 'NT-001', observations: 'Para OP-125' },
];

const mockProductionOrders: ProductionOrder[] = [
    { id: 'OP-125', productId: 'prd-3', productName: 'Camisa Oxford', reference: 'C-OX-01', client: 'Zara', status: 'In Progress', sizeCurve: [], totalQuantity: 50, creationDate: '2024-07-19' },
];

interface InventoryModuleProps {
    companyInfo: CompanyInfo;
}

// --- SUBMODULES ---

const ProductCatalogTab: React.FC<{
    products: InventoryProduct[],
    movements: InventoryMovement[],
    onSave: (product: InventoryProduct) => void,
    onDelete: (id: string) => void,
}> = ({ products, movements, onSave, onDelete }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<InventoryProduct | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const productStocks = useMemo(() => {
        const stocks: Record<string, number> = {};
        products.forEach(p => {
            stocks[p.id] = movements
                .filter(m => m.productId === p.id)
                .reduce((stock, mov) => {
                    if (mov.type === 'Entrada') return stock + mov.quantity;
                    if (mov.type === 'Salida') return stock - mov.quantity;
                    // Traslados don't affect total stock
                    return stock;
                }, 0);
        });
        return stocks;
    }, [products, movements]);

    const filteredProducts = useMemo(() => products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.family.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]);

    const handleEdit = (p: InventoryProduct) => { setEditing(p); setFormOpen(true); };
    const handleNew = () => { setEditing(null); setFormOpen(true); };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <input type="text" placeholder="Buscar por código, nombre, familia..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input w-1/3"/>
                <Button onClick={handleNew}>+ Nuevo Producto</Button>
            </div>
            <Card>
                <Table headers={['Imagen', 'Código', 'Nombre', 'Familia', 'Stock Actual', 'Costo Unit.', 'Valor Total', 'Acciones']}>
                    {filteredProducts.map(p => {
                        const stock = productStocks[p.id] || 0;
                        return (
                        <tr key={p.id}>
                            <td className="px-4 py-2"><img src={p.imageUrl} className="h-10 w-10 rounded-md object-cover"/></td>
                            <td className="px-4 py-2 font-mono">{p.code}</td>
                            <td className="px-4 py-2 font-medium">{p.name}</td>
                            <td className="px-4 py-2">{p.family}</td>
                            <td className="px-4 py-2 font-semibold">{stock} {p.unit}</td>
                            <td className="px-4 py-2">{p.unitCost.toLocaleString('es-CO', {style: 'currency', currency: 'COP'})}</td>
                            <td className="px-4 py-2">{(stock * p.unitCost).toLocaleString('es-CO', {style: 'currency', currency: 'COP'})}</td>
                            <td className="px-4 py-2 space-x-2">
                                <Button variant="secondary" className="text-xs" onClick={() => handleEdit(p)}>Editar</Button>
                                <Button variant="danger" className="text-xs" onClick={() => onDelete(p.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    )})}
                </Table>
            </Card>
            <ProductFormModal isOpen={isFormOpen} onClose={() => setFormOpen(false)} onSave={onSave} editingProduct={editing} products={products}/>
        </div>
    );
};

const ProductFormModal: React.FC<{
    isOpen: boolean; onClose: () => void; onSave: (p: InventoryProduct) => void;
    editingProduct: InventoryProduct | null; products: InventoryProduct[]
}> = ({ isOpen, onClose, onSave, editingProduct, products }) => {
    const getInitialState = (): Omit<InventoryProduct, 'id'> => ({
        code: '', name: '', family: 'Materia Prima', unit: 'un', unitCost: 0,
        costCenter: '', minStock: 0, status: 'Activo'
    });
    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            if (editingProduct) setFormData(editingProduct);
            else {
                const lastCodeNum = products.map(p => parseInt(p.code.split('-')[1])).filter(Boolean).sort((a,b)=>b-a)[0] || 0;
                setFormData({...getInitialState(), code: `PRD-${String(lastCodeNum+1).padStart(2, '0')}`})
            }
        }
    }, [isOpen, editingProduct, products]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value, type} = e.target;
        setFormData(p => ({...p, [name]: type === 'number' ? parseFloat(value) || 0 : value}));
    };

    const handleSubmit = () => {
        onSave({...formData, id: editingProduct?.id || `prd-${Date.now()}`});
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'} size="2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><FileInput label="Imagen" previewUrl={formData.imageUrl} onFileChange={()=>{}} onUrlChange={url => setFormData(p => ({...p, imageUrl: url}))}/></div>
                <div><label className="label">Código</label><input type="text" name="code" value={formData.code} onChange={handleChange} className="input"/></div>
                <div><label className="label">Nombre</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="input"/></div>
                <div><label className="label">Familia</label><select name="family" value={formData.family} onChange={handleChange} className="input w-full"><option>Materia Prima</option><option>Insumo</option><option>Producto Terminado</option><option>Repuesto</option><option>Otro</option></select></div>
                <div><label className="label">Unidad de Medida</label><input type="text" name="unit" value={formData.unit} onChange={handleChange} className="input"/></div>
                <div><label className="label">Costo Unitario</label><input type="number" name="unitCost" value={formData.unitCost} onChange={handleChange} className="input"/></div>
                <div><label className="label">Stock Mínimo</label><input type="number" name="minStock" value={formData.minStock} onChange={handleChange} className="input"/></div>
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

const WarehousesTab: React.FC<{
    warehouses: Warehouse[],
    onSave: (warehouse: Warehouse) => void,
    onDelete: (id: string) => void,
}> = ({ warehouses, onSave, onDelete }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Warehouse | null>(null);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(warehouses[0]?.id || null);

    const handleEdit = (w: Warehouse) => { setEditing(w); setFormOpen(true); };
    const handleNew = () => { setEditing(null); setFormOpen(true); };
    
    const locationsForSelectedWarehouse = useMemo(() => 
        warehouses.filter(w => w.id === selectedWarehouseId),
    [warehouses, selectedWarehouseId]);

    return(
        <div>
            <div className="flex justify-end mb-4"><Button onClick={handleNew}>+ Nueva Bodega</Button></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-1 h-fit">
                    <h3 className="font-semibold mb-2">Bodegas</h3>
                    <div className="space-y-2">
                        {warehouses.map(w => (
                            <div key={w.id} onClick={() => setSelectedWarehouseId(w.id)} className={`p-2 rounded cursor-pointer ${selectedWarehouseId === w.id ? 'bg-brand-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-dark-accent'}`}>
                                <p className="font-semibold">{w.code} - {w.name}</p>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card className="md:col-span-2">
                    <h3 className="font-semibold mb-2">Áreas y Ubicaciones</h3>
                    <Table headers={['Área', 'Ubicación', 'Acciones']}>
                        {locationsForSelectedWarehouse.map(w => (
                            <tr key={w.id}>
                                <td className="px-4 py-2">{w.area}</td>
                                <td className="px-4 py-2">{w.location}</td>
                                <td className="px-4 py-2 space-x-2">
                                    <Button variant="secondary" className="text-xs" onClick={() => handleEdit(w)}>Editar</Button>
                                    <Button variant="danger" className="text-xs" onClick={() => onDelete(w.id)}>Eliminar</Button>
                                </td>
                            </tr>
                        ))}
                    </Table>
                </Card>
            </div>
            <WarehouseFormModal isOpen={isFormOpen} onClose={() => setFormOpen(false)} onSave={onSave} editingWarehouse={editing} warehouses={warehouses}/>
        </div>
    );
};

const WarehouseFormModal: React.FC<{
    isOpen: boolean; onClose: () => void; onSave: (w: Warehouse) => void;
    editingWarehouse: Warehouse | null; warehouses: Warehouse[]
}> = ({isOpen, onClose, onSave, editingWarehouse, warehouses}) => {
    const getInitialState = (): Omit<Warehouse, 'id'> => ({ code: '', name: '', area: '', location: '' });
    const [formData, setFormData] = useState(getInitialState());

     useEffect(() => {
        if (isOpen) {
            if (editingWarehouse) setFormData(editingWarehouse);
            else {
                const lastCodeNum = warehouses.map(w => parseInt(w.code.split('-')[1])).filter(Boolean).sort((a,b)=>b-a)[0] || 0;
                setFormData({...getInitialState(), code: `BOD-${String(lastCodeNum+1).padStart(2, '0')}`})
            }
        }
    }, [isOpen, editingWarehouse, warehouses]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData(p => ({...p, [name]: value}));
    };
    
    const handleSubmit = () => {
        onSave({...formData, id: editingWarehouse?.id || `wh-${Date.now()}`});
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingWarehouse ? 'Editar Bodega' : 'Nueva Bodega'}>
            <div className="space-y-4">
                <div><label className="label">Código</label><input type="text" name="code" value={formData.code} onChange={handleChange} className="input"/></div>
                <div><label className="label">Nombre</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="input"/></div>
                <div><label className="label">Área</label><input type="text" name="area" value={formData.area} onChange={handleChange} className="input"/></div>
                <div><label className="label">Ubicación</label><input type="text" name="location" value={formData.location} onChange={handleChange} className="input"/></div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </div>
             <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};

const MovementFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (movement: InventoryMovement) => void;
    editingMovement: InventoryMovement | null;
    products: InventoryProduct[];
    warehouses: Warehouse[];
}> = ({ isOpen, onClose, onSave, editingMovement, products, warehouses }) => {

    const getInitialState = (): Omit<InventoryMovement, 'id'> => ({
        type: 'Entrada',
        date: new Date().toISOString(),
        productId: '',
        quantity: 0,
        actualCost: 0,
        supportDocument: '',
        observations: '',
    });

    const [formData, setFormData] = useState<Partial<InventoryMovement>>(getInitialState());

    useEffect(() => {
        if (isOpen) {
            setFormData(editingMovement || getInitialState());
        }
    }, [isOpen, editingMovement]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        let newFormData = { ...formData, [name]: value };

        if (name === 'productId') {
            const product = products.find(p => p.id === value);
            newFormData.actualCost = product?.unitCost || 0;
        }

        if (name === 'type') {
            newFormData.sourceWarehouseId = undefined;
            newFormData.destinationWarehouseId = undefined;
        }
        
        setFormData(newFormData);
    };

    const handleSubmit = () => {
        // Validation
        if (!formData.productId || !formData.quantity || formData.quantity <= 0) {
            alert('Producto y cantidad (mayor a 0) son requeridos.');
            return;
        }
        if (formData.type === 'Entrada' && !formData.destinationWarehouseId) {
             alert('Bodega destino es requerida para entradas.');
            return;
        }
        if (formData.type === 'Salida' && !formData.sourceWarehouseId) {
            alert('Bodega origen es requerida para salidas.');
            return;
        }
        if (formData.type === 'Traslado' && (!formData.sourceWarehouseId || !formData.destinationWarehouseId)) {
            alert('Bodega origen y destino son requeridas para traslados.');
            return;
        }

        onSave({
            ...getInitialState(), // ensures all fields are present
            ...formData,
            id: editingMovement?.id || `mov-${Date.now()}`,
            quantity: Number(formData.quantity),
            actualCost: Number(formData.actualCost),
        } as InventoryMovement);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingMovement ? 'Editar Movimiento' : 'Nuevo Movimiento de Inventario'} size="2xl">
            <div className="space-y-4">
                <div>
                    <label className="label">Tipo de Movimiento</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="input w-full" disabled={!!editingMovement}>
                        <option>Entrada</option>
                        <option>Salida</option>
                        <option>Traslado</option>
                    </select>
                </div>

                <div>
                    <label className="label">Producto</label>
                    <select name="productId" value={formData.productId} onChange={handleChange} className="input w-full">
                        <option value="">Seleccionar producto...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                    </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    {(formData.type === 'Salida' || formData.type === 'Traslado') && (
                        <div>
                            <label className="label">Bodega Origen</label>
                            <select name="sourceWarehouseId" value={formData.sourceWarehouseId || ''} onChange={handleChange} className="input w-full">
                                <option value="">Seleccionar...</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    )}
                    {(formData.type === 'Entrada' || formData.type === 'Traslado') && (
                        <div>
                            <label className="label">Bodega Destino</label>
                            <select name="destinationWarehouseId" value={formData.destinationWarehouseId || ''} onChange={handleChange} className="input w-full">
                                <option value="">Seleccionar...</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Cantidad</label><input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Costo Real Unitario</label><input type="number" name="actualCost" value={formData.actualCost} onChange={handleChange} className="input"/></div>
                </div>

                <div><label className="label">Documento de Soporte</label><input type="text" name="supportDocument" value={formData.supportDocument} onChange={handleChange} className="input"/></div>
                <div><label className="label">Observaciones</label><textarea name="observations" value={formData.observations} onChange={handleChange} rows={2} className="input w-full"/></div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar Movimiento</Button>
            </div>
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};

const MovementsTab: React.FC<{
    movements: InventoryMovement[],
    products: InventoryProduct[],
    warehouses: Warehouse[],
    onSave: (movement: InventoryMovement) => void,
    onDelete: (id: string) => void,
}> = ({ movements, products, warehouses, onSave, onDelete }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<InventoryMovement | null>(null);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', type: '', productId: '', warehouseId: '', document: '' });
    
    const filteredMovements = useMemo(() => {
        return movements.filter(mov => {
            const movDate = new Date(mov.date);
            if (filters.startDate && new Date(mov.date.slice(0, 10)) < new Date(filters.startDate)) return false;
            if (filters.endDate && new Date(mov.date.slice(0, 10)) > new Date(filters.endDate)) return false;
            if (filters.type && mov.type !== filters.type) return false;
            if (filters.productId && mov.productId !== filters.productId) return false;
            if (filters.warehouseId && mov.sourceWarehouseId !== filters.warehouseId && mov.destinationWarehouseId !== filters.warehouseId) return false;
            if (filters.document && !mov.supportDocument.toLowerCase().includes(filters.document.toLowerCase())) return false;
            return true;
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [movements, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(f => ({...f, [e.target.name]: e.target.value}));
    };

    const handleEdit = (mov: InventoryMovement) => { setEditing(mov); setFormOpen(true); };
    const handleNew = () => { setEditing(null); setFormOpen(true); };
    
    const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'N/A';
    const getWarehouseName = (id?: string) => id ? warehouses.find(w => w.id === id)?.name || 'N/A' : '-';

    return (
        <div>
             <Card className="mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center">
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="input" placeholder="Fecha Desde"/>
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="input" placeholder="Fecha Hasta"/>
                    <select name="type" value={filters.type} onChange={handleFilterChange} className="input"><option value="">Tipo...</option><option>Entrada</option><option>Salida</option><option>Traslado</option></select>
                    <select name="productId" value={filters.productId} onChange={handleFilterChange} className="input"><option value="">Producto...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <select name="warehouseId" value={filters.warehouseId} onChange={handleFilterChange} className="input"><option value="">Bodega...</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
                    <input type="text" name="document" placeholder="Documento..." value={filters.document} onChange={handleFilterChange} className="input"/>
                </div>
            </Card>
            <div className="flex justify-end mb-4"><Button onClick={handleNew}>+ Nuevo Movimiento</Button></div>
            <Card>
                <Table headers={['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Bodega Origen', 'Bodega Destino', 'Documento', 'Acciones']}>
                    {filteredMovements.map(mov => (
                        <tr key={mov.id}>
                            <td className="px-4 py-2">{new Date(mov.date).toLocaleString()}</td>
                            <td className="px-4 py-2">{mov.type}</td>
                            <td className="px-4 py-2 font-medium">{getProductName(mov.productId)}</td>
                            <td className="px-4 py-2">{mov.quantity}</td>
                            <td className="px-4 py-2">{getWarehouseName(mov.sourceWarehouseId)}</td>
                            <td className="px-4 py-2">{getWarehouseName(mov.destinationWarehouseId)}</td>
                            <td className="px-4 py-2">{mov.supportDocument}</td>
                            <td className="px-4 py-2 space-x-2">
                                <Button variant="secondary" className="text-xs" onClick={() => handleEdit(mov)}>Editar</Button>
                                <Button variant="danger" className="text-xs" onClick={() => onDelete(mov.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <MovementFormModal isOpen={isFormOpen} onClose={() => setFormOpen(false)} onSave={onSave} editingMovement={editing} products={products} warehouses={warehouses}/>
        </div>
    );
};

type AssemblyMaterials = {
    productId: string;
    name: string;
    requiredQty: number;
    actualQty: number;
};

const AssemblyFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (assembly: ProductAssembly, movements: InventoryMovement[]) => void;
    productionOrders: ProductionOrder[];
    products: InventoryProduct[];
    warehouses: Warehouse[];
}> = ({ isOpen, onClose, onSave, productionOrders, products, warehouses }) => {
    
    const [opId, setOpId] = useState('');
    const [producedQty, setProducedQty] = useState(0);
    const [materials, setMaterials] = useState<AssemblyMaterials[]>([]);
    const [sourceWarehouseId, setSourceWarehouseId] = useState('');
    const [destinationWarehouseId, setDestinationWarehouseId] = useState('');

    useEffect(() => {
        if (!opId) {
            setMaterials([]);
            setProducedQty(0);
            return;
        }
        const order = productionOrders.find(o => o.id === opId);
        if (!order) return;

        const product = products.find(p => p.id === order.productId);
        if (!product || !product.bom) {
            setMaterials([]);
            return;
        }

        const requiredMaterials = product.bom.map(item => {
            const materialProduct = products.find(p => p.id === item.productId);
            const required = item.quantity * producedQty;
            return {
                productId: item.productId,
                name: materialProduct?.name || 'Desconocido',
                requiredQty: required,
                actualQty: required,
            };
        });
        setMaterials(requiredMaterials);

    }, [opId, producedQty, products, productionOrders]);

    const handleSave = () => {
        const order = productionOrders.find(o => o.id === opId);
        if (!order || producedQty <= 0 || !sourceWarehouseId || !destinationWarehouseId) {
            alert("Por favor complete todos los campos requeridos.");
            return;
        }
        
        const assembly: ProductAssembly = {
            id: `asm-${Date.now()}`,
            productionOrderId: opId,
            finishedProduct: { productId: order.productId, name: order.productName, quantity: producedQty },
            consumedMaterials: materials.map(m => ({ productId: m.productId, name: m.name, quantity: m.actualQty })),
            assemblyDate: new Date().toISOString(),
            destinationWarehouseId,
            sourceWarehouseId,
        };

        const newMovements: InventoryMovement[] = [];
        // Material consumption movements (Salida)
        materials.forEach(mat => {
            newMovements.push({
                id: `mov-asm-out-${mat.productId}-${Date.now()}`,
                type: 'Salida',
                date: assembly.assemblyDate,
                productId: mat.productId,
                quantity: mat.actualQty,
                sourceWarehouseId: sourceWarehouseId,
                actualCost: products.find(p => p.id === mat.productId)?.unitCost || 0,
                supportDocument: `ENSAMBLE-${assembly.id}`,
                observations: `Consumo para OP ${opId}`
            });
        });
        // Finished product movement (Entrada)
        newMovements.push({
            id: `mov-asm-in-${order.productId}-${Date.now()}`,
            type: 'Entrada',
            date: assembly.assemblyDate,
            productId: order.productId,
            quantity: producedQty,
            destinationWarehouseId: destinationWarehouseId,
            actualCost: products.find(p => p.id === order.productId)?.unitCost || 0,
            supportDocument: `ENSAMBLE-${assembly.id}`,
            observations: `Producción de OP ${opId}`
        });

        onSave(assembly, newMovements);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Ensamble de Producción" size="4xl">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Orden de Producción (OP)</label>
                        <select value={opId} onChange={e => setOpId(e.target.value)} className="input w-full">
                            <option value="">Seleccionar OP...</option>
                            {productionOrders.map(op => <option key={op.id} value={op.id}>{op.id} - {op.productName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Cantidad Producida</label>
                        <input type="number" value={producedQty} onChange={e => setProducedQty(Number(e.target.value))} className="input w-full" />
                    </div>
                    <div>
                        <label className="label">Bodega Origen (Materiales)</label>
                        <select value={sourceWarehouseId} onChange={e => setSourceWarehouseId(e.target.value)} className="input w-full">
                            <option value="">Seleccionar Bodega...</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Bodega Destino (Prod. Terminado)</label>
                        <select value={destinationWarehouseId} onChange={e => setDestinationWarehouseId(e.target.value)} className="input w-full">
                            <option value="">Seleccionar Bodega...</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                </div>

                {materials.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mt-4 border-t pt-4">Materiales Consumidos</h3>
                        <Table headers={['Material', 'Cantidad Requerida', 'Cantidad Real Consumida']}>
                            {materials.map(mat => (
                                <tr key={mat.productId}>
                                    <td className="px-4 py-2">{mat.name}</td>
                                    <td className="px-4 py-2">{mat.requiredQty.toFixed(2)}</td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            value={mat.actualQty}
                                            onChange={e => setMaterials(prev => prev.map(m => m.productId === mat.productId ? {...m, actualQty: Number(e.target.value)} : m))}
                                            className="input w-32"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    </div>
                )}
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Confirmar Ensamble</Button>
            </div>
             <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};

const AssemblyTab: React.FC<{
    assemblies: ProductAssembly[];
    productionOrders: ProductionOrder[];
    products: InventoryProduct[];
    warehouses: Warehouse[];
    onSave: (assembly: ProductAssembly, movements: InventoryMovement[]) => void;
}> = ({ assemblies, productionOrders, products, warehouses, onSave }) => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [filters, setFilters] = useState({ opId: '', productId: '', date: '' });

    const filteredAssemblies = useMemo(() => {
        return assemblies.filter(asm => {
            if (filters.opId && asm.productionOrderId !== filters.opId) return false;
            if (filters.productId && asm.finishedProduct.productId !== filters.productId) return false;
            if (filters.date && asm.assemblyDate.slice(0, 10) !== filters.date) return false;
            return true;
        }).sort((a,b) => new Date(b.assemblyDate).getTime() - new Date(a.assemblyDate).getTime());
    }, [assemblies, filters]);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                 <div className="flex gap-4">
                    <input type="text" placeholder="Filtrar por OP..." value={filters.opId} onChange={e => setFilters(f => ({...f, opId: e.target.value}))} className="input"/>
                    <input type="text" placeholder="Filtrar por Producto..." value={filters.productId} onChange={e => setFilters(f => ({...f, productId: e.target.value}))} className="input"/>
                    <input type="date" value={filters.date} onChange={e => setFilters(f => ({...f, date: e.target.value}))} className="input"/>
                </div>
                <Button onClick={() => setFormOpen(true)}>+ Nuevo Ensamble</Button>
            </div>
            <Card>
                <Table headers={['Fecha', 'OP', 'Producto Terminado', 'Cantidad', 'Bodega Destino']}>
                    {filteredAssemblies.map(asm => (
                        <tr key={asm.id}>
                            <td className="px-4 py-2">{new Date(asm.assemblyDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2">{asm.productionOrderId}</td>
                            <td className="px-4 py-2">{asm.finishedProduct.name}</td>
                            <td className="px-4 py-2">{asm.finishedProduct.quantity}</td>
                            <td className="px-4 py-2">{warehouses.find(w => w.id === asm.destinationWarehouseId)?.name}</td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <AssemblyFormModal 
                isOpen={isFormOpen} 
                onClose={() => setFormOpen(false)}
                onSave={onSave}
                productionOrders={productionOrders}
                products={products}
                warehouses={warehouses}
            />
        </div>
    );
};

const ReportsTab: React.FC<{
    products: InventoryProduct[];
    movements: InventoryMovement[];
    warehouses: Warehouse[];
    companyInfo: CompanyInfo;
}> = ({ products, movements, warehouses, companyInfo }) => {
    const [reportView, setReportView] = useState('valuation');
    const [kardexProduct, setKardexProduct] = useState('');

    const productStocks = useMemo(() => {
        const stocks: Record<string, number> = {};
        products.forEach(p => {
            stocks[p.id] = movements
                .filter(m => m.productId === p.id)
                .reduce((stock, mov) => {
                    if (mov.type === 'Entrada') return stock + mov.quantity;
                    if (mov.type === 'Salida') return stock - mov.quantity;
                    return stock;
                }, 0);
        });
        return stocks;
    }, [products, movements]);

    const valuationData = useMemo(() => {
        const byFamily: Record<string, { value: number, count: number }> = {};
        let totalValue = 0;
        products.forEach(p => {
            const stock = productStocks[p.id] || 0;
            const value = stock * p.unitCost;
            totalValue += value;
            if (!byFamily[p.family]) byFamily[p.family] = { value: 0, count: 0 };
            byFamily[p.family].value += value;
            byFamily[p.family].count += 1;
        });
        return { totalValue, byFamily };
    }, [products, productStocks]);

    const minStockAlerts = useMemo(() => {
        return products
            .map(p => ({
                ...p,
                stock: productStocks[p.id] || 0,
            }))
            .filter(p => p.stock < p.minStock);
    }, [products, productStocks]);
    
    const kardexMovements = useMemo(() => {
        if (!kardexProduct) return [];
        let balance = 0;
        return movements
            .filter(m => m.productId === kardexProduct)
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(m => {
                if(m.type === 'Entrada') balance += m.quantity;
                if(m.type === 'Salida') balance -= m.quantity;
                // For Traslados, we need warehouse context, but for a general kardex it's neutral.
                return {...m, balance};
            });
    }, [kardexProduct, movements]);
    
    const exportPdf = (title: string, headers: string[], data: any[][], fileName: string) => {
        if (!window.jspdf) {
            alert("PDF generation library is not loaded.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        if (companyInfo.logoUrl) {
            doc.addImage(companyInfo.logoUrl, 'PNG', 14, 15, 30, 15);
        }
        doc.setFontSize(20);
        doc.text(companyInfo.name, 105, 22, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`NIT: ${companyInfo.nit}`, 105, 28, { align: 'center' });
        
        doc.setFontSize(16);
        doc.text(title, 14, 45);

        (doc as any).autoTable({
            head: [headers],
            body: data,
            startY: 50,
            theme: 'grid'
        });
        doc.save(fileName);
    };

    const handleExportAlerts = () => {
        const data = minStockAlerts.map(p => [p.code, p.name, p.stock, p.minStock, p.minStock - p.stock]);
        exportPdf("Alertas de Stock Mínimo", ['Código', 'Producto', 'Stock Actual', 'Stock Mínimo', 'Déficit'], data, 'alertas_stock.pdf');
    };
    
    const handleExportKardex = () => {
        const productName = products.find(p => p.id === kardexProduct)?.name || '';
        const data = kardexMovements.map(m => [
            new Date(m.date).toLocaleString(), m.type, m.supportDocument,
            m.type === 'Entrada' ? m.quantity : '',
            m.type === 'Salida' ? m.quantity : '',
            m.balance
        ]);
        exportPdf(`Kardex - ${productName}`, ['Fecha', 'Tipo', 'Documento', 'Entrada', 'Salida', 'Saldo'], data, `kardex_${kardexProduct}.pdf`);
    };

    const ReportMenu = () => (
        <div className="space-y-2">
            <button onClick={() => setReportView('valuation')} className={`w-full text-left p-2 rounded ${reportView === 'valuation' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}>Valoración</button>
            <button onClick={() => setReportView('alerts')} className={`w-full text-left p-2 rounded ${reportView === 'alerts' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}>Alertas Stock Mínimo</button>
            <button onClick={() => setReportView('kardex')} className={`w-full text-left p-2 rounded ${reportView === 'kardex' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}>Kardex por Producto</button>
        </div>
    );
    
    return(
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="md:col-span-1 h-fit"><ReportMenu /></Card>
            <div className="md:col-span-3">
                {reportView === 'valuation' && (
                    <Card>
                        <h3 className="text-xl font-bold mb-4">Valoración del Inventario</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-100 dark:bg-dark-accent rounded-lg text-center">
                                <p className="text-gray-500">Valor Total</p>
                                <p className="text-3xl font-bold text-brand-blue">{valuationData.totalValue.toLocaleString('es-CO', {style:'currency', currency:'COP'})}</p>
                            </div>
                            <div className="p-4 bg-gray-100 dark:bg-dark-accent rounded-lg">
                                <p className="text-gray-500 mb-2">Valor por Familia</p>
                                {Object.entries(valuationData.byFamily).map(([family, data]) =>(
                                    <div key={family} className="flex justify-between text-sm">
                                        <span>{family}</span>
                                        <span className="font-semibold">{data.value.toLocaleString('es-CO', {style:'currency', currency:'COP'})}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}
                 {reportView === 'alerts' && (
                     <Card>
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Alertas de Stock Mínimo</h3>
                            <Button onClick={handleExportAlerts}>Exportar a PDF</Button>
                         </div>
                         <Table headers={['Código', 'Producto', 'Stock Actual', 'Stock Mínimo', 'Déficit']}>
                            {minStockAlerts.map(p => (
                                <tr key={p.id} className="bg-red-50 dark:bg-red-900/20">
                                    <td className="px-4 py-2">{p.code}</td>
                                    <td className="px-4 py-2">{p.name}</td>
                                    <td className="px-4 py-2 font-bold text-red-600">{p.stock}</td>
                                    <td className="px-4 py-2">{p.minStock}</td>
                                    <td className="px-4 py-2 font-bold">{p.stock - p.minStock}</td>
                                </tr>
                            ))}
                         </Table>
                         {minStockAlerts.length === 0 && <p className="text-center p-8 text-gray-500">No hay productos por debajo del stock mínimo.</p>}
                     </Card>
                )}
                {reportView === 'kardex' && (
                     <Card>
                         <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                            <h3 className="text-xl font-bold">Kardex por Producto</h3>
                            <div className="flex gap-4">
                                <select value={kardexProduct} onChange={e => setKardexProduct(e.target.value)} className="input w-64">
                                    <option value="">Seleccionar producto...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <Button onClick={handleExportKardex} disabled={!kardexProduct}>Exportar a PDF</Button>
                            </div>
                         </div>
                         {kardexProduct ? (
                             <Table headers={['Fecha', 'Tipo', 'Documento', 'Entrada', 'Salida', 'Saldo']}>
                                {kardexMovements.map(m => (
                                    <tr key={m.id}>
                                        <td className="px-4 py-2">{new Date(m.date).toLocaleString()}</td>
                                        <td className="px-4 py-2">{m.type}</td>
                                        <td className="px-4 py-2">{m.supportDocument}</td>
                                        <td className="px-4 py-2 text-green-600">{m.type === 'Entrada' ? m.quantity : ''}</td>
                                        <td className="px-4 py-2 text-red-600">{m.type === 'Salida' ? m.quantity : ''}</td>
                                        <td className="px-4 py-2 font-bold">{m.balance}</td>
                                    </tr>
                                ))}
                             </Table>
                         ) : <p className="text-center p-8 text-gray-500">Seleccione un producto para ver su Kardex.</p>}
                     </Card>
                )}
            </div>
        </div>
    );
};


// --- MAIN MODULE COMPONENT ---
const InventoryModule: React.FC<InventoryModuleProps> = ({ companyInfo }) => {
    const TABS = [
        { id: 'catalog', label: 'Catálogo de Productos' },
        { id: 'warehouses', label: 'Bodegas' },
        { id: 'movements', label: 'Movimientos' },
        { id: 'assembly', label: 'Ensamble' },
        { id: 'reports', label: 'Reportes' },
    ];

    const [products, setProducts] = useState<InventoryProduct[]>(mockInitialProducts);
    const [warehouses, setWarehouses] = useState<Warehouse[]>(mockInitialWarehouses);
    const [movements, setMovements] = useState<InventoryMovement[]>(mockInitialMovements);
    const [assemblies, setAssemblies] = useState<ProductAssembly[]>([]);

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
    
    const handleSaveAssembly = (assembly: ProductAssembly, newMovements: InventoryMovement[]) => {
        setAssemblies(prev => [assembly, ...prev]);
        setMovements(prev => [...newMovements, ...prev]);
    };

    return (
        <Tabs tabs={TABS}>
            {(activeTab) => (
                <div>
                    {activeTab === 'catalog' && 
                        <ProductCatalogTab 
                            products={products} 
                            movements={movements} 
                            onSave={handleSave(setProducts)}
                            onDelete={handleDelete(setProducts)}
                        />
                    }
                    {activeTab === 'warehouses' && 
                        <WarehousesTab 
                            warehouses={warehouses}
                            onSave={handleSave(setWarehouses)}
                            onDelete={handleDelete(setWarehouses)}
                        />
                    }
                     {activeTab === 'movements' && 
                        <MovementsTab
                            movements={movements}
                            products={products}
                            warehouses={warehouses}
                            onSave={handleSave(setMovements)}
                            onDelete={handleDelete(setMovements)}
                        />
                     }
                     {activeTab === 'assembly' && 
                        <AssemblyTab 
                            assemblies={assemblies}
                            productionOrders={mockProductionOrders}
                            products={products}
                            warehouses={warehouses}
                            onSave={handleSaveAssembly}
                        />
                     }
                     {activeTab === 'reports' && 
                        <ReportsTab
                            products={products}
                            movements={movements}
                            warehouses={warehouses}
                            companyInfo={companyInfo}
                        />
                     }
                </div>
            )}
        </Tabs>
    );
};

export default InventoryModule;