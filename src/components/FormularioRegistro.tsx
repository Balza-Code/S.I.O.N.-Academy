'use client';

import { registrarUsuarioAction } from "@/app/actions";
import { useState } from "react";

interface FormularioRegistroProps {
  iglesias: {id: number; nombre: string}[];
}

export default function FormularioRegistro({ iglesias }: FormularioRegistroProps){
  const [errores, setErrores] = useState<Record<string, string[]>>({});
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>){
    event.preventDefault();
    setCargando(true);
    setErrores({});
    setExito(false);

    const formData = new FormData(event.currentTarget);
    const resultado = await registrarUsuarioAction(formData);

    setCargando(false);

    if (!resultado.success){
      setErrores(resultado.errors || {});
    } else {
      setExito(true);
      (event.target as HTMLFormElement).reset()
    }
  }

  return (
    <div className="bg-[#242424] border border-[#c4a484]/10 rounded-2xl p-6 max-w-xl mx-auto">
      <h3 className="text-xl font-bold text-[#c4a484] mb-1">Registrar Nuevo Músico</h3>
      <p className="text-xs text-[#a8a8a8] mb-6">Asigna credenciales y vincula al miembro a su iglesia local.</p>

      {exito && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-sm mb-4">
          ✅ ¡Músico registrado y nivelado correctamente en el sistema!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* NOMBRE */}
        <div>
          <label className="block text-xs font-mono uppercase text-[#e4e1d9] mb-1">Nombre Completo</label>
          <input
            name="nombre"
            type="text"
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-[#f4f0e6] focus:border-[#c4a484] outline-none transition-colors"
            placeholder="Ej. Juan Pérez"
          />
          {errores.nombre && <p className="text-xs text-red-400 mt-1">{errores.nombre[0]}</p>}
        </div>

        {/* EMAIL */}
        <div>
          <label className="block text-xs font-mono uppercase text-[#e4e1d9] mb-1">Correo Electrónico</label>
          <input
            name="email"
            type="email"
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-[#f4f0e6] focus:border-[#c4a484] outline-none transition-colors"
            placeholder="juan@sion.com"
          />
          {errores.email && <p className="text-xs text-red-400 mt-1">{errores.email[0]}</p>}
        </div>

        {/* PASSWORD */}
        <div>
          <label className="block text-xs font-mono uppercase text-[#e4e1d9] mb-1">Contraseña Provisional</label>
          <input
            name="password"
            type="password"
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-[#f4f0e6] focus:border-[#c4a484] outline-none transition-colors"
            placeholder="••••••"
          />
          {errores.password && <p className="text-xs text-red-400 mt-1">{errores.password[0]}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* ROL */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#e4e1d9] mb-1">Rol de Acceso</label>
            <select
              name="rol"
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-[#f4f0e6] focus:border-[#c4a484] outline-none transition-colors appearance-none"
            >
              <option value="APRENDIZ">Aprendiz</option>
              <option value="LIDER">Líder</option>
              <option value="ADMIN">Admin</option>
            </select>
            {errores.rol && <p className="text-xs text-red-400 mt-1">{errores.rol[0]}</p>}
          </div>

          {/* IGLESIA */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#e4e1d9] mb-1">Iglesia de Origen</label>
            <select
              name="organizacionId"
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-[#f4f0e6] focus:border-[#c4a484] outline-none transition-colors"
            >
              <option value="">Selecciona una...</option>
              {iglesias.map((iglesia) => (
                <option key={iglesia.id} value={iglesia.id}>
                  {iglesia.nombre}
                </option>
              ))}
            </select>
            {errores.organizacionId && <p className="text-xs text-red-400 mt-1">{errores.organizacionId[0]}</p>}
          </div>
        </div>

        {errores._form && <p className="text-xs text-red-400 text-center">{errores._form[0]}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-[#c4a484] text-[#1a1a1a] font-bold text-sm py-2.5 rounded-lg hover:bg-[#b39374] transition-colors disabled:opacity-50 font-mono uppercase mt-2"
        >
          {cargando ? 'Guardando en S.I.O.N...' : 'Confirmar Registro'}
        </button>
      </form>
    </div>
  );
}
