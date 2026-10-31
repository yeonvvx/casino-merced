// Scroll motion for every page: headlines that rise word by word, gold wipes
// over photos, page heroes that lift away, cards and rows that slide in, and on
// the homepage a fanning hand of cards, a giant line that slides across and a
// marquee that speeds up with the scroll. Each effect runs only where its
// elements exist. Uses the GSAP + ScrollTrigger + Lenis setup that app.js
// exposes, and does nothing when motion is turned off.
(function(){
const still=()=>typeof window.__still==='function'&&window.__still();
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const HEADS='main h1:not(.logo-big),main h2:not(#tonight-title)';
const WIPES='.frame,.vmap,.special .im';
// app.js fades everything with .rv in on one shared trigger; these get their own motion instead.
const TAKE='.hero h1,#home-games .gcard,.frame,.vmap,.board,.join,.special .im,.events .ev,.ccard';

// Wrap each word in a mask so it can rise into view; nested spans (the gold words) keep their styling.
function splitWords(el){
  [...el.childNodes].forEach(n=>{
    if(n.nodeType===3){
      const f=document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(p=>{
        if(!p)return;
        if(/^\s+$/.test(p)){f.append(' ');return}
        const m=document.createElement('span'),i=document.createElement('span');
        m.className='wm';i.className='wi';i.textContent=p;m.append(i);f.append(m);
      });
      n.replaceWith(f);
    }else if(n.nodeType===1&&n.namespaceURI!=='http://www.w3.org/2000/svg')splitWords(n);
  });
}

// The element a wipe covers: the photo area inside a frame, or the box itself.
const wipeHost=box=>box.classList.contains('frame')?box.querySelector('.im'):box;

// Runs before app.js sets up its .rv fades (both wait on cmReady; this one is registered first).
function prep(){
  if(still())return;
  $$(TAKE).forEach(e=>e.classList.remove('rv'));
  $$(HEADS).forEach(h=>{h.classList.remove('rv');splitWords(h)});
  $$(WIPES).forEach(box=>{
    const host=wipeHost(box);
    if(!host||!host.querySelector('img'))return;
    const w=document.createElement('span');w.className='wipe';w.setAttribute('aria-hidden','true');
    host.classList.add('wipe-host');host.append(w);
  });
  const bar=document.createElement('div');bar.className='scroll-bar';bar.setAttribute('aria-hidden','true');document.body.append(bar);
}

function build(){
  const gsap=window.gsap,ST=window.ScrollTrigger;
  if(!gsap||!ST||still())return;
  const mm=gsap.matchMedia();
  const one=s=>document.querySelector(s);

  // progress bar
  gsap.to('.scroll-bar',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.3}});

  // homepage hero: the two logo lines rise out of a mask, then the hero drifts up and fades as you leave it
  if(one('.hero')){
    gsap.fromTo('.logo-big .l1,.logo-big .l2',{yPercent:105,clipPath:'inset(0% 0% 100% 0%)'},{yPercent:0,clipPath:'inset(-20% -10% -20% -10%)',duration:1.2,ease:'expo.out',stagger:.12,delay:.15,clearProps:'clipPath'});
    gsap.to('.hero>.wrap',{y:-140,opacity:.1,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to('.logo-big .chipO',{rotation:540,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:.6}});
  }
  // inner pages: the title block lifts and fades as you scroll past it
  if(one('.page-hero'))gsap.to('.page-hero>.wrap',{y:-90,opacity:.15,ease:'none',scrollTrigger:{trigger:'.page-hero',start:'top top',end:'bottom top',scrub:true}});

  // headlines rise word by word, and drop back out if you scroll above them, so they replay
  $$(HEADS).forEach(h=>{
    const words=h.querySelectorAll('.wi');
    if(!words.length)return;
    gsap.from(words,{yPercent:110,rotation:4,duration:.9,ease:'expo.out',stagger:.06,
      scrollTrigger:{trigger:h,start:'top 92%',toggleActions:'play none none reverse'}});
  });

  // homepage game cards: on wide screens the outer columns start stacked behind the middle one and slide out
  const cards=$$('#home-games .gcard');
  mm.add('(min-width:900px)',()=>{
    cards.forEach(c=>{
      const row=cards.filter(o=>o.offsetTop===c.offsetTop),mid=row[1];
      const dx=mid&&c!==mid?mid.offsetLeft-c.offsetLeft:0;
      gsap.fromTo(c,{x:dx,y:70,rotation:dx?dx/40:0,opacity:dx?0:.2},{x:0,y:0,rotation:0,opacity:1,ease:'power2.out',
        scrollTrigger:{trigger:c,start:'top 98%',end:'top 60%',scrub:.8}});
    });
  });
  mm.add('(max-width:899px)',()=>{
    cards.forEach(c=>gsap.fromTo(c,{y:50,opacity:0},{y:0,opacity:1,duration:.8,ease:'expo.out',scrollTrigger:{trigger:c,start:'top 92%',toggleActions:'play none none reverse'}}));
  });

  // the marquee runs faster while you scroll, then eases back
  const runs=$$('.track').flatMap(t=>t.getAnimations());
  if(runs.length){
    const v={rate:1};
    const apply=()=>runs.forEach(a=>a.playbackRate=v.rate);
    ST.create({trigger:'.marquee',start:'top bottom',end:'bottom top',onUpdate:s=>{
      const r=1+Math.min(Math.abs(s.getVelocity())/350,7);
      if(r>v.rate)gsap.to(v,{rate:r,duration:.2,overwrite:true,onUpdate:apply,onComplete:()=>gsap.to(v,{rate:1,duration:1.2,ease:'power2.out',onUpdate:apply})});
    }});
  }

  // hand of cards: stacked in the middle, fanning out as it scrolls in, lifting away as you pass
  const fan=one('.fan');
  if(fan){
    const tl=gsap.timeline({scrollTrigger:{trigger:fan,start:'top 95%',end:'top 35%',scrub:.8}});
    tl.from('.fan .fc1',{x:0,rotation:-3,y:30},0).from('.fan .fc3',{x:0,rotation:3,y:30},0).from('.fan .fc2',{y:60,scale:.92},0);
    gsap.to(fan,{y:-90,ease:'none',scrollTrigger:{trigger:fan,start:'center 35%',end:'bottom top',scrub:true}});
  }

  // boards (tournaments, daily specials) and sign-up / message panels grow into place
  $$('.board').forEach(b=>gsap.from(b,{scale:.86,opacity:.3,borderRadius:60,ease:'none',scrollTrigger:{trigger:b,start:'top bottom',end:'top 45%',scrub:true}}));
  $$('.join').forEach(j=>gsap.from(j,{scale:.9,y:60,opacity:.3,ease:'none',scrollTrigger:{trigger:j,start:'top bottom',end:'top 55%',scrub:true}}));

  // photos: slide in from their side while a gold panel wipes off and the photo settles from a zoom
  $$(WIPES).forEach(box=>{
    const host=wipeHost(box),w=host&&host.querySelector('.wipe'),img=host&&host.querySelector('img');
    const r=box.getBoundingClientRect(),side=innerWidth>=900&&r.width<innerWidth*.7?(r.left+r.width/2<innerWidth/2?-1:1):0;
    const tl=gsap.timeline({scrollTrigger:{trigger:box,start:'top 80%',once:true}});
    tl.from(box,{x:60*side,y:side?0:40,opacity:side?0:1,duration:.9,ease:'expo.out'},0);
    if(w)tl.to(w,{scaleX:0,duration:.85,ease:'expo.inOut'},.1);
    if(img){
      tl.from(img,{scale:1.3,duration:1.6,ease:'expo.out'},.15);
      gsap.fromTo(img,{yPercent:-6},{yPercent:6,ease:'none',scrollTrigger:{trigger:box,start:'top bottom',end:'bottom top',scrub:true}});
    }
  });

  // games page: each game's rule lines slide in one after another
  $$('.rules').filter(ul=>ul.children.length).forEach(ul=>gsap.from(ul.children,{x:-28,opacity:0,duration:.6,ease:'expo.out',stagger:.08,scrollTrigger:{trigger:ul,start:'top 88%',toggleActions:'play none none reverse'}}));

  // tournaments: schedule rows slide in, event cards come from alternating sides
  $$('#tourney-rows').forEach(tb=>gsap.from(tb.children,{x:-36,opacity:0,duration:.7,ease:'expo.out',stagger:.09,scrollTrigger:{trigger:tb,start:'top 88%',toggleActions:'play none none reverse'}}));
  $$('.events .ev').forEach((e,i)=>gsap.fromTo(e,{x:i%2?60:-60,opacity:0},{x:0,opacity:1,duration:.9,ease:'expo.out',scrollTrigger:{trigger:e,start:'top 90%',toggleActions:'play none none reverse'}}));

  // contact: the info cards flip up into place one after another
  const cc=$$('.ccard');
  if(cc.length)gsap.from(cc,{rotationX:-55,y:60,opacity:0,transformPerspective:900,transformOrigin:'50% 100%',duration:1,ease:'expo.out',stagger:.12,
    scrollTrigger:{trigger:cc[0],start:'top 90%',toggleActions:'play none none reverse'}});

  // the grill badge drifts in a slow loop tied to the scroll position
  const badge=one('.badge2');
  if(badge){const sx=gsap.quickSetter(badge,'x','px'),sy=gsap.quickSetter(badge,'y','px');
    ST.create({trigger:badge,start:'top bottom',end:'bottom top',onUpdate:()=>{const y=window.scrollY;sx(24*Math.sin(y*.003));sy(20*Math.cos(y*.003))}})}

  // giant line slides from the right edge to well past the left as it crosses the screen
  $$('.bigline span').forEach(s=>gsap.fromTo(s,{x:()=>innerWidth*.6},{x:()=>-(s.offsetWidth-innerWidth*.4),ease:'none',
    scrollTrigger:{trigger:s.parentElement,start:'top bottom',end:'bottom top',scrub:.5,invalidateOnRefresh:true}}));

  ST.refresh();
}

(window.cmReady||Promise.resolve()).then(prep);
window.addEventListener('cm:motion',build,{once:true});
})();
