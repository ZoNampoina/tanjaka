(() => {
  "use strict";

  const START = "2026-11-13";
  const END = "2026-12-31";
  const REVIEW = "2026-11-30";
  const dayMs = 86400000;
  const utcDate = date => new Date(date + "T12:00:00Z");
  const dateKey = date => date.toISOString().slice(0, 10);
  const offset = (date, days) => dateKey(new Date(+utcDate(date) + dayMs * days));
  const distance = (a, b) => Math.round((utcDate(b) - utcDate(a)) / dayMs);
  const localDateFormat = new Intl.DateTimeFormat("en-CA", {timeZone:"Indian/Antananarivo",year:"numeric",month:"2-digit",day:"2-digit"});
  const today = () => {
    const parts = Object.fromEntries(localDateFormat.formatToParts(new Date()).map(({type,value}) => [type,value]));
    return [parts.year,parts.month,parts.day].join("-");
  };
  const weekOf = date => offset(date, -((utcDate(date).getUTCDay() + 6) % 7));
  const dateText = (date, options = {}) => new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC", day: "numeric", month: "short", ...options
  }).format(utcDate(date));
  const weightText = value => new Intl.NumberFormat("fr-FR", {maximumFractionDigits: 2}).format(value);

  const schedule = {};
  for (let d = START; d <= END; d = offset(d, 1)) {
    const day = utcDate(d).getUTCDay();
    if (d === START) schedule[d] = "A";
    else if ([1, 3, 5].includes(day)) {
      const evenWeek = (distance("2026-11-16", weekOf(d)) / 7) % 2 === 0;
      schedule[d] = (day === 3) === evenWeek ? "B" : "A";
    }
  }
  const dates = Object.keys(schedule);
  const weeks = [];
  for (let d = weekOf(START); d <= END; d = offset(d, 7)) weeks.push(d);
  const nextDate = (from = today()) => dates.find(date => date >= from);
  const phaseFor = date => date <= "2026-11-22" ? 0 : date <= "2026-12-06" ? 1 : 2;
  const phases = [
    {name:"Prise en main", range:"13–22 nov.", detail:"Fais 2 séries par mouvement. Garde environ 2 répétitions en réserve et prends 60 à 90 secondes de repos, davantage si ta technique se dégrade."},
    {name:"Ajouter une série", range:"23 nov. – 6 déc.", detail:"Si tu récupères bien, passe à 3 séries sur les premières pompes et le tirage. Garde 2 séries pour les autres exercices."},
    {name:"Faire progresser la difficulté", range:"7–31 déc.", detail:"Quand tu atteins le haut de la fourchette sur toutes tes séries pendant deux séances avec la même variante, augmente légèrement la difficulté, puis repars du bas de la fourchette."}
  ];

  const pushVariants = ["Mur", "Table stable", "Au sol, genoux", "Au sol"];
  const row = id => ({
    id, name: "Tirage du sac à dos", min: 10, max: 15, side: "bras", primary: true,
    group: "Dos et biceps", variants: ["Sac léger", "Sac plus chargé", "Auto-résistance sans sac"],
    cue: "Prends appui d’une main. Garde le dos stable et tire le sac vers la hanche sans tourner le buste. Sans sac, freine le tirage du bras avec l’autre main."
  });
  const exercises = {
    A: [
      {id:"pomp", name:"Pompes inclinées ou au sol", min:6, max:12, primary:true, group:"Poitrine et triceps", variants:pushVariants, cue:"Garde le corps aligné et plie les coudes en contrôlant la descente. Commence contre un mur ou une table qui ne bouge pas."},
      row("tirage"),
      {id:"serre", name:"Pompes mains rapprochées", min:6, max:10, group:"Triceps et poitrine", variants:pushVariants, cue:"Rapproche les mains sans gêne aux poignets. Les coudes restent près du corps. Utilise un support plus haut si nécessaire."},
      {id:"squat", name:"Squats", min:10, max:15, group:"Cuisses et fessiers", variants:["Poids du corps","Assis-debout sur chaise"], cue:"Garde les talons au sol et laisse les genoux suivre la direction des orteils."},
      {id:"pont", name:"Pont fessier", min:12, max:15, group:"Fessiers", variants:["Deux pieds au sol"], cue:"Sur le dos, genoux pliés, pousse dans les talons. Lève les hanches sans cambrer le bas du dos."},
      {id:"planche", name:"Planche", min:20, max:30, seconds:true, group:"Gainage", variants:["Avant-bras et genoux","Avant-bras et pieds"], cue:"Aligne épaules et bassin. Respire pendant toute la durée de la série."}
    ],
    B: [
      {id:"lente", name:"Pompes lentes", min:6, max:10, primary:true, group:"Poitrine et triceps", variants:pushVariants, cue:"Descends en 3 secondes, puis remonte sans à-coup. Choisis l’inclinaison qui permet de garder le contrôle."},
      row("rowing"),
      {id:"curl", name:"Curl avec sac ou serviette", min:10, max:15, group:"Biceps", variants:["Sac léger","Sac plus chargé","Serviette sous le pied"], cue:"Garde les coudes près du corps. Avec une serviette sous le pied, oppose une résistance légère et continue pendant que tu tires."},
      {id:"fente", name:"Fentes arrière", min:8, max:12, side:"jambe", group:"Jambes et équilibre", variants:["Avec appui au mur","Sans appui"], cue:"Recule un pied, descends doucement et pousse sur le pied avant pour te relever."},
      {id:"deadbug", name:"Dead bug", min:8, max:12, side:"côté", group:"Gainage", variants:["Talons au sol","Bras et jambe opposés"], cue:"Sur le dos, tends le bras et la jambe opposés selon ton aisance. Garde le bas du dos stable."}
    ]
  };
  const sessionNames = {A:"Poitrine et triceps", B:"Poitrine et biceps"};
  const setCount = (exercise, date, extra) => exercise.primary && phaseFor(date) > 0 && extra ? 3 : 2;
  const dose = exercise => exercise.min + "–" + exercise.max + (exercise.seconds ? " s" : exercise.side ? " par " + exercise.side : " répétitions");

  const food = {
 pain:{n:'Pain (100 g)',c:265,p:9,cat:'energie'},mofogasy:{n:'Mofogasy (1 pièce)',c:130,p:2.5,cat:'energie'},riz:{n:'Riz cuit (150 g)',c:195,p:4,cat:'energie'},patate:{n:'Patate douce (200 g)',c:180,p:3,cat:'energie'},beurre:{n:'Beurre (10 g)',c:75,p:0.1,cat:'energie'},biscuit:{n:'Biscuits (30 g)',c:140,p:2,cat:'energie'},
 oeuf:{n:'Œuf (1)',c:75,p:6.3,cat:'proteine'},haricot:{n:'Tsaramaso cuit (180 g)',c:220,p:15,cat:'proteine'},voanjobory:{n:'Voanjobory cuit (150 g)',c:210,p:12,cat:'proteine'},lentille:{n:'Lentilles cuites (180 g)',c:210,p:16,cat:'proteine'},soja:{n:'Soja cuit (150 g)',c:240,p:23,cat:'proteine'},poisson:{n:'Poisson (100 g)',c:130,p:22,cat:'proteine'},sardine:{n:'Sardines (100 g)',c:200,p:24,cat:'proteine'},
 lait:{n:'Lait (250 ml)',c:150,p:8,cat:'laitage'},yaourt:{n:'Yaourt nature (125 g)',c:90,p:5,cat:'laitage'},fromage:{n:'Fromage (30 g)',c:110,p:7,cat:'laitage'},
 cacahuete:{n:'Voanjo / cacahuètes (30 g)',c:170,p:7,cat:'energie'},banane:{n:'Banane (1)',c:100,p:1,cat:'fruit'},papaye:{n:'Papaye (150 g)',c:60,p:0.7,cat:'fruit'},bredes:{n:'Brèdes/légumes (100 g)',c:30,p:2,cat:'legume'},cafe:{n:'Café sans sucre (1 tasse)',c:2,p:0,cat:'boisson'}
};
  const recipe = (id, name, items) => ({id, plan:id.at(-1), name, items});
  const meals = {
    matin: {name:"Petit-déjeuner", plans:[
      recipe("mA","Pain, deux œufs et lait",{pain:1,oeuf:2,lait:1}),
      recipe("mB","Mofogasy, lait et voanjo",{mofogasy:2,lait:1,cacahuete:1}),
      recipe("mC","Pain fromage et yaourt",{pain:1,fromage:1,yaourt:1})
    ]},
    midi: {name:"Déjeuner", plans:[
      recipe("dA","Riz, tsaramaso, œuf et brèdes",{riz:2,haricot:1,oeuf:1,bredes:1}),
      recipe("dB","Riz, sardines et légumes",{riz:2,sardine:1,bredes:1}),
      recipe("dC","Riz, voanjobory et deux œufs",{riz:2,voanjobory:1,oeuf:2})
    ]},
    gouter: {name:"Goûter", plans:[
      recipe("gA","Lait, banane et voanjo",{lait:1,banane:1,cacahuete:1}),
      recipe("gB","Pain fromage et yaourt",{pain:1,fromage:1,yaourt:1}),
      recipe("gC","Mofogasy et deux œufs",{mofogasy:2,oeuf:2})
    ]},
    soir: {name:"Dîner", plans:[
      recipe("sA","Riz, poisson et brèdes",{riz:2,poisson:1,bredes:1}),
      recipe("sB","Patate douce, œufs et voanjobory",{patate:1,oeuf:2,voanjobory:1}),
      recipe("sC","Riz, tsaramaso, œuf et légumes",{riz:2,haricot:1,oeuf:1,bredes:1})
    ]}
  };
  const mealKeys = Object.keys(meals);
  const findRecipe = (meal, id) => meals[meal]?.plans.find(plan => plan.id === id);
  const sums = items => Object.entries(items).reduce((total, [id, quantity]) => ({
    kcal: total.kcal + food[id].c * quantity,
    protein: total.protein + food[id].p * quantity
  }), {kcal:0,protein:0});
  const missing = (plan, stock) => Object.keys(plan.items).filter(id => !stock[id]);
  const cost = (plan, prices) => {
    let total = 0;
    for (const [id, quantity] of Object.entries(plan.items)) {
      if (!Number.isFinite(prices[id])) return null;
      total += prices[id] * quantity;
    }
    return total;
  };
  const sources = {
    weight:"https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/healthy-ways-to-gain-weight/",
    training:"https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/"
  };
  window.Tanjaka = {
    START, END, REVIEW, today, offset, distance, weekOf, dateText, weightText,
    schedule, dates, weeks, nextDate, phaseFor, phases, exercises, sessionNames, setCount, dose,
    food, meals, mealKeys, findRecipe, sums, missing, cost, sources
  };
})();


(() => {
  "use strict";

  const program = window.Tanjaka;
  const KEY = "tanjaka-2026-v1";
  const record = value => value && typeof value === "object" && !Array.isArray(value);
  const validDate = value => typeof value === "string" && /^\d{4}-\d\d-\d\d$/.test(value) &&
    !Number.isNaN(Date.parse(value + "T12:00:00Z")) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
  const number = (value, min, max) => {
    if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
  };
  const repValue = value => {
    const count = number(value, 0, 999);
    return Number.isInteger(count) ? count : null;
  };
  const map = value => record(value) ? value : {};
  const exerciseIds = new Set([...Object.values(program.exercises).flat().map(exercise => exercise.id), "pike"]);

  function normalize(raw) {
    const source = map(raw);
    const stock = {};
    const prices = {};
    for (const key of Object.keys(program.food)) {
      stock[key] = typeof source.stock?.[key] === "boolean" ? source.stock[key] : true;
      const price = number(source.prices?.[key], 0, 10000000);
      if (price !== null) prices[key] = price;
    }
    const recipes = {};
    for (const meal of program.mealKeys) {
      recipes[meal] = program.findRecipe(meal, source.recipes?.[meal])?.id ?? program.meals[meal].plans[0].id;
    }
    const weightByDate = new Map();
    for (const item of Array.isArray(source.weights) ? source.weights : []) {
      const value = number(item?.value, 25, 250);
      if (validDate(item?.date) && value !== null) weightByDate.set(item.date, {date:item.date,value});
    }
    const measures = [];
    for (const item of Array.isArray(source.measures) ? source.measures : []) {
      if (!validDate(item?.date)) continue;
      const result = {date:item.date};
      for (const key of ["arm", "chest", "waist"]) {
        const value = number(item[key], 1, 250);
        if (value !== null) result[key] = value;
      }
      if (Object.keys(result).length > 1) measures.push(result);
    }
    const mealsByDate = {};
    for (const [date, fields] of Object.entries(map(source.dayMeals))) {
      if (!validDate(date)) continue;
      const selected = {};
      for (const meal of program.mealKeys) {
        const plan = program.findRecipe(meal, fields?.[meal]);
        if (plan) selected[meal] = plan.id;
      }
      if (Object.keys(selected).length) mealsByDate[date] = selected;
    }
    const mealLogs = {};
    for (const [key, value] of Object.entries(map(source.mealLogs))) {
      const [date, meal] = [key.slice(0, 10), key.slice(11)];
      if (!validDate(date) || key[10] !== "-" || !program.mealKeys.includes(meal)) continue;
      const recipe = program.findRecipe(meal, value);
      if (value === true || recipe) mealLogs[key] = recipe?.id ?? true;
    }
    const workLogs = {};
    for (const [key, value] of Object.entries(map(source.workLogs))) {
      if (value === true && key[10] === "-" && validDate(key.slice(0, 10)) && exerciseIds.has(key.slice(11))) workLogs[key] = true;
    }
    const sessions = {};
    for (const [key, value] of Object.entries(map(source.sessions))) {
      const [date, kind] = key.split("|");
      if (key.length !== 12 || !validDate(date) || !["A", "B"].includes(kind) || !record(value)) continue;
      const exercises = {};
      for (const exercise of program.exercises[kind]) {
        const item = value.exercises?.[exercise.id];
        if (!record(item)) continue;
        const variant = exercise.variants.includes(item.variant) ? item.variant : exercise.variants[0];
        const rows = Array.isArray(item.rows) ? item.rows.slice(0, 3) : [];
        exercises[exercise.id] = {
          done: item.done === true,
          variant,
          rows: rows.map(row => ({a:repValue(row?.a),b:exercise.side ? repValue(row?.b) : null}))
        };
      }
      sessions[key] = {extra:value.extra === true, complete:value.complete === true, exercises};
    }
    return {
      version:2, weight:number(source.weight,25,250) ?? 65, target:number(source.target,30,200) ?? 75,
      height:number(source.height,100,230) ?? 168, stock, prices, recipes, dayMeals:mealsByDate, mealLogs,
      workLogs, sessions, weights:[...weightByDate.values()], measures,
      warmups:Object.fromEntries(Object.entries(map(source.warmups)).filter(([date,value]) => validDate(date) && value === true)),
      why:typeof source.why === "string" ? source.why.trim().slice(0,140) : "",
      appearance:["light","dark","system"].includes(source.appearance) ? source.appearance : "light"
    };
  }

  function load() {
    try { return normalize(JSON.parse(localStorage.getItem(KEY) ?? "null")); }
    catch { return normalize(null); }
  }
  function save(state) { localStorage.setItem(KEY, JSON.stringify(state)); }

  const workoutKey = (date, kind) => date + "|" + kind;
  const emptySession = () => ({extra:false,complete:false,exercises:{}});
  const emptyExercise = exercise => ({done:false,variant:exercise.variants[0],rows:[]});
  const workoutOf = (state, date, kind) => state.sessions[workoutKey(date, kind)] ?? emptySession();
  const exerciseOf = (state, date, kind, exercise) => {
    const recorded = workoutOf(state, date, kind).exercises[exercise.id];
    if (recorded) return recorded;
    const blank = emptyExercise(exercise);
    blank.done = !!state.workLogs[date + "-" + exercise.id];
    return blank;
  };

  function weeklyWeights(weights) {
    const byWeek = new Map();
    for (const weight of weights) {
      const week = program.weekOf(weight.date);
      const days = byWeek.get(week) ?? [];
      days.push(weight.value);
      byWeek.set(week, days);
    }
    return [...byWeek].sort(([a],[b]) => a.localeCompare(b)).map(([week,days]) => ({
      week, count:days.length, value:days.reduce((sum,value) => sum + value, 0) / days.length
    }));
  }
  const latestWeight = state => [...state.weights].sort((a,b) => a.date.localeCompare(b.date)).at(-1)?.value ?? state.weight;
  const doneCount = state => program.dates.filter(date => workoutOf(state, date, program.schedule[date]).complete).length;

  function planOf(state, date, meal) {
    const logged = program.findRecipe(meal, state.mealLogs[date + "-" + meal]);
    if (logged) return logged;
    const selected = program.findRecipe(meal, state.dayMeals[date]?.[meal]);
    if (selected) return selected;
    const fallback = program.findRecipe(meal, state.recipes[meal]) ?? program.meals[meal].plans[0];
    if (program.missing(fallback, state.stock).length === 0) return fallback;
    return program.meals[meal].plans.find(plan => program.missing(plan, state.stock).length === 0) ?? fallback;
  }
  function recommended(state, meal) {
    return program.meals[meal].plans.filter(plan => program.missing(plan, state.stock).length === 0)
      .map(plan => ({plan, cost:program.cost(plan,state.prices)}))
      .filter(item => item.cost !== null)
      .sort((a,b) => a.cost - b.cost)[0]?.plan;
  }

  function progression(state, date, kind, exercise, variant) {
    if (program.phaseFor(date) !== 2) return false;
    const past = Object.entries(state.sessions)
      .filter(([key,session]) => key < workoutKey(date, "") && key.endsWith("|" + kind) &&
        session.exercises[exercise.id]?.rows.some(row => row.a !== null || row.b !== null))
      .sort(([a],[b]) => b.localeCompare(a)).slice(0, 2);
    return past.length === 2 && past.every(([key,session]) => {
      const item = session.exercises[exercise.id];
      const sets = program.setCount(exercise, key.slice(0,10), session.extra);
      return item.variant === variant && Array.from({length:sets}, (_,index) => item.rows[index])
        .every(row => row && row.a >= exercise.max && (!exercise.side || row.b >= exercise.max));
    });
  }

  function mergeBackup(current, raw) {
    if (!record(raw) || ![1,2].includes(raw.version) || !Array.isArray(raw.weights) || !record(raw.recipes)) {
      throw new Error("Ce fichier n’est pas une sauvegarde Tanjaka.");
    }
    const backup = normalize(raw);
    const existing = new Set(current.weights.map(weight => weight.date));
    const measureKeys = new Set(current.measures.map(item => JSON.stringify(item)));
    const sessions = {...backup.sessions};
    for (const [key, value] of Object.entries(current.sessions)) {
      const old = sessions[key];
      sessions[key] = old ? {...value, exercises:{...old.exercises,...value.exercises}} : value;
    }
    const dayMeals = {...backup.dayMeals};
    for (const [date, plans] of Object.entries(current.dayMeals)) dayMeals[date] = {...dayMeals[date],...plans};
    return normalize({
      ...backup, dayMeals, sessions, prices:{...backup.prices,...current.prices},
      warmups:{...backup.warmups,...current.warmups},
      why:typeof raw.why === "string" ? backup.why : current.why,
      appearance:["light","dark","system"].includes(raw.appearance) ? backup.appearance : current.appearance,
      mealLogs:{...backup.mealLogs,...current.mealLogs}, workLogs:{...backup.workLogs,...current.workLogs},
      weights:[...backup.weights.filter(weight => !existing.has(weight.date)),...current.weights],
      measures:[...backup.measures.filter(item => !measureKeys.has(JSON.stringify(item))),...current.measures]
    });
  }

  window.TanjakaJournal = {
    validDate, number, repValue, load, save, workoutKey, emptySession, workoutOf, exerciseOf,
    weeklyWeights, latestWeight, doneCount, planOf, recommended, progression, mergeBackup
  };
})();


(function tanjakaApp(){
  "use strict";
  const P=window.Tanjaka,J=window.TanjakaJournal,BUILD="atelier-20261119";
  let state=J.load();
  const first=P.nextDate()??P.dates.at(-1);
  const ui={page:"home",workDate:first,kind:P.schedule[first]??"A",week:Math.max(0,P.weeks.indexOf(P.weekOf(first))),mealDate:P.today(),meal:"gouter",open:new Set(),timerDuration:90,timerLeft:90,timerEnd:0,timerInterval:0,timerMode:"rest",toast:0,guide:null,manual:false,frame:0,missing:new Set(),compare:""};
  const pages=[["home","Aujourd’hui","Accueil"],["work","S’entraîner","Séance"],["food","À table","Repas"],["track","Le carnet","Carnet"],["stock","Le placard","Placard"],["settings","Réglages","Réglages"]];
  const paths={
    home:"M3 10.5 12 3l9 7.5V21H3z M9 21v-7h6v7",
    work:"M6 7v10m12-10v10M3 9v6m18-6v6M6 12h12",
    food:"M5 3v7a3 3 0 0 0 6 0V3M8 3v18m11-18c-3.5 2.3-4 5.5-4 8h4m0-8v18",
    stock:"M4 5h16v15H4z M4 10h16m-10 5h4",
    track:"M4 4v16h16m-12-4 4-5 3 2 5-6",
    settings:"M4 7h16M4 17h16M8 4v6m8 4v6",
    play:"m9 5 11 7-11 7z",pause:"M8 5v14m8-14v14",check:"m5 12 4 4L19 6",close:"m6 6 12 12M18 6 6 18",plus:"M5 12h14M12 5v14"
  };
  const icon=id=>`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="${paths[id]??paths.check}"/></svg>`;
  const esc=value=>String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const byId=id=>document.getElementById(id);
  const content=byId("contenu");
  const weight=P.weightText;
  const date=(key,options={})=>P.dateText(key,options);
  const dayLong=key=>date(key,{weekday:"long",month:"long"});
  const dateFull=key=>date(key,{month:"long",year:"numeric"});
  const checked=value=>value?"checked":"";
  const disabled=value=>value?"disabled":"";
  const selectOption=(value,label,active)=>`<option value="${esc(value)}" ${active===value?"selected":""}>${esc(label)}</option>`;
  const btn=(label,action,value="",kind="")=>`<button class="btn ${kind}" type="button" data-do="${action}"${value?` data-value="${esc(value)}"`:""}>${label}</button>`;
  const navButton=([id,name,short],mobile)=>`<button class="nav-button" type="button" data-page="${id}" ${ui.page===id?'aria-current="page"':""}>${mobile?icon(id):""}<span>${mobile?short:name}</span></button>`;
  const headers=(title,description,kicker="Le quotidien, en plus fort")=>`<header class="page-header"><p class="overline">${kicker}</p><h1>${title}</h1><p>${description}</p></header>`;
  const tag=(text,type="")=>`<span class="tag ${type}">${text}</span>`;
  const foodImages={pain:"bread",fromage:"cheese",yaourt:"yogurt",lait:"milk",banane:"banana",oeuf:"eggs",riz:"rice",haricot:"beans"};
  const shortFood=id=>({pain:"Pain",fromage:"Fromage",yaourt:"Yaourt",lait:"Lait",banane:"Banane",oeuf:"Œufs",riz:"Riz",haricot:"Tsaramaso",cacahuete:"Voanjo",mofogasy:"Mofogasy",bredes:"Brèdes",voanjobory:"Voanjobory"}[id]??P.food[id].n.split(" (")[0]);
  function mealArt(plan,cls=""){
    const ids=Object.keys(plan.items).filter(id=>foodImages[id]).slice(0,3);
    return `<div class="meal-art ${cls}" aria-label="Illustrations des ingrédients">${ids.map(id=>`<img src="./assets/${foodImages[id]}.webp" alt="${esc(shortFood(id))}" width="512" height="512" loading="lazy">`).join("")}</div>`;
  }
  function currentMeal(){return J.planOf(state,ui.mealDate,ui.meal);}
  function strengthGroups(){
    const groups=new Map();
    for(const [key,session]of Object.entries(state.sessions).sort(([a],[b])=>a.localeCompare(b))){
      const [day,kind]=key.split("|");
      if(day>P.today())continue;
      for(const ex of P.exercises[kind]){
        const item=session.exercises[ex.id],row=item?.rows[0];
        if(!item||(!session.complete&&!item.done)||!row||!(row.a>0)||(ex.side&&!(row.b>0)))continue;
        const id=ex.id+"|"+item.variant;
        const group=groups.get(id)??{id,exercise:ex,variant:item.variant,points:[]};
        group.points.push({day,a:row.a,b:row.b});
        groups.set(id,group);
      }
    }
    return [...groups.values()].sort((a,b)=>b.points.at(-1).day.localeCompare(a.points.at(-1).day));
  }
  const rowText=(point,exercise)=>exercise.side?`G ${point.a} · D ${point.b}`:`${point.a}${exercise.seconds?" s":" rép."}`;
  function strengthTeaser(){
    const groups=strengthGroups(),group=groups.find(g=>g.points.length>=2)??groups[0];
    if(!group)return `<p class="overline">Ton carnet prend vie</p><h2>CHAQUE SÉRIE<br>LAISSE UNE TRACE.</h2><p>Note tes répétitions pendant la séance. Tu retrouveras ici ton premier repère, puis ce qui change.</p>${btn("Ouvrir mon carnet","open-track","","text-button")}`;
    const points=group.points.slice(-2),ex=group.exercise;
    return `<p class="overline">Dans les mouvements</p><h2>${points.length===2?"ÇA SE CONSTRUIT.":"UN PREMIER REPÈRE."}</h2><p class="performance-name">${esc(ex.name)}<span>${esc(group.variant)} · première série</span></p><div class="performance">${points.map((p,i)=>`${i?'<span class="performance-divider">/</span>':""}<div class="${i===points.length-1?"performance-current":""}"><strong>${ex.side?`G ${p.a}<small>D ${p.b}</small>`:p.a}</strong><span>${date(p.day)}${ex.side?"":ex.seconds?" · secondes":" · répétitions"}</span></div>`).join("")}</div>${btn("Retrouver mes séances","open-track","","text-button")}`;
  }
  function home(){
    const now=P.today(),next=P.nextDate(),isToday=next===now;
    const session=isToday?J.workoutOf(state,now,P.schedule[now]):null;
    const done=!!session?.complete;
    const interrupted=Object.entries(state.sessions).filter(([key,s])=>key.slice(0,10)<=now&&!s.complete&&Object.values(s.exercises).some(ex=>ex.done||ex.rows.some(row=>row.a!==null||row.b!==null))).sort(([a],[b])=>b.localeCompare(a))[0];
    const count=J.doneCount(state);
    const snack=J.planOf(state,now,"gouter");
    const headline=done?"BIEN<br>JOUÉ.":isToday?"À TOI<br>DE JOUER.":next?"ÇA SE<br>CONSTRUIT.":"ET ÇA<br>CONTINUE.";
    const line=done?"Ta séance est dans le carnet. Laisse maintenant à ton corps le temps de récupérer.":isToday?`Séance ${P.schedule[now]}. ${P.sessionNames[P.schedule[now]]}. Tu connais ton prochain pas.`:next?`Aujourd’hui, tu récupères. Prochain rendez-vous ${dayLong(next)} pour la séance ${P.schedule[next]}.`:"Ton cycle est terminé. Retrouve ce que tu as construit dans ton carnet.";
    const cta=ui.guide&&ui.workDate<=now&&!J.workoutOf(state,ui.workDate,ui.kind).complete?btn("Reprendre ma séance","continue-guide"):done?btn("Voir ma séance","open-next","","secondary"):isToday?btn("Lancer ma séance","start-today"):next?btn("Préparer ma prochaine séance","open-next"):btn("Ouvrir mon carnet","open-track");
    return `<div class="dateline"><span>${dayLong(now)}</span><span>À LA MAISON. POUR DE VRAI.</span></div>
      <section class="training-cover">
        <div class="cover-copy"><p class="overline">${done?"Séance faite":isToday?"C’est un jour de séance":next?"La récupération fait partie du programme":"Le carnet reste ouvert"}</p><h1>${headline}</h1><p class="cover-description">${line}</p><div class="cover-actions">${cta}${isToday&&!done?btn("Je commence par 5 minutes","easy-today","","text-button"):""}</div></div>
        <div class="cover-photo"><img src="./assets/pushup0.jpg" alt="Un athlète réalise une pompe au sol" width="850" height="567" fetchpriority="high"><span class="photo-stamp">LA FORCE<br>SE TRAVAILLE.</span><span class="photo-caption">Un mouvement après l’autre.</span></div>
      </section>
      ${interrupted?`<div class="resume-strip"><div><strong>Une séance t’attend.</strong><span>${dateFull(interrupted[0].slice(0,10))} · séance ${interrupted[0].slice(-1)} · tes séries sont gardées.</span></div>${btn("Reprendre où j’en étais","resume",interrupted[0],"secondary")}</div>`:""}
      ${state.warmups[now]?`<p class="warmup-record">${icon("check")} Échauffement fait aujourd’hui · noté séparément de la séance.</p>`:""}
      ${state.why?`<div class="personal-line"><span>Ce qui me met en mouvement</span><p>« ${esc(state.why)} »</p></div>`:""}
      <div class="home-editorial">
        <section class="snack-feature"><div class="section-label"><span>À table</span><span>${state.mealLogs[now+"-gouter"]?"Goûter noté":"Le complément du jour"}</span></div><div class="snack-body"><div><h2>LE GOÛT<br>D’AVANCER.</h2><p>${esc(snack.name)}.</p>${btn("Préparer mon goûter","snack","","secondary")}</div>${mealArt(snack)}</div></section>
        <section class="strength-feature">${strengthTeaser()}</section>
      </div>
      <section class="journal-line"><div><strong>${count}</strong><span>séance${count>1?"s":""} terminée${count>1?"s":""}<br>sur les ${P.dates.length} du cycle</span></div><div><span>${state.weights.length?"Dernière pesée":"Poids de départ"}</span><strong>${weight(J.latestWeight(state))}<small> kg</small></strong></div>${btn("Noter une pesée","weigh","","text-button")}</section>`;
  }
  function calendar(){
    const start=P.weeks[ui.week],days=Array.from({length:7},(_,i)=>P.offset(start,i));
    return `<section class="calendar"><div class="card-heading"><h2>Le rythme de la semaine</h2><span class="small muted">Lundi · mercredi · vendredi</span></div><div class="week-heading">${btn("‹","week","-1","secondary round"+(ui.week===0?" is-disabled":""))}<strong>${date(start)} – ${date(days[6])}</strong>${btn("›","week","1","secondary round"+(ui.week===P.weeks.length-1?" is-disabled":""))}</div><div class="week-grid">${days.map(key=>{
      const kind=P.schedule[key],stamp=key===P.today()?'aria-current="date"':"",inside=key>=P.START&&key<=P.END;
      const label=`<span>${date(key,{weekday:"short",day:undefined,month:undefined}).replace(".","")}</span><strong>${Number(key.slice(-2))}</strong>`;
      if(!kind)return `<div class="day" ${stamp}>${label}<span>${inside?"Récup.":"—"}</span></div>`;
      const complete=J.workoutOf(state,key,kind).complete;
      return `<button class="day ${complete?"day-done":""}" type="button" data-do="pick-date" data-value="${key}" aria-pressed="${key===ui.workDate}" ${stamp} aria-label="${dayLong(key)}, séance ${kind}${complete?", terminée":""}">${label}<span>${complete?"✓ ": ""}${kind}</span></button>`;
    }).join("")}</div></section>`;
  }
  function timerText(){return String(Math.floor(ui.timerLeft/60)).padStart(2,"0")+":"+String(ui.timerLeft%60).padStart(2,"0");}
  function timerPanel(large=false){
    return `<div class="timer-panel ${large?"timer-large":""}"><div><span class="label">${ui.timerMode==="warmup"?"Échauffement · 5 minutes":"Repos entre les séries"}</span><span id="timer-value" class="timer-value" role="timer">${timerText()}</span></div><div class="row">${btn(ui.timerEnd?"Pause":ui.timerLeft?"Démarrer":"Relancer","timer-toggle","","secondary")}<span id="timer-status" class="small muted">${ui.timerEnd?"Le chrono tourne.":ui.timerLeft?"À ton rythme.":"Temps écoulé."}</span></div>${!large?`<div class="row">${[60,90,120].map(s=>btn(s+" s","timer-set",String(s),"text-button")).join("")}</div>`:""}</div>`;
  }
  function repField(ex,index,side,value,future){
    const label=ex.seconds?"Secondes":ex.side?(side==="a"?"Gauche":"Droite"):"Répétitions";
    return `<label><span class="label">${label}</span><input class="field rep-field" type="number" inputmode="numeric" min="0" max="999" step="1" id="rep-${ex.id}-${index}-${side}" aria-label="${esc(ex.name)}, série ${index+1}, ${label}" data-input="rep" data-id="${ex.id}" data-set="${index}" data-side="${side}" value="${value??""}" placeholder="—" ${disabled(future)}></label>`;
  }
  function exerciseCount(){return P.exercises[ui.kind].filter(ex=>J.exerciseOf(state,ui.workDate,ui.kind,ex).done).length;}
  function canFinish(){return exerciseCount()===P.exercises[ui.kind].length;}
  function exerciseCard(ex,session,future){
    const item=J.exerciseOf(state,ui.workDate,ui.kind,ex),sets=P.setCount(ex,ui.workDate,session.extra);
    return `<article class="exercise"><div class="exercise-head"><label class="checkbox"><input type="checkbox" data-input="exercise" data-id="${ex.id}" aria-label="Exercice terminé, ${esc(ex.name)}" ${checked(item.done)} ${disabled(future)}><strong>${ex.name}</strong></label>${tag(sets+" séries","neutral")}</div><p class="small"><strong class="accent">${P.dose(ex)}</strong> · ${ex.group}</p><p class="small">${ex.cue}</p><details class="exercise-log" data-exercise="${ex.id}" ${ui.open.has(ex.id)?"open":""}><summary>Noter les séries et la variante</summary><div class="log-fields"><label><span class="label">Variante</span><select class="field" data-input="variant" data-id="${ex.id}" ${disabled(future)}>${ex.variants.map(v=>selectOption(v,v,item.variant)).join("")}</select></label>${Array.from({length:sets},(_,i)=>`<div class="set-row"><strong>Série ${i+1}</strong>${repField(ex,i,"a",item.rows[i]?.a,future)}${ex.side?repField(ex,i,"b",item.rows[i]?.b,future):""}</div>`).join("")}${J.progression(state,ui.workDate,ui.kind,ex,item.variant)?'<p class="accent small spaced">Le haut de la fourchette est atteint deux fois avec cette variante. Tu peux augmenter légèrement la difficulté si tu récupères bien.</p>':""}</div></details></article>`;
  }
  function workout(){
    if(ui.guide)return guideView();
    const session=J.workoutOf(state,ui.workDate,ui.kind),future=ui.workDate>P.today(),phase=P.phaseFor(ui.workDate),info=P.phases[phase];
    const exs=P.exercises[ui.kind];
    return `${headers("TON RENDEZ-VOUS<br>AVEC L’EFFORT.","Un peu de place. Un sac à dos. Ton programme est prêt.","S’entraîner · sans haltères")}<div class="work-layout"><div class="work-main"><section class="session-poster"><div class="session-poster-top"><p class="overline">${dayLong(ui.workDate)}</p><label><span class="label">Date de la séance</span><input class="field date-control" type="date" data-input="work-date" value="${ui.workDate}" max="${P.END>P.today()?P.END:P.today()}"></label></div><div class="session-poster-title"><strong class="session-letter">${ui.kind}</strong><div><h2>${P.sessionNames[ui.kind]}</h2><p>${exs.length} mouvements · ${phase===0?"2 séries par mouvement":"Séries selon ta phase"}</p><p id="checked-count" class="small">${exerciseCount()} sur ${exs.length} exercices cochés</p></div></div><div class="segment">${["A","B"].map(k=>`<button type="button" data-do="kind" data-value="${k}" aria-pressed="${ui.kind===k}">Séance ${k}</button>`).join("")}</div><p class="session-phase"><strong>${info.name}.</strong> ${info.detail}</p>${phase>0?`<label class="checkbox spaced"><input type="checkbox" data-input="extra" ${checked(session.extra)} ${disabled(future)}> Ajouter une 3ᵉ série aux premières pompes et au tirage</label>`:""}${future?'<p class="note spaced">Cette séance est à venir. Tu peux la préparer ; la saisie s’ouvre à la date choisie.</p>':`<div class="row spaced">${btn(session.complete?"Revoir les mouvements":"Suivre la séance","guide-start","","secondary")}${!session.complete?btn("Commencer par l’échauffement","guide-easy","","text-button"):""}</div>`}</section><section class="movement-menu"><div class="card-heading"><h2>Les mouvements</h2>${btn(ui.manual?"Fermer le carnet de saisie":"Vue carnet · saisie libre","manual","","text-button")}</div>${ui.manual?`<div class="spaced">${timerPanel()}</div><div class="exercise-list">${exs.map(ex=>exerciseCard(ex,session,future)).join("")}</div><div class="row between spaced"><span class="small muted">${session.complete?"Séance enregistrée dans ton carnet.":"Coche les mouvements terminés pour valider la séance."}</span><button class="btn" type="button" id="finish-session" data-do="finish" ${disabled(future||(!session.complete&&!canFinish()))}>${session.complete?"Rouvrir la séance":"Terminer la séance"}</button></div>`:`<ol class="movement-list">${exs.map(ex=>`<li><div><strong>${ex.name}</strong><span>${ex.group}</span></div><span>${P.setCount(ex,ui.workDate,session.extra)} × ${P.dose(ex)}</span></li>`).join("")}</ol>`}</section></div><aside class="work-aside">${calendar()}<details class="programme-details"><summary>Les étapes de ton cycle</summary><ul class="list">${P.phases.map(p=>`<li><strong>${p.range} · ${p.name}</strong><p class="small">${p.detail}</p></li>`).join("")}</ul><p class="small spaced">Arrête un mouvement qui déclenche une douleur vive. <a href="${P.sources.training}" target="_blank" rel="noopener noreferrer">Recommandations ACSM</a></p></details></aside></div>`;
  }
  function guideView(){
    const g=ui.guide,session=J.workoutOf(state,ui.workDate,ui.kind);
    const exit=btn("Garder ma place et revenir","guide-exit","","text-button");
    const stamp=`<div class="guide-dateline"><span>Séance ${ui.kind} · ${dateFull(ui.workDate)}</span><div class="row">${btn("Le programme","guide-close","","text-button")}${exit}</div></div>`;
    if(g.stage==="warmup")return `${stamp}<div class="guide-warmup">${headers(g.easy?"JUSTE<br>LE PREMIER PAS.":"ON SE MET<br>EN MOUVEMENT.",g.easy?"Cinq minutes d’échauffement. Ensuite, tu décides de poursuivre ou de t’arrêter.":"Marche sur place, mobilise tes épaules et fais quelques squats faciles.","L’échauffement")}${timerPanel(true)}<div class="row spaced">${btn("Échauffement terminé","warmup-done")}</div></div>`;
    if(g.stage==="checkpoint")return `${stamp}<div class="guide-checkpoint"><span class="completion-mark">${icon("check")}</span>${headers("TU AS DÉMARRÉ.<br>TU CONTINUES ?","Ton échauffement est noté. La séance complète reste une étape à part.","Le premier pas est fait")}<div class="row">${btn("Continuer la séance","guide-begin")}${btn("M’arrêter ici pour aujourd’hui","warmup-stop","","secondary")}</div></div>`;
    if(g.stage==="summary"){
      const count=exerciseCount(),done=session.complete;
      return `${stamp}<div class="guide-checkpoint"><span class="completion-mark">${icon("check")}</span>${headers(done?"DANS<br>LE CARNET.":"TU L’AS<br>TRAVAILLÉ.",done?"Ta séance est enregistrée. Retrouve tes séries et tes variantes dans le carnet.":`${count} mouvements sur ${P.exercises[ui.kind].length} sont terminés. Tu peux maintenant valider ta séance.`,"La séance touche à sa fin")}<div class="row">${!done?btn("Terminer et enregistrer","finish"):""}${btn("Voir mon goûter","snack","",done?"":"secondary")}${btn("Ouvrir mon carnet","open-track","","text-button")}</div></div>`;
    }
    const ex=P.exercises[ui.kind][g.index],item=J.exerciseOf(state,ui.workDate,ui.kind,ex),sets=P.setCount(ex,ui.workDate,session.extra);
    if(g.stage==="rest"){
      const next=g.set+1<sets?`Série ${g.set+2} · ${ex.name}`:P.exercises[ui.kind][g.index+1]?.name??"Le bilan de ta séance";
      return `${stamp}<div class="guide-rest">${headers("SOUFFLE.<br>LA SUITE EST PRÊTE.",`${next}.`,"Série notée")}${timerPanel(true)}<div class="row spaced">${btn("Continuer quand je suis prêt","guide-next")}</div></div>`;
    }
    const previous=Object.entries(state.sessions).filter(([key,s])=>key.slice(0,10)<ui.workDate&&key.endsWith("|"+ui.kind)&&s.exercises[ex.id]?.variant===item.variant&&s.exercises[ex.id]?.rows[g.set]?.a!==null&&s.exercises[ex.id]?.rows[g.set]?.a!==undefined).sort(([a],[b])=>b.localeCompare(a))[0];
    const old=previous?.[1].exercises[ex.id].rows[g.set];
    const floor=["pomp","lente"].includes(ex.id)&&item.variant==="Au sol";
    return `${stamp}<div class="guide-heading"><p class="overline">Mouvement ${g.index+1} sur ${P.exercises[ui.kind].length} · ${ex.group}</p><h1>${ex.name}</h1></div><div class="guide-exercise"><div>${floor?`<figure class="motion-photo"><img src="./assets/pushup${ui.frame}.jpg" alt="Pompe au sol, position ${ui.frame?"basse":"haute"}" width="850" height="567"><figcaption><span>Position ${ui.frame?"basse":"haute"}${ex.id==="lente"?" · descente en 3 secondes":""}</span>${btn("Voir l’autre position","frame","","text-button")}</figcaption></figure>`:`<div class="movement-type"><span>${ex.group}</span><strong>${esc(item.variant)}</strong><p>${ex.cue}</p></div>`}<p class="movement-cue">${ex.cue}</p></div><section class="guide-entry"><p class="overline">Série ${g.set+1} sur ${sets}</p><h2>${P.dose(ex)}</h2><label class="spaced"><span class="label">Ma variante</span><select class="field" data-input="variant" data-id="${ex.id}">${ex.variants.map(v=>selectOption(v,v,item.variant)).join("")}</select></label><p class="last-set">${old?`Le ${date(previous[0].slice(0,10))}, même variante : <strong>${rowText(old,ex)}</strong>.`:"Ton premier repère pour cette série et cette variante."}</p><div class="guided-fields">${repField(ex,g.set,"a",item.rows[g.set]?.a,false)}${ex.side?repField(ex,g.set,"b",item.rows[g.set]?.b,false):""}</div><p id="guide-error" class="form-error" role="alert" hidden></p>${btn("Valider ma série","guide-save","","full")}<p class="small spaced">Note ce que tu viens de faire. Ta saisie est enregistrée au fil de l’eau.</p></section></div>`;
  }
  const priceText=value=>Math.round(value).toLocaleString("fr-FR")+" Ar";
  function alternatives(id){
    const cats={laitage:["laitage","proteine"],proteine:["proteine"],energie:["energie"],fruit:["fruit"],legume:["legume"],boisson:["laitage"]};
    return Object.entries(P.food).filter(([key,f])=>key!==id&&state.stock[key]&&cats[P.food[id].cat]?.includes(f.cat)).sort(([,a],[,b])=>Math.abs(a.p-P.food[id].p)-Math.abs(b.p-P.food[id].p)).slice(0,2).map(([,f])=>f.n);
  }
  const preparations={
    mA:"Prépare les œufs à ton goût, puis sers-les avec le pain et le lait.",
    mB:"Accompagne les mofogasy d’un verre de lait et de voanjo.",
    mC:"Garnis le pain de fromage et prends le yaourt à côté.",
    dA:"Sers le riz avec les tsaramaso cuits, l’œuf et les brèdes.",
    dB:"Ajoute les sardines et les légumes au riz.",
    dC:"Accompagne le riz de voanjobory cuits et de deux œufs.",
    gA:"Sers le lait avec la banane et les voanjo. Tu peux les prendre séparément.",
    gB:"Garnis le pain de fromage. Garde le yaourt à côté.",
    gC:"Prépare deux œufs et accompagne-les de mofogasy.",
    sA:"Prépare le poisson et sers-le avec le riz et les brèdes.",
    sB:"Sers la patate douce avec les œufs et les voanjobory cuits.",
    sC:"Accompagne le riz de tsaramaso, d’un œuf et de légumes."
  };
  function foodView(){
    const meal=P.meals[ui.meal],plan=currentMeal(),logged=!!state.mealLogs[ui.mealDate+"-"+ui.meal],absent=P.missing(plan,state.stock),nutrients=P.sums(plan.items),price=P.cost(plan,state.prices),best=J.recommended(state,ui.meal);
    const total=P.mealKeys.map(k=>P.sums(J.planOf(state,ui.mealDate,k).items)).reduce((a,n)=>({kcal:a.kcal+n.kcal,protein:a.protein+n.protein}),{kcal:0,protein:0});
    const none=meal.plans.every(p=>P.missing(p,state.stock).length);
    return `${headers("LE GOÛT<br>D’AVANCER.","Des aliments que tu connais. Trois façons de composer ton repas.","À table · à ta façon")}<div class="meal-toolbar"><div class="segment">${P.mealKeys.map(k=>`<button type="button" data-do="meal" data-value="${k}" aria-pressed="${ui.meal===k}">${P.meals[k].name}${state.mealLogs[ui.mealDate+"-"+k]?" ✓":""}</button>`).join("")}</div><label><span class="label">Date des repas</span><input class="field date-control" type="date" value="${ui.mealDate}" max="${P.today()}" data-input="meal-date"></label></div>
    ${logged?`<p class="meal-recorded">${icon("check")} ${meal.name} noté pour le ${date(ui.mealDate)}.</p>`:""}
    <section class="meal-cover"><div class="meal-cover-art">${mealArt(plan)}<span class="ingredient-caption">Illustrations des ingrédients</span></div><div class="meal-cover-copy"><p class="overline">${meal.name} · plan ${plan.plan}</p><h2>${plan.name}</h2><ul class="portion-list">${Object.entries(plan.items).map(([id,q])=>`<li class="${state.stock[id]?"":"absent"}">${q} × ${esc(P.food[id].n)}</li>`).join("")}</ul><p class="meal-preparation">${preparations[plan.id]}</p>${price!==null?`<p class="meal-price">${priceText(price)}${plan.id===best?.id?" · le moins cher de tes plans disponibles":""}</p>`:""}<label class="checkbox meal-check"><input type="checkbox" data-input="meal-log" ${checked(logged)}> J’ai pris ce repas</label></div></section>
    <section class="ingredient-swap"><div><h2>Il te manque quelque chose ?</h2><p class="small">Touche l’ingrédient absent. Tanjaka cherche un autre plan complet.</p></div><div class="ingredient-chips">${Object.keys(plan.items).map(id=>`<button type="button" class="ingredient-chip ${state.stock[id]?"":"is-missing"}" data-do="food-missing" data-value="${id}" aria-pressed="${!state.stock[id]}">${state.stock[id]?icon("close"):icon("plus")}${esc(shortFood(id))}</button>`).join("")}</div>${[...ui.missing].filter(id=>!state.stock[id]&&!Object.hasOwn(plan.items,id)).map(id=>btn("Rétablir "+shortFood(id),"food-restore",id,"text-button")).join("")}${none?'<p class="note">Il manque un ingrédient dans chacun des trois plans. Regarde les substitutions ci-dessous ou actualise ton placard.</p>':absent.length?`<p class="small absent">À trouver : ${absent.map(shortFood).join(", ")}.</p>`:""}</section>
    <section class="meal-choices"><div class="card-heading"><h2>Trois possibilités, le même repas.</h2>${btn("Mon placard et mes prix","open-stock","","text-button")}</div>${meal.plans.map(option=>{
      const missing=P.missing(option,state.stock),active=plan.id===option.id;
      return `<article class="meal-choice ${active?"selected":""}"><span class="plan-letter">${option.plan}</span><div><h3>${option.name}</h3><p>${missing.length?missing.map(shortFood).join(", ")+" à trouver":"Tout est dans le placard"}${P.cost(option,state.prices)!==null?" · "+priceText(P.cost(option,state.prices)):""}</p>${missing.length?`<p class="small">${missing.map(id=>{const alt=alternatives(id);return alt.length?`${esc(shortFood(id))} : ${alt.map(esc).join(" ou ")} possibles`:"";}).filter(Boolean).join(" · ")}</p>`:""}</div><button class="btn ${active?"secondary":""}" type="button" data-do="meal-plan" data-value="${option.id}" aria-pressed="${active}">${active?"Retenu":"Choisir"}</button></article>`;
    }).join("")}</section>
    <details class="nutrition-details"><summary>Les repères nutritionnels</summary><p>Ce plan : environ ${Math.round(nutrients.kcal)} kcal et ${Math.round(nutrients.protein)} g de protéines. Total prévu pour la journée : ${Math.round(total.kcal)} kcal et ${Math.round(total.protein)} g de protéines. Les valeurs varient avec les portions et les recettes.</p><p>Commence par un goûter en plus chaque jour. Si tu prends déjà un goûter, enrichis-le ou augmente un peu ta portion au déjeuner.</p><p>Si tu n’as que du pain beurre, des biscuits ou du café à l’épicerie, prends le goûter disponible. Complète dès que possible avec du lait, du yaourt, des œufs ou du tsaramaso au repas suivant.</p><p>Le programme utilise le repère de 300 à 500 kcal de plus que ton alimentation habituelle pour une prise de poids graduelle. <a href="${P.sources.weight}" target="_blank" rel="noopener noreferrer">Conseils du NHS</a></p></details>`;
  }
  function stockView(){
    const products=Object.entries(P.food),plans=P.mealKeys.map(k=>J.planOf(state,ui.mealDate,k)),missing=new Set(plans.flatMap(p=>P.missing(p,state.stock)));
    return `${headers("CE QUE<br>TU AS SOUS LA MAIN.","Décoche les aliments absents. Ajoute tes prix en ariary pour comparer les plans réalisables.","Le placard")}<div class="stack"><section class="paper-section"><div class="card-heading"><h2>Disponible chez toi</h2><div class="row">${btn("Tout cocher","stock-all","on","text-button")}${btn("Tout décocher","stock-all","off","text-button")}</div></div><div class="stock-grid">${products.map(([id,f])=>`<label class="checkbox"><input type="checkbox" data-input="stock" data-id="${id}" ${checked(state.stock[id])}>${f.n}</label>`).join("")}</div></section><section class="shopping-note"><h2>À trouver pour le ${date(ui.mealDate,{month:"long"})}</h2>${missing.size?`<ul class="list">${[...missing].map(id=>`<li>${P.food[id].n}</li>`).join("")}</ul>`:"<p>Tous les ingrédients des plans sélectionnés sont disponibles.</p>"}${btn("Retrouver mes repas","open-food","","text-button")}</section><section class="paper-section"><h2>Les prix de ton quartier</h2><p class="muted spaced">Le prix de la portion affichée, en ariary.</p><div class="price-grid spaced">${products.map(([id,f])=>`<label><span class="label">${f.n} · Ar</span><input class="field" type="number" inputmode="numeric" min="0" max="10000000" step="1" value="${state.prices[id]??""}" data-input="price" data-id="${id}" placeholder="Prix inconnu"></label>`).join("")}</div><p id="price-total" class="spaced">${costSummary(plans.map(p=>P.cost(p,state.prices)))}</p><div class="row spaced">${btn("Retenir les plans disponibles les moins chers","best-plans")}</div></section></div>`;
  }
  function costSummary(costs){return costs.some(v=>v===null)?"Coût de la journée · prix manquants":"Coût de la journée · "+priceText(costs.reduce((a,b)=>a+b,0));}
  function weightChart(weeks){
    if(!weeks.length)return '<p class="empty-copy">Ta première pesée ouvrira la courbe. Ton historique de séries se construit séparément.</p>';
    const first=weeks[0].week,span=P.distance(first,weeks.at(-1).week),values=weeks.map(w=>w.value),lo=Math.min(...values)-.2,hi=Math.max(...values)+.2;
    const points=weeks.map(w=>[span?55+420*P.distance(first,w.week)/span:265,135-112*(w.value-lo)/(hi-lo)]);
    return `<svg class="chart" viewBox="0 0 500 165" role="img" aria-label="Poids moyen par semaine en kilogrammes">${[0,.5,1].map(t=>{const y=135-112*t;return `<path d="M55 ${y}H475" class="chart-grid"/><text x="2" y="${y+4}">${weight(lo+t*(hi-lo))}</text>`;}).join("")}<polyline points="${points.map(p=>p.join(",")).join(" ")}" class="chart-line"/>${points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="4.5" class="chart-point"><title>Semaine du ${date(weeks[i].week)} · ${weight(weeks[i].value)} kg</title></circle>`).join("")}<text x="${span?55:265}" y="157" text-anchor="${span?"start":"middle"}">${date(first)}</text>${span?`<text x="475" y="157" text-anchor="end">${date(weeks.at(-1).week)}</text>`:""}</svg>`;
  }
  function review(weeks){
    const a=weeks.find(w=>w.week==="2026-11-16"),b=weeks.find(w=>w.week==="2026-11-23"),measured=a?.count>=2&&b?.count>=2;
    return `<details class="review-note"><summary>Le bilan du 30 novembre</summary><p>${measured?`16–22 novembre : ${weight(a.value)} kg de moyenne. 23–29 novembre : ${weight(b.value)} kg de moyenne.`:"Pour ce bilan, prends deux pesées entre le 16 et le 22 novembre, puis deux entre le 23 et le 29 novembre."}</p><p class="small">Si ton poids moyen reste stable malgré un goûter supplémentaire régulier, ajoute une petite portion quotidienne, par exemple un peu plus de riz ou un verre de lait.</p></details>`;
  }
  function strengthView(){
    const groups=strengthGroups();
    if(!groups.length)return `<section class="strength-empty"><p class="overline">Dans les mouvements</p><h2>LE PREMIER REPÈRE,<br>C’EST TOI QUI LE NOTES.</h2><p>Après un mouvement terminé, tes répétitions et ta variante apparaissent ici. Les comparaisons utilisent le même exercice et la même variante.</p>${btn("Retrouver mes séances","open-next","","secondary")}</section>`;
    const group=groups.find(g=>g.id===ui.compare)??groups[0],ex=group.exercise,points=group.points.slice(-6),max=Math.max(...points.flatMap(p=>ex.side?[p.a,p.b]:[p.a]),1);
    return `<section class="strength-journal"><div class="card-heading"><div><p class="overline">Dans les mouvements</p><h2>TES EFFORTS, EN CLAIR.</h2></div><label><span class="label">Exercice et variante</span><select class="field" data-input="compare">${groups.map(g=>selectOption(g.id,g.exercise.name+" · "+g.variant,group.id)).join("")}</select></label></div><p class="small">Première série · même variante déclarée · ${ex.seconds?"secondes":ex.side?"répétitions à gauche et à droite":"répétitions"}</p><div class="strength-bars" role="img" aria-label="${esc(ex.name)} : ${points.map(p=>date(p.day)+" "+rowText(p,ex)).join("; ")}">${points.map(p=>`<div class="strength-bar-column"><span class="strength-bar-value">${rowText(p,ex)}</span><div class="strength-bar-pair"><span style="height:${Math.max(6,110*p.a/max)}px"></span>${ex.side?`<span class="right-side" style="height:${Math.max(6,110*p.b/max)}px"></span>`:""}</div><span class="strength-bar-date">${date(p.day)}</span></div>`).join("")}</div></section>`;
  }
  function sessionHistory(){
    const current=Object.entries(state.sessions).filter(([,s])=>s.complete||Object.values(s.exercises).some(ex=>ex.done||ex.rows.some(r=>r.a!==null||r.b!==null)));
    const legacy=new Map();
    for(const [key,value]of Object.entries(state.workLogs))if(value)legacy.set(key.slice(0,10),(legacy.get(key.slice(0,10))??0)+1);
    if(!current.length&&!legacy.size&&!Object.keys(state.warmups).length)return "<p>Tes séances apparaîtront ici après ta première saisie.</p>";
    const entries=current.sort(([a],[b])=>b.localeCompare(a)).map(([key,s])=>{
      const [day,kind]=key.split("|");
      const lines=P.exercises[kind].map(ex=>{
        const item=s.exercises[ex.id];if(!item)return "";
        const rows=item.rows.map((r,i)=>r.a===null&&r.b===null?"":`S${i+1} · ${rowText({a:r.a??"—",b:r.b??"—"},ex)}`).filter(Boolean);
        return rows.length||item.done?`<li><strong>${ex.name}</strong> · ${esc(item.variant)}${rows.length?" · "+rows.join(" / "):" · Coché"}</li>`:"";
      }).join("");
      return `<li><details><summary><span>${dateFull(day)} · séance ${kind}</span><span>${s.complete?"Terminée":"En cours"}</span></summary>${lines?`<ul>${lines}</ul>`:"<p>Séance cochée.</p>"}${btn("Retrouver cette séance","resume",key,"secondary compact")}</details></li>`;
    }).join("");
    const old=[...legacy].sort(([a],[b])=>b.localeCompare(a)).map(([day,count])=>`<li class="small">${dateFull(day)} · ${count} exercice(s) coché(s) dans l’ancienne version</li>`).join("");
    const warmups=Object.keys(state.warmups).sort().reverse().map(day=>`<li class="small">${dateFull(day)} · échauffement, suivi séparément</li>`).join("");
    return `<ul class="list history">${entries}${old}${warmups}</ul>`;
  }
  function track(){
    const weeks=J.weeklyWeights(state.weights),weights=[...state.weights].sort((a,b)=>b.date.localeCompare(a.date)),measures=[...state.measures].sort((a,b)=>b.date.localeCompare(a.date)),units={arm:"Tour de bras",chest:"Tour de poitrine",waist:"Tour de taille"};
    return `${headers("DES REPÈRES<br>QUI T’APPARTIENNENT.","Les séances, les répétitions, les mensurations : retrouve tes repères au même endroit.","Le carnet · tes traces à toi")}<div class="stack">${strengthView()}<section class="paper-section"><div class="card-heading"><h2>Ton poids, dans la durée</h2><span class="small muted">Départ · ${weight(state.weight)} kg / Objectif à terme · ${weight(state.target)} kg</span></div>${weightChart(weeks)}${weeks.length?`<div class="table-wrap"><table aria-label="Moyennes hebdomadaires du poids"><thead><tr><th>Semaine du</th><th>Pesées</th><th>Moyenne</th></tr></thead><tbody>${weeks.map(w=>`<tr><td>${dateFull(w.week)}</td><td>${w.count}</td><td>${weight(w.value)} kg</td></tr>`).join("")}</tbody></table></div>`:""}${review(weeks)}</section><div class="split responsive-split"><section class="paper-section" id="weigh-card"><h2>Noter une pesée</h2><p class="small spaced">Deux matins par semaine, après les toilettes et avant de manger.</p><form data-form="weight" class="spaced"><div class="split"><label><span class="label">Date</span><input class="field" type="date" name="date" value="${P.today()}" max="${P.today()}" required></label><label><span class="label">Poids (kg)</span><input class="field" id="weight-field" type="number" inputmode="decimal" name="value" min="25" max="250" step="0.1" placeholder="${J.latestWeight(state)}" required></label></div><div class="row">${btnSubmit("Enregistrer la pesée")}</div></form><ul class="list spaced">${weights.map(w=>`<li class="row between"><span>${dateFull(w.date)}</span><strong>${weight(w.value)} kg</strong></li>`).join("")}</ul></section><section class="paper-section"><h2>Mes mensurations</h2><p class="small spaced">Dans les mêmes conditions, environ une fois par mois.</p><form data-form="measure" class="spaced"><div class="split"><label><span class="label">Date</span><input class="field" type="date" name="date" value="${P.today()}" max="${P.today()}" required></label>${Object.entries(units).map(([key,label])=>`<label><span class="label">${label} (cm)</span><input class="field" type="number" inputmode="decimal" name="${key}" min="1" max="250" step="0.1"></label>`).join("")}</div><div class="row">${btnSubmit("Enregistrer les mesures")}</div></form><ul class="list spaced">${measures.map(m=>`<li><strong>${dateFull(m.date)}</strong><p class="small">${Object.entries(units).filter(([k])=>m[k]!=null).map(([k,label])=>label+" "+weight(m[k])+" cm").join(" · ")}</p></li>`).join("")}</ul></section></div><section class="paper-section"><h2>Ce que tu as fait</h2><div class="spaced">${sessionHistory()}</div></section></div>`;
  }
  function btnSubmit(label){return `<button class="btn" type="submit">${label}</button>`;}
  function settings(){
    return `${headers("TON ESPACE.<br>TES REPÈRES.","Ton journal reste enregistré dans ce navigateur. Les exports permettent de le retrouver sur un autre appareil.","Les réglages")}<div class="stack"><section class="paper-section"><h2>Ce qui me met en mouvement</h2><form data-form="why" class="spaced"><label><span class="label">Une phrase à retrouver sur ton accueil</span><input class="field" type="text" name="why" maxlength="140" value="${esc(state.why)}" placeholder="Par exemple : me sentir plus fort dans mon quotidien"></label><div class="row">${btnSubmit("Garder ma phrase")}</div></form></section><section class="paper-section"><div class="card-heading"><h2>Mon profil</h2><label><span class="label">Apparence</span><select class="field" data-input="appearance">${[["light","Papier clair"],["dark","Encre sombre"],["system","Selon mon appareil"]].map(([value,label])=>selectOption(value,label,state.appearance)).join("")}</select></label></div><form data-form="profile" class="spaced"><div class="triplet responsive-split"><label><span class="label">Taille (cm)</span><input class="field" type="number" name="height" min="100" max="230" value="${state.height}" required></label><label><span class="label">Poids de départ (kg)</span><input class="field" type="number" name="weight" min="25" max="250" step="0.1" value="${state.weight}" required></label><label><span class="label">Poids visé à terme (kg)</span><input class="field" type="number" name="target" min="30" max="200" step="0.1" value="${state.target}" required></label></div><div class="row">${btnSubmit("Enregistrer mon profil")}</div></form></section><section class="paper-section"><h2>Mes données</h2><p class="spaced">Exporte une sauvegarde pour conserver ton journal ou changer d’appareil. L’import fusionne les historiques ; les pesées déjà présentes ici sont gardées aux dates communes. Le profil et le placard reprennent les valeurs de la sauvegarde.</p><div class="row spaced">${btn("Exporter ma sauvegarde JSON","export")}${btn("Importer une sauvegarde JSON","import","","secondary")}<input type="file" id="import-file" accept=".json,application/json" data-input="import" hidden>${btn("Exporter les pesées CSV","csv","","text-button")}</div></section><section class="paper-section"><h2>Les repères du programme</h2><ul class="list spaced"><li><a href="${P.sources.training}" target="_blank" rel="noopener noreferrer">ACSM · renforcement musculaire</a></li><li><a href="${P.sources.weight}" target="_blank" rel="noopener noreferrer">NHS · prise de poids progressive</a></li></ul><details class="visual-credits"><summary>Typographies et visuels</summary><p>Barlow Condensed et Manrope, sous licence OFL. Photos du mouvement : <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer">Free Exercise DB</a>. Illustrations alimentaires générées : <a href="https://github.com/cosmintrica/culinary-assets" target="_blank" rel="noopener noreferrer">Culinary Assets</a>, publiées sous CC0. Les images représentent des ingrédients et des exemples de mouvement.</p></details><p class="small spaced">Tanjaka · Atelier, novembre 2026.</p></section></div>`;
  }
  const views={home,work:workout,food:foodView,stock:stockView,track,settings};
  function applyAppearance(){
    const dark=state.appearance==="dark"||(state.appearance==="system"&&window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme=dark?"dark":"light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content",dark?"#171c19":"#f3f3ec");
  }
  function render(){
    byId("sidebar").innerHTML=pages.slice(0,5).map(p=>navButton(p,false)).join("");
    byId("bottom-nav").innerHTML=pages.slice(0,5).map(p=>navButton(p,true)).join("");
    byId("settings-button").setAttribute("aria-current",ui.page==="settings"?"page":"false");
    content.innerHTML=views[ui.page]();
    document.title=pages.find(p=>p[0]===ui.page)[1]+" · Tanjaka";
    document.body.dataset.page=ui.page;
    refreshTimer();
  }
  function go(page){if(!views[page])return;ui.page=page;render();window.scrollTo(0,0);content.focus({preventScroll:true});}
  function notify(message){const toast=byId("toast");clearTimeout(ui.toast);toast.textContent=message;toast.hidden=false;ui.toast=setTimeout(()=>{toast.hidden=true;},4200);}
  function persist(){try{J.save(state);return true;}catch{notify("Ce changement n’a pas été enregistré. Exporte ton journal depuis les réglages.");return false;}}
  function selectWorkout(key,kind=P.schedule[key]??ui.kind){
    stopTimer();ui.guide=null;ui.workDate=key;ui.kind=kind;ui.timerMode="rest";ui.timerDuration=ui.timerLeft=90;ui.open.clear();
    const week=P.weeks.indexOf(P.weekOf(key));if(week!==-1)ui.week=week;
  }
  function editSession(){return state.sessions[J.workoutKey(ui.workDate,ui.kind)]??=J.emptySession();}
  function editExercise(id){
    const ex=P.exercises[ui.kind].find(e=>e.id===id);if(!ex)return null;
    return editSession().exercises[id]??=J.exerciseOf(state,ui.workDate,ui.kind,ex);
  }
  function updateWorkoutStatus(){
    const count=byId("checked-count");if(count)count.textContent=exerciseCount()+" sur "+P.exercises[ui.kind].length+" exercices cochés";
    const finish=byId("finish-session");if(finish)finish.disabled=ui.workDate>P.today()||(!J.workoutOf(state,ui.workDate,ui.kind).complete&&!canFinish());
  }
  function setMealPlan(meal,plan){
    state.dayMeals[ui.mealDate]??={};state.dayMeals[ui.mealDate][meal]=plan.id;
    const key=ui.mealDate+"-"+meal;if(state.mealLogs[key])state.mealLogs[key]=plan.id;
  }
  function refreshTimer(){
    const value=byId("timer-value");if(value)value.textContent=timerText();
    const toggle=content.querySelector('[data-do="timer-toggle"]');if(toggle)toggle.textContent=ui.timerEnd?"Pause":ui.timerLeft?"Démarrer":"Relancer";
    const status=byId("timer-status");if(status)status.textContent=ui.timerEnd?"Le chrono tourne.":ui.timerLeft?"À ton rythme.":"Temps écoulé.";
  }
  function stopTimer(){clearInterval(ui.timerInterval);ui.timerEnd=0;}
  function tick(){
    ui.timerLeft=Math.max(0,Math.ceil((ui.timerEnd-Date.now())/1000));
    if(!ui.timerLeft){stopTimer();notify(ui.timerMode==="warmup"?"Les cinq minutes sont écoulées. Choisis la suite.":"Le temps de repos est écoulé. Continue quand tu es prêt.");}
    refreshTimer();
  }
  function toggleTimer(){
    if(ui.timerEnd){ui.timerLeft=Math.max(0,Math.ceil((ui.timerEnd-Date.now())/1000));stopTimer();}
    else{if(!ui.timerLeft)ui.timerLeft=ui.timerDuration;ui.timerEnd=Date.now()+ui.timerLeft*1000;ui.timerInterval=setInterval(tick,200);}
    refreshTimer();
  }
  function startTimer(seconds,mode,run=true){stopTimer();ui.timerMode=mode;ui.timerDuration=ui.timerLeft=seconds;if(run)toggleTimer();}
  function download(name,data,type){
    const url=URL.createObjectURL(new Blob([data],{type})),link=document.createElement("a");link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function findGuidePosition(){
    const session=J.workoutOf(state,ui.workDate,ui.kind);
    for(let index=0;index<P.exercises[ui.kind].length;index++){
      const ex=P.exercises[ui.kind][index],item=J.exerciseOf(state,ui.workDate,ui.kind,ex);
      if(item.done)continue;
      const sets=P.setCount(ex,ui.workDate,session.extra);
      const set=Array.from({length:sets},(_,i)=>i).find(i=>!(item.rows[i]?.a>0)||(ex.side&&!(item.rows[i]?.b>0)));
      return {stage:"exercise",index,set:set??sets-1,easy:false};
    }
    return {stage:"summary",index:0,set:0,easy:false};
  }
  function launchGuide(easy){
    if(ui.workDate>P.today())return;
    if(ui.guide){go("work");return;}
    const session=J.workoutOf(state,ui.workDate,ui.kind);
    if(session.complete){ui.manual=true;go("work");return;}
    if(Object.values(session.exercises).some(ex=>ex.done||ex.rows.some(r=>r.a>0||r.b>0))){
      ui.guide=findGuidePosition();ui.timerMode="rest";go("work");return;
    }
    ui.guide={stage:"warmup",easy,index:0,set:0};startTimer(300,"warmup",!easy);go("work");
  }
  function recordGuideSet(){
    if(ui.workDate>P.today()||ui.guide?.stage!=="exercise")return;
    const g=ui.guide,ex=P.exercises[ui.kind][g.index],item=editExercise(ex.id);
    const a=J.repValue(byId(`rep-${ex.id}-${g.set}-a`).value),b=ex.side?J.repValue(byId(`rep-${ex.id}-${g.set}-b`).value):null;
    if(!(a>0)||(ex.side&&!(b>0))){const error=byId("guide-error");error.hidden=false;error.textContent=ex.side?"Note les répétitions réalisées de chaque côté.":"Note les répétitions ou les secondes réellement réalisées.";return;}
    item.rows[g.set]={a,b};
    const sets=P.setCount(ex,ui.workDate,editSession().extra);
    if(g.set===sets-1)item.done=true;
    if(!persist())return;
    if(g.index===P.exercises[ui.kind].length-1&&g.set===sets-1){g.stage="summary";stopTimer();}
    else{g.stage="rest";startTimer(90,"rest");}
    render();
  }
  function nextGuideSet(){
    if(ui.guide?.stage!=="rest")return;
    const g=ui.guide,ex=P.exercises[ui.kind][g.index],sets=P.setCount(ex,ui.workDate,J.workoutOf(state,ui.workDate,ui.kind).extra);
    stopTimer();
    if(g.set+1<sets)g.set++;else{g.index++;g.set=0;}
    g.stage="exercise";ui.frame=0;render();
  }
  const actions={
    "open-next"(){const next=P.nextDate()??P.dates.at(-1);selectWorkout(next,P.schedule[next]);go("work");},
    "start-today"(){if(!P.schedule[P.today()])return;selectWorkout(P.today(),P.schedule[P.today()]);launchGuide(false);},
    "easy-today"(){if(!P.schedule[P.today()])return;selectWorkout(P.today(),P.schedule[P.today()]);launchGuide(true);},
    "open-track"(){go("track");},"open-stock"(){go("stock");},"open-food"(){go("food");},
    weigh(){go("track");byId("weight-field").focus();},
    snack(){ui.mealDate=P.today();ui.meal="gouter";go("food");},
    week(value){ui.week=Math.max(0,Math.min(P.weeks.length-1,ui.week+Number(value)));render();},
    "pick-date"(value){selectWorkout(value);render();},
    kind(value){if(["A","B"].includes(value)){selectWorkout(ui.workDate,value);render();}},
    resume(value){const [key,kind]=value.split("|");if(J.validDate(key)&&["A","B"].includes(kind)){selectWorkout(key,kind);launchGuide(false);}},
    manual(){ui.manual=!ui.manual;ui.timerMode="rest";render();},
    finish(){if(ui.workDate>P.today())return;const session=editSession();if(!session.complete&&!canFinish())return;session.complete=!session.complete;const saved=persist();render();if(saved)notify(session.complete?"Séance enregistrée dans ton carnet.":"Séance rouverte.");},
    "continue-guide"(){go("work");},
    "guide-close"(){stopTimer();ui.guide=null;ui.timerMode="rest";ui.timerDuration=ui.timerLeft=90;go("work");},
    "guide-start"(){launchGuide(false);},"guide-easy"(){launchGuide(true);},
    "guide-exit"(){if(ui.timerEnd)ui.timerLeft=Math.max(0,Math.ceil((ui.timerEnd-Date.now())/1000));stopTimer();go("home");},
    "warmup-done"(){if(ui.guide?.stage!=="warmup"||ui.workDate>P.today())return;stopTimer();state.warmups[ui.workDate]=true;if(!persist())return;ui.guide=ui.guide.easy?{...ui.guide,stage:"checkpoint"}:findGuidePosition();ui.timerMode="rest";ui.timerDuration=ui.timerLeft=90;render();},
    "guide-begin"(){ui.guide=findGuidePosition();ui.frame=0;render();},
    "warmup-stop"(){stopTimer();ui.guide=null;go("home");notify("Échauffement noté séparément. La séance complète reste à faire.");},
    "guide-save":recordGuideSet,"guide-next":nextGuideSet,
    frame(){ui.frame=1-ui.frame;render();},
    "timer-toggle":toggleTimer,"timer-set"(value){startTimer(Number(value),"rest",false);refreshTimer();},
    meal(value){if(P.mealKeys.includes(value)){ui.meal=value;render();}},
    "meal-plan"(value){const plan=P.findRecipe(ui.meal,value);if(!plan)return;setMealPlan(ui.meal,plan);const saved=persist();render();if(saved)notify("Plan "+plan.plan+" retenu.");},
    "food-missing"(id){
      if(!Object.hasOwn(P.food,id))return;
      state.stock[id]=!state.stock[id];if(!state.stock[id])ui.missing.add(id);else ui.missing.delete(id);
      const logged=state.mealLogs[ui.mealDate+"-"+ui.meal];
      let replaced=false;
      if(!logged&&P.missing(currentMeal(),state.stock).length){const next=P.meals[ui.meal].plans.find(p=>!P.missing(p,state.stock).length);if(next){setMealPlan(ui.meal,next);replaced=true;}}
      const saved=persist();render();if(saved)notify(logged?"Placard actualisé. Le repas déjà noté reste dans ton historique.":replaced?"Une autre idée, avec ce qui est disponible.":"Placard actualisé.");
    },
    "food-restore"(id){if(!Object.hasOwn(P.food,id))return;state.stock[id]=true;ui.missing.delete(id);persist();render();},
    "stock-all"(value){for(const key of Object.keys(state.stock))state.stock[key]=value==="on";persist();render();},
    "best-plans"(){let count=0;for(const meal of P.mealKeys){if(state.mealLogs[ui.mealDate+"-"+meal])continue;const plan=J.recommended(state,meal);if(plan){setMealPlan(meal,plan);count++;}}const saved=persist();render();if(saved)notify(count?count+" plan(s) retenu(s) selon tes prix.":"Ajoute les prix des ingrédients des plans disponibles.");},
    export(){download("tanjaka-sauvegarde-"+P.today()+".json",JSON.stringify(state,null,2),"application/json");},
    import(){byId("import-file").click();},
    csv(){const rows=[...state.weights].sort((a,b)=>a.date.localeCompare(b.date)).map(w=>w.date+","+w.value);download("tanjaka-pesees.csv","date,poids_kg\n"+rows.join("\n"),"text/csv;charset=utf-8");}
  };
  async function importFile(field){
    const file=field.files[0];if(!file)return;
    try{if(file.size>5000000)throw Error("Le fichier dépasse 5 Mo.");const next=J.mergeBackup(state,JSON.parse(await file.text()));state=next;applyAppearance();const saved=persist();render();if(saved)notify("Sauvegarde importée.");}
    catch(error){notify(error instanceof SyntaxError?"Le fichier JSON est illisible.":error.message);field.value="";}
  }
  const changes={
    "work-date"(field){if(!J.validDate(field.value)||!field.validity.valid){field.value=ui.workDate;return;}selectWorkout(field.value);render();},
    "meal-date"(field){if(!J.validDate(field.value)||field.value>P.today()){field.value=ui.mealDate;return;}ui.mealDate=field.value;render();},
    extra(field){if(ui.workDate>P.today())return;editSession().extra=field.checked;persist();render();},
    exercise(field){if(ui.workDate>P.today())return;const item=editExercise(field.dataset.id);if(!item)return;item.done=field.checked;persist();updateWorkoutStatus();},
    variant(field){if(ui.workDate>P.today())return;const ex=P.exercises[ui.kind].find(e=>e.id===field.dataset.id);if(!ex?.variants.includes(field.value))return;editExercise(ex.id).variant=field.value;persist();ui.frame=0;render();},
    "meal-log"(field){const key=ui.mealDate+"-"+ui.meal;if(field.checked)state.mealLogs[key]=currentMeal().id;else delete state.mealLogs[key];persist();render();},
    stock(field){if(!Object.hasOwn(P.food,field.dataset.id))return;state.stock[field.dataset.id]=field.checked;persist();render();},
    price(field){const value=J.number(field.value,0,10000000);if(!field.validity.valid)return;if(value===null)delete state.prices[field.dataset.id];else state.prices[field.dataset.id]=value;persist();const total=byId("price-total");if(total)total.textContent=costSummary(P.mealKeys.map(k=>P.cost(J.planOf(state,ui.mealDate,k),state.prices)));},
    appearance(field){if(!["light","dark","system"].includes(field.value))return;state.appearance=field.value;applyAppearance();persist();},
    compare(field){ui.compare=field.value;render();},import:importFile
  };
  function addWeight(data){
    const day=data.get("date"),value=J.number(data.get("value"),25,250);if(!J.validDate(day)||day>P.today()||value===null)return false;
    state.weights=[...state.weights.filter(w=>w.date!==day),{date:day,value}];return true;
  }
  function addMeasure(data){
    const day=data.get("date");if(!J.validDate(day)||day>P.today())return false;const entry={date:day};
    for(const k of ["arm","chest","waist"]){const v=J.number(data.get(k),1,250);if(v!==null)entry[k]=v;}
    if(Object.keys(entry).length===1)return false;const old=state.measures.findLast(m=>m.date===day);
    state.measures=[...state.measures.filter(m=>m.date!==day),{...old,...entry}];return true;
  }
  function updateProfile(data){
    const height=J.number(data.get("height"),100,230),weight=J.number(data.get("weight"),25,250),target=J.number(data.get("target"),30,200);
    if(height===null||weight===null||target===null)return false;Object.assign(state,{height,weight,target});return true;
  }
  const forms={
    weight:[addWeight,"Pesée enregistrée.","Vérifie la date et le poids."],
    measure:[addMeasure,"Mensurations enregistrées.","Saisis au moins une mensuration."],
    profile:[updateProfile,"Profil enregistré.","Vérifie les valeurs du profil."],
    why:[data=>{state.why=String(data.get("why")??"").trim().slice(0,140);return true;},"Ta phrase t’attend sur l’accueil.","Vérifie ta phrase."]
  };
  document.addEventListener("click",event=>{const b=event.target.closest("button");if(!b||b.disabled)return;if(b.dataset.page)go(b.dataset.page);else actions[b.dataset.do]?.(b.dataset.value);});
  document.addEventListener("change",event=>{if(!event.target.disabled)changes[event.target.dataset?.input]?.(event.target);});
  document.addEventListener("input",event=>{
    const field=event.target;if(field.disabled||field.dataset?.input!=="rep"||ui.workDate>P.today())return;
    const value=J.repValue(field.value);
    if(field.validity.badInput||(field.value!==""&&value===null)){field.setAttribute("aria-invalid","true");return;}
    field.removeAttribute("aria-invalid");const item=editExercise(field.dataset.id);if(!item)return;
    const index=Number(field.dataset.set);if(!Number.isInteger(index)||index<0||index>2||!["a","b"].includes(field.dataset.side))return;
    const row=item.rows[index]??={a:null,b:null};row[field.dataset.side]=value;persist();updateWorkoutStatus();
  });
  document.addEventListener("submit",event=>{
    const setup=forms[event.target.dataset.form];if(!setup)return;event.preventDefault();const [apply,success,failure]=setup;
    if(!apply(new FormData(event.target))){notify(failure);return;}const saved=persist();render();if(saved)notify(success);
  });
  document.addEventListener("toggle",event=>{const el=event.target;if(!el.dataset?.exercise||!el.isConnected)return;if(el.open)ui.open.add(el.dataset.exercise);else ui.open.delete(el.dataset.exercise);},true);
  function updateNetwork(){byId("network").hidden=navigator.onLine!==false;}
  window.addEventListener("online",updateNetwork);window.addEventListener("offline",updateNetwork);
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{if(state.appearance==="system")applyAppearance();});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&ui.timerEnd)tick();});
  byId("settings-button").innerHTML=icon("settings");
  applyAppearance();updateNetwork();render();
  if("serviceWorker"in navigator&&/^https?:$/.test(location.protocol)){
    navigator.serviceWorker.addEventListener("message",event=>{
      if(event.data?.type==="TANJAKA_VERSION"&&event.data.version!==BUILD)byId("update-banner").hidden=false;
    });
    byId("update-reload").addEventListener("click",()=>location.reload());
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }
})();
