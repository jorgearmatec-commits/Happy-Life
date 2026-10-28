# Happy Life Duo — Security Specification for Firestore Rules

## 1. Data Invariants

1. **Aislamiento e Independencia Estricta de Tarjetas:**
   - Cada tarjeta en `/couples/{coupleId}/profiles/{memberId}` pertenece exclusivamente a su titular (`request.auth.uid == memberId`).
   - Ningún usuario puede escribir, sobreescribir ni modificar la tarjeta ajena de su pareja.
   - Las lecturas están permitidas únicamente para miembros verificados de la misma pareja (`coupleId`).

2. **Invariante de Pertenencia a la Pareja:**
   - Las subcolecciones `/couples/{coupleId}/profiles/` y `/couples/{coupleId}/expenses/` requieren que el usuario solicitante forme parte del array `members` del documento padre `/couples/{coupleId}`.

3. **Inmutabilidad y Tipado Estricto de Gastos:**
   - Cada gasto debe pertenecer a una moneda permitida (`CLP`, `ARS`, `USD`).
   - No se permiten importes negativos o cadenas infinitas (`amount is number`, `category.size() <= 60`).

4. **Validación de Conexión:**
   - La ruta `/test/{testId}` permite lectura pública segura para verificar que Firestore está en línea.

## 2. The "Dirty Dozen" Payloads (Ataques bloqueados por diseño)

1. **Payload 1 (Ataque de sobrescritura de tarjeta ajena):** Yorsh autenticado intenta escribir directamente en `profiles/anita_uid`.
   - *Resultado esperado:* `PERMISSION_DENIED` (memberId != request.auth.uid).
2. **Payload 2 (Inyección de campos fantasma):** Intento de enviar `{ isSuperAdmin: true, role: 'admin' }` en `profiles/{memberId}`.
   - *Resultado esperado:* `PERMISSION_DENIED` (hasOnly keys check).
3. **Payload 3 (Ataque sin autenticación a perfiles):** Petición anónima o sin cabecera de autenticación a `/couples/{coupleId}/profiles/{memberId}`.
   - *Resultado esperado:* `PERMISSION_DENIED` (!isSignedIn()).
4. **Payload 4 (Ataque de salto de pareja):** Miembro de `couple_1` intenta leer o escribir gastos en `couples/couple_2/expenses`.
   - *Resultado esperado:* `PERMISSION_DENIED` (request.auth.uid not in couple_2.members).
5. **Payload 5 (Poisoning de ID de documento):** ID de documento de 10 KB con caracteres especiales no conformes a `^[a-zA-Z0-9_\-]+$`.
   - *Resultado esperado:* `PERMISSION_DENIED` (!isValidId()).
6. **Payload 6 (Sobrescritura de moneda con divisa inválida):** Intento de guardar un gasto con `currency: 'BITCOIN'`.
   - *Resultado esperado:* `PERMISSION_DENIED` (currency must be 'CLP', 'ARS' or 'USD').
7. **Payload 7 (Denial of Wallet con descripción de 1MB):** String de 1,000,000 de caracteres en `description`.
   - *Resultado esperado:* `PERMISSION_DENIED` (description.size() <= 200).
8. **Payload 8 (Importe de gasto negativo o NaN):** `{ amount: -500000 }` o `{ amount: "cien mil" }`.
   - *Resultado esperado:* `PERMISSION_DENIED` (amount is number && amount >= 0).
9. **Payload 9 (Alteración de propietario original en gasto):** Modificación de gasto cambiando `creator` a otro usuario.
   - *Resultado esperado:* `PERMISSION_DENIED` (creator immutable on update).
10. **Payload 10 (Escritura en colección no declarada):** Intento de crear documentos en `/system_admins` o `/secrets`.
    - *Resultado esperado:* `PERMISSION_DENIED` (Global default-deny match /{document=**}).
11. **Payload 11 (Falsificación de identidad de creador de sala):** Usuario intenta crear `/couples/{coupleId}` sin incluirse en `members`.
    - *Resultado esperado:* `PERMISSION_DENIED` (request.auth.uid in incoming().members).
12. **Payload 12 (Usuario no verificado escribiendo datos):** Usuario con `email_verified == false` intentando modificar registros críticos.
    - *Resultado esperado:* `PERMISSION_DENIED`.
