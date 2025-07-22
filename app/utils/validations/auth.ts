import * as z from 'zod';
import { isBefore, subYears, parse } from 'date-fns';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es obligatorio')
    .email('El email no es válido')
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'El email debe ser válido',
    ),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const StepOneSchema = z.object({
  gender: z.string().min(1, 'El sexo es requerido'),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre es demasiado largo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'El nombre solo puede contener letras'),
  last_name: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido es demasiado largo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'El apellido solo puede contener letras'),
  email: z.string().email('El correo electrónico no es válido'),
  user_name: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'El nombre de usuario es demasiado largo')
    .regex(
      /^@[a-zA-Z0-9_]+$/,
      'El nombre de usuario debe comenzar con "@" y solo puede contener letras, números y guiones bajos',
    ),
});

export const StepTwoSchema = z
  .object({
    date_of_birth: z.string().refine((value) => {
      const parsedDate = parse(value, 'yyyy/MM/dd', new Date());
      return (
        isBefore(parsedDate, subYears(new Date(), 18)) &&
        !isNaN(parsedDate.getTime())
      );
    }, 'Debes ser mayor de 18 años'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
      .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
      .regex(/\d/, 'Debe incluir al menos un número')
      .regex(
        /[@$!%*?&]/,
        'Debe incluir al menos un carácter especial (@, $, !, %, *, ?, &)',
      ),
    confirm_password: z
      .string()
      .min(8, 'La confirmación de contraseña debe tener al menos 8 caracteres'),
    country_id: z.string().min(1, 'El país es requerido'),
    number_phone: z
      .string()
      .optional()
      .refine((value) => {
        if (!value || value.trim() === '') return true;
        return /^\+?\d{7,15}$/.test(value);
      }, 'Número de teléfono inválido (debe contener entre 7 y 15 dígitos, con o sin "+")'),
    privacity: z
      .boolean()
      .refine(
        (value) => value === true,
        'Debes aceptar las políticas de privacidad',
      ),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  });

export const verificationSchema = z.object({
  code_otp: z
    .string()
    .min(4, 'El código debe tener 4 dígitos')
    .max(4, 'El código debe tener 4 dígitos')
    .regex(/^\d+$/, 'El código es invalido'),
});

export const recoveryEmailSchema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
});

export const ForgotPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
    .regex(/\d/, 'Debe incluir al menos un número')
    .regex(
      /[@$!%*?&]/,
      'Debe incluir al menos un carácter especial (@, $, !, %, *, ?, &)',
    ),
  confirm_password: z
    .string()
    .min(8, 'La confirmación de contraseña debe tener al menos 8 caracteres'),
});
