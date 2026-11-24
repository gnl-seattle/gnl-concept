/* Game Nite Lounge: shared behavior.
   Each page sets <body data-root="../" data-page="seattle">. */

const CONFIG = {
  // Paste a form endpoint (Klaviyo, Mailchimp, Formspree, HubSpot, or a Google Apps Script web app).
  // While empty, forms confirm on screen but send nothing.
  WAITLIST_ENDPOINT: "",
  EVENTS_ENDPOINT: "",
  MEMPHIS_BOOKING_URL: "https://gamenitelounge.com/memphis/book-now",

  /* Off the Couch (OTC): paste each booking-site template URL once it's set up in OTC.
     One OTC account, one "location" per city, separate booking templates per audience.
     Empty values fall back to the current pages, so nothing breaks before launch. */
  OTC: {
    "memphis.sessions":   "",   // public 1/2/3-hour lounge sessions (replaces the Bookeo widget)
    "memphis.giftcards":  "",
    "memphis.memberships":"",   // confirm OTC supports memberships; else keep the current portal
    "seattle.sessions":   "",   // turn on at launch
    "corporate":          "",   // request-to-book template with deposit rules (used by "Pay deposit")
    "birthdays":          ""
  },
  OTC_FALLBACK: {
    "memphis.sessions":"https://gamenitelounge.com/memphis/book-now",
    "memphis.giftcards":"https://gamenitelounge.com/memphis/gift-cards/",
    "memphis.memberships":"https://gamenitelounge.com/memphis/members/"
  }
};

/* Game library. SAMPLE DATA: replace names, hooks and descriptions with the real catalog.
   Drop a gameplay still at assets/games/<id>.jpg and it replaces the color block automatically. */
const GAMES = [
  {id:"who-said-it", name:"Who Said It?", mode:"party", hook:"Match each anonymous answer to the friend who wrote it.",
   desc:"Everyone answers the same prompt in secret, then the group guesses who wrote what. Expect to learn something about your friends.", mins:10, bestFor:"Friends", featured:true},
  {id:"fib-finder", name:"Fib Finder", mode:"party", hook:"Make up fake answers. Find the real one.",
   desc:"Bluff your way through strange trivia. You score points for fooling your friends and for spotting the truth.", mins:12, bestFor:"Big groups"},
  {id:"hot-take", name:"Hot Take", mode:"party", hook:"Rank the opinions. Defend your ranking.",
   desc:"Put spicy opinions in order with your coaster before the clock runs out, then see how far your group strayed from everyone else.", mins:8, bestFor:"Coworkers"},
  {id:"buzzer-beater", name:"Buzzer Beater", mode:"brainy", hook:"Slap your coaster first. Then be right.",
   desc:"Classic game-show trivia with the full lights and sound. Buzz in from the table, steal points on a wrong answer, and survive the lightning round.", mins:12, bestFor:"Trivia people", featured:true},
  {id:"word-heist", name:"Word Heist", mode:"brainy", hook:"Steal letters, build words, rob your rivals.",
   desc:"Every letter you claim is one your opponents can't use. Long words pay out big, and short words still count.", mins:10, bestFor:"Date night"},
  {id:"picture-this", name:"Picture This", mode:"brainy", hook:"The picture reveals itself one tile at a time.",
   desc:"Name the place, the face or the movie scene before it's fully revealed. The fewer tiles you need, the more you score.", mins:8, bestFor:"Families"},
  {id:"table-wars", name:"Table Wars", mode:"strategy", hook:"Claim the board. Break your alliances.",
   desc:"A territory game played on the coffee table. Expand, make deals and break them at exactly the wrong moment.", mins:15, bestFor:"Rivals", featured:true},
  {id:"high-roller", name:"High Roller", mode:"strategy", hook:"Push your luck, or bank your points.",
   desc:"Roll the dice and decide when to stop. One bad roll wipes out the round.", mins:8, bestFor:"Everyone"},
  {id:"bluff-bank", name:"Bluff Bank", mode:"strategy", hook:"Bet big on a hand you don't have.",
   desc:"Make hidden bids, bluff boldly and read the room. Is your friend bluffing?", mins:12, bestFor:"Card players"},
  {id:"snack-attack", name:"Snack Attack", mode:"arcade", hook:"Tap fast. Snack faster.",
   desc:"Grab the good snacks and dodge the broccoli on the interactive table before the round ends.", mins:5, bestFor:"Kids & adults", featured:true},
  {id:"coaster-curling", name:"Coaster Curling", mode:"arcade", hook:"Slide it. Bump it. Bullseye.",
   desc:"Flick your coaster's avatar toward the target and knock everyone else's off it. Simple, and very loud.", mins:6, bestFor:"Mixed ages"},
  {id:"beat-drop", name:"Beat Drop", mode:"arcade", hook:"Keep the beat as a group.",
   desc:"A rhythm game where everyone taps together to keep the song alive. When one person misses, everyone hears it.", mins:6, bestFor:"Warm-up"},
  {id:"sleigh-ride", name:"Sleigh Ride Showdown", mode:"seasonal", hook:"From the 15-game Christmas Special.",
   desc:"Race to deliver the most presents before midnight. Available for a limited time each holiday season.", mins:8, bestFor:"Holiday parties"}
];
const MODES = {party:"Party", brainy:"Trivia & words", strategy:"Board & cards", arcade:"Arcade", seasonal:"Holiday"};

/* Real titles, read off the Memphis game-wall image. Spellings to confirm with the owner. */
const LIBRARY = ["Smack the Toucan","Clean It Up","Size It Up","Warzone","Gibberish","Market Mayhem","They Gone","Graduation","Look Out Below","Pranktionary","Touch & Go","Chaos Banana","Pirate's Mark","Ingenuity","Unicorn Pineapple Chopsticks","Angry Dice","Speed Stop","Zilch","Modern Hieroglyphics","Word Link","Murdle","Swing Big","Web Crawler","Space Lords","Point of Reason","Pathfinders","Who's That?"];

const LOCATIONS = {
  memphis:{tax:.0975},
  seattle:{tax:.1055}
};
const PRICES = {1:27.99, 2:41.99, 3:54.99};
const MORNING = .9;

const $ = (s,el=document)=>el.querySelector(s), $$ = (s,el=document)=>[...el.querySelectorAll(s)];
const money = n=>"$"+n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const ROOT = document.body.dataset.root || "";
const PAGE = document.body.dataset.page || "";

/* Turn text into coaster letters: <span data-coins>GAME NITE</span> */
function coinify(){
  $$("[data-coins]").forEach(el=>{
    const words=el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label",el.textContent.trim());
    el.innerHTML=words.map(w=>`<span class="coins" aria-hidden="true">${[...w].map(ch=>`<span class="coin"><span>${ch}</span></span>`).join("")}</span>`).join(" ");
  });
}

/* Top bar + footer */
function chrome(){
  const cta = {
    seattle:["Join waitlist","#waitlist"],
    memphis:["Book","#rates"],
    events:["Get a quote","#quote"],
    birthdays:["Plan a party","#party-form"]
  }[PAGE] || ["Book","#book"];
  const link=(href,label,key)=>`<li><a class="cell" href="${ROOT}${href}"${PAGE===key?' aria-current="page"':''}>${label}</a></li>`;
  const inCity=PAGE==="seattle"||PAGE==="memphis";
  const bar=document.createElement("header");
  bar.className="topbar";
  bar.innerHTML=`
    <a class="cell logo" href="${ROOT}index.html" aria-label="Game Nite Lounge home"><span class="coin" aria-hidden="true"><span>G</span></span><span class="name">Game Nite Lounge</span></a>
    <button class="cell menu" aria-expanded="false" aria-controls="toplinks">Menu</button>
    <ul class="links" id="toplinks">
      <li class="has-sub"><button class="cell sub-btn" aria-expanded="false" aria-controls="locsub"${inCity?' data-current':''}>Locations <span aria-hidden="true">▾</span></button>
        <ul class="sub" id="locsub">
          <li><a href="${ROOT}memphis/index.html"${PAGE==="memphis"?' aria-current="page"':''}><b>Memphis</b><span>Open daily · Cooper-Young</span></a></li>
          <li><a href="${ROOT}seattle/index.html"${PAGE==="seattle"?' aria-current="page"':''}><b>Seattle</b><span>Opening 2027 · Join the waitlist</span></a></li>
        </ul></li>
      ${link("games/index.html","Games","games")}
      ${link("events/index.html","Team events","events")}
      ${link("birthdays/index.html","Birthdays","birthdays")}
      ${link("food/index.html","Food","food")}
    </ul>
    <a class="cell cta" href="${cta[1]}"${cta[1]==="#book"?" data-book":""}>${cta[0]}</a>`;
  document.body.prepend(bar);
  const mb=$(".menu",bar), ul=$("#toplinks",bar);
  mb.onclick=()=>{const o=ul.classList.toggle("open");mb.setAttribute("aria-expanded",o);mb.textContent=o?"Close":"Menu";};
  const sb=$(".sub-btn",bar), sub=$("#locsub",bar);
  const setSub=o=>{sub.classList.toggle("open",o);sb.setAttribute("aria-expanded",o);};
  sb.onclick=e=>{e.stopPropagation();setSub(!sub.classList.contains("open"));};
  document.addEventListener("click",e=>{if(!e.target.closest(".has-sub")) setSub(false);});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){setSub(false);}});

  // "Book" picker: one button, two cities
  const dlg=document.createElement("dialog");
  dlg.className="book-pick"; dlg.setAttribute("aria-labelledby","bookPickTitle");
  dlg.innerHTML=`<form method="dialog"><button class="x" aria-label="Close">×</button></form>
    <span class="label">Pick your city</span>
    <h2 id="bookPickTitle">Where are you playing?</h2>
    <a class="city c-mem" href="${ROOT}memphis/index.html#rates"><b>Memphis</b><span>Open daily from 10 AM. Grab a lounge tonight.</span><i>Book a lounge →</i></a>
    <a class="city c-sea" href="${ROOT}seattle/index.html#waitlist"><b>Seattle</b><span>Opening 2027. Get first pick of opening-week nights.</span><i>Join the waitlist →</i></a>`;
  document.body.append(dlg);
  dlg.addEventListener("click",e=>{if(e.target===dlg) dlg.close();});
  document.addEventListener("click",e=>{const b=e.target.closest("[data-book]"); if(!b||typeof dlg.showModal!=="function") return; e.preventDefault(); dlg.showModal();});

  const f=document.createElement("footer");
  f.innerHTML=`<div class="wrap">
    <div class="word">Game Nite<br>Lounge</div>
    <div class="cols">
      <div><h4>Locations</h4><ul><li><a href="${ROOT}seattle/index.html">Seattle (opening 2027)</a></li><li><a href="${ROOT}memphis/index.html">Memphis, 22 S. Cooper St</a></li></ul></div>
      <div><h4>Play</h4><ul><li><a href="${ROOT}games/index.html">Game menu</a></li><li><a href="${ROOT}memphis/index.html#rates">Rates</a></li><li><a href="${ROOT}memphis/index.html#members">Memberships</a></li><li><a href="${ROOT}memphis/index.html#members">Gift cards</a></li></ul></div>
      <div><h4>Groups</h4><ul><li><a href="${ROOT}events/index.html">Team events</a></li><li><a href="${ROOT}birthdays/index.html">Birthdays</a></li><li><a href="${ROOT}events/index.html#quote">Buyouts</a></li></ul></div>
      <div><h4>Company</h4><ul><li><a href="${ROOT}index.html#story">Our story</a></li><li><a href="#">Jobs</a></li><li><a href="#">Accessibility</a></li><li><a href="#">Privacy</a></li></ul></div>
    </div></div>`;
  document.body.append(f);

  const t=document.createElement("button");
  t.className="notes-toggle"; t.textContent="Hide draft notes";
  t.title="Dashed tags mark assumed or missing info";
  t.onclick=()=>{const h=document.body.classList.toggle("hide-notes");t.textContent=h?"Show draft notes":"Hide draft notes";};
  document.body.append(t);
}

function decor(){
  const tk=$("#ticker");
  if(tk){const items=(tk.dataset.items||"Date night,Birthdays,Team outings,Family day,Bachelorettes,Friendsgiving,Rainy Sundays,Rematches").split(",");
    tk.innerHTML=[...items,...items].map(o=>`<span>${o}</span>`).join("");}
  const gt=$("#tvTitle");
  if(gt){let i=0;const g=GAMES.filter(x=>x.mode!=="seasonal");
    setInterval(()=>{i=(i+1)%g.length;gt.textContent=g[i].name;$("#tvRound").textContent=`Round ${(i%5)+1} · ${MODES[g[i].mode]} mode`;},2800);}
  const bar=$("#bottombar"), hero=$(".hero");
  if(bar&&hero) new IntersectionObserver(([e])=>bar.classList.toggle("show",!e.isIntersecting)).observe(hero);
}

/* Game cards */
function gameCard(g){
  return `<article class="gcard m-${g.mode}" id="${g.id}">
    <div class="gart">
      ${g.img?`<img src="${ROOT}assets/games/${g.img}" alt="">`:""}
      <span class="gmode">${MODES[g.mode]}</span>
      <h3 class="gtitle">${g.name}</h3>
    </div>
    <div class="gbody">
      <div class="hook">${g.hook}</div>
      <p>${g.desc}</p>
      <dl class="gmeta"><div><dt>Players</dt><dd>2–8</dd></div><div><dt>Round</dt><dd>~${g.mins} min</dd></div><div><dt>Best for</dt><dd>${g.bestFor}</dd></div></dl>
    </div>
  </article>`;
}
function initGames(){
  const wall=$("#libraryWall");
  if(wall) wall.innerHTML=LIBRARY.map(n=>`<li>${n}</li>`).join("")+`<li class="more-t">+ ${70-LIBRARY.length} more</li>`;
  const teaser=$("#gameTeaser");
  if(teaser) teaser.innerHTML=GAMES.filter(g=>g.featured).slice(0,3).map(gameCard).join("");
  const grid=$("#gameGrid"); if(!grid) return;
  const PAGE_SIZE=6; let mode="all", showAll=false;
  const filters=$("#gameFilters");
  const count=m=>GAMES.filter(g=>m==="all"||g.mode===m).length;
  filters.innerHTML=[["all","All"],...Object.entries(MODES)].map(([k,v])=>`<button data-mode="${k}" aria-pressed="${k==="all"}">${v} <span class="label" style="letter-spacing:.05em">${count(k)}</span></button>`).join("");
  const moreBtn=$("#moreGames");
  function render(){
    const list=GAMES.filter(g=>mode==="all"||g.mode===mode);
    const shown=showAll||mode!=="all"?list:list.slice(0,PAGE_SIZE);
    grid.innerHTML=shown.map(gameCard).join("");
    const hidden=list.length-shown.length;
    moreBtn.hidden=hidden<=0; moreBtn.textContent=`Show ${hidden} more games`;
  }
  filters.onclick=e=>{const b=e.target.closest("button");if(!b)return;mode=b.dataset.mode;$$("button",filters).forEach(x=>x.setAttribute("aria-pressed",x===b));render();};
  moreBtn.onclick=()=>{showAll=true;render();};
  render();
}

/* Rate boxes + estimator */
function initPricing(){
  const root=$("#calc"); if(!root) return;
  const loc=LOCATIONS[root.dataset.loc||"memphis"];
  const s={time:"std",len:2,players:4};
  $("#pickPlayers").innerHTML=[2,3,4,5,6,7,8].map(n=>`<button data-players="${n}" aria-label="${n} players">${n}</button>`).join("");
  const press=(sel,attr,val)=>$$(sel).forEach(b=>b.setAttribute("aria-pressed",b.dataset[attr]==String(val)));
  const rates=$("#rateBoxes");
  if(rates){
    rates.innerHTML=[1,2,3].map(h=>`<button class="rate" data-len="${h}">
      ${h==2?'<span class="sticker pink pop">Most booked</span>':''}
      <span class="num">0${h}</span>
      <span class="len">${h} hour${h>1?"s":""}</span>
      <table><tr><td>After 2 PM</td><td>${money(PRICES[h])}</td></tr><tr><td>10 AM–2 PM</td><td>${money(PRICES[h]*MORNING)}</td></tr></table>
      <span class="small">per person, plus tax</span>
    </button>`).join("");
    $$(".rate",rates).forEach(b=>b.onclick=()=>{s.len=+b.dataset.len;sync();$("#calc").scrollIntoView({behavior:"smooth",block:"center"});});
  }
  function est(){
    const unit=PRICES[s.len]*(s.time==="am"?MORNING:1), sub=unit*s.players, tax=sub*loc.tax, tot=sub+tax;
    $("#eLine").textContent=`${s.players} × ${money(unit)}`; $("#eSub").textContent=money(sub);
    $("#eTaxL").textContent=`Tax ${(loc.tax*100).toFixed(2)}%`; $("#eTax").textContent=money(tax);
    $("#eTotal").textContent=money(tot); $("#ePP").textContent=`${money(tot/s.players)} each, all in`;
    $("#eDep").textContent=money(unit*2*(1+loc.tax));
    $("#oPlayers").textContent=s.players; $("#oLen").textContent=s.len+(s.len>1?" hours":" hour");
  }
  function sync(){press("[data-time]","time",s.time);press("#pickLen button","len",s.len);press("#pickPlayers button","players",s.players);if(rates)press("#rateBoxes .rate","len",s.len);est();}
  $$("#pickPlayers button").forEach(b=>b.onclick=()=>{s.players=+b.dataset.players;sync();});
  $$("#pickLen button").forEach(b=>b.onclick=()=>{s.len=+b.dataset.len;sync();});
  $$("[data-time]").forEach(b=>b.onclick=()=>{s.time=b.dataset.time;sync();});
  sync();
}

/* Forms */
function initForms(){
  $$("form[data-endpoint]").forEach(form=>{
    form.addEventListener("submit",async e=>{
      e.preventDefault();
      const ok=$(".form-ok",form), btn=$("button[type=submit]",form);
      const data={};
      for(const [k,v] of new FormData(form).entries()) data[k]=k in data?[].concat(data[k],v):v;   // keep every ticked checkbox
      data.page=PAGE; data.submittedAt=new Date().toISOString();
      const q=new URLSearchParams(location.search);
      ["utm_source","utm_medium","utm_campaign","ref"].forEach(k=>{if(q.get(k))data[k]=q.get(k);});
      const url=CONFIG[form.dataset.endpoint];
      btn.disabled=true;
      try{
        if(url) await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
        else console.info("[draft] No endpoint set. Would send:",data);
        ok.textContent=(form.dataset.success||"Got it.")+(url?"":" (Draft site: nothing was sent.)");
        ok.classList.add("show"); form.reset();
        form.dispatchEvent(new CustomEvent("gnl:sent",{detail:data}));
      }catch(err){ok.textContent="That didn't go through. Email us instead and we'll sort it out.";ok.classList.add("show");}
      btn.disabled=false;
    });
  });
}

/* ---------- Corporate event builder ----------
   ALL PRICES AND RULES BELOW ARE PLACEHOLDERS for the owner to set. */
const EVENT = {
  tax:{seattle:.1055, memphis:.0975},
  gratuity:.20, depositPct:.25, maxLounges:10, perLounge:8,
  weekendNightMin:2500,            // Fri/Sat after 5 PM, before tax and gratuity
  pkgs:{
    break:{name:"Game Break", pp:39, hrs:1.5, desc:"90 min · weekdays before 5 PM", food:"snacks", drinks:"soft", extras:[]},
    team: {name:"Team Night", pp:65, hrs:2,   desc:"2 hrs · tournament across lounges", food:"pizza", drinks:"tickets", extras:["trophy"]},
    house:{name:"Full House", pp:95, hrs:3,   desc:"3 hrs · the whole venue (40+ guests)", food:"dinner", drinks:"tickets", extras:["trophy","trivia","logo","host"], minGuests:40}
  },
  food:[
    {id:"snacks", name:"Snack spread", pp:8,  desc:"Pretzels, churros, fresh-baked cookies"},
    {id:"pizza",  name:"Pizza party",  pp:16, desc:"Pizza for the table, pretzels, cookies"},
    {id:"dinner", name:"Dinner spread",pp:28, desc:"Shareable mains, salad, sides, dessert"}
  ],
  drinks:[
    {id:"soft",    name:"Coffee & soda",       pp:4,  desc:"Unlimited soft drinks"},
    {id:"zero",    name:"Zero-proof tickets",  pp:12, desc:"2 house mocktails each"},
    {id:"tickets", name:"2 drink tickets",     pp:16, desc:"Beer, wine or zero-proof"},
    {id:"bar",     name:"Open bar, 2 hrs",     pp:38, desc:"Beer, wine, house cocktails, zero-proof"}
  ],
  extras:[
    {id:"trophy", name:"Trophy & group photo", flat:40,  desc:"For the winning team"},
    {id:"trivia", name:"Custom company trivia", flat:250, desc:"A round written about your team"},
    {id:"logo",   name:"Logo on every screen",  flat:150, desc:"Your branding between rounds"},
    {id:"host",   name:"Dedicated host",        flat:200, desc:"Runs the tournament for you"},
    {id:"hour",   name:"Add an hour",           pp:15,   desc:"More rounds, same lounges"}
  ]
};
function initBuilder(){
  const root=$("#builder"); if(!root) return;
  const st={city:"seattle", date:"", time:"18:00", guests:20, pkg:"team", food:"pizza", drinks:"tickets", extras:new Set(["trophy"])};
  const d0=new Date(); d0.setDate(d0.getDate()+21); st.date=d0.toISOString().slice(0,10);
  $("#b-date").value=st.date; $("#b-date").min=new Date().toISOString().slice(0,10);
  const times=[]; for(let h=11;h<=21;h++) for(const m of ["00","30"]) if(!(h===21&&m==="30")) times.push(`${String(h).padStart(2,"0")}:${m}`);
  const fmtT=t=>{let [h,m]=t.split(":").map(Number);const ap=h>=12?"PM":"AM";h=h%12||12;return `${h}:${String(m).padStart(2,"0")} ${ap}`;};
  $("#b-time").innerHTML=times.map(t=>`<option value="${t}"${t===st.time?" selected":""}>${fmtT(t)}</option>`).join("");
  const dayOf=()=>new Date(st.date+"T12:00:00").getDay();            // 0 Sun … 6 Sat
  const hourOf=()=>parseInt(st.time,10)+(st.time.endsWith("30")?.5:0);
  const fmtD=()=>new Date(st.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});

  const opt=(group,type,o,{checked,disabled,price,inc})=>`<label class="opt"><input type="${type}" name="${group}" value="${o.id}"${checked?" checked":""}${disabled?" disabled":""}>
    <span class="on">${o.name}</span><span class="op">${price}</span><span class="od">${o.desc}</span>${inc?'<span class="inc">Included</span>':""}</label>`;
  const signed=n=>n===0?"Included":(n>0?"+":"−")+money(Math.abs(n)).replace(".00","");

  function breakAllowed(){const d=dayOf();return d>=1&&d<=5&&hourOf()+EVENT.pkgs.break.hrs<=17;}
  function render(){
    const P=EVENT.pkgs[st.pkg];
    if(st.pkg==="break"&&!breakAllowed()) st.pkg="team";
    $("#b-pkgs").innerHTML=Object.entries(EVENT.pkgs).map(([id,p])=>opt("pkg","radio",{id,name:p.name,desc:p.desc},{checked:st.pkg===id,disabled:id==="break"&&!breakAllowed(),price:`$${p.pp} / person`})).join("");
    const pk=EVENT.pkgs[st.pkg];
    const base=(list,id)=>list.find(x=>x.id===id).pp;
    $("#b-food").innerHTML=EVENT.food.map(f=>opt("food","radio",f,{checked:st.food===f.id,price:signed(f.pp-base(EVENT.food,pk.food))+(f.pp!==base(EVENT.food,pk.food)?" / person":""),inc:f.id===pk.food})).join("");
    $("#b-drinks").innerHTML=EVENT.drinks.map(f=>opt("drinks","radio",f,{checked:st.drinks===f.id,price:signed(f.pp-base(EVENT.drinks,pk.drinks))+(f.pp!==base(EVENT.drinks,pk.drinks)?" / person":""),inc:f.id===pk.drinks})).join("");
    $("#b-extras").innerHTML=EVENT.extras.map(x=>{const inc=pk.extras.includes(x.id);return opt("extras","checkbox",x,{checked:inc||st.extras.has(x.id),disabled:inc,inc,price:inc?"":(x.flat?`+$${x.flat}`:`+$${x.pp} / person`)});}).join("");
    bind(); total();
  }
  function calc(){
    const pk=EVENT.pkgs[st.pkg], g=st.guests, lines=[], notes=[];
    const billed=Math.max(g,pk.minGuests||0);
    lines.push([`${pk.name} · ${billed} × $${pk.pp}`, billed*pk.pp]);
    if(pk.minGuests&&g<pk.minGuests) notes.push(`Full House is a whole-venue buyout, billed at a minimum of ${pk.minGuests} guests.`);
    const fd=EVENT.food.find(f=>f.id===st.food), fb=EVENT.food.find(f=>f.id===pk.food);
    if(fd.id!==fb.id) lines.push([`${fd.name} instead of ${fb.name.toLowerCase()} · ${g} × ${signed(fd.pp-fb.pp)}`, g*(fd.pp-fb.pp)]);
    const dr=EVENT.drinks.find(f=>f.id===st.drinks), db=EVENT.drinks.find(f=>f.id===pk.drinks);
    if(dr.id!==db.id) lines.push([`${dr.name} instead of ${db.name.toLowerCase()} · ${g} × ${signed(dr.pp-db.pp)}`, g*(dr.pp-db.pp)]);
    EVENT.extras.forEach(x=>{if(st.extras.has(x.id)&&!pk.extras.includes(x.id)) lines.push([x.flat?x.name:`${x.name} · ${g} × $${x.pp}`, x.flat||g*x.pp]);});
    let sub=lines.reduce((a,[,v])=>a+v,0);
    const lounges=Math.ceil(g/EVENT.perLounge);
    if(lounges>EVENT.maxLounges) notes.push(`${g} guests needs ${lounges} lounges, and we have ${EVENT.maxLounges}. We'll rotate groups or plan a buyout with you.`);
    const d=dayOf();
    if((d===5||d===6)&&hourOf()>=17&&sub<EVENT.weekendNightMin){
      lines.push(["Friday/Saturday night minimum spend", EVENT.weekendNightMin-sub]); sub=EVENT.weekendNightMin;
      notes.push(`Friday and Saturday nights have a $${EVENT.weekendNightMin.toLocaleString()} minimum. Weeknights don't.`);
    }
    const tax=sub*EVENT.tax[st.city], grat=sub*EVENT.gratuity, tot=sub+tax+grat;
    return {pk,lounges:Math.min(lounges,EVENT.maxLounges),lines,notes,sub,tax,grat,tot,dep:tot*EVENT.depositPct};
  }
  function total(){
    const c=calc();
    $("#s-head").textContent=`${st.guests} guests · ${c.pk.name} · ${fmtD()} · ${fmtT(st.time)} · ${c.lounges} lounge${c.lounges>1?"s":""} · ${st.city==="seattle"?"Seattle":"Memphis"}`;
    $("#s-lines").innerHTML=c.lines.map(([l,v])=>`<div class="ln"><span>${l}</span><span>${v<0?"−":""}${money(Math.abs(v))}</span></div>`).join("")+
      `<div class="ln"><span>Tax ${(EVENT.tax[st.city]*100).toFixed(2)}%</span><span>${money(c.tax)}</span></div><div class="ln"><span>Gratuity ${EVENT.gratuity*100}%</span><span>${money(c.grat)}</span></div>`;
    $("#s-total").textContent=money(c.tot);
    $("#s-pp").textContent=`${money(c.tot/st.guests)} per guest, all in`;
    $("#s-dep").textContent=money(c.dep);
    $("#s-notes").innerHTML=c.notes.map(n=>`<div class="bnote">${n}</div>`).join("");
    $("#h-quote").value=JSON.stringify({city:st.city,date:st.date,time:st.time,guests:st.guests,pkg:st.pkg,food:st.food,drinks:st.drinks,extras:[...st.extras],total:+c.tot.toFixed(2)});
  }
  function bind(){
    $$("#b-pkgs input").forEach(i=>i.onchange=()=>{st.pkg=i.value;const p=EVENT.pkgs[st.pkg];st.food=p.food;st.drinks=p.drinks;st.extras=new Set(p.extras);render();});
    $$("#b-food input").forEach(i=>i.onchange=()=>{st.food=i.value;total();});
    $$("#b-drinks input").forEach(i=>i.onchange=()=>{st.drinks=i.value;total();});
    $$("#b-extras input").forEach(i=>i.onchange=()=>{i.checked?st.extras.add(i.value):st.extras.delete(i.value);total();});
  }
  const clampG=v=>Math.max(9,Math.min(80,Math.round(v)||9));
  $("#b-guests").oninput=e=>{st.guests=clampG(e.target.value);total();};
  $("#b-guests").onchange=e=>{e.target.value=st.guests;};
  $$(".stepper button").forEach(b=>b.onclick=()=>{st.guests=clampG(st.guests+Number(b.dataset.step));$("#b-guests").value=st.guests;total();});
  $("#b-city").onchange=e=>{st.city=e.target.value;total();};
  $("#b-date").onchange=e=>{if(e.target.value){st.date=e.target.value;render();}};
  $("#b-time").onchange=e=>{st.time=e.target.value;render();};
  $$("[data-pick-pkg]").forEach(a=>a.addEventListener("click",()=>{st.pkg=a.dataset.pickPkg;const p=EVENT.pkgs[st.pkg];st.food=p.food;st.drinks=p.drinks;st.extras=new Set(p.extras);render();}));

  /* Quote PDF: a printable quote in a new window (the browser's "Save as PDF") */
  $("#b-pdf").onclick=()=>{
    const c=calc(), no="GNL-Q-"+Date.now().toString(36).toUpperCase().slice(-6);
    const valid=new Date(); valid.setDate(valid.getDate()+14);
    const w=window.open("","_blank"); if(!w){alert("Allow pop-ups to download the quote.");return;}
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Quote ${no} · Game Nite Lounge</title>
      <style>body{font:14px/1.5 Arial,Helvetica,sans-serif;color:#141414;max-width:720px;margin:40px auto;padding:0 24px}
      h1{font:900 30px Arial;text-transform:uppercase;margin:0}.top{display:flex;justify-content:space-between;border-bottom:3px solid #141414;padding-bottom:14px;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;margin:18px 0}td{padding:9px 0;border-bottom:1px solid #ccc}td:last-child{text-align:right;font-family:monospace}
      .tot td{border-top:3px solid #141414;border-bottom:0;font-weight:900;font-size:18px}.muted{color:#555;font-size:12px}.box{border:2px solid #141414;padding:12px 14px;margin:14px 0}
      .draft{border:2px dashed #9a3412;color:#9a3412;padding:8px 12px;font-size:12px;margin-bottom:18px}</style></head><body>
      <div class="draft">DRAFT TEMPLATE: placeholder prices and terms, not a real offer.</div>
      <div class="top"><div><h1>Game Nite Lounge</h1><div class="muted">${st.city==="seattle"?"Seattle · Capitol Hill":"22 S. Cooper St, Memphis, TN 38104"}</div></div>
      <div style="text-align:right"><b>Event quote ${no}</b><br><span class="muted">Issued ${new Date().toLocaleDateString()} · valid until ${valid.toLocaleDateString()}</span></div></div>
      <div class="box"><b>${c.pk.name}</b> for <b>${st.guests} guests</b><br>${fmtD()} at ${fmtT(st.time)} · ${c.pk.hrs} hours · ${c.lounges} private lounge${c.lounges>1?"s":""}<br>
      Food: ${EVENT.food.find(f=>f.id===st.food).name} · Drinks: ${EVENT.drinks.find(f=>f.id===st.drinks).name}</div>
      <table>${c.lines.map(([l,v])=>`<tr><td>${l}</td><td>${v<0?"−":""}${money(Math.abs(v))}</td></tr>`).join("")}
      <tr><td>Subtotal</td><td>${money(c.sub)}</td></tr><tr><td>Sales tax ${(EVENT.tax[st.city]*100).toFixed(2)}%</td><td>${money(c.tax)}</td></tr>
      <tr><td>Gratuity ${EVENT.gratuity*100}%</td><td>${money(c.grat)}</td></tr><tr class="tot"><td>Estimated total</td><td>${money(c.tot)}</td></tr></table>
      <div class="box"><b>Deposit to confirm: ${money(c.dep)}</b> (${EVENT.depositPct*100}%). The balance is due after the event by card or invoice.<br>
      Final headcount is due 72 hours before the event. A W-9 and a certificate of insurance are available on request.</div>
      ${c.notes.map(n=>`<p class="muted">• ${n}</p>`).join("")}
      <p class="muted">Questions? Reply to your confirmation email or contact ${st.city==="seattle"?"seattle":"memphis"}@gamenitelounge.com.</p>
      </body></html>`);
    w.document.close();
    w.focus(); setTimeout(()=>w.print(),300);   // no inline script in the new window, so it works under a strict CSP
  };
  $("#b-hold-open").onclick=()=>{const f=$("#b-hold");f.hidden=false;f.scrollIntoView({behavior:"smooth",block:"center"});$("#h-name").focus({preventScroll:true});};
  $("#b-pay").onclick=e=>{
    // Live: send the planner to OTC's corporate request-to-book template (deposit taken there).
    if(CONFIG.OTC.corporate){const u=new URL(CONFIG.OTC.corporate);u.searchParams.set("guests",st.guests);u.searchParams.set("date",st.date);location.href=u.href;return;}
    e.preventDefault();$("#s-notes").insertAdjacentHTML("beforeend",`<div class="bnote">Online deposits will connect once the booking and payment platform is chosen. For now, hold the date and we'll send a payment link.</div>`);};
  $("#b-hold").addEventListener("gnl:sent",e=>{
    const q=JSON.parse(e.detail.eventQuote||"{}");
    const p=new URLSearchParams({co:e.detail.company||"",city:q.city,date:q.date,time:q.time,pkg:q.pkg,guests:q.guests});
    const url=new URL(`${ROOT}rsvp/index.html?${p}`,location.href).href;
    $("#rsvp-url").value=url; $("#rsvp-open").href=url;
    const box=$("#b-rsvp"); box.hidden=false; box.scrollIntoView({behavior:"smooth",block:"center"});
  });
  $("#rsvp-copy").onclick=async()=>{try{await navigator.clipboard.writeText($("#rsvp-url").value);$("#rsvp-copy").textContent="Copied";}catch{$("#rsvp-url").select();}};
  render();
}

/* RSVP page: shows the event from the link, collects attendance and dietary needs */
function initRSVP(){
  const card=$("#rsvpCard"); if(!card) return;
  const q=new URLSearchParams(location.search);
  const pk=EVENT.pkgs[q.get("pkg")]||EVENT.pkgs.team;
  const date=q.get("date")?new Date(q.get("date")+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}):"Date to be confirmed";
  const t=q.get("time")||"18:00"; let [h,m]=t.split(":").map(Number); const time=`${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
  const co=q.get("co")||"Your team";
  $("#rsvpCo").textContent=co;
  card.querySelector("dl").innerHTML=`<dt>When</dt><dd>${date} · ${time}</dd><dt>Where</dt><dd>${q.get("city")==="memphis"?"Game Nite Lounge, 22 S. Cooper St, Memphis":"Game Nite Lounge Seattle, Capitol Hill"}</dd><dt>What</dt><dd>${pk.name}, ${pk.hrs} hours of games, food and drinks</dd><dt>Group</dt><dd>${parseInt(q.get("guests"),10)||"?"} guests</dd>`;
  const f=$("#rsvpForm"); if(f){const h=document.createElement("input");h.type="hidden";h.name="event";h.value=location.search;f.append(h);}
}

/* ---------- OTC integration server (otc-poc/server.mjs) ----------
   When the site is served by the integration server, /api/* is available and the site switches
   from "draft" behavior to real holds, live availability and RSVP tracking. */
const API = { live:false, mode:null };
const apiReady = fetch("/api/health").then(r=>r.ok?r.json():null).then(j=>{ if(j?.ok){API.live=true;API.mode=j.mode;} return API; }).catch(()=>API);
async function apiPost(path, body){
  const r=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.error||"Request failed"); return j;
}
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function initLiveHold(){
  const form=$("#b-hold"); if(!form) return;
  apiReady.then(()=>{ if(!API.live) return;                  // static preview keeps the draft handler
    form.dataset.endpoint="";                                 // disable the draft handler
    form.addEventListener("submit", async e=>{
      e.preventDefault(); e.stopImmediatePropagation();
      const ok=$(".form-ok",form), btn=$("button[type=submit]",form);
      const q=JSON.parse($("#h-quote").value||"{}");
      btn.disabled=true; ok.classList.remove("show");
      try{
        const r=await apiPost("/api/events/hold",{...q, name:$("#h-name").value, email:$("#h-email").value, company:$("#h-co").value,
          needsPaperwork:form.needsPaperwork.checked, utm_source:new URLSearchParams(location.search).get("utm_source")||undefined});
        const exp=new Date(r.hold.expiresAt).toLocaleString("en-US",{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
        ok.innerHTML=`<b>Held: order ${esc(r.hold.orderNumber)}.</b> Your lounges are reserved in our booking system until ${esc(exp)}. Server-confirmed total: ${money(r.quote.total)} (deposit ${money(r.quote.deposit)}).`+
          (API.mode==="mock"?` <br><button type="button" class="btn" id="simPay" style="margin-top:10px;font-size:12px">Simulate deposit payment (mock OTC)</button>`:"");
        ok.classList.add("show");
        const url=new URL(r.rsvpPath,location.origin).href;
        $("#rsvp-url").value=url; $("#rsvp-open").href=url; $("#b-rsvp").hidden=false;
        $("#simPay")?.addEventListener("click",async ev=>{ev.target.disabled=true;await apiPost("/api/dev/simulate-payment",{holdId:r.hold.id});
          setTimeout(async()=>{const h=await fetch(`/api/holds/${r.hold.id}`).then(x=>x.json());ev.target.outerHTML=`<span class="bnote" style="display:inline-block">Status from webhook: ${esc(h.hold.status.toUpperCase())}</span>`;},900);});
      }catch(err){ ok.textContent=err.message; ok.classList.add("show"); }
      btn.disabled=false;
    },{capture:true});
  });
}

async function initLiveRSVP(){
  const card=$("#rsvpCard"); if(!card) return;
  const id=new URLSearchParams(location.search).get("h"); await apiReady;
  if(!id||!API.live) return;
  const r=await fetch(`/api/holds/${encodeURIComponent(id)}`); if(!r.ok){$("#rsvpCo").textContent="Event not found";return;}
  const {hold:h}=await r.json();
  const [y,mo,d]=h.date.split("-").map(Number); const dt=new Date(y,mo-1,d);
  let [hh,mm]=h.time.split(":").map(Number);
  $("#rsvpCo").textContent=h.company;
  card.querySelector("dl").innerHTML=`<dt>When</dt><dd>${esc(dt.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}))} · ${hh%12||12}:${String(mm).padStart(2,"0")} ${hh>=12?"PM":"AM"}</dd>
    <dt>Where</dt><dd>${h.city==="memphis"?"Game Nite Lounge, 22 S. Cooper St, Memphis":"Game Nite Lounge Seattle"}</dd><dt>What</dt><dd>${esc(h.pkgName)}, ${h.hrs} hours</dd>
    <dt>Status</dt><dd>${esc(h.status)} · ${h.rsvp.yes} of ${h.guests} confirmed</dd>`;
  const f=$("#rsvpForm"); f.dataset.endpoint="";
  f.addEventListener("submit",async e=>{
    e.preventDefault(); e.stopImmediatePropagation();
    const fd=new FormData(f), ok=$(".form-ok",f);
    try{const res=await apiPost("/api/rsvp",{holdId:id,name:fd.get("name"),email:fd.get("email"),attending:fd.get("attending"),diet:fd.getAll("diet"),allergies:fd.get("allergies"),drink:fd.get("drink"),accessibility:fd.get("accessibility")});
      ok.textContent=`Thanks, you're on the list. ${res.rsvp.yes} of ${h.guests} confirmed so far.`; f.reset();}
    catch(err){ok.textContent=err.message;}
    ok.classList.add("show");
  },{capture:true});
}

async function initAvailability(){
  const el=$("[data-availability]"); if(!el) return; await apiReady; if(!API.live) return;
  const city=el.dataset.availability, d=new Date(), date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const r=await fetch(`/api/availability?city=${city}&date=${date}`).then(x=>x.json()).catch(()=>null); if(!r?.times) return;
  const fmt=t=>{let [h,m]=t.split(":").map(Number);return `${h%12||12}${m?":"+String(m).padStart(2,"0"):""} ${h>=12?"PM":"AM"}`;};
  const nowMin=d.getHours()*60+d.getMinutes(), future=t=>{const [h,m]=t.time.split(":").map(Number);return h*60+m>nowMin+15;};
  el.hidden=false;
  el.innerHTML=`<span class="label">Open lounges today · live from booking system</span><div class="avail">${r.times.filter(t=>t.lounges>0&&future(t)).map(t=>`<a class="avail-chip" data-otc="memphis.sessions" href="#"><b>${fmt(t.time)}</b><span>${t.lounges} open</span></a>`).join("")||"<span>Fully booked today</span>"}</div>`;
  initOTC();
}

/* Off the Couch links: <a data-otc="memphis.sessions"> picks up the OTC URL, else the fallback */
function initOTC(){
  $$("[data-otc]").forEach(a=>{
    const key=a.dataset.otc, url=CONFIG.OTC[key]||CONFIG.OTC_FALLBACK[key];
    if(url){a.href=url; if(CONFIG.OTC[key]) a.dataset.otcLive="1";}
  });
}

/* Google reviews: real figures for Memphis, read from Google Maps on Nov 23, 2026. Update periodically. */
const REVIEWS = {
  rating:4.9, count:340, dist:{5:316,4:15,3:2,2:6,1:1}, asOf:"Nov 2026",
  url:"https://www.google.com/maps/place/Game+Nite+Lounge/@35.1358592,-89.9899811,17z",
  // Google's own "topics" for this place: phrases reviewers use, with review counts (read Nov 23, 2026).
  themes:[["Helpful staff",28],["Variety of games",4],["Immersive experience",3],["Unique space",3],["Chill spot",3],["Themed rooms",3],["Cozy room",2],["Mini games",2]]
};
function initReviews(){
  $$("[data-reviews]").forEach(el=>{
    const r=REVIEWS, max=Math.max(...Object.values(r.dist));
    el.className="reviews";
    // No star-by-star breakdown: the average already reflects every review; quotes are hand-picked and labeled as such.
    el.innerHTML=`<div class="score-big"><span class="label">Memphis on Google</span><b>${r.rating}</b><div class="stars" aria-hidden="true">★★★★★</div><span class="small" style="color:var(--ink)">${r.count} reviews · ${r.asOf}</span></div>
      <div class="quotes"><span class="label">In guests' words · most-used phrases on Google</span>
        <blockquote class="q big"><p>“${r.themes[0][0]}”</p><cite>Mentioned in ${r.themes[0][1]} reviews</cite></blockquote>
        <div class="phrases">${r.themes.slice(1,5).map(([t,n])=>`<blockquote class="q"><p>“${t}”</p><cite>${n} reviews</cite></blockquote>`).join("")}</div>
        <span class="tbd" title="Optional upgrade: pick 2–3 full Google reviews and ask the reviewers' permission (or use Google's Business Profile marketing kit), then show them here with first name + last initial.">full quotes optional</span></div>
      <div class="themes"><span class="label" style="margin-right:6px">Phrases and counts from Google's review summary, ${r.asOf}</span><a class="rating-pill" style="margin-left:auto" href="${r.url}">Read all ${r.count} on Google →</a></div>`;
  });
  $$("[data-rating-pill]").forEach(el=>{el.className="rating-pill";el.href=REVIEWS.url;el.innerHTML=`★ ${REVIEWS.rating} · ${REVIEWS.count} Google reviews`;});
}

/* "See it before you book": short muted loops cut from the real Memphis trailer (start second + length).
   Swap TRAILER/MOMENTS for purpose-shot clips later; the layout stays the same. */
const TRAILER="https://gamenitelounge.com/wp-content/uploads/2025/06/gnltrailer-1.mp4";
// Each tile freezes on a frame checked by eye (the trailer cuts fast, so playing on would drift off the caption).
const MOMENTS=[
  {t:47.9, cap:"The table is the game board", sub:"Tap your coaster to buzz in"},
  {t:63.0, cap:"Pick your coaster",          sub:"500+ game pieces on the wall"},
  {t:27.7, cap:"Your couch. Your show.",      sub:"Private lounges for 2–8"},
  {t:58.0, cap:"10 themed lounges",           sub:"This one has a fireplace"},
  {t:52.9, cap:"Just your crew",              sub:"Every lounge is private"},
  {t:22.7, cap:"Pizza's part of the game",    sub:"Delivered to your lounge"}
];
function initMoments(){
  const el=$("[data-moments]"); if(!el) return;
  el.innerHTML=MOMENTS.map((m,i)=>`<figure class="moment m${i}">
      <video muted playsinline preload="auto" data-src="${TRAILER}#t=${m.t}" aria-hidden="true" tabindex="-1"></video>
      <figcaption><b>${m.cap}</b><span>${m.sub}</span></figcaption></figure>`).join("");
  // load each frame only when it gets close to the screen
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ const v=e.target; v.src=v.dataset.src; io.unobserve(v);} }),{rootMargin:"400px"});
  $$("video",el).forEach(v=>io.observe(v));
}

/* Hero footage: muted loop with a sound toggle; paused for reduced-motion users */
function initTV(){
  const v=$(".tv video"); if(!v) return;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){v.removeAttribute("autoplay");v.pause();v.controls=true;}
  const b=$(".tv .sound");
  if(b) b.onclick=()=>{v.muted=!v.muted; if(!v.muted){v.currentTime=0;v.play();} b.textContent=v.muted?"Sound on":"Sound off"; b.setAttribute("aria-pressed",!v.muted);};
}

/* Photo slots: <figure class="ph"><img src="..." onerror></figure> marks itself empty when the file is missing */
function photos(){
  $$(".ph img").forEach(img=>{
    const mark=()=>img.closest(".ph").classList.add("empty");
    if(img.complete&&img.naturalWidth===0)mark(); else img.addEventListener("error",mark);
  });
}

// Missing game stills fall back to the color block (no inline onerror handlers, so a strict CSP is fine)
document.addEventListener("error",e=>{if(e.target.tagName==="IMG"&&e.target.closest(".gart"))e.target.remove();},true);
coinify(); chrome(); decor(); initGames(); initPricing(); initForms(); photos(); initReviews(); initTV(); initMoments(); initBuilder(); initRSVP(); initOTC(); initLiveHold(); initLiveRSVP(); initAvailability();
