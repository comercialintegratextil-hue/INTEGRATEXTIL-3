
import React, { useState, useEffect } from 'react';
import { ModuleType, CompanyInfo } from './types';
import * as Icons from './components/Icons';
import Dashboard from './modules/Dashboard';
import PlanningModule from './modules/PlanningModule';
import EngineeringModule from './modules/EngineeringModule';
import SchedulingModule from './modules/SchedulingModule';
import PersonnelModule from './modules/PersonnelModule';
import MaintenanceModule from './modules/MaintenanceModule';
import WorkshopsModule from './modules/WorkshopsModule';
import InventoryModule from './modules/InventoryModule';
// Fix: Changed import to named import as CostsModule does not have a default export.
import CostsModule from './modules/CostsModule';
import ProductionControlModule from './modules/ProductionControlModule';
import CompanyDataModule from './modules/CompanyDataModule';
import PlaceholderModule from './modules/PlaceholderModule';
import { Modal, Button, FileInput } from './components/Common';

type Theme = 'light' | 'dark';

interface User {
    name: string;
    email: string;
    avatarUrl: string;
}

const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>('light');
    const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User>({
        name: 'Admin User',
        email: 'admin@integratextil.com',
        avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    });
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

    const moduleConfig: { id: ModuleType; label: string; icon: React.FC<{ className?: string }>; component: React.ReactNode; }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: Icons.DashboardIcon, component: <Dashboard /> },
        { id: 'users', label: 'Usuarios', icon: Icons.UsersIcon, component: <PlaceholderModule title="Administración de Usuarios"/> },
        { id: 'planning', label: 'Planificación', icon: Icons.PlanningIcon, component: <PlanningModule companyInfo={companyInfo} /> },
        { id: 'scheduling', label: 'Programación', icon: Icons.SchedulingIcon, component: <SchedulingModule /> },
        { id: 'engineering', label: 'Ingeniería', icon: Icons.EngineeringIcon, component: <EngineeringModule /> },
        { id: 'costs', label: 'Costos', icon: Icons.CostsIcon, component: <CostsModule companyInfo={companyInfo}/> },
        { id: 'inventory', label: 'Inventario', icon: Icons.InventoryIcon, component: <InventoryModule companyInfo={companyInfo}/> },
        { id: 'production', label: 'Control Producción', icon: Icons.ProductionIcon, component: <ProductionControlModule /> },
        { id: 'workshops', label: 'Talleres Externos', icon: Icons.ExternalLinkIcon, component: <WorkshopsModule companyInfo={companyInfo} /> },
        { id: 'maintenance', label: 'Mantenimiento', icon: Icons.EngineeringIcon, component: <MaintenanceModule /> },
        { id: 'personnel', label: 'Personal', icon: Icons.UsersIcon, component: <PersonnelModule /> },
        { id: 'company', label: 'Datos Empresa', icon: Icons.DashboardIcon, component: <CompanyDataModule companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} currentUser={currentUser} /> },
    ];

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

    const handleSaveProfile = (updatedUser: User) => {
        setCurrentUser(updatedUser);
    };

    const currentModule = moduleConfig.find(m => m.id === activeModule) || moduleConfig[0];

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-dark-primary text-gray-900 dark:text-gray-100">
            <Sidebar 
                activeModule={activeModule} 
                setActiveModule={setActiveModule} 
                isExpanded={isSidebarExpanded} 
                isMobileOpen={isMobileSidebarOpen}
                setMobileOpen={setMobileSidebarOpen}
                user={currentUser}
                onProfileClick={() => setProfileModalOpen(true)}
                moduleConfig={moduleConfig}
            />
            {isMobileSidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" onClick={() => setMobileSidebarOpen(false)}></div>}
            
            <div className="flex-1 flex flex-col overflow-hidden">
                 <Header 
                    activeModuleLabel={currentModule.label} 
                    toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
                    toggleMobileSidebar={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
                    theme={theme} 
                    toggleTheme={toggleTheme} 
                 />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
                    {currentModule.component}
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
    user: User;
    onSave: (user: User) => void;
}> = ({ isOpen, onClose, user, onSave }) => {
    const [formData, setFormData] = useState<User>(user);

    useEffect(() => {
        if (isOpen) {
            setFormData(user);
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 sm:text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue dark:bg-dark-accent dark:border-gray-600 sm:text-sm"
                    />
                </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
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
  user: User;
  onProfileClick: () => void;
  moduleConfig: { id: ModuleType; label: string; icon: React.FC<{ className?: string }>; component: React.ReactNode; }[];
}> = ({ activeModule, setActiveModule, isExpanded, isMobileOpen, setMobileOpen, user, onProfileClick, moduleConfig }) => {
  
  const handleLinkClick = (module: ModuleType) => {
    setActiveModule(module);
    setMobileOpen(false); // Close mobile sidebar on navigation
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col bg-white dark:bg-dark-secondary shadow-lg transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${isExpanded ? 'w-64' : 'w-20'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Logo */}
      <div className={`flex items-center border-b dark:border-gray-700 ${isExpanded ? 'h-20 px-6' : 'h-20 justify-center'}`}>
         {isExpanded ? (
            <Icons.Logo className="h-12 w-auto" />
         ) : (
            <Icons.Logo className="h-10 w-auto" />
         )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {moduleConfig.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href="#"
            onClick={(e) => { e.preventDefault(); handleLinkClick(id as ModuleType); }}
            className={`flex items-center p-3 text-sm font-medium rounded-lg transition-colors duration-200 group ${
              activeModule === id
                ? 'bg-brand-blue text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-accent'
            } ${!isExpanded && 'justify-center'}`}
          >
            <Icon className="h-6 w-6 flex-shrink-0" />
            <span className={`ml-3 transition-all duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>{label}</span>
          </a>
        ))}
      </nav>
      
      {/* User Profile Footer */}
      <button onClick={onProfileClick} className="border-t dark:border-gray-700 p-4 w-full hover:bg-gray-100 dark:hover:bg-dark-accent transition-colors">
          <div className={`flex items-center ${!isExpanded && 'justify-center'}`}>
            <img src={user.avatarUrl} alt="User" className="h-10 w-10 rounded-full flex-shrink-0 object-cover" />
            <div className={`ml-3 overflow-hidden transition-all duration-200 text-left ${isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
             <div className={`transition-all duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 md:opacity-100 md:w-auto'}`}>
                <Icons.LogoutIcon className="h-5 w-5 ml-2 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
      </button>
    </aside>
  );
};

const Header: React.FC<{
    activeModuleLabel: string;
    toggleSidebar: () => void;
    toggleMobileSidebar: () => void;
    theme: Theme;
    toggleTheme: () => void;
}> = ({ activeModuleLabel, toggleSidebar, toggleMobileSidebar, theme, toggleTheme }) => {
    return (
        <header className="bg-white dark:bg-dark-secondary shadow-md p-4 flex justify-between items-center z-20 sticky top-0">
            <div className="flex items-center">
                 {/* Mobile Toggle */}
                 <button onClick={toggleMobileSidebar} className="text-gray-500 dark:text-gray-400 mr-4 md:hidden">
                    <Icons.MenuIcon className="w-6 h-6" />
                </button>
                 {/* Desktop Toggle */}
                <button onClick={toggleSidebar} className="hidden md:block text-gray-500 dark:text-gray-400 mr-4">
                    <Icons.MenuIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white capitalize">{activeModuleLabel}</h1>
            </div>
            <div className="flex items-center space-x-4">
                <button onClick={toggleTheme} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-accent p-2 rounded-full">
                    {theme === 'light' ? <Icons.MoonIcon className="h-6 w-6" /> : <Icons.SunIcon className="h-6 w-6" />}
                </button>
                 <div className="hidden md:block">
                     {/* User avatar is now in the sidebar */}
                 </div>
            </div>
        </header>
    );
};

export default App;