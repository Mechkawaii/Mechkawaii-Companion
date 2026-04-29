(function(){
  "use strict";

  const P="mechkawaii:";
  const BLUE_KEYS=[P+"blue-shield-by-tech",P+"blue-shield-expiry-meta"];
  const SHIELD_CLASSES=["has-shield","is-shielded","shielded","mkw-tab-shielded","mkw-tab-shield-pulse"];
  const STYLE_ID="mkwTurnEndShieldVisualResetStyle";

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

  function clearBlueStorage(){
    BLUE_KEYS.forEach(key=>localStorage.setItem(key,"{}"));
  }

  function stripClassVisuals(){
    document.querySelectorAll(".has-shield,.is-shielded,.shielded,.mkw-tab-shielded,.mkw-tab-shield-pulse").forEach(el=>{
      SHIELD_CLASSES.forEach(cls=>el.classList.remove(cls));
      if(el.classList.length===0)el.removeAttribute("class");
    });
  }

  function forceClearShieldVisuals(){
    installStyle();
    clearBlueStorage();
    document.documentElement.classList.add("mkw-turn-resetting-shields");

    [0,20,60,120,240,500,900,1400,2200,3200].forEach(delay=>{
      setTimeout(()=>{
        clearBlueStorage();
        stripClassVisuals();
      },delay);
    });

    setTimeout(()=>{
      clearBlueStorage();
      stripClassVisuals();
      document.documentElement.classList.remove("mkw-turn-resetting-shields");
    },3800);
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
    document.addEventListener("pointerdown",event=>{
      if(isTurnEndClick(event.target))forceClearShieldVisuals();
    },true);
    document.addEventListener("click",event=>{
      if(isTurnEndClick(event.target))forceClearShieldVisuals();
    },true);
    window.addEventListener("mechkawaii:game-flow-updated",forceClearShieldVisuals);
    window.addEventListener("mechkawaii:turn-start",forceClearShieldVisuals);
    window.addEventListener("mechkawaii:blue-shields-cleared",forceClearShieldVisuals);
    window.mkwForceClearShieldVisuals=forceClearShieldVisuals;
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();
