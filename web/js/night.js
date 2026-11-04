"use strict";
const Night = (() => {
  function el(tag, text, parent) {
    const n=document.createElement(tag);
    if(text!=null) n.textContent=text;
    if(parent) parent.append(n);
    return n;
  }
  function button(parent,text,action) {
    const b=el("button",text,parent); b.type="button"; b.className="btn";
    b.addEventListener("click",action); return b;
  }
  function sponsor(parent,team,data,choose) {
    const current=team.sponsor?.name || "";
    const box=el("section",null,parent); box.className="pit-panel";
    el("h2","Current sponsor: "+(current || "None"),box);
    el("p","Sponsors grant team abilities and unlock perk classes. For a first Street Race, leave this unset.",box);
    const active=data.find(x=>x.Name===current);
    if(active) el("p",active.PerkClasses.join(" / ")+" · "+active.SponsorPerks.map(x=>x.Name).join(" · "),box);
    const fold=el("details",null,box); el("summary","Explore sponsors",fold);
    const grid=el("div",null,fold); grid.className="sponsor-guide";
    const list=el("div",null,grid); list.className="sponsor-options";
    const detail=el("article",null,grid); detail.className="sponsor-detail";
    const entries=[...data,{Name:"None"},{Name:"Custom"}];
    const buttons=[];
    function preview(s) {
      buttons.forEach((b,i)=>b.setAttribute("aria-pressed",String(entries[i]===s)));
      detail.replaceChildren(); el("h3",s.Name,detail);
      if(s.SponsorPerks) {
        el("p",s.FlavorText,detail);
        el("h4","Perk classes",detail); el("p",s.PerkClasses.join(" / "),detail);
        el("h4","Team abilities & restrictions",detail);
        const dl=el("dl",null,detail);
        s.SponsorPerks.forEach(a=>{el("dt",a.Name,dl);el("dd",a.Description,dl);});
      } else el("p",s.Name==="None"?"Play without a sponsor.":"Use your group's own sponsor rules.",detail);
      const name=s.Name==="None"?"":s.Name;
      const use=button(detail,name===current?"Selected":"Choose "+s.Name,()=>{choose({name,isCustom:s.Name==="Custom"});document.querySelector(".pit-panel summary")?.focus();});
      use.disabled=name===current;
    }
    entries.forEach(s=>{
      const b=button(list,s.Name,()=>preview(s)); buttons.push(b);
      b.onfocus=()=>preview(s);
      b.onpointerenter=e=>{if(e.pointerType==="mouse") preview(s);};
    });
    preview(active || entries.find(s=>s.Name===(current || "None")) || entries[0]);
  }
  function read(key,fallback) {
    try {return JSON.parse(localStorage.getItem(key)) ?? fallback;} catch {return fallback;}
  }
  function save(key,value) {localStorage.setItem(key,JSON.stringify(value));}
  function counter(parent,label,key,obj,initial,min,max,persist,after) {
    const row=el("div",null,parent); row.className="counter"; row.dataset.counter=key;
    el("span",label,row); const value=()=>obj[key]??initial;
    const down=button(row,"−",()=>change(-1)); const out=el("output",null,row);
    const up=button(row,"+",()=>change(1));
    down.setAttribute("aria-label","Remove "+key); up.setAttribute("aria-label","Add "+key);
    function draw(){out.textContent=value();down.disabled=value()<=min;up.disabled=value()>=max; if(after) after(value());}
    function change(delta){obj[key]=Math.max(min,Math.min(max,value()+delta));persist();draw();}
    draw();
  }
  function race(parent,team,types) {
    el("h2","Race day",parent);
    el("p","Start with chassis values; adjust for upgrades or scenario rules. Counters save on this phone.",parent);
    const key="pit.race."+team.id, state=read(key,{});
    const persist=()=>save(key,state);
    counter(parent,"Audience votes","vote",state,0,0,Infinity,persist);
    if(!team.vehicles?.length) el("p","Add a vehicle in the garage to start tracking.",parent);
    (team.vehicles||[]).forEach(v=>{
      const t=types.find(t=>t.Name===v.vehicleType)||{};
      const card=el("article",null,parent);card.className="pit-panel";
      el("h3",v.customName || v.vehicleType,card);
      const record=state["v:"+v.id]??={};
      const hint=el("p",null,card);
      counter(card,"Hull remaining","hull",record,t.Hull||1,0,Infinity,persist);
      counter(card,"Current gear","gear",record,1,1,6,persist);
      counter(card,"Hazards","hazard",record,0,0,Infinity,persist,n=>hint.textContent=n>=6?"Check for a wipeout during the wipeout step (p. 34).":"");
      (v.weapons||[]).filter(w=>/ammo/i.test(w.specialRules||"")).forEach((w,i)=>counter(card,w.name+" · ammo spent","ammo "+i,record,0,0,Infinity,persist));
    });
    button(parent,"Reset race counters",()=>{if(confirm("Reset only this team's race counters?")){localStorage.removeItem(key); parent.replaceChildren();race(parent,team,types);}});
    if(team.vehicles?.length) {
      button(parent,"Print dashboard inserts",()=>cards(team,types));
      const line=el("p",null,parent); const link=el("a","Download matching 3D-printable sleeve (STL)",line);
      link.href="printables/pit-sleeve.stl"; link.download="pit-sleeve.stl";
    }
  }
  function cards(team,types) {
    const w=window.open("","_blank"); if(!w){alert("Allow the print window to open.");return;}
    const d=w.document; d.title="Pit cards · print at 100%";
    const style=d.createElement("style");style.textContent="@page{margin:10mm}body{font:12pt system-ui;color:#111}article{box-sizing:border-box;width:152.4mm;height:101.6mm;border:.3mm dashed;padding:6mm;break-inside:avoid;overflow:hidden}h2,p{margin:2mm 0}h2{font-size:18pt}.gear{border-top:1px solid;padding-top:4mm}small{font-size:9pt}"; d.head.append(style);
    for(const v of team.vehicles) {
      const t=types.find(x=>x.Name===v.vehicleType)||{};
      const items=[...(v.weapons||[]),...(v.upgrades||[]),...(v.perks||[])].map(x=>x.name);
      // Paginate equipment lists so heavily equipped vehicles retain every entry.
      const chunks=items.flatMap(x=>String(x).match(/.{1,50}/gu)||[]);
      for(let i=0;i<Math.max(1,chunks.length);i+=4){
        const c=d.createElement("article");d.body.append(c);
        el("small",(team.name||"Team")+" / "+(team.sponsor?.name||"Independent"),c);
        el("h2",(v.customName||v.vehicleType).slice(0,42),c);
        el("p",v.vehicleType+" · Base hull "+t.Hull+" · Handling "+t.Handling+" · Max gear "+t.MaxGear,c);
        el("p","Gear ____     Hazards ____     Hull left ____",c).className="gear";
        el("p",chunks.slice(i,i+4).join(" / ")||"No purchased equipment",c);
        el("small","4 × 6 in • print at 100% • cut along border",c);
      }
    }
    w.focus(); w.print();
  }
  function season(parent) {
    const key="pit.season.v1", entries=read(key,[]);
    el("h2","Season log",parent);el("p","A shared notebook for teams on this device. Schedule races and record results, purchases, wrecks or injuries.",parent);
    const form=el("form",null,parent);form.className="pit-panel";
    const kind=el("select",null,form);kind.setAttribute("aria-label","Entry type");
    ["Scheduled match","Race result","Workshop purchase","Wreck or injury"].forEach(x=>el("option",x,kind));
    const date=el("input",null,form);date.type="date";date.setAttribute("aria-label","Event date");const now=new Date(); date.value=new Date(now-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
    const label=el("label","Event or result",form); const input=el("input",null,label);input.required=true;input.maxLength=300;
    el("button","Save entry",form).className="btn";
    const list=el("ol",null,parent);
    function draw(){list.replaceChildren();entries.forEach((e,i)=>{const li=el("li",null,list);el("small",e.date+" · "+e.kind,li);el("p",e.text,li);button(li,"Remove",()=>{if(confirm("Remove this log entry?")){entries.splice(i,1);save(key,entries);draw();}});});}
    form.onsubmit=e=>{e.preventDefault();if(!input.value.trim())return;entries.unshift({kind:kind.value,date:date.value,text:input.value.trim()});save(key,entries);input.value="";draw();};draw();
  }
  function nav(content,team,types) {
    const bar=el("nav",null);bar.className="pit-nav";bar.setAttribute("aria-label","Team workspace");
    const panel=el("section",null); panel.className="pit-mode";
    const garage=[...content.children]; content.prepend(bar);content.append(panel);
    ["Garage","Race day","Season log"].forEach((title,i)=>{
      const b=button(bar,title,()=>{garage.forEach(n=>n.hidden=i!==0);document.getElementById("budget-bar").style.display=i===0?"flex":"none";
        [...bar.children].forEach(k=>k.setAttribute("aria-pressed",String(k===b)));
        panel.replaceChildren();if(i===1)race(panel,team,types);if(i===2)season(panel);
      });b.setAttribute("aria-pressed",String(!i));
    });
  }
  return {sponsor,nav};
})();

