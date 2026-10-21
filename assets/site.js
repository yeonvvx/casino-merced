document.documentElement.classList.add('js');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const KEY='cm-a11y';let a11y={size:0,hc:false,ul:false,rf:false,rm:false};
try{Object.assign(a11y,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
function applyA11y(){const r=document.documentElement;r.classList.toggle('t1',a11y.size===1);r.classList.toggle('t2',a11y.size===2);['hc','ul','rf','rm'].forEach(k=>r.classList.toggle(k,!!a11y[k]));document.querySelectorAll('.seg button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.size===a11y.size));document.querySelectorAll('.tog').forEach(b=>b.setAttribute('aria-pressed',!!a11y[b.dataset.opt]));try{localStorage.setItem(KEY,JSON.stringify(a11y))}catch(e){}}
applyA11y();
const still=()=>reduce||a11y.rm;window.__still=still;
(function(){const b=document.getElementById('a11y-btn'),p=document.getElementById('a11y-panel');const set=o=>{p.hidden=!o;b.setAttribute('aria-expanded',o);if(o)p.querySelector('button').focus()};b.addEventListener('click',()=>set(p.hidden));p.addEventListener('keydown',e=>{if(e.key==='Escape'){set(false);b.focus()}});document.addEventListener('click',e=>{if(!p.hidden&&!p.contains(e.target)&&!b.contains(e.target))set(false)});p.querySelectorAll('.seg button').forEach(x=>x.addEventListener('click',()=>{a11y.size=+x.dataset.size;applyA11y()}));p.querySelectorAll('.tog').forEach(x=>x.addEventListener('click',()=>{a11y[x.dataset.opt]=!a11y[x.dataset.opt];applyA11y()}));document.getElementById('a11y-reset').addEventListener('click',()=>{a11y={size:0,hc:false,ul:false,rf:false,rm:false};applyA11y()})})();

// mobile menu + nav background
(function(){const b=document.getElementById('menu-btn'),n=document.getElementById('links');b.addEventListener('click',()=>{const o=!n.classList.contains('open');n.classList.toggle('open',o);b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'Close menu':'Open menu')});n.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{n.classList.remove('open');b.setAttribute('aria-expanded',false)}));const nav=document.getElementById('nav');const f=()=>nav.classList.toggle('solid',scrollY>30);addEventListener('scroll',f,{passive:true});f()})();

// game tiles: two rows, duplicated for a seamless loop
(function(){
  if(!document.getElementById('trackA'))return;
  const T=[
    ['Blurry_blackjack_table.jpg','7/7e','Pure 21.5 Buster Blackjack',''],
    ['Cards_-Deck_Playing.jpg','7/7f','Three Card Poker','v'],
    ['Two_poker_cards_and_poker_chips_20170611.jpg','4/40','Poker room',''],
    ['Double_down.JPG','d/df','Pure 21.5 Spanish Blackjack','v'],
    ['Poker_chips_2.jpg','2/2c','Baccarat','','Soon'],
    ['Poker_Chips_%284041237051%29.jpg','d/dc',"Ultimate Texas Hold'em",'v','Soon']
  ];
  const tile=t=>`<div class="tile ${t[3]}"><img src="https://thumb.wikimedia.org/wikipedia/commons/thumb/${t[1]}/${t[0]}/1280px-${t[0]}" alt="" loading="lazy" width="640" height="480">${t[4]?`<em>${t[4]}</em>`:''}<span>${t[2]}</span></div>`;
  const a=T.map(tile).join(''), b=[...T].reverse().map(tile).join('');
  document.getElementById('trackA').innerHTML=a+a;
  document.getElementById('trackB').innerHTML=b+b;
})();

// live: status, next tournament, clock (Merced time)
(function(){
  const tz='America/Los_Angeles',idx={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
  const ticks=document.getElementById('ticks');
  const $=id=>document.getElementById(id);
  if(ticks)for(let i=0;i<12;i++){const a=i*30*Math.PI/180;ticks.insertAdjacentHTML('beforeend',`<line class="tick" x1="${60+44*Math.sin(a)}" y1="${60-44*Math.cos(a)}" x2="${60+51*Math.sin(a)}" y2="${60-51*Math.cos(a)}"/>`)}
  const hand=(id,deg)=>{const e=$(id);if(e)e.setAttribute('transform',`rotate(${deg} 60 60)`)};
  const set=(id,t)=>{const e=$(id);if(e)e.textContent=t};
  function tick(){
    const o={};new Intl.DateTimeFormat('en-US',{timeZone:tz,weekday:'short',hour:'numeric',minute:'numeric',second:'numeric',hourCycle:'h23'}).formatToParts(new Date()).forEach(x=>o[x.type]=x.value);
    const h=+o.hour,m=+o.minute,s=+o.second,d=idx[o.weekday],open=h>=11||h<4;
    hand('ch',(h%12)*30+m*.5);hand('cm',m*6+s*.1);hand('cs',s*6);
    document.body.classList.toggle('is-open',open);
    set('status-text',open?'Open now':'Closed');
    set('clock-title',open?'Open until 4 AM':'Opens at 11 AM');
    set('clock-sub','Merced time '+new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'numeric',minute:'2-digit'}).format(new Date()));
    const now=d*1440+h*60+m;let best=null;
    for(const [dd,mm,label] of [[3,1080,'Wed 6 PM · $52'],[6,780,'Sat 1 PM · $32']]){let at=dd*1440+mm;if(at<=now)at+=10080;if(!best||at<best.at)best={at,label}}
    const diff=best.at-now,D=Math.floor(diff/1440),H=Math.floor(diff%1440/60),M=diff%60,txt=`${D?D+'d ':''}${H}h ${M}m`;
    set('next-label',best.label);
    set('next-count','in '+txt);
    set('countdown',txt);
  }
  tick();setInterval(tick,1000);
})();

setTimeout(()=>{if(!window.__gsapReady)document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'))},2500);

(document.getElementById('signup-form')||{addEventListener(){}}).addEventListener('submit',e=>{
  e.preventDefault();const em=document.getElementById('email'),c=document.getElementById('consent'),m=document.getElementById('msg');
  m.className='msg';em.removeAttribute('aria-invalid');c.removeAttribute('aria-invalid');
  if(!em.value||!em.checkValidity()){m.textContent='Enter an email like name@example.com.';m.classList.add('err');em.setAttribute('aria-invalid','true');em.focus();return}
  if(!c.checked){m.textContent='Check the box to confirm you are 21+.';m.classList.add('err');c.setAttribute('aria-invalid','true');c.focus();return}
  m.textContent="You're on the list!";e.target.reset();
});
