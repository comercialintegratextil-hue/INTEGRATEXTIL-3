import React, { useState, useMemo, useEffect } from 'react';
import { Button, Tabs, Modal, Table, Card } from '../components/Common';
import { EngineeringOperation, Product } from '../types';
import PlaceholderModule from './PlaceholderModule';

// Mock data, replace with API calls in a real app
const initialOperations: EngineeringOperation[] = [
    {
        id: 'op-eng-1', name: 'Cerrar Costados', code: 'OP-01', description: 'Unir delantero y espalda por costados', process: 'Confección', machine: 'Plana 1 aguja', stitchesPerInch: '12', needle: 'DPx5 #11',
        cycleTimes: [0.25, 0.26, 0.255], frequency: 1, valuationFactor: 100, supplementFactor: 15,
        averageTime: 0.255, standardTime: 0.2933, unitsPerHour: 204
    },
    {
        id: 'op-eng-2', name: 'Pegar Cuello', code: 'OP-02', description: 'Fijar el cuello al cuerpo de la camisa', process: 'Confección', machine: 'Plana 1 aguja', stitchesPerInch: '12', needle: 'DPx5 #11',
        cycleTimes: [0.42, 0.42, 0.41], frequency: 1, valuationFactor: 105, supplementFactor: 12,
        averageTime: 0.416, standardTime: 0.490, unitsPerHour: 122
    },
    {
        id: 'op-eng-3', name: 'Hacer Ojal', code: 'OP-03', description: 'Hacer ojales en pechera', process: 'Confección', machine: 'Ojaladora', stitchesPerInch: 'N/A', needle: 'DPx5 #11',
        cycleTimes: [0.14, 0.13, 0.14], frequency: 8, valuationFactor: 100, supplementFactor: 10,
        averageTime: 0.136, standardTime: 1.2, unitsPerHour: 50
    },
    {
        id: 'op-eng-4', name: 'Cortar Piezas Delantero', code: 'OP-04', description: 'Trazar y cortar tela para delanteros', process: 'Corte', machine: 'Cortadora Vertical', stitchesPerInch: 'N/A', needle: 'N/A',
        cycleTimes: [2.0, 2.03, 2.01], frequency: 1, valuationFactor: 100, supplementFactor: 15,
        averageTime: 2.01, standardTime: 2.31, unitsPerHour: 25
    }
];

// Mock products from Planning module for linking
const mockProducts: Product[] = [
  { id: 'prod-001', name: 'Camisa Oxford Clásica', reference: 'C-OX-01', client: 'Zara', collection: 'Verano 2024', standardTimePerUnit: 2.5, operationIds: ['op-eng-4', 'op-eng-1', 'op-eng-2', 'op-eng-3'] },
  { id: 'prod-002', name: 'Pantalón Chino Slim', reference: 'P-CH-03', client: 'H&M', collection: 'Verano 2024', standardTimePerUnit: 3.0 },
  { id: 'prod-003', name: 'Blusa de Lino', reference: 'B-LI-05', client: 'Mango', collection: 'Primavera 2024', standardTimePerUnit: 2.0 },
];

const OperationFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (operation: EngineeringOperation) => void;
    editingOperation: EngineeringOperation | null;
    operations: EngineeringOperation[];
}> = ({ isOpen, onClose, onSave, editingOperation, operations }) => {
    
    const getInitialState = (): Omit<EngineeringOperation, 'id'> => ({
        name: '', code: '', description: '', process: 'Costura', machine: '', stitchesPerInch: '', needle: '',
        cycleTimes: [0],
        frequency: 1,
        valuationFactor: 100,
        supplementFactor: 15,
        averageTime: 0,
        standardTime: 0,
        unitsPerHour: 0
    });

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            if (editingOperation) {
                setFormData({ ...editingOperation, cycleTimes: Array.isArray(editingOperation.cycleTimes) && editingOperation.cycleTimes.length > 0 ? editingOperation.cycleTimes : [0] });
            } else {
                const lastOpCodeNumber = operations
                    .filter(op => op.code.match(/^OP-\d+$/))
                    .map(op => parseInt(op.code.split('-')[1]))
                    .sort((a, b) => b - a)[0] || 0;
                
                const newCode = `OP-${String(lastOpCodeNumber + 1).padStart(2, '0')}`;
                
                setFormData({ ...getInitialState(), code: newCode });
            }
        }
    }, [isOpen, editingOperation, operations]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumeric = ['valuationFactor', 'supplementFactor'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
    };

    const handleCycleTimeChange = (index: number, value: string) => {
        const newTimes = [...formData.cycleTimes];
        newTimes[index] = parseFloat(value) || 0;
        setFormData(prev => ({ ...prev, cycleTimes: newTimes }));
    };

    const addCycleTime = () => setFormData(prev => ({ ...prev, cycleTimes: [...prev.cycleTimes, 0] }));
    const removeCycleTime = (index: number) => {
        if (formData.cycleTimes.length > 1) {
            setFormData(prev => ({ ...prev, cycleTimes: prev.cycleTimes.filter((_, i) => i !== index) }));
        }
    };

    const calculatedValues = useMemo(() => {
        const validTimes = formData.cycleTimes.filter(t => t > 0);
        if (validTimes.length === 0) return { averageTime: 0, valuedTime: 0, standardTime: 0 };

        const averageTime = validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
        const valuedTime = averageTime * (formData.valuationFactor / 100);
        const standardTime = valuedTime * (1 + (formData.supplementFactor / 100)); // SAM in minutes
        
        return { averageTime, valuedTime, standardTime };
    }, [formData.cycleTimes, formData.valuationFactor, formData.supplementFactor]);

    const handleSubmit = () => {
        if (formData.cycleTimes.filter(t => t > 0).length === 0) {
             alert('Debe ingresar al menos una medición de tiempo válida.');
             return;
        }
        const isDuplicate = operations.some(op => op.code.trim().toLowerCase() === formData.code.trim().toLowerCase() && op.id !== editingOperation?.id);
        if(isDuplicate){
            alert(`El código "${formData.code}" ya existe.`);
            return;
        }

        const standardTime = calculatedValues.standardTime;
        const unitsPerHour = standardTime > 0 ? Math.floor(60 / standardTime) : 0;

        const finalOperation: EngineeringOperation = {
            ...formData,
            averageTime: calculatedValues.averageTime,
            standardTime: standardTime,
            unitsPerHour: unitsPerHour,
            id: editingOperation?.id || `op-eng-${Date.now()}`
        };
        onSave(finalOperation);
        alert('✅ Operación registrada correctamente');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Crear Nueva Operación" size="4xl">
            <p className="text-center text-gray-500 dark:text-gray-400 -mt-2 mb-6">
                Complete el formulario para crear una nueva operación.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-4">
                    <div>
                        <label className="label">Código</label>
                        <input name="code" value={formData.code} onChange={handleChange} placeholder="Ej: OP-C-01" className="input"/>
                    </div>
                    <div>
                        <label className="label">Nombre</label>
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Coser cuello" className="input"/>
                    </div>
                    <div>
                        <label className="label">Proceso</label>
                        <input list="process-options" name="process" value={formData.process} onChange={handleChange} placeholder="Ej: Costura" className="input w-full" />
                        <datalist id="process-options">
                            <option value="Preparación" />
                            <option value="Costura" />
                            <option value="Ensamble" />
                            <option value="Terminación" />
                            <option value="Inspección" />
                            <option value="Empaque" />
                        </datalist>
                    </div>
                    <div>
                        <label className="label">Máquina</label>
                        <input name="machine" value={formData.machine} onChange={handleChange} placeholder="Ej: Plana 1 aguja" className="input"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Factor de Valoración (%)</label>
                            <input type="number" name="valuationFactor" value={formData.valuationFactor} onChange={handleChange} className="input"/>
                        </div>
                        <div>
                            <label className="label">Suplemento (%)</label>
                            <input type="number" name="supplementFactor" value={formData.supplementFactor} onChange={handleChange} className="input"/>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Mediciones de Tiempo (minutos)</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {formData.cycleTimes.map((time, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <label className="w-8 text-right text-sm text-gray-500">{index + 1}.</label>
                                <input 
                                    type="number" 
                                    step="0.001" 
                                    value={time} 
                                    onChange={e => handleCycleTimeChange(index, e.target.value)} 
                                    className="input w-full"
                                />
                                <button onClick={() => removeCycleTime(index)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full disabled:opacity-50" disabled={formData.cycleTimes.length <= 1}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <Button variant="secondary" className="w-full" onClick={addCycleTime}>➕ Añadir Medición</Button>
                </div>
            </div>

            {/* Calculation Block */}
            <div className="mt-8 p-4 bg-gray-100 dark:bg-dark-accent rounded-lg space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Promedio (min)</p>
                        <p className="text-xl font-semibold">{calculatedValues.averageTime.toFixed(4)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tiempo Valorado (min)</p>
                        <p className="text-xl font-semibold">{calculatedValues.valuedTime.toFixed(4)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tiempo Estándar (SAM)</p>
                        <p className="text-2xl font-bold text-brand-blue">{calculatedValues.standardTime.toFixed(4)} min</p>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose} className="bg-gray-400 hover:bg-gray-500 text-white">Cancelar</Button>
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white">Guardar Operación</Button>
            </div>
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #374151; } .dark .label { color: #D1D5DB; }`}</style>
        </Modal>
    );
};

const OperationsTab: React.FC<{
    operations: EngineeringOperation[],
    onSave: (op: EngineeringOperation) => void,
    onDelete: (id: string) => void
}> = ({ operations, onSave, onDelete }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingOperation, setEditingOperation] = useState<EngineeringOperation | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOps = useMemo(() => operations.filter(op =>
        op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.code.toLowerCase().includes(searchTerm.toLowerCase())
    ), [operations, searchTerm]);
    
    const handleSave = (op: EngineeringOperation) => {
        onSave(op);
    };

    const handleEdit = (op: EngineeringOperation) => {
        setEditingOperation(op);
        setModalOpen(true);
    };
    
    const handleAddNew = () => {
        setEditingOperation(null);
        setModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta operación?')) {
            onDelete(id);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por código o nombre..." className="input w-1/3"/>
                <Button onClick={handleAddNew}>+ Nueva Operación</Button>
            </div>
            <Card>
                <Table headers={['Código', 'Nombre', 'Proceso', 'Máquina', 'SAM (min)', 'Uds / Hora', 'Acciones']}>
                    {filteredOps.map(op => (
                        <tr key={op.id}>
                            <td className="px-6 py-4 font-medium">{op.code}</td>
                            <td className="px-6 py-4">{op.name}</td>
                            <td className="px-6 py-4">{op.process}</td>
                            <td className="px-6 py-4">{op.machine}</td>
                            <td className="px-6 py-4">{op.standardTime.toFixed(4)}</td>
                            <td className="px-6 py-4">{op.unitsPerHour}</td>
                            <td className="px-6 py-4 space-x-2">
                                <Button variant="secondary" className="text-xs" onClick={() => handleEdit(op)}>Editar</Button>
                                <Button variant="danger" className="text-xs" onClick={() => handleDelete(op.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <OperationFormModal 
                isOpen={isModalOpen} 
                onClose={() => setModalOpen(false)} 
                onSave={handleSave} 
                editingOperation={editingOperation}
                operations={operations}
            />
        </div>
    );
};

const OperationListFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (productId: string, operationIds: string[]) => void;
    editingProduct: Product | null;
    products: Product[];
    operations: EngineeringOperation[];
}> = ({ isOpen, onClose, onSave, editingProduct, products, operations }) => {
    
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [assignedOpIds, setAssignedOpIds] = useState<string[]>([]);
    
    useEffect(() => {
        if (isOpen) {
            if (editingProduct) {
                setSelectedProductId(editingProduct.id);
                setAssignedOpIds(editingProduct.operationIds || []);
            } else {
                setSelectedProductId('');
                setAssignedOpIds([]);
            }
        }
    }, [isOpen, editingProduct]);

    const availableOperations = useMemo(() => 
        operations.filter(op => !assignedOpIds.includes(op.id)),
    [operations, assignedOpIds]);

    const assignedOperations = useMemo(() =>
        assignedOpIds.map(id => operations.find(op => op.id === id)).filter(Boolean) as EngineeringOperation[],
    [assignedOpIds, operations]);

    const totals = useMemo(() => {
        const totalSam = assignedOperations.reduce((sum, op) => sum + op.standardTime, 0);
        const totalUnitsPerHour = assignedOperations.reduce((sum, op) => sum + op.unitsPerHour, 0);
        const samPerProcess = assignedOperations.reduce<Record<string, number>>((acc, op) => {
            const processName = op.process || 'Sin Proceso';
            acc[processName] = (acc[processName] || 0) + op.standardTime;
            return acc;
        }, {});
        
        return { totalSam, totalUnitsPerHour, samPerProcess };
    }, [assignedOperations]);

    const handleAddOperation = (opId: string) => {
        if (opId && !assignedOpIds.includes(opId)) {
            setAssignedOpIds(prev => [...prev, opId]);
        }
    };
    
    const handleRemoveOperation = (opId: string) => {
        setAssignedOpIds(prev => prev.filter(id => id !== opId));
    };

    const handleMoveOperation = (index: number, direction: 'up' | 'down') => {
        const newAssignedOpIds = [...assignedOpIds];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newAssignedOpIds.length) return;
        
        const [movedItem] = newAssignedOpIds.splice(index, 1);
        newAssignedOpIds.splice(targetIndex, 0, movedItem);
        setAssignedOpIds(newAssignedOpIds);
    };

    const handleSubmit = () => {
        if (!selectedProductId) {
            alert("Por favor, seleccione un producto.");
            return;
        }
        onSave(selectedProductId, assignedOpIds);
        alert("Hoja de operaciones creada exitosamente");
        onClose();
    };

    const productsWithoutList = useMemo(() => 
        products.filter(p => !(p.operationIds && p.operationIds.length > 0)), 
    [products]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="📋 Crear Nueva Hoja de Operaciones" size="4xl">
            <div className="space-y-6">
                <p className="text-center text-gray-500 dark:text-gray-400 -mt-2">
                    Selecciona un producto y añade operaciones para construir la hoja.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-dark-accent rounded-lg">
                    <div>
                        <label className="block text-sm font-medium mb-1">Producto</label>
                        <select 
                            value={selectedProductId} 
                            onChange={e => setSelectedProductId(e.target.value)} 
                            className="input w-full" 
                            disabled={!!editingProduct}
                        >
                            <option value="">Seleccionar producto...</option>
                            {editingProduct ? (
                                <option value={editingProduct.id}>{editingProduct.name} ({editingProduct.reference})</option>
                            ) : (
                                productsWithoutList.map(p => <option key={p.id} value={p.id}>{p.name} ({p.reference})</option>)
                            )}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Buscador de Operaciones</label>
                        <select 
                            value=""
                            onChange={e => handleAddOperation(e.target.value)}
                            className="input w-full"
                            disabled={!selectedProductId}
                        >
                            <option value="">Añadir operación...</option>
                            {availableOperations.map(op => (
                                <option key={op.id} value={op.id}>
                                    {op.code} - {op.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <Card>
                    <div className="overflow-x-auto">
                        <Table headers={['Orden', 'Código', 'Nombre Operación', 'Proceso', 'Máquina', 'SAM (min)', 'Uds/Hora', 'Acción']}>
                           {assignedOperations.map((op, index) => (
                               <tr key={op.id}>
                                   <td className="px-4 py-2">
                                       <div className="flex items-center space-x-1">
                                           <button onClick={() => handleMoveOperation(index, 'up')} disabled={index === 0} className="disabled:opacity-20">▲</button>
                                           <button onClick={() => handleMoveOperation(index, 'down')} disabled={index === assignedOperations.length - 1} className="disabled:opacity-20">▼</button>
                                       </div>
                                   </td>
                                   <td className="px-4 py-2 font-mono">{op.code}</td>
                                   <td className="px-4 py-2">{op.name}</td>
                                   <td className="px-4 py-2">{op.process}</td>
                                   <td className="px-4 py-2">{op.machine}</td>
                                   <td className="px-4 py-2 text-right">{op.standardTime.toFixed(4)}</td>
                                   <td className="px-4 py-2 text-right">{op.unitsPerHour}</td>
                                   <td className="px-4 py-2 text-center">
                                       <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => handleRemoveOperation(op.id)}>Eliminar</Button>
                                   </td>
                               </tr>
                           ))}
                        </Table>
                         {assignedOperations.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                Añade operaciones a la hoja
                            </div>
                        )}
                    </div>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gray-100 dark:bg-dark-accent">
                        <h4 className="font-semibold text-gray-600 dark:text-gray-300">Total SAM</h4>
                        <p className="text-2xl font-bold text-brand-blue">{totals.totalSam.toFixed(4)} <span className="text-lg font-normal">minutos</span></p>
                    </Card>
                    <Card className="bg-gray-100 dark:bg-dark-accent">
                        <h4 className="font-semibold text-gray-600 dark:text-gray-300">Unidades / Hora Totales</h4>
                         <p className="text-2xl font-bold text-brand-green">{totals.totalUnitsPerHour} <span className="text-lg font-normal">uds.</span></p>
                    </Card>
                    <Card className="bg-gray-100 dark:bg-dark-accent">
                        <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">SAM por Proceso (min)</h4>
                        <div className="text-sm space-y-1">
                            {Object.entries(totals.samPerProcess).map(([processName, sam]) => (
                                <div key={processName} className="flex justify-between">
                                    <span>{processName}:</span>
                                    <span className="font-semibold">{sam.toFixed(4)}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
            <div className="flex justify-end space-x-4 mt-8 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose} className="bg-gray-400 hover:bg-gray-500 text-white">Cancelar</Button>
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white">
                    Guardar Hoja
                </Button>
            </div>
        </Modal>
    );
};


const OperationListTab: React.FC<{
    products: Product[],
    operations: EngineeringOperation[],
    onUpdateProduct: (product: Product) => void;
    onDeleteList: (productId: string) => void;
}> = ({ products, operations, onUpdateProduct, onDeleteList }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const lists = useMemo(() => 
        products.filter(p => p.operationIds && p.operationIds.length > 0)
    , [products]);
    
    const filteredLists = useMemo(() => 
        lists.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.reference.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    [lists, searchTerm]);

    const calculateTotalSam = (product: Product) => {
        if (!product.operationIds) return 0;
        return product.operationIds.reduce((sum, id) => {
            const op = operations.find(o => o.id === id);
            return sum + (op?.standardTime || 0);
        }, 0);
    };

    const handleSave = (productId: string, operationIds: string[]) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            onUpdateProduct({ ...product, operationIds });
        }
    };
    
    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };
    
    const handleAddNew = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleDelete = (productId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar este listado de operaciones? Las operaciones no se eliminarán, solo la asignación al producto.')) {
            onDeleteList(productId);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Buscar por producto o referencia..." 
                    className="input w-1/3"
                />
                <Button onClick={handleAddNew}>+ Nuevo Listado</Button>
            </div>
            <Card>
                <Table headers={['Producto', 'Referencia', '# Operaciones', 'SAM Total (min)', 'Acciones']}>
                    {filteredLists.map(p => (
                        <tr key={p.id}>
                            <td className="px-6 py-4 font-medium">{p.name}</td>
                            <td className="px-6 py-4">{p.reference}</td>
                            <td className="px-6 py-4">{p.operationIds?.length || 0}</td>
                            <td className="px-6 py-4">{calculateTotalSam(p).toFixed(4)}</td>
                            <td className="px-6 py-4 space-x-2">
                                <Button variant="secondary" className="text-xs" onClick={() => handleEdit(p)}>Editar</Button>
                                <Button variant="danger" className="text-xs" onClick={() => handleDelete(p.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <OperationListFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                editingProduct={editingProduct}
                products={products}
                operations={operations}
            />
        </div>
    );
};

// --- Module Balancing Component ---
type Assignment = { operationId: string, units: number };
type OperatorAssignments = { id: string, assignments: Assignment[] };
interface SavedBalance {
    id: string; // "BAL-01"
    productId: string;
    moduleName: string;
    numPeople: number;
    assignments: OperatorAssignments[];
}

const ModuleBalancingForm: React.FC<{
    products: Product[],
    operations: EngineeringOperation[],
    onSave: (balanceData: Omit<SavedBalance, 'id'>) => void;
    onCancel: () => void;
    initialBalance: SavedBalance | null;
    isReadOnly: boolean;
}> = ({ products, operations, onSave, onCancel, initialBalance, isReadOnly }) => {
    
    const [selectedProductId, setSelectedProductId] = useState<string>(initialBalance?.productId || '');
    const [numPeople, setNumPeople] = useState(initialBalance?.numPeople || 1);
    const [moduleName, setModuleName] = useState(initialBalance?.moduleName || '');
    const [assignments, setAssignments] = useState<OperatorAssignments[]>(initialBalance?.assignments || []);

    const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId]);
    
    const productOperations = useMemo(() => {
        if (!selectedProduct || !selectedProduct.operationIds) return [];
        return selectedProduct.operationIds
            .map(id => operations.find(op => op.id === id))
            .filter((op): op is EngineeringOperation => !!op);
    }, [selectedProduct, operations]);

    const moduleMetrics = useMemo(() => {
        if (productOperations.length === 0 || numPeople <= 0) return { totalSam: 0, taskPerHour: 0, averageTime: 0 };
        const totalSam = productOperations.reduce((sum, op) => sum + op.standardTime, 0);
        const taskPerHour = totalSam > 0 ? (numPeople * 60) / totalSam : 0;
        const averageTime = totalSam / numPeople;
        return { totalSam, taskPerHour, averageTime };
    }, [productOperations, numPeople]);
    
    const operatorStats = useMemo(() => {
        const operators = Array.from({ length: numPeople }, (_, i) => ({ 
            id: `op-${i + 1}`, 
            assignments: assignments.find(a => a.id === `op-${i+1}`)?.assignments || [],
            totalMinutes: 0 
        }));
        
        operators.forEach(operator => {
            operator.totalMinutes = operator.assignments.reduce((sum, ass) => {
                 const operation = productOperations.find(op => op.id === ass.operationId);
                 return sum + (operation ? ass.units * operation.standardTime : 0);
            }, 0);
        });
        
        return operators.map(op => ({ ...op, occupancy: (op.totalMinutes / 60) * 100 }));
    }, [assignments, numPeople, productOperations]);

    const operationStats = useMemo(() => {
        const totalTask = Math.floor(moduleMetrics.taskPerHour);
        if (totalTask === 0) return productOperations.map(op => ({...op, machineNeed: 0, assignedUnits: 0, remainingUnits: 0}));

        return productOperations.map(op => {
            const assignedUnits = assignments.flatMap(a => a.assignments)
                .filter(ass => ass.operationId === op.id)
                .reduce((sum, ass) => sum + ass.units, 0);
            
            return {
                ...op,
                machineNeed: moduleMetrics.averageTime > 0 ? (op.standardTime / moduleMetrics.averageTime) : 0,
                assignedUnits,
                remainingUnits: totalTask - assignedUnits,
            };
        });
    }, [productOperations, assignments, moduleMetrics]);

    const machineRequirements = useMemo(() => {
        const requirements: Record<string, number> = {};
        operationStats.forEach(op => {
            const machineName = op.machine || 'Sin Máquina';
            if (requirements[machineName]) {
                requirements[machineName] += op.machineNeed;
            } else {
                requirements[machineName] = op.machineNeed;
            }
        });
        return requirements;
    }, [operationStats]);

    const totalMachinesRequired = useMemo(() => {
        return Object.values(machineRequirements).reduce((sum, val) => sum + val, 0);
    }, [machineRequirements]);
    
    useEffect(() => {
        if (!initialBalance) {
            setAssignments([]);
        }
    }, [selectedProductId, numPeople, initialBalance]);

    const handleAutoBalance = () => {
        const { taskPerHour, totalSam } = moduleMetrics;
        if (!taskPerHour || !totalSam) return;

        const totalUnitsGoal = Math.floor(taskPerHour);
        const opsToAssign = [...productOperations]; 
        let operators = Array.from({ length: numPeople }, (_, i) => ({ id: `op-${i + 1}`, totalMinutes: 0, assignments: [] as Assignment[] }));

        const totalWorkMinutes = totalUnitsGoal * totalSam;
        const targetMinutesPerPerson = totalWorkMinutes / numPeople;
        
        opsToAssign.sort((a, b) => b.standardTime - a.standardTime);

        for (const op of opsToAssign) {
            for (let i = 0; i < totalUnitsGoal; i++) {
                operators.sort((a, b) => a.totalMinutes - b.totalMinutes);
                const bestOperator = operators[0];
                
                const existingAssignment = bestOperator.assignments.find(a => a.operationId === op.id);
                if (existingAssignment) {
                    existingAssignment.units += 1;
                } else {
                    bestOperator.assignments.push({ operationId: op.id, units: 1 });
                }
                bestOperator.totalMinutes += op.standardTime;
            }
        }
        setAssignments(operators.map(({ id, assignments }) => ({ id, assignments })));
        alert('Balanceo automático calculado. Puede realizar ajustes manuales.');
    };

    const handleAssignmentChange = (opId: string, operatorId: string, unitsStr: string) => {
        const units = parseInt(unitsStr);
        if (isNaN(units) || units < 0) return;

        setAssignments(prev => {
            const newAssignments = JSON.parse(JSON.stringify(prev)) as OperatorAssignments[];
            const operator = newAssignments.find(a => a.id === operatorId);
            if (operator) {
                const assignment = operator.assignments.find(a => a.operationId === opId);
                if (assignment) {
                    assignment.units = units;
                }
            }
            return newAssignments;
        });
    };

    const handleAddOperationToOperator = (opId: string, operatorId: string) => {
        if (!opId) return;
        setAssignments(prev => {
            const newAssignments = JSON.parse(JSON.stringify(prev)) as OperatorAssignments[];
            let operator = newAssignments.find(a => a.id === operatorId);
            if (!operator) {
                operator = { id: operatorId, assignments: [] };
                newAssignments.push(operator);
            }
            const assignmentExists = operator.assignments.some(a => a.operationId === opId);
            if (!assignmentExists) {
                operator.assignments.push({ operationId: opId, units: 0 });
            }
            return newAssignments;
        });
    };

    const handleRemoveOperationFromOperator = (opId: string, operatorId: string) => {
        setAssignments(prev => {
            const newAssignments = JSON.parse(JSON.stringify(prev)) as OperatorAssignments[];
            const operator = newAssignments.find(a => a.id === operatorId);
            if (operator) {
                operator.assignments = operator.assignments.filter(a => a.operationId !== opId);
            }
            return newAssignments.filter(op => op.assignments.length > 0);
        });
    };

    const handleSave = () => {
        onSave({
            productId: selectedProductId,
            moduleName,
            numPeople,
            assignments
        });
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{isReadOnly ? "Ver Balanceo" : (initialBalance ? "Editar Balanceo" : "Crear Balanceo")}</h2>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onCancel}>← Volver al Listado</Button>
                    {!isReadOnly && <Button onClick={handleSave}>Guardar Balance</Button>}
                </div>
            </div>
            <Card className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="label">Producto</label>
                        <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="input w-full" disabled={isReadOnly || !!initialBalance}>
                            <option value="">Seleccione un producto...</option>
                            {products.filter(p => p.operationIds && p.operationIds.length > 0).map(p => <option key={p.id} value={p.id}>{p.name} ({p.reference})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label"># Personas</label>
                        <input type="number" value={numPeople} onChange={e => setNumPeople(Math.max(1, parseInt(e.target.value) || 1))} className="input w-full" disabled={isReadOnly} />
                    </div>
                    <div>
                        <label className="label">Nombre Módulo</label>
                        <input type="text" value={moduleName} onChange={e => setModuleName(e.target.value)} className="input w-full" disabled={isReadOnly}/>
                    </div>
                </div>
            </Card>

            {selectedProduct && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Card className="text-center"><h4 className="label">SAM Total</h4><p className="stat">{moduleMetrics.totalSam.toFixed(4)} min</p></Card>
                        <Card className="text-center"><h4 className="label">Tarea por Hora</h4><p className="stat">{moduleMetrics.taskPerHour.toFixed(2)} uds</p></Card>
                        <Card className="text-center"><h4 className="label">Tiempo Medio</h4><p className="stat">{moduleMetrics.averageTime.toFixed(4)} min</p></Card>
                    </div>
                    
                    <Card className="mb-4">
                        <h4 className="font-semibold text-gray-600 dark:text-gray-300">Máquinas Requeridas</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 items-center">
                            <div>
                                <p className="text-3xl font-bold text-brand-purple">{totalMachinesRequired.toFixed(2)}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Máquinas</p>
                            </div>
                            <div>
                                <h5 className="font-semibold text-sm mb-1">Desglose por Tipo:</h5>
                                <div className="text-sm space-y-1 max-h-24 overflow-y-auto">
                                    {Object.entries(machineRequirements).map(([machine, count]) => (
                                        <div key={machine} className="flex justify-between pr-2">
                                            <span>{machine}:</span>
                                            <span className="font-semibold">{count.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {!isReadOnly && (
                        <div className="flex justify-end mb-4">
                            <Button onClick={handleAutoBalance}>Calcular Mejor Balanceo</Button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Operations Column */}
                        <div className="space-y-3">
                            <h3 className="text-xl font-semibold">Operaciones (Tarea: {Math.floor(moduleMetrics.taskPerHour)} uds)</h3>
                            {operationStats.map(op => (
                                <Card key={op.id}>
                                    <h4 className="font-bold">{op.code} - {op.name}</h4>
                                    <div className="text-sm grid grid-cols-2 gap-x-4">
                                        <span><strong>SAM:</strong> {op.standardTime.toFixed(4)} min</span>
                                        <span><strong>Máquina:</strong> {op.machine}</span>
                                        <span><strong>Nec. Máquina:</strong> {op.machineNeed.toFixed(4)}</span>
                                    </div>
                                    <div className="mt-2 flex justify-between items-center text-sm font-semibold">
                                        <span>Asignadas: <span className="text-green-600">{op.assignedUnits}</span></span>
                                        <span>Pendientes: <span className="text-red-600">{op.remainingUnits}</span></span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${(op.assignedUnits / (Math.floor(moduleMetrics.taskPerHour) || 1)) * 100}%` }}></div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        {/* Operators Column */}
                        <div className="space-y-3">
                            <h3 className="text-xl font-semibold">Operarios ({numPeople})</h3>
                            {operatorStats.map(operator => {
                                const operatorAssignments = assignments.find(a => a.id === operator.id)?.assignments || [];
                                return (
                                <Card key={operator.id}>
                                     <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold">Persona {operator.id.split('-')[1]}</h4>
                                        <span className="font-semibold">{operator.totalMinutes.toFixed(2)} / 60 min</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4 text-xs text-white text-center font-bold">
                                        <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${Math.min(100, operator.occupancy)}%` }}>{operator.occupancy.toFixed(1)}%</div>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        <h5 className="text-sm font-semibold border-b pb-1">Operaciones Asignadas</h5>
                                        {operatorAssignments.map(ass => {
                                            const op = productOperations.find(o => o.id === ass.operationId);
                                            if (!op) return null;
                                            return (
                                                <div key={op.id} className="text-xs grid grid-cols-12 items-center gap-2 border-b border-gray-100 dark:border-gray-700 py-1">
                                                   <span className="col-span-7 truncate">{op.code} - {op.name}</span>
                                                   <div className="col-span-4 flex items-center">
                                                     <input 
                                                        type="number"
                                                        value={ass.units}
                                                        onChange={(e) => handleAssignmentChange(op.id, operator.id, e.target.value)}
                                                        className="input w-16 text-xs p-1"
                                                        disabled={isReadOnly}
                                                        />
                                                      <span className="ml-1">uds</span>
                                                   </div>
                                                   <div className="col-span-1 text-right">
                                                      {!isReadOnly && (
                                                       <button onClick={() => handleRemoveOperationFromOperator(op.id, operator.id)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                       </button>
                                                      )}
                                                   </div>
                                                </div>
                                            )
                                        })}
                                        {!isReadOnly && (
                                         <div className="text-center pt-2">
                                             <select 
                                                className="input text-sm p-1" 
                                                value="" 
                                                onChange={e => handleAddOperationToOperator(e.target.value, operator.id)}>
                                                 <option value="">+ Asignar nueva operación</option>
                                                 {operationStats
                                                    .filter(os => !operatorAssignments.some(ass => ass.operationId === os.id))
                                                    .map(op => <option key={op.id} value={op.id}>{op.code} - {op.name}</option>)}
                                             </select>
                                         </div>
                                        )}
                                    </div>
                                </Card>
                            )})}
                        </div>
                    </div>
                </>
            )}
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; } .stat {font-size: 1.5rem; font-weight: 700;}`}</style>
        </div>
    );
};


const ModuleBalancingTab: React.FC<{
    products: Product[],
    operations: EngineeringOperation[]
}> = ({ products, operations }) => {
    
    type View = 'list' | 'create' | 'edit' | 'view';

    const [view, setView] = useState<View>('list');
    const [savedBalances, setSavedBalances] = useState<SavedBalance[]>([]);
    const [currentBalance, setCurrentBalance] = useState<SavedBalance | null>(null);

    const handleAddNew = () => {
        setCurrentBalance(null);
        setView('create');
    };

    const handleEdit = (balance: SavedBalance) => {
        setCurrentBalance(balance);
        setView('edit');
    };
    
    const handleView = (balance: SavedBalance) => {
        setCurrentBalance(balance);
        setView('view');
    };
    
    const handleDelete = (balanceId: string) => {
        if (window.confirm(`¿Está seguro de que desea eliminar el balanceo ${balanceId}?`)) {
            setSavedBalances(prev => prev.filter(b => b.id !== balanceId));
        }
    };
    
    const handleSave = (balanceData: Omit<SavedBalance, 'id'>) => {
        if (currentBalance) { // Editing existing
            setSavedBalances(prev => prev.map(b => b.id === currentBalance.id ? { ...balanceData, id: currentBalance.id } : b));
        } else { // Creating new
            const lastIdNum = savedBalances.map(b => parseInt(b.id.split('-')[1])).sort((a, b) => b - a)[0] || 0;
            const newId = `BAL-${String(lastIdNum + 1).padStart(2, '0')}`;
            setSavedBalances(prev => [...prev, { ...balanceData, id: newId }].sort((a,b) => a.id.localeCompare(b.id)));
        }
        setView('list');
        setCurrentBalance(null);
    };

    if (view === 'list') {
        return (
            <div>
                 <div className="flex justify-end items-center mb-4">
                    <Button onClick={handleAddNew}>+ Nuevo Balance</Button>
                </div>
                <Card>
                    <Table headers={['# Balance', 'Producto', 'Módulo', 'SAM Total', 'Tarea / Hora', 'Acciones']}>
                        {savedBalances.map(bal => {
                            const product = products.find(p => p.id === bal.productId);
                            if (!product) return null;
                            const totalSam = product.operationIds?.reduce((sum, id) => sum + (operations.find(op => op.id === id)?.standardTime || 0), 0) || 0;
                            const taskPerHour = totalSam > 0 ? (bal.numPeople * 60) / totalSam : 0;
                            return (
                                <tr key={bal.id}>
                                    <td className="px-6 py-4 font-medium">{bal.id}</td>
                                    <td className="px-6 py-4">{product.name}</td>
                                    <td className="px-6 py-4">{bal.moduleName}</td>
                                    <td className="px-6 py-4">{totalSam.toFixed(4)} min</td>
                                    <td className="px-6 py-4">{taskPerHour.toFixed(2)} uds</td>
                                    <td className="px-6 py-4 space-x-2">
                                        <Button variant="secondary" className="text-xs" onClick={() => handleView(bal)}>Ver</Button>
                                        <Button variant="secondary" className="text-xs" onClick={() => handleEdit(bal)}>Editar</Button>
                                        <Button variant="danger" className="text-xs" onClick={() => handleDelete(bal.id)}>Eliminar</Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </Table>
                    {savedBalances.length === 0 && <p className="text-center p-8 text-gray-500">No hay balanceos guardados. Cree uno nuevo para empezar.</p>}
                </Card>
            </div>
        );
    }
    
    // For 'create', 'edit', 'view'
    return (
         <ModuleBalancingForm
            products={products}
            operations={operations}
            onSave={handleSave}
            onCancel={() => setView('list')}
            initialBalance={currentBalance}
            isReadOnly={view === 'view'}
        />
    );
};

const EngineeringModule: React.FC = () => {
    const TABS = [
        { id: 'operations', label: 'Operaciones' },
        { id: 'operation_list', label: 'Listado de Operaciones' },
        { id: 'module_balance', label: 'Balanceo de Módulo' },
        { id: 'personal_efficiency', label: 'Eficiencia Personal' },
        { id: 'process_simulation', label: 'Simulación de Procesos' },
        { id: 'plant_capacity', label: 'Capacidad de Planta' },
    ];

    const [operations, setOperations] = useState(initialOperations);
    const [products, setProducts] = useState(mockProducts); // This state would likely be shared/synced from Planning

    const handleSaveOperation = (opToSave: EngineeringOperation) => {
        setOperations(prev => {
            const index = prev.findIndex(o => o.id === opToSave.id);
            if (index > -1) {
                const newOps = [...prev];
                newOps[index] = opToSave;
                return newOps;
            }
            return [opToSave, ...prev];
        });
    };

    const handleDeleteOperation = (id: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta operación?')) {
            setOperations(prev => prev.filter(o => o.id !== id));
        }
    };
    
    const handleUpdateProduct = (updatedProduct: Product) => {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    };
    
    const handleDeleteList = (productId: string) => {
        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                const { operationIds, ...rest } = p;
                return { ...rest };
            }
            return p;
        }));
    };

    return (
        <Tabs tabs={TABS}>
            {(activeTab) => (
                <div>
                    {activeTab === 'operations' && 
                        <OperationsTab 
                            operations={operations}
                            onSave={handleSaveOperation}
                            onDelete={handleDeleteOperation}
                        />
                    }
                    {activeTab === 'operation_list' &&
                        <OperationListTab
                            products={products}
                            operations={operations}
                            onUpdateProduct={handleUpdateProduct}
                            onDeleteList={handleDeleteList}
                        />
                    }
                    {activeTab === 'module_balance' && <ModuleBalancingTab products={products} operations={operations} />}
                    {activeTab === 'personal_efficiency' && <PlaceholderModule title="Eficiencia Personal" />}
                    {activeTab === 'process_simulation' && <PlaceholderModule title="Simulación de Procesos" />}
                    {activeTab === 'plant_capacity' && <PlaceholderModule title="Capacidad de Planta" />}
                </div>
            )}
        </Tabs>
    );
};

export default EngineeringModule;