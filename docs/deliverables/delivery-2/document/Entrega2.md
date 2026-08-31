<p align="center">
  <img src="images/logo.png" alt="Moonlight" width="130" />
</p>

<h1 align="center">Desarrollo del Sistema Profile Manager</h1>

<p align="center">
  <strong>Nombre del Producto:</strong> Moonlight<br />
  <strong>Equipo de trabajo:</strong> Pablo Manjarres, Valentina Barbosa<br />
  <strong>Versión:</strong> 2.0
</p>

<p align="center">
  <em>Universidad EAFIT — Departamento de Informática y Sistemas — Ingeniería de Software</em><br />
  <em>Entrega 2</em>
</p>

---

## Contenido

- [Sección 1. Historias de Usuario y Cono de la Incertidumbre](#sección-1-historias-de-usuario-y-cono-de-la-incertidumbre)
- [Sección 2. Aspectos generales de la entrega](#sección-2-aspectos-generales-de-la-entrega)
- [Sección 3. Evaluación del Sprint anterior](#sección-3-evaluación-del-sprint-anterior)
- [Sección 4. Planificación del Sprint actual](#sección-4-planificación-del-sprint-actual)
- [Sección 5. Aspectos estructurales y arquitectónicos de la solución](#sección-5-aspectos-estructurales-y-arquitectónicos-de-la-solución)
  - [5.1. Estilos arquitectónicos usados](#51-estilos-arquitectónicos-usados)
  - [5.2. Vista Lógica — Diagrama de Clases de Diseño](#52-vista-lógica--diagrama-de-clases-de-diseño)
  - [5.3. Vista Lógica — Diagrama Entidad-Relación](#53-vista-lógica--diagrama-entidad-relación)
  - [5.4. Vista Física — Diagrama de Componentes y Despliegue](#54-vista-física--diagrama-de-componentes-y-despliegue)
- [Sección 6. Avances en cuanto a funcionalidad y demostración](#sección-6-avances-en-cuanto-a-funcionalidad-y-demostración)
- [Conclusiones y lecciones aprendidas](#conclusiones-y-lecciones-aprendidas)
- [Referencias y fuentes](#referencias-y-fuentes)

---

## Sección 1. Historias de Usuario y Cono de la Incertidumbre

El análisis se consigna en el archivo `Entrega2_Template_HistoriasUsuario.xlsx`, donde se
contrastan las _features_ del proyecto contra el grado de conocimiento del dominio y de la
tecnología.

- Archivo diligenciado: {PENDIENTE: enlace al .xlsx}
- Captura del cono: {PENDIENTE: images/1-cono-incertidumbre.png}

{PENDIENTE: análisis de lo que muestra el cono. Qué features quedaron en la zona de mayor
incertidumbre, por qué, y cómo eso afectó la priorización del Sprint 2.}

---

## Sección 2. Aspectos generales de la entrega

El propósito de este documento es dejar constancia del consenso del equipo sobre el diseño de la
arquitectura de software de Moonlight, el portal de gestión de perfil y recomendación de vacantes
que responde al reto Profile Manager de Magneto. También aplica los conceptos del marco SCRUM
trabajados en el curso: la evaluación del sprint anterior y la planificación del sprint en curso.

La arquitectura se documenta desde dos frentes:

- **Vista Lógica:** los principales elementos y principios del diseño, independientes de la
  plataforma de ejecución. Cubre la separación en paquetes, la regla de dependencias entre ellos
  y el modelo de datos.
- **Vista Física:** la distribución del procesamiento entre los dispositivos y procesos que
  componen la solución, incluyendo el contenedor de base de datos y los puertos que expone.

---

## Sección 3. Evaluación del Sprint anterior

**Técnica de la retrospectiva:** {PENDIENTE: nombre de la técnica, por ejemplo _Start, Stop,
Continue_ o _Mad, Sad, Glad_}

**Qué funcionó bien**

- {PENDIENTE}

**Qué no funcionó**

- {PENDIENTE}

**Acciones de mejora para el Sprint 2**

| #   | Acción de mejora | Responsable | Cómo se verifica |
| --- | ---------------- | ----------- | ---------------- |
| 1   | {PENDIENTE}      | {PENDIENTE} | {PENDIENTE}      |
| 2   | {PENDIENTE}      | {PENDIENTE} | {PENDIENTE}      |
| 3   | {PENDIENTE}      | {PENDIENTE} | {PENDIENTE}      |

**Evidencia de la ceremonia:** {PENDIENTE: images/3-retrospectiva.png}

---

## Sección 4. Planificación del Sprint actual

### Historias seleccionadas

El backlog vive en [GitHub Issues](https://github.com/pablomanjarres/Magneto/issues) y el tablero
en [GitHub Projects](https://github.com/users/pablomanjarres/projects/3). Las historias que siguen
abiertas al cierre del Sprint 1 son las candidatas para este sprint:

| HU      | Historia                                                                          | Impacto en la arquitectura                         |
| ------- | --------------------------------------------------------------------------------- | -------------------------------------------------- |
| #3      | Sign up and log in                                                                | Introduce autenticación y sesión; hoy no existe    |
| #4      | Submit my LinkedIn profile URL                                                    | Primera entrada de datos externa al wizard         |
| #5      | Extract my work experience                                                        | Requiere el módulo de importación                  |
| #6      | Extract my education                                                              | Requiere el módulo de importación                  |
| #7      | Extract my skills                                                                 | Requiere el módulo de importación                  |
| #8      | Upload my résumé                                                                  | Manejo de archivos y almacenamiento                |
| #9      | Review the imported information                                                   | Pantalla de confirmación previa al guardado        |
| #10     | Edit the imported information                                                     | Reutiliza el wizard existente                      |
| #12     | Set my target role                                                                | Campo de expectativas, ya contemplado en el modelo |
| #13     | Set my salary expectation                                                         | Campo de expectativas, ya contemplado en el modelo |
| #15     | State whether I can relocate                                                      | Campo de expectativas, ya contemplado en el modelo |
| #16     | See how complete my profile is                                                    | Se apoya en el cálculo de completitud del dominio  |
| #18     | Browse the available vacancies                                                    | Se apoya en el catálogo de vacantes                |
| #22     | Compare a vacancy against my profile                                              | Extiende el detalle de vacante                     |
| #28     | See a summary of the analysis                                                     | Vista agregada sobre el motor de puntaje           |
| #31     | Get my profile tailored to a vacancy                                              | Nueva capacidad sobre el dominio existente         |
| #32–#36 | Historias no funcionales (auth, validación, _rate limiting_, secretos, _logging_) | Transversales                                      |

**Selección definitiva del Sprint 2:** {PENDIENTE: confirmar cuáles de las anteriores entran, con
su estimación en _story points_}

### Ceremonias

- **Planning con _poker planning_:** {PENDIENTE: images/4-planning-poker.png}
- **Daily o weekly del equipo:** {PENDIENTE: images/4-daily.png}
- **Reunión con el PO o el Líder Técnico:** {PENDIENTE: images/4-reunion-po.png}
- **Sprint backlog en el tablero:** {PENDIENTE: images/4-sprint-backlog.png}

---

## Sección 5. Aspectos estructurales y arquitectónicos de la solución

### 5.1. Estilos arquitectónicos usados

|                            |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tipo Aplicación:**       | Web                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Estilo Arquitectónico:** | **Layered (Estructura).** El código está separado en capas con una regla de dependencia en un solo sentido: `types` ← `core` ← `db` ← `apps`. `packages/core` no importa nada distinto de `packages/types`, de modo que las reglas de negocio no pueden alcanzar la infraestructura. Implicación: el motor de puntaje se prueba sin base de datos y sin servidor.<br><br>**Component-Based (Estructura).** Cada capa es un paquete publicable del monorepo con su propio `package.json`, sus pruebas y su frontera explícita. Implicación: un cambio en el acceso a datos no obliga a recompilar el dominio.<br><br>**Client/Server, 3-Tiers (Implementación).** Navegador → servidor Next.js → PostgreSQL. Tres niveles con responsabilidades separadas: presentación, lógica de aplicación y persistencia. Implicación: la base de datos nunca se expone al cliente.<br><br>_Se descartaron SOA y Message Bus:_ la solución es un único servicio para dos personas, e introducir mensajería añadiría operación sin resolver ningún requisito del reto. |
| **Lenguaje programación**  | TypeScript, sobre Node.js 22                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Aspectos técnicos**      | PostgreSQL 17 como base de datos relacional. Los sub-objetos del perfil (habilidades, experiencia, educación, expectativas) se guardan en columnas `JSONB` porque se leen y escriben completos y nunca se consultan campo por campo. Migraciones _forward-only_: una migración ejecutada no se edita, se agrega la siguiente. Base de datos levantada con Docker Compose.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Frameworks**             | Next.js 15 con App Router y React 19 para la interfaz y los _route handlers_; Turborepo y pnpm _workspaces_ para el monorepo; Vitest para las pruebas del dominio; Express en `apps/api` únicamente como evidencia de la PoC de comparación.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

### 5.2. Vista Lógica — Diagrama de Clases de Diseño

La solución se organiza en tres paquetes de dominio e infraestructura y dos aplicaciones:

| Paquete          | Responsabilidad                                                                                                              | Depende de            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `packages/types` | Tipos compartidos: `Profile`, `Vacancy`, `Requirement`, `Application`, `ScoreResult`                                         | —                     |
| `packages/core`  | Reglas de negocio puras: puntaje, completitud, brechas de mercado, máquina de estados de postulación y validación del perfil | `types`               |
| `packages/db`    | Todo el SQL: _pool_ de conexiones, migraciones, semillas y repositorios de perfiles, vacantes y postulaciones                | `types`               |
| `apps/web`       | Interfaz Next.js y los _route handlers_ de la API                                                                            | `types`, `core`, `db` |
| `apps/api`       | Servicio Express equivalente, evidencia de la PoC de comparación                                                             | `types`, `core`, `db` |

**Reglas de negocio que viven en `packages/core`:**

- **Puntaje de una vacante.** Cada requisito pesa 3 si es `must-have` y 1 si es `nice-to-have`.
  El puntaje es el porcentaje del peso total que el candidato cubre, redondeado. La función es
  pura: sin entrada/salida, sin reloj y sin aleatoriedad, por lo que las mismas entradas siempre
  producen el mismo resultado y la pantalla puede explicar el número.
- **Ordenamiento.** Las vacantes se ordenan por puntaje; los empates se rompen por cantidad de
  `must-have` cubiertos y luego por identificador, de modo que el orden nunca oscila. Las vacantes
  sin requisitos no aportan señal y quedan fuera del ranking.
- **Completitud del perfil.** Nueve campos cuentan hacia el 100 %, y el resultado incluye la lista
  exacta de los que faltan, no sólo el porcentaje.
- **Brechas de mercado.** Es el diferenciador del producto: las habilidades faltantes se miden
  contra todo el conjunto de vacantes, no contra una sola oferta, e informan cuántas vacantes
  desbloquea cada una.
- **Máquina de estados de la postulación.** Cuatro estados y una tabla explícita de transiciones
  permitidas: `applied` → `in-review` o `rejected`; `in-review` → `interview` o `rejected`;
  `interview` → `rejected`; `rejected` → `applied`.
- **Frontera del perfil.** Todo lo que llega por HTTP se reconstruye campo por campo antes de
  tocar la base de datos, de modo que una clave desconocida o un tipo incorrecto no alcanzan
  ninguna pantalla.

**Diagrama de clases de diseño:** {PENDIENTE: images/5-2-diagrama-clases.png}

### 5.3. Vista Lógica — Diagrama Entidad-Relación

El modelo relacional lo definen las migraciones de `packages/db/migrations/`:

| Tabla                  | Columnas principales                                                                                  | Llaves y restricciones                                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vacancies`            | `id`, `title`, `company`, `city`, `work_mode`, `salary_min`, `salary_max`, `currency`                 | PK `id`; `work_mode` restringido a `remote`, `hybrid` u `onsite`                                                                                                        |
| `vacancy_requirements` | `vacancy_id`, `skill`, `kind`                                                                         | PK compuesta (`vacancy_id`, `skill`); FK a `vacancies` con borrado en cascada; `kind` restringido a `must-have` o `nice-to-have`                                        |
| `profiles`             | `id`, `email`, `full_name`, `city`, `skills`, `experience`, `education`, `expectations`, `created_at` | PK `id`; `email` único; los cuatro sub-objetos son `JSONB`                                                                                                              |
| `applications`         | `id`, `profile_id`, `vacancy_id`, `status`, `applied_at`, `updated_at`, `note`                        | PK `id`; FK a `profiles` y a `vacancies` en cascada; único (`profile_id`, `vacancy_id`); índice por `profile_id`; `status` restringido a los cuatro estados del tablero |

Dos decisiones vale la pena sustentar:

1. **Los requisitos son una tabla aparte y no un arreglo.** El motor de puntaje recorre requisito
   por requisito y el catálogo se consulta por habilidad, así que la normalización paga.
2. **Los sub-objetos del perfil son `JSONB`.** Se leen y se escriben completos, nunca se filtran
   por campo, y separarlos habría significado cuatro tablas más sin ninguna consulta que las
   justifique.

**Diagrama entidad-relación:** {PENDIENTE: images/5-3-diagrama-entidad-relacion.png}

### 5.4. Vista Física — Diagrama de Componentes y Despliegue

En ejecución la solución son dos procesos:

| Nodo / Proceso                  | Contenido                                                                                                           | Comunicación                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Navegador del candidato         | Interfaz React 19 renderizada por Next.js                                                                           | HTTP contra el mismo origen                                           |
| Servidor de aplicación          | Proceso Next.js 15 sobre Node.js 22: páginas y _route handlers_ bajo `/api`                                         | TCP/SQL contra PostgreSQL                                             |
| Contenedor `moonlight-postgres` | PostgreSQL 17 (imagen `postgres:17-alpine`), volumen persistente `moonlight-pgdata`, `healthcheck` con `pg_isready` | Publica el puerto `5433` del anfitrión hacia el `5432` del contenedor |

El puerto `5433` es deliberado: una instalación nativa de PostgreSQL suele ocupar ya el `5432`, y
`localhost` resolvería hacia ella antes que hacia el contenedor.

En esta entrega el despliegue es local. {PENDIENTE: si se despliega en la nube antes de la
sustentación, describir el proveedor y actualizar el diagrama}

**Diagrama de componentes:** {PENDIENTE: images/5-4-diagrama-componentes.png}

**Diagrama de despliegue:** {PENDIENTE: images/5-4-diagrama-despliegue.png}

---

## Sección 6. Avances en cuanto a funcionalidad y demostración

**Repositorio:** https://github.com/pablomanjarres/Magneto

### Árbol de directorios

```
moonlight/
├── apps/
│   ├── agents/     # reservado para el importador de hoja de vida (Sprint 2)
│   ├── api/        # servicio Express: evidencia de la PoC de comparación
│   └── web/        # Next.js: interfaz y API de la aplicación
├── packages/
│   ├── core/       # dominio puro: puntaje, completitud, brechas, estados
│   ├── db/         # todo el SQL: pool, migraciones, semillas y repositorios
│   └── types/      # tipos compartidos
├── data/           # dataset semilla: 20 vacantes y un perfil de ejemplo
├── docs/
│   ├── adr/        # decisiones de arquitectura registradas
│   ├── deliverables/
│   ├── diagrams/
│   └── sketches/
├── infra/          # docker-compose de PostgreSQL 17
├── scripts/        # bench.ts, medición de la PoC de backend
└── tests/
```

### Cómo se implementó la arquitectura propuesta

La regla de capas de la sección 5.1 no es una intención, es verificable en el repositorio:
`packages/core` declara como única dependencia a `packages/types`, de modo que el dominio no puede
importar el acceso a datos aunque alguien lo intente. Las 45 pruebas del proyecto viven todas en
`packages/core` y corren sin base de datos.

La decisión de usar _route handlers_ de Next en lugar de un servicio Express independiente está
registrada y medida en [`docs/adr/0001-backend-choice.md`](../../../adr/0001-backend-choice.md):
ambas opciones se construyeron, se midieron con `pnpm bench` y la diferencia resultó menor a un
milisegundo, así que decidió el costo operativo y no el rendimiento.

### Pantallas construidas

| Ruta            | Qué hace                                                                               |
| --------------- | -------------------------------------------------------------------------------------- |
| `/register`     | Registro con nombre y correo; crea el perfil y guarda su identificador en una _cookie_ |
| `/onboarding`   | Asistente que completa el perfil paso a paso                                           |
| `/dashboard`    | Porcentaje de completitud, lo que falta y las brechas contra el mercado                |
| `/jobs`         | Listado de vacantes ordenado por puntaje, con búsqueda y filtros                       |
| `/jobs/[id]`    | Detalle de la vacante: puntaje, requisitos cubiertos y faltantes, y la razón           |
| `/profile`      | Perfil del candidato                                                                   |
| `/applications` | Tablero de postulaciones en cuatro columnas                                            |

### Endpoints disponibles

Once _route handlers_ que atienden nueve rutas:

| Método   | Ruta                                 | Qué hace                                                            |
| -------- | ------------------------------------ | ------------------------------------------------------------------- |
| `GET`    | `/api/health`                        | Identifica el servicio que responde                                 |
| `POST`   | `/api/candidates`                    | Registra al candidato y devuelve su perfil inicial                  |
| `POST`   | `/api/profiles`                      | Guarda el perfil completo; es un _upsert_, valida antes de escribir |
| `GET`    | `/api/profiles/[id]`                 | Perfil y porcentaje de completitud                                  |
| `GET`    | `/api/profiles/[id]/recommendations` | Vacantes ordenadas por puntaje para ese perfil                      |
| `GET`    | `/api/vacancies`                     | Catálogo de vacantes                                                |
| `GET`    | `/api/vacancies/[id]`                | Detalle de una vacante con sus requisitos                           |
| `GET`    | `/api/applications`                  | Postulaciones del candidato                                         |
| `POST`   | `/api/applications`                  | Crea una postulación                                                |
| `PATCH`  | `/api/applications/[id]`             | Mueve la postulación de estado                                      |
| `DELETE` | `/api/applications/[id]`             | Retira la postulación                                               |

### Demostración pedida por la guía

- **Una lista con registros de la base de datos y una acción por registro:** `/jobs` muestra las
  20 vacantes sembradas, leídas de la tabla `vacancies` y ordenadas por el puntaje que calcula el
  dominio. Cada fila abre el detalle de su vacante, y desde allí el botón _Apply_ crea la
  postulación. El tablero de `/applications` es el caso más completo: cada tarjeta lleva sus
  propias acciones de mover y retirar.
- **Un formulario que manipule datos:** el asistente de `/onboarding` cubre las tres operaciones
  que pide la guía. **Inserción y actualización:** guarda el perfil contra `POST /api/profiles`,
  que valida campo por campo antes de escribir y resuelve como _upsert_. **Borrado:** desde
  `/applications` se retira una postulación con `DELETE`. El mismo tablero además cambia el estado
  de una postulación respetando las transiciones permitidas por el dominio.

### Estado de la implementación

Las pruebas del dominio pasan: 45 pruebas en tres archivos, más `typecheck` limpio en los cinco
paquetes.

{PENDIENTE: justificar el porcentaje del reto implementado}

**Capturas de las funcionalidades:** {PENDIENTE: images/6-*.png}

---

## Conclusiones y lecciones aprendidas

{PENDIENTE: conclusiones y lecciones del Sprint 2, escritas por el equipo}

---

## Referencias y fuentes

{PENDIENTE: fuentes consultadas durante el sprint}

{PENDIENTE: herramientas de IA utilizadas y los _prompts_ con los que se usaron}

- Microsoft. _Architectural Patterns and Styles_. <http://msdn.microsoft.com/en-us/library/ee658117.aspx>
- Lucidchart. _Qué es un diagrama entidad-relación_. <https://www.lucidchart.com/pages/es/que-es-un-diagrama-entidad-relacion>
- Decisión de arquitectura del equipo: [`docs/adr/0001-backend-choice.md`](../../../adr/0001-backend-choice.md)

---

<p align="center">
  <em>Universidad EAFIT — Departamento de Informática y Sistemas — Ingeniería de Software</em>
</p>
