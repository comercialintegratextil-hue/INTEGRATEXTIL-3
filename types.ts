
import React from 'react';

export type ModuleType = 'dashboard' | 'users' | 'planning' | 'scheduling' | 'engineering' | 'costs' | 'inventory' | 'production' | 'workshops' | 'maintenance' | 'personnel' | 'company';

export type AccessLevel = 'blocked' | 'view' | 'edit';

export interface UserPermission {
    moduleId: ModuleType;
    access: AccessLevel;
}

export interface SystemUser {
    id: string;
    name: string;
    email: string;
    password?: string; // In a real app, this would be hashed/handled securely backend-side
    avatarUrl: string;
    role: 'SuperAdmin' | 'Admin' | 'User';
    permissions: UserPermission[];
    status: 'Activo' | 'Inactivo';
}

export interface KPI {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.FC<{ className?: string }>;
}

export interface SizeCurveItem {
    id: string;
    size: string;
    color: string;
    quantity: number;
}

export interface ProductionOrder {
    id: string;
    customerOrderId?: string;
    productId: string;
    productName: string;
    reference: string;
    client: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed' | 'Borrador' | 'Facturado' | 'Cancelado';
    sizeCurve: SizeCurveItem[];
    totalQuantity: number;
    creationDate: string;
    startDate?: string; // Existing field
    endDate?: string;
    clientCommitmentDate?: string; // New field
    materialsAvailable?: boolean;
    costCenterId?: string; // Added for Costs module
}

export interface TechSheetMaterial {
    id: string;
    code: string;
    name: string;
    unit: 'm' | 'un' | 'cono' | string;
    consumptionPerUnit: number;
    cost: number;
    provider: string;
    fabricType: string;
    colorCode: string;
}

export interface LogoSpec {
    id: string;
    location: string;
    imageUrl: string;
}

export interface DesignDetails {
    frontImageUrl?: string;
    backImageUrl?: string;
    generalDescription: string;
    hasEmbroidery: boolean;
    hasPrint: boolean;
    hasOther: boolean;
    otherDescription: string;
    logos: LogoSpec[];
}

export interface Measurement {
    id: string;
    name: string;
    sizes: { [size: string]: string };
}

export interface TechnicalSpecs {
    sizes: string[];
    measurements: Measurement[];
    thread: string;
    gauge: string;
    spi: string; // stitches per inch
    needleType: string;
}

export interface TechSheetOperation {
    id: string;
    name: string;
    machine: string;
    spi: string;
    needle: string;
    attachment: string;
    description: string;
}

export interface TechSheetSubProcess {
    id: string;
    name: string;
    operations: TechSheetOperation[];
}

export interface TechSheetProcess {
    id: string; // From ProcessDefinition
    name: string;
    subProcesses: TechSheetSubProcess[];
}

export interface PackagingStep {
    id: string;
    name: string;
    label: string;
    description: string;
    measurements: string;
    imageUrl: string;
}

// New Interfaces for Detailed Packaging
export interface FoldingSpecs {
    method: string;
    imageUrl?: string;
    foldedMeasurements: string;
    description: string;
}

export interface IndividualPackagingSpecs {
    usePolybag: boolean;
    bagType: 'Transparente' | 'Solapa Adhesiva' | 'Agujero Ventilación' | 'Advertencia Asfixia' | 'Biodegradable' | 'Otro';
    bagSize: string; // e.g., "30x40 cm"
    printInfo: string; // Logo, warning, etc.
    sizeStickerLocation: 'Afuera' | 'Adentro' | 'Ambos' | 'No Aplica';
    hangerOrSizer: string; // Description of hanger or sizer usage
}

export interface OuterPackagingSpecs {
    packingType: 'Solid Size/Solid Color' | 'Assorted (Mezcla)' | 'Otro';
    unitsPerBox: number;
    boxName: string; // e.g. "Caja Master A1"
    boxDimensions: { length: number; width: number; height: number };
    boxMarking: {
        labelType: string;
        labelContent: string;
    };
}

export interface DetailedPackagingSpecs {
    folding: FoldingSpecs;
    individual: IndividualPackagingSpecs;
    outer: OuterPackagingSpecs;
    specialRequirements: string;
}

export interface TechSheet {
    id: string;
    productId: string;
    version: number;
    status: 'Borrador' | 'Aprobado' | 'Rechazado';
    design: DesignDetails;
    materials: TechSheetMaterial[];
    specs: TechnicalSpecs;
    processes: TechSheetProcess[];
    packaging: PackagingStep[]; // Kept for legacy support
    detailedPackaging?: DetailedPackagingSpecs; // New structured field
}

export interface Product {
    id: string;
    name: string;
    reference: string;
    imageUrl?: string;
    client: string;
    collection: string;
    description?: string;
    gender?: 'Masculino' | 'Femenino' | 'Unisex';
    classification?: 'Camisa' | 'Pantalón' | 'Blusa' | 'Otro';
    techSheet?: TechSheet;
    standardTimePerUnit: number; // minutes
    operationIds?: string[];
}

export interface ServiceOrderItem extends SizeCurveItem {
    productionOrderQuantity: number;
}

export interface ServiceOrderMaterial {
    materialId: string;
    name: string;
    unit: string;
    theoreticalQuantity: number;
    actualQuantity?: number;
}

export interface ServiceOrder {
    id: string;
    productionOrderId: string;
    orderType: 'Externo' | 'Interno';
    productId: string;
    productName: string;
    providerId?: string;
    providerName?: string;
    processId?: string;
    workstationId?: string;
    status: 'Borrador' | 'Enviado' | 'En Progreso' | 'En Pausa' | 'Recibido' | 'Completado' | 'Cancelado';
    creationDate: string;
    totalQuantity: number;
    items: ServiceOrderItem[];
    materials: ServiceOrderMaterial[];
    unitPrice?: number;
    totalCost?: number;
}

export interface ServiceProvider {
    id: string;
    name: string;
    specialty: string;
}

export interface Customer {
    id: string;
    name: string;
}

export interface CustomerOrderItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface CustomerOrder {
    id: string;
    customerId: string;
    customerName: string;
    status: 'Borrador' | 'Confirmado' | 'Facturado' | 'Cancelado';
    creationDate: string;
    items: CustomerOrderItem[];
    subtotal: number;
    vat: number;
    total: number;
    observations: string;
}

export interface MaterialExplosionMaterial {
    materialId: string;
    materialCode: string;
    name: string;
    unit: string;
    provider: string;
    requiredQuantity: number;
}

export interface MaterialExplosion {
    id: string;
    productionOrderId: string;
    productName: string;
    totalQuantity: number;
    creationDate: string;
    materials: MaterialExplosionMaterial[];
}

export interface InventoryItem {
    materialId: string;
    stock: number;
}

export interface PurchaseRequestItem {
    materialId: string;
    materialCode: string;
    materialName: string;
    provider: string;
    quantityToBuy: number;
    unit: string;
}

export interface PurchaseRequest {
    id: string;
    productionOrderId: string;
    customerOrderId?: string;
    creationDate: string;
    items: PurchaseRequestItem[];
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export interface Break {
    id: string;
    name: string;
    durationMinutes: number;
}

export interface DailyShift {
    day: DayOfWeek;
    isWorkDay: boolean;
    startTime: string;
    endTime: string;
    breaks: Break[];
}

export interface Shift {
    id: string;
    name: string;
    weeklySchedule: DailyShift[];
}

export interface Workstation {
    id: string;
    name: string;
    weeklySchedule?: DailyShift[]; // Optional override
}

export interface ProcessDefinition {
    id: string;
    name: string;
    workstations: Workstation[];
}

export interface DelayEvent {
    id: string;
    date: string; // ISO string of when the delay was recorded
    hours: number;
    reason: string;
    reportedBy?: string;
}

export interface GanttTask {
    id: string;
    orderId: string;
    orderType: 'OP' | 'OS';
    productName: string;
    quantity: number;
    processId: string;
    workstationId: string;
    shiftId: string;
    efficiency: number;
    startDate: Date;
    endDate: Date;
    progress: number;
    status: 'On Track' | 'At Risk' | 'Delayed';
    processName: string;
    workstationName: string;
    shiftName: string;
    requiredHours: number;
    requiredShifts: number;
    // New fields for delay tracking
    originalEndDate?: Date;
    delayHours?: number;
    delayReason?: string;
    delayHistory?: DelayEvent[];
}

export interface KanbanTaskProgress {
    processId: string;
    processName: string;
    stationName: string;
    status: 'Terminado' | 'En Proceso' | 'Pendiente';
    progress: number;
}

export interface KanbanOrderProgress {
    productionOrderId: string;
    tasks: KanbanTaskProgress[];
}

export interface EngineeringOperation {
    id: string;
    name: string;
    code: string;
    description: string;
    process: string;
    machine: string;
    stitchesPerInch: string;
    needle: string;
    cycleTimes: number[];
    frequency: number;
    valuationFactor: number;
    supplementFactor: number;
    averageTime: number;
    standardTime: number;
    unitsPerHour: number;
}

export interface Employee {
    id: string;
    photoUrl?: string;
    employeeCode: string;
    fullName: string;
    idNumber: string;
    birthDate: string;
    age: number;
    phone: string;
    address: string;
    birthPlace: string;
    hireDate: string;
    serviceYears: number;
    serviceMonths: number;
    profession: string;
    specialty: string;
    position: string;
    assignedProcess: string;
    workstationId?: string;
    monthlySalary: number;
    bonusPercentage: number;
    status: 'Activo' | 'Inactivo';
}

export interface AttendanceRecord {
    id: string;
    employeeId: string;
    date: string;
    status: 'Asistió' | 'Inasistencia Parcial' | 'Inasistencia Total';
    checkIn?: string;
    checkOut?: string;
    workedHours: number;
    reason?: string;
    evidenceUrl?: string;
    observations?: string;
}

export interface ProductivityRecord {
    id: string;
    employeeId: string;
    date: string;
    productionOrder: string;
    operation: string;
    unitsCompleted: number;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    efficiency: number;
}

export interface PayrollRecord {
    id: string;
    employeeId: string;
    monthYear: string;
    daysWorked: number;
    baseSalary: number;
    transportSubsidy: number;
    fixedBonus: number;
    totalEarnings: number;
    deductions: number;
    totalPaid: number;
}

// --- Maintenance Module Types ---
export interface MaintenanceTechnician {
    id: string;
    photoUrl?: string;
    fullName: string;
    idNumber: string;
    specialty: 'Mecánica' | 'Eléctrica' | 'Electrónica' | 'Neumática' | 'General';
    phone: string;
    email: string;
    experience?: string;
    status: 'Activo' | 'Inactivo';
}

export interface Machine {
    id: string;
    photoUrl?: string;
    code: string; // MQ-01
    name: string;
    type: string;
    brand: string;
    model: string;
    serialNumber: string;
    purchaseDate: string;
    provider: string;
    acquisitionCost: number;
    responsibleTechnicianId?: string;
    currentLocation: string; // Estación X, Módulo Y, Bodega Z
    status: 'Operativa' | 'En mantenimiento' | 'Inactiva' | 'En bodega';
    technicalSheetUrl?: string; // PDF
}

export interface MachineUpdate {
    id: string; // NV-MQ-01
    machineId: string;
    reportedBy: string;
    reportDate: string; // ISO string with time
    description: string;
    evidenceUrl?: string;
    type: 'Operativa' | 'Mecánica' | 'Eléctrica' | 'Preventiva' | 'Correctiva';
    priority: 'Alta' | 'Media' | 'Baja';
    status: 'Abierta' | 'En proceso' | 'Cerrada';
    comments: string;
    associatedTicketId?: string;
}

export interface MaintenanceRecord {
    id: string; // MT-01
    machineIds: string[];
    type: 'Predictivo' | 'Preventivo' | 'Correctivo';
    scheduledDate: string;
    scheduledTime: string;
    assignedTechnicianId: string;
    plannedTasks: string;
    requiredSpares: string; // simple string for now
    evidenceUrl?: string;
    status: 'Programado' | 'En ejecución' | 'Finalizado' | 'Cancelado';
    totalDurationMinutes?: number;
    observations?: string;
}

export interface MaintenanceTicket {
    id: string; // TK-MQ-01
    machineId: string;
    openedBy: string;
    openDate: string; // ISO string
    closeDate?: string; // ISO string
    requestType: 'Correctivo' | 'Ajuste' | 'Emergencia';
    problemDescription: string;
    status: 'Abierto' | 'En revisión' | 'En reparación' | 'Cerrado';
    assignedTechnicianId?: string;
    technicianDiagnosis?: string;
    procedureApplied?: string;
    totalRepairTimeMinutes?: number;
    supervisorConfirmation?: boolean;
}

export interface MachineTraceability {
    id: string;
    machineId: string;
    currentLocation: string;
    responsible: string;
    moveDate: string; // ISO string
    machineStatus: 'Operativa' | 'Mantenimiento' | 'Inactiva' | 'En tránsito';
    reason: string;
    associatedProductionId?: string;
    associatedTicketId?: string;
}

// --- External Workshops Module Types ---
export interface ExternalWorkshop {
    id: string; // TL-01
    code: string;
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    serviceType: 'Confección' | 'Bordado' | 'Estampado' | 'Lavandería' | 'Otro';
    costPerUnit: number;
    dailyCapacity: number;
    businessDays: string;
    documentsUrl?: string[];
    status: 'Activo' | 'Inactivo';
}

export type CRMHistoryEventType = 'Llamada de seguimiento' | 'Visita técnica' | 'Novedad de producción' | 'Control de calidad' | 'Liberación de lote' | 'Aprobación de preproducción' | 'Entrega final';

export interface CRMHistoryEvent {
    id: string;
    date: string; // ISO String
    type: CRMHistoryEventType;
    responsible: string;
    description: string;
    evidenceUrl?: string;
    status: 'Pendiente' | 'En proceso' | 'Cerrada';
}

export interface WorkshopCRMTracking {
    id: string; // CRM-TL-01
    workshopId: string;
    productionOrderId: string;
    serviceOrderId?: string;
    productId: string;
    totalQuantity: number;
    startDate: string;
    estimatedDeliveryDate: string;
    generalStatus: 'En preproducción' | 'En producción' | 'En control de calidad' | 'Liberado' | 'Entregado';
    currentStage: 'Recepción de materiales' | 'Corte / Confección' | 'Lavandería / Estampado' | 'Terminados / Empaque' | 'Control de calidad final';
    history: CRMHistoryEvent[];
}

export interface QualityRelease {
    id: string;
    trackingId: string; // WorkshopCRMTracking ID
    inspectionDate: string;
    inspector: string;
    stage: 'Preproducción' | 'Producción' | 'Final';
    result: 'Aprobado' | 'Rechazado' | 'Reproceso';
    observations: string;
    evidenceUrl?: string;
    authorizedBy: string;
}

export interface WorkshopPerformance {
    id: string;
    workshopId: string;
    period: string; // "MM/YYYY"
    ordersCompleted: number;
    totalValue: number;
    onTimeDeliveryRate: number; // percentage
    qualityApprovalRate: number; // percentage
    score: number;
}

// --- Inventory Module Types ---
export interface InventoryProduct {
    id: string; // PRD-001
    code: string;
    name: string;
    family: 'Materia Prima' | 'Insumo' | 'Producto Terminado' | 'Repuesto' | 'Otro';
    unit: 'm' | 'un' | 'cono' | 'docena' | string;
    unitCost: number;
    costCenter: string;
    minStock: number;
    imageUrl?: string;
    status: 'Activo' | 'Inactivo';
    bom?: { productId: string; quantity: number }[]; // Bill of Materials
}

export interface Warehouse {
    id: string; // BOD-01
    code: string;
    name: string;
    area: string;
    location: string; // Pasillo, estante, nivel
}

export interface InventoryMovement {
    id: string;
    type: 'Entrada' | 'Salida' | 'Traslado';
    date: string; // ISO String
    productId: string;
    sourceWarehouseId?: string;
    destinationWarehouseId?: string;
    quantity: number;
    actualCost: number;
    supportDocument: string;
    observations: string;
}

export interface ProductAssembly {
    id: string;
    productionOrderId: string;
    consumedMaterials: { productId: string; name: string; quantity: number }[];
    finishedProduct: { productId: string; name: string; quantity: number };
    assemblyDate: string;
    destinationWarehouseId: string;
    sourceWarehouseId: string;
}

// --- Costs Module Types ---
export interface CostCenter {
    id: string; // CC-01
    code: string;
    name: string;
    type: 'Producción' | 'Administrativo' | 'Comercial' | 'Servicios' | 'Talleres Externos' | 'Otro';
    status: 'Activo' | 'Inactivo';
    responsible: string;
    description?: string;
}

export interface LaborCost {
    id: string;
    costCenterId: string;
    costPerMinute: number;
    effectiveDate: string; // "YYYY-MM-DD"
    status: 'Activo' | 'Inactivo';
}

export interface FixedCost {
    id: string;
    type: 'Arriendo' | 'Servicios Públicos' | 'Internet' | 'Vigilancia' | 'Otro';
    name: string;
    amount: number;
    costCenterId?: string; // Can be general
    recordDate: string; // "YYYY-MM"
    isRecurring: boolean;
}

export interface ProductionOrderCosting {
    id: string;
    calculationDate: string;
    productionOrderId: string;
    budgeted: {
        materials: number;
        labor: number;
        external: number;
        total: number;
    };
    real: {
        materials: number;
        labor: number;
        external: number;
        total: number;
    };
    variation: {
        total: number;
        percentage: number;
    };
}

// --- Production Control Module Types ---
export interface ProductionPause {
    id: string;
    reason: 'Almuerzo' | 'Falta de material' | 'Daño máquina' | 'Calidad' | 'Descanso' | 'Reunión' | 'Otro';
    description?: string;
    startTime: string; // ISO String
    endTime?: string; // ISO String
    durationMinutes?: number;
}

export interface ProductionQualityIssue {
    id: string;
    type: 'Corte' | 'Tela' | 'Moldería' | 'Manchas' | 'Hilos' | 'Agujas' | 'Tensión' | 'Otro';
    description: string;
    reportedBy: string;
    photoUrl?: string;
}

export interface ProductionControlSession {
    id: string;
    productionOrderId: string;
    serviceOrderId?: string;
    processId: string;
    workstationId: string;
    personnelIds: string[];
    machineIds: string[];
    startTime: string; // ISO String
    endTime?: string; // ISO String
    status: 'Activo' | 'Pausado' | 'Finalizado';
    totalUnits: number;
    producedUnits: { quantity: number; timestamp: string; size: string; color: string }[]; // Added size and color
    pauses: ProductionPause[];
    qualityIssues: ProductionQualityIssue[];
    samProcess: number;
    taskPerHour: number;
}

// --- Company Data Module ---
export interface CompanyInfo {
    logoUrl: string;
    name: string;
    nit: string;
    address: string;
    cityCountry: string;
    phone: string;
    email: string;
    website: string;
    lastUpdatedBy?: string;
    lastUpdatedAt?: string;
}
