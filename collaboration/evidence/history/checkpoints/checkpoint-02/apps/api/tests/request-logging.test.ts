import {describe,it,expect} from 'vitest';
import express from 'express';
import request from 'supertest';
import {installSecurityMiddleware} from '../src/security.js';

describe('Private request metadata stays out of runtime logs',()=>{
 it('logs status/timing but not callbacks, invitation identifiers, headers, request bodies or error values',async()=>{
  let output='';const app=express();
  installSecurityMiddleware(app,{nodeEnv:'development',trustProxyHops:0,corsOrigins:new Set()},
   {write(chunk){output+=chunk;}});
  app.use(express.json());app.use((req,res)=>{
   req.log.error({err:new Error('private-error-marker')},'request failed');
   res.setHeader('set-cookie','session=private-response-marker; HttpOnly');res.status(500).end();
  });
  const response=await request(app).post('/invitation/private-path-marker?code=[REDACTED_CAPABILITY]
   .set('authorization','Bearer private-auth-marker').set('cookie','session=private-cookie-marker')
   .set('x-request-id','private-request-marker').send({notes:'private-body-marker'});
  expect(response.headers['x-request-id']).not.toBe('private-request-marker');
  const logs=output.trim().split('\n').map(line=>JSON.parse(line));
  expect(logs.some(row=>row.res?.statusCode===500)).toBe(true);
  expect(logs.some(row=>row.responseTime!==undefined)).toBe(true);
  for(const value of ['private-path-marker','private-query-marker','private-auth-marker','private-cookie-marker',
   'private-request-marker','private-body-marker','private-response-marker','private-error-marker','127.0.0.1'])expect(output).not.toContain(value);
  expect(logs[0].req).toEqual({id:response.headers['x-request-id'],method:'POST'});
 });
});
