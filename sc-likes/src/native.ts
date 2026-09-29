// Only active inside the Android TV app (window.Android is injected by MainActivity).
import * as core from '../server/core.mjs';
const A=(window as any).Android;
if(A){
  const pending=new Map<number,(r:{status:number;headers:Record<string,string>;body:string})=>void>();let seq=0;
  (window as any).__nf=(id:number,status:number,headers:string,b64:string)=>{pending.get(id)?.({status,headers:JSON.parse(headers),body:b64});pending.delete(id);};
  const once=(method:string,url:string,headers:Record<string,string>,body:string)=>new Promise<Response>((res,rej)=>{
    const id=++seq;
    pending.set(id,r=>{if(!r.status)return rej(new TypeError('network'));
      const bin=atob(r.body),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
      res(new Response([204,205,304].includes(r.status)||!bytes.length?null:bytes,{status:r.status,headers:r.headers}));});
    A.fetch(id,method,url,JSON.stringify(headers),body);});
  const nativeFetch=async(input:any,init:any={})=>{
    let url=String(input instanceof URL?input.href:input),method=init.method??'GET',body=init.body==null?'':String(init.body);
    const headers:Record<string,string>={};new Headers(init.headers).forEach((v,k)=>{headers[k]=v;});
    for(let i=0;i<6;i++){
      const r=await once(method,url,headers,body),loc=r.headers.get('location');
      if(init.redirect!=='manual'&&[301,302,303,307,308].includes(r.status)&&loc){url=new URL(loc,url).href;method='GET';body='';continue;}
      return r;}
    throw new TypeError('too many redirects');};
  const real=window.fetch.bind(window);
  window.fetch=(async(input:any,init?:any)=>{
    const href=String(input instanceof URL?input.href:input),u=new URL(href,location.href);
    if(u.origin===location.origin&&u.pathname.startsWith('/api/')){
      const name=u.pathname.slice(5);
      const q=Object.fromEntries(u.searchParams);
      const r:any=name==='likes'?await core.likes(q):name==='settings'?core.settings():name==='diagnose'?await core.diagnose():{status:404,body:{}};
      return new Response(JSON.stringify(r.body),{status:r.status,headers:{'content-type':'application/json',...(r.headers??{})}});}
    if(u.origin!==location.origin&&/(^|\.)(soundcloud\.com|sndcdn\.com)$/.test(u.hostname))return nativeFetch(input,init);
    return real(input,init);}) as typeof fetch;
}
