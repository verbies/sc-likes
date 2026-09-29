import {useEffect,useRef,useState,ReactNode} from 'react';
/** Windowed list: only visible rows are in the DOM; `items` is the full collection. */
export function VirtualList<T>({items,rowHeight,render}:{items:T[];rowHeight:number;render:(t:T)=>ReactNode}){
  const ref=useRef<HTMLDivElement>(null);const [range,setRange]=useState([0,30]);
  useEffect(()=>{const f=()=>{const top=ref.current?.getBoundingClientRect().top??0;
      const a=Math.max(0,Math.floor(-top/rowHeight)-5);setRange([a,a+Math.ceil(innerHeight/rowHeight)+10]);};
    f();addEventListener('scroll',f,{passive:true});addEventListener('resize',f);
    return()=>{removeEventListener('scroll',f);removeEventListener('resize',f);};},[rowHeight,items.length]);
  return <div ref={ref} style={{height:items.length*rowHeight,position:'relative'}}>
    {items.slice(range[0],range[1]).map((t,i)=><div key={range[0]+i} style={{position:'absolute',top:(range[0]+i)*rowHeight,left:0,right:0,height:rowHeight}}>{render(t)}</div>)}</div>;
}
