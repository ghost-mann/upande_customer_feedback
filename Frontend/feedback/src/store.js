import { create } from 'zustand';
import { api, apiPost } from '@shared/api';

const API = 'upande_customer_feedback.api.feedback';

export const useStore = create((set, get) => ({
  page: 'overview',
  ctx: null,
  loading: true,
  loadError: null,

  data: {
    overview: null,
    feedback:     { rows: null, err: null },
    credit_notes: { rows: null, err: null },
  },

  // Detail drawer state for a single feedback doc, including its message thread.
  detail: null,
  setDetail(d) { set({ detail: d }); },
  setPage(page) { set({ page, detail: null }); },

  async bootstrap() {
    set({ loading: true, loadError: null });
    try {
      const ctx = await api(`${API}.get_my_context`);
      set({ ctx, loading: false });
      get().loadOverview();
    } catch (e) {
      set({ loading: false, loadError: e.message });
    }
  },

  async loadOverview() {
    try {
      const ov = await api(`${API}.get_overview`);
      set((s) => ({ data: { ...s.data, overview: ov } }));
    } catch (e) {
      set((s) => ({ data: { ...s.data, overview: { error: e.message } } }));
    }
  },

  async loadList(kind) {
    set((s) => ({ data: { ...s.data, [kind]: { rows: null, err: null } } }));
    const map = {
      feedback:     `${API}.list_feedback`,
      credit_notes: `${API}.list_credit_notes`,
    };
    try {
      const rows = (await api(map[kind])) || [];
      set((s) => ({ data: { ...s.data, [kind]: { rows, err: null } } }));
    } catch (e) {
      set((s) => ({ data: { ...s.data, [kind]: { rows: [], err: e.message } } }));
    }
  },

  async loadDetail(name) {
    set({ detail: { name, doc: null, messages: null, loading: true, err: null } });
    try {
      const [doc, messages] = await Promise.all([
        api(`${API}.get_feedback`, { name }),
        api(`${API}.list_messages`, { name }).catch(() => []),
      ]);
      set({ detail: { name, doc, messages: messages || [], loading: false, err: null } });
    } catch (e) {
      set({ detail: { name, doc: null, messages: null, loading: false, err: e.message } });
    }
  },

  async postMessage(name, body) {
    const html = String(body || '').trim().replace(/\n/g, '<br>');
    const res = await apiPost(`${API}.post_message`, { name, body: html });
    // Refresh the thread in the open drawer
    try {
      const messages = await api(`${API}.list_messages`, { name });
      set((s) => (s.detail && s.detail.name === name
        ? { detail: { ...s.detail, messages } }
        : {}));
    } catch (e) {}
    return res;
  },

  async submitClaim(payload) {
    return apiPost(`${API}.submit_claim`, payload);
  },

  async submitSuggestion(payload) {
    return apiPost(`${API}.submit_suggestion`, payload);
  },
}));
