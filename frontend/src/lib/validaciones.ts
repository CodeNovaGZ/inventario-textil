import { z } from 'zod'

// Texto sin espacios sobrantes y con el largo máximo de la columna de la base de datos
export const texto = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`)

// Número (escrito como texto en el formulario) entre 0 y el máximo que admite NUMERIC(10,2)
export const numero = (vacio: string) =>
  z
    .string()
    .min(1, vacio)
    .refine((v) => Number(v) >= 0, 'No puede ser negativo')
    .refine((v) => Number(v) <= 99_999_999, 'Es demasiado grande')