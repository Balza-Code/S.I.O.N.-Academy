import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Formato de email invalido'),
  password: z.string().min(8, 'La contraseña debe tener almenos 8 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>

export const registroUsuarioSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos tres caracteres'),
  email: z.string().email('Introduce un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['ADMIN', 'LIDER', 'APRENDIZ'], {
    message: 'Selecciona un rol válido',
  }),
  organizacionId: z.string().min(1, 'Debes seleccionar una iglesia')
});

export type RegistroUsuarioInput = z.infer<typeof registroUsuarioSchema>; 