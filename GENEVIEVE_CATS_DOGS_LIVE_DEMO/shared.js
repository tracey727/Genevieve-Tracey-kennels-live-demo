(function(){
  const qs=(s,r=document)=>r.querySelector(s);const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt=(v)=>new Date(v).toLocaleString('en-AU',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
  const time=(v)=>new Date(v).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'});
  const badge=(text,sev='outline')=>`<span class="badge ${sev}">${esc(text)}</span>`;
  const icon=(species)=>species==='Cat'?'🐈':species==='Dog'?'🐕':'🏠';
  function toast(message){let el=qs('#toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';document.body.appendChild(el)}el.textContent=message;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2600)}
  function clock(){const el=qs('[data-clock]');if(el){const d=new Date();el.innerHTML=d.toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})+`<small>${d.toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})}</small>`}}
  setInterval(clock,30000);document.addEventListener('DOMContentLoaded',clock);
  function updateOnline(){qsa('[data-sync-strip]').forEach(el=>{el.classList.toggle('offline',!navigator.onLine);el.textContent=navigator.onLine?'● ONLINE · DEMO SYNC ACTIVE':'● OFFLINE · SAVING ON THIS DEVICE'})}
  addEventListener('online',updateOnline);addEventListener('offline',updateOnline);document.addEventListener('DOMContentLoaded',updateOnline);
  window.GUI={qs,qsa,esc,fmt,time,badge,icon,toast,updateOnline};
})();
