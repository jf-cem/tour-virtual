export function dockInterface(){
 const root=document.documentElement,header=document.querySelector('body>header'),views=document.querySelector('.view-switch'),plan=document.querySelector('#plan-camera-controls');
 let pending=false;
 function layout(){pending=false;const left=innerWidth<=520?12:20;root.style.setProperty('--cem-dock-left',left+'px');let top=12;
  if(header?.getBoundingClientRect().height){top=header.getBoundingClientRect().bottom+14;root.style.setProperty('--cem-views-top',top+'px');}
  if(views?.getBoundingClientRect().height)top=views.getBoundingClientRect().bottom+10;
  root.style.setProperty('--cem-plan-top',top+'px');if(plan&&!plan.hidden)top+=plan.getBoundingClientRect().height+10;
  root.style.setProperty('--cem-controls-top',top+'px');
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(layout);}}
 const observer=new ResizeObserver(schedule);for(const e of [header,views,plan])if(e)observer.observe(e);addEventListener('resize',schedule);schedule();
}
