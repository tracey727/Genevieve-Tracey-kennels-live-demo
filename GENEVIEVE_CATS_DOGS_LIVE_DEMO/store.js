(function(){
  const KEY='genevieve_cats_dogs_demo_v1';
  const channel=('BroadcastChannel' in window)?new BroadcastChannel('genevieve-cats-dogs-demo'):null;
  const now=()=>new Date().toISOString();
  const plus=(minutes)=>new Date(Date.now()+minutes*60000).toISOString();
  const defaults={
    version:1,
    facility:{name:'GENEVIEVE App™ Kennels & Cattery',state:'green',reason:'All systems operational · No active critical alerts',capacityDogs:50,capacityCats:25},
    staff:[
      {id:'s1',name:'Tracey K',role:'Manager',onShift:true,firstAid:true,animalFirstAid:true},
      {id:'s2',name:'Sarah M',role:'Senior Attendant',onShift:true,firstAid:true,animalFirstAid:true},
      {id:'s3',name:'Jordan P',role:'Attendant',onShift:true,firstAid:false,animalFirstAid:true},
      {id:'s4',name:'Casey L',role:'Driver / Attendant',onShift:true,firstAid:true,animalFirstAid:true},
      {id:'s5',name:'Alex R',role:'Attendant',onShift:true,firstAid:false,animalFirstAid:true},
      {id:'s6',name:'Mia D',role:'Reception',onShift:true,firstAid:true,animalFirstAid:false}
    ],
    animals:[
      {id:'a1',name:'Mr Gruff',species:'Dog',breed:'Mixed breed',sex:'Male',age:'4 yrs',weight:'24 kg',status:'In care',room:'Dog Run B4',light:'green',photo:'./assets/mr-gruff.jpg',owner:'Tracey Kennedy',microchip:'Hidden in demo',vaccination:'Current',desexed:'Yes',allergies:'Chicken',diet:'Sensitive skin diet',medication:'None',behaviour:'Needs slow introductions; no small dogs rushing',playStyle:'Gentle / social',bestMatches:'Bella, Cooper, Luna',dislikes:'Loud barking and sudden handling',pickupAuthorised:'Tracey Kennedy',medicalPriority:false},
      {id:'a2',name:'Bella',species:'Dog',breed:'Labradoodle',sex:'Female',age:'5 yrs',weight:'21 kg',status:'In care',room:'Dog Run A2',light:'green',owner:'Sam Lee',vaccination:'Current',allergies:'None known',diet:'Own food · 1 cup twice daily',medication:'Tablet with food 9:45am',behaviour:'Friendly; may jump at gate',pickupAuthorised:'Sam Lee; Jamie Lee',medicalPriority:true},
      {id:'a3',name:'Max',species:'Dog',breed:'German Shepherd',sex:'Male',age:'6 yrs',weight:'36 kg',status:'In care',room:'Quiet Dog Run 1',light:'amber',owner:'Chris Nguyen',vaccination:'Current',allergies:'Beef',diet:'Large breed diet',medication:'Annual vaccination appointment 2:00pm',behaviour:'Reactive to unfamiliar males; two-person movement',pickupAuthorised:'Chris Nguyen',medicalPriority:true},
      {id:'a4',name:'Misty',species:'Cat',breed:'Domestic Shorthair',sex:'Female',age:'8 yrs',weight:'4.5 kg',status:'In care',room:'Cat Suite 3',light:'green',owner:'Rebecca Hall',vaccination:'Current',allergies:'None known',diet:'Renal wet food',medication:'Renal medication 6:00pm',behaviour:'Quiet; prefers hiding box; low handling tolerance',pickupAuthorised:'Rebecca Hall',medicalPriority:true},
      {id:'a5',name:'Simba',species:'Cat',breed:'Maine Coon',sex:'Male',age:'3 yrs',weight:'7.2 kg',status:'Arriving',room:'Cat Suite 6',light:'amber',owner:'Ari Patel',vaccination:'Evidence awaiting final check',allergies:'Fish',diet:'Owner supplied',medication:'None',behaviour:'Escape risk at doors; confident once settled',pickupAuthorised:'Ari Patel; Nita Patel',medicalPriority:false},
      {id:'a6',name:'Luna',species:'Cat',breed:'Ragdoll',sex:'Female',age:'12 yrs',weight:'5.1 kg',status:'In care',room:'Senior Cat Suite 1',light:'green',owner:'Morgan Taylor',vaccination:'Current',allergies:'None known',diet:'Senior wet food · warmed',medication:'Arthritis medication 8:00pm',behaviour:'Senior mobility; step access and low litter tray',pickupAuthorised:'Morgan Taylor',medicalPriority:true}
    ],
    rooms:[
      {id:'r1',name:'Dog Run A2',species:'Dog',type:'General',state:'green',temperature:22.0,humidity:52,gate:'Secure',occupiedBy:'a2'},
      {id:'r2',name:'Dog Run B4',species:'Dog',type:'General',state:'green',temperature:22.3,humidity:51,gate:'Secure',occupiedBy:'a1'},
      {id:'r3',name:'Quiet Dog Run 1',species:'Dog',type:'Quiet / reactive',state:'amber',temperature:21.8,humidity:50,gate:'Two-person transfer',occupiedBy:'a3'},
      {id:'r4',name:'Cat Suite 3',species:'Cat',type:'Quiet',state:'green',temperature:23.0,humidity:47,gate:'Secure',occupiedBy:'a4'},
      {id:'r5',name:'Cat Suite 6',species:'Cat',type:'Escape-control',state:'amber',temperature:22.6,humidity:49,gate:'Airlock check required',occupiedBy:'a5'},
      {id:'r6',name:'Senior Cat Suite 1',species:'Cat',type:'Medical / senior',state:'green',temperature:23.2,humidity:48,gate:'Secure',occupiedBy:'a6'},
      {id:'r7',name:'Isolation & Medical',species:'Both',type:'Isolation',state:'green',temperature:22.0,humidity:50,gate:'Ready',occupiedBy:null}
    ],
    bookings:[
      {id:'b1',animalId:'a2',type:'Drop-off',time:plus(-70),status:'Completed'},
      {id:'b2',animalId:'a3',type:'Drop-off',time:plus(-40),status:'Completed'},
      {id:'b3',animalId:'a5',type:'Drop-off',time:plus(80),status:'Due'},
      {id:'b4',animalId:'a4',type:'Pick-up',time:plus(150),status:'Due'},
      {id:'b5',animalId:'a1',type:'Pick-up',time:plus(300),status:'Due'}
    ],
    tasks:[
      {id:'t1',animalId:'a2',type:'Medication',detail:'Give 1 tablet with food',due:plus(25),status:'Open',assignedTo:'s2',severity:'amber'},
      {id:'t2',animalId:'a3',type:'Vet appointment',detail:'Annual vaccination appointment',due:plus(280),status:'Open',assignedTo:'s1',severity:'red'},
      {id:'t3',animalId:'a4',type:'Medication',detail:'Renal medication',due:plus(500),status:'Open',assignedTo:'s3',severity:'green'},
      {id:'t4',animalId:'a6',type:'Medication',detail:'Arthritis medication',due:plus(620),status:'Open',assignedTo:'s3',severity:'green'},
      {id:'t5',animalId:null,type:'Facility',detail:'Check Cat Suite 6 airlock before Simba arrives',due:plus(55),status:'Open',assignedTo:'s2',severity:'amber'}
    ],
    rounds:[
      {id:'rd1',zone:'Kennel Block A',species:'Dog',due:plus(-80),status:'Completed',progress:100,assignedTo:'s3',completedAt:plus(-75),checks:{}},
      {id:'rd2',zone:'Kennel Block B',species:'Dog',due:plus(-35),status:'Completed',progress:100,assignedTo:'s2',completedAt:plus(-30),checks:{}},
      {id:'rd3',zone:'Cattery Suites 1–6',species:'Cat',due:plus(20),status:'In progress',progress:60,assignedTo:'s3',checks:{sighted:true,water:true,food:true,behaviour:true}},
      {id:'rd4',zone:'Yard A — Large Dogs',species:'Dog',due:plus(55),status:'Due',progress:0,assignedTo:'s2',checks:{}},
      {id:'rd5',zone:'Isolation & Medical',species:'Both',due:plus(95),status:'Due',progress:0,assignedTo:'s1',checks:{}},
      {id:'rd6',zone:'Property & Perimeter',species:'Facility',due:plus(140),status:'Due',progress:0,assignedTo:'s4',checks:{}}
    ],
    transports:[
      {id:'tr1',animalId:'a5',direction:'Collect',address:'Owner address hidden in demo',due:plus(70),driverId:'s4',vehicle:'Pet Van 1',crate:'Cat carrier C-12',status:'Scheduled',temperature:null,checklist:{}},
      {id:'tr2',animalId:'a4',direction:'Return home',address:'Owner address hidden in demo',due:plus(165),driverId:'s4',vehicle:'Pet Van 1',crate:'Cat carrier C-08',status:'Scheduled',temperature:null,checklist:{}}
    ],
    stock:[
      {id:'st1',category:'Food',item:'Sensitive skin dog diet',quantity:18,unit:'meals',minimum:10,expiry:'2026-10-30',state:'green'},
      {id:'st2',category:'Food',item:'Renal cat wet food',quantity:8,unit:'meals',minimum:10,expiry:'2027-01-20',state:'amber'},
      {id:'st3',category:'Medication',item:'Medication fridge supplies',quantity:14,unit:'items',minimum:5,expiry:'2026-09-15',state:'green'},
      {id:'st4',category:'PPE',item:'Nitrile gloves',quantity:2,unit:'boxes',minimum:3,expiry:'',state:'amber'},
      {id:'st5',category:'Cleaning',item:'Approved disinfectant',quantity:6,unit:'litres',minimum:3,expiry:'2027-02-01',state:'green'},
      {id:'st6',category:'Emergency',item:'Carrier ID tags',quantity:36,unit:'tags',minimum:20,expiry:'',state:'green'}
    ],
    emergency:{active:false,type:null,startedAt:null,owner:null,checks:{}},
    alerts:[
      {id:'al1',severity:'amber',title:'Max requires two-person transfer',detail:'Quiet Dog Run 1 · behaviour safety instruction',owner:'Sarah M',status:'Open',createdAt:now()},
      {id:'al2',severity:'amber',title:'Simba vaccination evidence',detail:'Reception must confirm before admission',owner:'Mia D',status:'Open',createdAt:now()}
    ],
    incidents:[
      {id:'i1',severity:'amber',type:'Near miss',animalId:'a3',detail:'Gate crowding observed. No injury. Two-person transfer control reinforced.',createdAt:plus(-1440),status:'Follow-up'},
    ],
    audit:[{id:'au1',time:now(),actor:'System',action:'Demo started',detail:'Current facility state calculated as GREEN'}],
    ownerUpdates:[
      {id:'u1',animalId:'a1',time:plus(-180),message:'Mr Gruff settled into Dog Run B4 and completed his first water and comfort check.'},
      {id:'u2',animalId:'a4',time:plus(-90),message:'Misty ate part of her renal meal and is resting in her hiding box.'}
    ]
  };
  function clone(x){return JSON.parse(JSON.stringify(x))}
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||clone(defaults)}catch(e){return clone(defaults)}}
  let state=load();
  function save(next,signal=true){state=next;localStorage.setItem(KEY,JSON.stringify(state));if(signal&&channel)channel.postMessage({type:'state',state});window.dispatchEvent(new CustomEvent('genevieve:state',{detail:state}));return state}
  function update(fn,actor='User',action='Updated record',detail=''){
    const next=clone(state);fn(next);next.audit.unshift({id:'au_'+Date.now(),time:now(),actor,action,detail});next.audit=next.audit.slice(0,150);return save(next)
  }
  function reset(){return save(clone(defaults))}
  function get(){return clone(state)}
  function animal(id){return state.animals.find(a=>a.id===id)}
  function staff(id){return state.staff.find(s=>s.id===id)}
  function calculateFacilityState(s=state){
    const red=s.alerts.some(a=>a.status==='Open'&&a.severity==='red')||s.incidents.some(i=>i.status!=='Closed'&&i.severity==='red');
    const amber=s.alerts.some(a=>a.status==='Open'&&a.severity==='amber')||s.rooms.some(r=>r.state==='amber');
    if(red)return {state:'red',label:'RED — URGENT ACTION',reason:'A critical alert or incident requires immediate ownership'};
    if(amber)return {state:'green',label:'GREEN — NORMAL OPERATIONS',reason:'Normal operations with controlled amber items under active management'};
    return {state:'green',label:'GREEN — NORMAL OPERATIONS',reason:'All systems operational · No active critical alerts'};
  }
  if(channel)channel.onmessage=(e)=>{if(e.data&&e.data.type==='state'){state=e.data.state;localStorage.setItem(KEY,JSON.stringify(state));window.dispatchEvent(new CustomEvent('genevieve:state',{detail:state}))}};
  window.addEventListener('storage',(e)=>{if(e.key===KEY&&e.newValue){state=JSON.parse(e.newValue);window.dispatchEvent(new CustomEvent('genevieve:state',{detail:state}))}});
  window.GStore={get,save,update,reset,animal,staff,calculateFacilityState,KEY,defaults:clone(defaults)};
})();
