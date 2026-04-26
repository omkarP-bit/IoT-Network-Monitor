#!/usr/bin/env node
const http = require('http');
const args    = process.argv.slice(2);
const getArg  = (flag, def) => { const i = args.indexOf(flag); return i !== -1 ? args[i+1] : def; };
const hasFlag = (flag) => args.includes(flag);
const NODE_COUNT   = parseInt(getArg('--nodes','2'));
const RATE_PER_SEC = parseInt(getArg('--rate','5'));
const TARGET_URL   = getArg('--url','http://localhost:3000');
const SPIKE_MODE   = hasFlag('--spike');
const ROGUE_MODE   = hasFlag('--rogue');

function randomMac(){return Array.from({length:6},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0').toUpperCase()).join(':');}
function randomRSSI(base,jitter){base=base||-65;jitter=jitter||10;return Math.round(base+(Math.random()-0.5)*jitter*2);}
function buildPool(size){return Array.from({length:size||8},randomMac);}
const FTYPES=[0,0,0,2,2,2,2,1],FSUBS=[0,4,8,12];
function randomPacket(pool,base){
  const mac=Math.random()<0.85?pool[Math.floor(Math.random()*pool.length)]:randomMac();
  return{mac,rssi:randomRSSI(base),type:FTYPES[Math.floor(Math.random()*FTYPES.length)],subtype:FSUBS[Math.floor(Math.random()*FSUBS.length)],ts:Date.now()};
}
function postPackets(nodeId,packets){
  const body=JSON.stringify({node_id:nodeId,packets});
  const url=new URL('/api/packets',TARGET_URL);
  return new Promise(resolve=>{
    const req=http.request({hostname:url.hostname,port:url.port||80,path:url.pathname,method:'POST',
      headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},
      res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>resolve({status:res.statusCode,body:d}));});
    req.on('error',e=>resolve({status:0,error:e.message}));
    req.write(body);req.end();
  });
}
function SimNode(id){
  this.id='ESP32-SIM-'+String(id).padStart(2,'0');
  this.pool=buildPool(10);this.rssiBase=randomRSSI(-60,5);this.sent=0;this.errors=0;
}
SimNode.prototype.sendBatch=async function(){
  const packets=[randomPacket(this.pool,this.rssiBase)];
  if(ROGUE_MODE&&Math.random()<0.15){
    packets.push({mac:'DE:AD:BE:EF:CA:FE',rssi:-45,type:0,subtype:4,ts:Date.now()});
    console.log('['+this.id+'] Injecting rogue MAC DE:AD:BE:EF:CA:FE');
  }
  const r=await postPackets(this.id,packets);
  if(r.status===202){this.sent++;}
  else{this.errors++;console.error('['+this.id+'] HTTP '+(r.status||'ERR')+' '+r.error||r.body);}
};
async function main(){
  console.log('ESP32 Simulator started');
  console.log('  nodes='+NODE_COUNT+' | rate='+RATE_PER_SEC+' pkt/s | target='+TARGET_URL);
  console.log('  spike='+SPIKE_MODE+' | rogue='+ROGUE_MODE+'\n');
  const nodes=Array.from({length:NODE_COUNT},(_,i)=>new SimNode(i+1));
  const intervalMs=Math.floor(1000/RATE_PER_SEC);
  setInterval(()=>{
    const sent=nodes.reduce((s,n)=>s+n.sent,0);
    const errs=nodes.reduce((s,n)=>s+n.errors,0);
    console.log('[stats] sent='+sent+' errors='+errs);
  },5000);
  if(SPIKE_MODE){
    setTimeout(async()=>{
      console.log('[SPIKE] Injecting 80 packets on node 1...');
      await postPackets(nodes[0].id,Array.from({length:80},()=>randomPacket(nodes[0].pool,nodes[0].rssiBase)));
    },8000);
  }
  for(const node of nodes){
    (async function(n){
      while(true){
        await n.sendBatch();
        await new Promise(r=>setTimeout(r,intervalMs+Math.floor(Math.random()*200)));
      }
    })(node);
  }
}
main().catch(console.error);
