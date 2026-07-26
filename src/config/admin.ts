/**
 * Lista blanca de correos autorizados para acceder al Panel de Administrador.
 * Agrega aquí los correos electrónicos de los administradores permitidos.
 */
export const ADMIN_EMAILS: string[] = [
  "mysofttech7@gmail.com",
  "admin@puc.cl",
  "director.musica@puc.cl",
  "musicos.puc@gmail.com",
  "coordinacion.musicos@puc.cl"
];

/**
 * Código de seguridad obligatorio para acceder al Panel Administrativo.
 */
export const ADMIN_SECURITY_CODE = "197607";

/**
 * Función helper para verificar si un correo tiene acceso de administrador.
 */
export function isAuthorizedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase().trim() === normalizedEmail);
}

/**
 * Función helper para verificar el código de seguridad del panel administrativo.
 */
export function isValidSecurityCode(code: string): boolean {
  return code.trim() === ADMIN_SECURITY_CODE;
}

