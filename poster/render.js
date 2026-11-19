const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:794,height:1123},deviceScaleFactor:3.125});
await p.goto('file://'+process.cwd()+'/poster.html');await p.waitForTimeout(1500);
await p.screenshot({path:'starfish_poster_A4.png'});await p.pdf({path:'starfish_poster_A4.pdf',format:'A4',printBackground:true});await b.close();})();
