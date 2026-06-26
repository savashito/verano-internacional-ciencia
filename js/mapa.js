const COLORES_MAPA = {
  0: '#e8e8e8',
  1: '#c6dbef',
  2: '#9ecae1',
  3: '#6baed6',
  4: '#3182bd',
  5: '#08519c',
};

function colorPorCantidad(n) {
  if (n === 0) return COLORES_MAPA[0];
  if (n <= 2) return COLORES_MAPA[1];
  if (n <= 5) return COLORES_MAPA[2];
  if (n <= 9) return COLORES_MAPA[3];
  if (n <= 19) return COLORES_MAPA[4];
  return COLORES_MAPA[5];
}

function inicializarMapa() {
  const svg = document.getElementById('mexico-svg');
  if (!svg) return;

  const tooltip = document.getElementById('map-tooltip');
  const paths = svg.querySelectorAll('path[data-estado]');

  paths.forEach((path) => {
    const estado = path.getAttribute('data-estado');
    const count = contarEstudiantes(estado);
    path.style.fill = colorPorCantidad(count);

    path.addEventListener('mouseenter', (e) => {
      const researches = obtenerDatosEstado(estado);
      const label = `${estado}: ${count} estudiante${count !== 1 ? 's' : ''}, ${researches.length} investigación${researches.length !== 1 ? 'es' : ''}`;
      tooltip.textContent = label;
      tooltip.classList.add('visible');
    });

    path.addEventListener('mousemove', (e) => {
      tooltip.style.left = e.clientX + 12 + 'px';
      tooltip.style.top = e.clientY - 30 + 'px';
    });

    path.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });

    path.addEventListener('click', () => {
      document.querySelectorAll('#mexico-svg path.active').forEach((p) => p.classList.remove('active'));
      path.classList.add('active');
      mostrarDetalle(estado);
    });
  });
}

function mostrarDetalle(estado) {
  const panel = document.getElementById('detail-panel');
  const titulo = document.getElementById('detail-title');
  const cuerpo = document.getElementById('detail-body');

  const datos = obtenerDatosEstado(estado);
  const numEstudiantes = contarEstudiantes(estado);

  titulo.textContent = `${estado} — ${numEstudiantes} estudiante${numEstudiantes !== 1 ? 's' : ''}`;

  if (datos.length === 0) {
    cuerpo.innerHTML = '<p class="detail-empty">No hay investigaciones registradas para este estado.</p>';
  } else {
    let html = `<table>
      <thead>
        <tr>
          <th>Investigación</th>
          <th>Estudiante</th>
          <th>Comunidad</th>
          <th>Mentor</th>
          <th>Año</th>
          <th>Tipo</th>
        </tr>
      </thead>
      <tbody>`;

    datos.forEach((d) => {
      const tipo = d.poster
        ? '<span class="badge badge-poster">Póster</span>'
        : '<span class="badge badge-proyecto">Proyecto</span>';
      html += `<tr>
        <td>
          <strong>${d.investigacion}</strong>
          <br><small style="color:#6c7a89">${d.descripcion}</small>
        </td>
        <td>${d.estudiante}<br><small style="color:#6c7a89">${d.universidad}</small></td>
        <td>${d.comunidad_indigena}</td>
        <td>${d.mentor}${d.mentor_institucion ? '<br><small style="color:#6c7a89">' + d.mentor_institucion + '</small>' : ''}<br><small style="color:#6c7a89">${d.disciplina} · ${d.mentor_pais}</small></td>
        <td>${d.ano}</td>
        <td>${tipo}</td>
      </tr>`;
    });

    html += '</tbody></table>';
    cuerpo.innerHTML = html;
  }

  panel.classList.add('open');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function cerrarDetalle() {
  const panel = document.getElementById('detail-panel');
  panel.classList.remove('open');
  document.querySelectorAll('#mexico-svg path.active').forEach((p) => p.classList.remove('active'));
}
