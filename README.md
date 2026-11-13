# [The mealDB - Recetario]


Aplicación Web de Página Única (SPA) desarrollada íntegramente con **HTML5, CSS3 y JavaScript puro (Vanilla JS)** bajo una arquitectura modular basada en **componentes** (pseudocomponentes orientados a objetos). La aplicación consume la API pública [TheMealDB](https://www.themealdb.com/) para buscar, filtrar, visualizar detalles y comparar recetas de cocina en tiempo de ejecución.

---

---

## Características Principales

La aplicación cuenta con **5 vistas dinámicas** construidas mediante la composición de componentes reutilizables, manteniendo el estado de navegación sin recargar el navegador:

- **Inicio:** Muestra una receta destacada aleatoria (sin repeticiones consecutivas) y el catálogo completo de categorías cargados de forma independiente.
- **Explorar con Filtros Combinados:** Búsqueda por nombre, categoría, origen (cocina) e ingrediente (con autocompletado). Combina criterios mediante **intersección lógica**, ordena alfabéticamente e incluye paginación en cliente (12 recetas por página) con resolución de detalles bajo demanda.
- **Detalle de Receta:** Visualización completa con ingredientes (e imagen de respaldo ante fallos de carga), instrucciones limpias paso a paso, etiquetas normalizadas, enlace a YouTube y dos secciones de recetas relacionadas (por categoría y por origen).
- **Categorías y Orígenes:** Navegación por pestañas para explorar el catálogo agrupado por tipo de plato o región geográfica.
- **Comparador de Recetas (A vs. B):** Permite enfrentar dos recetas distintas (mediante buscador interno con *debounce* y cancelación de peticiones o agregándolas desde cualquier vista), calculando métricas como ingredientes en común/exclusivos, porcentaje de similitud y veredicto automático de **receta más sencilla**.

---

## Uso de Componentes

Toda la interfaz de usuario está diseñada como una composición de **componentes propios (pseudocomponentes)** implementados con clases de JavaScript, sin utilizar Web Components nativos (`customElements.define`) ni Shadow DOM.

- **Uso de Encapsulamiento:** Cada componente gestiona su propio contenedor, estado interno, renderizado y listeners, utilizando métodos públicos controlados (como `setEstado()`, `setValores()`, `setPagina()` o `setReceta()`) etc.
- **Reutilización:** Componentes clave como `TarjetaReceta`, `PanelComparador`, `Paginador` y `EstadoCarga` se instancian múltiples veces en distintas vistas con diferentes propiedades y conjuntos de datos.
- **Desacoplamiento:** Los componentes no manipulan el DOM interno de otros componentes; la comunicación se realiza mediante eventos personalizados (`CustomEvent`) y funciones *callback* inyectadas a través de `props`.

##  Restricciones

- **HTML5 Semántico:** Unico punto de entrada (`index.html`) con contenedores dinámicos donde se montan las vistas y componentes para el proyecto.
- **CSS3 Moderno (Diseño Propio):** Maquetación responsiva con **CSS Grid** y **Flexbox**, transiciones entre vistas, *skeleton loaders* contextuales y estados `:hover` / `:focus-visible` accesibles, sin frameworks externos.
- **Vanilla JavaScript (ES6+):**
  - libre de librerías o frameworks externos en su totalidad.
  - No hay persistencia en navegador (`localStorage`, `sessionStorage` o cookies); todo el estado se encuentra en memoria durante la sesión.
  - Seguridad contra XSS: todos los datos que provienen de la API se inyectan mediante `textContent` o atributos seguros, reservando `innerHTML` exclusivamente para estructuras estáticas.
  - Sin uso de `alert()`, `confirm()` o `prompt()`.

---

## Estructura del Proyecto

Los scripts se cargan de forma ordenada en `index.html` respetando la jerarquía de dependencias (servicios -> componentes -> vistas -> controlador principal):

```text
/[nombre-del-repo]
├── index.html                      # Estructura base (navbar y contenedor de vistas)
├── README.md                       # Documentación técnica del proyecto
├── css/
│   └── styles.css                  # Variables, layout responsivo, animaciones y temas
└── js/
    ├── servicios/
    │   ├── api.js                  # Cliente HTTP centralizado y manejo de errores
    │   ├── cache.js                # Caché en memoria (Map) para recetas y catálogos
    │   ├── recetas.js              # Normalización (ingredientes 1..20, pasos, tags)
    │   └── comparacion.js          # Lógica de intersección y cálculo de métricas
    ├── componentes/
    │   ├── BarraNavegacion.js      # Menú permanente y contador dinámico del comparador
    │   ├── TarjetaReceta.js        # Tarjeta reutilizable (completa e incompleta)
    │   ├── Paginador.js            # Control de paginación en cliente (12 items/pág)
    │   ├── FormularioBusqueda.js   # Filtros combinables y sugerencias de ingredientes
    │   ├── ListaIngredientes.js    # Renderizado de ingredientes con fallback de imagen
    │   ├── PasosPreparacion.js     # Formateo numerado de instrucciones
    │   ├── PanelComparador.js      # Panel individual (A/B) con buscador interno
    │   ├── TablaComparacion.js     # Matriz comparativa y cálculo de receta más sencilla
    │   └── EstadoCarga.js          # Skeletons, estados vacíos y mensajes de error/reintento
    ├── vistas/
    │   ├── VistaInicio.js
    │   ├── VistaExplorar.js
    │   ├── VistaDetalle.js
    │   ├── VistaCategoriasOrigenes.js
    │   └── VistaComparador.js
    └── app.js                      # Enrutador SPA, gestión de estado global y ciclo de vida
