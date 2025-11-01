// === CONFIG ===
const ICS_URL = 'https://raw.githubusercontent.com/TORCHIN-Maxence-24020376/EDT/refs/heads/main/edt_data/2GA1-2.ics';

// === STATE ===
let currentMonday = startOfWeek(new Date());
let events = [];                 // événements de la semaine (officiel pour l’instant)
let officialEnabled = true;      // toggle d’affichage de l’EDT officiel

// === INIT ===
window.addEventListener('DOMContentLoaded', async () => {
    // boutons semaine
    document.getElementById('prevWeek')?.addEventListener('click', () => {
        currentMonday = addDays(currentMonday, -7);
        renderWeek();
        loadWeek();
    });
    document.getElementById('nextWeek')?.addEventListener('click', () => {
        currentMonday = addDays(currentMonday, 7);
        renderWeek();
        loadWeek();
    });

    // toggle EDT officiel
    const chk = document.getElementById('showOfficialLayer');
    if (chk) {
        chk.checked = true;
        chk.addEventListener('change', () => {
            officialEnabled = chk.checked;
            renderEvents();
        });
    }

    renderWeek();
    await loadWeek();    // charge l’ICS et affiche
});

// === RENDER SEMAINE ===
function renderWeek(){
    const weekTitle = document.getElementById('weekTitle');
    const end = addDays(currentMonday, 6);
    if (weekTitle) weekTitle.textContent = `Semaine du ${fmtDate(currentMonday)} au ${fmtDate(end)}`;

    const cal = document.getElementById('calendar');
    if (!cal) return;
    cal.innerHTML = '';

    // en-tête (colonne heures vide + 7 jours)
    cal.appendChild(el('div','hour'));
    for(let i=0;i<7;i++){
        const d = addDays(currentMonday,i);
        const head = el('div','hour');
        head.textContent = dayHdr(d);
        cal.appendChild(head);
    }
    // grille 7:00 → 21:00
    for(let h=7; h<=21; h++){
        const hourCell = el('div','hour'); hourCell.textContent = `${String(h).padStart(2,'0')}:00`; cal.appendChild(hourCell);
        for(let i=0;i<7;i++){ cal.appendChild(el('div','cell')); }
    }

    renderEvents();
}

function renderEvents(){
    document.querySelectorAll('.cell').forEach(c=>c.innerHTML='');

    const weekStart = currentMonday;
    const weekEnd = addDays(weekStart, 7);

    const inRange = events.filter(e => new Date(e.end) > weekStart && new Date(e.start) < weekEnd);
    for (const ev of inRange) {
        if (ev.source === 'official' && !officialEnabled) continue;
        placeEvent(ev);
    }
}

function placeEvent(ev){
    const dayIndex = diffDays(currentMonday, new Date(ev.start));
    if(dayIndex < 0 || dayIndex > 6) return;

    const start = new Date(ev.start), end = new Date(ev.end);
    const topHour = 7, lastHour = 21;
    const cal = document.getElementById('calendar');
    const rowHeight = (cal.clientHeight - 24) / (lastHour - topHour + 1);
    const minutesFromTop = (start.getHours()+start.getMinutes()/60 - topHour) * rowHeight;
    const minutesDuration = ((end - start)/60000) * (rowHeight/60);

    const cell = nthCell(dayIndex);
    const node = document.getElementById('eventTemplate').content.firstElementChild.cloneNode(true);
    node.style.top = Math.max(0, minutesFromTop) + 'px';
    node.style.height = Math.max(24, minutesDuration) + 'px';
    node.style.background = ev.color || '#2563eb'; // bleu pour l’officiel
    node.classList.add('official');
    node.querySelector('.title').textContent = ev.title || '(Sans titre)';
    node.title = `${fmtDateTime(start)} → ${fmtDateTime(end)}${ev.extendedProps?.salle?`\nSalle: ${ev.extendedProps.salle}`:''}${ev.extendedProps?.professeur?`\nProf: ${ev.extendedProps.professeur}`:''}`;
    // (lecture seule pour l’instant)
    cell.appendChild(node);
}

function nthCell(dayIndex){
    const cal = document.getElementById('calendar');
    const headerCells = 8; // 1h + 7 jours
    return cal.children.item(headerCells + (1 + dayIndex)); // première ligne horaire, colonne du jour
}

// === DATA LOADING (ICS OFFICIEL UNIQUEMENT PHASE 1) ===
async function loadWeek(){
    try {
        const txt = await (await fetch(ICS_URL)).text();
        const allOfficial = parseICS(txt).map(e => ({ ...e, source: 'official' }));
        // garde que la semaine affichée
        const weekStart = currentMonday, weekEnd = addDays(weekStart, 7);
        const inWeek = allOfficial.filter(e => new Date(e.end) > weekStart && new Date(e.start) < weekEnd);
        events = inWeek;
        renderEvents();
    } catch (e) {
        console.error('Erreur ICS', e);
        events = [];
        renderEvents();
    }
}

// === ICS PARSER (version safe) ===
function parseICS(text){
    const lines = text.replace(/\r/g, "\n").split(/\n/);
    // dépliage des lignes continues
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].startsWith(" ")) { lines[i - 1] += lines[i].slice(1); lines[i] = ""; }
    }

    const out = [];
    let ev = null;

    for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;

        if (line === "BEGIN:VEVENT") {
            ev = { extendedProps: { professeur: "Inconnu", salle: "", salleUrl: null } };
            continue;
        }
        if (!ev) continue;

        if (line.startsWith("SUMMARY:")) {
            ev.title = line.slice(8).trim();
        }
        else if (line.startsWith("DTSTART")) {
            ev.start = icsTimeToDate(line);
        }
        else if (line.startsWith("DTEND")) {
            ev.end = icsTimeToDate(line);
        }
        else if (line.startsWith("LOCATION:")) {
            // pas de / dans le regex -> on nettoie via replace simple
            const salleClean = line.slice(9).trim().replace(/\\,/g, ",");
            ev.extendedProps.salle = salleClean || "Salle inconnue";
            ev.extendedProps.salleUrl = salleClean ? `carte.html#${encodeURIComponent(salleClean)}` : null;
        }
        else if (line.startsWith("DESCRIPTION:")) {
            const desc = line.slice(12).trim();

            // Nettoyages sans utiliser de '/' dans le pattern
            const cleaned = desc
                .replace(/\\n/g, " ")
                .replace(/Groupe|Modifié le:|\(|\)|[()]/g, "")   // () retirés via classe de caractères
                .replace(/\d+/g, "")                              // supprime chiffres
                .replace(/\s+/g, " ")                             // espaces multiples
                .replace(/-/g, " ")
                .replace(/(?:ère|ème) (?:année|Année)/g, "")      // accents OK
                .replace(/:/g, "")
                .replace(/\bA an\b|\ban\b/g, " ")
                .replace(/G[A-Z] /g, "")
                .trim();

            ev.extendedProps.professeur = cleaned || "Inconnu";
        }
        else if (line === "END:VEVENT") {
            if (ev && ev.start && ev.end) out.push(ev);
            ev = null;
        }
    }
    return out;
}

function icsTimeToDate(line){
    // gère:
    // - DTSTART:YYYYMMDDTHHMMSSZ
    // - DTSTART:YYYYMMDDTHHMMSS
    // - DTSTART;TZID=Europe/Paris:YYYYMMDDTHHMMSS
    // - DTSTART;VALUE=DATE:YYYYMMDD
    const parts = line.split(":");
    const value = (parts[1] || "").trim();
    if (!value) return new Date(NaN);

    // journée entière
    if (/^\d{8}$/.test(value)) {
        const y = +value.slice(0,4), M = +value.slice(4,6) - 1, d = +value.slice(6,8);
        return new Date(y, M, d); // local minuit
    }

    const hasTZID = /TZID=([^;:]+)/.test(parts[0]);
    const y = +value.slice(0,4),
        M = +value.slice(4,6) - 1,
        d = +value.slice(6,8),
        h = +value.slice(9,11) || 0,
        mi = +value.slice(11,13) || 0,
        s = +value.slice(13,15) || 0;

    if (value.endsWith("Z")) {
        return new Date(Date.UTC(y, M, d, h, mi, s)); // UTC -> local
    }

    // si TZID présent, on interprète comme horaire local (Europe/Paris)
    // sinon pareil : local
    return new Date(y, M, d, h, mi, s);
}


// === HELPERS ===
function startOfWeek(d){ const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x; }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function diffDays(a,b){ const x=new Date(a); x.setHours(0,0,0,0); const y=new Date(b); y.setHours(0,0,0,0); return Math.round((y-x)/86400000); }
function fmtDate(d){ return d.toLocaleDateString('fr-FR',{weekday:'short', day:'2-digit', month:'2-digit'}); }
function dayHdr(d){ return d.toLocaleDateString('fr-FR',{weekday:'short', day:'2-digit', month:'2-digit'}); }
function fmtDateTime(d){ return new Date(d).toLocaleString('fr-FR',{weekday:'short', hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'}); }
function el(tag,cls){ const n=document.createElement(tag); if(cls) n.className=cls; return n; }
