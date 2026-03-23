# 🏢 UGE Manager - Guia Tècnica Integral

Aquest document serveix com a manual de referència complet per a desenvolupadors, administradors i sistemes d'IA que necessitin entendre, mantenir o migrar dades en l'ecosistema **UGE Manager**.

---

## 🚀 1. Arquitectura del Sistema

L'aplicació és una **Single Page Application (SPA)** moderna amb una arquitectura **Serverless**.

- **Frontend**: React 19 + TypeScript + Vite.
- **Estils**: Tailwind CSS (Disseny net, professional i corporatiu).
- **Backend-as-a-Service (BaaS)**: Supabase.
  - **Base de dades**: PostgreSQL.
  - **Autenticació**: Supabase Auth (JWT).
  - **Emmagatzematge**: Supabase Storage (Buckets per a PDFs).
  - **Realtime**: Subscripcions via WebSockets per a notificacions instantànies.

---

## 🔐 2. Seguretat i Rols (RBAC)

L'accés a la informació està protegit mitjançant **Row Level Security (RLS)** a nivell de base de dades. El sistema identifica l'usuari mitjançant el seu JWT i consulta el seu rol a la taula `profiles`.

### Rols Principals:
1.  **Lectura**: Pot veure el dashboard de sol·licituds i contractes. No pot crear ni editar. No veu el mòdul de "Nou contracte".
2.  **Peticions**: Pot crear noves Sol·licituds de despesa. Rep notificacions quan les seves peticions són actualitzades per un gestor.
3.  **Gestió**: Pot editar totes les sol·licituds (assignar SEGEX, sistema de tramitació, dates, etc.). Rep notificacions de noves peticions d'altres usuaris.
4.  **Administrador**: Control total del sistema.
    - Únic rol amb accés al mòdul **"Nou contracte"**.
    - Únic rol amb permisos d'edició/eliminació de **Contractes**.
    - Gestió d'usuaris (canvi de rols).

---

## 🗄️ 3. Esquema Detallat de la Base de Dades

### A. Taula `profiles` (Usuaris)
Vinculada directament a `auth.users`.
- `id` (uuid, PK): FK a `auth.users`.
- `full_name` (text): Nom complet.
- `email` (text): Adreça de correu.
- `role` (text): Valors: `Lectura`, `Peticions`, `Gestió`, `Administrador`.

### B. Taula `records` (Sol·licituds de Despesa)
Gestiona el flux de peticions de les residències.
- `id` (bigint, PK): Auto-increment.
- `nom`, `email`: Dades del sol·licitant.
- `objecte_contracte`, `caracteristiques_tecniques`, `justificacio`: Detalls de la petició.
- `base_imposable` (numeric), `quota_iva` (numeric): Dades financeres.
- `codi_cpv`, `partida_organica`, `partida_programa`, `partida_economica`: Classificació administrativa.
- `sistema_tramitacio`: `AD`, `ADO`, `OFI`, `REC`, `CF`, `R. PATRIMONIAL`.
- `estat`: `publicat` (boolean), `finalitzat` (boolean).
- `fitxers_pressupost` (jsonb): Array d'objectes `{name, path, size}`.
- `segex`, `reg_factura`, `relacio_q`, `relacio_o`: Referències de tramitació posterior.

### C. Taula `contracts` (Mòdul Contractes)
Dades mestre dels contractes vigents.
- `id` (bigint, PK): Auto-increment.
- `nom_contracte` (text): Títol oficial del contracte.
- `tipus_contracte` (text): `Subministrament`, `Servei`, `Obra`, `Exclòs`, `Privat`.
- `organ_contractacio` (text): `UFAG Residència ...`, `Gerència`, `Vicepresidència`.
- `responsable_contracte` (text): Persona o càrrec responsable.
- `prorrogable` (boolean): Indica si el contracte admet pròrrogues.
- `modificable` (boolean): Indica si s'ha modificat post-adjudicació.
- `sense_lots` (boolean): Defineix si el contracte és d'un sol lot (auto-generat).
- `ppt_document`, `pcap_document`, `resolucio_document` (jsonb): Metadades dels PDFs oficials.

### D. Taula `contract_lots` (Lots de Contracte)
Relació **1:N** amb `contracts`.
- `contract_id` (bigint, FK): Enllaç a `contracts.id`.
- `nom_lot` (text): Nom del lot (o del contracte si `sense_lots` és true).
- `cpv` (text): Codi CPV específic del lot.
- `adjudicatari` (text): Empresa guanyadora.
- `import_comes` (numeric): Pressupost adjudicat.
- `data_inici`, `data_fi`: Dates del període inicial.
- `data_limit_comunicacio_proroga`: Data crítica per a la gestió administrativa.
- `data_inici_proroga`, `data_fi_proroga`: Dates del període de pròrroga (si s'escau).
- `centres` (jsonb): Array de strings amb els centres on s'aplica el lot.

### E. Taula `notifications`
- `type`: `new_request`, `record_updated`, `contract_update`.
- `peticio_id`: Enllaç al registre de `records`.
- `is_read`: Estat per usuari (gestionat via JSONB `read_by` per a notificacions globals).

---

## 📂 4. Emmagatzematge (Storage Buckets)

Tots els fitxers es guarden en format PDF amb RLS per a usuaris autenticats.

1.  **`peticions_pressupostos`**:
    - Ruta: `peticions/{peticio_id}/{nom_fitxer}`.
    - Contingut: Pressupostos de sol·licituds.
2.  **`contractes_documents`**:
    - Ruta: `{user_id}/{timestamp}_{tipus}.pdf`.
    - Contingut: PPT, PCAP i Resolucions d'adjudicació.

---

## 🖥️ 5. Funcionalitats dels Dashboards

L'aplicació compta amb dues vistes principals unificades pel nou menú de navegació superior:

### A. Control de Sol·licituds
- Plana principal on es llisten i es filtren totes les peticions de noves despeses.
- Depenent del rol, es poden visualitzar, editar o eliminar els registres.
- Els registres de les referències SEGEX compten amb un botó de vinculació directa a l'adreça web pertinent.
- Opcions d'exportació a Excel integrades.

### B. Control de Contractes
- Mòdul específic per al seguiment de tots els contractes i els seus respectius lots emmagatzemats al sistema de manera ordenada (per defecte per **Data d'inici**, del més nou al més antic).
- **Filtres avançats:** Filtre escollit per defecte per veure els "Contractes vigents" (amb dates fi posteriors a l'actual o no determinades), llistes desplegables netes per al "Tipus de contracte" i filtre flexible de conjunts per a un o més "Centres".
- Igual que en sol·licituds, les referències SEGEX disposen d'enllaços a l'expedient un cop introduït dins la xarxa SECI.

---

## 📊 6. Guia de Migració de Dades (CSV a SQL)

Per importar dades de contractes existents des d'un CSV, s'ha de seguir aquesta lògica:

### Pas 1: Inserció de Contractes
El contracte és l'entitat pare. Cal generar un SQL `INSERT INTO public.contracts (...)` i obtenir l'ID.
- **Important**: Si el CSV no separa lots però el contracte és únic, posar `sense_lots = true`.

### Pas 2: Inserció de Lots
Un cop inserit el contracte, cal inserir almenys un lot a `public.contract_lots`.
- **Enllaç**: `contract_id` ha de coincidir amb l'ID del contracte creat al pas 1.
- **Centres**: El camp `centres` ha de ser un format JSONB vàlid. Exemple: `'["Residència Bonanova", "Huialfàs"]'::jsonb`.
- **Dates**: Format ISO `YYYY-MM-DD`.

### Pas 3: Valors Constants
Assegureu-vos d'utilitzar els valors exactes definits a `src/types.ts` per evitar problemes amb els filtres de la interfície:
- **Tipus**: `Subministrament`, `Servei`, `Obra`, `Exclòs`, `Privat`.
- **Òrgans**: `UFAG Residència Bonanova`, `UFAG Residència Llar dels Ancians`, etc.

---

## 🛠️ 7. Desenvolupament

```bash
# Instal·lació
npm install

# Execució local
npm run dev

# Verificació de tipus TS
npx tsc --noEmit
```

*Creat per i per a la Unitat de Gestió Econòmica - IMAS.*
