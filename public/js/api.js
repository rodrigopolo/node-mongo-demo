// Thin fetch wrapper — sends cookies, handles 401 redirect, and accepts both
// JSON bodies and FormData (for file uploads).

async function request(method, path, body) {
  const opts = { method, credentials: 'include', headers: {} };

  if (body instanceof FormData) {
    opts.body = body;
    // Let the browser set Content-Type with the multipart boundary
  } else if (body !== undefined) {
    opts.body = JSON.stringify(body);
    opts.headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(path, opts);

  if (res.status === 401 && !path.startsWith('/api/auth')) {
    window.location.href = '/signin.html';
    return null;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),

  auth: {
    me:           ()            => api.get('/api/auth/me'),
    signin:       (email, pass) => api.post('/api/auth/signin', { email, password: pass }),
    signout:      ()            => api.post('/api/auth/signout'),
    requestReset: (email)       => api.post('/api/auth/reset', { email }),
    validateReset:(token)       => api.get(`/api/auth/reset/${token}`),
    submitReset:  (token, pass) => api.post(`/api/auth/reset/${token}`, { password: pass })
  },

  users: {
    list:   (params = {}) => api.get(`/api/users?${new URLSearchParams(params)}`),
    get:    (id)          => api.get(`/api/users/${id}`),
    create: (data)        => api.post('/api/users', data),
    update: (id, data)    => api.put(`/api/users/${id}`, data),
    delete: (id)          => api.delete(`/api/users/${id}`)
  },

  places: {
    list:   (params = {}) => api.get(`/api/places?${new URLSearchParams(params)}`),
    get:    (id)          => api.get(`/api/places/${id}`),
    create: (fd)          => api.post('/api/places', fd),
    update: (id, fd)      => api.put(`/api/places/${id}`, fd),
    delete: (id)          => api.delete(`/api/places/${id}`),
    near:   (lat, lng, maxDistance) =>
      api.get(`/api/places/near?lat=${lat}&lng=${lng}&maxDistance=${maxDistance}`),
    within: (coordinates) => api.post('/api/places/within', { coordinates })
  }
};

// Renders the navbar and wires up the sign-out button.
// Call initNav(user) from each page after fetching /api/auth/me.
export function initNav(user, activePage) {
  const navLinks = document.getElementById('nav-links');
  const navUser  = document.getElementById('nav-user');
  if (!navLinks || !navUser) return;

  if (user) {
    navLinks.innerHTML = `
      <li class="nav-item">
        <a class="nav-link ${activePage === 'places' ? 'active' : ''}" href="/places.html">Places</a>
      </li>
      <li class="nav-item">
        <a class="nav-link ${activePage === 'users' ? 'active' : ''}" href="/users.html">Users</a>
      </li>`;

    navUser.innerHTML = `
      <span class="navbar-text me-3 text-light small">${user.name}</span>
      <button class="btn btn-outline-light btn-sm" id="btn-signout">Sign Out</button>`;

    document.getElementById('btn-signout').addEventListener('click', async () => {
      await api.auth.signout();
      window.location.href = '/signin.html';
    });
  } else {
    navLinks.innerHTML = '';
    navUser.innerHTML  = `<a href="/signin.html" class="btn btn-outline-light btn-sm">Sign In</a>`;
  }
}

// Displays a Bootstrap alert inside `containerId`.
export function showAlert(containerId, type, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

// Renders a simple paginator. onPage(n) is called with the 1-based page number.
export function renderPager(containerId, page, pages, onPage) {
  const el = document.getElementById(containerId);
  if (!el || pages <= 1) { if (el) el.innerHTML = ''; return; }

  const prev = page > 1
    ? `<li class="page-item"><a class="page-link" href="#" data-p="${page - 1}">«</a></li>` : '';
  const next = page < pages
    ? `<li class="page-item"><a class="page-link" href="#" data-p="${page + 1}">»</a></li>` : '';
  const items = Array.from({ length: pages }, (_, i) => i + 1).map(p => `
    <li class="page-item ${p === page ? 'active' : ''}">
      <a class="page-link" href="#" data-p="${p}">${p}</a>
    </li>`).join('');

  el.innerHTML = `<ul class="pagination mb-0">${prev}${items}${next}</ul>`;
  el.querySelectorAll('[data-p]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    onPage(parseInt(a.dataset.p));
  }));
}
