import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import vm from "node:vm";
import assert from "node:assert/strict";
import {chromium} from "playwright";
await (async function verify(){
  const root=process.cwd(),index=fs.readFileSync("index.html","utf8");
  const jsName=index.match(/<script src="\.\/([^"]+)"/)[1],js=fs.readFileSync(jsName,"utf8");
  const marker='(function tanjakaApp()';
  const core=js.slice(0,js.indexOf(marker));
  assert(core.length>15000,"Core boundary");
  const fixture={version:2,height:168,weight:65,target:75,recipes:{matin:"mC",midi:"dA",gouter:"gB",soir:"sC"},stock:{lait:false,yaourt:true},prices:{pain:700,yaourt:1000},weights:[{date:"2026-11-16",value:65},{date:"2026-11-18",value:65.3}],measures:[{date:"2026-11-16",arm:29,chest:90}],dayMeals:{"2026-11-18":{gouter:"gB"}},mealLogs:{"2026-11-18-gouter":"gB"},workLogs:{"2026-11-13-pomp":true},sessions:{"2026-11-13|A":{complete:true,extra:false,exercises:{pomp:{done:true,variant:"Mur",rows:[{a:6,b:null},{a:6,b:null}]}}},"2026-11-16|A":{complete:true,extra:false,exercises:{pomp:{done:true,variant:"Mur",rows:[{a:8,b:null},{a:7,b:null}]}}}}};
  function getCore(source,seed){
    const sandbox={window:{},localStorage:{getItem:()=>JSON.stringify(seed),setItem(){}}};
    vm.runInNewContext(source,sandbox);
    return sandbox.window;
  }
  const oldJs=fs.readFileSync("tanjaka.99591d964be1.js","utf8").replace(/\r\n/g,"\n");
  const oldCore=oldJs.slice(0,oldJs.indexOf('(() => {\n  "use strict";\n\n  const P = window.Tanjaka;'));
  for(const f of [fixture,{version:1,recipes:{gouter:"gC"},weights:[{date:"2026-11-17",value:66}],mealLogs:{"2026-11-17-gouter":true},workLogs:{"2026-11-13-pomp":true}},null]){
    const a=JSON.parse(JSON.stringify(getCore(oldCore,f).TanjakaJournal.load()));
    const b=JSON.parse(JSON.stringify(getCore(core,f).TanjakaJournal.load()));
    delete b.warmups;delete b.why;delete b.appearance;
    assert.deepEqual(b,a,"Existing journal fields must survive normalization");
  }
  const model=getCore(core,fixture),current=model.TanjakaJournal.load();
  current.warmups={"2026-11-19":true};current.why="Ma force";current.appearance="dark";
  const merged=model.TanjakaJournal.mergeBackup(current,{version:1,recipes:{gouter:"gA"},weights:[{date:"2026-11-18",value:99},{date:"2026-11-17",value:66}]});
  assert.equal(merged.weights.find(w=>w.date==="2026-11-18").value,65.3);
  assert(merged.weights.some(w=>w.date==="2026-11-17"));
  assert(merged.sessions["2026-11-16|A"].complete);
  assert(merged.warmups["2026-11-19"]);assert.equal(merged.why,"Ma force");assert.equal(merged.appearance,"dark");
  console.log("PASS Journal v1/v2, merge, profile, weights, measurements and session history.");
  const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".webmanifest":"application/manifest+json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".svg":"image/svg+xml",".ttf":"font/ttf",".txt":"text/plain"};
  const server=http.createServer((req,res)=>{
    try{
      const url=new URL(req.url,"http://localhost"),relative=decodeURIComponent(url.pathname).replace(/^\/tanjaka\//,"");
      let file=path.resolve(root,relative||"index.html");
      if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
      if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,"index.html");
      if(!fs.existsSync(file)){res.writeHead(404).end("Missing "+relative);return;}
      res.writeHead(200,{"Content-Type":mime[path.extname(file)]??"application/octet-stream","Cache-Control":"no-cache"});
      res.end(fs.readFileSync(file));
    }catch(error){res.writeHead(500).end(error.message);}
  });
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const url="http://127.0.0.1:"+server.address().port+"/tanjaka/";
  const browser=await chromium.launch({headless:true,args:["--no-sandbox"]}),errors=[],badResponses=[];
  const shots=[];
  async function open(day="2026-11-19",seed=fixture,width=1280){
    const context=await browser.newContext({viewport:{width,height:1000},locale:"fr-FR",timezoneId:"Indian/Antananarivo"});
    await context.addInitScript(seed=>{
      if(!sessionStorage.getItem("tanjaka-qa-seeded")){
        if(seed)localStorage.setItem("tanjaka-2026-v1",JSON.stringify(seed));
        sessionStorage.setItem("tanjaka-qa-seeded","yes");
      }
    },seed);
    const page=await context.newPage();
    page.on("pageerror",error=>errors.push(error.message));
    page.on("response",response=>{if(response.url().startsWith(url)&&response.status()>=400)badResponses.push([response.status(),response.url()]);});
    await page.clock.install({time:new Date(day+"T09:00:00Z")});
    await page.goto(url,{waitUntil:"networkidle"});
    await page.evaluate(()=>document.fonts.ready);
    return {page,context};
  }
  const readState=page=>page.evaluate(()=>JSON.parse(localStorage.getItem("tanjaka-2026-v1")));
  async function go(page,name){await page.locator('[data-page="'+name+'"]:visible').first().click();}
  async function action(page,name){await page.locator('[data-do="'+name+'"]:visible').first().click();}
  async function layout(page,label){
    await page.locator('img:not([loading="lazy"])').evaluateAll(images=>Promise.all(images.map(image=>image.decode().catch(()=>{}))));
    const metrics=await page.evaluate(()=>{
      const visible=[...document.querySelectorAll("button,input,select")].filter(el=>el.getClientRects().length&&!el.closest("[hidden]"));
      return {width:innerWidth,scroll:document.documentElement.scrollWidth,controls:visible.filter(el=>{const r=el.getBoundingClientRect();return r.left<-.6||r.right>innerWidth+.6;}).map(el=>el.outerHTML.slice(0,180)),font:document.fonts.check("800 24px Barlow"),images:[...document.images].filter(i=>i.loading!=="lazy").every(i=>i.complete&&i.naturalWidth>0)};
    });
    assert(metrics.scroll<=metrics.width+1,label+" horizontal overflow "+JSON.stringify(metrics));
    assert.deepEqual(metrics.controls,[],label+" clipped controls");
    assert(metrics.font,label+" display font");
    assert(metrics.images,label+" broken images");
  }
  try{
    const design=await open();
    assert((await design.page.locator(".cover-description").innerText()).includes("récupères"),"Rest day home");
    fs.mkdirSync("qa/screenshots",{recursive:true});
    const desktop=await design.page.screenshot({path:"qa/screenshots/home-desktop.jpg",type:"jpeg",quality:65});
    console.log("TANJAKA_SCREENSHOT_DESKTOP="+desktop.toString("base64"));
    await design.page.setViewportSize({width:390,height:1100});
    const mobile=await design.page.screenshot({path:"qa/screenshots/home-mobile.jpg",type:"jpeg",quality:65});
    console.log("TANJAKA_SCREENSHOT_MOBILE="+mobile.toString("base64"));
    await design.page.setViewportSize({width:1280,height:1000});

    for(const appearance of ["light","dark"]){
      await go(design.page,"settings");
      await design.page.locator('[data-input="appearance"]').selectOption(appearance);
      for(const width of [320,390,768,1280]){
        await design.page.setViewportSize({width,height:1000});
        for(const pageName of ["home","work","food","track","stock","settings"]){
          await go(design.page,pageName);await layout(design.page,appearance+" "+width+" "+pageName);
        }
      }
    }

    const untouched=await readState(design.page);
    assert.deepEqual(untouched.weights,fixture.weights);assert.deepEqual(untouched.measures,fixture.measures);assert(untouched.sessions["2026-11-16|A"].complete);
    console.log("PASS All six pages at 320/390/768/1280px, light and dark, assets and existing journal.");
    await design.context.close();

    const low=await open("2026-11-20",null,390);
    await action(low.page,"easy-today");await layout(low.page,"warmup mobile");
    assert.equal(await low.page.locator("#timer-value").innerText(),"05:00");
    await action(low.page,"warmup-done");await layout(low.page,"warmup decision mobile");
    await action(low.page,"warmup-stop");
    const warm=await readState(low.page);assert(warm.warmups["2026-11-20"]);assert(!warm.sessions["2026-11-20|A"]?.complete);
    console.log("PASS Warmup alone is recorded separately and never counts as a complete session.");
    await low.context.close();

    const active=await open("2026-11-20",fixture,390);
    await action(active.page,"start-today");await action(active.page,"warmup-done");
    await active.page.locator('[data-input="variant"]').selectOption("Au sol");
    await layout(active.page,"first movement mobile");
    await action(active.page,"guide-save");assert(await active.page.locator("#guide-error").isVisible(),"Missing values validation");
    await active.page.locator('[data-input="rep"]').fill("9");
    await action(active.page,"guide-save");
    await active.page.clock.fastForward(90000);
    assert.equal(await active.page.locator("#timer-value").innerText(),"00:00");
    await action(active.page,"guide-exit");await active.page.reload({waitUntil:"networkidle"});
    await active.page.locator('.resume-strip [data-do="resume"]').click();
    assert((await active.page.locator(".guide-entry .overline").innerText()).includes("2 sur 2"),"Resume at first incomplete set");
    let saved=1;
    while(saved<12){
      for(const field of await active.page.locator('[data-input="rep"]').all())await field.fill(String(saved%4+8));
      await action(active.page,"guide-save");saved++;
      if(saved<12)await action(active.page,"guide-next");
    }
    await action(active.page,"finish");
    const completed=await readState(active.page),session=completed.sessions["2026-11-20|A"];
    assert(session.complete);assert.equal(Object.keys(session.exercises).length,6);
    assert(Object.values(session.exercises).every(ex=>ex.done&&ex.rows.length===2));
    assert(session.exercises.tirage.rows.every(row=>row.a>0&&row.b>0));
    assert.equal(session.exercises.pomp.rows[0].a,9);
    await go(active.page,"track");await layout(active.page,"populated journal");
    await go(active.page,"work");await action(active.page,"guide-close");
    await active.page.locator('[data-input="work-date"]').fill("2026-11-23");await active.page.locator('[data-input="work-date"]').dispatchEvent("change");
    await action(active.page,"manual");
    for(const field of await active.page.locator('[data-input="rep"]').all())assert(await field.isDisabled());
    assert(await active.page.locator("#finish-session").isDisabled());
    console.log("PASS Twelve sets, bilateral reps, rest clock, reload/resume, complete session and future-date guard.");
    await active.context.close();

    const meal=await open("2026-11-20",null,390);await go(meal.page,"food");
    await meal.page.locator('[data-do="food-missing"][data-value="lait"]').click();
    assert((await meal.page.locator(".meal-cover-copy h2").innerText()).includes("Pain fromage"));
    await meal.page.locator('[data-do="food-missing"][data-value="yaourt"]').click();
    assert((await meal.page.locator(".meal-cover-copy h2").innerText()).includes("Mofogasy"));
    await meal.page.locator('[data-do="food-missing"][data-value="oeuf"]').click();
    assert((await meal.page.locator(".ingredient-swap").innerText()).includes("chacun des trois plans"));
    await meal.page.locator('[data-do="food-restore"][data-value="yaourt"]').click();
    await meal.page.locator('[data-do="meal-plan"][data-value="gB"]').click();
    await meal.page.locator('[data-input="meal-log"]').check();
    await meal.page.locator('[data-do="food-missing"][data-value="fromage"]').click();
    assert.equal((await readState(meal.page)).mealLogs["2026-11-20-gouter"],"gB","Keep a meal already eaten");
    await go(meal.page,"settings");
    const backup={version:1,height:168,weight:65,target:75,recipes:{gouter:"gA"},weights:[{date:"2026-11-17",value:66}]};
    await meal.page.locator("#import-file").setInputFiles({name:"legacy.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(backup))});
    await meal.page.waitForFunction(()=>JSON.parse(localStorage.getItem("tanjaka-2026-v1")).weights.length===1);
    assert.equal((await readState(meal.page)).mealLogs["2026-11-20-gouter"],"gB");
    await meal.page.locator('[data-form="why"] input').fill('<img src=x onerror="alert(1)">');
    await meal.page.locator('[data-form="why"] button').click();await go(meal.page,"home");
    assert.equal(await meal.page.locator(".personal-line img").count(),0);
    console.log("PASS Ingredient substitutions, empty pantry options, recorded-meal preservation, legacy import and escaped user text.");
    await meal.page.evaluate(()=>navigator.serviceWorker.ready);
    await meal.page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await meal.context.setOffline(true);await meal.page.reload({waitUntil:"networkidle"});
    assert(await meal.page.locator("#network").isVisible());
    await go(meal.page,"food");await layout(meal.page,"offline food");
    await meal.context.setOffline(false);
    console.log("PASS Offline reload, navigation, local fonts and images under the /tanjaka/ base path.");
    await meal.context.close();
    assert.deepEqual(errors,[],"Browser errors");assert.deepEqual(badResponses,[],"Missing resources");
    console.log("TANJAKA_RESULT="+JSON.stringify({status:"PASS",widths:[320,390,768,1280],themes:["light","dark"],pages:6,journal:"v1/v2 preserved",guidedSets:12,offline:true,browserErrors:errors.length}));

  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})();
