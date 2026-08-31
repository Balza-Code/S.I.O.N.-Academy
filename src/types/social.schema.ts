import { z } from 'zod';

export const subirEvidenciaSchema = z.object({
  leccionId: z.number().int().positive(),
  videoUrl: z.string().url().refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com'),
    { message: 'La URL debe ser un enlace válido de YouTube o Vimeo.' }
  ),
  descripcion: z.string().max(500).optional(),
});

export const comentarEvidenciaSchema = z.object({
  evidenciaId: z.number().int().positive(),
  contenido: z.string().min(1).max(1000),
});

export const reaccionEvidenciaSchema = z.object({
  evidenciaId: z.number().int().positive(),
  tipo: z.enum(['LIKE','CLAP','HEART']).or(z.string()).transform((v) => String(v).toUpperCase()),
});

export type SubirEvidenciaInput = z.infer<typeof subirEvidenciaSchema>;
export type ComentarEvidenciaInput = z.infer<typeof comentarEvidenciaSchema>;
export type ReaccionEvidenciaInput = z.infer<typeof reaccionEvidenciaSchema>;
