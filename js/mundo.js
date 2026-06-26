const PAIS_COORDS = {
  'EEUU': { x: 305, y: 131 },
  'UK': { x: 550, y: 84 },
  'Colombia': { x: 365, y: 238 },
  'Perú': { x: 360, y: 281 },
  'Brasil': { x: 425, y: 294 },
  'España': { x: 543, y: 125 },
  'Francia': { x: 555, y: 103 },
  'Alemania': { x: 575, y: 91 },
  'Canadá': { x: 300, y: 78 },
  'Argentina': { x: 390, y: 356 },
  'Chile': { x: 373, y: 353 },
  'Holanda': { x: 563, y: 88 },
  'Japón': { x: 895, y: 138 },
  'Australia': { x: 885, y: 328 },
  'India': { x: 745, y: 181 },
  'Italia': { x: 580, y: 119 },
};

const EEUU_REGION_COORDS = {
  'northeast': { x: 340, y: 115 },
  'southeast': { x: 320, y: 145 },
  'midwest': { x: 300, y: 120 },
  'northwest': { x: 250, y: 100 },
  'southwest': { x: 265, y: 140 },
};

const MEXICO_CENTER = { x: 303, y: 178 };

function coordForConnection(conn) {
  if (conn.pais === 'EEUU' && conn.region) {
    return EEUU_REGION_COORDS[conn.region] || PAIS_COORDS['EEUU'];
  }
  return PAIS_COORDS[conn.pais] || null;
}

const ESTADO_OFFSETS = {
  'San Luis Potosí': { x: 299, y: 180 },
  'Michoacán': { x: 296, y: 189 },
  'Puebla': { x: 305, y: 191 },
  'Chihuahua': { x: 285, y: 161 },
  'Sinaloa': { x: 281, y: 175 },
  'Veracruz': { x: 309, y: 189 },
  'Guerrero': { x: 301, y: 195 },
  'Chiapas': { x: 318, y: 198 },
};

let worldSvgLoaded = false;

async function inicializarMapaMundial() {
  const container = document.getElementById('world-map-wrap');
  if (!container || worldSvgLoaded) return;

  const resp = await fetch('assets/world.svg');
  const svgText = await resp.text();
  container.innerHTML = svgText;

  const svg = container.querySelector('svg');
  svg.setAttribute('id', 'world-svg');
  svg.setAttribute('viewBox', '150 30 550 350');
  svg.style.width = '100%';
  svg.style.height = 'auto';

  svg.querySelectorAll('path[data-country]').forEach((path) => {
    path.setAttribute('fill', '#e4e8ec');
    path.setAttribute('stroke', '#cdd3d9');
    path.setAttribute('stroke-width', '0.3');
    path.style.pointerEvents = 'none';
  });

  const mexPath = svg.querySelector('path[data-country="Mexico"]');
  if (mexPath) {
    mexPath.setAttribute('fill', '#f1948a');
    mexPath.setAttribute('stroke', '#c0392b');
    mexPath.setAttribute('stroke-width', '0.8');
  }

  const conexiones = obtenerConexionesMundiales();
  const tooltip = document.getElementById('map-tooltip');
  const svgNS = 'http://www.w3.org/2000/svg';

  const porPais = {};
  conexiones.forEach((c) => {
    if (!porPais[c.pais]) porPais[c.pais] = [];
    porPais[c.pais].push(c);
  });

  // Highlight mentor countries
  Object.keys(porPais).forEach((pais) => {
    const cp = svg.querySelector(`path[data-country="${paisToEnglish(pais)}"]`);
    if (cp) {
      cp.setAttribute('fill', '#a9cce3');
      cp.setAttribute('stroke', '#5b9bd5');
      cp.setAttribute('stroke-width', '0.6');
    }
  });

  // Draw individual curved lines per connection
  const linesGroup = document.createElementNS(svgNS, 'g');
  linesGroup.setAttribute('id', 'world-lines');

  conexiones.forEach((conn, idx) => {
    const paisCoord = coordForConnection(conn);
    if (!paisCoord) return;

    const estadoCoord = ESTADO_OFFSETS[conn.estado] || MEXICO_CENTER;

    const dx = paisCoord.x - estadoCoord.x;
    const dy = paisCoord.y - estadoCoord.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;
    const arcHeight = Math.max(15, dist * 0.2);

    const midX = (paisCoord.x + estadoCoord.x) / 2;
    const midY = (paisCoord.y + estadoCoord.y) / 2;
    const nx = -dy / dist;
    const ny = dx / dist;
    const offset = arcHeight + idx * 3;
    const cpX = midX + nx * offset;
    const cpY = midY + ny * offset - arcHeight * 0.2;

    const d = `M${estadoCoord.x},${estadoCoord.y} Q${cpX.toFixed(1)},${cpY.toFixed(1)} ${paisCoord.x},${paisCoord.y}`;

    const line = document.createElementNS(svgNS, 'path');
    line.setAttribute('d', d);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', '#2a7ab5');
    line.setAttribute('stroke-width', '0.8');
    line.setAttribute('stroke-opacity', '0.8');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('class', 'conn-line');
    line.setAttribute('data-pais', conn.pais);
    line.setAttribute('data-mentor', conn.mentor);
    line.style.transition = 'stroke 0.2s, stroke-width 0.2s, stroke-opacity 0.2s';
    linesGroup.appendChild(line);
  });

  svg.appendChild(linesGroup);

  // Dots and labels layer (on top of lines)
  const dotsGroup = document.createElementNS(svgNS, 'g');
  dotsGroup.setAttribute('id', 'world-dots');

  // Mexico glow + dot
  const mexGlow = document.createElementNS(svgNS, 'circle');
  mexGlow.setAttribute('cx', MEXICO_CENTER.x);
  mexGlow.setAttribute('cy', MEXICO_CENTER.y);
  mexGlow.setAttribute('r', '14');
  mexGlow.setAttribute('fill', '#c0392b');
  mexGlow.setAttribute('opacity', '0.12');
  dotsGroup.appendChild(mexGlow);

  const mexDot = document.createElementNS(svgNS, 'circle');
  mexDot.setAttribute('cx', MEXICO_CENTER.x);
  mexDot.setAttribute('cy', MEXICO_CENTER.y);
  mexDot.setAttribute('r', '5');
  mexDot.setAttribute('fill', '#c0392b');
  mexDot.setAttribute('stroke', '#fff');
  mexDot.setAttribute('stroke-width', '2');
  dotsGroup.appendChild(mexDot);

  const mexLabel = document.createElementNS(svgNS, 'text');
  mexLabel.setAttribute('x', MEXICO_CENTER.x);
  mexLabel.setAttribute('y', MEXICO_CENTER.y + 16);
  mexLabel.setAttribute('text-anchor', 'middle');
  mexLabel.setAttribute('font-size', '10');
  mexLabel.setAttribute('font-weight', '700');
  mexLabel.setAttribute('fill', '#922b21');
  mexLabel.setAttribute('font-family', 'system-ui, sans-serif');
  mexLabel.textContent = 'México';
  dotsGroup.appendChild(mexLabel);

  // Build list of nodes: EEUU splits into regions, others stay as single node
  const nodes = [];

  Object.entries(porPais).forEach(([pais, conns]) => {
    if (pais === 'EEUU') {
      const porRegion = {};
      conns.forEach((c) => {
        const region = c.region || 'northeast';
        if (!porRegion[region]) porRegion[region] = [];
        porRegion[region].push(c);
      });
      Object.entries(porRegion).forEach(([region, regionConns]) => {
        const coord = EEUU_REGION_COORDS[region];
        if (!coord) return;
        const instText = [...new Set(regionConns.map(c => c.institucion).filter(Boolean))].join(', ');
        nodes.push({
          pais,
          key: `EEUU-${region}`,
          label: instText || `EEUU ${region}`,
          coord,
          conns: regionConns,
          region,
        });
      });
    } else {
      const coord = PAIS_COORDS[pais];
      if (!coord) return;
      const instText = [...new Set(conns.map(c => c.institucion).filter(Boolean))].join(', ');
      nodes.push({
        pais,
        key: pais,
        label: instText ? `${pais} (${instText})` : pais,
        coord,
        conns,
      });
    }
  });

  // Draw nodes
  nodes.forEach((node) => {
    const { coord, pais, key, label, conns } = node;

    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('class', 'world-node');
    g.setAttribute('data-key', key);
    g.style.cursor = 'pointer';

    const hitArea = document.createElementNS(svgNS, 'circle');
    hitArea.setAttribute('cx', coord.x);
    hitArea.setAttribute('cy', coord.y);
    hitArea.setAttribute('r', '18');
    hitArea.setAttribute('fill', 'transparent');
    g.appendChild(hitArea);

    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('cx', coord.x);
    dot.setAttribute('cy', coord.y);
    dot.setAttribute('r', '5');
    dot.setAttribute('fill', '#1a4d6e');
    dot.setAttribute('stroke', '#fff');
    dot.setAttribute('stroke-width', '2');
    dot.style.transition = 'r 0.15s, fill 0.15s';
    g.appendChild(dot);

    const textLabel = document.createElementNS(svgNS, 'text');
    textLabel.setAttribute('x', coord.x);
    textLabel.setAttribute('y', coord.y - 10);
    textLabel.setAttribute('text-anchor', 'middle');
    textLabel.setAttribute('font-size', '8');
    textLabel.setAttribute('font-weight', '700');
    textLabel.setAttribute('fill', '#1a4d6e');
    textLabel.setAttribute('font-family', 'system-ui, sans-serif');
    textLabel.style.pointerEvents = 'none';
    textLabel.textContent = label;
    g.appendChild(textLabel);

    g.addEventListener('mouseenter', () => {
      const mentorNames = [...new Set(conns.map((c) => c.mentor))];
      const instNames = [...new Set(conns.map((c) => c.institucion).filter(Boolean))];
      let text = `${mentorNames.length} mentor${mentorNames.length !== 1 ? 'es' : ''}, ${conns.length} investigación${conns.length !== 1 ? 'es' : ''}`;
      if (instNames.length) text = `${instNames.join(', ')}: ${text}`;
      tooltip.textContent = text;
      tooltip.classList.add('visible');

      dot.setAttribute('r', '7');
      dot.setAttribute('fill', '#e67e22');

      conns.forEach((c) => {
        svg.querySelectorAll(`.conn-line[data-mentor="${c.mentor}"][data-pais="${pais}"]`).forEach((l) => {
          l.setAttribute('stroke', '#e67e22');
          l.setAttribute('stroke-width', '2');
          l.setAttribute('stroke-opacity', '1');
        });
      });
    });

    g.addEventListener('mousemove', (e) => {
      tooltip.style.left = e.clientX + 14 + 'px';
      tooltip.style.top = e.clientY - 32 + 'px';
    });

    g.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');

      dot.setAttribute('r', '5');
      dot.setAttribute('fill', '#1a4d6e');

      conns.forEach((c) => {
        svg.querySelectorAll(`.conn-line[data-mentor="${c.mentor}"][data-pais="${pais}"]`).forEach((l) => {
          l.setAttribute('stroke', '#2a7ab5');
          l.setAttribute('stroke-width', '0.8');
          l.setAttribute('stroke-opacity', '0.8');
        });
      });
    });

    g.addEventListener('click', () => {
      mostrarDetalleMundial(label, conns);
    });

    dotsGroup.appendChild(g);
  });

  svg.appendChild(dotsGroup);
  worldSvgLoaded = true;
}

function paisToEnglish(pais) {
  const map = {
    'EEUU': 'United States of America',
    'UK': 'United Kingdom',
    'Colombia': 'Colombia',
    'Perú': 'Peru',
    'Brasil': 'Brazil',
    'España': 'Spain',
    'Francia': 'France',
    'Alemania': 'Germany',
    'Canadá': 'Canada',
    'Argentina': 'Argentina',
    'Chile': 'Chile',
    'Holanda': 'Netherlands',
    'Japón': 'Japan',
    'Australia': 'Australia',
    'India': 'India',
    'Italia': 'Italy',
  };
  return map[pais] || pais;
}

function mostrarDetalleMundial(pais, conexiones) {
  const panel = document.getElementById('detail-panel');
  const titulo = document.getElementById('detail-title');
  const cuerpo = document.getElementById('detail-body');

  const mentoresUnicos = [...new Set(conexiones.map((c) => c.mentor))];
  titulo.textContent = `${pais} — ${mentoresUnicos.length} mentor${mentoresUnicos.length !== 1 ? 'es' : ''}, ${conexiones.length} investigación${conexiones.length !== 1 ? 'es' : ''}`;

  let html = `<table>
    <thead>
      <tr>
        <th>Mentor</th>
        <th>Institución</th>
        <th>Estudiante</th>
        <th>Comunidad</th>
        <th>Estado</th>
        <th>Investigación</th>
        <th>Año</th>
      </tr>
    </thead>
    <tbody>`;

  conexiones.forEach((c) => {
    html += `<tr>
      <td><strong>${c.mentor}</strong><br><small style="color:#6c7a89">${c.disciplina}</small></td>
      <td>${c.institucion || '—'}</td>
      <td>${c.estudiante}</td>
      <td>${c.comunidad}</td>
      <td>${c.estado}</td>
      <td>${c.investigacion}</td>
      <td>${c.ano}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  cuerpo.innerHTML = html;

  panel.classList.add('open');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
