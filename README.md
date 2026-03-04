# UGE - Sol·licitud de necessitats

Aplicació web de gestió interna per a la **Unitat de Gestió Econòmica (UGE)** de l'IMAS (Institut Mallorquí d'Afers Socials). Aquesta eina permet gestionar, tramitar i fer seguiment de les sol·licituds de despesa i necessitats de contractació de les diferents residències i centres.

## 📋 Descripció del Projecte

El sistema substitueix l'anterior flux de treball basat en formularis de Microsoft Forms i Excels manuals, centralitzant tota la informació en una base de dades segura i accessible mitjançant una interfície web moderna i intuïtiva.

### Funcionalitats Principals

*   **Gestió de Sol·licituds (Peticions):**
    *   Creació de noves sol·licituds amb formulari validat.
    *   Camps detallats: Organ de contractació, Responsable, Justificació, Característiques tècniques, Partides pressupostàries, etc.
    *   Pujada d'arxius adjunts (PDFs de pressupostos).
*   **Tauler de Control (Dashboard):**
    *   Visualització tabular de totes les peticions.
    *   Filtratge avançat per estat, data, responsable, etc.
    *   Ordenació de columnes.
    *   Edició i eliminació de registres (segons permisos).
*   **Gestió d'Usuaris:**
    *   Control d'accés basat en rols (RBAC).
    *   **Assignació automàtica**: El primer usuari registrat rep el rol de `Administrador`; els següents el de `Lectura`.
    *   Panell d'administració per gestionar rols i usuaris de forma centralitzada.
*   **Notificacions:**
    *   Sistema d'alertes en temps real per a noves peticions o canvis en l'estat de les existents.
*   **Manteniment i Scripts:**
    *   Eines per a la migració, correcció de rols i reinici d'usuaris.

## 🛠️ Stack Tecnològic

El projecte utilitza una arquitectura moderna **Full-Stack** amb TypeScript:

### Frontend
*   **React 19**: Llibreria principal per a la interfície d'usuari.
*   **Tailwind CSS**: Framework d'estils "utility-first".
*   **Vite**: Eina de construcció i servidor de desenvolupament ràpid.
*   **Lucide React**: Iconografia.
*   **Framer Motion**: Animacions i transicions suaus.

### Backend
*   **Node.js & Express**: Servidor API RESTful.
*   **Better-SQLite3**: Base de dades SQL lleugera i d'alt rendiment (emmagatzemada en fitxer local `imas.db`).
*   **Multer**: Gestió de pujada de fitxers (multipart/form-data).
*   **JWT (JSON Web Tokens)**: Autenticació segura sense estat.
*   **Bcryptjs**: Hashing de contrasenyes.

## 📂 Estructura del Projecte

```
/
├── .env.example        # Plantilla de variables d'entorn
├── imas.db             # Base de dades SQLite (creada automàticament)
├── import.sql          # Fitxer SQL per a importació de dades (opcional)
├── metadata.json       # Metadades de l'aplicació
├── package.json        # Dependències i scripts
├── server.ts           # Punt d'entrada del Backend (Express)
├── vite.config.ts      # Configuració de Vite
├── scripts/            # Scripts d'utilitat
│   ├── import_data.ts     # Importació de dades històriques
│   ├── fix_roles.ts       # Correcció massiva de rols (Admin al primer usuari)
│   └── reset_users.ts     # Neteja de la taula d'usuaris per a proves
├── src/                # Codi font del Frontend
│   ├── components/     # Components UI reutilitzables
│   ├── views/          # Vistes principals (Pàgines)
│   │   ├── AuthView.tsx           # Login/Registre
│   │   ├── DashboardView.tsx      # Taula de gestió
│   │   ├── FormView.tsx           # Formulari de sol·licitud
│   │   ├── UserManagementView.tsx # Admin usuaris
│   │   └── NotificationsView.tsx  # Centre de notificacions
│   ├── types.ts        # Definicions de tipus TypeScript i constants
│   ├── App.tsx         # Component arrel i enrutament
│   └── main.tsx        # Punt d'entrada React
└── uploads/            # Directori per a fitxers pujats (PDFs)
```

## 🔐 Rols i Permisos

El sistema defineix 4 nivells d'accés:

1.  **Lectura**: Pot veure el llistat de peticions (Dashboard) sense opcions d'edició. Rol assignat per defecte als nous usuaris.
2.  **Peticions**: Pot crear noves sol·licituds i veure les pròpies.
3.  **Gestió**: Pot veure, editar i gestionar totes les sol·licituds (SEGEX, estat, etc.).
4.  **Administrador**: Accés total. Gestió d'usuaris, auditoria i canvi de rols. **El primer usuari que es registra al sistema rep aquest rol automàticament.**

## 🚀 Instal·lació i Execució

### Requisits Previs
*   Node.js (versió LTS recomanada)
*   NPM

### Passos

1.  **Instal·lar dependències:**
    ```bash
    npm install
    ```

2.  **Configurar entorn:**
    Revisar `.env.example`. Per defecte, l'aplicació funciona sense configuració addicional, utilitzant valors per defecte segurs per a desenvolupament.

3.  **Iniciar en mode desenvolupament:**
    ```bash
    npm run dev
    ```
    Això iniciarà el servidor Express amb el middleware de Vite a `http://localhost:3000`.

4.  **Construir per a producció:**
    ```bash
    npm run build
    ```

5.  **Iniciar en mode producció:**
    ```bash
    npm start
    ```

### Importació de Dades (Opcional)

Si disposeu d'un fitxer SQL amb dades històriques (ex: exportació de Forms):

1.  Enganxeu les sentències `INSERT` al fitxer `import.sql` a l'arrel.
2.  Executeu l'script d'importació:
    ```bash
    npm run import-data
    ```
    *Nota: L'script gestiona automàticament les transaccions i corregeix referències d'usuari nul·les.*

## 🗄️ Esquema de Base de Dades

### `users`
Taula d'usuaris del sistema.
*   `id`, `full_name`, `email`, `password_hash`, `role`, `created_at`.

### `records` (Peticions)
Taula principal que emmagatzema les sol·licituds.
*   Camps clau: `organ_contractacio`, `responsable_contracte`, `objecte_contracte`, `import`, `estat` (`finalitzat`, `publicat`), etc.
*   Relacions: `created_by` (FK -> users.id).

### `notifications`
Registre d'esdeveniments per a alertes d'usuari.
*   Tipus: `new_request`, `record_updated`.

## 📝 Notes Addicionals

*   **Seguretat**: Les contrasenyes s'emmagatzemen hashades amb bcrypt. Les rutes de l'API estan protegides amb middleware de verificació de token JWT.
*   **Validació**: El formulari inclou validacions específiques per a formats de codi CPV (8 dígits) i partides pressupostàries (5 dígits).
*   **Fitxers**: Els fitxers PDF es guarden localment a la carpeta `/uploads` i es serveixen de forma estàtica protegida.
