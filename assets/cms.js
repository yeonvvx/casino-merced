// Fills the Menu, Games and Tournaments content from data/*.json, which the
// owner edits in Pages CMS (see .pages.yml). Runs before site.js and app.js;
// both wait on window.cmReady so animations and the countdown see the content.
(function(){
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SUITS={spade:'',club:'',heart:'r',diamond:'r'};

// Wikimedia thumbnails get a srcset; uploaded images are used as-is.
function img(src,alt,sizes){
  if(!src)return '';
  const m=String(src).match(/^(https:\/\/thumb\.wikimedia\.org\/.+\/)\d+px-([^/]+)$/);
  if(m){const u=w=>`${m[1]}${w}px-${m[2]}`;
    return `<img src="${esc(u(960))}" srcset="${esc(u(500))} 500w, ${esc(u(960))} 960w, ${esc(u(1280))} 1280w" sizes="${sizes}" alt="${esc(alt)}" loading="lazy" decoding="async">`}
  return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
}
function thumb(src,w){const m=String(src||'').match(/^(https:\/\/thumb\.wikimedia\.org\/.+\/)\d+px-([^/]+)$/);return m?`${m[1]}${w}px-${m[2]}`:src}
// "Pure 21.5 Buster Blackjack" + gold "Buster Blackjack" -> name with the gold words highlighted
function goldName(name,gold){
  const i=gold?name.lastIndexOf(gold):-1;
  return i<0?esc(name):`${esc(name.slice(0,i))}<span class="grad">${esc(gold)}</span>${esc(name.slice(i+gold.length))}`;
}
const money=n=>n===''||n==null||isNaN(n)?'':'$'+(Number.isInteger(+n)?String(+n):(+n).toFixed(2));

// ---- tournaments: shared by home, games and tournaments pages ----
function parseTime(t){const m=String(t||'').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp])\.?[Mm]\.?$/);if(!m)return null;let h=+m[1]%12;if(/p/i.test(m[3]))h+=12;return h*60+(+(m[2]||0))}
function shortTime(t){return String(t).replace(':00','').replace(/\s+/,' ').toUpperCase()}
function prepTourneys(list){
  return (list||[]).filter(t=>t&&t.active!==false&&DAYS.includes(t.day)&&parseTime(t.time)!=null).map(t=>({...t,
    dayIdx:DAYS.indexOf(t.day),mins:parseTime(t.time),
    label:`${t.day.slice(0,3)} ${shortTime(t.time)}${money(t.buy_in)?' · '+money(t.buy_in):''}`,
    flap:`${t.day.slice(0,3).toUpperCase()} ${shortTime(t.time).replace(' ','')}${money(t.buy_in)?' '+money(t.buy_in):''}`
  })).sort((a,b)=>a.dayIdx*1440+a.mins-(b.dayIdx*1440+b.mins));
}
const TIMES=['once','twice','three times','four times','five times','six times','seven times'];
function renderTourneys(ts){
  window.cmTourneys=ts;
  window.cmFlapWords=ts.map(t=>t.flap);
  document.querySelectorAll('[data-tcount]').forEach(e=>{e.textContent=ts.length?`${TIMES[Math.min(ts.length,7)-1]} a week`:'every week'});
  document.querySelectorAll('.flap-static').forEach(e=>{e.textContent=ts.map(t=>t.label).join('  /  ')||'Call for this week\'s schedule'});
  const cards=ts.map(t=>`<article class="ev rv"><div class="im">${img(t.image,t.image_alt,'120px')}</div><div><span class="when">Every ${esc(t.day)} · ${esc(shortTime(t.time))}</span><h3>${esc(t.name)}</h3>${t.description?`<p>${esc(t.description)}</p>`:''}<div class="tags">${money(t.buy_in)?`<span>${money(t.buy_in)} buy-in</span>`:''}${(t.tags||[]).filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></article>`).join('');
  document.querySelectorAll('[data-cms="tourney-cards"]').forEach(e=>{e.innerHTML=cards});
  const rows=$('tourney-rows');
  if(rows)rows.innerHTML=ts.map(t=>`<tr><td data-l="Day">${esc(t.day)}</td><td data-l="Start" class="gold">${esc(t.time)}</td><td data-l="Game">${esc(t.game||'')}</td><td data-l="Buy-in" class="gold">${money(t.buy_in)}</td></tr>`).join('')||'<tr><td colspan="4">No tournaments are scheduled right now. Call the floor for updates.</td></tr>';
  document.querySelectorAll('[data-cms="tourney-line"]').forEach(e=>{e.innerHTML=ts.length?`<svg aria-hidden="true"><use href="#diamond"/></svg><span><b>Tournaments:</b> ${esc(ts.map(t=>`${t.day} ${shortTime(t.time)}${money(t.buy_in)?` (${money(t.buy_in)})`:''}`).join(' and '))}.</span>`:'';e.hidden=!ts.length});
}

// ---- games ----
function renderGames(gs){
  gs=(gs||[]).filter(g=>g&&g.name);
  const open=gs.filter(g=>g.status!=='soon'),soon=gs.filter(g=>g.status==='soon');
  const suit=g=>`<span class="suit ${SUITS[g.suit]||''}"><svg aria-hidden="true"><use href="#${esc(g.suit||'spade')}"/></svg></span>`;
  const home=$('home-games');
  if(home)home.innerHTML=gs.map(g=>`<article class="gcard rv">${g.status==='soon'?'<span class="soon">Soon</span>':''}${suit(g)}<h3>${esc(g.name)}</h3><p>${esc(g.card_text||g.description||'')}</p></article>`).join('');
  const A=$('trackA'),B=$('trackB');
  if(A&&B){const withImg=gs.filter(g=>g.image);
    // The strip is aria-hidden and the same games are linked in the cards below, so tiles stay out of the tab order.
    const tile=(g,i)=>`<a class="tile ${i%2?'v':''}" href="games.html#${g.status==='soon'?'games-soon':esc(g.id)}" tabindex="-1"><img src="${esc(thumb(g.image,500))}" alt="" loading="lazy" width="640" height="480">${g.status==='soon'?'<em>Soon</em>':''}<span>${esc(g.name)}</span></a>`;
    const a=withImg.map(tile).join(''),b=[...withImg].reverse().map(tile).join('');A.innerHTML=a+a;B.innerHTML=b+b}
  const nav=$('games-nav');
  if(nav)nav.innerHTML=open.map(g=>`<a href="#${esc(g.id)}">${esc(g.nav_label||g.name)}</a>`).join('')+(soon.length?'<a href="#games-soon">Coming soon</a>':'');
  const det=$('games-detail');
  if(det)det.innerHTML=open.map((g,i)=>`<section class="gdetail${i%2?' flip':''}" id="${esc(g.id)}" aria-labelledby="g-${esc(g.id)}">
      <div class="frame rv"><div class="im">${img(g.image,g.image_alt,'(max-width: 760px) 92vw, 560px')}</div></div>
      <div>
        ${g.category?`<span class="kicker rv">${esc(g.category)}</span>`:''}
        <h2 id="g-${esc(g.id)}" class="rv">${goldName(g.name,g.gold_words)}</h2>
        <p class="rv">${esc(g.description)}</p>
        <ul class="rules rv">${(g.rules||[]).filter(r=>r&&(r.bold||r.text)).map(r=>`<li><svg aria-hidden="true"><use href="#${esc(g.suit||'spade')}"/></svg><span>${r.bold?`<b>${esc(r.bold)}</b> `:''}${esc(r.text||'')}</span></li>`).join('')}${g.show_tournaments?'<li data-cms="tourney-line"></li>':''}</ul>
        ${g.show_tournaments?`<div class="center-btn rv" style="justify-content:flex-start;gap:12px;flex-wrap:wrap"><a class="btn gold mag" href="tel:+12092339369"><svg aria-hidden="true"><use href="#phone"/></svg>What's playing tonight?</a><a class="btn" href="tournaments.html">Tournaments<svg aria-hidden="true"><use href="#arrow"/></svg></a></div>`:''}
      </div>
    </section>`).join('');
  const sw=$('games-soon');
  if(sw){sw.hidden=!soon.length;const l=$('games-soon-list');if(l)l.innerHTML=soon.map(g=>`<article class="gcard rv">${suit(g)}<h3>${esc(g.name)}</h3><p>${esc(g.description||g.card_text||'')}</p></article>`).join('')}
}

// ---- menu ----
function renderMenu(m){
  const secs=(m&&m.sections||[]).filter(s=>s&&s.title);
  const nav=$('menu-nav');
  if(nav)nav.innerHTML=secs.map(s=>`<a href="#${esc(s.id)}">${esc(s.nav_label||s.title)}</a>`).join('')+'<a href="#specials">Daily specials</a>';
  const out=$('menu-sections');if(!out)return;
  const items=s=>(s.items||[]).filter(i=>i&&i.name);
  out.innerHTML=secs.map((s,n)=>s.layout==='photo'
    ?`<section class="menu-sec" id="${esc(s.id)}" aria-labelledby="m-${n}">
      <div class="special">
        <div class="im rv">${img(s.image,s.image_alt,'(max-width: 760px) 92vw, 560px')}</div>
        <div class="box rv"><h2 id="m-${n}">${esc(s.title)}</h2>${s.subtitle?`<p>${esc(s.subtitle)}</p>`:''}
          <ul class="burgers">${items(s).map(i=>`<li><span>${esc(i.name)}${i.option?` <small class="opt">${esc(i.option)}</small>`:''}</span>${money(i.price)?`<span class="price">${money(i.price)}</span>`:''}</li>`).join('')}</ul></div>
      </div>
    </section>`
    :`<section class="menu-sec" id="${esc(s.id)}" aria-labelledby="m-${n}">
      <div class="menu-head"><h2 id="m-${n}" class="rv">${esc(s.title)}</h2>${s.subtitle?`<p class="rv">${esc(s.subtitle)}</p>`:''}</div>
      <div class="items">${items(s).map(i=>`<article class="item rv"><div class="top"><h3>${esc(i.name)}</h3>${money(i.price)?`<span class="price">${money(i.price)}</span>`:''}</div>${i.option?`<span class="opt">${esc(i.option)}</span>`:''}${i.description?`<p>${esc(i.description)}</p>`:''}${i.vegan?'<span class="tag">Vegan</span>':''}</article>`).join('')}</div>
    </section>`).join('');
}

const need=new Set([...document.querySelectorAll('[data-cms-need]')].flatMap(e=>e.dataset.cmsNeed.split(' ')));
const get=n=>need.has(n)?fetch(`data/${n}.json`,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}):Promise.resolve(null);
const fail=n=>e=>{console.error(`Could not load data/${n}.json`,e);document.querySelectorAll(`[data-cms-fallback~="${n}"]`).forEach(x=>x.hidden=false);return null};
// Never hold the page longer than 4s, even if a request hangs.
const timeout=new Promise(r=>setTimeout(r,4000));
// Games render first: the poker room's tournament line is filled by renderTourneys.
window.cmReady=Promise.race([timeout,Promise.all([
  get('games').catch(fail('games')),get('menu').catch(fail('menu')),get('tournaments').catch(fail('tournaments'))
]).then(([g,m,t])=>{
  if(g)renderGames(g.games);
  if(m)renderMenu(m);
  if(t)renderTourneys(prepTourneys(t.tournaments));
})]).catch(e=>console.error(e)).then(()=>{window.cmTourneys=window.cmTourneys||null});
// Sections built from data didn't exist when the browser tried to jump to #game,
// so jump once they're on the page (and after the smooth-scroll library starts).
window.cmReady.then(()=>{const id=decodeURIComponent(location.hash.slice(1));const el=id&&document.getElementById(id);
  if(el)requestAnimationFrame(()=>setTimeout(()=>{window.__lenis?window.__lenis.scrollTo(el,{immediate:true,offset:-140}):el.scrollIntoView()},50))});
})();
