(function(){
  "use strict";
  const P="mechkawaii:";
  const FLOW=P+"game-flow";
  const CLASSIC=P+"shield-assignments";
  const BLUE=P+"blue-shield-by-tech";
  const BLUE_META=P+"blue-shield-expiry-meta";
  const LAST=P+"blue-shield-turn-sync-last-token";

  function read(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f;}catch(e){return f;}}
  function write(k,v){localStorage.setItem(k,JSON.stringify(v));}
  function flow(){return window.mkwGetGameFlowState?.()||read(FLOW,null);}
  function token(s=flow()){return !s?.started?"free":`${Number(s.roundNumber||1)}:${s.currentCamp||"mechkawaii"}`;}
  function currentId(){return new URL(location.href).searchParams.get("id")||"";}
  function classicIds(){return new Set(Object.values(read(CLASSIC,{})).filter(Boolean));}
  function strip(el){el?.classList?.remove("has-shield","is-shielded","shielded","mkw-tab-shielded","mkw-tab-shield-pulse");}

  function refreshVisuals(ids){
    const classic=classicIds();
    const current=currentId();
    if(current && !classic.has(current)){
      ["#hpCard","#charPortrait",".topbar",".hp-shields-wrapper",".hp-section",".shields-section"].forEach(s=>strip(document.querySelector(s)));
      document.querySelectorAll(".has-shield,.is-shielded,.shielded").forEach(el=>{if(!el.closest?.("#unitTabs"))strip(el);});
    }
    document.querySelectorAll("#unitTabs [data-char-id]").forEach(tab=>{if(!classic.has(tab.dataset.charId))strip(tab);});
    ids.forEach(charId=>window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated",{detail:{charId,type:"technician",expired:true}})));
  }

  function sync(){
    const s=flow();
    if(!s?.started)return;
    const now=token(s);
    const before=localStorage.getItem(LAST);
    if(!before){localStorage.setItem(LAST,now);return;}
    if(before===now)return;
    const blue=read(BLUE,{});
    const meta=read(BLUE_META,{});
    const ids=Array.from(new Set([...Object.values(blue).filter(Boolean),...Object.values(meta).map(x=>x?.targetId).filter(Boolean)]));
    write(BLUE,{});
    write(BLUE_META,{});
    localStorage.setItem(LAST,now);
    [0,40,120,260,700,1400].forEach(d=>setTimeout(()=>refreshVisuals(ids),d));
  }

  function schedule(){[0,50,150].forEach(d=>setTimeout(sync,d));}
  function init(){window.addEventListener("mechkawaii:game-flow-updated",schedule);window.addEventListener("mechkawaii:turn-start",schedule);window.addEventListener("pageshow",schedule);schedule();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
