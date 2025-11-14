

import React, { useState, useMemo, useEffect } from 'react';
import { Button, Tabs, Modal, Table, Card } from '../components/Common';
import { Product, TechSheet, ProductionOrder, SizeCurveItem, ServiceOrder, ServiceProvider, ServiceOrderItem, ServiceOrderMaterial, CustomerOrder, Customer, CustomerOrderItem, MaterialExplosion, MaterialExplosionMaterial, InventoryItem, PurchaseRequest, ProcessDefinition, Workstation, CompanyInfo } from '../types';
import TechSheetEditor from './TechSheetEditor';

declare global {
  interface Window {
    jspdf: any;
  }
}

const initialMockProducts: Product[] = [
  { 
    id: 'prod-001', name: 'Camisa Oxford Clásica', reference: 'C-OX-01', imageUrl: 'https://picsum.photos/id/1025/100/100', client: 'Zara', collection: 'Verano 2024',
    techSheet: {
      id: 'ts-prod-001', productId: 'prod-001', version: 1, status: 'Aprobado',
      design: { generalDescription: 'Camisa clásica manga larga', hasEmbroidery: false, hasPrint: false, hasOther: false, otherDescription: '', logos: [] },
      materials: [
          {id: 'mat-01', code: 'TELA-OX-CE', name: 'Tela Oxford Celeste', unit: 'm', consumptionPerUnit: 1.5, cost: 8.5, provider: 'Textiles SAS', fabricType: 'Plano', colorCode: '#A7C7E7'},
          {id: 'mat-02', code: 'BTN-NAC-01', name: 'Botones Nácar', unit: 'un', consumptionPerUnit: 8, cost: 0.15, provider: 'Botones World', fabricType: 'N/A', colorCode: 'Blanco'},
      ],
      specs: { sizes: ['S', 'M', 'L'], measurements: [{ id: 'm-1', name: 'Largo Total', sizes: { S: '70', M: '72', L: '74' } }], thread: 'Hilo 120', gauge: 'N/A', spi: '14', needleType: 'DPx5' }, 
      processes: [
        { id: 'proc-2', name: 'Confección', subProcesses: [
          { id: 'sub-1', name: 'Preparación Cuello', operations: [
            { id: 'op-1', name: 'Fusionar', machine: 'Fusionadora', spi: 'N/A', needle: 'N/A', attachment: '', description: 'Fusionar entretela en las piezas del cuello.'},
            { id: 'op-2', name: 'Cerrar cuello', machine: 'Plana 1 aguja', spi: '14', needle: 'DPx5', attachment: '', description: ''},
          ]}
        ]}
      ], 
      packaging: [
        { id: 'pack-1', name: 'doblado', label: 'Doblado', description: 'Doblado estándar con cartón interior.', measurements: '25x35 cm', imageUrl: '' },
      ]
    },
    standardTimePerUnit: 2.5, // minutes
  },
  { id: 'prod-002', name: 'Pantalón Chino Slim', reference: 'P-CH-03', imageUrl: 'https://picsum.photos/id/1062/100/100', client: 'H&M', collection: 'Verano 2024',
    techSheet: {
      id: 'ts-prod-002', productId: 'prod-002', version: 1, status: 'Aprobado',
      design: { generalDescription: 'Pantalón chino corte slim', hasEmbroidery: false, hasPrint: false, hasOther: false, otherDescription: '', logos: [] },
      materials: [
          {id: 'mat-04', code: 'TELA-GAB-BG', name: 'Tela Gabardina', unit: 'm', consumptionPerUnit: 1.2, cost: 12.00, provider: 'Textiles SAS', fabricType: 'Sarga', colorCode: 'Beige' },
          {id: 'mat-03', code: 'HIL-BL-120', name: 'Hilo Blanco 120', unit: 'cono', consumptionPerUnit: 0.1, cost: 3.00, provider: 'Hilos Cadena', fabricType: 'N/A', colorCode: '001' },
      ],
      specs: { sizes: ['30', '32', '34'], measurements: [{ id: 'm-2', name: 'Largo Pierna', sizes: { '30': '100', '32': '102', '34': '104' } }], thread: 'Hilo 120', gauge: 'N/A', spi: '12', needleType: 'DPx5' },
      processes: [], 
      packaging: []
    },
    standardTimePerUnit: 3.0, // minutes
   },
  { id: 'prod-003', name: 'Blusa de Lino', reference: 'B-LI-05', imageUrl: 'https://picsum.photos/id/203/100/100', client: 'Mango', collection: 'Primavera 2024', standardTimePerUnit: 2.0 },
];

const initialMockOrders: ProductionOrder[] = [
    { id: 'OP-101', customerOrderId: 'PED-001', productId: 'prod-001', productName: 'Camisa Oxford Clásica', reference: 'C-OX-01', client: 'Zara', status: 'In Progress', sizeCurve: [{id: 'sc-1', size: 'M', color: 'Azul', quantity: 150}, {id: 'sc-2', size: 'L', color: 'Azul', quantity: 100}], totalQuantity: 250, creationDate: '2024-07-15' },
    { id: 'OP-102', productId: 'prod-002', productName: 'Pantalón Chino Slim', reference: 'P-CH-03', client: 'H&M', status: 'Pending', sizeCurve: [{id: 'sc-3', size: '32', color: 'Beige', quantity: 300}], totalQuantity: 300, creationDate: '2024-07-18' },
];

const mockServiceProviders: ServiceProvider[] = [
    { id: 'prov-01', name: 'Corte y Confección SAS', specialty: 'Corte' },
    { id: 'prov-02', name: 'Estampados Rápidos', specialty: 'Estampado' },
    { id: 'prov-03', name: 'Bordados de Calidad', specialty: 'Bordado' },
];

const mockProcesses: ProcessDefinition[] = [
    { id: 'proc-1', name: 'Corte', workstations: [{id: 'ws-1', name: 'MESA 1'}] },
    { id: 'proc-2', name: 'Confección', workstations: [{id: 'ws-2', name: 'MÓDULO 1'}, {id: 'ws-3', name: 'MÓDULO 2'}] },
    { id: 'proc-3', name: 'Bordado', workstations: [{id: 'ws-4', name: 'BORDADORA 1'}] },
    { id: 'proc-4', name: 'Estampado', workstations: [{id: 'ws-5', name: 'PULPO 1'}] },
    { id: 'proc-5', name: 'Terminación', workstations: [{id: 'ws-6', name: 'MESA DE LIMPIEZA'}] },
];

const initialMockServiceOrders: ServiceOrder[] = [
    { 
        id: 'OS-001', 
        productionOrderId: 'OP-101', 
        orderType: 'Externo',
        productId: 'prod-001', 
        productName: 'Camisa Oxford Clásica', 
        providerId: 'prov-01', 
        providerName: 'Corte y Confección SAS', 
        status: 'Enviado', 
        creationDate: '2024-07-20', 
        totalQuantity: 50, 
        items: [
             { id: 'soi-1', size: 'M', color: 'Azul', quantity: 30, productionOrderQuantity: 150 },
             { id: 'soi-2', size: 'L', color: 'Azul', quantity: 20, productionOrderQuantity: 100 },
        ] as ServiceOrderItem[], 
        materials: [
            { materialId: 'mat-01', name: 'Tela Oxford Celeste', unit: 'm', theoreticalQuantity: 75 },
            { materialId: 'mat-02', name: 'Botones Nácar', unit: 'un', theoreticalQuantity: 400 },
        ] 
    }
]

const mockCustomers: Customer[] = [
    { id: 'cust-01', name: 'Zara' },
    { id: 'cust-02', name: 'H&M' },
    { id: 'cust-03', name: 'Mango' },
];

const initialMockCustomerOrders: CustomerOrder[] = [
    { id: 'PED-001', customerId: 'cust-01', customerName: 'Zara', status: 'Confirmado', creationDate: '2024-07-21', items: [{id: 'coi-1', productId: 'prod-001', productName: 'Camisa Oxford Clásica', quantity: 100, unitPrice: 18, subtotal: 1800}], subtotal: 1800, vat: 342, total: 2142, observations: 'Entrega urgente.'}
]

const initialMockExplosions: MaterialExplosion[] = [
    { id: 'EXP-001', productionOrderId: 'OP-101', productName: 'Camisa Oxford Clásica', totalQuantity: 250, creationDate: '2024-07-25', materials: [
        { materialId: 'mat-01', materialCode: 'TELA-OX-CE', name: 'Tela Oxford Celeste', unit: 'm', provider: 'Textiles SAS', requiredQuantity: 375 },
        { materialId: 'mat-02', materialCode: 'BTN-NAC-01', name: 'Botones Nácar', unit: 'un', provider: 'Botones World', requiredQuantity: 2000 },
    ]}
];

const mockInventory: InventoryItem[] = [
    { materialId: 'mat-01', stock: 200 }, // Tela Oxford Celeste
    { materialId: 'mat-02', stock: 5000 }, // Botones Nácar
    { materialId: 'mat-03', stock: 50 },  // Hilo Blanco 120
    { materialId: 'mat-04', stock: 150 },  // Tela Gabardina
];

interface PlanningModuleProps {
    companyInfo: CompanyInfo;
}

const ProductFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (productData: any) => void;
    editingProduct: Product | null;
}> = ({ isOpen, onClose, onSave, editingProduct }) => {
    
    const initialFormState = {
        name: '', reference: '', description: '', client: '', collection: '',
        gender: 'Unisex' as Product['gender'],
        classification: 'Otro' as Product['classification'],
        standardTimePerUnit: 0,
    };
    const [formData, setFormData] = useState<any>(initialFormState);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (editingProduct) {
                setFormData({
                    name: editingProduct.name,
                    reference: editingProduct.reference,
                    description: editingProduct.description || '',
                    client: editingProduct.client,
                    collection: editingProduct.collection,
                    gender: editingProduct.gender || 'Unisex',
                    classification: editingProduct.classification || 'Otro',
                    standardTimePerUnit: editingProduct.standardTimePerUnit,
                });
                setImagePreview(editingProduct.imageUrl || null);
            } else {
                setFormData(initialFormState);
                setImagePreview(null);
            }
        }
    }, [isOpen, editingProduct]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleSubmit = () => {
        onSave({ ...formData, imageUrl: imagePreview ?? undefined });
    };

    const handleClose = () => {
        setFormData(initialFormState);
        setImagePreview(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}>
            <div className="space-y-4">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Referencia</label>
                    <input type="text" name="reference" id="reference" value={formData.reference} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                    <textarea name="description" id="description" rows={3} value={formData.description} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 sm:text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</label>
                        <input type="text" name="client" id="client" value={formData.client} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="collection" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Colección</label>
                        <input type="text" name="collection" id="collection" value={formData.collection} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 sm:text-sm" />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Género</label>
                        <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 sm:text-sm">
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                            <option value="Unisex">Unisex</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="classification" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Clasificación</label>
                         <select name="classification" id="classification" value={formData.classification} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 sm:text-sm">
                            <option value="Camisa">Camisa</option>
                            <option value="Pantalón">Pantalón</option>
                            <option value="Blusa">Blusa</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="standardTimePerUnit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tiempo Estándar por Unidad (min)</label>
                    <input type="number" step="0.1" name="standardTimePerUnit" id="standardTimePerUnit" value={formData.standardTimePerUnit} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Imagen</label>
                    <div className="mt-1 flex items-center">
                        <span className="inline-block h-12 w-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-accent">
                            {imagePreview ? <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" /> : <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                        </span>
                        <label htmlFor="file-upload" className="cursor-pointer ml-5 bg-white dark:bg-dark-secondary py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-blue">
                          <span>Subir un archivo</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                        </label>
                    </div>
                </div>
            </div>
             <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </div>
        </Modal>
    );
};

const ProductTab: React.FC<{ 
    products: Product[];
    onAddNew: () => void;
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
}> = ({ products, onAddNew, onEdit, onDelete, searchTerm, onSearchChange }) => (
    <div>
        <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
             <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </span>
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o referencia..." 
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 dark:text-white"
                />
            </div>
            <Button onClick={onAddNew}>+ Nuevo Producto</Button>
        </div>
        <Card>
            <Table headers={['Imagen', 'Nombre', 'Referencia', 'Cliente', 'Colección', 'Acciones']}>
                {products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-dark-accent">
                        <td className="px-6 py-4 whitespace-nowrap"><img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-full object-cover" /></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{product.reference}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{product.client}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{product.collection}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button variant="secondary" className="text-xs" onClick={() => onEdit(product)}>Editar</Button>
                            <Button variant="danger" className="text-xs" onClick={() => onDelete(product.id)}>Eliminar</Button>
                        </td>
                    </tr>
                ))}
            </Table>
        </Card>
    </div>
);

const TechSheetsTab: React.FC<{
    products: Product[];
    onEditTechSheet: (product: Product) => void;
    onCreateNew: () => void;
    onDeleteTechSheet: (productId: string) => void;
    onGeneratePdf: (product: Product) => void;
}> = ({ products, onEditTechSheet, onCreateNew, onDeleteTechSheet, onGeneratePdf }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const productsWithTechSheets = useMemo(() => 
        products.filter(p => p.techSheet), 
    [products]);

    const filteredProducts = useMemo(() => 
        productsWithTechSheets.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.reference.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    [productsWithTechSheets, searchTerm]);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <input 
                    type="text" 
                    placeholder="Buscar por producto o referencia..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input w-1/3"
                />
                <Button onClick={onCreateNew}>+ Nueva Ficha Técnica</Button>
            </div>
            <Card>
                <Table headers={['Producto', 'Referencia', 'Versión Ficha', 'Estado', 'Acciones']}>
                    {filteredProducts.map(product => (
                        <tr key={product.id}>
                            <td className="px-6 py-4 font-medium">{product.name}</td>
                            <td className="px-6 py-4">{product.reference}</td>
                            <td className="px-6 py-4">{product.techSheet?.version}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.techSheet?.status === 'Aprobado' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                    {product.techSheet?.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 space-x-2">
                                <Button variant="secondary" className="text-xs" onClick={() => onEditTechSheet(product)}>Ver/Editar</Button>
                                <Button variant="secondary" className="text-xs" onClick={() => onGeneratePdf(product)}>PDF</Button>
                                <Button variant="danger" className="text-xs" onClick={() => onDeleteTechSheet(product.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
                 {filteredProducts.length === 0 && <div className="text-center p-8 text-gray-500">No se encontraron fichas técnicas.</div>}
            </Card>
        </div>
    );
};

const SelectProductForTechSheetModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    onSelect: (product: Product) => void;
}> = ({ isOpen, onClose, products, onSelect }) => {
    const productsWithoutTechSheet = products.filter(p => !p.techSheet);
    
    const handleSelect = (product: Product) => {
        onSelect(product);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Producto para Ficha Técnica">
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {productsWithoutTechSheet.length > 0 ? productsWithoutTechSheet.map(p => (
                    <div key={p.id} onClick={() => handleSelect(p)} className="p-3 rounded-md hover:bg-gray-100 dark:hover:bg-dark-accent cursor-pointer">
                        <p className="font-semibold">{p.name} ({p.reference})</p>
                        <p className="text-sm text-gray-500">{p.client}</p>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 p-8">Todos los productos ya tienen una ficha técnica.</p>
                )}
            </div>
        </Modal>
    );
};

const getStatusColor = (status: ProductionOrder['status'] | ServiceOrder['status'] | CustomerOrder['status']) => {
    switch (status) {
        case 'In Progress':
        case 'Enviado':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'Completed':
        case 'Completado':
        case 'Recibido':
        case 'Confirmado':
        case 'Facturado':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'Pending':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'Delayed':
        case 'Cancelado':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'Borrador':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
}

const ProductionOrderFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: ProductionOrder) => void;
    products: Product[];
    customerOrders: CustomerOrder[];
    editingOrder: ProductionOrder | null;
}> = ({ isOpen, onClose, onSave, products, customerOrders, editingOrder }) => {
    
    const getInitialState = () => {
        if (editingOrder) return editingOrder;

        const defaultProduct = products[0];
        return {
            id: '',
            customerOrderId: undefined,
            productId: defaultProduct?.id || '',
            productName: defaultProduct?.name || '',
            reference: defaultProduct?.reference || '',
            client: defaultProduct?.client || '',
            status: 'Borrador' as const,
            sizeCurve: [{ id: `sc-${Date.now()}`, size: '', color: '', quantity: 0 }],
            totalQuantity: 0,
            creationDate: new Date().toISOString().split('T')[0],
        };
    };
    
    const [orderData, setOrderData] = useState<ProductionOrder>(getInitialState());

    useEffect(() => {
        setOrderData(getInitialState());
    }, [editingOrder, isOpen]);

    const handleProductChange = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            setOrderData(prev => ({
                ...prev,
                productId: product.id,
                productName: product.name,
                reference: product.reference,
                client: product.client,
            }));
        }
    };
    
    const handleSizeCurveChange = (id: string, field: keyof SizeCurveItem, value: string | number) => {
        const newSizeCurve = orderData.sizeCurve.map(item =>
            item.id === id ? { ...item, [field]: field === 'quantity' ? parseInt(value as string) || 0 : value } : item
        );
        setOrderData(prev => ({...prev, sizeCurve: newSizeCurve}));
    };

    const addSizeCurveRow = () => {
        setOrderData(prev => ({
            ...prev,
            sizeCurve: [...prev.sizeCurve, { id: `sc-${Date.now()}`, size: '', color: '', quantity: 0 }]
        }));
    };

    const removeSizeCurveRow = (id: string) => {
        setOrderData(prev => ({
            ...prev,
            sizeCurve: prev.sizeCurve.filter(item => item.id !== id)
        }));
    };
    
    const totalQuantity = useMemo(() => {
        return orderData.sizeCurve.reduce((sum, item) => sum + item.quantity, 0);
    }, [orderData.sizeCurve]);

    const handleSubmit = () => {
        const finalOrder = {
            ...orderData,
            id: orderData.id || `OP-${Date.now().toString().slice(-4)}`,
            totalQuantity: totalQuantity,
        };
        onSave(finalOrder);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingOrder ? 'Editar Orden de Producción' : 'Nueva Orden de Producción'} size="4xl">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pedido de Cliente (Opcional)</label>
                        <select 
                            value={orderData.customerOrderId || ''} 
                            onChange={(e) => setOrderData(prev => ({...prev, customerOrderId: e.target.value || undefined}))}
                            className="mt-1 block w-full input"
                        >
                            <option value="">Sin pedido asociado</option>
                            {customerOrders.map(co => <option key={co.id} value={co.id}>{co.id} - {co.customerName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Producto</label>
                        <select value={orderData.productId} onChange={(e) => handleProductChange(e.target.value)} className="mt-1 block w-full input">
                            <option value="">Seleccione un producto</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.reference})</option>)}
                        </select>
                    </div>
                </div>

                <h3 className="text-lg font-semibold border-t pt-4 dark:border-gray-700">Curva de Tallas</h3>
                <Table headers={['Talla', 'Color', 'Cantidad', 'Acciones']}>
                    {orderData.sizeCurve.map((item) => (
                        <tr key={item.id}>
                           <td className="px-2 py-1"><input type="text" value={item.size} onChange={e => handleSizeCurveChange(item.id, 'size', e.target.value)} className="w-full input"/></td>
                           <td className="px-2 py-1"><input type="text" value={item.color} onChange={e => handleSizeCurveChange(item.id, 'color', e.target.value)} className="w-full input"/></td>
                           <td className="px-2 py-1"><input type="number" value={item.quantity} onChange={e => handleSizeCurveChange(item.id, 'quantity', e.target.value)} className="w-full input"/></td>
                           <td className="px-2 py-1"><Button variant="danger" className="text-xs px-2 py-1" onClick={() => removeSizeCurveRow(item.id)}>Quitar</Button></td>
                        </tr>
                    ))}
                </Table>
                <Button onClick={addSizeCurveRow}>+ Añadir Fila</Button>

                <div className="text-right font-bold text-lg border-t pt-4 dark:border-gray-700">
                    Total Unidades: {totalQuantity}
                </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar Orden</Button>
            </div>
        </Modal>
    );
};

const ProductionOrdersTab: React.FC<{
    orders: ProductionOrder[];
    products: Product[];
    customerOrders: CustomerOrder[];
    onSave: (order: ProductionOrder) => void;
    onDelete: (orderId: string) => void;
}> = ({ orders, products, customerOrders, onSave, onDelete }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOrders = useMemo(() => orders.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.productName.toLowerCase().includes(searchTerm.toLowerCase())
    ), [orders, searchTerm]);

    const handleAddNew = () => {
        setEditingOrder(null);
        setModalOpen(true);
    };

    const handleEdit = (order: ProductionOrder) => {
        setEditingOrder(order);
        setModalOpen(true);
    };
    
    return (
        <div>
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input type="text" placeholder="Buscar por OP o producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 dark:text-white" />
                </div>
                <Button onClick={handleAddNew}>+ Nueva Orden</Button>
            </div>
            <Card>
                <Table headers={['# Orden', 'Pedido Cliente', 'Producto', 'Referencia', 'Cliente', 'Cant. Total', 'Estado', 'Acciones']}>
                    {filteredOrders.map(order => (
                        <tr key={order.id}>
                            <td className="px-6 py-4 font-medium">{order.id}</td>
                            <td className="px-6 py-4">{order.customerOrderId || '-'}</td>
                            <td className="px-6 py-4">{order.productName}</td>
                            <td className="px-6 py-4">{order.reference}</td>
                            <td className="px-6 py-4">{order.client}</td>
                            <td className="px-6 py-4">{order.totalQuantity}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button onClick={() => handleEdit(order)} className="text-brand-blue hover:text-blue-700">Editar</button>
                                <button onClick={() => onDelete(order.id)} className="text-red-600 hover:text-red-800 ml-4">Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <ProductionOrderFormModal 
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={onSave}
                products={products}
                customerOrders={customerOrders}
                editingOrder={editingOrder}
            />
        </div>
    );
};

const ServiceOrderFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: ServiceOrder) => void;
    editingOrder: ServiceOrder | null;
    productionOrders: ProductionOrder[];
    products: Product[];
    serviceProviders: ServiceProvider[];
    processes: ProcessDefinition[];
}> = ({ isOpen, onClose, onSave, editingOrder, productionOrders, products, serviceProviders, processes }) => {

    const getInitialState = (): Partial<ServiceOrder> => {
        if (editingOrder) return editingOrder;

        return {
            id: '',
            productionOrderId: '',
            orderType: 'Externo',
            productId: '',
            productName: '',
            providerId: '',
            providerName: '',
            status: 'Borrador',
            creationDate: new Date().toISOString().split('T')[0],
            items: [],
            materials: [],
            totalQuantity: 0,
        };
    };

    const [orderData, setOrderData] = useState<Partial<ServiceOrder>>(getInitialState());

    useEffect(() => {
        setOrderData(getInitialState());
    }, [editingOrder, isOpen]);

    const handleProductionOrderChange = (poId: string) => {
        const po = productionOrders.find(p => p.id === poId);
        if (po) {
            const newItems: ServiceOrderItem[] = po.sizeCurve.map(sc => ({
                ...sc,
                quantity: 0, // Start with 0 quantity for the service order
                productionOrderQuantity: sc.quantity,
            }));
            setOrderData(prev => ({
                ...getInitialState(),
                orderType: prev.orderType,
                productionOrderId: po.id,
                productId: po.productId,
                productName: po.productName,
                items: newItems,
            }));
        } else {
            setOrderData(prev => ({ ...prev, productionOrderId: '', productId: '', productName: '', items: [], materials: [] }));
        }
    };

    const handleItemQuantityChange = (itemId: string, quantityStr: string) => {
        const quantity = parseInt(quantityStr) || 0;
        const newItems = (orderData.items || []).map(item => {
            if (item.id === itemId) {
                // validation: cannot be more than the PO quantity
                const validatedQuantity = Math.min(quantity, item.productionOrderQuantity);
                return { ...item, quantity: validatedQuantity };
            }
            return item;
        });
        setOrderData(prev => ({ ...prev, items: newItems }));
    };

    const handleProviderChange = (providerId: string) => {
        const provider = serviceProviders.find(p => p.id === providerId);
        setOrderData(prev => ({ ...prev, providerId, providerName: provider?.name || '' }));
    };

    // Recalculate materials whenever items change
    useEffect(() => {
        const totalQuantity = (orderData.items || []).reduce((sum, item) => sum + item.quantity, 0);
        if (totalQuantity > 0 && orderData.productId) {
            const product = products.find(p => p.id === orderData.productId);
            const techSheetMaterials = product?.techSheet?.materials || [];
            
            const newMaterials: ServiceOrderMaterial[] = techSheetMaterials.map(mat => ({
                materialId: mat.id,
                name: mat.name,
                unit: mat.unit,
                theoreticalQuantity: parseFloat((mat.consumptionPerUnit * totalQuantity).toFixed(2)),
                actualQuantity: (orderData.materials || []).find(m => m.materialId === mat.id)?.actualQuantity
            }));
            setOrderData(prev => ({...prev, materials: newMaterials, totalQuantity}));
        } else {
             setOrderData(prev => ({...prev, materials: [], totalQuantity: 0}));
        }
    }, [orderData.items, orderData.productId, products]);

    const handleActualConsumptionChange = (materialId: string, quantityStr: string) => {
        const actualQuantity = parseFloat(quantityStr) || 0;
        const newMaterials = (orderData.materials || []).map(m => m.materialId === materialId ? {...m, actualQuantity} : m);
        setOrderData(prev => ({...prev, materials: newMaterials}));
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        const newOrderData = { ...orderData, [name]: value };
        
        if (name === 'orderType') {
            newOrderData.providerId = undefined;
            newOrderData.providerName = undefined;
            newOrderData.processId = undefined;
            newOrderData.workstationId = undefined;
        }

        if(name === 'processId') {
            newOrderData.workstationId = undefined;
        }

        setOrderData(newOrderData);
    };

    const availableWorkstations = useMemo(() => {
        if (!orderData.processId) return [];
        return processes.find(p => p.id === orderData.processId)?.workstations || [];
    }, [orderData.processId, processes]);

    const handleSubmit = () => {
        const finalOrder: ServiceOrder = {
            ...(orderData as ServiceOrder),
            id: orderData.id || `OS-${Date.now().toString().slice(-4)}`,
        };
        onSave(finalOrder);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingOrder ? 'Editar Orden de Servicio' : 'Nueva Orden de Servicio'} size="4xl">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Orden de Producción (OP)</label>
                        <select value={orderData.productionOrderId} onChange={e => handleProductionOrderChange(e.target.value)} className="w-full mt-1 input">
                            <option value="">Seleccione una OP</option>
                            {productionOrders.map(po => <option key={po.id} value={po.id}>{po.id} - {po.productName}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Tipo de Destino</label>
                         <select name="orderType" value={orderData.orderType} onChange={handleChange} className="w-full mt-1 input">
                             <option value="Externo">Externo (Proveedor)</option>
                             <option value="Interno">Interno (Estación de Trabajo)</option>
                         </select>
                    </div>
                </div>

                {orderData.orderType === 'Externo' && (
                     <div>
                        <label className="block text-sm font-medium">Proveedor de Servicio</label>
                        <select value={orderData.providerId || ''} onChange={e => handleProviderChange(e.target.value)} className="w-full mt-1 input">
                            <option value="">Seleccione un proveedor</option>
                            {serviceProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                )}

                {orderData.orderType === 'Interno' && (
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium">Proceso</label>
                            <select name="processId" value={orderData.processId || ''} onChange={handleChange} className="w-full mt-1 input">
                                <option value="">Seleccionar Proceso</option>
                                {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Estación de Trabajo</label>
                            <select name="workstationId" value={orderData.workstationId || ''} onChange={handleChange} className="w-full mt-1 input" disabled={!orderData.processId}>
                                <option value="">Seleccionar Estación</option>
                                {availableWorkstations.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}


                {(orderData.items || []).length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold border-t pt-4 dark:border-gray-700">Cantidades a Enviar</h3>
                        <p className="text-sm text-gray-500 mb-2">Defina las cantidades por talla/color para esta orden de servicio.</p>
                        <Table headers={['Talla', 'Color', 'Cantidad en OP', 'Cantidad a Enviar']}>
                            {orderData.items!.map(item => (
                                <tr key={item.id}>
                                    <td className="px-2 py-1">{item.size}</td>
                                    <td className="px-2 py-1">{item.color}</td>
                                    <td className="px-2 py-1">{item.productionOrderQuantity}</td>
                                    <td className="px-2 py-1">
                                        <input 
                                            type="number" 
                                            value={item.quantity}
                                            onChange={e => handleItemQuantityChange(item.id, e.target.value)}
                                            max={item.productionOrderQuantity}
                                            className="w-24 input"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </Table>
                         <div className="text-right font-bold text-md mt-2">
                            Total Unidades a Enviar: {orderData.totalQuantity}
                        </div>
                    </div>
                )}

                 {orderData.totalQuantity && orderData.totalQuantity > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold border-t pt-4 dark:border-gray-700">Materiales Requeridos</h3>
                        <p className="text-sm text-gray-500 mb-2">
                            Cálculo automático basado en la Ficha Técnica del producto para un total de <span className="font-bold text-gray-800 dark:text-white">{orderData.totalQuantity}</span> unidades.
                        </p>
                        {(orderData.materials || []).length > 0 ? (
                            <Table headers={['Material', 'Consumo Teórico', 'Unidad', 'Consumo Real']}>
                               {orderData.materials!.map(mat => (
                                   <tr key={mat.materialId}>
                                       <td className="px-2 py-1">{mat.name}</td>
                                       <td className="px-2 py-1">{mat.theoreticalQuantity}</td>
                                       <td className="px-2 py-1">{mat.unit}</td>
                                       <td className="px-2 py-1">
                                           <input 
                                               type="number" 
                                               value={mat.actualQuantity || ''}
                                               onChange={e => handleActualConsumptionChange(mat.materialId, e.target.value)}
                                               className="w-24 input"
                                           />
                                       </td>
                                   </tr>
                               ))}
                            </Table>
                        ) : (
                            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">No se encontraron materiales en la Ficha Técnica del producto o el consumo es cero.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
             <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={orderData.totalQuantity === 0 || (orderData.orderType === 'Externo' && !orderData.providerId) || (orderData.orderType === 'Interno' && !orderData.workstationId)}>Guardar Orden de Servicio</Button>
            </div>
        </Modal>
    )
}

const ServiceOrdersTab: React.FC<{
    serviceOrders: ServiceOrder[];
    productionOrders: ProductionOrder[];
    products: Product[];
    processes: ProcessDefinition[];
    onSave: (order: ServiceOrder) => void;
    onDelete: (orderId: string) => void;
    onGeneratePdf: (order: ServiceOrder) => void;
}> = ({ serviceOrders, productionOrders, products, processes, onSave, onDelete, onGeneratePdf }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOrders = useMemo(() => serviceOrders.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.providerName && order.providerName.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [serviceOrders, searchTerm]);

    const handleAddNew = () => {
        setEditingOrder(null);
        setModalOpen(true);
    };

    const handleEdit = (order: ServiceOrder) => {
        setEditingOrder(order);
        setModalOpen(true);
    };
    
    const getDestination = (order: ServiceOrder) => {
        if (order.orderType === 'Interno') {
            const process = processes.find(p => p.id === order.processId);
            const workstation = process?.workstations.find(w => w.id === order.workstationId);
            return workstation ? `${process?.name} / ${workstation.name}` : 'Interno (N/A)';
        }
        return order.providerName || 'Externo (N/A)';
    };

    return (
        <div>
             <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                <div className="relative">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3"><svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
                    <input type="text" placeholder="Buscar por OS, producto, destino..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 dark:text-white" />
                </div>
                <Button onClick={handleAddNew}>+ Nueva Orden de Servicio</Button>
            </div>
            <Card>
                <Table headers={['# OS', 'OP Vinculada', 'Producto', 'Destino', 'Cant. Total', 'Estado', 'Acciones']}>
                    {filteredOrders.map(order => (
                        <tr key={order.id}>
                            <td className="px-6 py-4 font-medium">{order.id}</td>
                            <td className="px-6 py-4">{order.productionOrderId}</td>
                            <td className="px-6 py-4">{order.productName}</td>
                            <td className="px-6 py-4">{getDestination(order)}</td>
                            <td className="px-6 py-4">{order.totalQuantity}</td>
                             <td className="px-6 py-4">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <Button variant="secondary" className="text-xs" onClick={() => handleEdit(order)}>Editar</Button>
                                <Button variant="danger" className="text-xs" onClick={() => onDelete(order.id)}>Eliminar</Button>
                                <Button variant="secondary" className="text-xs" onClick={() => onGeneratePdf(order)} disabled={order.orderType !== 'Externo'}>PDF</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <ServiceOrderFormModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={onSave}
                editingOrder={editingOrder}
                productionOrders={productionOrders}
                products={products}
                serviceProviders={mockServiceProviders}
                processes={processes}
            />
        </div>
    );
};

const CustomerOrderFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: CustomerOrder) => void;
    editingOrder: CustomerOrder | null;
    customers: Customer[];
    products: Product[];
}> = ({ isOpen, onClose, onSave, editingOrder, customers, products }) => {
    
    const VAT_RATE = 0.19;

    const getInitialState = (): CustomerOrder => {
        if (editingOrder) return editingOrder;

        return {
            id: '',
            customerId: '',
            customerName: '',
            items: [],
            subtotal: 0,
            vat: 0,
            total: 0,
            observations: '',
            status: 'Borrador',
            creationDate: new Date().toISOString().split('T')[0],
        };
    };

    const [orderData, setOrderData] = useState<CustomerOrder>(getInitialState());

    useEffect(() => {
        setOrderData(getInitialState());
    }, [editingOrder, isOpen]);

    const handleCustomerChange = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        setOrderData(prev => ({ ...prev, customerId, customerName: customer?.name || '' }));
    };

    const handleItemChange = (itemId: string, field: keyof CustomerOrderItem, value: any) => {
        const newItems = orderData.items.map(item => {
            if (item.id === itemId) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'productId') {
                    const product = products.find(p => p.id === value);
                    updatedItem.productName = product?.name || '';
                }
                if (field === 'quantity' || field === 'unitPrice') {
                    updatedItem.quantity = field === 'quantity' ? parseInt(value) || 0 : updatedItem.quantity;
                    updatedItem.unitPrice = field === 'unitPrice' ? parseFloat(value) || 0 : updatedItem.unitPrice;
                    updatedItem.subtotal = updatedItem.quantity * updatedItem.unitPrice;
                }
                return updatedItem;
            }
            return item;
        });
        setOrderData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        const newItem: CustomerOrderItem = {
            id: `coi-${Date.now()}`,
            productId: '',
            productName: '',
            quantity: 1,
            unitPrice: 0,
            subtotal: 0,
        };
        setOrderData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };
    
    const removeItem = (itemId: string) => {
        setOrderData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== itemId)}));
    };

    useEffect(() => {
        const subtotal = orderData.items.reduce((sum, item) => sum + item.subtotal, 0);
        const vat = subtotal * VAT_RATE;
        const total = subtotal + vat;
        setOrderData(prev => ({ ...prev, subtotal, vat, total }));
    }, [orderData.items]);
    
    const handleSubmit = () => {
        const finalOrder: CustomerOrder = {
            ...orderData,
            id: orderData.id || `PED-${Date.now().toString().slice(-4)}`,
        };
        onSave(finalOrder);
        onClose();
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingOrder ? 'Editar Pedido' : 'Nuevo Pedido'} size="4xl">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Cliente</label>
                        <select value={orderData.customerId} onChange={e => handleCustomerChange(e.target.value)} className="w-full mt-1 input">
                            <option value="">Seleccione un cliente</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
                
                <h3 className="text-lg font-semibold border-t pt-4 dark:border-gray-700">Artículos del Pedido</h3>
                <Table headers={['Producto', 'Cantidad', 'Valor Unitario', 'Subtotal', 'Acción']}>
                    {orderData.items.map(item => (
                        <tr key={item.id}>
                            <td className="p-1"><select value={item.productId} onChange={e => handleItemChange(item.id, 'productId', e.target.value)} className="w-full input"><option>Seleccionar</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
                            <td className="p-1"><input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} className="w-24 input"/></td>
                            <td className="p-1"><input type="number" value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', e.target.value)} className="w-32 input"/></td>
                            <td className="p-1 text-right">{formatCurrency(item.subtotal)}</td>
                            <td className="p-1"><Button variant="danger" className="px-2 py-1 text-xs" onClick={() => removeItem(item.id)}>X</Button></td>
                        </tr>
                    ))}
                </Table>
                <Button onClick={addItem}>+ Añadir Artículo</Button>

                <div className="grid grid-cols-2 gap-4 border-t pt-4 dark:border-gray-700">
                    <div>
                        <label className="block text-sm font-medium">Observaciones</label>
                        <textarea value={orderData.observations} onChange={e => setOrderData(prev => ({...prev, observations: e.target.value}))} rows={4} className="w-full mt-1 input"></textarea>
                    </div>
                    <div className="space-y-2 text-right">
                        <div className="flex justify-between text-lg"><span className="font-semibold">Subtotal:</span><span>{formatCurrency(orderData.subtotal)}</span></div>
                        <div className="flex justify-between text-lg"><span className="font-semibold">IVA (19%):</span><span>{formatCurrency(orderData.vat)}</span></div>
                        <div className="flex justify-between text-xl font-bold border-t pt-2 dark:border-gray-600"><span >Total:</span><span>{formatCurrency(orderData.total)}</span></div>
                    </div>
                </div>
            </div>
             <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={!orderData.customerId || orderData.items.length === 0}>Guardar Pedido</Button>
            </div>
        </Modal>
    )
}

const CustomerOrdersTab: React.FC<{
    orders: CustomerOrder[];
    onSave: (order: CustomerOrder) => void;
    onDelete: (orderId: string) => void;
    customers: Customer[];
    products: Product[];
}> = ({ orders, onSave, onDelete, customers, products }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);

    const filteredOrders = useMemo(() => orders.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    ), [orders, searchTerm]);

    const handleAddNew = () => {
        setEditingOrder(null);
        setModalOpen(true);
    };

    const handleEdit = (order: CustomerOrder) => {
        setEditingOrder(order);
        setModalOpen(true);
    };

    return (
         <div>
             <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                <div className="relative">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3"><svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
                    <input type="text" placeholder="Buscar por # Pedido o cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 dark:text-white" />
                </div>
                <Button onClick={handleAddNew}>+ Nuevo Pedido</Button>
            </div>
            <Card>
                <Table headers={['# Pedido', 'Cliente', 'Fecha', 'Total', 'Estado', 'Acciones']}>
                    {filteredOrders.map(order => (
                        <tr key={order.id}>
                            <td className="px-6 py-4 font-medium">{order.id}</td>
                            <td className="px-6 py-4">{order.customerName}</td>
                            <td className="px-6 py-4">{order.creationDate}</td>
                            <td className="px-6 py-4">{formatCurrency(order.total)}</td>
                            <td className="px-6 py-4">
                               <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button onClick={() => handleEdit(order)} className="text-brand-blue hover:text-blue-700">Editar</button>
                                <button onClick={() => onDelete(order.id)} className="text-red-600 hover:text-red-800 ml-4">Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
             <CustomerOrderFormModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={onSave}
                editingOrder={editingOrder}
                customers={customers}
                products={products}
            />
        </div>
    )
}

const MaterialExplosionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (explosion: MaterialExplosion) => void;
    productionOrders: ProductionOrder[];
    products: Product[];
    viewingExplosion: MaterialExplosion | null;
}> = ({ isOpen, onClose, onSave, productionOrders, products, viewingExplosion }) => {
    const [selectedOrderId, setSelectedOrderId] = useState<string>('');
    
    useEffect(() => {
        // Reset state when modal opens for creation
        if(isOpen && !viewingExplosion) {
            setSelectedOrderId('');
        }
    }, [isOpen, viewingExplosion]);

    const calculationResult = useMemo(() => {
        const orderId = viewingExplosion ? viewingExplosion.productionOrderId : selectedOrderId;
        if (!orderId) {
            return { type: 'info', message: 'Por favor, seleccione una Orden de Producción para calcular los materiales.' };
        }

        const order = productionOrders.find(o => o.id === orderId);
        if (!order) {
             return { type: 'error', message: 'Orden de producción no encontrada.' };
        }

        const product = products.find(p => p.id === order.productId);
        if (!product || !product.techSheet || !product.techSheet.materials || product.techSheet.materials.length === 0) {
            return { type: 'warning', message: `El producto '${order.productName}' no tiene materiales definidos en su Ficha Técnica.`, order };
        }
        
        const requiredMaterials: MaterialExplosionMaterial[] = product.techSheet.materials.map(material => ({
            materialId: material.id,
            materialCode: material.code,
            name: material.name,
            unit: material.unit,
            provider: material.provider,
            requiredQuantity: parseFloat((material.consumptionPerUnit * order.totalQuantity).toFixed(3)),
        }));

        return { type: 'success', materials: requiredMaterials, order };

    }, [selectedOrderId, productionOrders, products, viewingExplosion]);
    
    const handleSave = () => {
        if (calculationResult.type === 'success' && calculationResult.order) {
            const newExplosion: MaterialExplosion = {
                id: `EXP-${Date.now().toString().slice(-4)}`,
                productionOrderId: calculationResult.order.id,
                productName: calculationResult.order.productName,
                totalQuantity: calculationResult.order.totalQuantity,
                creationDate: new Date().toISOString().split('T')[0],
                materials: calculationResult.materials,
            };
            onSave(newExplosion);
            onClose();
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={viewingExplosion ? `Detalle Explosión: ${viewingExplosion.id}`: 'Nueva Explosión de Materiales'} 
            size="4xl"
        >
             <div className="space-y-4">
                 {!viewingExplosion && (
                    <div className="max-w-md mb-6">
                        <label htmlFor="po-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Seleccionar Orden de Producción</label>
                        <select 
                            id="po-select"
                            value={selectedOrderId}
                            onChange={e => setSelectedOrderId(e.target.value)}
                            className="mt-1 block w-full input"
                        >
                            <option value="">Seleccione una OP...</option>
                            {productionOrders.map(order => (
                                <option key={order.id} value={order.id}>{order.id} - {order.productName} ({order.totalQuantity} uds.)</option>
                            ))}
                        </select>
                    </div>
                 )}
                
                {calculationResult.type === 'info' && (
                    <div className="text-center p-8 bg-gray-50 dark:bg-dark-accent rounded-lg">
                        <p className="text-gray-500">{calculationResult.message}</p>
                    </div>
                )}
                
                {calculationResult.type === 'warning' && (
                     <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">{calculationResult.message}</p>
                    </div>
                )}

                {calculationResult.type === 'success' && calculationResult.order && (
                    <div>
                         <div className="mb-4 p-3 bg-gray-100 dark:bg-dark-accent rounded-md">
                            <p>Mostrando requerimiento para la <strong>OP: {calculationResult.order.id}</strong></p>
                            <p>Producto: <strong>{calculationResult.order.productName}</strong> - Cantidad Total: <strong>{calculationResult.order.totalQuantity} unidades</strong></p>
                            {viewingExplosion && <p>Fecha de Cálculo: <strong>{viewingExplosion.creationDate}</strong></p>}
                        </div>
                        <Table headers={['Material', 'Cantidad Total Requerida', 'Unidad']}>
                            { (viewingExplosion?.materials || calculationResult.materials).map(mat => (
                                <tr key={mat.name}>
                                    <td className="px-6 py-4">{mat.name}</td>
                                    <td className="px-6 py-4 font-medium">{mat.requiredQuantity}</td>
                                    <td className="px-6 py-4">{mat.unit}</td>
                                </tr>
                            ))}
                        </Table>
                    </div>
                )}

            </div>
             <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>{viewingExplosion ? 'Cerrar' : 'Cancelar'}</Button>
                {!viewingExplosion && <Button onClick={handleSave} disabled={calculationResult.type !== 'success'}>Guardar Explosión</Button>}
            </div>
        </Modal>
    );
};


const MaterialExplosionTab: React.FC<{
    explosions: MaterialExplosion[];
    productionOrders: ProductionOrder[];
    products: Product[];
    onSave: (explosion: MaterialExplosion) => void;
    onDelete: (explosionId: string) => void;
}> = ({ explosions, productionOrders, products, onSave, onDelete }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [viewingExplosion, setViewingExplosion] = useState<MaterialExplosion | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredExplosions = useMemo(() => explosions.filter(exp =>
        exp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.productionOrderId.toLowerCase().includes(searchTerm.toLowerCase())
    ), [explosions, searchTerm]);

    const handleAddNew = () => {
        setViewingExplosion(null);
        setModalOpen(true);
    };

    const handleView = (explosion: MaterialExplosion) => {
        setViewingExplosion(explosion);
        setModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setModalOpen(false);
        setViewingExplosion(null);
    }

    return (
        <div>
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                <div className="relative">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3"><svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
                    <input type="text" placeholder="Buscar por # EXP o # OP..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 dark:text-white" />
                </div>
                <Button onClick={handleAddNew}>+ Nueva Explosión</Button>
            </div>
            <Card>
                <Table headers={['# Explosión', 'OP Vinculada', 'Producto', 'Fecha Cálculo', 'Acciones']}>
                    {filteredExplosions.map(exp => (
                        <tr key={exp.id}>
                            <td className="px-6 py-4 font-medium">{exp.id}</td>
                            <td className="px-6 py-4">{exp.productionOrderId}</td>
                            <td className="px-6 py-4">{exp.productName}</td>
                            <td className="px-6 py-4">{exp.creationDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button onClick={() => handleView(exp)} className="text-brand-blue hover:text-blue-700">Ver</button>
                                <button onClick={() => onDelete(exp.id)} className="text-red-600 hover:text-red-800 ml-4">Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <MaterialExplosionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={onSave}
                productionOrders={productionOrders}
                products={products}
                viewingExplosion={viewingExplosion}
            />
        </div>
    );
};

type CalculatedItem = {
    materialId: string;
    materialCode: string;
    materialName: string;
    provider: string;
    unit: string;
    requiredQuantity: number;
    stock: number;
    quantityToBuy: number;
};

const PurchaseRequestViewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    request: PurchaseRequest | null;
}> = ({ isOpen, onClose, request }) => {
    if (!request) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalle Requerimiento: ${request.id}`} size="4xl">
            <div className="space-y-4">
                <div className="mb-4 p-3 bg-gray-100 dark:bg-dark-accent rounded-md">
                    <p><strong>OP Vinculada:</strong> {request.productionOrderId}</p>
                    <p><strong>Fecha Creación:</strong> {request.creationDate}</p>
                </div>
                <Table headers={["Código", "Material", "Proveedor", "Cantidad a Comprar", "Unidad"]}>
                    {request.items.map(item => (
                        <tr key={item.materialId}>
                            <td className="px-4 py-2">{item.materialCode}</td>
                            <td className="px-4 py-2">{item.materialName}</td>
                            <td className="px-4 py-2">{item.provider}</td>
                            <td className="px-4 py-2 font-medium">{item.quantityToBuy}</td>
                            <td className="px-4 py-2">{item.unit}</td>
                        </tr>
                    ))}
                </Table>
            </div>
             <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cerrar</Button>
            </div>
        </Modal>
    );
};


const PurchaseRequestFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSaveAndGeneratePdf: (request: PurchaseRequest) => void;
    productionOrders: ProductionOrder[];
    materialExplosions: MaterialExplosion[];
    editingRequest: PurchaseRequest | null;
}> = ({ isOpen, onClose, onSaveAndGeneratePdf, productionOrders, materialExplosions, editingRequest }) => {
    
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [calculatedItems, setCalculatedItems] = useState<CalculatedItem[]>([]);

    useEffect(() => {
        if (isOpen) {
            if(editingRequest) {
                setSelectedOrderId(editingRequest.productionOrderId);
            } else {
                setSelectedOrderId('');
                setCalculatedItems([]);
            }
        }
    }, [isOpen, editingRequest]);

    useEffect(() => {
        if (!selectedOrderId) {
            setCalculatedItems([]);
            return;
        }

        const explosion = materialExplosions.find(exp => exp.productionOrderId === selectedOrderId);
        if (explosion) {
            let items = explosion.materials.map(mat => {
                const stockItem = mockInventory.find(inv => inv.materialId === mat.materialId);
                const stock = stockItem?.stock || 0;
                const required = mat.requiredQuantity;
                const toBuy = Math.max(0, required - stock);
                return {
                    materialId: mat.materialId,
                    materialCode: mat.materialCode,
                    materialName: mat.name,
                    provider: mat.provider,
                    unit: mat.unit,
                    requiredQuantity: required,
                    stock: stock,
                    quantityToBuy: toBuy
                };
            });
            
            // If editing, merge the saved quantities
            if (editingRequest && editingRequest.productionOrderId === selectedOrderId) {
                items = items.map(calcItem => {
                    const savedItem = editingRequest.items.find(saved => saved.materialId === calcItem.materialId);
                    return savedItem ? { ...calcItem, quantityToBuy: savedItem.quantityToBuy } : calcItem;
                })
            }

            setCalculatedItems(items);
        } else {
             setCalculatedItems([]);
        }

    }, [selectedOrderId, materialExplosions, editingRequest]);

    const handleQuantityChange = (materialId: string, value: string) => {
        const newQuantity = parseFloat(value) || 0;
        setCalculatedItems(prev => prev.map(item => 
            item.materialId === materialId ? { ...item, quantityToBuy: newQuantity } : item
        ));
    };

    const handleSave = () => {
        const order = productionOrders.find(o => o.id === selectedOrderId);
        if (!order || calculatedItems.length === 0) return;
        
        const newRequest: PurchaseRequest = {
            id: editingRequest?.id || `RC-${Date.now().toString().slice(-4)}`,
            productionOrderId: selectedOrderId,
            customerOrderId: order.customerOrderId,
            creationDate: editingRequest?.creationDate || new Date().toISOString().split('T')[0],
            items: calculatedItems
                .filter(item => item.quantityToBuy > 0)
                .map(({materialId, materialCode, materialName, provider, quantityToBuy, unit}) => ({
                    materialId, materialCode, materialName, provider, quantityToBuy, unit
                }))
        };
        onSaveAndGeneratePdf(newRequest);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingRequest ? "Editar Requerimiento de Compras" : "Nuevo Requerimiento de Compras"} size="4xl">
            <div className="space-y-4">
                 <div className="max-w-md mb-6">
                    <label htmlFor="pr-po-select" className="block text-sm font-medium">1. Seleccionar Orden de Producción</label>
                    <select id="pr-po-select" value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)} className="mt-1 block w-full input" disabled={!!editingRequest}>
                        <option value="">Seleccione una OP...</option>
                        {productionOrders.map(order => (
                            <option key={order.id} value={order.id} disabled={!materialExplosions.some(me => me.productionOrderId === order.id)}>
                                {order.id} - {order.productName} {!materialExplosions.some(me => me.productionOrderId === order.id) && '(Sin explosión)'}
                            </option>
                        ))}
                    </select>
                </div>

                {calculatedItems.length > 0 ? (
                    <div>
                        <h3 className="text-lg font-semibold">2. Verificar y Ajustar Cantidades a Comprar</h3>
                        <Table headers={['Material', 'Requerido', 'En Inventario', 'Saldo a Comprar']}>
                            {calculatedItems.map(item => (
                                <tr key={item.materialId}>
                                    <td className="px-4 py-2">{item.materialName} ({item.materialCode})</td>
                                    <td className="px-4 py-2">{item.requiredQuantity} {item.unit}</td>
                                    <td className="px-4 py-2">{item.stock} {item.unit}</td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number"
                                            value={item.quantityToBuy}
                                            onChange={e => handleQuantityChange(item.materialId, e.target.value)}
                                            className="w-24 input"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    </div>
                ) : selectedOrderId && (
                     <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-yellow-700 dark:text-yellow-300">No se encontró una explosión de materiales para la OP seleccionada.</p>
                    </div>
                )}
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} disabled={calculatedItems.length === 0}>
                    {editingRequest ? 'Actualizar y Generar PDF' : 'Guardar y Generar PDF'}
                </Button>
            </div>
        </Modal>
    );
};

const PurchaseRequestTab: React.FC<{
    purchaseRequests: PurchaseRequest[];
    productionOrders: ProductionOrder[];
    materialExplosions: MaterialExplosion[];
    onSave: (request: PurchaseRequest) => void;
    onDelete: (requestId: string) => void;
    generatePDF: (request: PurchaseRequest) => void;
}> = ({ purchaseRequests, productionOrders, materialExplosions, onSave, onDelete, generatePDF }) => {
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null);
    const [viewingRequest, setViewingRequest] = useState<PurchaseRequest | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRequests = useMemo(() => purchaseRequests.filter(req =>
        req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.productionOrderId.toLowerCase().includes(searchTerm.toLowerCase())
    ), [purchaseRequests, searchTerm]);

    const handleSaveAndGenerate = (request: PurchaseRequest) => {
        onSave(request);
        if (!editingRequest) { // Only generate PDF on create, not on edit, for simplicity
            generatePDF(request);
        }
    };
    
    const handleAddNew = () => {
        setEditingRequest(null);
        setFormModalOpen(true);
    };

    const handleEdit = (request: PurchaseRequest) => {
        setEditingRequest(request);
        setFormModalOpen(true);
    };
    
    const handleView = (request: PurchaseRequest) => {
        setViewingRequest(request);
        setViewModalOpen(true);
    };
    
    const handleDelete = (requestId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar este requerimiento de compra?')) {
            onDelete(requestId);
        }
    };

    return (
        <div>
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                 <div className="relative">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3"><svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
                    <input type="text" placeholder="Buscar por # RC o # OP..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 dark:text-white" />
                </div>
                <Button onClick={handleAddNew}>+ Nuevo Requerimiento</Button>
            </div>
            <Card>
                <Table headers={['# Requerimiento', 'OP Vinculada', 'Fecha Creación', 'Acciones']}>
                    {filteredRequests.map(req => (
                        <tr key={req.id}>
                            <td className="px-6 py-4 font-medium">{req.id}</td>
                            <td className="px-6 py-4">{req.productionOrderId}</td>
                            <td className="px-6 py-4">{req.creationDate}</td>
                            <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => handleView(req)}>Ver</Button>
                                <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => handleEdit(req)}>Editar</Button>
                                <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => generatePDF(req)}>PDF</Button>
                                <Button variant="danger" className="text-xs px-2 py-1" onClick={() => handleDelete(req.id)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
            <PurchaseRequestFormModal
                isOpen={isFormModalOpen}
                onClose={() => setFormModalOpen(false)}
                onSaveAndGeneratePdf={handleSaveAndGenerate}
                productionOrders={productionOrders}
                materialExplosions={materialExplosions}
                editingRequest={editingRequest}
            />
            <PurchaseRequestViewModal
                isOpen={isViewModalOpen}
                onClose={() => setViewModalOpen(false)}
                request={viewingRequest}
            />
        </div>
    );
};

const PlanningModule: React.FC<PlanningModuleProps> = ({ companyInfo }) => {
    const [products, setProducts] = useState<Product[]>(initialMockProducts);
    const [orders, setOrders] = useState<ProductionOrder[]>(initialMockOrders);
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(initialMockServiceOrders);
    const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>(initialMockCustomerOrders);
    const [materialExplosions, setMaterialExplosions] = useState<MaterialExplosion[]>(initialMockExplosions);
    const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null); // For TechSheetEditor
    
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);

    const [isSelectProductModalOpen, setSelectProductModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const TABS = [
        { id: 'products', label: 'Productos' },
        { id: 'tech_sheets', label: 'Fichas Técnicas' },
        { id: 'customer_orders', label: 'Pedidos' },
        { id: 'pos', label: 'Órdenes de Producción (OP)' }, 
        { id: 'sos', label: 'Órdenes de Servicio'},
        { id: 'material_explosion', label: 'Explosión de Materiales' },
        { id: 'purchase_request', label: 'Requerimiento de compras' }
    ];

    const handleOpenProductModalForEdit = (product: Product) => {
        setProductToEdit(product);
        setIsProductModalOpen(true);
    };

    const handleOpenProductModalForNew = () => {
        setProductToEdit(null);
        setIsProductModalOpen(true);
    };

    const handleDeleteProduct = (productId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
            setProducts(prev => prev.filter(p => p.id !== productId));
        }
    };

    const handleSaveProduct = (productData: any) => {
        if (productToEdit) {
            // Editing
            setProducts(prev => prev.map(p => 
                p.id === productToEdit.id 
                ? { ...p, ...productData, id: productToEdit.id, imageUrl: productData.imageUrl || p.imageUrl } 
                : p
            ));
        } else {
            // Creating
            const newProduct: Product = {
                ...productData,
                id: `prod-${Date.now()}`,
                imageUrl: productData.imageUrl || `https://picsum.photos/seed/${Date.now()}/100/100`
            };
            setProducts(prev => [newProduct, ...prev]);
        }
        setIsProductModalOpen(false);
        setProductToEdit(null);
    };


    const handleSaveTechSheet = (techSheet: TechSheet) => {
        setProducts(prev => prev.map(p => 
            p.id === techSheet.productId ? { ...p, techSheet } : p
        ));
        setEditingProduct(null);
    };

    const handleDeleteTechSheet = (productId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta ficha técnica? El producto no será eliminado.')) {
            setProducts(prev => prev.map(p => {
                if (p.id === productId) {
                    const { techSheet, ...rest } = p; // Remove techSheet property
                    return rest as Product;
                }
                return p;
            }));
        }
    };
    
    const handleProductSelectForNewTechSheet = (product: Product) => {
        setEditingProduct(product); // This will open the TechSheetEditor
    };

    const handleSaveOrder = (orderToSave: ProductionOrder) => {
        const exists = orders.some(o => o.id === orderToSave.id);
        if (exists) {
            setOrders(orders.map(o => o.id === orderToSave.id ? orderToSave : o));
        } else {
            setOrders([orderToSave, ...orders]);
        }
    };

    const handleDeleteOrder = (orderId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta orden de producción?')) {
            setOrders(orders.filter(o => o.id !== orderId));
        }
    };

    const handleSaveServiceOrder = (orderToSave: ServiceOrder) => {
         const exists = serviceOrders.some(o => o.id === orderToSave.id);
        if (exists) {
            setServiceOrders(serviceOrders.map(o => o.id === orderToSave.id ? orderToSave : o));
        } else {
            setServiceOrders([orderToSave, ...serviceOrders]);
        }
    };

    const handleDeleteServiceOrder = (orderId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta orden de servicio?')) {
            setServiceOrders(serviceOrders.filter(o => o.id !== orderId));
        }
    };

    const handleSaveCustomerOrder = (orderToSave: CustomerOrder) => {
        const exists = customerOrders.some(o => o.id === orderToSave.id);
        if (exists) {
            setCustomerOrders(customerOrders.map(o => o.id === orderToSave.id ? orderToSave : o));
        } else {
            setCustomerOrders([orderToSave, ...customerOrders]);
        }
    };

    const handleDeleteCustomerOrder = (orderId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar este pedido?')) {
            setCustomerOrders(customerOrders.filter(o => o.id !== orderId));
        }
    };

    const handleSaveMaterialExplosion = (explosionToSave: MaterialExplosion) => {
        setMaterialExplosions([explosionToSave, ...materialExplosions]);
    };

    const handleDeleteMaterialExplosion = (explosionId: string) => {
         if (window.confirm('¿Está seguro de que desea eliminar este cálculo de explosión de materiales?')) {
            setMaterialExplosions(materialExplosions.filter(e => e.id !== explosionId));
        }
    };
    
    const handleSavePurchaseRequest = (request: PurchaseRequest) => {
        setPurchaseRequests(prev => {
            const index = prev.findIndex(r => r.id === request.id);
            if (index > -1) {
                const newRequests = [...prev];
                newRequests[index] = request;
                return newRequests;
            }
            return [request, ...prev];
        });
    };
    
    const handleDeletePurchaseRequest = (requestId: string) => {
        setPurchaseRequests(prev => prev.filter(r => r.id !== requestId));
    };

    const generatePdfHeader = (doc: any, title: string) => {
        if (companyInfo.logoUrl) {
            try {
                // Note: jsPDF requires image data, not just a URL for client-side generation without CORS issues.
                // This is a simplified example. A real app might need to fetch and convert the image to a data URI.
                // For demonstration, we'll assume the URL is usable or will be replaced by a data URI.
                doc.addImage(companyInfo.logoUrl, 'PNG', 14, 15, 30, 15);
            } catch (e) {
                console.error("Error adding logo to PDF:", e);
            }
        }

        doc.setFontSize(20);
        doc.text(companyInfo.name, 105, 22, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`NIT: ${companyInfo.nit}`, 105, 28, { align: 'center' });
        
        doc.setFontSize(16);
        doc.text(title, 200, 22, { align: 'right' });
    };

    const generatePurchaseRequestPDF = (request: PurchaseRequest) => {
        if (!window.jspdf) {
            alert("PDF generation library is not loaded.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        generatePdfHeader(doc, "Requerimiento de Compra");
        
        doc.setFontSize(12);
        doc.text(`# ${request.id}`, 200, 28, {align: 'right'});
        
        doc.setFontSize(10);
        doc.text(`Fecha: ${request.creationDate}`, 200, 34, { align: 'right' });
        doc.text(`Orden de Producción: ${request.productionOrderId}`, 200, 38, { align: 'right' });

        const tableColumn = ["Código", "Material", "Proveedor", "Cantidad a Comprar", "Unidad"];
        const tableRows: any[][] = request.items.map(item => [
            item.materialCode, item.materialName, item.provider, item.quantityToBuy.toString(), item.unit
        ]);

        (doc as any).autoTable({
            head: [tableColumn], body: tableRows, startY: 50, theme: 'grid', headStyles: { fillColor: [15, 23, 42] }
        });

        doc.save(`Req_Compra_${request.id}.pdf`);
    };

    const generateServiceOrderPDF = (serviceOrder: ServiceOrder) => {
        const product = products.find(p => p.id === serviceOrder.productId);
        const provider = mockServiceProviders.find(p => p.id === serviceOrder.providerId);
        
        if (!window.jspdf) return alert("La librería de PDF no está cargada.");
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
    
        generatePdfHeader(doc, "Orden de Servicio");
        doc.setFontSize(12);
        doc.text(`# ${serviceOrder.id}`, 200, 28, { align: 'right' });
    
        doc.setLineWidth(0.5);
        doc.line(14, 40, 200, 40);
    
        doc.setFontSize(12);
        doc.text("Datos del Proveedor", 14, 48);
        doc.setFontSize(10);
        doc.text(`Taller: ${provider?.name || 'N/A'}`, 14, 54);
        doc.text(`Especialidad: ${provider?.specialty || 'N/A'}`, 14, 58);
    
        doc.text("Datos de la Orden", 110, 48);
        doc.text(`Fecha de Creación: ${serviceOrder.creationDate}`, 110, 54);
        doc.text(`OP Vinculada: ${serviceOrder.productionOrderId}`, 110, 58);
        
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

    const generateTechSheetPDF = (product: Product) => {
        const techSheet = product.techSheet;
        if (!techSheet) return alert("Este producto no tiene una ficha técnica para generar.");
        if (!window.jspdf) return alert("La librería de PDF no está cargada.");
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let startY = 22;

        generatePdfHeader(doc, "Ficha Técnica de Producto");
        
        startY += 12;
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 200, startY, { align: 'right' });

        startY += 10;
        doc.setLineWidth(0.5);
        doc.line(14, startY, 200, startY);
        startY += 8;
        doc.setFontSize(12);
        doc.text(`Producto: ${product.name}`, 14, startY);
        doc.text(`Referencia: ${product.reference}`, 110, startY);
        startY += 6;
        doc.setFontSize(10);
        doc.text(`Cliente: ${product.client}`, 14, startY);
        doc.text(`Versión Ficha: ${techSheet.version}`, 110, startY);
        startY += 10;

        const drawSection = (title: string, content: () => void) => {
            if (startY > 250) { doc.addPage(); startY = 20; }
            doc.setFontSize(14); doc.setFont(undefined, 'bold');
            doc.text(title, 14, startY);
            doc.setFont(undefined, 'normal');
            startY += 8;
            content();
            startY += 10;
        };

        drawSection("Materiales", () => {
            if (techSheet.materials.length > 0) {
                (doc as any).autoTable({ startY, head: [['Nombre', 'Consumo', 'Unidad', 'Proveedor']], body: techSheet.materials.map(mat => [mat.name, mat.consumptionPerUnit, mat.unit, mat.provider]), theme: 'grid', headStyles: { fillColor: [15, 23, 42] } });
                startY = (doc as any).lastAutoTable.finalY;
            } else { doc.text("N/A", 14, startY); startY += 6; }
        });
        
        drawSection("Proceso", () => {
             if (techSheet.processes.length > 0) {
                techSheet.processes.forEach(proc => {
                    if (startY > 260) { doc.addPage(); startY = 20; }
                    doc.setFontSize(12); doc.setFont(undefined, 'bold');
                    doc.text(proc.name, 14, startY); startY += 6;
                    proc.subProcesses.forEach(sub => {
                        if (startY > 260) { doc.addPage(); startY = 20; }
                        doc.setFontSize(10); doc.setFont(undefined, 'bold');
                        doc.text(`- ${sub.name}`, 20, startY); startY += 6;
                        if (sub.operations.length > 0) {
                             (doc as any).autoTable({
                                startY, margin: { left: 25 }, head: [['Operación', 'Máquina', 'Descripción']], body: sub.operations.map(op => [op.name, op.machine, op.description]),
                                theme: 'grid', headStyles: { fillColor: [71, 85, 105], fontSize: 8 }, bodyStyles: { fontSize: 8 }
                            });
                            startY = (doc as any).lastAutoTable.finalY + 4;
                        }
                    });
                });
            } else { doc.text("N/A", 14, startY); startY += 6; }
        });

        doc.save(`Ficha_Tecnica_${product.reference}.pdf`);
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Tabs tabs={TABS}>
                {(activeTab) => (
                    <div>
                        {activeTab === 'products' && 
                            <ProductTab 
                                products={filteredProducts} 
                                onAddNew={handleOpenProductModalForNew}
                                onEdit={handleOpenProductModalForEdit}
                                onDelete={handleDeleteProduct}
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                            />
                        }
                        {activeTab === 'tech_sheets' &&
                            <TechSheetsTab 
                                products={products}
                                onEditTechSheet={setEditingProduct}
                                onCreateNew={() => setSelectProductModalOpen(true)}
                                onDeleteTechSheet={handleDeleteTechSheet}
                                onGeneratePdf={generateTechSheetPDF}
                            />
                        }
                        {activeTab === 'customer_orders' &&
                            <CustomerOrdersTab 
                                orders={customerOrders}
                                onSave={handleSaveCustomerOrder}
                                onDelete={handleDeleteCustomerOrder}
                                customers={mockCustomers}
                                products={products}
                            />
                        }
                        {activeTab === 'pos' && 
                            <ProductionOrdersTab 
                                orders={orders}
                                products={products}
                                customerOrders={customerOrders}
                                onSave={handleSaveOrder}
                                onDelete={handleDeleteOrder}
                            />
                        }
                        {activeTab === 'sos' &&
                            <ServiceOrdersTab 
                                serviceOrders={serviceOrders}
                                productionOrders={orders}
                                products={products}
                                processes={mockProcesses}
                                onSave={handleSaveServiceOrder}
                                onDelete={handleDeleteServiceOrder}
                                onGeneratePdf={generateServiceOrderPDF}
                            />
                        }
                        {activeTab === 'material_explosion' && 
                            <MaterialExplosionTab 
                                explosions={materialExplosions}
                                productionOrders={orders} 
                                products={products} 
                                onSave={handleSaveMaterialExplosion}
                                onDelete={handleDeleteMaterialExplosion}
                            />
                        }
                        {activeTab === 'purchase_request' && 
                           <PurchaseRequestTab
                                purchaseRequests={purchaseRequests}
                                productionOrders={orders}
                                materialExplosions={materialExplosions}
                                onSave={handleSavePurchaseRequest}
                                onDelete={handleDeletePurchaseRequest}
                                generatePDF={generatePurchaseRequestPDF}
                           />
                        }
                    </div>
                )}
            </Tabs>
            <TechSheetEditor
                product={editingProduct}
                processes={mockProcesses}
                isOpen={!!editingProduct}
                onClose={() => setEditingProduct(null)}
                onSave={handleSaveTechSheet}
            />
            <ProductFormModal 
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSave={handleSaveProduct}
                editingProduct={productToEdit}
            />
            <SelectProductForTechSheetModal
                isOpen={isSelectProductModalOpen}
                onClose={() => setSelectProductModalOpen(false)}
                products={products}
                onSelect={handleProductSelectForNewTechSheet}
            />
        </>
    );
};

export default PlanningModule;