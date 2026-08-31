'use server'
import { z } from 'zod';
import { loginSchema, LoginInput, registroUsuarioSchema, RegistroUsuarioInput } from '@/types/auth.schema';
import { ActionResponse } from '@/types/api';
import { usuarios } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache';
import { crearSesion, borrarSesion } from '@/lib/sessions';
import { requireSession } from '@/lib/auth';
import { runActionResponse } from '@/lib/actionHelpers';


export async function loginAction(formData:LoginInput): Promise<ActionResponse<{userId: number}>> {
  return runActionResponse(async () => {
    const validated = loginSchema.safeParse(formData);

    if (!validated.success) {
      const {fieldErrors} = z.flattenError(validated.error);
      return {
        success: false,
        errors: fieldErrors,
      };
    }

    const resultado = await db
      .select({ id: usuarios.id, email: usuarios.email, password: usuarios.password, rol: usuarios.rol })
      .from(usuarios)
      .where(eq(usuarios.email, validated.data.email.toLocaleLowerCase().trim()));

    const user = resultado[0];
    if (!user) {
      return { success: false, message: 'Credenciales incorrectas' };
    }

    const passwordMatch = await bcrypt.compare(validated.data.password, user.password);
    if (!passwordMatch) {
      return { success: false, message: 'Credenciales incorrectas' };
    }

    await crearSesion(user.id, user.rol);

    return { success: true, data: { userId: user.id } };
  });
}

export async function registerAction(formData: RegistroUsuarioInput): Promise<ActionResponse<{ userId: number }>>{
  // rbac:allow:registerAction - public registration allowed to insert into usuarios
  return runActionResponse(async () => {
    const rawData = {
      nombre: formData.nombre,
      email: formData.email,
      password: formData.password,
      rol: formData.rol,
      organizacionId: formData.organizacionId,
    };

    const validated = registroUsuarioSchema.safeParse(rawData);
    if (!validated.success){
      const { fieldErrors } = z.flattenError(validated.error);
      return { success: false, errors: fieldErrors };
    }

    const { nombre, email, password, organizacionId } = validated.data;

    const usuarioExistente = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(eq(usuarios.email, email.toLowerCase().trim()));

    if (usuarioExistente[0]) {
      return { success: false, message: 'Este correo ya está registrado' };
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const [nuevoUsuario] = await db
      .insert(usuarios)
      .values({
        nombre: nombre.trim(),
        email: email.toLocaleLowerCase().trim(),
        password: passwordHash,
        rol: 'APRENDIZ',
        organizacionId: parseInt(organizacionId)
      }).returning({ id: usuarios.id, rol: usuarios.rol });

    await crearSesion(nuevoUsuario.id, nuevoUsuario.rol);
    revalidatePath('/');

    return { success: true, data: { userId: nuevoUsuario.id } };
  });
}

export async function logoutAction() {
  await requireSession();
  await borrarSesion();
  revalidatePath('/');
}


