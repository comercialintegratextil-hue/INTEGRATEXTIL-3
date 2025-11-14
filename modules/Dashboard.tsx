import React, { useState, useEffect } from 'react';
import { Card } from '../components/Common';
import { KPI, ProductionOrder } from '../types';
import { UpArrowIcon, DownArrowIcon, ProductionIcon, SchedulingIcon, PlanningIcon, CostsIcon, ExternalLinkIcon } from '../components/Icons';

// Fix: Declare Recharts on the window object to fix TypeScript error.
declare global {
  interface Window {
    Recharts: any;
  }
}

const kpis: KPI[] = [
  { title: 'OP Activas', value: '72', change: '+5.4%', changeType: 'increase', icon: ProductionIcon },
  { title: 'Eficiencia General', value: '87%', change: '+1.2%', changeType: 'increase', icon: SchedulingIcon },
  { title: 'Entregas a Tiempo', value: '96%', change: '-0.5%', changeType: 'decrease', icon: PlanningIcon },
  { title: 'Costo/Unidad Promedio', value: '$12.45', change: '-2.1%', changeType: 'decrease', icon: CostsIcon },
];

const efficiencyData = [
    { name: 'Sem 1', efficiency: 82 }, { name: 'Sem 2', efficiency: 85 },
    { name: 'Sem 3', efficiency: 83 }, { name: 'Sem 4', efficiency: 88 },
    { name: 'Sem 5', efficiency: 87 }, { name: 'Sem 6', efficiency: 91 },
];

const productionData = [
    { name: 'Lun', 'OP-101': 400, 'OP-102': 240 }, { name: 'Mar', 'OP-101': 300, 'OP-102': 139 },
    { name: 'Mié', 'OP-101': 200, 'OP-102': 980 }, { name: 'Jue', 'OP-101': 278, 'OP-102': 390 },
    { name: 'Vie', 'OP-101': 189, 'OP-102': 480 },
];

const recentOrders: ProductionOrder[] = [
    { id: 'OP-125', productId: 'prod-001', productName: 'Camisa Oxford', reference: 'C-OX-01', client: 'Zara', status: 'In Progress', sizeCurve: [], totalQuantity: 350, creationDate: '2024-07-19', startDate: '2024-07-20', endDate: '2024-07-28', materialsAvailable: true },
    { id: 'OP-126', productId: 'prod-002', productName: 'Pantalón Chino', reference: 'P-CH-03', client: 'H&M', status: 'Pending', sizeCurve: [], totalQuantity: 600, creationDate: '2024-07-20', startDate: '2024-07-22', endDate: '2024-08-01', materialsAvailable: true },
    { id: 'OP-123', productId: 'prod-003', productName: 'Blusa Lino', reference: 'B-LI-05', client: 'Mango', status: 'Completed', sizeCurve: [], totalQuantity: 200, creationDate: '2024-07-14', startDate: '2024-07-15', endDate: '2024-07-21', materialsAvailable: true },
    { id: 'OP-124', productId: 'prod-002', productName: 'Jean Slim Fit', reference: 'J-SF-02', client: 'H&M', status: 'Delayed', sizeCurve: [], totalQuantity: 450, creationDate: '2024-07-17', startDate: '2024-07-18', endDate: '2024-07-25', materialsAvailable: false },
]

const KPICard: React.FC<{ kpi: KPI }> = ({ kpi }) => (
    <Card>
        <div className="flex items-center">
            <div className={`p-3 rounded-full mr-4 ${
                kpi.changeType === 'increase' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
            }`}>
                <kpi.icon className={`h-6 w-6 ${
                    kpi.changeType === 'increase' ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'
                }`}/>
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{kpi.value}</p>
            </div>
        </div>
        <div className="mt-4 flex items-center">
            <span className={`flex items-center text-sm font-medium ${kpi.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.changeType === 'increase' ? <UpArrowIcon className="h-4 w-4 mr-1"/> : <DownArrowIcon className="h-4 w-4 mr-1"/>}
                {kpi.change}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs mes anterior</span>
        </div>
    </Card>
);

const getStatusColor = (status: ProductionOrder['status']) => {
    switch (status) {
        case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'Delayed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
}

const Dashboard: React.FC = () => {
    const [chartsReady, setChartsReady] = useState(!!window.Recharts);

    useEffect(() => {
        if (chartsReady) return;
        
        const timer = setInterval(() => {
            if (window.Recharts) {
                setChartsReady(true);
                clearInterval(timer);
            }
        }, 100);

        return () => clearInterval(timer);
    }, [chartsReady]);

    const ChartsSection = () => {
        if (!chartsReady) {
            return (
                <Card className="lg:col-span-3">
                    <div className="flex justify-center items-center h-[300px] animate-pulse">
                        <p className="text-gray-500 dark:text-gray-400">Loading charts...</p>
                    </div>
                </Card>
            );
        }

        const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } = window.Recharts;
        
        return (
            <>
                <Card className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Eficiencia Semanal</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={efficiencyData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700"/>
                            <XAxis dataKey="name" className="text-xs text-gray-500 dark:text-gray-400"/>
                            <YAxis unit="%" className="text-xs text-gray-500 dark:text-gray-400"/>
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#000' }}/>
                            <Legend />
                            <Line type="monotone" dataKey="efficiency" name="Eficiencia" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Producción Diaria</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={productionData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700"/>
                            <XAxis dataKey="name" className="text-xs text-gray-500 dark:text-gray-400"/>
                            <YAxis className="text-xs text-gray-500 dark:text-gray-400"/>
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#000' }}/>
                            <Legend />
                            <Bar dataKey="OP-101" stackId="a" fill="#3B82F6" />
                            <Bar dataKey="OP-102" stackId="a" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </>
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map(kpi => <KPICard key={kpi.title} kpi={kpi} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartsSection />
            </div>
             <Card>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Órdenes de Producción Recientes</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                             <tr>
                                <th className="py-2 px-4 border-b dark:border-gray-700 text-left text-sm font-medium text-gray-500 dark:text-gray-400">OP</th>
                                <th className="py-2 px-4 border-b dark:border-gray-700 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Producto</th>
                                <th className="py-2 px-4 border-b dark:border-gray-700 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Estado</th>
                                <th className="py-2 px-4 border-b dark:border-gray-700 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Materiales</th>
                                <th className="py-2 px-4 border-b dark:border-gray-700 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Fecha Fin</th>
                                <th className="py-2 px-4 border-b dark:border-gray-700 text-left text-sm font-medium text-gray-500 dark:text-gray-400"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-dark-accent">
                                    <td className="py-2 px-4 border-b dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 font-medium">{order.id}</td>
                                    <td className="py-2 px-4 border-b dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">{order.productName} ({order.reference})</td>
                                    <td className="py-2 px-4 border-b dark:border-gray-700 text-sm">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4 border-b dark:border-gray-700 text-sm text-center">
                                        <span className={`h-3 w-3 rounded-full inline-block ${order.materialsAvailable ? 'bg-green-500' : 'bg-red-500'}`} title={order.materialsAvailable ? 'Disponibles' : 'Faltantes'}></span>
                                    </td>
                                    <td className="py-2 px-4 border-b dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">{order.endDate}</td>
                                    <td className="py-2 px-4 border-b dark:border-gray-700 text-sm">
                                        <button className="text-brand-blue hover:underline">Ver</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

export default Dashboard;