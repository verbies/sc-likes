// D-pad navigation + media keys for Google TV remotes. Harmless on desktop (arrow keys still work in inputs).
const SEL='button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])';
const vis=(e:Element)=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;};
const dirs:Record<string,[number,number]>={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
addEventListener('keydown',e=>{
  const d=dirs[e.key];if(!d||e.defaultPrevented)return;
  const a=document.activeElement as HTMLInputElement|null;
  if(a?.type==='range'&&d[0])return;                       // left/right adjusts sliders
  if((a?.type==='search'||a?.type==='text')&&d[0])return;  // left/right moves the caret
  const from=(a&&a!==document.body?a:document.body).getBoundingClientRect();
  const cx=from.left+from.width/2,cy=from.top+from.height/2;let best:HTMLElement|null=null,bs=1e9;
  document.querySelectorAll<HTMLElement>(SEL).forEach(el=>{
    if(el===a||!vis(el))return;const r=el.getBoundingClientRect(),x=r.left+r.width/2-cx,y=r.top+r.height/2-cy;
    const along=x*d[0]+y*d[1],across=Math.abs(d[0]?y:x);if(along<=4)return;
    const s=along+across*2.5;if(s<bs){bs=s;best=el;}});
  e.preventDefault();
  if(best){(best as HTMLElement).focus({preventScroll:true});(best as HTMLElement).scrollIntoView({block:'nearest'});}
  else if(d[1])scrollBy({top:d[1]*innerHeight*0.5,behavior:'smooth'});   // reveal more of the virtual list
});
// Media keys are forwarded by MainActivity as clicks on the labelled player buttons.
(window as any).tvKey=(k:string)=>{const b=document.querySelector<HTMLElement>({toggle:'[aria-label=Play],[aria-label=Pause]',next:'[aria-label=Next]',prev:'[aria-label=Previous]'}[k]??'');b?.click();};
