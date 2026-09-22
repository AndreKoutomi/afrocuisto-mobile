/**
 * Utilitaire pour garantir des identifiants UUID valides pour PostgreSQL / Supabase
 */
export const toValidUuid = (id?: string | null): string => {
  if (!id || id === 'anonymous') return '00000000-0000-0000-0000-000000000001';

  // Si c'est déjà un UUID v4 standard
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  // Calcul d'un UUID déterministe basé sur le hash de la chaîne
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < id.length; i++) {
    const ch = id.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const hex4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');

  const p1 = hex1;
  const p2 = hex2.substring(0, 4);
  const p3 = '4' + hex2.substring(4, 7);
  const p4 = '8' + hex3.substring(0, 3);
  const p5 = (hex3.substring(3) + hex4).substring(0, 12);

  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
};

