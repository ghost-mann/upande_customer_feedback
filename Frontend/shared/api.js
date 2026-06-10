// Shared Frappe API client for all customer_portal frontends.
//
// Consumed via the `@shared` Vite alias (see each app's vite.config.js):
//   import { api, apiGet, apiPost, getBoot } from '@shared/api';
//
// CSRF handling: Frappe enforces CSRF on POST. The token is injected into the
// page via the Jinja boot block and exposed on window.csrf_token. If the page
// has been open long enough that the token rotated (or the session changed in
// another tab), the first call returns CSRFTokenError. We recover by GET-fetching
// a fresh token and retrying the original call once. The guest-accessible apps
// (site/portal) simply never hit that path unless a token actually expires.

export function getCsrfToken() {
  if (window.frappe?.csrf_token) return window.frappe.csrf_token;
  if (window.csrf_token) return window.csrf_token;
  const m = document.querySelector('meta[name="csrf_token"]');
  if (m && m.content && m.content !== '{{ csrf_token }}') return m.content;
  return '';
}

function setCsrfToken(tok) {
  if (tok) window.csrf_token = tok;
}

function isCsrfError(data) {
  const s = String(data?.exc_type || data?._error_message || '').toLowerCase();
  return s.includes('csrf');
}

let _refreshInflight = null;
async function refreshCsrf() {
  if (_refreshInflight) return _refreshInflight;
  _refreshInflight = (async () => {
    try {
      const res = await fetch('/api/method/upande_customer_feedback.api.feedback.get_csrf_token', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) return false;
      const d = await res.json();
      const tok = d?.message?.csrf_token;
      if (tok) {
        setCsrfToken(tok);
        return true;
      }
    } catch (e) {}
    return false;
  })();
  try { return await _refreshInflight; }
  finally { _refreshInflight = null; }
}

async function callForm(method, args = {}) {
  const csrf = getCsrfToken();
  const body = new URLSearchParams();
  for (const k in args) if (args[k] != null) body.append(k, args[k]);
  if (csrf) body.append('csrf_token', csrf);
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json',
  };
  if (csrf) headers['X-Frappe-CSRF-Token'] = csrf;
  const res = await fetch('/api/method/' + method, {
    method: 'POST', headers, credentials: 'same-origin', body: body.toString(),
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  return { ok: res.ok, status: res.status, data };
}

async function callJson(method, payload) {
  const csrf = getCsrfToken();
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json',
  };
  if (csrf) headers['X-Frappe-CSRF-Token'] = csrf;
  const res = await fetch('/api/method/' + method, {
    method: 'POST', headers, credentials: 'same-origin', body: JSON.stringify(payload || {}),
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  return { ok: res.ok, status: res.status, data };
}

function detailFrom(r) {
  return r.data?._error_message || r.data?.exc_type || `HTTP ${r.status}`;
}

// Form-encoded POST (Frappe's default whitelisted-method calling convention),
// with one CSRF auto-refresh + retry.
export async function api(method, args = {}) {
  let r = await callForm(method, args);
  if (!r.ok && isCsrfError(r.data)) {
    if (await refreshCsrf()) r = await callForm(method, args);
  }
  if (!r.ok) throw new Error(detailFrom(r));
  return r.data?.message;
}

// JSON-body POST, with one CSRF auto-refresh + retry.
export async function apiPost(method, payload) {
  let r = await callJson(method, payload);
  if (!r.ok && isCsrfError(r.data)) {
    if (await refreshCsrf()) r = await callJson(method, payload);
  }
  if (!r.ok) throw new Error(detailFrom(r));
  return r.data?.message;
}

// GET with optional query params.
export async function apiGet(method, query = {}) {
  const qs = new URLSearchParams();
  for (const k in query) if (query[k] != null) qs.append(k, query[k]);
  const url = '/api/method/' + method + (qs.toString() ? '?' + qs.toString() : '');
  const res = await fetch(url, {
    method: 'GET', credentials: 'same-origin',
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) throw new Error(data?._error_message || `HTTP ${res.status}`);
  return data?.message;
}

// Standalone portal login: post credentials to Frappe's auth endpoint. The
// customer never sees the ERP /login page — this keeps auth inside the portal.
// On success Frappe sets the session cookie; the caller reloads so the page
// re-boots authenticated (with a fresh CSRF token).
export async function login(usr, pwd) {
  const body = new URLSearchParams();
  body.append('usr', usr);
  body.append('pwd', pwd);
  let res;
  try {
    res = await fetch('/api/method/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: body.toString(),
    });
  } catch (e) {
    throw new Error('Could not reach the server. Please try again.');
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error('Incorrect email or password.');
    throw new Error('Sign in failed. Please try again.');
  }
  return true;
}

// Request a password-reset email (Frappe's guest-allowed reset endpoint).
// We deliberately resolve regardless of the server's response so the caller can
// show a single generic message — this avoids leaking which emails have accounts
// (the endpoint 404s on unknown users) and degrades gracefully when the site has
// no outgoing email configured. Throws only when the network is unreachable.
export async function requestPasswordReset(usr) {
  const body = new URLSearchParams();
  body.append('user', usr);
  try {
    await fetch('/api/method/frappe.core.doctype.user.user.reset_password', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: body.toString(),
    });
  } catch (e) {
    throw new Error('Could not reach the server. Please try again.');
  }
  return true;
}

// Pull the boot context injected by the Jinja template (e.g. portal.py → boot dict).
export function getBoot() {
  return {
    user:      window.frappe_user      ?? window.user      ?? null,
    fullName:  window.frappe_user_full ?? window.user_full ?? null,
    csrfToken: window.csrf_token       ?? null,
    isGuest:   window.is_guest         ?? true,
    tiles:     window.tiles            ?? null,
  };
}
