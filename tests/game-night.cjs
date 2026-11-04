"use strict";
const assert = require("node:assert/strict");
const {webkit, chromium} = require("playwright");
(async () => {
 for (const engine of [webkit, chromium]) {
 const b = await engine.launch();
 try {
 const mobile = engine === webkit;
 const p = await b.newPage({ viewport: {width: mobile ? 375 : 1200, height: 850}, hasTouch: mobile });
 p.setDefaultTimeout(4500);
 const errors=[]; p.on("pageerror", err=>{errors.push(err.message);console.error(err)});
 await p.goto(process.env.GAME_URL || "http://localhost:8080", {waitUntil:"domcontentloaded"});
 await p.locator("#empty-create-btn").click();
 await p.getByText("Explore sponsors", {exact:true}).click();
 const option = p.getByRole("button",{name:"Rutherford",exact:true});
 if(mobile) await option.tap(); else await option.hover();
 assert.ok(await p.getByText("Military Hardware",{exact:true}).isVisible());
 assert.ok(!await p.getByText("Current sponsor: Rutherford",{exact:true}).count());
 await p.getByRole("button",{name:"Choose Rutherford"}).click();
 await p.getByLabel("Add vehicle",{exact:true}).selectOption("Car");
 await p.getByRole("button",{name:"Race day",exact:true}).click();
 await p.getByRole("button",{name:"Add hazard"}).click();
 await p.reload(); await p.getByRole("button",{name:"Race day",exact:true}).click();
 assert.equal(await p.locator('[data-counter="hazard"] output').innerText(),"1");
 const pending=p.waitForEvent("popup");
 await p.getByRole("button",{name:"Print dashboard inserts"}).click();
 const popup=await pending;
 const rect=await popup.locator("article").first().boundingBox();
 assert.ok(Math.abs(rect.width-576)<1 && Math.abs(rect.height-384)<1);
 await popup.close();
 await p.getByRole("button",{name:"Season log",exact:true}).click();
 await p.getByLabel("Event or result").fill("Round 1: Street Race");
 await p.getByRole("button",{name:"Save entry"}).click();
 assert.ok(await p.getByText("Round 1: Street Race",{exact:true}).isVisible());
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 console.log(engine.name()+" passed");
 } finally {await b.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});

