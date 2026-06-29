const PAIS_COORDS = {
  'EEUU': { x: 205, y: 144 },
  'UK': { x: 446.2, y: 97.3 },
  'Colombia': { x: 265, y: 240 },
  'Perú': { x: 260, y: 275.1 },
  'Brasil': { x: 317.5, y: 285.4 },
  'España': { x: 440.8, y: 140.7 },
  'Francia': { x: 455.8, y: 118.4 },
  'Alemania': { x: 476, y: 100.5 },
  'Canadá': { x: 185, y: 80.3 },
  'Argentina': { x: 290, y: 340.5 },
  'Chile': { x: 272.5, y: 337.5 },
  'Holanda': { x: 463.2, y: 96.1 },
  'Japón': { x: 795, y: 153.4 },
  'Australia': { x: 785, y: 314.6 },
  'India': { x: 647.5, y: 196.3 },
  'Italia': { x: 481.2, y: 132.4 },
  'Serbia': { x: 500, y: 120 },
  'Ecuador': { x: 340, y: 255 },
};

const EEUU_REGION_COORDS = {
  'northeast': { x: 267.5, y: 134.1 },
  'southeast': { x: 240, y: 162.5 },
  'midwest': { x: 217.5, y: 134.1 },
  'northwest': { x: 145, y: 116.6 },
  'southwest': { x: 170, y: 159.5 },
};

const MEXICO_CENTER = { x: 195, y: 190.9 };



function coordForConnection(conn) {
  if (conn.pais === 'EEUU' && conn.region) {
    return EEUU_REGION_COORDS[conn.region] || PAIS_COORDS['EEUU'];
  }
  return PAIS_COORDS[conn.pais] || null;
}

const ESTADO_OFFSETS = {
  'San Luis Potosí': { x: 198.8, y: 193.1 },
  'Michoacán': { x: 195.5, y: 201.1 },
  'Puebla': { x: 204.5, y: 201.6 },
  'Chihuahua': { x: 184.8, y: 175.3 },
  'Sinaloa': { x: 181.2, y: 186 },
  'Veracruz': { x: 208.2, y: 200.3 },
  'Guerrero': { x: 200.2, y: 205.6 },
  'Chiapas': { x: 217.2, y: 207.6 },
  'Estado de México': { x: 202, y: 198 },
  'Nuevo León': { x: 203, y: 183 },
  'Colima': { x: 192, y: 197 },
  'Morelos': { x: 204, y: 199 },
  'Quintana Roo': { x: 232, y: 192 },
};

let worldSvgLoaded = false;
let allConexiones = [];
let currentYearFilter = 'all';

async function inicializarMapaMundial() {
  const container = document.getElementById('world-map-wrap');
  if (!container || worldSvgLoaded) return;

  const resp = await fetch('assets/world.svg?v=2');
  const svgText = await resp.text();
  container.innerHTML = svgText;

  const svg = container.querySelector('svg');
  svg.setAttribute('id', 'world-svg');

  const vb = { x: -130, y: 30, w: 650, h: 350 };
  svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.cursor = 'grab';

  function updateViewBox() {
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  }

  function zoomBy(scale) {
    const cx = vb.x + vb.w / 2;
    const cy = vb.y + vb.h / 2;
    const newW = Math.min(900, Math.max(100, vb.w * scale));
    const newH = Math.min(500, Math.max(55, vb.h * scale));
    vb.x = cx - newW / 2;
    vb.y = cy - newH / 2;
    vb.w = newW;
    vb.h = newH;
    updateViewBox();
  }

  document.getElementById('zoom-in').addEventListener('click', () => zoomBy(0.75));
  document.getElementById('zoom-out').addEventListener('click', () => zoomBy(1.33));

  let isPanning = false, panStart = { x: 0, y: 0 };
  svg.addEventListener('mousedown', (e) => {
    if (e.target.closest('.world-node')) return;
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    svg.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    const rect = svg.getBoundingClientRect();
    const dx = (e.clientX - panStart.x) * (vb.w / rect.width);
    const dy = (e.clientY - panStart.y) * (vb.h / rect.height);
    vb.x -= dx;
    vb.y -= dy;
    panStart = { x: e.clientX, y: e.clientY };
    updateViewBox();
  });
  window.addEventListener('mouseup', () => {
    isPanning = false;
    svg.style.cursor = 'grab';
  });

  let touchDist = 0, touchCenter = { x: 0, y: 0 };
  svg.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isPanning = true;
      panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isPanning = false;
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      touchDist = Math.sqrt(dx * dx + dy * dy);
      touchCenter = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
    }
  }, { passive: false });
  svg.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isPanning) {
      const rect = svg.getBoundingClientRect();
      const dx = (e.touches[0].clientX - panStart.x) * (vb.w / rect.width);
      const dy = (e.touches[0].clientY - panStart.y) * (vb.h / rect.height);
      vb.x -= dx;
      vb.y -= dy;
      panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      updateViewBox();
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const scale = touchDist / newDist;
      const rect = svg.getBoundingClientRect();
      const cx = (touchCenter.x - rect.left) / rect.width;
      const cy = (touchCenter.y - rect.top) / rect.height;
      const px = vb.x + cx * vb.w;
      const py = vb.y + cy * vb.h;
      const newW = Math.min(900, Math.max(100, vb.w * scale));
      const newH = Math.min(500, Math.max(55, vb.h * scale));
      vb.x = px - cx * newW;
      vb.y = py - cy * newH;
      vb.w = newW;
      vb.h = newH;
      touchDist = newDist;
      updateViewBox();
    }
  }, { passive: false });
  svg.addEventListener('touchend', () => { isPanning = false; });

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

  allConexiones = obtenerConexionesMundiales();
  const conexiones = allConexiones;
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
    const offset = arcHeight + idx * 1.5;
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
    line.setAttribute('data-ano', conn.ano);
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

    g.addEventListener('mouseenter', () => {
      const mentorNames = [...new Set(conns.map((c) => c.mentor))];
      const instNames = [...new Set(conns.map((c) => c.institucion).filter(Boolean))];
      const country = pais === 'EEUU' ? 'EEUU' : pais;
      let html = `<strong>${country}</strong> — ${mentorNames.length} mentor${mentorNames.length !== 1 ? 'es' : ''}, ${conns.length} investigación${conns.length !== 1 ? 'es' : ''}`;
      if (instNames.length) {
        html += '<br>' + instNames.map(n => '• ' + n).join('<br>');
      }
      tooltip.innerHTML = html;
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
  // Set new center

  vb.x += 80;
  updateViewBox();
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
    'Serbia': 'Serbia',
    'Ecuador': 'Ecuador',
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

function filtrarPorAno(year) {
  currentYearFilter = year;

  document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.year-btn[data-year="${year}"]`)?.classList.add('active');

  const svg = document.getElementById('world-svg');
  if (!svg) return;

  const filtered = year === 'all' ? allConexiones : allConexiones.filter(c => String(c.ano) === year);

  svg.querySelectorAll('.conn-line').forEach(l => {
    const show = year === 'all' || l.getAttribute('data-ano') === year;
    l.style.display = show ? '' : 'none';
  });

  const oldDots = document.getElementById('world-dots');
  if (oldDots) oldDots.remove();

  const svgNS = 'http://www.w3.org/2000/svg';
  const tooltip = document.getElementById('map-tooltip');
  const dotsGroup = document.createElementNS(svgNS, 'g');
  dotsGroup.setAttribute('id', 'world-dots');

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

  const porPais = {};
  filtered.forEach(c => {
    if (!porPais[c.pais]) porPais[c.pais] = [];
    porPais[c.pais].push(c);
  });

  svg.querySelectorAll('path[data-country]').forEach(p => {
    p.setAttribute('fill', '#e4e8ec');
    p.setAttribute('stroke', '#cdd3d9');
    p.setAttribute('stroke-width', '0.3');
  });
  const mexPath = svg.querySelector('path[data-country="Mexico"]');
  if (mexPath) {
    mexPath.setAttribute('fill', '#f1948a');
    mexPath.setAttribute('stroke', '#c0392b');
    mexPath.setAttribute('stroke-width', '0.8');
  }
  Object.keys(porPais).forEach(pais => {
    const cp = svg.querySelector(`path[data-country="${paisToEnglish(pais)}"]`);
    if (cp) {
      cp.setAttribute('fill', '#a9cce3');
      cp.setAttribute('stroke', '#5b9bd5');
      cp.setAttribute('stroke-width', '0.6');
    }
  });

  const nodes = [];
  Object.entries(porPais).forEach(([pais, conns]) => {
    if (pais === 'EEUU') {
      const porRegion = {};
      conns.forEach(c => {
        const region = c.region || 'northeast';
        if (!porRegion[region]) porRegion[region] = [];
        porRegion[region].push(c);
      });
      Object.entries(porRegion).forEach(([region, regionConns]) => {
        const coord = EEUU_REGION_COORDS[region];
        if (!coord) return;
        nodes.push({ pais, key: `EEUU-${region}`, coord, conns: regionConns });
      });
    } else {
      const coord = PAIS_COORDS[pais];
      if (!coord) return;
      nodes.push({ pais, key: pais, coord, conns });
    }
  });

  nodes.forEach(node => {
    const { coord, pais, key, conns } = node;
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

    g.addEventListener('mouseenter', () => {
      const mentorNames = [...new Set(conns.map(c => c.mentor))];
      const instNames = [...new Set(conns.map(c => c.institucion).filter(Boolean))];
      const country = pais === 'EEUU' ? 'EEUU' : pais;
      let html = `<strong>${country}</strong> — ${mentorNames.length} mentor${mentorNames.length !== 1 ? 'es' : ''}, ${conns.length} investigación${conns.length !== 1 ? 'es' : ''}`;
      if (instNames.length) html += '<br>' + instNames.map(n => '• ' + n).join('<br>');
      tooltip.innerHTML = html;
      tooltip.classList.add('visible');
      dot.setAttribute('r', '7');
      dot.setAttribute('fill', '#e67e22');
      conns.forEach(c => {
        svg.querySelectorAll(`.conn-line[data-mentor="${c.mentor}"][data-pais="${pais}"]`).forEach(l => {
          if (l.style.display !== 'none') {
            l.setAttribute('stroke', '#e67e22');
            l.setAttribute('stroke-width', '2');
            l.setAttribute('stroke-opacity', '1');
          }
        });
      });
    });

    g.addEventListener('mousemove', e => {
      tooltip.style.left = e.clientX + 14 + 'px';
      tooltip.style.top = e.clientY - 32 + 'px';
    });

    g.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
      dot.setAttribute('r', '5');
      dot.setAttribute('fill', '#1a4d6e');
      conns.forEach(c => {
        svg.querySelectorAll(`.conn-line[data-mentor="${c.mentor}"][data-pais="${pais}"]`).forEach(l => {
          l.setAttribute('stroke', '#2a7ab5');
          l.setAttribute('stroke-width', '0.8');
          l.setAttribute('stroke-opacity', '0.8');
        });
      });
    });

    g.addEventListener('click', () => {
      const instText = [...new Set(conns.map(c => c.institucion).filter(Boolean))].join(', ');
      const label = instText ? `${pais} (${instText})` : pais;
      mostrarDetalleMundial(label, conns);
    });

    dotsGroup.appendChild(g);
  });

  svg.appendChild(dotsGroup);
}
