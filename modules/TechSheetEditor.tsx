import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Button, FileInput, Table } from '../components/Common';
import { Product, TechSheet, DesignDetails, LogoSpec, TechSheetMaterial, TechnicalSpecs, Measurement, TechSheetProcess, PackagingStep, ProcessDefinition, TechSheetSubProcess, TechSheetOperation } from '../types';

interface TechSheetEditorProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (techSheet: TechSheet) => void;
    processes: ProcessDefinition[];
}

// Fix: Added the missing 'code' property to each object to match the Omit<TechSheetMaterial, 'consumptionPerUnit'> type.
const mockInventoryMaterials: Omit<TechSheetMaterial, 'consumptionPerUnit'>[] = [
    { id: 'mat-01', code: 'TELA-OX-CE', name: 'Tela Oxford Celeste', unit: 'm', cost: 8.50, provider: 'Textiles SAS', fabricType: 'Plano', colorCode: '#A7C7E7' },
    { id: 'mat-02', code: 'BTN-NAC-01', name: 'Botones Nácar', unit: 'un', cost: 0.15, provider: 'Botones World', fabricType: 'N/A', colorCode: 'Blanco' },
    { id: 'mat-03', code: 'HIL-BL-120', name: 'Hilo Blanco 120', unit: 'cono', cost: 3.00, provider: 'Hilos Cadena', fabricType: 'N/A', colorCode: '001' },
    { id: 'mat-04', code: 'TELA-GAB-BG', name: 'Tela Gabardina', unit: 'm', cost: 12.00, provider: 'Textiles SAS', fabricType: 'Sarga', colorCode: 'Beige' },
];

const generateNewTechSheet = (product: Product): TechSheet => ({
    id: `ts-${product.id}-${Date.now()}`,
    productId: product.id,
    version: 1,
    status: 'Borrador',
    design: {
        generalDescription: '',
        hasEmbroidery: false, hasPrint: false, hasOther: false,
        otherDescription: '',
        logos: [],
    },
    materials: [],
    specs: {
        sizes: ['S', 'M', 'L'],
        measurements: [{ id: `m-${Date.now()}`, name: 'Largo Total', sizes: { S: '', M: '', L: '' } }],
        thread: '', gauge: '', spi: '', needleType: '',
    },
    processes: [],
    packaging: [
        { id: 'pack-1', name: 'doblado', label: 'Doblado', description: '', measurements: '', imageUrl: '' },
        { id: 'pack-2', name: 'empaque individual', label: 'Empaque Individual', description: '', measurements: '', imageUrl: '' },
        { id: 'pack-3', name: 'empaque secundario', label: 'Empaque Secundario', description: '', measurements: '', imageUrl: '' },
        { id: 'pack-4', name: 'caja master', label: 'Caja Master', description: '', measurements: '', imageUrl: '' },
        { id: 'pack-5', name: 'paletizado', label: 'Paletizado', description: '', measurements: '', imageUrl: '' },
    ]
});


const DesignSection: React.FC<{ data: DesignDetails, setData: (data: DesignDetails) => void }> = ({ data, setData }) => {
    const handleLogoChange = (index: number, field: keyof LogoSpec, value: string) => {
        const newLogos = [...data.logos];
        newLogos[index] = { ...newLogos[index], [field]: value };
        setData({ ...data, logos: newLogos });
    };
    const addLogo = () => setData({ ...data, logos: [...data.logos, { id: `logo-${Date.now()}`, location: '', imageUrl: '' }] });
    const removeLogo = (index: number) => setData({ ...data, logos: data.logos.filter((_, i) => i !== index) });

    return <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileInput label="Foto Delantero" previewUrl={data.frontImageUrl} onFileChange={() => {}} onUrlChange={url => setData({...data, frontImageUrl: url})}/>
            <FileInput label="Foto Posterior" previewUrl={data.backImageUrl} onFileChange={() => {}} onUrlChange={url => setData({...data, backImageUrl: url})}/>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción General</label>
            <textarea value={data.generalDescription} onChange={e => setData({...data, generalDescription: e.target.value})} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 sm:text-sm" />
        </div>
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Acabados Especiales</label>
            <div className="flex flex-wrap gap-4 items-center">
                <label className="flex items-center"><input type="checkbox" checked={data.hasEmbroidery} onChange={e => setData({...data, hasEmbroidery: e.target.checked})} className="rounded"/> <span className="ml-2">Bordado</span></label>
                <label className="flex items-center"><input type="checkbox" checked={data.hasPrint} onChange={e => setData({...data, hasPrint: e.target.checked})} className="rounded"/> <span className="ml-2">Estampado</span></label>
                <label className="flex items-center"><input type="checkbox" checked={data.hasOther} onChange={e => setData({...data, hasOther: e.target.checked})} className="rounded"/> <span className="ml-2">Otro</span></label>
                {data.hasOther && <input type="text" placeholder="Especificar" value={data.otherDescription} onChange={e => setData({...data, otherDescription: e.target.value})} className="flex-grow rounded-md border-gray-300 shadow-sm dark:bg-dark-accent dark:border-gray-600 sm:text-sm"/>}
            </div>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Logos</h4>
            <div className="space-y-4">
                {data.logos.map((logo, index) => (
                    <div key={logo.id} className="flex items-start gap-4 p-3 border rounded-md dark:border-gray-700">
                        <FileInput label="" previewUrl={logo.imageUrl} onFileChange={() => {}} onUrlChange={url => handleLogoChange(index, 'imageUrl', url || '')} />
                        <div className="flex-grow">
                             <label className="block text-sm font-medium">Ubicación</label>
                            <input type="text" value={logo.location} onChange={e => handleLogoChange(index, 'location', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-dark-accent dark:border-gray-600 sm:text-sm"/>
                        </div>
                        <Button onClick={() => removeLogo(index)} variant="danger" className="mt-6">X</Button>
                    </div>
                ))}
            </div>
            <Button onClick={addLogo} className="mt-4">+ Añadir Logo</Button>
        </div>
    </div>;
}

const MaterialsSection: React.FC<{ data: TechSheetMaterial[], setData: (data: TechSheetMaterial[]) => void }> = ({ data, setData }) => {
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const addMaterial = () => {
        if (!selectedMaterialId || data.find(m => m.id === selectedMaterialId)) return;
        const materialToAdd = mockInventoryMaterials.find(m => m.id === selectedMaterialId);
        if (materialToAdd) {
            setData([...data, { ...materialToAdd, consumptionPerUnit: 0 }]);
        }
    };
    const removeMaterial = (id: string) => setData(data.filter(m => m.id !== id));
    const handleConsumptionChange = (id: string, value: string) => {
        const newData = data.map(m => m.id === id ? {...m, consumptionPerUnit: parseFloat(value) || 0 } : m);
        setData(newData);
    };
    
    return <div className="space-y-4">
        <div className="flex gap-2 items-end">
            <div className="flex-grow">
                <label className="block text-sm font-medium">Añadir Material (desde Inventario)</label>
                <select value={selectedMaterialId} onChange={e => setSelectedMaterialId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 sm:text-sm">
                    <option value="">Seleccionar material...</option>
                    {mockInventoryMaterials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>)}
                </select>
            </div>
            <Button onClick={addMaterial} disabled={!selectedMaterialId}>Añadir</Button>
        </div>
        <Table headers={['Nombre', 'Proveedor', 'Tipo', 'Color', 'Consumo', 'Unidad', 'Acciones']}>
            {data.map(mat => (
                <tr key={mat.id}>
                    <td className="px-6 py-2">{mat.name}</td>
                    <td className="px-6 py-2">{mat.provider}</td>
                    <td className="px-6 py-2">{mat.fabricType}</td>
                    <td className="px-6 py-2">{mat.colorCode}</td>
                    <td className="px-6 py-2">
                        <input type="number" value={mat.consumptionPerUnit} onChange={e => handleConsumptionChange(mat.id, e.target.value)} className="w-20 rounded-md border-gray-300 shadow-sm dark:bg-dark-accent dark:border-gray-600 sm:text-sm"/>
                    </td>
                    <td className="px-6 py-2">{mat.unit}</td>
                    <td className="px-6 py-2"><Button onClick={() => removeMaterial(mat.id)} variant="danger" className="text-xs px-2 py-1">Quitar</Button></td>
                </tr>
            ))}
        </Table>
    </div>;
};

const SpecsSection: React.FC<{ data: TechnicalSpecs, setData: (data: TechnicalSpecs) => void }> = ({ data, setData }) => {
    const handleMeasurementChange = (mId: string, size: string, value: string) => {
        const newMeasurements = data.measurements.map(m => m.id === mId ? { ...m, sizes: { ...m.sizes, [size]: value } } : m);
        setData({ ...data, measurements: newMeasurements });
    };

    const handleMeasurementNameChange = (mId: string, name: string) => {
        const newMeasurements = data.measurements.map(m => m.id === mId ? { ...m, name } : m);
        setData({ ...data, measurements: newMeasurements });
    };

    const addMeasurement = () => {
        const newMeasurement: Measurement = {
            id: `m-${Date.now()}`, name: '', sizes: data.sizes.reduce((acc, size) => ({ ...acc, [size]: '' }), {})
        };
        setData({ ...data, measurements: [...data.measurements, newMeasurement] });
    };
    
    const addSize = () => {
        const newSize = prompt('Nueva Talla (ej: XL):');
        if (newSize && !data.sizes.includes(newSize)) {
            const newSizes = [...data.sizes, newSize];
            const newMeasurements = data.measurements.map(m => ({ ...m, sizes: { ...m.sizes, [newSize]: '' } }));
            setData({ ...data, sizes: newSizes, measurements: newMeasurements });
        }
    };

    return <div className="space-y-6">
        <div>
            <h4 className="font-semibold mb-2">Especificaciones de Costura</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium">Hilo</label><input type="text" value={data.thread} onChange={e => setData({...data, thread: e.target.value})} className="mt-1 w-full input"/></div>
                <div><label className="block text-sm font-medium">Calibre</label><input type="text" value={data.gauge} onChange={e => setData({...data, gauge: e.target.value})} className="mt-1 w-full input"/></div>
                <div><label className="block text-sm font-medium">Puntadas/Pulgada</label><input type="text" value={data.spi} onChange={e => setData({...data, spi: e.target.value})} className="mt-1 w-full input"/></div>
                <div><label className="block text-sm font-medium">Tipo de Aguja</label><input type="text" value={data.needleType} onChange={e => setData({...data, needleType: e.target.value})} className="mt-1 w-full input"/></div>
            </div>
        </div>
         <div>
            <h4 className="font-semibold mb-2">Medidas del Producto Terminado</h4>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="th-cell">Medida</th>
                            {data.sizes.map(size => <th key={size} className="th-cell">{size}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {data.measurements.map(m => (
                            <tr key={m.id}>
                                <td className="td-cell"><input type="text" value={m.name} onChange={e => handleMeasurementNameChange(m.id, e.target.value)} className="w-full input"/></td>
                                {data.sizes.map(size => (
                                    <td key={size} className="td-cell"><input type="text" value={m.sizes[size]} onChange={e => handleMeasurementChange(m.id, size, e.target.value)} className="w-20 input text-center"/></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-2 space-x-2"><Button onClick={addMeasurement}>+ Fila</Button><Button onClick={addSize}>+ Talla</Button></div>
        </div>
    </div>;
};

const ProcessSection: React.FC<{ data: TechSheetProcess[], setData: (data: TechSheetProcess[]) => void, availableProcesses: ProcessDefinition[] }> = ({ data, setData, availableProcesses }) => {
    
    const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
    const [newSubProcessName, setNewSubProcessName] = useState('');

    const handleAddProcess = (processId: string) => {
        if (!processId || data.some(p => p.id === processId)) return;
        const processDef = availableProcesses.find(p => p.id === processId);
        if (!processDef) return;

        const newProcess: TechSheetProcess = {
            id: processDef.id,
            name: processDef.name,
            subProcesses: [],
        };
        setData([...data, newProcess]);
    };
    
    const handleRemoveProcess = (processId: string) => {
        setData(data.filter(p => p.id !== processId));
    };

    const handleConfirmAddSubProcess = (processId: string) => {
        const name = newSubProcessName.trim();
        if (!name) {
            setAddingSubTo(null);
            return;
        };
        const newSub: TechSheetSubProcess = { id: `sub-${Date.now()}`, name, operations: [] };
        setData(data.map(p => p.id === processId ? { ...p, subProcesses: [...p.subProcesses, newSub] } : p));
        setAddingSubTo(null);
        setNewSubProcessName('');
    };

    const handleCancelAddSubProcess = () => {
        setAddingSubTo(null);
        setNewSubProcessName('');
    };

    const handleAddOperation = (processId: string, subProcessId: string) => {
        const newOp: TechSheetOperation = { id: `op-${Date.now()}`, name: '', machine: '', spi: '', needle: '', attachment: '', description: '' };
        setData(data.map(p => p.id === processId ? {
            ...p,
            subProcesses: p.subProcesses.map(sp => sp.id === subProcessId ? { ...sp, operations: [...sp.operations, newOp] } : sp)
        } : p));
    };
    
    const handleOperationChange = (processId: string, subProcessId: string, opId: string, field: keyof TechSheetOperation, value: string) => {
        setData(data.map(p => p.id === processId ? {
            ...p,
            subProcesses: p.subProcesses.map(sp => sp.id === subProcessId ? {
                ...sp,
                operations: sp.operations.map(op => op.id === opId ? { ...op, [field]: value } : op)
            } : sp)
        } : p));
    };
    
    const handleRemoveOperation = (processId: string, subProcessId: string, opId: string) => {
        setData(data.map(p => p.id === processId ? {
            ...p,
            subProcesses: p.subProcesses.map(sp => sp.id === subProcessId ? {
                ...sp,
                operations: sp.operations.filter(op => op.id !== opId)
            } : sp)
        } : p));
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2 items-end">
                <div className="flex-grow">
                    <label className="block text-sm font-medium">Añadir Proceso (desde Programación)</label>
                    <select
                        value=""
                        onChange={e => handleAddProcess(e.target.value)}
                        className="mt-1 block w-full input"
                    >
                        <option value="">Seleccionar proceso...</option>
                        {availableProcesses.filter(ap => !data.some(p => p.id === ap.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="space-y-4">
                {data.map(process => (
                    <div key={process.id} className="p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-dark-accent/50">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold">{process.name}</h3>
                            <Button variant="danger" className="text-xs px-2 py-1" onClick={() => handleRemoveProcess(process.id)}>Quitar Proceso</Button>
                        </div>

                        {process.subProcesses.map(subProcess => (
                            <div key={subProcess.id} className="ml-4 mt-2 p-3 border-l-4 dark:border-l-brand-blue rounded bg-white dark:bg-dark-secondary">
                                <h4 className="font-semibold">{subProcess.name}</h4>
                                <div className="mt-2 space-y-3">
                                    {subProcess.operations.map(op => (
                                        <div key={op.id} className="border-t dark:border-gray-700 pt-3 space-y-2">
                                            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                                                <input type="text" placeholder="Nombre Operación" value={op.name} onChange={e => handleOperationChange(process.id, subProcess.id, op.id, 'name', e.target.value)} className="input md:col-span-2"/>
                                                <input type="text" placeholder="Máquina" value={op.machine} onChange={e => handleOperationChange(process.id, subProcess.id, op.id, 'machine', e.target.value)} className="input"/>
                                                <input type="text" placeholder="PPP" value={op.spi} onChange={e => handleOperationChange(process.id, subProcess.id, op.id, 'spi', e.target.value)} className="input text-center"/>
                                                <input type="text" placeholder="Aguja" value={op.needle} onChange={e => handleOperationChange(process.id, subProcess.id, op.id, 'needle', e.target.value)} className="input text-center"/>
                                                <div className="flex items-center gap-1">
                                                    <input type="text" placeholder="Aditamento" value={op.attachment} onChange={e => handleOperationChange(process.id, subProcess.id, op.id, 'attachment', e.target.value)} className="input w-full"/>
                                                    <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => handleRemoveOperation(process.id, subProcess.id, op.id)}>X</Button>
                                                </div>
                                            </div>
                                            <div>
                                                <textarea placeholder="Descripción de la operación..." value={op.description} onChange={e => handleOperationChange(process.id, subProcess.id, op.id, 'description', e.target.value)} className="input w-full text-sm" rows={1}></textarea>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                 <Button variant="secondary" className="text-xs mt-2" onClick={() => handleAddOperation(process.id, subProcess.id)}>+ Operación</Button>
                            </div>
                        ))}
                        
                        {addingSubTo === process.id ? (
                            <div className="ml-4 mt-2 p-3 flex items-center gap-2 bg-white dark:bg-dark-secondary rounded-md">
                                <input
                                    type="text"
                                    placeholder="Nombre del nuevo subproceso"
                                    value={newSubProcessName}
                                    onChange={(e) => setNewSubProcessName(e.target.value)}
                                    className="input flex-grow"
                                    autoFocus
                                />
                                <Button onClick={() => handleConfirmAddSubProcess(process.id)}>Añadir</Button>
                                <Button variant="secondary" onClick={handleCancelAddSubProcess}>Cancelar</Button>
                            </div>
                        ) : (
                            <Button className="mt-2" onClick={() => setAddingSubTo(process.id)}>+ Subproceso</Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};


const PackagingSection: React.FC<{ data: PackagingStep[], setData: (data: PackagingStep[]) => void }> = ({ data, setData }) => {
    const handleStepChange = (id: string, field: keyof PackagingStep, value: any) => {
        setData(data.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    return <div className="space-y-6">
        {data.map(step => (
            <div key={step.id} className="p-4 border rounded-lg dark:border-gray-700">
                <h4 className="font-semibold text-lg mb-4">{step.label}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <FileInput label="Imagen/Diagrama" previewUrl={step.imageUrl} onFileChange={() => {}} onUrlChange={url => handleStepChange(step.id, 'imageUrl', url || '')}/>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Descripción</label>
                            <textarea value={step.description} onChange={e => handleStepChange(step.id, 'description', e.target.value)} rows={3} className="w-full input mt-1"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Medidas / Especificaciones</label>
                            <input type="text" value={step.measurements} onChange={e => handleStepChange(step.id, 'measurements', e.target.value)} className="w-full input mt-1"/>
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>;
};


const TechSheetEditor: React.FC<TechSheetEditorProps> = ({ product, isOpen, onClose, onSave, processes: availableProcesses }) => {
    const [sheetData, setSheetData] = useState<TechSheet | null>(null);
    const TABS = [
        { id: 'design', label: 'Diseño' },
        { id: 'materials', label: 'Materiales' },
        { id: 'specs', label: 'Especificaciones Técnicas' },
        { id: 'process', label: 'Proceso' },
        { id: 'packaging', label: 'Empaque' },
    ];
    
    useEffect(() => {
        if (product) {
            setSheetData(product.techSheet || generateNewTechSheet(product));
        } else {
            setSheetData(null);
        }
    }, [product]);

    if (!isOpen || !product || !sheetData) return null;

    const handleSave = () => {
        onSave(sheetData);
    };

    const setSectionData = <K extends keyof TechSheet>(section: K, data: TechSheet[K]) => {
        setSheetData(prev => prev ? { ...prev, [section]: data } : null);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Ficha Técnica: ${product.name}`} size="4xl">
            <style>{`.input { display: block; width: 100%; border-radius: 0.375rem; border-width: 1px; border-color: #D1D5DB; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); background-color: transparent; padding: 0.5rem 0.75rem; } .dark .input { border-color: #4B5563; } .th-cell, .td-cell { padding: 0.5rem; border: 1px solid #e5e7eb; } .dark .th-cell, .dark .td-cell { border-color: #4b5563; }`}</style>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-dark-accent rounded-lg">
                    <div>
                        <span className="font-semibold">Versión:</span> {sheetData.version}
                        <span className="ml-4 font-semibold">Estado:</span>
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${sheetData.status === 'Aprobado' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{sheetData.status}</span>
                    </div>
                    <div className="space-x-2">
                         <Button variant="secondary" disabled>Aprobar Ficha</Button>
                         <Button variant="secondary" disabled>Duplicar</Button>
                    </div>
                </div>

                <Tabs tabs={TABS}>
                    {activeTab => (
                        <>
                            {activeTab === 'design' && <DesignSection data={sheetData.design} setData={d => setSectionData('design', d)} />}
                            {activeTab === 'materials' && <MaterialsSection data={sheetData.materials} setData={d => setSectionData('materials', d)} />}
                            {activeTab === 'specs' && <SpecsSection data={sheetData.specs} setData={d => setSectionData('specs', d)} />}
                            {activeTab === 'process' && <ProcessSection data={sheetData.processes} setData={d => setSectionData('processes', d)} availableProcesses={availableProcesses} />}
                            {activeTab === 'packaging' && <PackagingSection data={sheetData.packaging} setData={d => setSectionData('packaging', d)} />}
                        </>
                    )}
                </Tabs>
                
                <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Guardar Ficha Técnica</Button>
                </div>
            </div>
        </Modal>
    );
};

export default TechSheetEditor;