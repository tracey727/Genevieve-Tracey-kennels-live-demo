const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const base='GENEVIEVE_CATS_DOGS_LIVE_DEMO';
const index=fs.readFileSync(base+'/index.html','utf8');
const app=fs.readFileSync(base+'/app.js','utf8');
const sw=fs.readFileSync(base+'/sw.js','utf8');

const adapters=[
  'kennel-dashboard-api-ui.js',
  'kennel-staff-api-ui.js',
  'kennel-animals-api-ui.js',
  'kennel-bookings-api-ui.js',
  'kennel-custody-api-ui.js',
  'kennel-care-api-ui.js',
  'kennel-stock-api-ui.js',
  'kennel-ops-api-ui.js',
  'kennel-incidents-api-ui.js',
  'kennel-compliance-api-ui.js',
  'kennel-emergency-api-ui.js',
  'kennel-rooms-api-ui.js'
];

test('all authenticated screen adapters are loaded and cached',()=>{
  for(const file of adapters){
    assert.ok(index.includes('./'+file),'index missing '+file);
    assert.ok(sw.includes('./'+file),'service worker missing '+file);
    assert.ok(fs.existsSync(base+'/'+file),'file missing '+file);
  }
});

test('core screen renderers delegate to authenticated backends',()=>{
  for(const marker of [
    'KennelDashboardBackend',
    'KennelAnimalsBackend',
    'KennelBookingsBackend',
    'KennelCustodyBackend',
    'KennelRoomsBackend',
    'KennelCareBackend',
    'KennelStockBackend',
    'KennelOpsBackend',
    'KennelStaffBackend',
    'KennelEmergencyBackend',
    'KennelIncidentBackend'
  ])assert.ok(app.includes(marker),'app renderer missing '+marker);
});

test('secure API client is loaded before authenticated adapters',()=>{
  const api=index.indexOf('./kennel-api.js');
  assert.ok(api>=0);
  for(const file of adapters)assert.ok(index.indexOf('./'+file)>api,file+' loads before API client');
});
