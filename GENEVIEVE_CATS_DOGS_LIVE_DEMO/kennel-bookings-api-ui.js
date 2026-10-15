/* Authenticated Bookings & Intake adapter.
 * Keeps booking records in the signed-in kennel facility only.
 */
(function(){
  'use strict';
  let client=null,panel=null,animalSelect=null;
  const esc=(x)=>window.GUI&&window.GUI.esc?window.GUI.esc(x==null?'':String(x)):String(x==null?'':x);
  const badge=(label,state)=>window.GUI&&window.GUI.badge?window.GUI.badge(label,state):'<span>'+esc(label)+'</span>';
  const fmt=(x)=>window.GUI&&window.GUI.fmt?window.GUI.fmt(x):esc(x);
  const connected=()=>Boolean(client&&client.hasToken());

  async function load(){
    const [animals,bookings]=await Promise.all([client.animals(),client.bookings()]);
    return {animals,bookings};
  }
  function renderTable(data){
    const target=document.getElementById('bookingTable');
    if(!target)return;
    const byId=new Map(data.animals.map(a=>[a.id,a]));
    target.innerHTML='<div class="table-wrap"><table><thead><tr><th>Animal</th><th>Species</th><th>Movement</th><th>Date/time</th><th>Status</th><th>Owner</th></tr></thead><tbody>'+
      data.bookings.map(b=>{const a=byId.get(b.animal_id)||{};return '<tr><td>'+esc(a.name||'Unknown')+'</td><td>'+esc(a.species||'')+'</td><td>'+esc(b.booking_type==='drop_off'?'Drop-off':'Pick-up')+'</td><td>'+fmt(b.due_at)+'</td><td>'+badge(String(b.status||'').toUpperCase(),b.status==='completed'?'green':'yellow')+'</td><td>'+esc(a.owner_name||'')+'</td></tr>'}).join('')+
      '</tbody></table></div>';
    if(animalSelect){
      const current=animalSelect.value;
      animalSelect.innerHTML=data.animals.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+' · '+esc(a.species)+'</option>').join('');
      if(current)animalSelect.value=current;
    }
  }
  async function render(){
    if(!connected())return false;
    try{renderTable(await load());return true}
    catch(e){
      if(e&&e.status===401)client.disconnect();
      const target=document.getElementById('bookingTable');
      if(target)target.innerHTML='<div class="alert-box red"><h3>Bookings backend unavailable</h3><p>'+esc(e&&e.message||'Connection failed')+'</p></div>';
      return false;
    }
  }
  function ensurePanel(){
    const section=document.getElementById('bookings');
    if(!section||panel)return;
    panel=document.createElement('form');
    panel.className='card';
    panel.setAttribute('data-kennel-booking-form','');
    panel.innerHTML='<p class="eyebrow">Authenticated booking</p><h2>Create facility booking</h2><div class="form-grid three"><label>Animal<select name="animal_id" required></select></label><label>Movement<select name="booking_type"><option value="drop_off">Drop-off</option><option value="pick_up">Pick-up</option></select></label><label>Due date/time<input type="datetime-local" name="due_at" required></label></div><button class="btn" type="submit">Create secure booking</button><p class="small">This creates the booking in the isolated Kennels backend and audit trail. It does not contact owners or take payment.</p>';
    const tableCard=section.querySelector('.card:last-child');
    section.insertBefore(panel,tableCard||null);
    animalSelect=panel.querySelector('[name=animal_id]');
    panel.addEventListener('submit',async e=>{
      e.preventDefault();
      if(!connected())return;
      const f=new FormData(panel);
      const dueRaw=String(f.get('due_at')||'');
      const due=new Date(dueRaw);
      if(!Number.isFinite(due.getTime())){window.GUI?.toast('Enter a valid booking date and time');return}
      try{
        await client.createBooking({animal_id:f.get('animal_id'),booking_type:f.get('booking_type'),due_at:due.toISOString()});
        panel.reset();
        window.GUI?.toast('Booking saved securely');
        await render();
      }catch(err){
        if(err&&err.status===401)client.disconnect();
        window.GUI?.toast('Booking was not saved: '+(err&&err.message||'backend error'));
      }
    });
  }
  function init(){
    if(!window.KennelAPI)return;
    client=window.KennelAPI.sharedClient();
    ensurePanel();
    if(connected())render();
  }
  window.KennelBookingsBackend={connected,render};
  document.addEventListener('DOMContentLoaded',init);
})();
