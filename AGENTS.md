# AGENTS.md — UGE Manager

> Guia de referència ràpida per a agents d'IA. Llegeix-la sencera abans de fer cap canvi.

---

## 1. Stack tecnològic

| Capa | Tecnologia |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite 6 |
| Estils | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Testing | Vitest + React Testing Library + Playwright |
| CI/CD | GitHub Actions (`.github/workflows/ci.yml`) |

**Gestor de paquets**: `npm`. Mai usar `yarn` ni `pnpm`.  
**Node**: mínim v20.

---

## 2. Estructura del projecte

```
src/
  App.tsx              # Router SPA + guards RBAC + subscripcions realtime
  types.ts             # Tots els tipus TS + constants (RESPONSABLES, CENTRES_IMAS, etc.)
  main.tsx             # Punt d'entrada
  lib/
    supabase.ts        # Client Supabase (llegeix VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
    ai.ts              # Integració Gemini API (VITE_GEMINI_API_KEY)
  utils/
    generateInforme.ts # Generació DOCX via docx-templates
    contractHelpers.ts # Funcions pures de dates/filtres de contractes (TESTEJABLE)
  components/
    CpvDescription.tsx  # Consulta async de CPV a Supabase
    EditModal.tsx        # Modal d'edició de sol·licituds (~34KB – fitxer gran)
    ContractEditModal.tsx # Modal d'edició de contractes (~30KB – fitxer gran)
  views/
    AuthView.tsx        # Login + registre
    DashboardView.tsx   # Llistat de sol·licituds (~35KB)
    ContractDashboardView.tsx # Llistat de contractes + filtres de data
    FormView.tsx        # Nova sol·licitud
    ContractFormView.tsx # Nou contracte
    NotificationsView.tsx
    UserManagementView.tsx
  types/
    supabase.ts         # Types generats automàticament per Supabase CLI
  test/
    setup.ts            # Setup global Vitest (jest-dom + cleanup)
    mocks/
      supabase.ts       # Mock del client Supabase per a tests
      handlers.ts       # MSW handlers per a l'API Gemini
e2e/
  auth.spec.ts          # Tests E2E de la pantalla de login
  navigation.spec.ts    # Tests E2E de guards de navegació
```

---

## 3. Rols de l'aplicació (RBAC)

| Rol | Sol·licituds | Contractes | Usuaris | Formulari nou |
|-----|-------------|-----------|---------|--------------|
| **Lectura** | Veure | Veure | ✗ | ✗ |
| **Peticions** | Crear + veure propis | Veure | ✗ | ✓ Sol·licituds |
| **Gestió** | Editar tots | Veure | ✗ | ✓ Sol·licituds |
| **Administrador** | Control total | Control total | ✓ | ✓ Tot |

Guards implementats a `App.tsx` (línies ~132-145 i ~214-229). **Mai eliminar ni relaxar aquests guards.**

---

## 4. Base de dades (Supabase)

### Taules principals
- `profiles` — `id (uuid FK auth.users)`, `full_name`, `email`, `role`
- `records` — Sol·licituds de despesa
- `contracts` — Contractes mare
- `contract_lots` — Lots (1:N amb contracts). **Sempre inserir almenys un lot per contracte.**
- `notifications` — `type`, `peticio_id`, `is_read`, `triggered_by_user_id`
- `cpv_codes` — Taula de codis CPV amb `code_numeric` i `description_ca`

### Regles crítiques de DB
- `sense_lots = true` → el contracte té un únic lot auto-generat amb el nom del contracte
- Dates sempre en format ISO `YYYY-MM-DD`
- `centres` a `contract_lots` és JSONB array de strings
- RLS activa a totes les taules. Qualsevol nova taula necessita políiques RLS.

---

## 5. Lògica de dates de contractes

Les funcions crítiques estan a `src/utils/contractHelpers.ts`:

| Funció | Propòsit |
|--------|---------|
| `getContractDates(lots)` | Retorna `{dataInici, dataFi}` computats dels lots |
| `isContractVigent(lots, today?)` | `true` si `dataFi >= today` o no hi ha `dataFi` |
| `getRenewalTheme(contract, today?)` | CSS class per alertes (≤30d: vermell intens, ≤60d: pastel) |
| `formatDate(d)` | Formata `YYYY-MM-DD` → `DD/MM/YYYY` (ca-ES) |

**Regla**: `data_fi_proroga` té prioritat sobre `data_fi` per calcular la vigència.  
**Regla**: `getRenewalTheme` només comprova `data_fi` si `prorrogable === false`.

---

## 6. Testing

```bash
npm test                  # Vitest — tots els tests unitaris i d'integració
npm run test:coverage     # Vitest amb cobertura (genera ./coverage/)
npm run lint              # TypeScript --noEmit
npm run test:e2e          # Playwright E2E (requereix servidor en marxa)
```

### Estructura dels tests
- `src/utils/__tests__/` — Tests unitaris de `contractHelpers` i `generateInforme`
- `src/lib/__tests__/` — Tests unitaris de `ai.ts`
- `src/__tests__/` — Tests d'integració de `App` (RBAC) i constants de `types`
- `src/views/__tests__/` — Tests d'integració de vistes (`AuthView`)
- `src/components/__tests__/` — Tests d'integració de components
- `e2e/` — Tests E2E Playwright

### Mock del client Supabase
Importa `src/test/mocks/supabase.ts` per mockejar totes les crides a Supabase en tests. Mai fer crides reals a la BD en tests unitaris o d'integració.

---

## 7. Variables d'entorn

| Variable | On es defineix | Descripció |
|----------|---------------|-----------|
| `VITE_SUPABASE_URL` | `.env` + GitHub Secret | URL del projecte Supabase |
| `VITE_SUPABASE_ANON_KEY` | `.env` + GitHub Secret | Anon key pública de Supabase |
| `VITE_GEMINI_API_KEY` | `.env` | Clau API de Google Gemini |

El fitxer `.env` no s'inclou al repositori (`.gitignore`). Usar `.env.example` com a referència.

---

## 8. CI/CD (GitHub Actions)

Workflow: `.github/workflows/ci.yml`  
**Jobs**: `install` → `lint` → `test` → `test-e2e`

El `test` job **bloqueja merges** a `main` si falla. Veure el YAML per les instruccions de Branch Protection.

**Secrets necessaris al repositori GitHub**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 9. Convencions de codi

- **No crear fitxers `.jsx`** — usar sempre `.tsx` per components i `.ts` per lògica
- **No usar `any` excepte** quan es fa servir Supabase com a `(supabase as any)` per queries complexes
- **Noms de tests**: `should [comportament] when [condició]`
- **Constants de domini** (noms de centres, organs, tipus): només modificar a `src/types.ts`
- **Documents CSV** (PPT, PCAP, RESOLUCIÓ): s'obren via `https://imas.secimallorca.net/firma/documento.aspx?csv=...`

---

## 10. Fitxers grans — anar amb compte

| Fitxer | Mida | Contingut |
|--------|------|-----------|
| `src/views/DashboardView.tsx` | ~35KB | Llistat sol·licituds + filtres + modal |
| `src/components/EditModal.tsx` | ~34KB | Formulari d'edició complet |
| `src/views/ContractDashboardView.tsx` | ~29KB | Llistat contractes + filtres |
| `src/components/ContractEditModal.tsx` | ~30KB | Formulari edició contractes |

Llegir sempre el fitxer **sencer** abans de fer qualsevol edició per evitar duplicar lògica.
