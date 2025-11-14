
import React from 'react';
import { Card } from '../components/Common';

const PlaceholderModule: React.FC<{ title: string }> = ({ title }) => {
    return (
        <Card className="text-center p-16">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Módulo: {title}</h1>
            <p className="text-gray-500 dark:text-gray-400">Esta funcionalidad está en desarrollo.</p>
            <div className="mt-8">
                 <div className="animate-pulse flex space-x-4 justify-center">
                    <div className="rounded-full bg-slate-200 dark:bg-slate-700 h-10 w-10"></div>
                    <div className="flex-1 space-y-6 py-1">
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded col-span-2"></div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default PlaceholderModule;
