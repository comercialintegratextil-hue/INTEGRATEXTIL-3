import React, { useState } from 'react';
import { SystemUser } from '../types';
import { Card, Button } from '../components/Common';
import * as Icons from '../components/Icons';

interface LoginModuleProps {
  users: SystemUser[];
  onLogin: (user: SystemUser) => void;
}

const LoginModule: React.FC<LoginModuleProps> = ({ users, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const foundUser = users.find(
      (user) =>
        user.email.trim().toLowerCase() === email.trim().toLowerCase() &&
        user.password === password
    );

    if (foundUser) {
      setError(null);
      onLogin(foundUser);
    } else {
      setError('Credenciales inválidas. Intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-dark-primary dark:via-dark-secondary dark:to-dark-primary p-4">
      <Card className="w-full max-w-md shadow-2xl border border-gray-100/80 dark:border-gray-700/60">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-corp-blue text-white flex items-center justify-center shadow-lg shadow-blue-200/80 dark:shadow-none mb-4">
            <Icons.Logo className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-corp-dark dark:text-white">
            IntegraTextil Suite
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Accede al panel administrativo
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Correo corporativo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Icons.MailIcon className="w-5 h-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@integratextil.com"
                className="pl-10 w-full input bg-gray-50 dark:bg-dark-accent border-gray-200 dark:border-gray-700"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Icons.LockIcon className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 w-full input bg-gray-50 dark:bg-dark-accent border-gray-200 dark:border-gray-700"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button className="w-full py-3 flex items-center justify-center space-x-2 text-base">
            <Icons.LoginIcon className="w-5 h-5" />
            <span>Ingresar</span>
          </Button>
        </form>

        <p className="mt-6 text-xs text-center text-gray-400">
          IntegraTextil © {new Date().getFullYear()} • Uso exclusivo interno
        </p>
      </Card>
    </div>
  );
};

export default LoginModule;

