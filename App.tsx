
import React, { useState, useEffect, useMemo } from 'react';
import { ModuleType, CompanyInfo, SystemUser, AccessLevel, UserPermission, ProcessDefinition } from './types';
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
import PlaceholderModule from './modules/PlaceholderModule';
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
    },
    {
        id: 'admin-erp',
        name: 'Administrador ERP',
        email: 'integratextilerp@gmail.com',
        password: '12345',
        avatarUrl: 'https://i.pravatar.cc/150?u=admin-erp',
        role: 'Admin',
        status: 'Activo',
        permissions: MODULE_IDS.map(id => ({ moduleId: id, access: 'edit' }))
    }
];

const initialProcesses: ProcessDefinition[] = [
    { id: 'proc-1', name: 'Corte', workstations: [{id: 'ws-1', name: 'MESA 1'}] },
    { id: 'proc-2', name: 'Confección', workstations: [{id: 'ws-2', name: 'MÓDULO 1'}, {id: 'ws-3', name: 'MÓDULO 2'}] },
    { id: 'proc-3', name: 'Bordado', workstations: [{id: 'ws-4', name: 'BORDADORA 1'}] },
    { id: 'proc-4', name: 'Terminación', workstations: [{id: 'ws-5', name: 'MESA LIMPIEZA'}] },
];

const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>('light');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>(initialUsers);
    const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);

    const [processes, setProcesses] = useState<ProcessDefinition[]>(initialProcesses);

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
        { id: 'users', label: 'Usuarios', icon: Icons.UsersIcon, component: currentUser ? <UsersModule users={systemUsers} setUsers={setSystemUsers} currentUser={currentUser} /> : null },
        { id: 'planning', label: 'Planificación', icon: Icons.PlanningIcon, component: <PlanningModule companyInfo={companyInfo} /> },
        { id: 'scheduling', label: 'Programación', icon: Icons.SchedulingIcon, component: <SchedulingModule processes={processes} onUpdateProcesses={setProcesses} /> },
        { id: 'engineering', label: 'Ingeniería', icon: Icons.EngineeringIcon, component: <EngineeringModule processes={processes} /> },
        { id: 'costs', label: 'Costos', icon: Icons.CostsIcon, component: <CostsModule companyInfo={companyInfo}/> },
        { id: 'inventory', label: 'Inventario', icon: Icons.InventoryIcon, component: <InventoryModule companyInfo={companyInfo}/> },
        { id: 'production', label: 'Control Producción', icon: Icons.ProductionIcon, component: <ProductionControlModule /> },
        { id: 'workshops', label: 'Talleres Externos', icon: Icons.ExternalLinkIcon, component: <WorkshopsModule companyInfo={companyInfo} /> },
        { id: 'maintenance', label: 'Gestion Mantenimiento', icon: Icons.EngineeringIcon, component: <MaintenanceModule /> },
        { id: 'personnel', label: 'Personal', icon: Icons.UsersIcon, component: <PersonnelModule /> },
        { id: 'company', label: 'Datos Empresa', icon: Icons.DashboardIcon, component: currentUser ? <CompanyDataModule companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} currentUser={{ name: currentUser.name }} /> : null },
    ];

    const visibleModules = useMemo(() => {
        if (!currentUser) return [];
        return baseModuleConfig.filter(config => {
            const permission = currentUser.permissions.find(p => p.moduleId === config.id);
            return permission && permission.access !== 'blocked';
        });
    }, [currentUser, baseModuleConfig]);

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
        <div className="flex h-screen bg-corp-bg dark:bg-dark-primary text-corp-dark dark:text-gray-100 font-sans">
            <Sidebar 
                activeModule={activeModule} 
                setActiveModule={setActiveModule} 
                isExpanded={isSidebarExpanded} 
                isMobileOpen={isMobileSidebarOpen}
                setMobileOpen={setMobileSidebarOpen}
                user={currentUser}
                onProfileClick={() => setProfileModalOpen(true)}
                moduleConfig={visibleModules}
                onLogout={handleLogout}
            />
            {isMobileSidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" onClick={() => setMobileSidebarOpen(false)}></div>}
            
            <div className="flex-1 flex flex-col overflow-hidden relative">
                 <Header 
                    activeModuleLabel={currentModuleConfig?.label || 'Inicio'} 
                    toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
                    toggleMobileSidebar={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
                    theme={theme} 
                    toggleTheme={toggleTheme} 
                    user={currentUser}
                 />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 scroll-smooth">
                    <div className="max-w-screen-2xl mx-auto">
                        {currentModuleConfig?.component}
                    </div>
                </main>
            </div>

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
            <div className="space-y-4">
                <FileInput
                    label="Imagen de Perfil"
                    previewUrl={formData.avatarUrl}
                    onFileChange={() => {}}
                    onUrlChange={(url) => setFormData(p => ({ ...p, avatarUrl: url || p.avatarUrl }))}
                />
                <div>
                    <label className="label">Nombre Completo</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="input"
                    />
                </div>
                <div>
                    <label className="label">Correo Electrónico</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input"
                    />
                </div>
                <div className="pt-2">
                    <p className="text-xs text-gray-500">Rol: <span className="font-bold bg-gray-100 px-2 py-1 rounded">{user.role}</span></p>
                </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Cambios</Button>
            </div>
        </Modal>
    );
};


const Sidebar: React.FC<{
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  isExpanded: boolean;
  isMobileOpen: boolean;
  setMobileOpen: (isOpen: boolean) => void;
  user: SystemUser;
  onProfileClick: () => void;
  moduleConfig: { id: ModuleType; label: string; icon: React.FC<{ className?: string }>; component: React.ReactNode; }[];
  onLogout: () => void;
}> = ({ activeModule, setActiveModule, isExpanded, isMobileOpen, setMobileOpen, user, onProfileClick, moduleConfig, onLogout }) => {
  
  const handleLinkClick = (module: ModuleType) => {
    setActiveModule(module);
    setMobileOpen(false);
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col bg-white dark:bg-dark-secondary border-r border-gray-100 dark:border-gray-700 transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${isExpanded ? 'w-72' : 'w-20'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Logo */}
      <div className={`flex items-center justify-center h-24 border-b border-gray-100 dark:border-gray-700 transition-all duration-300 ${isExpanded ? 'px-6' : 'px-2'}`}>
         {isExpanded ? (
            <Icons.Logo className="h-14 w-auto" />
         ) : (
             <div className="w-10 h-10 bg-corp-blue rounded-lg flex items-center justify-center shadow-lg">
                <Icons.EngineeringIcon className="w-6 h-6 text-white"/>
             </div>
         )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6 custom-scrollbar">
        {moduleConfig.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href="#"
            onClick={(e) => { e.preventDefault(); handleLinkClick(id as ModuleType); }}
            className={`flex items-center p-3.5 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden ${
              activeModule === id
                ? 'bg-corp-blue text-white shadow-md shadow-blue-200 dark:shadow-none'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-accent hover:text-corp-blue'
            } ${!isExpanded && 'justify-center'}`}
            title={!isExpanded ? label : ''}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${activeModule === id ? 'text-white' : 'text-gray-400 group-hover:text-corp-blue'}`} />
            <span className={`ml-4 transition-all duration-300 ease-in-out whitespace-nowrap ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'}`}>{label}</span>
          </a>
        ))}
      </nav>
      
      {/* User Profile Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-dark-secondary">
        <button onClick={onProfileClick} className={`w-full flex items-center p-2 rounded-xl hover:bg-white dark:hover:bg-dark-accent transition-all shadow-sm hover:shadow-md ${!isExpanded && 'justify-center'}`}>
            <img src={user.avatarUrl} alt="User" className="h-10 w-10 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm" />
            <div className={`ml-3 text-left transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                <p className="text-sm font-bold text-corp-dark dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.role}</p>
            </div>
        </button>
        <button onClick={onLogout} className={`mt-3 w-full flex items-center p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors ${!isExpanded ? 'justify-center' : ''}`}>
             <Icons.LogoutIcon className="h-5 w-5" />
             {isExpanded && <span className="ml-3 text-sm font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

const Header: React.FC<{
    activeModuleLabel: string;
    toggleSidebar: () => void;
    toggleMobileSidebar: () => void;
    theme: Theme;
    toggleTheme: () => void;
    user: SystemUser;
}> = ({ activeModuleLabel, toggleSidebar, toggleMobileSidebar, theme, toggleTheme, user }) => {
    return (
        <header className="bg-white dark:bg-dark-secondary h-20 px-8 flex justify-between items-center z-20 sticky top-0 border-b border-gray-100 dark:border-gray-700 shadow-sm backdrop-blur-md bg-opacity-90">
            <div className="flex items-center">
                 <button onClick={toggleMobileSidebar} className="text-gray-500 hover:text-corp-blue mr-4 md:hidden transition-colors">
                    <Icons.MenuIcon className="w-6 h-6" />
                </button>
                <button onClick={toggleSidebar} className="hidden md:block text-gray-400 hover:text-corp-blue mr-4 transition-colors p-2 rounded-lg hover:bg-gray-50">
                    <Icons.MenuIcon className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-corp-dark dark:text-white capitalize tracking-tight">{activeModuleLabel}</h1>
                    <p className="text-xs text-gray-400 font-medium">Bienvenido, {user.name.split(' ')[0]}</p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center px-4 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-800">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    <span className="text-xs font-bold text-green-700 dark:text-green-400">Sistema Operativo</span>
                </div>
                <button onClick={toggleTheme} className="text-gray-400 hover:text-corp-blue hover:bg-gray-50 dark:hover:bg-dark-accent p-2 rounded-full transition-all">
                    {theme === 'light' ? <Icons.MoonIcon className="h-6 w-6" /> : <Icons.SunIcon className="h-6 w-6" />}
                </button>
            </div>
        </header>
    );
};

export default App;
