// === CONFIG ===
const firstHourRowStartIndex = headerCells; // index in DOM order
const cellIndex = firstHourRowStartIndex + (1 + dayIndex); // top hour row
return cal.children.item(cellIndex);
}


// === DATA LOADING ===
async function loadWeek(){
const start = isoDate(currentMonday);
const res = await api(`/events?start=${start}&days=7`);
events = res.success ? res.data : [];
renderEvents();
}


// === EVENT DIALOG ===
function openEventDialog(ev=null){
const dlg = document.getElementById('eventDialog');
const form = document.getElementById('eventForm');
form.reset();
form.id.value = ev?.id || '';
form.title.value = ev?.title || '';
form.start.value = ev ? toLocalInput(ev.start) : toLocalInput(new Date());
form.end.value = ev ? toLocalInput(ev.end) : toLocalInput(addMinutes(new Date(), 60));
form.location.value = ev?.location || '';
form.color.value = ev?.color || '#4f46e5';
form.notes.value = ev?.notes || '';
document.getElementById('dialogTitle').textContent = ev ? 'Modifier l\'événement' : 'Nouvel événement';
dlg.showModal();


document.getElementById('saveEvent').onclick = async (e)=>{
e.preventDefault();
const payload = Object.fromEntries(new FormData(form).entries());
const isEdit = !!payload.id;
const url = isEdit ? `/events/${payload.id}` : '/events';
const method = isEdit ? 'PUT' : 'POST';
const res = await api(url, {method, body: payload});
if(res.success){ dlg.close(); await loadWeek(); } else alert(res.message||'Erreur');
};
}


// === HELPERS ===
async function api(path, {method='GET', body, headers}={}){
const opts = { method, headers: { 'Content-Type':'application/json', ...(headers||{}) }, credentials:'include' };
if(body){ opts.body = JSON.stringify(body); }
const res = await fetch(`${API_BASE}${path}`, opts);
return res.json();
}
function startOfWeek(d){ const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x; }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function addMinutes(d,n){ const x=new Date(d); x.setMinutes(x.getMinutes()+n); return x; }
function diffDays(a,b){ const x=new Date(a); x.setHours(0,0,0,0); const y=new Date(b); y.setHours(0,0,0,0); return Math.round((y-x)/86400000); }
function fmtDate(d){ return d.toLocaleDateString('fr-FR',{weekday:'short', day:'2-digit', month:'2-digit'}); }
function dayHdr(d){ return d.toLocaleDateString('fr-FR',{weekday:'short', day:'2-digit', month:'2-digit'}); }
function fmtDateTime(d){ return new Date(d).toLocaleString('fr-FR',{weekday:'short', hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'}); }
function isoDate(d){ const x=new Date(d); x.setHours(0,0,0,0); return x.toISOString(); }
function toLocalInput(d){ const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0,16); }
function el(tag,cls){ const n=document.createElement(tag); if(cls) n.className=cls; return n; }

