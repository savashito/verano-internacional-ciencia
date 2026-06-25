let mentores = [];
let estudiantes = [];
let investigaciones = [];
let mapaInteractivo = { estados: [] };

async function cargarDatos() {
  const [mRes, eRes, iRes] = await Promise.all([
    fetch('data/mentores.json'),
    fetch('data/estudiantes.json'),
    fetch('data/investigaciones.json'),
  ]);

  mentores = await mRes.json();
  estudiantes = await eRes.json();
  investigaciones = await iRes.json();

  mapaInteractivo = generarMapaInteractivo();
}

function generarMapaInteractivo() {
  const porEstado = {};

  investigaciones.forEach((inv) => {
    const estudiante = estudiantes.find((e) => e.id === inv.student_id);
    if (!estudiante) return;

    const estado = estudiante.estado;
    if (!porEstado[estado]) {
      porEstado[estado] = [];
    }

    const mentor = mentores.find((m) => m.id === inv.mentor_id);

    porEstado[estado].push({
      investigacion: inv.nombre,
      descripcion: inv.descripcion,
      ano: inv.ano,
      poster: inv.poster,
      estudiante: estudiante.nombre,
      comunidad_indigena: estudiante.comunidad_indigena || '',
      universidad: estudiante.universidad,
      interes: estudiante.interes,
      mentor: mentor ? mentor.nombre : 'N/A',
      disciplina: mentor ? mentor.disciplina : 'N/A',
    });
  });

  return {
    estados: Object.entries(porEstado).map(([nombre, researches]) => ({
      nombre,
      researches,
    })),
  };
}

function obtenerDatosEstado(nombreEstado) {
  const entry = mapaInteractivo.estados.find(
    (e) => normalizarEstado(e.nombre) === normalizarEstado(nombreEstado)
  );
  return entry ? entry.researches : [];
}

function contarEstudiantes(nombreEstado) {
  return estudiantes.filter(
    (e) => normalizarEstado(e.estado) === normalizarEstado(nombreEstado)
  ).length;
}

function normalizarEstado(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
