(function(){
  "use strict";
  const P="mechkawaii:";
  const CLASSIC=P+"shield-assignments";
  const BLUE=P+"blue-shield-by-tech";
  const BLUE_META=P+"blue-shield-expiry-meta";

  function read(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f;}catch(e){return f;}}
  function write(k,v){localStorage.setItem(k,JSON.stringify(v));}
  function currentId(){return new URL(location.href).searchParams.get("id")||"";}
  function classicIds(){return new Set(Object.values(read(CLASSIC,{})).filter(Boolean));}
  function strip(el){el?.classList?.remove("has-shield","is-shielded","shielded","mkw-tab-shielded","mkw-tab-shield-pulse");}

  function collectBlueTargets(){
    const blue=read(BLUE,{});
    const meta=read(BLUE_META,{});
    return Array.from(new Set([...Object.values(blue).filter(Boolean),...Object.values(meta).map(x=>x?.targetId).filter(Boolean)]));
  }

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

  function clearBlueShields(){
    const ids=collectBlueTargets();
    if(!ids.length)return;
    write(BLUE,{});
    write(BLUE_META,{});
    [0,40,120,260,700,1400].forEach(d=>setTimeout(()=>refreshVisuals(ids),d));
  }

  function scheduleClear(){[0,50,150].forEach(d=>setTimeout(clearBlueShields,d));}
  function scheduleVisualRefresh(){[0,120,400].forEach(d=>setTimeout(()=>refreshVisuals([]),d));}
  function init(){window.addEventListener("mechkawaii:game-flow-updated",scheduleClear);window.addEventListener("mechkawaii:turn-start",scheduleClear);window.addEventListener("pageshow",scheduleVisualRefresh);scheduleVisualRefresh();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
