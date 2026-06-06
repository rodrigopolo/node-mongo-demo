import { api, initNav, showAlert, renderPager } from '/js/api.js';

const ROLES = { 1: 'Admin', 2: 'Author', 3: 'Contributor' };

let currentUser = null;
let currentPage = 1;
let searchTerm  = '';

async function boot() {
  try {
    currentUser = await api.auth.me();
  } catch {
    window.location.href = '/signin.html';
    return;
  }
  initNav(currentUser, 'users');

  if (currentUser.role > 2) {
    document.getElementById('main').innerHTML =
      '<div class="alert alert-danger mt-4">You do not have permission to manage users.</div>';
    return;
  }

  routeView();
  window.addEventListener('popstate', routeView);
}

function routeView() {
  const p    = new URLSearchParams(location.search);
  const mode = p.get('mode');
  const id   = p.get('id');
  if (mode === 'create') return showForm(null);
  if (mode === 'edit' && id) return showForm(id);
  showList();
}

// ── List ────────────────────────────────────────────────────────────────────

async function showList(page = 1) {
  currentPage = page;
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="d-flex align-items-center mb-3 gap-2">
      <input id="search-input" class="form-control" style="max-width:260px"
             placeholder="Search name or email…" value="${esc(searchTerm)}">
      <button class="btn btn-outline-secondary" id="btn-search">Search</button>
      <a href="/users.html?mode=create" class="btn btn-primary ms-auto">+ New User</a>
    </div>
    <div id="alert-area"></div>
    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
        <tbody id="user-rows"><tr><td colspan="4" class="text-center text-muted">Loading…</td></tr></tbody>
      </table>
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
    const { users, pages } = await api.users.list({ page, ...(searchTerm && { search: searchTerm }) });
    const tbody = document.getElementById('user-rows');
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No users found.</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${esc(u.name)}</td>
        <td>${esc(u.email)}</td>
        <td><span class="badge bg-secondary">${ROLES[u.role] || u.role}</span></td>
        <td class="text-end">
          <a href="/users.html?mode=edit&id=${u._id}" class="btn btn-sm btn-outline-primary me-1">Edit</a>
          ${u._id !== currentUser._id
            ? `<button class="btn btn-sm btn-outline-danger" data-delete="${u._id}" data-name="${esc(u.name)}">Delete</button>`
            : ''}
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => deleteUser(btn.dataset.delete, btn.dataset.name));
    });
    renderPager('pager', page, pages, p => showList(p));
  } catch (err) {
    showAlert('alert-area', 'danger', err.message);
  }
}

async function deleteUser(id, name) {
  if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
  try {
    await api.users.delete(id);
    showList(currentPage);
  } catch (err) {
    showAlert('alert-area', 'danger', err.message);
  }
}

// ── Create / Edit form ───────────────────────────────────────────────────────

async function showForm(id) {
  const isEdit = !!id;
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="mb-3">
      <a href="/users.html" class="btn btn-outline-secondary btn-sm">← Back to list</a>
    </div>
    <div class="card shadow-sm" style="max-width:560px">
      <div class="card-body">
        <h5 class="card-title mb-4">${isEdit ? 'Edit User' : 'New User'}</h5>
        <div id="alert-area"></div>
        <form id="user-form">
          <div class="mb-3">
            <label class="form-label">Name</label>
            <input name="name" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input name="email" type="email" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">${isEdit ? 'New Password (leave blank to keep)' : 'Password'}</label>
            <input name="password" type="password" class="form-control" ${isEdit ? '' : 'required'}>
          </div>
          <div class="mb-3">
            <label class="form-label">Timezone (UTC offset hours)</label>
            <input name="timezone" type="number" class="form-control" value="0">
          </div>
          ${currentUser.role === 1 ? `
          <div class="mb-3">
            <label class="form-label">Role</label>
            <select name="role" class="form-select">
              <option value="1">Admin</option>
              <option value="2">Author</option>
              <option value="3" selected>Contributor</option>
            </select>
          </div>` : ''}
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create User'}</button>
        </form>
      </div>
    </div>`;

  if (isEdit) {
    try {
      const user = await api.users.get(id);
      const f = document.getElementById('user-form');
      f.name.value     = user.name;
      f.email.value    = user.email;
      f.timezone.value = user.timezone ?? 0;
      if (f.role) f.role.value = user.role;
    } catch (err) {
      showAlert('alert-area', 'danger', err.message);
      return;
    }
  }

  document.getElementById('user-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd   = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    if (!data.password) delete data.password;

    try {
      if (isEdit) {
        await api.users.update(id, data);
      } else {
        await api.users.create(data);
      }
      window.location.href = '/users.html';
    } catch (err) {
      showAlert('alert-area', 'danger', err.message);
    }
  });
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

boot();
