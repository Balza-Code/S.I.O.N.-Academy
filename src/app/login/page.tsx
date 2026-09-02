import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1>Iniciar Sesión</h1>
      <Suspense fallback={<div className="w-full max-w-sm p-6 text-sm text-[#a8a8a8]">Cargando formulario...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}