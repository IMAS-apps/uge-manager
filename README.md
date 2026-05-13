# 🏢 UGE Manager - Guia Tècnica Integral

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

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
1.  **Lectura**: Pot veure el dashboard de sol·licituds i contractes. No pot crear ni editar la majoria de camps. No veu el mòdul de "Nou contracte". **Pot afegir, editar i eliminar factures** a les sol·licituds.
2.  **Peticions**: Pot crear noves Sol·licituds de despesa. Rep notificacions quan les seves peticions són actualitzades per un gestor. **Pot gestionar les factures** de les sol·licituds.
3.  **Gestió**: Pot editar totes les sol·licituds (assignar SEGEX, sistema de tramitació, dates, etc.) i **crear/editar OFIs**. Rep notificacions de noves peticions d'altres usuaris.
4.  **Administrador**: Control total del sistema.
    - Únic rol amb accés al mòdul **"Nou contracte"**.
    - Únic rol amb permisos d'edició/eliminació de **Contractes**.
    - Gestió d'usuaris (canvi de rols).
    - **Creació, edició i clonació d'OFIs**.
    - Gestió de fitxers pressupostaris (pujada i eliminació) des del modal de detalls de sol·licituds.

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
- `estat`: `publicat` (boolean), `adjudicat` (boolean), `finalitzat` (boolean).
- `centre_servei`: Centre o servei sol·licitant (Residències, Centres de dia, etc.).
- `fitxers_pressupost` (jsonb): Array d'objectes `{name, path, size}`. Administrables post-enviament pels Administradors.
- `segex`, `adjudicatari`, `nif`, `reg_factura`, `relacio_q`, `relacio_o`: Referències de tramitació posterior.
- `motivacio_no_contractacio`, `explicacio_no_contractacio`: Detalls de per què no s'ha contractat (si sistema és OFI).
- `justificacio_preu`, `explicacio_preu`: Justificació detallada dels imports (si sistema és OFI).
- `data_ofi_inicial`: Data tramitació per OFI (etiquetat a la UI com "Tramitat per OFI des de").
- `num_rc` (text): Nº operació RC (ex: 220260015212).

### C. Taula `factures` (Factures de Sol·licituds)
Relació **1:N** amb `records`.
- `id` (bigserial, PK): Auto-increment.
- `record_id` (bigint, FK): Enllaç a `records.id`.
- `expedient` (text): Número d'expedient vinculat a la factura.
- `data` (date): Data de la factura.
- `numero_registre` (text): Número de registre de la factura.
- `descripcio` (text): Concepte o descripció.
- `periode` (text): Període de facturació.
- `numero_factura` (text): Identificador de la factura.
- `import_total` (numeric): Total facturat (amb IVA).
- **Camps Autocalculats (UI)**:
  - `Crèdit reconegut`: Sumatori d'import total de les factures vinculades.
  - `Crèdit disponible`: Resta entre el total de la sol·licitud (Base + IVA) i el crèdit reconegut.
- **RLS**: Tots els usuaris autenticats poden llegir, afegir, modificar o eliminar factures.

### D. Taula `contracts` (Mòdul Contractes)
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

### F. Taula `ofi` (Ordres de Facturació Interna)
Control i seguiment d'expedients de facturació interna.
- `id` (bigserial, PK): Auto-increment.
- `codi_ofi` (text): Codi de l'ordre (ex: 001/26).
- `expedient_ofi` (text): Número d'expedient vinculat (ex: 1234567A).
- `centre_servei` (text): Centre o servei (text lliure).
- `area` (text): Àrea funcional (Gerència, Inclusió, etc.). Determina el text automàtic de la justificació.
- `justificacio_general` (text): Descripció detallada de la justificació.
- `created_by` (uuid, FK): Enllaç a `profiles.id`.
- **Funcionalitat clau**: El botó "veure" del dashboard filtra automàticament la taula `factures` on `factura.expedient === ofi.expedient_ofi`.
- **Hipervincle SEGEX**: El camp `expedient_ofi` es mostra a la columna d'Accions com un badge clickable que extreu l'ID numèric per obrir l'expedient a SEGEX (`https://imas.secimallorca.net/segex/expediente.aspx?id={digits}`).

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
- **Gestió Interna**: Els camps "Publicat", "Adjudicat" i "Finalitzat" només es mostren per a sistemes de tramitació `AD` i `ADO`.
- Els registres de les referències SEGEX compten amb un botó de vinculació directa a l'adreça web pertinent.
- Opcions d'exportació a Excel integrades.

### B. Control de Contractes
- Mòdul específic per al seguiment de tots els contractes i els seus respectius lots emmagatzemats al sistema de manera ordenada (per defecte per **Data d'inici**, del més nou al més antic).
- **Filtres avançats:** Filtre escollit per defecte per veure els "Contractes vigents" (amb dates fi posteriors a l'actual o no determinades), llistes desplegables netes per al "Tipus de contracte" i filtre flexible de conjunts per a un o més "Centres".
- Igual que en sol·licituds, les referències SEGEX disposen d'enllaços a l'expedient un cop introduït dins la xarxa SECI.

### C. Control d'OFIs
- Mòdul intermedi per al seguiment d'Ordres de Facturació Interna.
- Relaciona de manera dinàmica els expedients d'OFI amb les factures introduïdes al sistema mitjançant el número d'expedient.
- **Clonació**: Permet crear una nova OFI pre-emplenant les dades d'una existent.
- **Generació de Memòria**: Botó per descarregar un document Word (`.docx`) amb la "Memòria Justificativa", incloent la taula de factures i annexos de manera automatitzada.
- Permet una traçabilitat directa entre l'ordre interna i l'execució comptable (factures).

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
- **Centres/Serveis (Sol·licituds)**: `Residència Bonanova`, `Centre de dia Can Clar`, `Oficines centrals ...`, etc.
- **Òrgans (Contractes)**: `UFAG Residència Bonanova`, `UFAG Residència Llar dels Ancians`, etc.

---

## 🔍 7. Regles de Validació i Integritat

El sistema implementa validacions en temps real per garantir la qualitat de les dades:

- **Objecte del Contracte**: El camp ha de començar obligatòriament amb una de les paraules clau: `Subministrament`, `Servei`, `Obra` o `Concert`. En cas contrari, es mostra un avís en vermell.
- **Codi CPV**: Si el codi té 8 dígits, es recomana (avís en vermell) que acabi en `0000` per mantenir un nivell de categorització adequat segons els estàndards del departament.
- **Lots de Contracte**: Tot contracte nou ha de tenir, com a mínim, un lot associat. Si el contracte no té lots diferenciats, el sistema n'auto-genera un amb el nom del contracte.

---

## 🛠️ 8. Desenvolupament

```bash
# Instal·lació
npm install

# Execució local
npm run dev

# Verificació de tipus TS
npx tsc --noEmit
```

---

## 🧪 8. Testing i CI/CD

El projecte disposa d'una estratègia de testing automatitzat completa que inclou tests unitaris, d'integració i E2E orientats a garantir la continuïtat de les funcionalitats clau i la integritat del codi abans de cada desplegament.

### Com executar els tests en local
```bash
# Executa tota la suite de tests unitaris i d'integració (Vitest)
npm run test

# Executa amb coverage report
npm run test:coverage

# Executa els tests end-to-end (Playwright)
# Nota: Configurat per aixecar automàticament el servidor Vite (npm run dev)
npm run test:e2e
```

### Cobertura de tests
* **Unitaris (`src/**/__tests__/*.test.ts`)**: Validen la lògica aïllada com regles de dates (`contractHelpers.ts`), format de text IA (`ai.ts`), selecció de plantilles (`generateInforme.ts`) i immutabilitat d'opcions base (`types.ts`).
* **Integració (`src/views/__tests__/*.test.tsx`)**: Recrea interaccions d'usuari a través de múltiples components mockejant Supabase i AI API. Verifiquen el comportament esperat de la UI (formularis, alertes, renders condicionals i els guards RBAC).
* **E2E (`e2e/*.spec.ts`)**: Mitjançant Playwright, valida els controls sense requerir dades estables des de base de dades. Confirma que la navegació i l'esquema d'usuari respon on toca.

### Workflow de GitHub Actions
S'executa a qualsevol push a `main` i Pull Requests, convertint aquests passos en **criteris bloquejants** si hi ha algun error:
1. `install`: Instala (i fa cache) de dependents per augmentar la rapidesa d'avaluació.
2. `lint`: Verifica sintàcticament cap trencament i ús restrictiu de tipejats a través de tsc.
3. `test`: Llença els tests interns i recull la cobertura d'ànalisi com artefacte i comentari al log (Step Summary).
4. `test-e2e`: Inicia un Chrome headless i navega pel compilable actiu garantint que les especificacions del framework es compleixen integralment.

*Creat per i per a la Unitat de Gestió Econòmica - IMAS.*
