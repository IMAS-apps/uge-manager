# UGE - Sol·licituds (UGE Manager)

Aplicació web de gestió interna per a la **Unitat de Gestió Econòmica (UGE)** de l'IMAS. Aquesta eina centralitza la gestió, tramitació i seguiment de les sol·licituds de despesa de les residències i centres.

## 🚀 Arquitectura i Stack Tecnològic

L'aplicació ha estat migrada a una arquitectura **Serverless** pura, eliminant la dependència de servidors locals.

*   **Frontend**: React 19 + Vite + Tailwind CSS.
*   **Backend**: Supabase (Backend-as-a-Service).
    *   **Auth**: Gestió d'usuaris i sessions.
    *   **PostgreSQL**: Base de dades relacional amb seguretat a nivell de fila (RLS).
    *   **Realtime**: Notificacions instantànies mitjançant subscripcions a canvis de taula.
    *   **Storage**: Emmagatzematge de pressupostos en format PDF.
*   **Deployment**: Compatible amb Vercel.

---

## 🔐 Model de Seguretat (RBAC & RLS)

L'accés a les dades està protegit mitjançant **Row Level Security (RLS)** de PostgreSQL, basat en el rol de l'usuari guardat a la taula `profiles`.

### Rols de l'Usuari
- **Lectura**: Accés bàsic per veure el dashboard. No pot crear ni editar.
- **Peticions**: Pot crear noves sol·licituds i rebre notificacions quan algú les actualitza.
- **Gestió**: Pot editar tots els registres (assignar SEGEX, sistema de tramitació, etc.) i rep notificacions de noves peticions.
- **Administrador**: Control total. Gestió d'usuaris i visibilitat de totes les notificacions.

### Polítiques RLS Clau
- `records`: Tots els usuaris autenticats poden consultar. Només `Gestió` i `Admin` poden actualitzar qualsevol registre.
- `notifications`: Els usuaris només veuen notificacions on són destinataris o que corresponen al seu rol de gestió.
- `profiles`: L'usuari pot actualitzar el seu propi perfil. Els perfils són visibles per a tots els usuaris autenticats.

---

## 🗄️ Esquema de Base de Dades

### Taula `profiles`
Estén la funcionalitat d'`auth.users`.
- `id` (uuid, PK): FK a `auth.users`.
- `full_name` (text): Nom real de l'usuari.
- `role` (text): Un de `Lectura`, `Peticions`, `Gestió`, `Administrador`.

### Taula `records`
Emmagatzema les sol·licituds de despesa.
- `id` (bigint, PK): Identificador autoincremental.
- `objecte_contracte` (text): Descripció de la necessitat.
- `fitxers_pressupost` (jsonb): Array de metadades d'archius (`{name, path, size}`).
- `segex`, `sistema_tramitacio`: Camps de gestió administrativa.
- `created_by` (uuid): FK a l'usuari que va crear la petició.

### Taula `notifications`
Generades automàticament per triggers de base de dades.
- `type`: `new_request` o `record_updated`.
- `recipient_user_id`: Usuari que ha de rebre l'alerta (si és NULL, és una alerta per a Gestió/Admin).
- `is_read` (boolean): Estat de lectura.

---

## ⚙️ Lògica de Negoci Automàtica (Triggers)

El sistema utilitza un Trigger SQL (`on_record_change`) que executa la funció `handle_record_notification()` després de qualsevol canvi a `records`:

1.  **INSERT**: Si un usuari amb rol `Peticions` crea un registre, es genera una notificació tipus `new_request` per als rols de supervisió.
2.  **UPDATE**: Si un gestor modifica un registre, es notifica automàticament al creador original (`record_updated`).

---

## 📁 Gestió d'Arxius (Storage)

- **Bucket**: `peticions_pressupostos` (Públic).
- **Format**: PDF.
- **Ruta**: `peticions/{peticio_id}/{filename}`.
- **Seguretat**: Només usuaris autenticats poden pujar archius.

---

## 🛠️ Configuració de Desenvolupament

### Variables d'Entorn (.env)
```env
VITE_SUPABASE_URL=URL_DEL_PROJECTE
VITE_SUPABASE_ANON_KEY=CLAU_ANONIMA_PUBLICA
```

### Comandaments
- `npm install`: Instal·la les dependències.
- `npm run dev`: Inicia el servidor de desenvolupament (Vite).
- `npm run build`: Genera el paquet per a producció al directori `/dist`.
- `npm run lint`: Verifica els tipus de TypeScript.

---

## 🚢 Deploy a Vercel

1. Connectar el repositori a Vercel.
2. Configurar les variables d'entorn `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`.
3. El Project Preset ha de ser **Vite**.
4. (Opcional) Afegir un `vercel.json` per a rutes SPA si es fa servir React Router.

---

## 👨‍💻 Notes per a Programadors / IA

- **Tipus**: Utilitza `src/types/supabase.ts` (generat per Supabase CLI) per mantenir la integritat de les dades.
- **Realtime**: La subscripció a notificacions es gestiona a `App.tsx` i s'actualitza de manera optimista o per polling de seguretat cada 60s.
- **Sorting**: L'ordenació de la taula al Dashboard és purament frontend per a una major velocitat, calculant el camp "Total" en temps real.
