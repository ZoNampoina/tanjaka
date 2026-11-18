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
      workLogs, sessions, weights:[...weightByDate.values()], measures
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


(() => {
  "use strict";

  const P = window.Tanjaka;
  const J = window.TanjakaJournal;
  let state = J.load();
  const startDate = P.nextDate() ?? P.today();
  const ui = {
    page:"home", workDate:startDate, kind:P.schedule[startDate] ?? "A",
    week:Math.max(0,P.weeks.indexOf(P.weekOf(startDate))), mealDate:P.today(), meal:"gouter",
    open:new Set(), timerDuration:90, timerLeft:90, timerEnd:0, timerInterval:0, toast:0
  };
  const pages = [
    ["home","Accueil","Accueil"], ["work","Entraînement","Séances"], ["food","Nutrition","Repas"],
    ["stock","Placard et prix","Placard"], ["track","Suivi","Suivi"], ["settings","Paramètres et sauvegarde","Paramètres"]
  ];
  const paths = {
    home:"M3 10.5 12 3l9 7.5v9.25a1.25 1.25 0 0 1-1.25 1.25H4.25A1.25 1.25 0 0 1 3 19.75z M9 21v-7h6v7",
    work:"M6 7v10m12-10v10M3 9v6m18-6v6M6 12h12",
    food:"M5 3v7a3 3 0 0 0 6 0V3M8 3v18m11-18c-3.5 2.3-4 5.5-4 8h4m0-8v18",
    stock:"M4 5h16v15H4z M4 10h16m-10 5h4",
    track:"M4 4v16h16m-12-4 4-5 3 2 5-6",
    settings:"M4 7h16M4 17h16M8 4v6m8 4v6",
    arrow:"M5 12h14m-6-6 6 6-6 6"
  };
  const icon = id => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[id]}"/></svg>`;
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const weight = P.weightText;
  const date = (key, options = {}) => P.dateText(key, options);
  const dayLong = key => date(key, {weekday:"long",month:"long"});
  const dateFull = key => date(key, {month:"long",year:"numeric"});
  const cycleLabel = "13 novembre – 31 décembre 2026";
  const headers = (title, description) => `<header class="page-header"><h1>${title}</h1><p>${description}</p></header>`;
  const navButton = ([id, name, short], mobile) =>
    `<button class="nav-button" type="button" data-page="${id}" ${ui.page === id ? 'aria-current="page"' : ""}>${icon(id)}<span>${mobile ? short : name}</span></button>`;
  const tag = (value, type = "") => `<span class="tag ${type}">${value}</span>`;
  const checked = value => value ? "checked" : "";
  const disabled = value => value ? "disabled" : "";
  const selectOption = (value,label,active) => `<option value="${esc(value)}" ${active === value ? "selected" : ""}>${esc(label)}</option>`;

  function home() {
    const now = P.today();
    const next = P.nextDate(now);
    const count = J.doneCount(state);
    const weightNow = J.latestWeight(state);
    const loggedMeals = P.mealKeys.filter(meal => state.mealLogs[now + "-" + meal]).length;
    const isToday = now === next;
    const todayDone = isToday && J.workoutOf(state,next,P.schedule[next]).complete;
    const heading = isToday ? "Séance " + P.schedule[next] + (todayDone ? " terminée" : " aujourd’hui") :
      next ? "Prochaine séance " + P.schedule[next] : "Ton cycle est terminé";
    const plan = J.planOf(state, now, "gouter");
    const nextLine = next ? `${dayLong(next)} · ${P.sessionNames[P.schedule[next]]}` : "Retrouve tes séances et tes pesées dans le suivi.";
    return `<div class="stack">
      <section class="hero">
        <div>
          <p class="overline">${cycleLabel}</p>
          <h1>${heading}</h1><p>${nextLine}</p>
          <div class="row">
            <button class="btn" type="button" data-do="open-next">${next ? (todayDone ? "Revoir la séance" : "Ouvrir la séance") : "Voir l’entraînement"}${icon("arrow")}</button>
            <button class="btn ghost" type="button" data-page="food">Voir mes repas</button>
          </div>
        </div>
        <div class="hero-progress" style="--percent:${count / P.dates.length * 100}%" aria-label="${count} séances du cycle terminées sur ${P.dates.length}">
          <div><strong>${count}<small> / ${P.dates.length}</small></strong><small>Séances du cycle</small></div>
        </div>
      </section>
      <section class="split main-split" aria-label="Résumé du jour">
        <div class="card">
          <p class="small">${state.weights.length ? "Dernière pesée" : "Poids de départ"}</p>
          <strong class="stat">${weight(weightNow)} <small>kg</small></strong>
          <p class="small">Objectif à terme · ${weight(state.target)} kg</p>
          <button class="btn secondary compact spaced" type="button" data-do="weigh">Ajouter une pesée</button>
        </div>
        <div class="card">
          <p class="small">Repas cochés aujourd’hui</p>
          <strong class="stat">${loggedMeals} <small>/ 4</small></strong>
          <p class="small">Goûter · ${esc(plan.name)}</p>
          <button class="btn secondary compact spaced" type="button" data-do="snack">Voir les options</button>
        </div>
      </section>
      <section class="card">
        <div class="card-heading"><h2>Mes repas du jour</h2><button class="btn secondary compact" type="button" data-page="stock">Mon placard</button></div>
        <ul class="list">
          ${P.mealKeys.map(meal => {
            const option = J.planOf(state,now,meal);
            const absent = P.missing(option,state.stock).length;
            return `<li class="row between">
              <div><strong>${P.meals[meal].name}</strong><p class="small">${esc(option.name)}</p></div>
              <button class="btn secondary compact" type="button" data-do="open-meal" data-value="${meal}" aria-label="Voir le ${P.meals[meal].name.toLowerCase()}">
                ${state.mealLogs[now + "-" + meal] ? "Coché" : absent ? "Remplacer" : "Plan " + option.plan}
              </button>
            </li>`;
          }).join("")}
        </ul>
      </section>
    </div>`;
  }

  function calendar() {
    const start = P.weeks[ui.week];
    const days = Array.from({length:7}, (_,i) => P.offset(start,i));
    const content = days.map(key => {
      const type = P.schedule[key];
      const stamp = key === P.today() ? 'aria-current="date"' : "";
      const inside = key >= P.START && key <= P.END;
      const label = `<span>${date(key,{weekday:"short",day:undefined,month:undefined}).replace(".","")}</span><strong>${Number(key.slice(-2))}</strong>`;
      if (!type) return `<div class="day" ${stamp}>${label}<span>${inside ? "Repos" : "—"}</span></div>`;
      const complete = J.workoutOf(state,key,type).complete;
      return `<button class="day" type="button" data-do="pick-date" data-value="${key}" ${stamp}
        aria-pressed="${key === ui.workDate}" aria-label="${dayLong(key)}, séance ${type}${complete ? ", terminée" : ""}">${label}<span>${complete ? "✓ " : ""}${type}</span></button>`;
    }).join("");
    return `<section class="card">
      <div class="card-heading"><h2>Calendrier du cycle</h2><span class="small muted">Lundi · mercredi · vendredi</span></div>
      <div class="row between">
        <button class="btn secondary round" type="button" data-do="week" data-value="-1" aria-label="Semaine précédente" ${disabled(ui.week === 0)}>‹</button>
        <strong class="calendar-title">${date(start)} – ${date(days[6])}</strong>
        <button class="btn secondary round" type="button" data-do="week" data-value="1" aria-label="Semaine suivante" ${disabled(ui.week === P.weeks.length - 1)}>›</button>
      </div>
      <div class="week-grid spaced">${content}</div>
    </section>`;
  }

  function timerText() {
    return String(Math.floor(ui.timerLeft / 60)).padStart(2,"0") + ":" + String(ui.timerLeft % 60).padStart(2,"0");
  }
  function timerPanel() {
    return `<div class="card-heading timer-controls">
      <div><span class="label">Repos entre les séries</span><span id="timer-value" class="timer-value" role="timer">${timerText()}</span></div>
      <div class="row">
        <button class="btn compact" id="timer-start" type="button" data-do="timer-toggle">${ui.timerEnd ? "Pause" : "Démarrer"}</button>
        ${[60,90,120].map(seconds => `<button class="btn secondary compact" type="button" data-do="timer-set" data-value="${seconds}">${seconds} s</button>`).join("")}
      </div>
    </div>`;
  }

  function repField(exercise, index, field, value, unavailable) {
    const label = exercise.seconds ? "Secondes" : exercise.side ? (field === "a" ? "Gauche" : "Droite") : "Répétitions";
    return `<label><span class="label">${label}</span><input class="field" type="number" inputmode="numeric" min="0" max="999" step="1"
      id="rep-${exercise.id}-${index}-${field}" aria-label="${esc(exercise.name)}, série ${index + 1}, ${label}" data-input="rep" data-id="${exercise.id}" data-set="${index}" data-side="${field}" value="${value ?? ""}" ${disabled(unavailable)}></label>`;
  }

  function exerciseCard(exercise, session, future) {
    const item = J.exerciseOf(state,ui.workDate,ui.kind,exercise);
    const sets = P.setCount(exercise,ui.workDate,session.extra);
    const ready = J.progression(state,ui.workDate,ui.kind,exercise,item.variant);
    const rows = Array.from({length:sets}, (_,i) => `<div class="set-row">
      <strong>Série ${i + 1}</strong>${repField(exercise,i,"a",item.rows[i]?.a,future)}
      ${exercise.side ? repField(exercise,i,"b",item.rows[i]?.b,future) : ""}
    </div>`).join("");
    return `<article class="exercise">
      <div class="exercise-head">
        <label class="checkbox">
          <input type="checkbox" data-input="exercise" data-id="${exercise.id}" aria-label="Exercice terminé, ${esc(exercise.name)}" ${checked(item.done)} ${disabled(future)}>
          <strong>${exercise.name}</strong>
        </label>
        ${tag(sets + " séries","neutral")}
      </div>
      <p class="small"><strong class="accent">${P.dose(exercise)}</strong> · ${exercise.group}</p>
      <p class="small">${exercise.cue}</p>
      <details class="exercise-log" data-exercise="${exercise.id}" ${ui.open.has(exercise.id) ? "open" : ""}>
        <summary>Noter les séries</summary>
        <div class="log-fields">
          <label><span class="label">Variante</span>
            <select class="field" data-input="variant" data-id="${exercise.id}" ${disabled(future)}>
              ${exercise.variants.map(variant => selectOption(variant,variant,item.variant)).join("")}
            </select>
          </label>
          ${rows}
          ${ready ? '<p class="accent small spaced">Tu as atteint le haut de la fourchette deux fois avec cette variante. Tu peux augmenter légèrement la difficulté si tu récupères bien.</p>' : ""}
        </div>
      </details>
    </article>`;
  }

  function exerciseCount() {
    return P.exercises[ui.kind].filter(exercise => J.exerciseOf(state,ui.workDate,ui.kind,exercise).done).length;
  }
  function canFinish() {
    const session = J.workoutOf(state,ui.workDate,ui.kind);
    return exerciseCount() > 0 || Object.values(session.exercises).some(item =>
      item.rows.some(row => (row.a ?? 0) > 0 || (row.b ?? 0) > 0));
  }
  function workout() {
    const session = J.workoutOf(state,ui.workDate,ui.kind);
    const future = ui.workDate > P.today();
    const exercises = P.exercises[ui.kind];
    const phase = P.phaseFor(ui.workDate);
    const phaseInfo = P.phases[phase];
    return `${headers("Entraînement à la maison", "Sans haltères. Un sac à dos solide et quelques bouteilles d’eau suffisent pour ajouter de la résistance. Les variantes sans sac sont indiquées.")}
    <div class="stack">
      ${calendar()}
      <section class="card">
        <div class="card-heading">
          <div class="session-heading"><p class="overline">${dayLong(ui.workDate)}</p><h2>Séance ${ui.kind} · ${P.sessionNames[ui.kind]}</h2>
            <p class="small" id="checked-count">${exerciseCount()} sur ${exercises.length} exercices cochés</p></div>
          <label><span class="label">Date de la séance</span><input type="date" class="field date-control" data-input="work-date" value="${ui.workDate}" max="${P.END > P.today() ? P.END : P.today()}"></label>
        </div>
        <div class="segment">
          ${["A","B"].map(type => `<button type="button" data-do="kind" data-value="${type}" aria-pressed="${ui.kind === type}">Séance ${type}</button>`).join("")}
        </div>
        <div class="note spaced">
          <p><strong class="accent">${phaseInfo.name}</strong> · ${phaseInfo.range}</p>
          <p class="small">${phaseInfo.detail}</p>
          <p class="small">Échauffe-toi 5 min avec de la marche sur place, des mouvements d’épaules et quelques squats faciles.</p>
        </div>
        ${phase > 0 ? `<label class="checkbox spaced"><input type="checkbox" data-input="extra" ${checked(session.extra)} ${disabled(future)}> Ajouter une 3ᵉ série aux premières pompes et au tirage</label>` : ""}
        ${future ? '<p class="small amber spaced">Tu peux consulter cette séance à l’avance. La saisie s’ouvre à la date choisie.</p>' : ""}
        <div class="spaced">${timerPanel()}</div>
        <div class="exercise-list">${exercises.map(exercise => exerciseCard(exercise,session,future)).join("")}</div>
        <div class="row between spaced">
          <span class="small muted">${session.complete ? "Séance enregistrée dans ton suivi." : "Les séries sont enregistrées à mesure que tu les notes."}</span>
          <button class="btn ${session.complete ? "secondary" : ""}" type="button" id="finish-session" data-do="finish" ${disabled(future || (!session.complete && !canFinish()))}>
            ${session.complete ? "Rouvrir la séance" : "Marquer la séance terminée"}
          </button>
        </div>
      </section>
      <section class="card">
        <div class="card-heading"><h2>Progression du cycle</h2></div>
        <ul class="list">${P.phases.map(info => `<li><strong>${info.range} · ${info.name}</strong><p class="small">${info.detail}</p></li>`).join("")}</ul>
        <p class="small spaced">Arrête un mouvement qui déclenche une douleur vive. <a href="${P.sources.training}" target="_blank" rel="noopener noreferrer">Recommandations de l’ACSM</a></p>
      </section>
    </div>`;
  }


  const priceText = value => Math.round(value).toLocaleString("fr-FR") + " Ar";
  const availability = n => n ? tag(n === 1 ? "1 ingrédient absent" : n + " ingrédients absents","warn") : tag("Disponible");
  function alternatives(id) {
    const categories = {laitage:["laitage","proteine"],proteine:["proteine"],energie:["energie"],fruit:["fruit"],legume:["legume"],boisson:["laitage"]};
    const item = P.food[id];
    return Object.entries(P.food).filter(([key,food]) => key !== id && state.stock[key] && categories[item.cat]?.includes(food.cat))
      .sort(([,a],[,b]) => Math.abs(a.p - item.p) - Math.abs(b.p - item.p)).slice(0,2).map(([,food]) => food.n);
  }

  function mealOption(plan, active, best) {
    const nutrient = P.sums(plan.items);
    const absent = P.missing(plan,state.stock);
    const price = P.cost(plan,state.prices);
    return `<article class="card option ${active ? "selected" : ""}">
      <div class="row">${tag("Plan " + plan.plan,active ? "" : "neutral")}${availability(absent.length)}</div>
      <h3>${plan.name}</h3>
      <p>${Math.round(nutrient.kcal)} kcal · ${Math.round(nutrient.protein)} g de protéines <span class="muted">(estimés)</span></p>
      ${price === null ? "" : `<p>${priceText(price)}${best ? " · Le moins cher de tes plans disponibles" : ""}</p>`}
      <ul class="list ingredients">${Object.entries(plan.items).map(([id,quantity]) => {
        const suggestions = !state.stock[id] ? alternatives(id) : [];
        return `<li>
          <span class="${state.stock[id] ? "" : "absent"}">${quantity} × ${esc(P.food[id].n)}</span>
          ${suggestions.length ? `<p>Remplacements possibles · ${suggestions.map(esc).join(" ou ")}</p>` : ""}
        </li>`;
      }).join("")}</ul>
      <button class="btn compact ${active ? "secondary" : ""}" type="button" data-do="meal-plan" data-value="${plan.id}" aria-pressed="${active}">
        ${active ? "Plan retenu" : "Choisir le plan " + plan.plan}
      </button>
    </article>`;
  }

  function foodView() {
    const meal = P.meals[ui.meal];
    const plan = J.planOf(state,ui.mealDate,ui.meal);
    const best = J.recommended(state,ui.meal);
    const total = P.mealKeys.map(key => P.sums(J.planOf(state,ui.mealDate,key).items))
      .reduce((sum,option) => ({kcal:sum.kcal + option.kcal,protein:sum.protein + option.protein}), {kcal:0,protein:0});
    const logged = !!state.mealLogs[ui.mealDate + "-" + ui.meal];
    const none = meal.plans.every(item => P.missing(item,state.stock).length);
    return `${headers("Mes repas", "Choisis A, B ou C selon ce que tu trouves à l’épicerie et au marché. Le choix est enregistré pour la date affichée.")}
    <div class="stack">
      <section class="card">
        <div class="card-heading"><h2>Menus du ${date(ui.mealDate,{month:"long"})}</h2>
          <label><span class="label">Date des repas</span><input class="field date-control" type="date" value="${ui.mealDate}" max="${P.today()}" data-input="meal-date"></label>
        </div>
        <div class="segment" aria-label="Repas à afficher">
          ${P.mealKeys.map(key => `<button type="button" data-do="meal" data-value="${key}" aria-pressed="${ui.meal === key}">${P.meals[key].name}${state.mealLogs[ui.mealDate + "-" + key] ? " ✓" : ""}</button>`).join("")}
        </div>
        <div class="row between spaced">
          <p class="small">Total prévu pour la journée · ${Math.round(total.kcal)} kcal · ${Math.round(total.protein)} g de protéines estimés</p>
          <button class="btn secondary compact" type="button" data-page="stock">Actualiser le placard</button>
        </div>
      </section>
      <section class="stack" aria-label="Plans pour le repas sélectionné">
        <h2>${meal.name}</h2>
        ${none ? '<p class="note">Il manque au moins un ingrédient dans chaque plan. Regarde les remplacements proposés ou actualise ton placard.</p>' : ""}
        <div class="triplet meal-options">${meal.plans.map(option => mealOption(option,option.id === plan.id,option.id === best?.id)).join("")}</div>
        <div class="card row between">
          <label class="checkbox"><input type="checkbox" data-input="meal-log" ${checked(logged)}> J’ai pris ce repas</label>
          <span class="small muted">Plan ${plan.plan} · ${esc(plan.name)}</span>
        </div>
      </section>
      <section class="card">
        <h2>Le goûter supplémentaire</h2>
        <p>Commence par un goûter en plus chaque jour. Si tu prends déjà un goûter, enrichis-le ou augmente un peu ta portion au déjeuner.</p>
        <p>Si tu n’as que du pain beurre, des biscuits ou du café à l’épicerie, prends le goûter disponible. Complète dès que possible avec du lait, du yaourt, des œufs ou du tsaramaso au repas suivant.</p>
        <p class="small">Pour une prise de poids graduelle, le NHS propose d’essayer environ 300 à 500 kcal de plus par jour que ton alimentation habituelle. <a href="${P.sources.weight}" target="_blank" rel="noopener noreferrer">Conseils du NHS</a></p>
      </section>
    </div>`;
  }

  function stockView() {
    const products = Object.entries(P.food);
    const plans = P.mealKeys.map(meal => J.planOf(state,ui.mealDate,meal));
    const missingItems = new Set(plans.flatMap(plan => P.missing(plan,state.stock)));
    const costs = plans.map(plan => P.cost(plan,state.prices));
    return `${headers("Placard et prix", "Décoche les produits que tu ne peux pas trouver. Quand le plan habituel manque d’ingrédients, Tanjaka cherche un autre plan complet.")}
    <div class="stack">
      <section class="card">
        <div class="card-heading"><h2>Aliments disponibles</h2><div class="row">
          <button class="btn secondary compact" type="button" data-do="stock-all" data-value="on">Tout cocher</button>
          <button class="btn secondary compact" type="button" data-do="stock-all" data-value="off">Tout décocher</button>
        </div></div>
        <div class="stock-grid">${products.map(([id,item]) => `<label class="checkbox"><input type="checkbox" data-input="stock" data-id="${id}" ${checked(state.stock[id])}> ${item.n}</label>`).join("")}</div>
      </section>
      <section class="card">
        <div class="card-heading"><h2>À trouver pour le ${date(ui.mealDate,{month:"long"})}</h2></div>
        ${missingItems.size ? `<ul class="list">${[...missingItems].map(id => `<li>${P.food[id].n}</li>`).join("")}</ul>` : "<p>Tous les ingrédients des plans sélectionnés sont cochés.</p>"}
        <div class="row spaced"><button class="btn secondary" type="button" data-page="food">Retour aux repas</button></div>
      </section>
      <section class="card">
        <h2>Mes prix en ariary</h2><p>Indique le prix de la portion affichée pour comparer les plans réalisables.</p>
        <div class="triplet responsive-split spaced">${products.map(([id,item]) => `<label><span class="label">${item.n} · Ar</span>
          <input class="field" type="number" inputmode="numeric" min="0" max="10000000" step="1" value="${state.prices[id] ?? ""}" data-input="price" data-id="${id}" placeholder="Prix inconnu"></label>`).join("")}</div>
        <p class="spaced" id="price-total">${costSummary(costs)}</p>
        <div class="row spaced"><button class="btn" type="button" data-do="best-plans">Choisir les plans disponibles les moins chers</button></div>
      </section>
    </div>`;
  }
  function costSummary(costs) {
    return costs.some(value => value === null) ? "Coût de la journée · prix manquants" : "Coût de la journée · " + priceText(costs.reduce((a,b) => a + b,0));
  }

  function weightChart(weeks) {
    if (!weeks.length) return "<p>Ajoute une pesée pour voir ta moyenne de la semaine.</p>";
    const first = weeks[0].week;
    const span = P.distance(first,weeks.at(-1).week);
    const values = weeks.map(item => item.value);
    const lo = Math.min(...values) - 0.2;
    const hi = Math.max(...values) + 0.2;
    const points = weeks.map(item => [span ? 50 + 425 * P.distance(first,item.week) / span : 262.5, 135 - 112 * (item.value - lo) / (hi - lo)]);
    return `<svg class="chart" viewBox="0 0 500 165" role="img" aria-label="Moyennes hebdomadaires du poids en kilogrammes">
      ${[0,0.5,1].map(t => {
        const y = 135 - 112 * t;
        return `<path d="M50 ${y} H475" stroke="#2b464e"/><text x="2" y="${y + 4}" font-size="12" fill="#a9c1c2">${weight(lo + t * (hi - lo))}</text>`;
      }).join("")}
      <polyline points="${points.map(point => point.join(",")).join(" ")}" fill="none" stroke="#8aebc3" stroke-width="3" stroke-linejoin="round"/>
      ${points.map(([x,y],i) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#8aebc3"><title>Semaine du ${date(weeks[i].week)} · ${weight(weeks[i].value)} kg</title></circle>`).join("")}
      <text x="${span ? 50 : 262.5}" y="157" text-anchor="${span ? "start" : "middle"}" font-size="12" fill="#a9c1c2">${date(first)}</text>
      ${span ? `<text x="475" y="157" text-anchor="end" font-size="12" fill="#a9c1c2">${date(weeks.at(-1).week)}</text>` : ""}
    </svg>`;
  }

  function review(weeks) {
    const a = weeks.find(item => item.week === "2026-11-16");
    const b = weeks.find(item => item.week === "2026-11-23");
    const measured = a?.count >= 2 && b?.count >= 2;
    const text = measured ? `16–22 novembre · ${weight(a.value)} kg de moyenne. 23–29 novembre · ${weight(b.value)} kg de moyenne.` :
      "Pour ce bilan, prends deux pesées entre le 16 et le 22 novembre, puis deux entre le 23 et le 29 novembre.";
    return `<div class="note spaced">
      <p><strong class="accent">Bilan du 30 novembre</strong> · ${text}</p>
      <p class="small">Si ton poids moyen reste stable malgré un goûter supplémentaire régulier, ajoute une petite portion quotidienne, par exemple un peu plus de riz ou un verre de lait.</p>
    </div>`;
  }

  function sessionHistory() {
    const current = Object.entries(state.sessions).filter(([,session]) => session.complete ||
      Object.values(session.exercises).some(item => item.done || item.rows.some(row => row.a !== null || row.b !== null)));
    const dates = new Map();
    for (const [key, value] of Object.entries(state.workLogs)) {
      if (value) dates.set(key.slice(0,10),(dates.get(key.slice(0,10)) ?? 0) + 1);
    }
    if (!current.length && !dates.size) return "<p>Tes séries et tes variantes apparaîtront ici après ta première saisie.</p>";
    const entries = current.sort(([a],[b]) => b.localeCompare(a)).map(([key,session]) => {
      const [day,kind] = key.split("|");
      const entries = P.exercises[kind].map(exercise => {
        const entry = session.exercises[exercise.id];
        if (!entry) return "";
        const rows = entry.rows.map((row,i) => {
          const suffix = exercise.seconds ? " s" : "";
          if (row.a === null && row.b === null) return "";
          return exercise.side ? `S${i + 1} · G ${row.a ?? "—"} / D ${row.b ?? "—"}` : `S${i + 1} · ${row.a ?? "—"}${suffix}`;
        }).filter(Boolean);
        return rows.length || entry.done ? `<li><strong>${exercise.name}</strong> · ${esc(entry.variant)}${rows.length ? " · " + rows.join(" | ") : " · Coché"}</li>` : "";
      }).join("");
      return `<li><details><summary>${dateFull(day)} · Séance ${kind} · ${session.complete ? "Terminée" : "En cours"}</summary>
        ${entries ? `<ul>${entries}</ul>` : "<p class='small'>Séance cochée.</p>"}
        <button class="btn secondary compact spaced" type="button" data-do="resume" data-value="${key}">Ouvrir</button></details></li>`;
    }).join("");
    const previous = [...dates].sort(([a],[b]) => b.localeCompare(a)).map(([day,count]) => `<li class="small">${dateFull(day)} · ${count} exercice(s) coché(s) dans l’ancienne version</li>`).join("");
    return `<ul class="list history">${entries}${previous}</ul>`;
  }

  function track() {
    const weeks = J.weeklyWeights(state.weights);
    const weights = [...state.weights].sort((a,b) => b.date.localeCompare(a.date));
    const measures = [...state.measures].sort((a,b) => b.date.localeCompare(a.date));
    const unitLabels = {arm:"Tour de bras",chest:"Tour de poitrine",waist:"Tour de taille"};
    return `${headers("Suivi", "Pèse-toi deux matins par semaine, après être allé aux toilettes et avant de manger. Compare les moyennes et garde un œil sur tes répétitions.")}
    <div class="stack">
      <section class="card">
        <div class="card-heading"><h2>Évolution du poids</h2><span class="small muted">Départ · ${weight(state.weight)} kg · Objectif à terme · ${weight(state.target)} kg</span></div>
        ${weightChart(weeks)}
        ${weeks.length ? `<div class="table-wrap"><table aria-label="Moyennes hebdomadaires"><thead><tr><th>Semaine du</th><th>Pesées</th><th>Moyenne</th></tr></thead>
          <tbody>${weeks.map(item => `<tr><td>${dateFull(item.week)}</td><td>${item.count}</td><td><strong>${weight(item.value)} kg</strong></td></tr>`).join("")}</tbody></table></div>` : ""}
        ${review(weeks)}
      </section>
      <div class="split responsive-split">
        <section class="card" id="weigh-card">
          <h2>Ajouter une pesée</h2>
          <form data-form="weight" class="spaced">
            <div class="split">
              <label><span class="label">Date</span><input class="field" type="date" name="date" value="${P.today()}" max="${P.today()}" required></label>
              <label><span class="label">Poids (kg)</span><input class="field" id="weight-field" type="number" inputmode="decimal" name="value" min="25" max="250" step="0.1" placeholder="${J.latestWeight(state)}" required></label>
            </div>
            <div class="row"><button class="btn" type="submit">Enregistrer la pesée</button></div>
          </form>
          <ul class="list spaced">${weights.map(item => `<li class="row between"><span>${dateFull(item.date)}</span><strong>${weight(item.value)} kg</strong></li>`).join("")}</ul>
        </section>
        <section class="card">
          <h2>Mes mensurations</h2>
          <p class="small">Reprends-les dans les mêmes conditions, environ une fois par mois.</p>
          <form data-form="measure" class="spaced">
            <div class="split">
              <label><span class="label">Date</span><input class="field" type="date" name="date" value="${P.today()}" max="${P.today()}" required></label>
              ${Object.entries(unitLabels).map(([key,label]) => `<label><span class="label">${label} (cm)</span>
                <input class="field" type="number" inputmode="decimal" name="${key}" min="1" max="250" step="0.1"></label>`).join("")}
            </div>
            <div class="row"><button class="btn" type="submit">Enregistrer les mesures</button></div>
          </form>
          <ul class="list spaced">${measures.map(item => `<li><strong>${dateFull(item.date)}</strong>
            <p class="small">${Object.entries(unitLabels).filter(([key]) => item[key] != null).map(([key,label]) => label + " " + weight(item[key]) + " cm").join(" · ")}</p></li>`).join("")}</ul>
        </section>
      </div>
      <section class="card"><h2>Historique des séances</h2><div class="spaced">${sessionHistory()}</div></section>
    </div>`;
  }

  function settings() {
    return `${headers("Paramètres et sauvegarde", "Ton journal est enregistré dans ce navigateur. Exporte-le pour le retrouver sur un autre téléphone ou ordinateur.")}
    <div class="stack">
      <section class="card">
        <h2>Mon profil</h2>
        <form data-form="profile" class="spaced">
          <div class="triplet responsive-split">
            <label><span class="label">Taille (cm)</span><input class="field" type="number" name="height" min="100" max="230" value="${state.height}" required></label>
            <label><span class="label">Poids de départ (kg)</span><input class="field" type="number" name="weight" min="25" max="250" step="0.1" value="${state.weight}" required></label>
            <label><span class="label">Poids visé à terme (kg)</span><input class="field" type="number" name="target" min="30" max="200" step="0.1" value="${state.target}" required></label>
          </div>
          <div class="row"><button class="btn" type="submit">Enregistrer le profil</button></div>
        </form>
      </section>
      <section class="card">
        <h2>Mes données</h2>
        <p>Si tu as utilisé l’ancienne application Tanjaka, exporte sa sauvegarde JSON puis importe-la ici. Les pesées déjà saisies ici sont gardées si les dates se recoupent. Le profil et le placard reprennent les valeurs de la sauvegarde.</p>
        <div class="row spaced">
          <button class="btn" type="button" data-do="export">Exporter une sauvegarde JSON</button>
          <button class="btn secondary" type="button" data-do="import">Importer une sauvegarde JSON</button>
          <input type="file" id="import-file" accept=".json,application/json" data-input="import" hidden>
          <button class="btn secondary" type="button" data-do="csv">Exporter les pesées CSV</button>
        </div>
      </section>
      <section class="card">
        <h2>Repères du programme</h2>
        <p>Les calories et protéines varient avec la taille des portions et les recettes. Pour le renforcement et la prise de poids progressive, retrouve les recommandations utilisées pour ce programme.</p>
        <ul class="list spaced">
          <li><a href="${P.sources.training}" target="_blank" rel="noopener noreferrer">ACSM · Renforcement musculaire</a></li>
          <li><a href="${P.sources.weight}" target="_blank" rel="noopener noreferrer">NHS · Prise de poids progressive</a></li>
        </ul>
      </section>
    </div>`;
  }


  const views = {home,work:workout,food:foodView,stock:stockView,track,settings};
  const byId = id => document.getElementById(id);
  const content = byId("contenu");
  function render() {
    byId("sidebar").innerHTML = pages.map(page => navButton(page,false)).join("");
    byId("bottom-nav").innerHTML = pages.slice(0,5).map(page => navButton(page,true)).join("");
    const preferences = byId("settings-button");
    preferences.toggleAttribute("aria-current",ui.page === "settings");
    if (ui.page === "settings") preferences.setAttribute("aria-current","page");
    content.innerHTML = views[ui.page]();
    document.title = pages.find(page => page[0] === ui.page)[1] + " · Tanjaka";
  }

  function go(page) {
    ui.page = page;
    render();
    window.scrollTo(0,0);
    content.focus({preventScroll:true});
  }
  function notify(message) {
    const notice = byId("toast");
    clearTimeout(ui.toast);
    notice.textContent = message;
    notice.hidden = false;
    ui.toast = setTimeout(() => { notice.hidden = true; }, 3200);
  }
  function persist() {
    try { J.save(state); return true; }
    catch { notify("Le navigateur n’a pas enregistré ce changement. Exporte une sauvegarde depuis les paramètres."); return false; }
  }
  function selectWorkout(key, type = P.schedule[key] ?? ui.kind) {
    ui.workDate = key;
    ui.kind = type;
    const week = P.weeks.indexOf(P.weekOf(key));
    if (week !== -1) ui.week = week;
    ui.open.clear();
  }
  function editSession() {
    const key = J.workoutKey(ui.workDate,ui.kind);
    return state.sessions[key] ??= J.emptySession();
  }
  function editExercise(id) {
    const exercise = P.exercises[ui.kind].find(item => item.id === id);
    const session = editSession();
    return session.exercises[id] ??= J.exerciseOf(state,ui.workDate,ui.kind,exercise);
  }
  function updateWorkoutStatus() {
    byId("checked-count").textContent = exerciseCount() + " sur " + P.exercises[ui.kind].length + " exercices cochés";
    byId("finish-session").disabled = ui.workDate > P.today() || (!editSession().complete && !canFinish());
  }
  function setMealPlan(meal, plan) {
    state.dayMeals[ui.mealDate] ??= {};
    state.dayMeals[ui.mealDate][meal] = plan.id;
    const key = ui.mealDate + "-" + meal;
    if (state.mealLogs[key]) state.mealLogs[key] = plan.id;
  }
  function refreshTimer() {
    const timer = byId("timer-value");
    if (timer) timer.textContent = timerText();
    const button = byId("timer-start");
    if (button) button.textContent = ui.timerEnd ? "Pause" : "Démarrer";
  }
  function stopTimer() {
    clearInterval(ui.timerInterval);
    ui.timerEnd = 0;
  }
  function tick() {
    ui.timerLeft = Math.max(0,Math.ceil((ui.timerEnd - Date.now()) / 1000));
    if (!ui.timerLeft) {
      stopTimer();
      notify("Repos terminé");
    }
    refreshTimer();
  }
  function toggleTimer() {
    if (ui.timerEnd) {
      ui.timerLeft = Math.max(0,Math.ceil((ui.timerEnd - Date.now()) / 1000));
      stopTimer();
    } else {
      if (!ui.timerLeft) ui.timerLeft = ui.timerDuration;
      ui.timerEnd = Date.now() + ui.timerLeft * 1000;
      ui.timerInterval = setInterval(tick,200);
    }
    refreshTimer();
  }
  function download(name, data, type) {
    const url = URL.createObjectURL(new Blob([data],{type}));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  }

  const actions = {
    "open-next"() {
      const next = P.nextDate() ?? P.today();
      selectWorkout(next,P.schedule[next] ?? "A");
      go("work");
    },
    weigh() {
      go("track");
      byId("weight-field").focus();
    },
    snack() {
      ui.mealDate = P.today();
      ui.meal = "gouter";
      go("food");
    },
    "open-meal"(value) {
      ui.mealDate = P.today();
      ui.meal = value;
      go("food");
    },
    week(value) {
      ui.week = Math.max(0,Math.min(P.weeks.length - 1,ui.week + Number(value)));
      render();
    },
    "pick-date"(value) {
      selectWorkout(value);
      render();
    },
    kind(value) {
      selectWorkout(ui.workDate,value);
      render();
    },
    resume(value) {
      selectWorkout(...value.split("|"));
      go("work");
    },
    finish() {
      if (ui.workDate > P.today()) return;
      const session = editSession();
      if (!session.complete && !canFinish()) return;
      session.complete = !session.complete;
      const saved = persist();
      render();
      if (saved) notify(session.complete ? "Séance enregistrée" : "Séance rouverte");
    },
    "timer-toggle":toggleTimer,
    "timer-set"(value) {
      stopTimer();
      ui.timerDuration = ui.timerLeft = Number(value);
      refreshTimer();
    },
    meal(value) {
      ui.meal = value;
      render();
    },
    "meal-plan"(value) {
      const plan = P.findRecipe(ui.meal,value);
      if (!plan) return;
      setMealPlan(ui.meal,plan);
      const saved = persist();
      render();
      if (saved) notify("Plan " + plan.plan + " retenu");
    },
    "stock-all"(value) {
      for (const key of Object.keys(state.stock)) state.stock[key] = value === "on";
      persist();
      render();
    },
    "best-plans"() {
      let count = 0;
      for (const meal of P.mealKeys) {
        if (state.mealLogs[ui.mealDate + "-" + meal]) continue;
        const plan = J.recommended(state,meal);
        if (plan) {
          setMealPlan(meal,plan);
          count++;
        }
      }
      const saved = persist();
      render();
      if (saved) notify(count ? count + " plan(s) sélectionné(s) selon tes prix" : "Ajoute les prix des ingrédients des plans disponibles pour les comparer.");
    },
    export() { download("tanjaka-sauvegarde-" + P.today() + ".json",JSON.stringify(state,null,2),"application/json"); },
    import() { byId("import-file").click(); },
    csv() {
      const lines = [...state.weights].sort((a,b) => a.date.localeCompare(b.date)).map(item => item.date + "," + item.value);
      download("tanjaka-pesees.csv","date,poids_kg\n" + lines.join("\n"),"text/csv;charset=utf-8");
    }
  };

  async function importFile(field) {
    const file = field.files[0];
    if (!file) return;
    try {
      if (file.size > 5000000) throw new Error("Le fichier dépasse 5 Mo.");
      const next = J.mergeBackup(state,JSON.parse(await file.text()));
      state = next;
      const saved = persist();
      render();
      if (saved) notify("Sauvegarde importée");
    } catch (error) {
      notify(error instanceof SyntaxError ? "Le fichier JSON est illisible." : error.message);
      field.value = "";
    }
  }

  const changes = {
    "work-date"(field) {
      if (!J.validDate(field.value) || !field.validity.valid) { field.value = ui.workDate; return; }
      selectWorkout(field.value);
      render();
    },
    "meal-date"(field) {
      if (!J.validDate(field.value) || field.value > P.today()) { field.value = ui.mealDate; return; }
      ui.mealDate = field.value;
      render();
    },
    extra(field) {
      editSession().extra = field.checked;
      persist();
      render();
    },
    exercise(field) {
      editExercise(field.dataset.id).done = field.checked;
      persist();
      updateWorkoutStatus();
    },
    variant(field) {
      editExercise(field.dataset.id).variant = field.value;
      persist();
      render();
    },
    "meal-log"(field) {
      const key = ui.mealDate + "-" + ui.meal;
      if (field.checked) state.mealLogs[key] = J.planOf(state,ui.mealDate,ui.meal).id;
      else delete state.mealLogs[key];
      persist();
      render();
    },
    stock(field) {
      state.stock[field.dataset.id] = field.checked;
      persist();
      render();
    },
    price(field) {
      const parsed = J.number(field.value,0,10000000);
      if (!field.validity.valid) return;
      if (parsed === null) delete state.prices[field.dataset.id];
      else state.prices[field.dataset.id] = parsed;
      persist();
      const costs = P.mealKeys.map(meal => P.cost(J.planOf(state,ui.mealDate,meal),state.prices));
      byId("price-total").textContent = costSummary(costs);
    },
    import:importFile
  };

  function addWeight(data) {
    const key = data.get("date");
    const value = J.number(data.get("value"),25,250);
    if (!J.validDate(key) || key > P.today() || value === null) return false;
    state.weights = [...state.weights.filter(item => item.date !== key),{date:key,value}];
    return true;
  }
  function addMeasure(data) {
    const key = data.get("date");
    if (!J.validDate(key) || key > P.today()) return false;
    const entry = {date:key};
    for (const key of ["arm","chest","waist"]) {
      const value = J.number(data.get(key),1,250);
      if (value !== null) entry[key] = value;
    }
    if (Object.keys(entry).length === 1) return false;
    const previous = state.measures.findLast(item => item.date === key);
    state.measures = [...state.measures.filter(item => item.date !== key),{...previous,...entry}];
    return true;
  }
  function updateProfile(data) {
    const height = J.number(data.get("height"),100,230);
    const weight = J.number(data.get("weight"),25,250);
    const target = J.number(data.get("target"),30,200);
    if (height === null || weight === null || target === null) return false;
    Object.assign(state,{height,weight,target});
    return true;
  }
  const forms = {
    weight:[addWeight,"Pesée enregistrée","Vérifie la date et le poids."],
    measure:[addMeasure,"Mensurations enregistrées","Saisis au moins une mensuration."],
    profile:[updateProfile,"Profil enregistré","Vérifie les valeurs du profil."]
  };

  document.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (button.dataset.page) go(button.dataset.page);
    else actions[button.dataset.do]?.(button.dataset.value);
  });
  document.addEventListener("change", event => {
    const field = event.target;
    if (!field.disabled) changes[field.dataset?.input]?.(field);
  });
  document.addEventListener("input", event => {
    const field = event.target;
    if (field.disabled || field.dataset?.input !== "rep") return;
    const value = J.repValue(field.value);
    if (field.validity.badInput || (field.value !== "" && value === null)) {
      field.setAttribute("aria-invalid","true");
      return;
    }
    field.removeAttribute("aria-invalid");
    const item = editExercise(field.dataset.id);
    const index = Number(field.dataset.set);
    const row = item.rows[index] ??= {a:null,b:null};
    row[field.dataset.side] = value;
    persist();
    updateWorkoutStatus();
  });
  document.addEventListener("submit", event => {
    const setup = forms[event.target.dataset.form];
    if (!setup) return;
    event.preventDefault();
    const [apply,success,failure] = setup;
    if (!apply(new FormData(event.target))) { notify(failure); return; }
    const saved = persist();
    render();
    if (saved) notify(success);
  });
  document.addEventListener("toggle", event => {
    const field = event.target;
    if (!field.dataset?.exercise || !field.isConnected) return;
    if (field.open) ui.open.add(field.dataset.exercise);
    else ui.open.delete(field.dataset.exercise);
  },true);

  function updateNetwork() { byId("network").hidden = navigator.onLine !== false; }
  window.addEventListener("online",updateNetwork);
  window.addEventListener("offline",updateNetwork);
  byId("settings-button").innerHTML = icon("settings");
  updateNetwork();
  render();
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol) && document.querySelector('link[rel="manifest"]')) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
})();


