// Homepage scroll motion: headlines that rise word by word, colour wipes over
// photos, a fanning hand of cards, a giant line that slides across, and a
// marquee that speeds up with the scroll. Uses the GSAP + ScrollTrigger + Lenis
// setup that app.js exposes, and does nothing when motion is turned off.
(function(){
const still=()=>typeof window.__still==='function'&&window.__still();
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const HEADS='#games-title,#why-title,#t-title,#d-title,#v-title,#s-title';
// app.js fades everything with .rv in on one shared trigger; these get their own motion instead.
const TAKE='.hero h1,#games-title,#why-title,#d-title,.gcard,#dining .frame,.vmap,.board,.join';

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

// Runs before app.js sets up its .rv fades (both wait on cmReady; this one is registered first).
function prep(){
  if(still())return;
  $$(TAKE).forEach(e=>e.classList.remove('rv'));
  $$(HEADS).forEach(splitWords);
  $$('#dining .frame .im,.vmap').forEach(e=>{const w=document.createElement('span');w.className='wipe';w.setAttribute('aria-hidden','true');e.append(w)});
  const bar=document.createElement('div');bar.className='scroll-bar';bar.setAttribute('aria-hidden','true');document.body.append(bar);
}

function build(){
  const gsap=window.gsap,ST=window.ScrollTrigger;
  if(!gsap||!ST||still())return;
  const mm=gsap.matchMedia();

  // progress bar
  gsap.to('.scroll-bar',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.3}});

  // hero: the two logo lines rise out of a mask, then the hero drifts up and fades as you leave it
  gsap.fromTo('.logo-big .l1,.logo-big .l2',{yPercent:105,clipPath:'inset(0% 0% 100% 0%)'},{yPercent:0,clipPath:'inset(-20% -10% -20% -10%)',duration:1.2,ease:'expo.out',stagger:.12,delay:.15,clearProps:'clipPath'});
  gsap.to('.hero>.wrap',{y:-140,opacity:.1,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  gsap.to('.logo-big .chipO',{rotation:540,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:.6}});

  // section headlines rise word by word, and drop back out if you scroll above them, so they replay
  $$(HEADS).forEach(h=>{
    gsap.from(h.querySelectorAll('.wi'),{yPercent:110,rotation:4,duration:.9,ease:'expo.out',stagger:.06,
      scrollTrigger:{trigger:h,start:'top 88%',toggleActions:'play none none reverse'}});
  });

  // game cards: on wide screens the outer columns start stacked behind the middle one and slide out
  const cards=$$('.gcard');
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
  const fan=document.querySelector('.fan');
  if(fan){
    const tl=gsap.timeline({scrollTrigger:{trigger:fan,start:'top 95%',end:'top 35%',scrub:.8}});
    tl.from('.fan .fc1',{x:0,rotation:-3,y:30},0).from('.fan .fc3',{x:0,rotation:3,y:30},0).from('.fan .fc2',{y:60,scale:.92},0);
    gsap.to(fan,{y:-90,ease:'none',scrollTrigger:{trigger:fan,start:'center 35%',end:'bottom top',scrub:true}});
  }

  // tournament board grows into place
  gsap.from('.board',{scale:.86,opacity:.3,borderRadius:60,ease:'none',scrollTrigger:{trigger:'.board',start:'top bottom',end:'top 45%',scrub:true}});

  // photos: a gold panel wipes off while the photo settles from a zoom
  $$('#dining .frame,.vmap').forEach(box=>{
    const w=box.querySelector('.wipe'),img=box.querySelector('img');
    const tl=gsap.timeline({scrollTrigger:{trigger:box,start:'top 75%',once:true}});
    tl.from(box,{y:40,duration:.6,ease:'expo.out'},0)
      .to(w,{scaleX:0,duration:.85,ease:'expo.inOut'},.1)
      .from(img,{scale:1.3,duration:1.6,ease:'expo.out'},.15);
    gsap.fromTo(img,{yPercent:-6},{yPercent:6,ease:'none',scrollTrigger:{trigger:box,start:'top bottom',end:'bottom top',scrub:true}});
  });

  // the grill badge drifts in a slow loop tied to the scroll position
  const badge=document.querySelector('.badge2');
  if(badge){const sx=gsap.quickSetter(badge,'x','px'),sy=gsap.quickSetter(badge,'y','px');
    ST.create({trigger:'#dining',start:'top bottom',end:'bottom top',onUpdate:()=>{const y=window.scrollY;sx(24*Math.sin(y*.003));sy(20*Math.cos(y*.003))}})}

  // giant line slides from the right edge to well past the left as it crosses the screen
  $$('.bigline span').forEach(s=>gsap.fromTo(s,{x:()=>innerWidth*.6},{x:()=>-(s.offsetWidth-innerWidth*.4),ease:'none',
    scrollTrigger:{trigger:s.parentElement,start:'top bottom',end:'bottom top',scrub:.5,invalidateOnRefresh:true}}));

  // sign-up panel opens up from a smaller card
  gsap.from('.join',{scale:.9,y:60,opacity:.3,ease:'none',scrollTrigger:{trigger:'.join',start:'top bottom',end:'top 55%',scrub:true}});

  ST.refresh();
}

(window.cmReady||Promise.resolve()).then(prep);
window.addEventListener('cm:motion',build,{once:true});
})();
