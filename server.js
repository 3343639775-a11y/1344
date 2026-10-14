const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const PORT = process.env.PORT || 4173;
const root = __dirname;
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg'};
function send(res,status,body,type='application/json'){res.writeHead(status,{'content-type':type});res.end(body)}
const server=http.createServer(async (req,res)=>{
  if(req.method==='POST' && req.url==='/api/chat'){
    let raw=''; for await(const chunk of req) raw+=chunk;
    try {
      const {messages=[]}=JSON.parse(raw);
      if(!process.env.OPENAI_API_KEY) return send(res,503,JSON.stringify({error:'OPENAI_API_KEY 未配置'}));
      const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',messages,temperature:.7})});
      const data=await r.text(); res.writeHead(r.status,{'content-type':'application/json'}); res.end(data);
    } catch(e){send(res,500,JSON.stringify({error:e.message}))} return;
  }
  const requested=req.url==='/'?'/index.html':req.url.split('?')[0]; const file=path.join(root,requested);
  if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()) return send(res,404,'Not found','text/plain');
  send(res,200,fs.readFileSync(file),mime[path.extname(file)]||'application/octet-stream');
});
server.listen(PORT,()=>console.log(`Studio AI running on http://localhost:${PORT}`));
