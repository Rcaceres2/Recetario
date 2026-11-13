const cache = (() => {
  const recetasPorId = new Map();  
  let categorias = null;           
  let origenes = null;              
  let ingredientes = null;          

  return {
    obtenerReceta(id) {
      return recetasPorId.get(id) || null;
    },
    guardarReceta(receta) {
      if (receta && receta.id) recetasPorId.set(receta.id, receta);
    },
    tieneReceta(id) {
      return recetasPorId.has(id);
    },

    getCategorias() { return categorias; },
    setCategorias(lista) { categorias = lista; },

    getOrigenes() { return origenes; },
    setOrigenes(lista) { origenes = lista; },

    getIngredientes() { return ingredientes; },
    setIngredientes(lista) { ingredientes = lista; },
  };
})();