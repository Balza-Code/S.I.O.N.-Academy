'use client'
import { z } from 'zod'
import { startTransition, useState, useTransition } from "react";
import { loginAction } from '@/app/actions/auth';
import { LoginInput, loginSchema } from "@/types/auth.schema";
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export default function LoginForm() {
  
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [erroresCampos, setErroresCampos] = useState<Record<string, string[] | undefined>>({});

  const [isPending, setIsPending] = useTransition()

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectToParam = searchParams?.get('redirect') ?? searchParams?.get('redirectTo') ?? '/dashboard';


  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorGeneral(null);
    setErroresCampos({});


    const formData = new FormData(event.currentTarget);
    const data: LoginInput = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const validation = loginSchema.safeParse(data);
    if (!validation.success) {
      const { fieldErrors } = z.flattenError(validation.error)
      setErroresCampos(fieldErrors);
      return
    }
    const res = await loginAction(data);

    
    if(res.success){
      const destino = redirectToParam || '/dashboard';
      startTransition(() => {
        router.push(destino);
        router.refresh();
      })
    } else if (!res.success){
        if ('errors' in res && res.errors) {
          setErroresCampos(res.errors)
        }else if ('message' in res && res.message) {
          setErrorGeneral(res.message)
        }
         return;
      }
          
  }

  return(
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm p-6 bg-zinc-900 rounded-lg border border-zinc-800">
      <div className="flex flex-col gap-1">
        <input 
          name="email" 
          type="email" 
          placeholder="Correo Electrónico" 
          required 
          disabled={isPending}
          className="bg-zinc-950 border border-zinc-800 text-white p-3 rounded focus:outline-none focus:border-emerald-500 transition-colors" 
        />
        {erroresCampos.email && (
          <span className="text-red-500 text-xs mt-1">{erroresCampos.email[0]}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <input 
          name="password" 
          type="password" 
          placeholder="Contraseña" 
          required 
          disabled={isPending}
          className="bg-zinc-950 border border-zinc-800 text-white p-3 rounded focus:outline-none focus:border-emerald-500 transition-colors" 
        />
        {erroresCampos.password && (
          <span className="text-red-500 text-xs mt-1">{erroresCampos.password[0]}</span>
        )}
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded font-semibold transition-colors disabled:opacity-50"
      >
        {isPending ? 'Verificando...' : 'Iniciar Sesión'}
      </button>

      {errorGeneral && (
        <p className="text-red-500 text-sm text-center mt-2 bg-red-500/10 border border-red-500/20 p-2 rounded">
          {errorGeneral}
        </p>
      )}
    </form>
  );
  

}