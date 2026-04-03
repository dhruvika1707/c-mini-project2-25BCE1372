// ═══════ DATA ═══════
const MOVIES=[
  {title:"Inception",genre:"Sci-Fi Thriller",emoji:"🌀",langs:["English","Hindi"],rating:"U/A"},
  {title:"Avengers",genre:"Action",emoji:"🦸",langs:["English","Hindi","Tamil"],rating:"U/A"},
  {title:"Interstellar",genre:"Sci-Fi Drama",emoji:"🌌",langs:["English","Hindi"],rating:"U/A"},
  {title:"RRR",genre:"Action Drama",emoji:"🔥",langs:["Telugu","Hindi","Tamil"],rating:"A"},
  {title:"Oppenheimer",genre:"Historical",emoji:"💣",langs:["English","Hindi"],rating:"A"},
];
const TIMINGS=["10:00 AM","1:30 PM","5:00 PM","8:30 PM"];
const HALLS=[
  {name:"Hall A — Prestige"},{name:"Hall B — Classic"},{name:"Hall C — Platinum"},
  {name:"Hall D — IMAX"},{name:"Hall E — Luxe"},
];
const ROWS=[
  {r:"A",n:8,z:"z-ns",p:120,lbl:"Near Screen"},
  {r:"B",n:8,z:"z-ns",p:120,lbl:"Near Screen"},
  {r:"C",n:8,z:"z-ns",p:120,lbl:"Near Screen"},
  {r:"D",n:10,z:"z-st",p:200,lbl:"Standard"},
  {r:"E",n:10,z:"z-st",p:200,lbl:"Standard"},
  {r:"F",n:10,z:"z-pr",p:300,lbl:"Premium"},
  {r:"G",n:10,z:"z-pr",p:300,lbl:"Premium"},
  {r:"H",n:10,z:"z-el",p:420,lbl:"Elite Recliner"},
  {r:"I",n:10,z:"z-el",p:420,lbl:"Elite Recliner"},
  {r:"J",n:6, z:"z-ry",p:550,lbl:"Royal Suite"},
];
const TOTAL=ROWS.reduce((s,r)=>s+r.n,0); // 90

// ═══════ SHOW CLASS ═══════
class Show{
  constructor(hi){
    this.hi=hi;
    this.seats=new Array(TOTAL).fill(false);
    this.load();
  }
  load(){
    try{const d=localStorage.getItem('cb_h'+this.hi);if(d)JSON.parse(d).forEach((v,i)=>{if(i<TOTAL)this.seats[i]=v});}catch(e){}
  }
  save(){try{localStorage.setItem('cb_h'+this.hi,JSON.stringify(this.seats));}catch(e){}}
  isAvailable(i){return i>=0&&i<TOTAL&&!this.seats[i]}
  book(arr){arr.forEach(i=>{if(i>=0&&i<TOTAL)this.seats[i]=true});this.save()}
  available(){return this.seats.filter(s=>!s).length}
  booked(){return this.seats.filter(s=>s).length}
  getPrice(i){let c=0;for(const r of ROWS){if(i<c+r.n)return r.p;c+=r.n}return 0}
  getZone(i){let c=0;for(const r of ROWS){if(i<c+r.n)return r.z;c+=r.n}return 'z-st'}
  display(){
    const rows=[];let g=0;
    for(const rc of ROWS){
      const s=[];
      for(let j=0;j<rc.n;j++)s.push({idx:g,bk:this.seats[g],z:rc.z,p:rc.p,lbl:rc.lbl}),g++;
      rows.push({r:rc.r,seats:s,z:rc.z,lbl:rc.lbl});
    }
    return rows;
  }
}

// ═══════ THEATRE SYSTEM ═══════
class TheatreSystem{
  constructor(){
    this.shows=HALLS.map((_,i)=>new Show(i));
    this.nextID=parseInt(localStorage.getItem('cb_nid')||'1000');
    this.bookings=JSON.parse(localStorage.getItem('cb_bk')||'[]');
  }
  destroy(){this.shows.forEach(s=>s.save());localStorage.setItem('cb_nid',this.nextID);localStorage.setItem('cb_bk',JSON.stringify(this.bookings))}
  getShow(i){return this.shows[i]}
  bookSeats({hi,mi,li,fmt,ti,name,phone,sel}){
    const sh=this.shows[hi];
    if(!name.trim())return{ok:false,msg:'Please enter your name.'};
    if(!sel.length)return{ok:false,msg:'Please select at least one seat.'};
    const bad=sel.filter(i=>!sh.isAvailable(i));
    if(bad.length)return{ok:false,msg:'Some seats are no longer available.'};
    sh.book(sel);
    let base=sel.reduce((s,i)=>s+sh.getPrice(i),0);
    const sur=fmt==='3D'?100*sel.length:0;
    const total=base+sur;
    const b={id:this.nextID++,hi,hallName:HALLS[hi].name,movie:MOVIES[mi].title,lang:MOVIES[mi].langs[li],fmt,time:TIMINGS[ti],name:name.trim(),phone:phone.trim(),seats:sel,total,ts:new Date().toISOString()};
    this.bookings.push(b);this.destroy();
    return{ok:true,b};
  }
  search(id){return this.bookings.find(b=>b.id===id)||null}
  report(){return this.shows.map((sh,i)=>({hall:HALLS[i].name,bk:sh.booked(),av:sh.available(),tot:TOTAL,pct:Math.round(sh.booked()/TOTAL*100)}))}
}

// ═══════ GLOBALS ═══════
const TS=new TheatreSystem();
window.addEventListener('beforeunload',()=>TS.destroy());
let vHall=0;
let BK={mi:null,li:0,fmt:'2D',hi:null,ti:null,sel:[]};

// ═══════ menu() — NAVIGATION ═══════
function nav(s){
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('on'));
  document.querySelectorAll('.s-item').forEach(x=>x.classList.remove('active'));
  document.getElementById('screen-'+s).classList.add('on');
  document.querySelector('[data-s="'+s+'"]').classList.add('active');
  if(window.innerWidth<=900)document.getElementById('sidebar').classList.remove('open');
  if(s==='seats')renderViewHall();
  if(s==='book')initBook();
  if(s==='report')renderReport();
  if(s==='search')renderAllBookings();
  updateSidebar();
}

function updateSidebar(){
  const sh=TS.getShow(vHall);
  document.getElementById('sf-bk').textContent=sh.booked();
  document.getElementById('sf-av').textContent=sh.available();
  document.getElementById('badge').textContent=sh.available();
}

// ═══════ RENDER HALL ═══════
function renderHallHTML(rows,interactive,sel=[]){
  return rows.map(row=>{
    const mid=Math.ceil(row.seats.length/2);
    let s='';
    row.seats.forEach((seat,i)=>{
      if(i===mid)s+=`<div class="aisle"></div>`;
      const bk=seat.bk?'bk':'';
      const selected=sel.includes(seat.idx)?'sel':'';
      const click=(!seat.bk&&interactive)?`onclick="toggleSeat(${seat.idx},this)"`:'';
      s+=`<div class="seat ${seat.z} ${bk} ${selected}" data-i="${seat.idx}" title="Seat ${seat.idx+1} | ${seat.lbl} | ₹${seat.p}" ${click}>${seat.idx+1}</div>`;
    });
    const royal=row.z==='z-ry'?'':'';
    return`<div class="seat-row"><div class="row-lbl">${row.r}</div><div class="row-seats">${s}</div></div>`;
  }).join('');
}

function switchHall(i,btn,ctx){
  vHall=i;
  const tabs=document.getElementById('htabs-seats');
  if(tabs)tabs.querySelectorAll('.htab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  if(ctx==='seats')renderViewHall();
  updateSidebar();
}

function renderViewHall(){
  const sh=TS.getShow(vHall);
  document.getElementById('hall-view').innerHTML=renderHallHTML(sh.display(),false);
  document.getElementById('hall-meta-view').innerHTML=`
    <div class="hall-meta-item">🏛️ ${HALLS[vHall].name}</div>
    <div class="hall-meta-item">🟢 ${sh.available()} available</div>
    <div class="hall-meta-item">🔴 ${sh.booked()} booked</div>
    <div class="hall-meta-item">📊 ${Math.round(sh.booked()/TOTAL*100)}% full</div>`;
}

// ═══════ BOOK FLOW ═══════
function initBook(){
  BK={mi:null,li:0,fmt:'2D',hi:null,ti:null,sel:[]};
  ['s2','s3','s4','s5'].forEach(dim);
  renderMovieGrid();
  document.getElementById('b2d').classList.add('on');
  document.getElementById('b3d').classList.remove('on');
}
function undim(id){document.getElementById(id).classList.remove('dim')}
function dim(id){document.getElementById(id).classList.add('dim')}

function renderMovieGrid(){
  document.getElementById('movie-grid').innerHTML=MOVIES.map((m,i)=>`
    <div class="movie-card" onclick="pickMovie(${i},this)">
      <div class="movie-emoji">${m.emoji}</div>
      <div class="movie-title">${m.title}</div>
      <div class="movie-meta">${m.langs.join(' / ')} &nbsp;·&nbsp; ${m.rating}</div>
      <div class="movie-genre">${m.genre}</div>
    </div>`).join('');
}

function pickMovie(i,el){
  BK.mi=i;BK.li=0;BK.sel=[];
  document.querySelectorAll('.movie-card').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
  renderLangs(i);undim('s2');
  ['s3','s4','s5'].forEach(dim);
}
function renderLangs(i){
  document.getElementById('lang-grp').innerHTML=MOVIES[i].langs.map((l,j)=>`<button class="tbtn ${j===0?'on':''}" onclick="pickLang(${j},this)">${l}</button>`).join('');
}
function pickLang(i,btn){
  BK.li=i;
  document.querySelectorAll('#lang-grp .tbtn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  renderHallTime();
}
function setFmt(f,btn){
  BK.fmt=f;
  document.getElementById('b2d').classList.remove('on');
  document.getElementById('b3d').classList.remove('on');
  btn.classList.add('on');
  if(BK.mi!==null)renderHallTime();
  if(BK.sel.length)renderSelInfo(),renderBSum();
}
function renderHallTime(){
  undim('s3');
  document.getElementById('ht-grid').innerHTML=HALLS.map((h,hi)=>
    TIMINGS.map((t,ti)=>{
      const av=TS.getShow(hi).available();
      return`<div class="ht-card" onclick="pickHT(${hi},${ti},this)"><div class="ht-hall">${h.name.split(' — ')[0]}</div><div class="ht-time">${t}</div><div class="ht-avail">${av} seats free</div></div>`;
    }).join('')
  ).join('');
  ['s4','s5'].forEach(dim);
}
function pickHT(hi,ti,el){
  BK.hi=hi;BK.ti=ti;BK.sel=[];
  document.querySelectorAll('.ht-card').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
  renderPicker();undim('s4');dim('s5');
}
function renderPicker(){
  const sh=TS.getShow(BK.hi);
  document.getElementById('hall-pick').innerHTML=renderHallHTML(sh.display(),true,BK.sel);
  renderSelInfo();
}
function toggleSeat(idx,el){
  const i=BK.sel.indexOf(idx);
  if(i===-1){BK.sel.push(idx);el.classList.add('sel');}
  else{BK.sel.splice(i,1);el.classList.remove('sel');}
  renderSelInfo();
  if(BK.sel.length){undim('s5');renderBSum();}else dim('s5');
}
function renderSelInfo(){
  const el=document.getElementById('sel-info');
  if(!BK.sel.length){el.textContent='Tap seats to select them.';return;}
  const sh=TS.getShow(BK.hi);
  const nums=BK.sel.map(i=>i+1).sort((a,b)=>a-b).join(', ');
  const sub=BK.sel.reduce((s,i)=>s+sh.getPrice(i),0);
  const sur=BK.fmt==='3D'?100*BK.sel.length:0;
  el.innerHTML=`<strong style="color:var(--text)">${BK.sel.length} seat(s):</strong> ${nums} &nbsp;·&nbsp; <span style="color:var(--gold2);font-weight:600">₹${sub+sur}</span>${sur?` <span style="color:var(--muted);font-size:12px">(incl. ₹${sur} 3D)</span>`:''}`;
}
function renderBSum(){
  if(BK.mi===null||BK.hi===null)return;
  const sh=TS.getShow(BK.hi);
  const base=BK.sel.reduce((s,i)=>s+sh.getPrice(i),0);
  const sur=BK.fmt==='3D'?100*BK.sel.length:0;
  document.getElementById('bsum').innerHTML=`
    <div class="bsum-row"><span class="bsum-lbl">Movie</span><span class="bsum-val">${MOVIES[BK.mi].emoji} ${MOVIES[BK.mi].title}</span></div>
    <div class="bsum-row"><span class="bsum-lbl">Language</span><span class="bsum-val">${MOVIES[BK.mi].langs[BK.li]} · ${BK.fmt}</span></div>
    <div class="bsum-row"><span class="bsum-lbl">Hall & Time</span><span class="bsum-val">${HALLS[BK.hi].name.split(' — ')[0]} · ${TIMINGS[BK.ti]}</span></div>
    <div class="bsum-row"><span class="bsum-lbl">Seats</span><span class="bsum-val">${BK.sel.map(i=>i+1).sort((a,b)=>a-b).join(', ')}</span></div>
    <hr class="bsum-divider"/>
    <div class="bsum-row"><span class="bsum-lbl">Base</span><span class="bsum-val">₹${base}</span></div>
    ${sur?`<div class="bsum-row"><span class="bsum-lbl">3D Surcharge</span><span class="bsum-val">₹${sur}</span></div>`:''}
    <hr class="bsum-divider"/>
    <div class="bsum-row bsum-total"><span class="bsum-lbl">Total</span><span class="bsum-val">₹${base+sur}</span></div>`;
}

// ═══════ bookSeats() / confirmBooking ═══════
function confirmBooking(){
  const name=document.getElementById('inp-name').value;
  const phone=document.getElementById('inp-phone').value;
  const res=TS.bookSeats({hi:BK.hi,mi:BK.mi,li:BK.li,fmt:BK.fmt,ti:BK.ti,name,phone,sel:BK.sel});
  if(!res.ok){toast(res.msg,'err');return;}
  const b=res.b;
  document.getElementById('mbody').innerHTML=`
    <strong>Booking ID:</strong> #${b.id}<br>
    <strong>Name:</strong> ${b.name}<br>
    <strong>Movie:</strong> ${b.movie} (${b.lang} · ${b.fmt})<br>
    <strong>Hall:</strong> ${b.hallName}<br>
    <strong>Show Time:</strong> ${b.time}<br>
    <strong>Seats:</strong> ${b.seats.map(i=>i+1).join(', ')}<br>
    <strong>Amount:</strong> ₹${b.total}`;
  document.getElementById('modal').classList.add('open');
  toast('Booking #'+b.id+' confirmed!','ok');
  updateSidebar();
  initBook();
  document.getElementById('inp-name').value='';
  document.getElementById('inp-phone').value='';
}
function closeModal(){document.getElementById('modal').classList.remove('open')}

// ═══════ search() ═══════
function doSearch(){
  const id=parseInt(document.getElementById('sid').value);
  const el=document.getElementById('sres');
  if(isNaN(id)){el.innerHTML='<span style="color:var(--red)">Enter a valid booking ID.</span>';return;}
  const b=TS.search(id);
  if(!b){el.innerHTML='<span style="color:var(--red)">No booking found with ID #'+id+'.</span>';return;}
  el.innerHTML=`
    <div style="display:flex;flex-direction:column;gap:9px">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:2px">Booking #${b.id}</div>
      <div><span style="color:var(--muted);font-size:12px">Movie: </span><strong>${b.movie}</strong> — ${b.lang} · ${b.fmt}</div>
      <div><span style="color:var(--muted);font-size:12px">Hall & Time: </span><strong>${b.hallName}</strong> at ${b.time}</div>
      <div><span style="color:var(--muted);font-size:12px">Name: </span><strong>${b.name}</strong>${b.phone?' · '+b.phone:''}</div>
      <div><span style="color:var(--muted);font-size:12px">Seats: </span><span style="font-family:'JetBrains Mono',monospace;color:var(--gold)">${b.seats.map(i=>i+1).join(', ')}</span></div>
      <div style="margin-top:4px"><span style="color:var(--muted);font-size:12px">Total: </span><span style="color:var(--gold2);font-family:'Playfair Display',serif;font-size:22px">₹${b.total}</span></div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px">${new Date(b.ts).toLocaleString()}</div>
    </div>`;
}
function renderAllBookings(){
  const el=document.getElementById('all-list');
  if(!TS.bookings.length){el.innerHTML='<span style="color:var(--muted);font-size:13px">No bookings yet.</span>';return;}
  el.innerHTML=[...TS.bookings].reverse().map(b=>`
    <div class="bchip" onclick="document.getElementById('sid').value=${b.id};doSearch()">
      <span class="bc-id">#${b.id}</span>
      <span class="bc-movie">${b.movie}</span>
      <span class="bc-meta">${b.lang} · ${b.fmt} · ${b.time}</span>
      <span class="bc-meta">${b.seats.length} seat(s)</span>
      <span class="bc-amt">₹${b.total}</span>
    </div>`).join('');
}

// ═══════ report() ═══════
function renderReport(){
  const stats=TS.report();
  document.getElementById('rgrid').innerHTML=stats.map(s=>`
    <div class="rcard">
      <div class="rc-hall-lbl">Hall</div>
      <div class="rc-name">${s.hall.split(' — ')[1]||s.hall}</div>
      <div class="rc-pct">${s.pct}%</div>
      <div class="rc-bar-bg"><div class="rc-bar" style="width:${s.pct}%"></div></div>
      <div class="rc-stats"><span>🔴 ${s.bk} booked</span><span>🟢 ${s.av} free</span></div>
    </div>`).join('');
  const tb=stats.reduce((s,r)=>s+r.bk,0),ta=stats.reduce((s,r)=>s+r.av,0),tot=stats.reduce((s,r)=>s+r.tot,0);
  document.getElementById('roverall').innerHTML=`
    <div class="ro-title">All Halls Combined</div>
    <div class="ro-stats">
      <div class="ro-stat"><div class="v">${tot}</div><div class="l">Total Seats</div></div>
      <div class="ro-stat"><div class="v">${tb}</div><div class="l">Booked</div></div>
      <div class="ro-stat"><div class="v">${ta}</div><div class="l">Available</div></div>
      <div class="ro-stat"><div class="v">${Math.round(tb/tot*100)}%</div><div class="l">Occupancy</div></div>
    </div>`;
}

// ═══════ TOAST ═══════
let _tt;
function toast(msg,type=''){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='toast show '+(type||'');
  clearTimeout(_tt);_tt=setTimeout(()=>t.classList.remove('show'),3200);
}

// ═══════ main() ═══════
function main(){
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  renderViewHall();
  updateSidebar();
}
main();