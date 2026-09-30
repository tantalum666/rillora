import { get as httpGet } from 'node:http';
import { get as httpsGet } from 'node:https';

// The local container probe verifies the same public chain and hostname as API
// Gateway. Never disable certificate verification to make a task look healthy.
const tlsName=process.env.API_TLS_SERVER_NAME;
const request=(tlsName?httpsGet:httpGet)({hostname:'127.0.0.1',port:Number(process.env.PORT??8080),
 path:'/health/live',timeout:4000,...(tlsName?{servername:tlsName,rejectUnauthorized:true}:{})},response=>{
 response.resume();response.on('end',()=>process.exit(response.statusCode===200?0:1));
});
request.on('timeout',()=>request.destroy());request.on('error',()=>process.exit(1));
