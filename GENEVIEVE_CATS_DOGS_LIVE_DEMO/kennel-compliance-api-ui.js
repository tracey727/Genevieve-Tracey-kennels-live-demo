/* Authenticated Compliance evidence adapter. */
(function(){
  'use strict';
  let client=null,panel=null,list=null,form=null,session=null;
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const badge=(label,state)=>window.GUI&&window.GUI.badge?window.GUI.badge(label,state):'<span>'+esc(label)+'</span>';
  const fmt=(x)=>window.GUI&&window.GUI.fmt?window.GUI.fmt(x):esc(x);
  const connected=()=>Boolean(client&&client.hasToken());

  async function render(){
    if(!connected()||!list)return false;
    try{
      const [rows,s]=await Promise.all([client.compliance(),client.session()]);
      session=s;
      list.innerHTML=rows.map(x=>'<div class="row"><div class="row-grow"><b>'+esc(x.item)+'</b><small>'+esc(x.evidence_ref||'No evidence reference')+' · reviewed '+fmt(x.reviewed_at)+' by '+esc(x.reviewed_by||'')+'</small></div>'+badge(String(x.status||'').toUpperCase(),x.status==='current'?'green':x.status==='hold'?'amber':'red')+'</div>').join('')||'<p class="small">No compliance evidence records.</p>';
      if(form){
        const canWrite=s.role==='manager';
        Array.from(form.elements).forEach(el=>{if(el.tagName!=='BUTTON'||el.type==='submit')el.disabled=!canWrite});
        const button=form.querySelector('button[type="submit"]');if(button)button.disabled=!canWrite;
        const note=form.querySelector('[data-compliance-role-note]');
        if(note)note.textContent=canWrite?'Manager may update evidence records.':'Read-only for role: '+s.role+'.';
      }
      return true;
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      list.innerHTML='<div class="alert-box red"><h3>Compliance backend unavailable</h3><p>'+esc(e&&e.message||'Connection failed')+'</p></div>';
      return false;
    }
  }
  function build(){
    const section=document.getElementById('compliance');if(!section||panel)return;
    panel=document.createElement('div');panel.className='grid two';
    panel.innerHTML='<div class="card"><div class="card-head"><h2>Authenticated compliance evidence</h2><span class="badge outline">EVIDENCE ONLY</span></div><div data-compliance-api-list class="list"></div></div><form class="card" data-compliance-api-form><h2>Record evidence review</h2><label>Control / evidence item<input name="item" required></label><label>Status<select name="status"><option value="current">Current</option><option value="not_current">Not current</option><option value="hold">Hold for review</option></select></label><label>Evidence reference<input name="evidence_ref" placeholder="Document, policy or record reference"></label><button type="submit" class="btn">Save evidence review</button><p class="small" data-compliance-role-note></p></form>';
    section.appendChild(panel);
    list=panel.querySelector('[data-compliance-api-list]');
    form=panel.querySelector('[data-compliance-api-form]');
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if(!connected()||!session||session.role!=='manager')return;
      const f=new FormData(form);
      try{
        await client.saveCompliance({item:String(f.get('item')||'').trim(),status:String(f.get('status')||'hold'),evidence_ref:String(f.get('evidence_ref')||'').trim()||null});
        form.reset();window.GUI?.toast('Compliance evidence saved and audited');await render();
      }catch(err){
        if(err&&err.status===401)client.disconnect();
        window.GUI?.toast('Compliance evidence was not saved: '+(err&&err.message||'backend error'));
      }
    });
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();build();if(connected())render();
    window.addEventListener('genevieve:kennels-api-session',()=>{if(connected())render()});
  }
  window.KennelComplianceBackend={connected,render};
  document.addEventListener('DOMContentLoaded',init);
})();
