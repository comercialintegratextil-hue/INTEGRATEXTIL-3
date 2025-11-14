import React, { useState } from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-dark-secondary rounded-lg shadow-md p-4 md:p-6 ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
}> = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-brand-blue text-white hover:bg-blue-600 focus:ring-brand-blue',
    secondary: 'bg-gray-200 dark:bg-dark-accent text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600 focus:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  }[variant];
  
  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

interface Tab {
  id: string;
  label: string;
}

export const Tabs: React.FC<{ tabs: Tab[]; children: (activeTab: string) => React.ReactNode }> = ({ tabs, children }) => {
    const [activeTab, setActiveTab] = useState(tabs[0].id);

    return (
        <div>
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-brand-blue text-brand-blue dark:text-blue-400 dark:border-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                            } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="mt-6">
                {children(activeTab)}
            </div>
        </div>
    );
};


export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}> = ({ isOpen, onClose, title, children, size = '2xl' }) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '4xl': 'max-w-4xl',
  }[size];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className={`bg-white dark:bg-dark-secondary rounded-lg shadow-xl w-full ${sizeClasses} max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-dark-secondary z-10">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Table: React.FC<{ headers: string[]; children: React.ReactNode; className?: string }> = ({ headers, children, className }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full bg-white dark:bg-dark-secondary divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-dark-accent">
          <tr>
            {headers.map(header => (
              <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const FileInput: React.FC<{
  label: string;
  onFileChange: (file: File | null) => void;
  previewUrl?: string | null;
  onUrlChange: (url: string | undefined) => void;
}> = ({ label, onFileChange, previewUrl, onUrlChange }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onFileChange(file);
      onUrlChange(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    onFileChange(null);
    onUrlChange(undefined);
  };
  
  return (
     <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="mt-1 flex items-center space-x-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-accent flex items-center justify-center">
                {previewUrl ? 
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" /> : 
                    <svg className="h-12 w-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
            </div>
            <div className="flex flex-col space-y-2">
                <label htmlFor={`file-upload-${label}`} className="cursor-pointer bg-white dark:bg-dark-secondary py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-blue">
                  <span>Subir imagen</span>
                  <input id={`file-upload-${label}`} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                </label>
                {previewUrl && <Button onClick={handleRemoveImage} variant="danger" className="py-1 px-2 text-xs">Quitar</Button>}
            </div>
        </div>
    </div>
  )
};
