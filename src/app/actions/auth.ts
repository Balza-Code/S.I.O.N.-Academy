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


export async function loginAction(formData:LoginInput): Promise<ActionResponse<{userId: number}>> {

  const validated = loginSchema.safeParse(formData);

  if (!validated.success) {
    const {fieldErrors} = z.flattenError(validated.error)
    return {
      success: false,
      errors: fieldErrors
    };
  }

  try {
    const resultado = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, validated.data.email.toLocaleLowerCase().trim()));

    const user = resultado[0];

    if (!user) {
      return {
        success: false, message: 'Credenciales incorrectas'
      };
    }

    
    const passwordMatch = await bcrypt.compare(validated.data.password, user.password);


    if (!passwordMatch) {
      return { success: false, message: 'Credenciales incorrectas'}
    }

    await crearSesion( user.id , user.rol );

    return {
      success: true, data: { userId: user.id }
    };

  } catch (error) {
    return {success: false, message: 'Error interno del servidor'}
  }

}

export async function registerAction(formData: RegistroUsuarioInput): Promise<ActionResponse<{ userId: number }>>{

  const rawData = {
  nombre: formData.nombre,
  email: formData.email,
  password: formData.password,
  rol: formData.rol,
  organizacionId: formData.organizacionId,
}


  const validated = registroUsuarioSchema.safeParse(rawData);

  if (!validated.success){
    const { fieldErrors } = z.flattenError(validated.error);
    return {
      success: false,
      errors: fieldErrors,
    };
  }

  console.log(validated)

  const { nombre, email, password, organizacionId } = validated.data;

  try {
    const usuarioExistente = await db 
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, email.toLowerCase().trim()));

    if(usuarioExistente[0]){
      return{
        success: false,
        message: 'Este correo ya está registrado'
      };
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

    await crearSesion(nuevoUsuario.id, nuevoUsuario.rol)

    revalidatePath('/')

    return{
      success: true,
      data: { userId: nuevoUsuario.id }
    };
  } catch (error) {
    console.error("Error en registerActions:", error);
    return {
      success: false,
      message: 'Ocurrió un error al intentar crear esta cuenta'
    };
  }

}

export async function logoutAction() {
  await borrarSesion();
  revalidatePath('/');
}


