
import React, { useState, useEffect, useMemo } from 'react';
import { ModuleType, CompanyInfo, SystemUser } from './types';
import * as Icons from './components/Icons';
import Dashboard from './modules/Dashboard';
import PlanningModule from './modules/PlanningModule';
import EngineeringModule from './modules/EngineeringModule';
import SchedulingModule from './modules/SchedulingModule';
import PersonnelModule from './modules/PersonnelModule';
import MaintenanceModule from './modules/MaintenanceModule';
import WorkshopsModule from './modules/WorkshopsModule';
import InventoryModule from './modules/InventoryModule';
import CostsModule from './modules/CostsModule';
import ProductionControlModule from './modules/ProductionControlModule';
import CompanyDataModule from './modules/CompanyDataModule';
import UsersModule from './modules/UsersModule';
import LoginModule from './modules/LoginModule';
import { Modal, Button, FileInput } from './components/Common';

type Theme = 'light' | 'dark';

const MODULE_IDS: ModuleType[] = ['dashboard', 'users', 'planning', 'scheduling', 'engineering', 'costs', 'inventory', 'production', 'workshops', 'maintenance', 'personnel', 'company'];

const initialUsers: SystemUser[] = [
    {
        id: 'super-admin',
        name: 'Super Administrador',
        email: 'comercial.integratextil@gmail.com',
        password: 'Eh79924859',
        avatarUrl: 'https://i.pravatar.cc/150?u=super-admin',
        role: 'SuperAdmin',
        status: 'Activo',
        permissions: MODULE_IDS.map(id => ({ moduleId: id, access: 'edit' }))
    }
];

const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>('light');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>(initialUsers);
    const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);

    const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
        logoUrl: 'https://i.imgur.com/8rqi2zM.png',
        name: 'IntegraTextil SAS',
        nit: '900.123.456-7',
        address: 'Calle Falsa 123, Oficina 404',
        cityCountry: 'Bogotá, Colombia',
        phone: '+57 300 123 4567',
        email: 'contacto@integratextil.com',
        website: 'www.integratextil.com',
    });

    const baseModuleConfig: { id: ModuleType; label: string; icon: React.FC<{ className?: string }>; component: React.ReactNode; }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: Icons.DashboardIcon, component: <Dashboard /> },
        { id: 'planning', label: 'Planificación', icon: Icons.PlanningIcon, component: <PlanningModule companyInfo={companyInfo} /> },
        { id: 'scheduling', label: 'Programación', icon: Icons.SchedulingIcon, component: <SchedulingModule /> },
        { id: 'production', label: 'Producción', icon: Icons.ProductionIcon, component: <ProductionControlModule /> },
        { id: 'engineering', label: 'Ingeniería', icon: Icons.EngineeringIcon, component: <EngineeringModule /> },
        { id: 'inventory', label: 'Inventario', icon: Icons.InventoryIcon, component: <InventoryModule companyInfo={companyInfo}/> },
        { id: 'workshops', label: 'Talleres', icon: Icons.ExternalLinkIcon, component: <WorkshopsModule companyInfo={companyInfo} /> },
        { id: 'costs', label: 'Costos', icon: Icons.CostsIcon, component: <CostsModule companyInfo={companyInfo}/> },
        { id: 'maintenance', label: 'Mant.', icon: Icons.EngineeringIcon, component: <MaintenanceModule /> },
        { id: 'personnel', label: 'Personal', icon: Icons.UsersIcon, component: <PersonnelModule /> },
        { id: 'users', label: 'Usuarios', icon: Icons.UsersIcon, component: currentUser ? <UsersModule users={systemUsers} setUsers={setSystemUsers} currentUser={currentUser} /> : null },
        { id: 'company', label: 'Empresa', icon: Icons.DashboardIcon, component: currentUser ? <CompanyDataModule companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} currentUser={{ name: currentUser.name }} /> : null },
    ];

    const visibleModules = useMemo(() => {
        if (!currentUser) return [];
        return baseModuleConfig.filter(config => {
            const permission = currentUser.permissions.find(p => p.moduleId === config.id);
            return permission && permission.access !== 'blocked';
        });
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            const currentPerm = currentUser.permissions.find(p => p.moduleId === activeModule);
            if (!currentPerm || currentPerm.access === 'blocked') {
                const firstAllowed = currentUser.permissions.find(p => p.access !== 'blocked');
                if (firstAllowed) {
                    setActiveModule(firstAllowed.moduleId);
                }
            }
        }
    }, [currentUser, activeModule]);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const handleLogin = (user: SystemUser) => {
        setCurrentUser(user);
        setIsAuthenticated(true);
        const firstAllowed = user.permissions.find(p => p.access !== 'blocked');
        setActiveModule(firstAllowed ? firstAllowed.moduleId : 'dashboard');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
    };

    const handleSaveProfile = (updatedUserPartial: any) => {
        if (currentUser) {
            const updatedUser = { ...currentUser, ...updatedUserPartial };
            setSystemUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
            setCurrentUser(updatedUser);
        }
    };

    if (!isAuthenticated || !currentUser) {
        return <LoginModule users={systemUsers} onLogin={handleLogin} />;
    }

    const currentModuleConfig = visibleModules.find(m => m.id === activeModule) || visibleModules[0];

    return (
        <div className="flex flex-col h-screen bg-corp-bg dark:bg-dark-primary overflow-hidden font-sans">
            {/* Main Header */}
            <header className="bg-white dark:bg-dark-secondary shadow-sm z-30 relative">
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        {/* Logo Section */}
                        <div className="flex items-center">
                            <Icons.Logo className="h-10 w-auto mr-8" />
                        </div>

                        {/* Desktop Top Navigation - Horizontal Scrollable */}
                        <div className="hidden xl:flex flex-1 overflow-x-auto items-center space-x-1 scrollbar-hide h-full">
                            {visibleModules.map(mod => {
                                const isActive = activeModule === mod.id;
                                return (
                                    <button
                                        key={mod.id}
                                        onClick={() => setActiveModule(mod.id)}
                                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                                            isActive 
                                                ? 'text-corp-blue bg-corp-soft-blue dark:bg-dark-accent dark:text-blue-400' 
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-dark-accent/50'
                                        }`}
                                    >
                                        <mod.icon className={`h-4 w-4 mr-2 ${isActive ? 'text-corp-blue dark:text-blue-400' : 'text-gray-400'}`} />
                                        {mod.label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center space-x-4 pl-4 border-l border-gray-200 dark:border-gray-700 ml-4">
                            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-accent transition-colors">
                                {theme === 'light' ? <Icons.MoonIcon className="h-5 w-5" /> : <Icons.SunIcon className="h-5 w-5" />}
                            </button>
                            
                            <div className="relative group">
                                <button className="flex items-center space-x-3 focus:outline-none">
                                    <div className="text-right hidden md:block">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{currentUser.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.role}</p>
                                    </div>
                                    <img src={currentUser.avatarUrl} alt="User" className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                </button>
                                {/* Dropdown Profile */}
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-secondary rounded-xl shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right border border-gray-100 dark:border-gray-700">
                                    <button onClick={() => setProfileModalOpen(true)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-accent">Perfil</button>
                                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Cerrar Sesión</button>
                                </div>
                            </div>
                            
                            {/* Mobile Menu Button */}
                            <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="xl:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                                <Icons.MenuIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile/Tablet Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="xl:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4">
                            {visibleModules.map(mod => (
                                <button
                                    key={mod.id}
                                    onClick={() => { setActiveModule(mod.id); setMobileMenuOpen(false); }}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl text-center transition-all ${
                                        activeModule === mod.id 
                                        ? 'bg-corp-soft-blue text-corp-blue dark:bg-dark-accent dark:text-white shadow-inner' 
                                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400'
                                    }`}
                                >
                                    <mod.icon className="h-6 w-6 mb-2" />
                                    <span className="text-xs font-medium">{mod.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6 md:p-8">
                    <div className="max-w-[1800px] mx-auto">
                        {/* Breadcrumb / Header */}
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-corp-dark dark:text-white">{currentModuleConfig?.label}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión integral del proceso</p>
                            </div>
                            <div className="hidden md:flex items-center text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                Sistema Operativo
                            </div>
                        </div>

                        <div className="animate-fade-in">
                            {currentModuleConfig?.component}
                        </div>
                    </div>
                </div>
            </main>

            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                user={currentUser}
                onSave={handleSaveProfile}
            />
        </div>
    );
};

const UserProfileModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: SystemUser;
    onSave: (user: Partial<SystemUser>) => void;
}> = ({ isOpen, onClose, user, onSave }) => {
    const [formData, setFormData] = useState<Partial<SystemUser>>({ name: user.name, email: user.email, avatarUrl: user.avatarUrl });

    useEffect(() => {
        if (isOpen) {
            setFormData({ name: user.name, email: user.email, avatarUrl: user.avatarUrl });
        }
    }, [isOpen, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil de Usuario">
            <div className="space-y-6">
                <div className="flex justify-center pb-4">
                     <FileInput
                        label=""
                        previewUrl={formData.avatarUrl}
                        onFileChange={() => {}}
                        onUrlChange={(url) => setFormData(p => ({ ...p, avatarUrl: url || p.avatarUrl }))}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input"
                        />
                    </div>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <p className="text-sm text-gray-500">Rol de Sistema</p>
                    <span className="font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs uppercase tracking-wide">{user.role}</span>
                </div>
            </div>
            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Cambios</Button>
            </div>
        </Modal>
    );
};

export default App;
