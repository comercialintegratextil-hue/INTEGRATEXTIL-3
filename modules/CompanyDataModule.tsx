import React, { useState, useEffect } from 'react';
import { CompanyInfo } from '../types';
import { Card, Button, Modal, FileInput } from '../components/Common';

interface CompanyDataModuleProps {
    companyInfo: CompanyInfo;
    setCompanyInfo: (info: CompanyInfo) => void;
    currentUser: { name: string };
}

const CompanyDataFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (info: CompanyInfo) => void;
    companyInfo: CompanyInfo;
}> = ({ isOpen, onClose, onSave, companyInfo }) => {
    const [formData, setFormData] = useState(companyInfo);

    useEffect(() => {
        if (isOpen) {
            setFormData(companyInfo);
        }
    }, [isOpen, companyInfo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Información de la Empresa" size="2xl">
            <div className="space-y-4">
                <FileInput 
                    label="Logo de la Empresa"
                    previewUrl={formData.logoUrl}
                    onFileChange={() => {}}
                    onUrlChange={(url) => setFormData(p => ({...p, logoUrl: url || p.logoUrl}))}
                />
                 <div><label className="label">Nombre o Razón Social</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="input"/></div>
                 <div><label className="label">NIT</label><input type="text" name="nit" value={formData.nit} onChange={handleChange} className="input"/></div>
                 <div><label className="label">Dirección</label><input type="text" name="address" value={formData.address} onChange={handleChange} className="input"/></div>
                 <div><label className="label">Ciudad / País</label><input type="text" name="cityCountry" value={formData.cityCountry} onChange={handleChange} className="input"/></div>
                 <div><label className="label">Teléfono</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input"/></div>
                 <div><label className="label">Correo Electrónico</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="input"/></div>
                 <div><label className="label">Sitio Web</label><input type="text" name="website" value={formData.website} onChange={handleChange} className="input"/></div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={() => onSave(formData)}>Guardar Cambios</Button>
            </div>
            <style>{`.label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }`}</style>
        </Modal>
    );
};

const CompanyDataModule: React.FC<CompanyDataModuleProps> = ({ companyInfo, setCompanyInfo, currentUser }) => {
    const [isEditModalOpen, setEditModalOpen] = useState(false);

    const handleSave = (info: CompanyInfo) => {
        setCompanyInfo({
            ...info,
            lastUpdatedAt: new Date().toISOString(),
            lastUpdatedBy: currentUser.name,
        });
        setEditModalOpen(false);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Card className="relative overflow-hidden">
                <Button 
                    onClick={() => setEditModalOpen(true)}
                    className="absolute top-4 right-4"
                >
                    Editar
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-1 flex flex-col items-center">
                        <div className="w-40 h-40 p-2 border-2 border-dashed dark:border-gray-700 rounded-full flex items-center justify-center">
                             <img src={companyInfo.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain rounded-full" />
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{companyInfo.name}</h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400">{companyInfo.nit}</p>
                        <div className="border-t dark:border-gray-700 pt-4 space-y-2 text-sm">
                            <p><strong>Dirección:</strong> {companyInfo.address}</p>
                            <p><strong>Ubicación:</strong> {companyInfo.cityCountry}</p>
                            <p><strong>Teléfono:</strong> {companyInfo.phone}</p>
                            <p><strong>Email:</strong> {companyInfo.email}</p>
                            <p><strong>Sitio Web:</strong> <a href={companyInfo.website} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">{companyInfo.website}</a></p>
                        </div>
                    </div>
                </div>
                 {companyInfo.lastUpdatedAt && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 text-right mt-6 border-t dark:border-gray-700 pt-2">
                        Última actualización: {new Date(companyInfo.lastUpdatedAt).toLocaleString('es-CO')} por {companyInfo.lastUpdatedBy}
                    </div>
                )}
            </Card>
            <CompanyDataFormModal 
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSave={handleSave}
                companyInfo={companyInfo}
            />
        </div>
    );
};

export default CompanyDataModule;
