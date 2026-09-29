// Used instead of env.mjs in the Android build (vite --mode android). Config comes from the native app.
const parse=t=>{const o={};for(const l of String(t).split(/\r?\n/)){if(/^\s*#/.test(l))continue;
  const m=/^\s*([A-Za-z_]+)\s*[=:]\s*(.*?)\s*$/.exec(l);if(m)o[m[1].toUpperCase()]=m[2].replace(/^["']|["']$/g,'');}return o;};
const cfg=()=>{try{return parse(globalThis.Android?.config?.()??'');}catch{return{};}};
export function getCreds(){const f=cfg();const clientId=f.CLIENT_ID||f.SOUNDCLOUD_CLIENT_ID,clientSecret=f.CLIENT_SECRET||f.SOUNDCLOUD_CLIENT_SECRET;
  return clientId&&clientSecret?{clientId,clientSecret}:null;}
export const DEFAULT_PROFILE='https://soundcloud.com/vetb';
export function normalizeProfile(v){
  let x=String(v??'').trim();if(!x)return null;
  if(!/[\/.]/.test(x))x='soundcloud.com/'+x;
  if(!/^https?:\/\//i.test(x))x='https://'+x;
  let u;try{u=new URL(x);}catch{return null;}
  if(!/^(www\.|m\.)?soundcloud\.com$/i.test(u.hostname))return null;
  const name=u.pathname.split('/').filter(Boolean)[0];
  return name&&/^[\w.-]+$/.test(name)?'https://soundcloud.com/'+name:null;}
export function getProfile(){const raw=cfg().PROFILE_URL;if(!raw)return{url:DEFAULT_PROFILE,invalid:null};
  const url=normalizeProfile(raw);return url?{url,invalid:null}:{url:DEFAULT_PROFILE,invalid:raw};}
