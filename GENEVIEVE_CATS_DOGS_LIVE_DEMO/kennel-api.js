/* GENEVIEVE Kennels authenticated API client.
 * Session token is kept in sessionStorage only; never persisted to localStorage.
 * Same-origin /api routes only unless an explicit test base URL is supplied.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.KennelAPI=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';
  const TOKEN_KEY='genevieve_kennels_api_token_session';

  function create(options={}){
    const fetchImpl=options.fetchImpl||(typeof fetch==='function'?fetch.bind(globalThis):null);
    const storage=options.storage||(typeof sessionStorage!=='undefined'?sessionStorage:null);
    const baseUrl=String(options.baseUrl||'').replace(/\/$/,'');
    if(!fetchImpl)throw new Error('fetch implementation required');

    const getToken=()=>storage&&storage.getItem?storage.getItem(TOKEN_KEY):null;
    const hasToken=()=>Boolean(getToken());
    const announce=(connected)=>{if(typeof window!=='undefined'&&window.dispatchEvent&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('genevieve:kennels-api-session',{detail:{connected}}))};
    const disconnect=()=>{if(storage&&storage.removeItem)storage.removeItem(TOKEN_KEY);announce(false)};

    async function request(path,{method='GET',body,tokenOverride}={}){
      const token=tokenOverride||getToken();
      if(!token){
        const e=new Error('authenticated kennel session required');e.status=401;throw e;
      }
      const headers={authorization:'Bearer '+token,accept:'application/json'};
      if(body!==undefined)headers['content-type']='application/json';
      const res=await fetchImpl(baseUrl+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
      let data=null;
      try{data=await res.json()}catch{data=null}
      if(!res.ok){
        const e=new Error(data&&data.error?data.error:'Kennels API request failed');e.status=res.status;e.data=data;throw e;
      }
      return data;
    }

    async function connect(rawToken){
      const value=String(rawToken||'').trim();
      if(!value)throw Object.assign(new Error('token required'),{status:400});
      try{
        const session=await request('/api/session',{tokenOverride:value});
        if(storage&&storage.setItem)storage.setItem(TOKEN_KEY,value);
        announce(true);
        return session;
      }catch(e){
        disconnect();
        throw e;
      }
    }

    return {
      hasToken,
      disconnect,
      connect,
      session:()=>request('/api/session'),
      staff:()=>request('/api/staff'),
      animals:()=>request('/api/animals'),
      createAnimal:(body)=>request('/api/animals',{method:'POST',body}),
      bookings:()=>request('/api/bookings'),
      createBooking:(body)=>request('/api/bookings',{method:'POST',body}),
      custody:()=>request('/api/custody'),
      createCustody:(body)=>request('/api/custody',{method:'POST',body}),
      tasks:()=>request('/api/tasks'),
      createTask:(body)=>request('/api/tasks',{method:'POST',body}),
      updateTask:(id,body)=>request('/api/tasks/'+encodeURIComponent(id),{method:'PATCH',body}),
      stock:()=>request('/api/stock'),
      createStock:(body)=>request('/api/stock',{method:'POST',body}),
      updateStock:(id,body)=>request('/api/stock/'+encodeURIComponent(id),{method:'PATCH',body}),
      rounds:()=>request('/api/rounds'),
      updateRound:(id,body)=>request('/api/rounds/'+encodeURIComponent(id),{method:'PATCH',body}),
      transports:()=>request('/api/transports'),
      updateTransport:(id,body)=>request('/api/transports/'+encodeURIComponent(id),{method:'PATCH',body}),
      incidents:()=>request('/api/incidents'),
      createIncident:(body)=>request('/api/incidents',{method:'POST',body}),
      audit:()=>request('/api/audit'),
      compliance:()=>request('/api/compliance'),
      saveCompliance:(body)=>request('/api/compliance',{method:'POST',body}),
      dashboard:()=>request('/api/dashboard'),
      alerts:()=>request('/api/alerts'),
      request
    };
  }
  let shared=null;
  function sharedClient(){return shared||(shared=create())}
  return {TOKEN_KEY,create,sharedClient};
});
