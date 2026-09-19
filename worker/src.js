import BOOKS from './books.json';

const FREE_LIMIT = 10;
const SUBSCRIPTION_DAYS = 30;
const BOT_API = 'https://api.telegram.org/bot';

function json(data, status=200, extra={}) {
  return new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','access-control-allow-headers':'content-type,x-telegram-bot-api-secret-token','access-control-allow-methods':'GET,POST,OPTIONS',...extra}});
}
function todayKyiv(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function nowSec(){return Math.floor(Date.now()/1000);}
async function hmac(key,data){return crypto.subtle.sign('HMAC',key,new TextEncoder().encode(data));}
function hex(buf){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function validateInitData(initData,botToken){
  if(!initData) throw new Error('missing_init_data');
  const p=new URLSearchParams(initData); const hash=p.get('hash'); if(!hash) throw new Error('missing_hash');
  p.delete('hash');
  const pairs=[...p.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>`${k}=${v}`).join('\n');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode('WebAppData'),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const secret=await hmac(key,botToken);
  const secretKey=await crypto.subtle.importKey('raw',secret,{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const calculated=hex(await hmac(secretKey,pairs));
  if(calculated!==hash) throw new Error('invalid_init_data');
  const authDate=Number(p.get('auth_date')||0);
  if(!authDate || Math.abs(nowSec()-authDate)>86400) throw new Error('expired_init_data');
  const user=JSON.parse(p.get('user')||'{}'); if(!user.id) throw new Error('missing_user');
  return user;
}
function parseBook(line){
  const a=line.split(' — '); const title=a.shift()||''; const rest=a.join(' — ');
  const j=rest.indexOf('. '); const author=j<0?rest:rest.slice(0,j); const review=j<0?'':rest.slice(j+2);
  return {title,author,review};
}
async function premiumActive(env,userId){
  const r=await env.DB.prepare('SELECT expires_at FROM subscriptions WHERE user_id=?').bind(String(userId)).first();
  return !!(r && Number(r.expires_at)>nowSec());
}
async function claimFree(env,userId){
  const date=todayKyiv();
  const r=await env.DB.prepare(`INSERT INTO daily_usage(user_id,usage_date,used) VALUES(?,?,1)
    ON CONFLICT(user_id,usage_date) DO UPDATE SET used=used+1 WHERE daily_usage.used < ?
    RETURNING used`).bind(String(userId),date,FREE_LIMIT).first();
  return !!r;
}
async function telegram(env,method,body){
  const r=await fetch(`${BOT_API}${env.BOT_TOKEN}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json(); if(!d.ok) throw new Error(d.description||'telegram_api_error'); return d.result;
}

export default {
  async fetch(request,env){
    if(request.method==='OPTIONS') return json({ok:true});
    const url=new URL(request.url);
    if(url.pathname==='/health') return json({ok:true,service:'book-mini-app'});

    if(url.pathname==='/telegram/webhook' && request.method==='POST'){
      const secret=request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if(env.WEBHOOK_SECRET && secret!==env.WEBHOOK_SECRET) return json({ok:false},403);
      const update=await request.json();
      try{
        if(update.pre_checkout_query){
          await telegram(env,'answerPreCheckoutQuery',{pre_checkout_query_id:update.pre_checkout_query.id,ok:true});
        }
        const sp=update.message?.successful_payment;
        if(sp){
          const payload=String(sp.invoice_payload||'');
          const m=payload.match(/^book_premium:(\d+)$/);
          if(m){
            const uid=m[1];
            const exp=Number(sp.subscription_expiration_date)|| (nowSec()+SUBSCRIPTION_DAYS*86400);
            await env.DB.prepare(`INSERT INTO subscriptions(user_id,expires_at,updated_at) VALUES(?,?,?)
              ON CONFLICT(user_id) DO UPDATE SET expires_at=excluded.expires_at,updated_at=excluded.updated_at`).bind(uid,exp,nowSec()).run();
            await env.DB.prepare(`INSERT INTO payments(user_id,payload,charge_id,paid_at,expires_at) VALUES(?,?,?,?,?)`).bind(uid,payload,sp.telegram_payment_charge_id||'',nowSec(),exp).run();
          }
        }
      }catch(e){ console.error(e); }
      return json({ok:true});
    }

    if(url.pathname==='/api/book' && request.method==='POST'){
      try{
        const body=await request.json();
        const user=await validateInitData(body.initData,env.BOT_TOKEN);
        const category=String(body.category||'');
        const lines=BOOKS[category];
        if(!lines) return json({error:'unknown_category'},400);
        const premium=await premiumActive(env,user.id);
        if(!premium){
          const ok=await claimFree(env,user.id);
          if(!ok) return json({limit_reached:true});
        }
        let line=lines[Math.floor(Math.random()*lines.length)];
        let book=parseBook(line);
        return json({book,premium});
      }catch(e){return json({error:e.message||'unauthorized'},401);}
    }

    if(url.pathname==='/api/invoice' && request.method==='POST'){
      try{
        const body=await request.json();
        const user=await validateInitData(body.initData,env.BOT_TOKEN);
        if(await premiumActive(env,user.id)) return json({active:true});
        const link=await telegram(env,'createInvoiceLink',{
          title:'Premium — Книга на вечір',
          description:'Безлімітні книжкові рекомендації на 30 днів у Mini App «Простір корисного контенту».',
          payload:`book_premium:${user.id}`,
          provider_token:'',
          currency:'XTR',
          prices:[{label:'Premium 30 днів',amount:10}],
          subscription_period:2592000
        });
        return json({invoice_link:link});
      }catch(e){return json({error:e.message||'invoice_error'},400);}
    }
    return json({error:'not_found'},404);
  }
};
