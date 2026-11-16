<p align="center">
  <img src="images/logo.png" alt="Moonlight" width="130" />
</p>

<h1 align="center">Desarrollo del Sistema Profile Manager</h1>

<p align="center">
  <strong>Nombre del Producto:</strong> Moonlight<br />
  <strong>Equipo de trabajo:</strong> Pablo Manjarres, Valentina Barbosa<br />
  <strong>Versión:</strong> 3.0
</p>

<p align="center">
  <em>Universidad EAFIT — Departamento de Informática y Sistemas — Ingeniería de Software</em><br />
  <em>Entrega 3: Producto funcional</em>
</p>

---

## Contenido

- [Sección 1. Aspectos generales de la entrega](#sección-1-aspectos-generales-de-la-entrega)
- [Sección 2. Evaluación del Sprint anterior](#sección-2-evaluación-del-sprint-anterior)
- [Sección 3. Planificación del Sprint actual](#sección-3-planificación-del-sprint-actual)
- [Sección 4. Aspectos estructurales y arquitectónicos de la solución](#sección-4-aspectos-estructurales-y-arquitectónicos-de-la-solución)
- [Sección 5. Principios de diseño](#sección-5-principios-de-diseño)
- [Sección 6. Patrones de diseño](#sección-6-patrones-de-diseño)
- [Sección 7. Funcionalidad y demostración](#sección-7-funcionalidad-y-demostración)
- [Conclusiones y lecciones aprendidas](#conclusiones-y-lecciones-aprendidas)
- [Referencias](#referencias)

---

## Sección 1. Aspectos generales de la entrega

### Introducción

{PENDIENTE: la problemática, la propuesta de solución, lo desarrollado en el curso y qué contiene
este documento, escrito por el equipo}

### Aporte de cada integrante

| Integrante        | Aporte en la Entrega 3                                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pablo Manjarres   | Rediseño de la interfaz, luna 3D, registro de actividades (patrón Observer), arquitectura y principios (secciones 4 a 6), código y pruebas         |
| Valentina Barbosa | {PENDIENTE: retrospectiva, planificación y sus evidencias, diagramas de clases de implementación y de despliegue, capturas, conclusiones, fuentes} |

La demostración y la sustentación son de ambos.

---

## Sección 2. Evaluación del Sprint anterior

**Técnica de la retrospectiva:** {PENDIENTE}

**Acciones de mejora:** {PENDIENTE: lista de acciones frente a los problemas del Sprint 2}

**Evidencia de la retrospectiva:** {PENDIENTE: images/2-retrospectiva.png}

**Reuniones con el Líder Técnico y el PO:** {PENDIENTE: images/2-reunion.png}

**Daily o weekly del equipo:** {PENDIENTE: images/2-semanal.png}

---

## Sección 3. Planificación del Sprint actual

### Trabajo construido en el Sprint 3

| Cambio                                                                      | Impacto en la arquitectura                                                                      |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Registro de actividades de las postulaciones                                | Nueva tabla `application_events` y una clase `ApplicationEvents` en el dominio (Observer)       |
| Interfaz rediseñada con la paleta y la tipografía de magneto365, en español | Tailwind CSS reemplaza la hoja de estilos propia; los tokens de diseño viven en un solo archivo |
| Luna 3D interactiva: la fase muestra la completitud, las vacantes orbitan   | three.js y react-three-fiber en el cliente; modelos de NASA servidos como archivos estáticos    |
| Ordenamiento de vacantes por match, salario o empresa                       | Comparadores intercambiables (Strategy) en la lista de vacantes                                 |
| Sin pantalla de registro: la aplicación abre en el perfil de demostración   | Se retira `POST /api/candidates`; el inicio de sesión no se evalúa en esta entrega              |
| Se retira el servicio Express de la PoC, como decidió el ADR 0001           | Un solo proceso de aplicación                                                                   |

### Historias priorizadas

{PENDIENTE: historias del Sprint 3 con sus puntos de _planning poker_ y su impacto}

### Ceremonias

- **Planning con _poker planning_:** {PENDIENTE: images/3-planning-poker.png}
- **Sprint backlog en el tablero:** {PENDIENTE: images/3-sprint-backlog.png y el link de la vista}

---

## Sección 4. Aspectos estructurales y arquitectónicos de la solución

### Arquitectura propuesta

Moonlight es una aplicación web en capas sobre un monorepo. Next.js 15 con App Router sirve tanto
las páginas como la API: cada carpeta de `apps/web/app/` es una ruta, los componentes de servidor
leen la base de datos a través de `apps/web/lib/queries.ts`, y los _route handlers_ de
`apps/web/app/api/` exponen la misma información como JSON. Debajo hay tres paquetes con una regla
de dependencia en un solo sentido: `packages/core` contiene las reglas de negocio y solo importa
`packages/types`; `packages/db` contiene todo el SQL; `apps/web` usa los tres. Así el motor de
puntaje se prueba sin base de datos y sin servidor.

| Resumen de la arquitectura |                                                                                                                                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tipo Aplicación**        | Web                                                                                                                                                                                                                                               |
| **Estilo Arquitectónico**  | **Layered** (dominio, acceso a datos, aplicación). **Component-Based** (cada capa es un paquete con frontera propia). **Client/Server, 3-Tiers** (navegador → servidor Next.js → PostgreSQL). Se descartan SOA y Message Bus: es un solo servicio |
| **Lenguaje programación**  | TypeScript sobre Node.js 22                                                                                                                                                                                                                       |
| **Aspectos técnicos**      | PostgreSQL 17 en Docker; migraciones _forward-only_; sub-objetos del perfil en `JSONB`; la aplicación no arranca sin `DATABASE_URL`; modelos 3D en formato glTF                                                                                   |
| **Frameworks**             | Next.js 15 y React 19; Tailwind CSS 4; three.js con react-three-fiber; Turborepo y pnpm _workspaces_; Vitest                                                                                                                                      |

### Vista Lógica — Diagrama de Clases de Implementación

{PENDIENTE: images/4-clases-implementacion.png, dibujado por el equipo}

Lo que el diagrama debe mostrar, tal como está en el código:

- `ApplicationEvents` (`packages/core/src/activity.ts`): atributo `listeners`, métodos
  `subscribe(listener)` y `publish(event)`.
- Las reglas del dominio en `packages/core/src/index.ts`: `scoreVacancy`, `rankVacancies`,
  `profileCompleteness`, `marketGaps`, `canMove` y la tabla `ALLOWED_MOVES`.
- Los repositorios de `packages/db/src/repositories/`: perfiles, vacantes, postulaciones y eventos.
- Los tipos de `packages/types`: `Profile`, `Vacancy`, `Application`, `ApplicationEvent`,
  `ScoreResult`.
- Los _route handlers_ de `apps/web/app/api/` y la fachada `apps/web/lib/queries.ts`.

### Vista Física — Diagrama de Despliegue

{PENDIENTE: images/4-despliegue.png, dibujado por el equipo}

| Nodo / Proceso                  | Contenido                                                                       | Comunicación                                               |
| ------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Navegador del candidato         | Interfaz React; escena WebGL de la luna                                         | HTTP al mismo origen; descarga los `.glb` de `/models`     |
| Servidor de aplicación          | Proceso Next.js 15 en Node.js 22: páginas, _route handlers_ y archivos públicos | TCP/SQL contra PostgreSQL                                  |
| Contenedor `moonlight-postgres` | PostgreSQL 17 con volumen persistente `moonlight-pgdata`                        | Puerto `5433` del anfitrión hacia el `5432` del contenedor |

### Persistencia

El motor es PostgreSQL 17. Es relacional porque el dominio lo es: una postulación une un perfil
con una vacante, los requisitos pertenecen a una vacante, y las restricciones `CHECK`, `UNIQUE` y
las llaves foráneas cuidan esas reglas en la base de datos. Los sub-objetos del perfil van en
`JSONB` porque se leen y se escriben completos.

| Tabla                  | Llaves y restricciones                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| `vacancies`            | PK `id`; `work_mode` en `remote`, `hybrid` u `onsite`                                                      |
| `vacancy_requirements` | PK (`vacancy_id`, `skill`); FK a `vacancies` en cascada; `kind` en `must-have` o `nice-to-have`            |
| `profiles`             | PK `id`; `email` único; habilidades, experiencia, educación y expectativas en `JSONB`                      |
| `applications`         | PK `id`; FK a `profiles` y `vacancies`; único (`profile_id`, `vacancy_id`); `status` en los cuatro estados |
| `application_events`   | PK `id`; FK a `profiles` y `vacancies`; `application_id` sin FK para que el historial sobreviva al retiro  |

{PENDIENTE: images/4-entidad-relacion.png, el diagrama E-R actualizado con `application_events`}

---

## Sección 5. Principios de diseño

### 5.1. Principios SOLID

| Principio                 | En Moonlight                                                                                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Single Responsibility** | Cada repositorio de `packages/db/src/repositories/` toca una sola tabla; `scoreVacancy` solo puntúa y `describeEvent` solo redacta la línea del historial            |
| **Open/Closed**           | Un campo nuevo de completitud es una fila más en `COMPLETENESS_FIELDS`; un orden nuevo de vacantes es una entrada más en `SORTS`. Ninguna función cambia             |
| **Liskov Substitution**   | Todo oyente de `ApplicationEvents` cumple el mismo contrato `(event) => void \| Promise<void>`; el que guarda en la base y uno de prueba se intercambian sin cambios |
| **Interface Segregation** | Los formateadores de `apps/web/lib/format.ts` piden `Pick<Vacancy, ...>`: solo los campos que usan, no la vacante completa                                           |
| **Dependency Inversion**  | `packages/core` no depende de la base de datos; las rutas publican eventos sin saber quién los escucha, y el oyente se conecta en `apps/web/lib/events.ts`           |

### 5.2. Patrones GRASP

| Patrón                     | En Moonlight                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Bajo Acoplamiento**      | `packages/core` importa únicamente `packages/types`                                                                |
| **Alta Cohesión**          | Cada paquete agrupa una sola cosa: reglas, SQL, tipos o interfaz                                                   |
| **Experto**                | `profileCompleteness` y `scoreVacancy` viven junto a los datos del perfil y la vacante que necesitan               |
| **Creador**                | `createApplication` crea la postulación y `publish` en `apps/web/lib/events.ts` crea el evento con su id y su hora |
| **Controlador**            | Cada _route handler_ de `apps/web/app/api/` recibe la petición, valida y delega en el dominio y el repositorio     |
| **Polimorfismo**           | `SORTS` y `WEIGHTS` eligen el comportamiento por llave en lugar de cadenas de `if`                                 |
| **Fabricación Pura**       | `apps/web/lib/queries.ts` y los repositorios no son del dominio: existen para separar responsabilidades            |
| **Indirección**            | `ApplicationEvents` se interpone entre las rutas que cambian una postulación y el registro de actividades          |
| **Variaciones protegidas** | `parseProfile` reconstruye todo perfil que llega por HTTP; `@moonlight/db` oculta el driver `pg` al resto          |

### 5.3. Clean Code

- **Nombres que dicen qué hacen:** `comparisonBlockers`, `topGaps`, `canMove`, `describeEvent`.
- **Funciones puras y pequeñas** en el dominio: mismas entradas, mismo resultado, sin E/S.
- **Una sola fuente para cada regla:** las etiquetas de estado, los pesos y los campos de
  completitud se definen una vez en `packages/core` y la interfaz los importa.
- **Errores explícitos:** las rutas responden 400, 404 o 409 con un mensaje, y la aplicación se
  detiene al iniciar si falta `DATABASE_URL`.
- **Pruebas del dominio:** 83 pruebas en `packages/core/tests` que corren sin base de datos.

---

## Sección 6. Patrones de diseño

### Observer

|                           |                                                                                                                                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nombre del patrón**     | Observer                                                                                                                                                                                                                     |
| **Clasificación**         | Comportamiento                                                                                                                                                                                                               |
| **Intención**             | Que el registro de actividades reaccione a cada cambio de una postulación sin que las rutas sepan que existe                                                                                                                 |
| **Aplicabilidad**         | Un cambio debe disparar efectos secundarios que pueden crecer (historial hoy, notificaciones mañana)                                                                                                                         |
| **Estructura**            | {PENDIENTE: images/6-observer.png}                                                                                                                                                                                           |
| **Participantes**         | Sujeto: `ApplicationEvents`. Oyente: la función que llama `recordEvent`. Evento: `ApplicationEvent`                                                                                                                          |
| **Colaboraciones**        | La ruta cambia la postulación y llama `publish`; el sujeto avisa a cada oyente; el oyente guarda la fila en `application_events`                                                                                             |
| **Consecuencias**         | (+) agregar un efecto es suscribir un oyente; un oyente que falla no tumba la petición. (−) el flujo es menos evidente al leer la ruta                                                                                       |
| **Implementación**        | `publish` usa `Promise.allSettled` y devuelve los fallos para registrarlos en el log                                                                                                                                         |
| **Código de ejemplo**     | [`packages/core/src/activity.ts`](https://github.com/pablomanjarres/Magneto/blob/main/packages/core/src/activity.ts), [`apps/web/lib/events.ts`](https://github.com/pablomanjarres/Magneto/blob/main/apps/web/lib/events.ts) |
| **Usos conocidos**        | Los eventos del DOM (`addEventListener`) y `EventEmitter` de Node.js                                                                                                                                                         |
| **Patrones relacionados** | Mediator, Publish/Subscribe                                                                                                                                                                                                  |

### Strategy

|                           |                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Nombre del patrón**     | Strategy                                                                                                                           |
| **Clasificación**         | Comportamiento                                                                                                                     |
| **Intención**             | Cambiar el orden de la lista de vacantes sin tocar el código que filtra y pagina                                                   |
| **Aplicabilidad**         | Varias formas de resolver lo mismo (ordenar) elegidas por el usuario en tiempo de ejecución                                        |
| **Estructura**            | {PENDIENTE: images/6-strategy.png}                                                                                                 |
| **Participantes**         | Contexto: la lista en `VacancyFilters`. Estrategias: los comparadores `match`, `salary` y `company` de `SORTS`                     |
| **Colaboraciones**        | El selector "Ordenar por" guarda una llave; la lista llama `sort(SORTS[llave])`                                                    |
| **Consecuencias**         | (+) un orden nuevo es una línea. (−) cada estrategia debe respetar el mismo contrato de comparación                                |
| **Implementación**        | Un `Record<SortKey, comparador>` tipado: el compilador exige una estrategia por llave                                              |
| **Código de ejemplo**     | [`apps/web/app/jobs/VacancyFilters.tsx`](https://github.com/pablomanjarres/Magneto/blob/main/apps/web/app/jobs/VacancyFilters.tsx) |
| **Usos conocidos**        | `Array.prototype.sort` con comparador; los ordenamientos de cualquier portal de empleo                                             |
| **Patrones relacionados** | State, Template Method                                                                                                             |

### Repository

|                           |                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Nombre del patrón**     | Repository                                                                                                               |
| **Clasificación**         | Estructura (patrón de arquitectura de acceso a datos)                                                                    |
| **Intención**             | Que el resto de la aplicación pida perfiles, vacantes y postulaciones sin escribir SQL                                   |
| **Aplicabilidad**         | Una capa de dominio que no debe conocer la base de datos                                                                 |
| **Estructura**            | {PENDIENTE: images/6-repository.png}                                                                                     |
| **Participantes**         | Repositorios de `packages/db/src/repositories/`; entidades de `packages/types`; el _pool_ de conexiones                  |
| **Colaboraciones**        | La ruta llama `getProfile` o `listVacancies`; el repositorio consulta y convierte las filas en objetos del dominio       |
| **Consecuencias**         | (+) todo el SQL en un paquete; cambiar el motor no toca el dominio. (−) una capa más entre la ruta y la tabla            |
| **Implementación**        | Funciones con consultas parametrizadas y un convertidor fila→entidad por tabla (`toVacancy`, `toApplication`, `toEvent`) |
| **Código de ejemplo**     | [`packages/db/src/repositories/`](https://github.com/pablomanjarres/Magneto/tree/main/packages/db/src/repositories)      |
| **Usos conocidos**        | Spring Data, Doctrine, Entity Framework                                                                                  |
| **Patrones relacionados** | Data Mapper, Facade                                                                                                      |

### Facade

|                           |                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Nombre del patrón**     | Facade                                                                                                                             |
| **Clasificación**         | Estructura                                                                                                                         |
| **Intención**             | Dar a las páginas una sola puerta para leer datos y a la interfaz una sola puerta para escribir                                    |
| **Aplicabilidad**         | Varias páginas necesitan la misma combinación de repositorios y reglas del dominio                                                 |
| **Estructura**            | {PENDIENTE: images/6-facade.png}                                                                                                   |
| **Participantes**         | Fachadas: `apps/web/lib/queries.ts` (lectura) y `apps/web/lib/client.ts` (escritura). Subsistemas: repositorios, dominio y API     |
| **Colaboraciones**        | El panel llama `loadRanked(profile)`, que trae las vacantes, las puntúa y calcula las brechas en una sola llamada                  |
| **Consecuencias**         | (+) las páginas solo componen; la consulta no se copia por ruta. (−) la fachada crece si se le agregan casos que no comparten nada |
| **Implementación**        | Funciones exportadas que combinan repositorios con funciones puras de `packages/core`                                              |
| **Código de ejemplo**     | [`apps/web/lib/queries.ts`](https://github.com/pablomanjarres/Magneto/blob/main/apps/web/lib/queries.ts)                           |
| **Usos conocidos**        | `fetch` sobre la pila HTTP; los SDK de servicios en la nube                                                                        |
| **Patrones relacionados** | Repository, Mediator                                                                                                               |

### State

|                           |                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nombre del patrón**     | State (dirigido por tabla)                                                                                                                 |
| **Clasificación**         | Comportamiento                                                                                                                             |
| **Intención**             | Que una postulación solo pueda moverse a los estados permitidos desde el estado en que está                                                |
| **Aplicabilidad**         | Un objeto con pocos estados y transiciones fijas                                                                                           |
| **Estructura**            | {PENDIENTE: images/6-state.png}                                                                                                            |
| **Participantes**         | Estados: `applied`, `in-review`, `interview`, `rejected`. Tabla de transiciones: `ALLOWED_MOVES`. Guardia: `canMove`                       |
| **Colaboraciones**        | El tablero muestra solo los movimientos de `ALLOWED_MOVES`; la ruta `PATCH` vuelve a validar con `canMove` y responde 409 si no se permite |
| **Consecuencias**         | (+) la tabla se lee y se prueba de un vistazo. (−) estados con comportamiento propio pedirían clases por estado                            |
| **Implementación**        | Un `Record<ApplicationStatus, ApplicationStatus[]>` en el dominio, compartido por la interfaz y la API                                     |
| **Código de ejemplo**     | [`packages/core/src/index.ts`](https://github.com/pablomanjarres/Magneto/blob/main/packages/core/src/index.ts)                             |
| **Usos conocidos**        | Flujos de pedidos y de tickets en sistemas de gestión                                                                                      |
| **Patrones relacionados** | Strategy                                                                                                                                   |

---

## Sección 7. Funcionalidad y demostración

**Repositorio:** https://github.com/pablomanjarres/Magneto

### Árbol de directorios

```
moonlight/
├── apps/
│   └── web/
│       ├── app/            # páginas: dashboard, jobs, applications, onboarding, profile
│       │   └── api/        # route handlers: la API HTTP
│       ├── components/     # piezas reutilizables y la escena 3D (moon/)
│       ├── lib/            # fachadas de lectura y escritura, y el bus de eventos
│       └── public/models/  # modelos 3D de NASA (.glb)
├── packages/
│   ├── core/               # dominio: puntaje, completitud, brechas, estados, eventos
│   ├── db/                 # SQL: migraciones, semilla y repositorios
│   └── types/              # tipos compartidos
├── data/                   # 20 vacantes y el perfil de demostración
├── docs/                   # entregas, ADR, diagramas
└── infra/                  # PostgreSQL 17 en Docker
```

### Código de ejemplo por capa

Dominio, `packages/core/src/index.ts`:

```ts
export function canMove(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return ALLOWED_MOVES[from].includes(to);
}
```

Acceso a datos, `packages/db/src/repositories/applications.ts`:

```ts
const { rows } = await pool.query<ApplicationRow>(
  "UPDATE applications SET status = $2, updated_at = now() WHERE id = $1 RETURNING *",
  [id, status],
);
```

API, `apps/web/app/api/applications/[id]/route.ts`:

```ts
const application = await updateApplicationStatus(id, body.status);
await record(application, "moved", `${current.status}→${application.status}`);
return Response.json({ application });
```

### Historias de usuario demostradas

| HU       | Historia                                          | Dónde se ve                                                                                  |
| -------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| #11, #16 | Guardar mi perfil y ver qué tan completo está     | `/onboarding`: el asistente guarda el perfil y la luna se llena mientras se completan campos |
| #23, #24 | Ver mi puntaje y las vacantes ordenadas por match | `/jobs` y `/jobs/[id]`; en el panel, las mejores vacantes orbitan la luna                    |
| #30, #43 | Seguir mis postulaciones y anotar el próximo paso | `/applications`: tablero de cuatro estados, próximo paso y registro de actividades           |

### Demostración pedida por la guía

- **Lista con registros de la base de datos y una acción por registro:** el tablero de
  `/applications` lee la tabla `applications`; cada tarjeta se mueve de estado o se retira.
- **Formulario lanzado desde la lista que manipula datos:** "Editar próximo paso" actualiza con
  `PATCH /api/applications/[id]`, "Retirar" borra con `DELETE` y "Postularme", en el detalle de una
  vacante, inserta con `POST /api/applications`. Cada acción queda en "Actividad reciente".
- El inicio de sesión no se evalúa en esta entrega: la aplicación abre directo en el perfil.

**Capturas:** {PENDIENTE: images/7-panel.png, 7-vacantes.png, 7-detalle.png, 7-postulaciones.png,
7-asistente.png}

---

## Conclusiones y lecciones aprendidas

{PENDIENTE: síntesis del documento, aportes, hallazgos y dificultades de esta fase, escrita por el
equipo}

---

