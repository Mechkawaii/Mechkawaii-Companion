(function(){
  "use strict";

  const P="mechkawaii:";
  const FLOW=P+"game-flow";
  const CLASSIC=P+"shield-assignments";
  const BLUE=P+"blue-shield-by-tech";
  const BLUE_META=P+"blue-shield-expiry-meta";
  const SHIELD_CLASSES=["has-shield","is-shielded","shielded","mkw-tab-shielded","mkw-tab-shield-pulse"];
  const STYLE_ID="mkwTurnEndShieldVisualResetStyle";

  function read(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}catch(e){return fallback;}}
  function write(key,value){localStorage.setItem(key,JSON.stringify(value));}
  function currentId(){return new URL(location.href).searchParams.get("id")||"";}
  function flow(){return window.mkwGetGameFlowState?.()||read(FLOW,null);}
  function token(s=flow()){return !s?.started?"free":`${Number(s.roundNumber||1)}:${s.currentCamp||"mechkawaii"}`;}
  function classicIds(){return new Set(Object.values(read(CLASSIC,{})).filter(Boolean));}

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      html.mkw-turn-resetting-shields .unit-tab.mkw-tab-shielded,
      html.mkw-turn-resetting-shields .has-shield,
      html.mkw-turn-resetting-shields .is-shielded,
      html.mkw-turn-resetting-shields .shielded{
        box-shadow:none!important;
        border-color:var(--border)!important;
        filter:none!important;
      }
      html.mkw-turn-resetting-shields .unit-tab.mkw-tab-shielded::after{
        content:none!important;
        display:none!important;
      }
    `;
    document.head.appendChild(style);
  }

  function strip(el){
    if(!el)return;
    SHIELD_CLASSES.forEach(cls=>el.classList.remove(cls));
  }

  function stripBlueVisualsOnly(){
    const classic=classicIds();
    const current=currentId();

    if(current && !classic.has(current)){
      ["#hpCard","#charPortrait",".topbar",".hp-shields-wrapper",".hp-section",".shields-section"].forEach(selector=>strip(document.querySelector(selector)));
      document.querySelectorAll(".has-shield,.is-shielded,.shielded").forEach(el=>{if(!el.closest?.("#unitTabs"))strip(el);});
    }

    document.querySelectorAll("#unitTabs [data-char-id]").forEach(tab=>{
      if(!classic.has(tab.dataset.charId))strip(tab);
    });
  }

  function clearBlueStorage(){
    write(BLUE,{});
    write(BLUE_META,{});
  }

  function forceClearShieldVisuals(){
    installStyle();
    clearBlueStorage();
    document.documentElement.classList.add("mkw-turn-resetting-shields");

    [0,20,60,120,240,500,900,1400,2200,3200].forEach(delay=>{
      setTimeout(()=>{
        clearBlueStorage();
        stripBlueVisualsOnly();
      },delay);
    });

    setTimeout(()=>{
      clearBlueStorage();
      stripBlueVisualsOnly();
      document.documentElement.classList.remove("mkw-turn-resetting-shields");
    },3800);
  }

  function blueShouldExpireNow(){
    const now=token();
    const byTech=read(BLUE,{});
    const meta=read(BLUE_META,{});
    const hasBlue=Object.keys(byTech||{}).length>0 || Object.keys(meta||{}).length>0;
    if(!hasBlue)return false;

    const metaItems=Object.values(meta||{});
    if(!metaItems.length)return false;
    return metaItems.some(info=>info?.placedToken && info.placedToken!==now);
  }

  function passiveSync(){
    if(blueShouldExpireNow())forceClearShieldVisuals();
    else stripBlueVisualsOnly();
  }

  function isTurnEndClick(target){
    const el=target?.closest?.("button,a,[role='button']");
    if(!el)return false;
    if(el.matches(".mkw-end-turn,.mkw-turn-transition-button,.mkw-reset-flow"))return true;
    const text=(el.textContent||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    return text.includes("fin de tour") || text.includes("end turn") || text.includes("tour des") || text.includes("est termine") || text.includes("turn is finished");
  }

  function init(){
    installStyle();
    document.addEventListener("pointerdown",event=>{if(isTurnEndClick(event.target))forceClearShieldVisuals();},true);
    document.addEventListener("click",event=>{if(isTurnEndClick(event.target))forceClearShieldVisuals();},true);
    window.addEventListener("mechkawaii:game-flow-updated",passiveSync);
    window.addEventListener("mechkawaii:turn-start",passiveSync);
    window.addEventListener("mechkawaii:blue-shields-cleared",forceClearShieldVisuals);
    window.mkwForceClearShieldVisuals=forceClearShieldVisuals;
    setInterval(passiveSync,250);
    passiveSync();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();
