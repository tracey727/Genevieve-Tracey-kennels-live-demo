/* Authenticated Stock & Supplies screen adapter. */
(function(){
  'use strict';
  let client=null;
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const badge=(label,state)=>window.GUI&&window.GUI.badge?window.GUI.badge(label,state):'<span>'+esc(label)+'</span>';
  const connected=()=>Boolean(client&&client.hasToken());

  async function render(){
    if(!connected())return false;
    const target=document.getElementById('stockTable');if(!target)return false;
    try{
      const rows=await client.stock();
      target.innerHTML='<div class="table-wrap"><table><thead><tr><th>Category</th><th>Item</th><th>Quantity</th><th>Minimum</th><th>Expiry</th><th>State</th></tr></thead><tbody>'+
        rows.map(x=>'<tr><td>'+esc(x.category)+'</td><td>'+esc(x.item)+'</td><td>'+esc(x.quantity)+' '+esc(x.unit||'')+'</td><td>'+esc(x.minimum)+'</td><td>'+esc(x.expiry||'Not applicable')+'</td><td>'+badge(String(x.assurance_state||'').toUpperCase(),x.assurance_state||'outline')+'</td></tr>').join('')+
        '</tbody></table></div>';
      return true;
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      target.innerHTML='<div class="alert-box red"><h3>Stock backend unavailable</h3><p>'+esc(e&&e.message||'Connection failed')+'</p></div>';
      return false;
    }
  }
  async function submit(form,event){
    if(!connected())return;
    event.preventDefault();event.stopImmediatePropagation();
    const f=new FormData(form);
    const quantity=Number(f.get('quantity')),minimum=Number(f.get('minimum'));
    if(!Number.isFinite(quantity)||quantity<0||!Number.isFinite(minimum)||minimum<0){window.GUI?.toast('Enter valid stock quantities');return}
    try{
      await client.createStock({
        category:String(f.get('category')||'').trim(),
        item:String(f.get('item')||'').trim(),
        quantity,
        unit:String(f.get('unit')||'').trim()||null,
        minimum,
        expiry:String(f.get('expiry')||'').trim()||null
      });
      form.reset();window.GUI?.toast('Stock item saved securely');await render();
    }catch(e){
      if(e&&e.status===401)client.disconnect();
      window.GUI?.toast('Stock item was not saved: '+(e&&e.message||'backend error'));
    }
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();
    const form=document.getElementById('stockForm');
    if(form)form.addEventListener('submit',e=>{if(connected())submit(form,e)},true);
    if(connected())render();
  }
  window.KennelStockBackend={connected,render};
  document.addEventListener('DOMContentLoaded',init);
})();
