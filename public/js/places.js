import { api, initNav, showAlert, renderPager } from '/js/api.js';

let currentUser      = null;
let currentPage      = 1;
let searchTerm       = '';
let editMap          = null;
let searchMap        = null;
let drawnCoords      = null;
let drawnType        = null;
let searchDrawnCoords = null;

async function boot() {
  try {
    currentUser = await api.auth.me();
  } catch {
    window.location.href = '/signin.html';
    return;
  }
  initNav(currentUser, 'places');
  routeView();
  window.addEventListener('popstate', routeView);
}

function routeView() {
  destroyMaps();
  const p    = new URLSearchParams(location.search);
  const mode = p.get('mode');
  const id   = p.get('id');
  if (mode === 'create') return showForm(null);
  if (mode === 'edit' && id) return showForm(id);
  if (mode === 'search') return showSearch();
  showList();
}

function destroyMaps() {
  if (editMap)   { editMap.remove();   editMap   = null; }
  if (searchMap) { searchMap.remove(); searchMap = null; }
  drawnCoords = null; drawnType = null; searchDrawnCoords = null;
}

// ── List ─────────────────────────────────────────────────────────────────────

async function showList(page = 1) {
  currentPage = page;
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="d-flex flex-wrap align-items-center mb-3 gap-2">
      <input id="search-input" class="form-control" style="max-width:260px"
             placeholder="Search name or description…" value="${esc(searchTerm)}">
      <button class="btn btn-outline-secondary" id="btn-search">Search</button>
      <div class="ms-auto d-flex gap-2">
        <a href="/places.html?mode=search" class="btn btn-outline-info">🔍 Geo Search</a>
        <a href="/places.html?mode=create" class="btn btn-primary">+ New Place</a>
      </div>
    </div>
    <div id="alert-area"></div>
    <div id="place-cards" class="row g-3">
      <div class="col-12 text-center text-muted">Loading…</div>
    </div>
    <div id="pager" class="mt-3"></div>`;

  document.getElementById('btn-search').addEventListener('click', () => {
    searchTerm = document.getElementById('search-input').value.trim();
    showList(1);
  });
  document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-search').click();
  });

  try {
    const { places, pages } = await api.places.list({ page, ...(searchTerm && { search: searchTerm }) });
    renderCards('place-cards', places);
    renderPager('pager', page, pages, p => showList(p));
  } catch (err) {
    showAlert('alert-area', 'danger', err.message);
  }
}

function renderCards(containerId, places) {
  const el = document.getElementById(containerId);
  if (!places.length) {
    el.innerHTML = '<div class="col-12 text-center text-muted py-4">No places found.</div>';
    return;
  }
  el.innerHTML = places.map(p => {
    const imgTag = p.imgext
      ? `<img src="/img/places/${p._id}${p.imgext}" class="card-img-top"
              style="height:160px;object-fit:cover" alt="${esc(p.name)}">`
      : `<div class="bg-secondary text-white d-flex align-items-center justify-content-center"
              style="height:160px;border-radius:.375rem .375rem 0 0">No image</div>`;
    const author = p.author?.name ? `by ${esc(p.author.name)}` : '';
    const edited = p.edited ? new Date(p.edited).toLocaleDateString() : '';
    return `
      <div class="col-sm-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          ${imgTag}
          <div class="card-body d-flex flex-column">
            <h6 class="card-title mb-1">${esc(p.name)}</h6>
            <p class="card-text text-muted small flex-grow-1">${esc((p.description || '').slice(0, 90))}</p>
            <p class="card-text text-muted small">${author}${author && edited ? ' · ' : ''}${edited}</p>
            <div class="d-flex gap-2 mt-2">
              <a href="/places.html?mode=edit&id=${p._id}" class="btn btn-sm btn-outline-primary">Edit</a>
              <button class="btn btn-sm btn-outline-danger" data-delete="${p._id}" data-name="${esc(p.name)}">Delete</button>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  el.querySelectorAll('[data-delete]').forEach(btn =>
    btn.addEventListener('click', () => deletePlace(btn.dataset.delete, btn.dataset.name)));
}

async function deletePlace(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await api.places.delete(id);
    showList(currentPage);
  } catch (err) {
    showAlert('alert-area', 'danger', err.message);
  }
}

// ── Create / Edit ─────────────────────────────────────────────────────────────

async function showForm(id) {
  const isEdit = !!id;
  document.getElementById('main').innerHTML = `
    <div class="mb-3">
      <a href="/places.html" class="btn btn-outline-secondary btn-sm">← Back to list</a>
    </div>
    <div class="row g-4">
      <div class="col-md-5">
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-4">${isEdit ? 'Edit Place' : 'New Place'}</h5>
            <div id="alert-area"></div>
            <form id="place-form">
              <div class="mb-3">
                <label class="form-label">Name</label>
                <input name="name" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-control" rows="3" required></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Image (JPEG/PNG, max 5 MB)</label>
                <input type="file" name="image" class="form-control" accept=".jpg,.jpeg,.png"
                       ${isEdit ? '' : 'required'}>
              </div>
              <div id="loc-status" class="form-text mb-3 text-muted">
                Draw a marker (Point) or polygon on the map →
              </div>
              <button type="submit" class="btn btn-primary w-100">${isEdit ? 'Save Changes' : 'Create Place'}</button>
            </form>
          </div>
        </div>
      </div>
      <div class="col-md-7">
        <div class="card shadow-sm">
          <div class="card-body p-0">
            <div id="edit-map" style="height:480px;border-radius:.375rem"></div>
          </div>
          <div class="card-footer text-muted small">
            Use the toolbar to place a <strong>marker</strong> (Point) or draw a <strong>polygon</strong>.
            Trash icon removes the current shape so you can redraw.
          </div>
        </div>
      </div>
    </div>`;

  let existingPlace = null;
  if (isEdit) {
    try {
      existingPlace = await api.places.get(id);
      const f = document.getElementById('place-form');
      f.name.value        = existingPlace.name;
      f.description.value = existingPlace.description;
    } catch (err) {
      showAlert('alert-area', 'danger', err.message);
      return;
    }
  }

  await waitForLeaflet();
  const center = existingPlace?.location ? geoCenter(existingPlace.location) : [15, -80];
  editMap = L.map('edit-map').setView(center, existingPlace ? 13 : 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(editMap);

  const drawnItems = new L.FeatureGroup().addTo(editMap);
  editMap.addControl(new L.Control.Draw({
    edit: { featureGroup: drawnItems, remove: true },
    draw: {
      polygon:      { allowIntersection: false, showArea: true },
      marker:       true,
      polyline:     false, rectangle: false, circle: false, circlemarker: false
    }
  }));

  if (existingPlace?.location) {
    preloadShape(existingPlace.location, drawnItems);
    drawnType   = existingPlace.location.type;
    drawnCoords = existingPlace.location.coordinates;
    updateLocStatus();
  }

  editMap.on(L.Draw.Event.CREATED, e => {
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);
    const geo   = e.layer.toGeoJSON();
    drawnType   = geo.geometry.type;
    drawnCoords = geo.geometry.coordinates;
    updateLocStatus();
  });
  editMap.on(L.Draw.Event.DELETED, () => { drawnType = null; drawnCoords = null; updateLocStatus(); });
  editMap.on(L.Draw.Event.EDITED, e => {
    e.layers.eachLayer(layer => {
      const geo   = layer.toGeoJSON();
      drawnType   = geo.geometry.type;
      drawnCoords = geo.geometry.coordinates;
    });
    updateLocStatus();
  });

  document.getElementById('place-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (!drawnCoords) {
      showAlert('alert-area', 'warning', 'Please draw a location on the map first.');
      return;
    }
    const form = e.target;
    const fd   = new FormData(form);
    fd.set('type', drawnType);
    fd.set('coordinates', JSON.stringify(drawnCoords));
    if (!form.image.files.length) fd.delete('image');

    try {
      if (isEdit) { await api.places.update(id, fd); }
      else        { await api.places.create(fd); }
      window.location.href = '/places.html';
    } catch (err) {
      showAlert('alert-area', 'danger', err.message);
    }
  });
}

function updateLocStatus() {
  const el = document.getElementById('loc-status');
  if (!el) return;
  el.textContent = drawnCoords ? `✓ Location set (${drawnType})` : 'Draw a marker or polygon on the map →';
  el.className = `form-text mb-3 ${drawnCoords ? 'text-success' : 'text-muted'}`;
}

function preloadShape(location, group) {
  try {
    if (location.type === 'Point') {
      const [lng, lat] = location.coordinates;
      L.marker([lat, lng]).addTo(group);
    } else if (location.type === 'Polygon') {
      const latlngs = location.coordinates[0].map(([lng, lat]) => [lat, lng]);
      L.polygon(latlngs).addTo(group);
    }
  } catch { /* malformed — skip */ }
}

function geoCenter(location) {
  if (location.type === 'Point') {
    const [lng, lat] = location.coordinates;
    return [lat, lng];
  }
  if (location.type === 'Polygon' && location.coordinates[0]?.length) {
    const [lng, lat] = location.coordinates[0][0];
    return [lat, lng];
  }
  return [15, -80];
}

// ── Geo Search ────────────────────────────────────────────────────────────────

function showSearch() {
  document.getElementById('main').innerHTML = `
    <div class="mb-3">
      <a href="/places.html" class="btn btn-outline-secondary btn-sm">← Back to list</a>
    </div>
    <div class="row g-4">
      <div class="col-md-4">
        <div class="card shadow-sm mb-3">
          <div class="card-body">
            <h6 class="card-title">📍 Find Near Me</h6>
            <p class="text-muted small">Uses your browser's geolocation to find places within a radius.</p>
            <div class="mb-3">
              <label class="form-label small">Max distance: <span id="dist-label">5</span> km</label>
              <input id="dist-slider" type="range" class="form-range" min="1" max="500" value="5">
            </div>
            <button class="btn btn-info w-100 text-white" id="btn-near">Find Near Me</button>
          </div>
        </div>
        <div class="card shadow-sm">
          <div class="card-body">
            <h6 class="card-title">⬡ Find Within Polygon</h6>
            <p class="text-muted small">Draw a polygon on the map then search for places inside it.</p>
            <button class="btn btn-outline-primary w-100" id="btn-within">Search Within Drawn Area</button>
          </div>
        </div>
      </div>
      <div class="col-md-8">
        <div class="card shadow-sm">
          <div class="card-body p-0">
            <div id="search-map" style="height:420px;border-radius:.375rem"></div>
          </div>
          <div class="card-footer text-muted small">
            Draw a <strong>polygon</strong> to define the search area, or use "Find Near Me" for GPS-based search.
          </div>
        </div>
      </div>
    </div>
    <div id="alert-area" class="mt-3"></div>
    <div id="search-results" class="row g-3 mt-1"></div>`;

  document.getElementById('dist-slider').addEventListener('input', e => {
    document.getElementById('dist-label').textContent = e.target.value;
  });
  document.getElementById('btn-near').addEventListener('click', searchNear);
  document.getElementById('btn-within').addEventListener('click', searchWithin);

  waitForLeaflet().then(initSearchMap);
}

function initSearchMap() {
  searchMap = L.map('search-map').setView([15, -80], 3);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(searchMap);

  const drawnItems = new L.FeatureGroup().addTo(searchMap);
  searchMap.addControl(new L.Control.Draw({
    edit: { featureGroup: drawnItems },
    draw: {
      polygon:   { allowIntersection: false },
      marker:    false, polyline: false, rectangle: false, circle: false, circlemarker: false
    }
  }));

  searchMap.on(L.Draw.Event.CREATED, e => {
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);
    searchDrawnCoords = e.layer.toGeoJSON().geometry.coordinates;
  });
  searchMap.on(L.Draw.Event.DELETED, () => { searchDrawnCoords = null; });
}

async function searchNear() {
  if (!navigator.geolocation) {
    showAlert('alert-area', 'warning', 'Geolocation is not supported by your browser.');
    return;
  }
  const km = parseInt(document.getElementById('dist-slider').value);
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude: lat, longitude: lng } = pos.coords;
    try {
      const { places } = await api.places.near(lat, lng, km * 1000);
      showResults(places, `${places.length} place(s) within ${km} km of your location`);
      if (searchMap) {
        searchMap.setView([lat, lng], 11);
        L.marker([lat, lng]).bindPopup('<strong>You are here</strong>').addTo(searchMap).openPopup();
        pinResults(places);
      }
    } catch (err) { showAlert('alert-area', 'danger', err.message); }
  }, () => showAlert('alert-area', 'warning', 'Geolocation permission denied.'));
}

async function searchWithin() {
  if (!searchDrawnCoords) {
    showAlert('alert-area', 'warning', 'Please draw a polygon on the map first.');
    return;
  }
  // Close the ring if needed
  const ring = searchDrawnCoords[0];
  const first = ring[0], last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);

  try {
    const { places } = await api.places.within(searchDrawnCoords);
    showResults(places, `${places.length} place(s) within the drawn polygon`);
    pinResults(places);
  } catch (err) { showAlert('alert-area', 'danger', err.message); }
}

function showResults(places, heading) {
  const el = document.getElementById('search-results');
  el.innerHTML = `<div class="col-12"><p class="text-muted fw-semibold">${esc(heading)}</p></div>`;
  if (!places.length) return;
  el.innerHTML += places.map(p => {
    const imgTag = p.imgext
      ? `<img src="/img/places/${p._id}${p.imgext}" class="card-img-top"
              style="height:120px;object-fit:cover" alt="${esc(p.name)}">`
      : `<div class="bg-secondary text-white d-flex align-items-center justify-content-center"
              style="height:120px">No image</div>`;
    return `
      <div class="col-sm-6 col-lg-3">
        <div class="card h-100 shadow-sm">
          ${imgTag}
          <div class="card-body">
            <h6 class="card-title mb-1">${esc(p.name)}</h6>
            <p class="card-text text-muted small">${esc((p.description || '').slice(0, 80))}</p>
          </div>
        </div>
      </div>`;
  }).join('');
}

function pinResults(places) {
  if (!searchMap) return;
  places.forEach(p => {
    if (p.location?.type === 'Point') {
      const [lng, lat] = p.location.coordinates;
      L.marker([lat, lng]).bindPopup(esc(p.name)).addTo(searchMap);
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function waitForLeaflet() {
  return new Promise(resolve => {
    const check = () => (typeof L !== 'undefined' && L.Control?.Draw) ? resolve() : setTimeout(check, 50);
    check();
  });
}

boot();
