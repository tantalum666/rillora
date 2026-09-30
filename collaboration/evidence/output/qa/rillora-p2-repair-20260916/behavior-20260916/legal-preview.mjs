import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import worker from '../../../../.local-secrets/compiled-p2-20260916/legal-release-artifact/server/index.js';
const base=path.resolve('.local-secrets/compiled-p2-20260916/legal-release-artifact/client');
const mime={'.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const env={ASSETS:{fetch:async request=>{const file=path.resolve(base,'.'+decodeURIComponent(new URL(request.url).pathname));if(!file.startsWith(base+path.sep))return new Response('Not found',{status:404});try{return new Response(await fs.readFile(file),{headers:{'content-type':mime[path.extname(file)]??'application/octet-stream'}})}catch{return new Response('Not found',{status:404})}}}};
http.createServer(async(req,res)=>{try{const response=await worker.fetch(new Request('http://127.0.0.1:4265'+req.url,{method:req.method,headers:req.headers}),env,{});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end('Preview unavailable')}}).listen(4265,'127.0.0.1');
