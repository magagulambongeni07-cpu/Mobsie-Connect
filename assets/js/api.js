/* Mobsie Connect — API adapter.
   When the backend (server/) is running, the Control Centre loads its data from
   the API and syncs every change back, so the web app and Samuel's mobile app
   share one source of truth. When no API is reachable (e.g. opening index.html
   as a static preview), it falls back to browser-local demo mode silently. */
(function(){
  const BASE = window.MOBSIE_API
    || (function(){ try{ return localStorage.getItem('mobsie-api'); }catch(e){ return null; } })()
    || 'http://localhost:4000/api';

  // Demo Control-Centre credentials (change in server/.env for production)
  const DEMO_LOGIN = { email: 'thandi@mobsie.co.za', password: 'admin123' };

  const API = window.MCApi = { base: BASE, connected: false, token: null };

  const getToken = () => { try{ return localStorage.getItem('mobsie-token'); }catch(e){ return null; } };
  const setToken = t => { API.token = t; try{ localStorage.setItem('mobsie-token', t); }catch(e){} };

  async function call(method, path, body){
    const res = await fetch(BASE + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(API.token ? { Authorization: 'Bearer ' + API.token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) { const e = new Error('HTTP ' + res.status); e.status = res.status; throw e; }
    return res.json();
  }
  API.call = call;

  async function login(){
    const out = await call('POST', '/auth/login', DEMO_LOGIN);
    setToken(out.token);
    return out;
  }

  async function boot(){
    try {
      API.token = getToken();
      let data;
      try {
        if (!API.token) await login();
        data = await call('GET', '/bootstrap');
      } catch (e) {
        if (e.status === 401) { await login(); data = await call('GET', '/bootstrap'); }
        else throw e;
      }
      // Server state wins over local demo data
      Object.keys(data.state).forEach(k => { if (DB[k] !== undefined) DB[k] = data.state[k]; });
      DB.recount();
      API.connected = true;
      if (window.App && App.refresh) { App.refresh(); }
      if (window.UI) UI.toast('Connected to Mobsie API — live data', 'zap');
      console.info('[Mobsie] Connected to API at ' + BASE);
    } catch (e) {
      console.info('[Mobsie] No API at ' + BASE + ' — running in browser-local demo mode.');
    }
  }

  // Every mutation the Control Centre makes flows through DB.save().
  // In connected mode we also push the state to the server (debounced).
  let pushTimer = null;
  const origSave = () => DB.save && DB.save.__orig ? DB.save.__orig : null;
  function wrapSave(){
    const orig = DB.save;
    function wrapped(){
      orig();
      if (!API.connected) return;
      clearTimeout(pushTimer);
      pushTimer = setTimeout(async () => {
        try {
          const state = {};
          ['schools','branches','teachers','parents','learners','applications','appCounts',
           'interviews','waitingList','payments','invoices','discounts','conversations','newsletters',
           'pushLog','smsLog','campaigns','feedback','albums','mediaFiles','products','ordersList',
           'documentsList','tickets','adminUsers','rolePerms','auditLog','events','counters','customCal',
           'homeworkList','docFolders','reportRuns'].forEach(k => state[k] = DB[k]);
          await call('PUT', '/state', state);
        } catch (e) {
          console.warn('[Mobsie] Sync to API failed — changes kept locally.', e.message);
        }
      }, 400);
    }
    wrapped.__orig = orig;
    DB.save = wrapped;
  }

  if (window.DB) { wrapSave(); boot(); }
})();
