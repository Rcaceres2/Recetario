const clave = (texto) => texto.trim().toLowerCase();

function contarIngredientes(receta) {
  return receta.ingredientes.filter((i) => i.nombre.trim() !== '').length;
}

function contarPasos(receta) {
  return receta.pasos.length;
}

function contarPalabras(texto) {
  if (!texto) return 0;
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

function ingredientesComunes(a, b) {
  const setB = new Set(b.ingredientes.map((i) => clave(i.nombre)));
  const vistos = new Set();
  const comunes = [];
  for (const ing of a.ingredientes) {
    const k = clave(ing.nombre);
    if (setB.has(k) && !vistos.has(k)) {
      vistos.add(k);
      comunes.push(ing.nombre); 
    }
  }
  return comunes;
}

function ingredientesExclusivos(a, b) {
  const setA = new Set(a.ingredientes.map((i) => clave(i.nombre)));
  const setB = new Set(b.ingredientes.map((i) => clave(i.nombre)));
  const soloA = [...new Set(a.ingredientes
    .filter((i) => !setB.has(clave(i.nombre)))
    .map((i) => i.nombre))];
  const soloB = [...new Set(b.ingredientes
    .filter((i) => !setA.has(clave(i.nombre)))
    .map((i) => i.nombre))];
  return { soloA, soloB };
}

function etiquetasComunes(a, b) {
  const setB = new Set(b.etiquetas.map(clave));
  return [...new Set(a.etiquetas.filter((t) => setB.has(clave(t))))];
}

function similitud(a, b) {
  const setA = new Set(a.ingredientes.map((i) => clave(i.nombre)));
  const setB = new Set(b.ingredientes.map((i) => clave(i.nombre)));
  const comunes = [...setA].filter((k) => setB.has(k)).length;
  const distintos = new Set([...setA, ...setB]).size;
  if (distintos === 0) return 0;
  return Math.round((comunes / distintos) * 100);
}

function recetaMasSencilla(a, b) {
  const cmp = (x, y) => (x < y ? -1 : x > y ? 1 : 0);

  let r = cmp(contarIngredientes(a), contarIngredientes(b));
  if (r !== 0) return r < 0 ? 'A' : 'B';

  r = cmp(contarPasos(a), contarPasos(b));
  if (r !== 0) return r < 0 ? 'A' : 'B';

  r = cmp(contarPalabras(a.instrucciones), contarPalabras(b.instrucciones));
  if (r !== 0) return r < 0 ? 'A' : 'B';

  return 'empate';
}

function compararRecetas(a, b) {
  const { soloA, soloB } = ingredientesExclusivos(a, b);
  return {
    ingredientes: { A: contarIngredientes(a), B: contarIngredientes(b) },
    pasos: { A: contarPasos(a), B: contarPasos(b) },
    palabras: { A: contarPalabras(a.instrucciones), B: contarPalabras(b.instrucciones) },
    categoria: { A: a.categoria, B: b.categoria, coinciden: a.categoria === b.categoria },
    origen: { A: a.origen, B: b.origen, coinciden: a.origen === b.origen },
    etiquetasComunes: etiquetasComunes(a, b),
    video: { A: a.video !== '', B: b.video !== '' },
    ingredientesComunes: ingredientesComunes(a, b),
    exclusivos: { soloA, soloB },
    similitud: similitud(a, b),
    masSencilla: recetaMasSencilla(a, b), 
  };
}