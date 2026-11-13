const RE_ENCABEZADO = /^\s*(step\s*\d+|\d+[.)]?|paso\s*\d+)\s*[:.]?\s*$/i;

function extraerPasos(strInstructions) {
  if (!strInstructions) return [];
  return strInstructions
    .split(/\r?\n/)                          
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0)    
    .filter((linea) => !RE_ENCABEZADO.test(linea)); 
}

function extraerIngredientes(meal) {
  const ingredientes = [];
  for (let i = 1; i <= 20; i++) {
    const nombre = (meal[`strIngredient${i}`] || '').trim();
    if (!nombre) continue;                    
    const medida = (meal[`strMeasure${i}`] || '').trim();
    ingredientes.push({ nombre, medida });
  }
  return ingredientes;
}

function extraerEtiquetas(strTags) {
  if (!strTags) return [];                    
  return strTags
    .split(',')
    .map((t) => t.trim())                     
    .filter((t) => t.length > 0);             
}

function urlImagenIngrediente(nombre) {
  return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(nombre)}.png`;
}

function normalizarReceta(meal) {
  if (!meal) return null;
  return {
    id: meal.idMeal,
    nombre: meal.strMeal,
    imagen: meal.strMealThumb,
    categoria: meal.strCategory,
    origen: meal.strArea,
    instrucciones: meal.strInstructions || '',
    etiquetas: extraerEtiquetas(meal.strTags),
    ingredientes: extraerIngredientes(meal),
    pasos: extraerPasos(meal.strInstructions),
    video: (meal.strYoutube || '').trim(),     
  };
}

function normalizarResumen(meal) {
  if (!meal) return null;
  return {
    id: meal.idMeal,
    nombre: meal.strMeal,
    imagen: meal.strMealThumb,
  };
}

function normalizarCategoria(c) {
  return {
    id: c.idCategory,
    nombre: c.strCategory,
    imagen: c.strCategoryThumb,
    descripcion: c.strCategoryDescription,
  };
}

function normalizarOrigen(meal) {
  if (!meal || !meal.strArea) return null;
  return { id: meal.strArea, nombre: meal.strArea };
}

function normalizarIngrediente(meal) {
  if (!meal || !meal.strIngredient) return null;
  return { id: meal.strIngredient, nombre: meal.strIngredient };
}
