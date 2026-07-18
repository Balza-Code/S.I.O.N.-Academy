import LoginForm from '@/components/LoginForm';

// Esta es la forma correcta: una función que retorna el componente
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1>Iniciar Sesión</h1>
      <LoginForm />
    </main>
  );
}