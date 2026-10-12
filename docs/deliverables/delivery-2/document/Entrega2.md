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
en [GitHub Projects](https://github.com/users/pablomanjarres/projects/3). Las historias del Sprint 2 se eligieron para superar el 60 % del reto con el menor código
posible. Las demás (autenticación, validación, _rate limiting_, _logging_, la importación desde
LinkedIn y la hoja de vida, y el perfil adaptado) pasan a la Entrega 3.

| HU  | Historia                                    | Puntos | Impacto en la arquitectura                                                 |
| --- | ------------------------------------------- | ------ | -------------------------------------------------------------------------- |
| #12 | Set my target role                          | 3      | Áreas y _seniorities_ como listas del dominio, guardadas en `expectations` |
| #15 | State whether I can relocate                | 2      | Nueva regla de puntaje: −20 fuera de la ciudad si el candidato no se muda  |
| #16 | See how complete my profile is              | 5      | La reubicación pasa a ser opcional en el modelo                            |
| #18 | Browse the available vacancies              | 3      | Regla de paginación en el dominio; la lista carga más sin recargar         |
| #22 | Compare a vacancy against my profile        | 3      | Regla del dominio que bloquea la comparación sin habilidades               |
| #28 | See a summary of the analysis               | 3      | El orden de las brechas vive en un solo lugar del dominio                  |
| #35 | Secrets kept out of the repository          | —      | La aplicación no arranca sin `DATABASE_URL`                                |
| #43 | Write down the next step for an application | 3      | `PATCH` de la postulación acepta la nota; formulario en el tablero         |

Los puntos son la estimación del backlog; los de #35 salen del _planning poker_.

### Ceremonias

- **Planning con _poker planning_:** {PENDIENTE: images/4-planning-poker.png}
- **Daily o weekly del equipo:** {PENDIENTE: images/4-daily.png}
- **Reunión con el PO o el Líder Técnico:** {PENDIENTE: images/4-reunion-po.png}
- **Sprint backlog en el tablero:** {PENDIENTE: images/4-sprint-backlog.png}

---

## Sección 5. Aspectos estructurales y arquitectónicos de la solución

### 5.1. Estilos arquitectónicos usados

|                            |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tipo Aplicación:**       | Web                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Estilo Arquitectónico:** | **Layered (Estructura).** El código está separado en capas con una regla de dependencia en un solo sentido: `core` y `db` dependen sólo de `types`, y `apps` depende de los tres. `packages/core` no importa nada distinto de `packages/types`, de modo que las reglas de negocio no pueden alcanzar la infraestructura. Implicación: el motor de puntaje se prueba sin base de datos y sin servidor.<br><br>**Component-Based (Estructura).** Cada capa es un paquete del monorepo con su propio `package.json`, sus pruebas y su frontera explícita. Implicación: un cambio en el acceso a datos no toca el dominio.<br><br>**Client/Server, 3-Tiers (Implementación).** Navegador → servidor Next.js → PostgreSQL. Tres niveles con responsabilidades separadas: presentación, lógica de aplicación y persistencia. Implicación: la base de datos nunca se expone al cliente.<br><br>_Se descartaron SOA y Message Bus:_ la solución es un único servicio para dos personas, e introducir mensajería añadiría operación sin resolver ningún requisito del reto. |
| **Lenguaje programación**  | TypeScript, sobre Node.js 22                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Aspectos técnicos**      | PostgreSQL 17 como base de datos relacional. Los sub-objetos del perfil (habilidades, experiencia, educación, expectativas) se guardan en columnas `JSONB` porque se leen y escriben completos y nunca se consultan campo por campo. Migraciones _forward-only_: una migración ejecutada no se edita, se agrega la siguiente. Base de datos levantada con Docker Compose. La aplicación no arranca si falta `DATABASE_URL` y lo dice al iniciar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Frameworks**             | Next.js 15 con App Router y React 19 para la interfaz y los _route handlers_; Turborepo y pnpm _workspaces_ para el monorepo; Vitest para las pruebas del dominio; Express en `apps/api` únicamente como evidencia de la PoC de comparación.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

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
  El puntaje es el porcentaje del peso total que el candidato cubre, redondeado. Si el candidato
  dijo que no se muda, una vacante no remota en otra ciudad pierde 20 puntos, y la pantalla lo
  muestra como una línea aparte. La función es
  pura: sin entrada/salida, sin reloj y sin aleatoriedad, por lo que las mismas entradas siempre
  producen el mismo resultado y la pantalla puede explicar el número.
- **Ordenamiento.** Las vacantes se ordenan por puntaje; los empates se rompen por cantidad de
  `must-have` cubiertos y luego por identificador, de modo que el orden nunca oscila. Las vacantes
  sin requisitos no aportan señal y quedan fuera del ranking.
- **Completitud del perfil.** Nueve campos cuentan hacia el 100 %, y el resultado incluye la lista
  exacta de los que faltan, no sólo el porcentaje. Una pregunta sin responder cuenta como faltante.
- **Paginación y resumen.** La lista de vacantes se muestra de a diez, y cada fila resume la razón
  del puntaje y las tres brechas principales, ordenadas por una sola regla del dominio.
- **Brechas de mercado.** Es el diferenciador del producto: las habilidades faltantes se miden
  contra todo el conjunto de vacantes, no contra una sola oferta, e informan cuántas vacantes
  la piden.
- **Máquina de estados de la postulación.** Cuatro estados y una tabla explícita de transiciones
  permitidas: `applied` → `in-review` o `rejected`; `in-review` → `interview` o `rejected`;
  `interview` → `rejected`; `rejected` → `applied`.
- **Frontera del perfil.** Todo perfil que llega por HTTP se reconstruye campo por campo antes de
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
   por requisito y compara habilidad por habilidad en el dominio, así que la normalización paga.
2. **Los sub-objetos del perfil son `JSONB`.** Se leen y se escriben completos, nunca se filtran
   por campo, y separarlos habría significado cuatro tablas más sin ninguna consulta que las
   justifique.

**Diagrama entidad-relación:** {PENDIENTE: images/5-3-diagrama-entidad-relacion.png}

### 5.4. Vista Física — Diagrama de Componentes y Despliegue

En desarrollo corren tres procesos, más la migración y la semilla, que se ejecutan una vez:

| Nodo / Proceso                  | Contenido                                                                                                           | Comunicación                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Navegador del candidato         | Interfaz React 19 renderizada por Next.js                                                                           | HTTP contra el mismo origen; fuentes desde Google Fonts               |
| Servidor de aplicación          | Proceso Next.js 15 sobre Node.js 22: páginas y _route handlers_ bajo `/api`                                         | TCP/SQL contra PostgreSQL                                             |
| Servicio Express (`apps/api`)   | Evidencia de la PoC de comparación, puerto `4000`                                                                   | TCP/SQL contra PostgreSQL                                             |
| Contenedor `moonlight-postgres` | PostgreSQL 17 (imagen `postgres:17-alpine`), volumen persistente `moonlight-pgdata`, `healthcheck` con `pg_isready` | Publica el puerto `5433` del anfitrión hacia el `5432` del contenedor |

El puerto `5433` es deliberado: una instalación nativa de PostgreSQL suele ocupar ya el `5432`, y
`localhost` resolvería hacia ella antes que hacia el contenedor.

En esta entrega el despliegue es local, como lo permite el reto.

**Diagrama de componentes:** {PENDIENTE: images/5-4-diagrama-componentes.png}

**Diagrama de despliegue:** {PENDIENTE: images/5-4-diagrama-despliegue.png}

---

## Sección 6. Avances en cuanto a funcionalidad y demostración

**Repositorio:** https://github.com/pablomanjarres/Magneto

### Árbol de directorios

```
moonlight/
├── apps/
│   ├── agents/     # reservado para el importador de hoja de vida (Entrega 3)
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
importar el acceso a datos aunque alguien lo intente. Las 78 pruebas del proyecto viven todas en
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

- **Una lista con registros de la base de datos y una acción por registro:** el tablero de
  `/applications` muestra las postulaciones leídas de la tabla `applications`, y cada tarjeta lleva
  sus acciones: mover de columna (respetando las transiciones del dominio) y retirar.
- **Un formulario lanzado desde la lista que manipula datos:** cada tarjeta abre "Edit next step",
  que pide el siguiente paso y lo guarda con `PATCH /api/applications/[id]` (**actualización**).
  "Withdraw" la borra con `DELETE` (**borrado**), y "Mark as applied", en el detalle de una vacante,
  crea la postulación con `POST /api/applications` (**inserción**).

### Estado de la implementación

Las pruebas del dominio pasan: 78 pruebas en cuatro archivos, más `typecheck` limpio en los cinco
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
