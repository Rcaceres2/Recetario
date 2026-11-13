const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';

class ErrorApi extends Error {
  constructor(tipo, message, status = null) {
    super(message);
    this.name = 'ErrorApi';
    this.tipo = tipo;
    this.status = status;
  }
}

async function peticion(endpoint, params = {}, opciones = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  let response;

  try {
    response = await fetch(url.toString(), { signal: opciones.signal });

    if (!response.ok) {
      throw new ErrorApi('Error de red', `Error en la respuesta de la API (${response.status})`, response.status);
    }

    try {
      return await response.json();
    } catch {
      throw new ErrorApi('servidor', 'Error al analizar la respuesta JSON de la API', response.status);
    }
  } catch (error) {
    if (error instanceof ErrorApi) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new ErrorApi('AbortError', 'La solicitud fue abortada');
    }

    throw new ErrorApi('Error de red', 'Error al conectar con la API', response?.status ?? null);
  }
}

const api = {
  buscarPorNombre: (nombre, opciones) => peticion('search.php', { s: nombre }, opciones),
  porId: (id, opciones) => peticion('lookup.php', { i: id }, opciones),
  aleatorio: (opciones) => peticion('random.php', {}, opciones),
  categorias: (opciones) => peticion('categories.php', {}, opciones),
  origenes: (opciones) => peticion('list.php', { a: 'list' }, opciones),
  ingredientes: (opciones) => peticion('list.php', { i: 'list' }, opciones),
  filtrarPorCategoria: (categoria, opciones) => peticion('filter.php', { c: categoria }, opciones),
  filtrarPorOrigen: (origen, opciones) => peticion('filter.php', { a: origen }, opciones),
  filtrarPorIngrediente: (ingrediente, opciones) => peticion('filter.php', { i: ingrediente }, opciones),
};

const TIPOS_ERROR = {
  RED: 'Error de red',
  HTTP: 'Error de red',
  SERVIDOR: 'servidor',
  ABORT: 'AbortError',
};

function mensajeErrorApi(error, alternativa = null) {
  if (error?.status) {
    return `El servicio no está disponible (estado ${error.status}).`;
  }
  if (error?.tipo === TIPOS_ERROR.ABORT) return null;
  if (error?.tipo === TIPOS_ERROR.RED) {
    return 'No hay conexión con el servidor. Revisa tu conexión e intenta de nuevo.';
  }
  if (error?.tipo === TIPOS_ERROR.SERVIDOR) {
    return 'La respuesta del servidor no se pudo interpretar. Intenta de nuevo.';
  }
  return alternativa || 'No se pudo cargar la información. Intenta de nuevo.';
}

async function cargarRecetasCompletas(ids) {
  const pendientes = ids.filter((id) => !cache.tieneReceta(id));

  await Promise.allSettled(
    pendientes.map(async (id) => {
      const data = await api.porId(id);
      const receta = normalizarReceta(data?.meals?.[0]);
      if (receta) cache.guardarReceta(receta);
      return receta;
    })
  );

  const resultado = new Map();
  ids.forEach((id) => {
    const receta = cache.obtenerReceta(id);
    if (receta) resultado.set(id, receta);
  });
  return resultado;
}
