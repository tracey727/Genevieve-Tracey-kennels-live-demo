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
    const disconnect=()=>{if(storage&&storage.removeItem)storage.removeItem(TOKEN_KEY)};

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
      request
    };
  }
  let shared=null;
  function sharedClient(){return shared||(shared=create())}
  return {TOKEN_KEY,create,sharedClient};
});
