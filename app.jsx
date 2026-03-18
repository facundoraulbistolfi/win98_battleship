import { useRef, useEffect, useState, useCallback } from “react”;
import * as THREE from “three”;

const CELL = 10, ROWS = 15, COLS = 15, BACKROOMS_IDX = 5;

function generateMaze(rows, cols) {
const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
const walls = { h: Array.from({ length: rows+1 }, () => Array(cols).fill(true)),
v: Array.from({ length: rows }, () => Array(cols+1).fill(true)) };
const stack = [[0,0]]; visited[0][0] = true;
const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
while (stack.length) {
const [r,c] = stack[stack.length-1];
const nb = dirs.map(([dr,dc])=>[r+dr,c+dc]).filter(([nr,nc])=>nr>=0&&nr<rows&&nc>=0&&nc<cols&&!visited[nr][nc]);
if (!nb.length) { stack.pop(); continue; }
const [nr,nc] = nb[Math.floor(Math.random()*nb.length)];
if (nr===r) walls.v[r][Math.max(c,nc)]=false; else walls.h[Math.max(r,nr)][c]=false;
visited[nr][nc]=true; stack.push([nr,nc]);
}
return walls;
}

function generateStraight() {
const walls = { h: Array.from({ length: ROWS+1 }, () => Array(COLS).fill(true)),
v: Array.from({ length: ROWS }, () => Array(COLS+1).fill(true)) };
for (let c = 0; c < COLS-1; c++) walls.v[0][c+1] = false;
return walls;
}

function bfsNext(maze, fromR, fromC, toR, toC) {
if (fromR===toR && fromC===toC) return null;
const visited = Array.from({length:ROWS},()=>Array(COLS).fill(false));
const prev = Array.from({length:ROWS},()=>Array(COLS).fill(null));
const q = [[fromR,fromC]]; visited[fromR][fromC] = true;
while (q.length) {
const [r,c] = q.shift();
if (r===toR && c===toC) {
let cr=r, cc=c;
while (prev[cr][cc] && !(prev[cr][cc][0]===fromR && prev[cr][cc][1]===fromC)) [cr,cc]=prev[cr][cc];
return prev[cr][cc] ? [cr,cc] : null;
}
for (const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
const nr=r+dr, nc=c+dc;
if (nr<0||nr>=ROWS||nc<0||nc>=COLS||visited[nr][nc]) continue;
if (dr===1&&maze.h[r+1][c]) continue; if (dr===-1&&maze.h[r][c]) continue;
if (dc===1&&maze.v[r][c+1]) continue; if (dc===-1&&maze.v[r][c]) continue;
visited[nr][nc]=true; prev[nr][nc]=[r,c]; q.push([nr,nc]);
}
}
return null;
}

function findMonsterSpawn(maze) {
const dist = Array.from({length:ROWS},()=>Array(COLS).fill(-1));
const q = [[0,0]]; dist[0][0]=0;
while (q.length) {
const [r,c] = q.shift();
for (const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
const nr=r+dr, nc=c+dc;
if (nr<0||nr>=ROWS||nc<0||nc>=COLS||dist[nr][nc]>=0) continue;
if (dr===1&&maze.h[r+1][c]) continue; if (dr===-1&&maze.h[r][c]) continue;
if (dc===1&&maze.v[r][c+1]) continue; if (dc===-1&&maze.v[r][c]) continue;
dist[nr][nc]=dist[r][c]+1; q.push([nr,nc]);
}
}
let cands=[];
for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (dist[r][c]===15) cands.push([r,c]);
if (!cands.length) for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (dist[r][c]>=8&&dist[r][c]<=14) cands.push([r,c]);
if (!cands.length) return [1,1];
return cands[Math.floor(Math.random()*cands.length)];
}

function mktex(c, rep=[1,1]) {
const t = new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(…rep); return t;
}
function makeBrickWall() {
const W=512,H=512,BW=118,BH=52,M=6,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); ctx.fillStyle=”#a09080”; ctx.fillRect(0,0,W,H);
const db=(x,y,w,h)=>{const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,”#8b1010”);g.addColorStop(0.3,”#7a0e0e”);g.addColorStop(0.7,”#820f0f”);g.addColorStop(1,”#6e0c0c”);ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.fillStyle=“rgba(0,0,0,0.12)”;ctx.fillRect(x+w*.5,y,w*.5,h);ctx.fillStyle=“rgba(255,160,160,0.10)”;ctx.fillRect(x+1,y+1,w-2,4);ctx.fillStyle=“rgba(0,0,0,0.30)”;ctx.fillRect(x+1,y+h-4,w-2,4);};
for(let row=0;row<=Math.ceil(H/(BH+M));row++){const off=(row%2)*(BW+M)/2,y=row*(BH+M)+M;for(let col=-1;col<=Math.ceil(W/(BW+M));col++)db(col*(BW+M)+off+M,y,BW,BH);}
return mktex(c);
}
function makeStoneWall() {
const W=512,H=512,BW=120,BH=60,M=5,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); ctx.fillStyle=”#777”; ctx.fillRect(0,0,W,H);
const ds=(x,y,w,h)=>{const b=95+Math.floor(Math.random()*30);ctx.fillStyle=“rgb(”+b+”,”+b+”,”+b+”)”;ctx.fillRect(x,y,w,h);ctx.fillStyle=“rgba(255,255,255,0.12)”;ctx.fillRect(x+1,y+1,w-2,4);ctx.fillStyle=“rgba(0,0,0,0.22)”;ctx.fillRect(x+1,y+h-4,w-2,4);};
for(let row=0;row<=Math.ceil(H/(BH+M));row++){const off=(row%2)*(BW+M)/2,y=row*(BH+M)+M;for(let col=-1;col<=Math.ceil(W/(BW+M));col++)ds(col*(BW+M)+off+M,y,BW,BH);}
return mktex(c);
}
function makeMetalWall() {
const W=256,H=256,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); ctx.fillStyle=”#4a5560”; ctx.fillRect(0,0,W,H);
const PW=W/2,PH=H/3;
for(let r=0;r<3;r++)for(let col=0;col<2;col++){const x=col*PW+4,y=r*PH+4,w=PW-8,h=PH-8;const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,”#5a6575”);g.addColorStop(0.5,”#3e4a55”);g.addColorStop(1,”#4a5560”);ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.strokeStyle=“rgba(120,150,170,0.6)”;ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);[[x+5,y+5],[x+w-5,y+5],[x+5,y+h-5],[x+w-5,y+h-5]].forEach(([rx,ry])=>{ctx.fillStyle=”#6a7a8a”;ctx.beginPath();ctx.arc(rx,ry,2.5,0,Math.PI*2);ctx.fill();});}
return mktex(c);
}
function makeWoodWall() {
const W=256,H=512,PL=80,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); const sh=[”#6b3c10”,”#7a4418”,”#623610”,”#724014”];
for(let i=0;i<Math.ceil(H/PL);i++){ctx.fillStyle=sh[i%4];ctx.fillRect(0,i*PL,W,PL);ctx.strokeStyle=“rgba(30,10,0,0.4)”;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,i*PL);ctx.lineTo(W,i*PL);ctx.stroke();}
return mktex(c,[1,2]);
}
function makeAzulejoWall() {
const W=512,H=512,S=128,G=5,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); ctx.fillStyle=”#d4c890”; ctx.fillRect(0,0,W,H); const B=”#1a2e8a”;
const dt=(ox,oy,sz)=>{const p=G/2,ts=sz-G,cx2=ox+sz/2,cy2=oy+sz/2,r=sz/2-G;ctx.fillStyle=”#f0ead0”;ctx.fillRect(ox+p,oy+p,ts,ts);ctx.strokeStyle=B;ctx.lineWidth=sz*0.07;ctx.lineCap=“round”;[[0,0],[1,0],[0,1],[1,1]].forEach(([fx,fy])=>{const ex=ox+p+fx*ts,ey=oy+p+fy*ts,ang=Math.atan2(cy2-ey,cx2-ex);ctx.beginPath();ctx.arc(ex,ey,r*0.72,ang-0.55,ang+0.55);ctx.stroke();});ctx.strokeStyle=B;ctx.lineWidth=sz*0.05;ctx.beginPath();ctx.arc(cx2,cy2,r*0.28,0,Math.PI*2);ctx.stroke();ctx.fillStyle=B;ctx.beginPath();ctx.arc(cx2,cy2,r*0.07,0,Math.PI*2);ctx.fill();};
for(let r=0;r<4;r++)for(let col=0;col<4;col++)dt(col*S,r*S,S);
return mktex(c);
}
function makeBackroomsWall() {
const W=512,H=512,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); ctx.fillStyle=”#c8b86a”; ctx.fillRect(0,0,W,H);
const TW=48,TH=64; ctx.strokeStyle=“rgba(140,125,40,0.55)”; ctx.lineWidth=1.5;
for(let row=-1;row<H/TH+2;row++){for(let col=-1;col<W/TW+2;col++){const ox=col*TW+(row%2)*TW/2,oy=row*TH;ctx.beginPath();ctx.moveTo(ox+TW/2,oy+4);ctx.lineTo(ox+TW-4,oy+TH/2);ctx.lineTo(ox+TW/2,oy+TH-4);ctx.lineTo(ox+4,oy+TH/2);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(ox+TW/2,oy+12);ctx.lineTo(ox+TW/2-10,oy+TH/2);ctx.lineTo(ox+TW/2,oy+TH-12);ctx.lineTo(ox+TW/2+10,oy+TH/2);ctx.closePath();ctx.stroke();}}
ctx.fillStyle=“rgba(180,155,60,0.18)”; ctx.fillRect(0,0,W,H);
return mktex(c);
}
function makeWoodFloor() {
const W=512,H=512,PL=H/8,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); const sh=[”#8c5a20”,”#7e5018”,”#8a5820”,”#7a4c16”,”#885620”,”#805218”,”#8e5c22”,”#7c5018”];
for(let i=0;i<8;i++){ctx.fillStyle=sh[i];ctx.fillRect(0,i*PL,W,PL);ctx.strokeStyle=“rgba(60,20,0,0.35)”;ctx.lineWidth=2;ctx.strokeRect(0,i*PL,W,PL);const off=(i%2)*(W/2);[off,off+W/2].forEach(x=>{ctx.strokeStyle=“rgba(60,20,0,0.3)”;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,i*PL);ctx.lineTo(x,(i+1)*PL);ctx.stroke();});}
return mktex(c,[2,2]);
}
function makeMarbleFloor() {
const W=512,H=512,S=128,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”);
for(let r=0;r<4;r++)for(let col=0;col<4;col++){ctx.fillStyle=(r+col)%2===0?”#b8b0a8”:”#e0d8d0”;ctx.fillRect(col*S,r*S,S,S);}
ctx.strokeStyle=“rgba(80,70,60,0.8)”;ctx.lineWidth=3;for(let i=0;i<=4;i++){ctx.beginPath();ctx.moveTo(i*S,0);ctx.lineTo(i*S,H);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*S);ctx.lineTo(W,i*S);ctx.stroke();}
return mktex(c);
}
function makeCarpetFloor() {
const W=256,H=256,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); ctx.fillStyle=”#4a2060”; ctx.fillRect(0,0,W,H);
for(let x=0;x<W;x+=16){ctx.strokeStyle=“rgba(180,100,220,0.15)”;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
for(let y=0;y<H;y+=16){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
return mktex(c,[2,2]);
}
function makeDirtFloor() {
const W=256,H=256,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); ctx.fillStyle=”#5a4020”; ctx.fillRect(0,0,W,H);
for(let i=0;i<3000;i++){const x=Math.random()*W,y=Math.random()*H,v=Math.random()*40-20;ctx.fillStyle=“rgba(”+(90+v|0)+”,”+(60+v|0)+”,”+(30+v|0)+”,0.35)”;ctx.fillRect(x,y,2,2);}
return mktex(c);
}
function makeAzulejoFloor() {
const W=512,H=512,S=128,G=5,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); ctx.fillStyle=”#c8b870”; ctx.fillRect(0,0,W,H); const B=”#1a2e8a”;
const dt=(ox,oy,sz)=>{const p=G/2,ts=sz-G,cx2=ox+sz/2,cy2=oy+sz/2,r=sz/2-G;ctx.fillStyle=”#ede8d0”;ctx.fillRect(ox+p,oy+p,ts,ts);ctx.fillStyle=B;ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/8,a2=a+Math.PI/8,ro=r*0.82,ri=r*0.38;if(i===0)ctx.moveTo(cx2+Math.cos(a)*ro,cy2+Math.sin(a)*ro);else ctx.lineTo(cx2+Math.cos(a)*ro,cy2+Math.sin(a)*ro);ctx.lineTo(cx2+Math.cos(a2)*ri,cy2+Math.sin(a2)*ri);}ctx.closePath();ctx.fill();ctx.fillStyle=”#ede8d0”;ctx.beginPath();ctx.arc(cx2,cy2,r*0.22,0,Math.PI*2);ctx.fill();ctx.strokeStyle=B;ctx.lineWidth=sz*0.04;ctx.beginPath();ctx.arc(cx2,cy2,r*0.22,0,Math.PI*2);ctx.stroke();ctx.fillStyle=B;ctx.beginPath();ctx.arc(cx2,cy2,r*0.08,0,Math.PI*2);ctx.fill();};
for(let r=0;r<4;r++)for(let col=0;col<4;col++)dt(col*S,r*S,S);
return mktex(c);
}
function makeBackroomsFloor() {
const W=512,H=512,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); ctx.fillStyle=”#c49a52”; ctx.fillRect(0,0,W,H);
for(let i=0;i<8000;i++){const x=Math.random()*W,y=Math.random()*H,l=Math.random()*6+2,a=Math.random()*Math.PI,v=Math.random()*30-15|0;ctx.strokeStyle=“rgba(”+(180+v)+”,”+(140+v)+”,”+(70+v)+”,0.18)”;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);ctx.stroke();}
ctx.fillStyle=“rgba(200,160,80,0.12)”; ctx.fillRect(0,0,W,H);
return mktex(c,[3,3]);
}
function makeStoneCeil() {
const W=512,H=512,BW=120,BH=60,M=5,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); ctx.fillStyle=”#666”; ctx.fillRect(0,0,W,H);
const ds=(x,y,w,h)=>{const b=95+Math.floor(Math.random()*25);ctx.fillStyle=“rgb(”+b+”,”+b+”,”+b+”)”;ctx.fillRect(x,y,w,h);ctx.fillStyle=“rgba(0,0,0,0.22)”;ctx.fillRect(x+1,y+h-4,w-2,4);};
for(let row=0;row<=Math.ceil(H/(BH+M));row++){const off=(row%2)*(BW+M)/2,y=row*(BH+M)+M;for(let col=-1;col<=Math.ceil(W/(BW+M));col++)ds(col*(BW+M)+off+M,y,BW,BH);}
return mktex(c);
}
function makeMetalCeil() {
const W=256,H=256,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,”#5a6070”);g.addColorStop(0.5,”#484e58”);g.addColorStop(1,”#555c68”);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
for(let x=0;x<W;x+=64){ctx.strokeStyle=“rgba(100,120,140,0.5)”;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
for(let y=0;y<H;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
return mktex(c);
}
function makeWoodCeil() {
const W=512,H=256,PL=H/4,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); const sh=[”#5a3010”,”#4e2a0c”,”#583012”,”#4c280e”];
for(let i=0;i<4;i++){ctx.fillStyle=sh[i];ctx.fillRect(0,i*PL,W,PL);ctx.strokeStyle=“rgba(20,5,0,0.5)”;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,i*PL);ctx.lineTo(W,i*PL);ctx.stroke();}
return mktex(c,[2,1]);
}
function makeBrickCeil() {
const W=512,H=512,BW=118,BH=52,M=6,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); ctx.fillStyle=”#807060”; ctx.fillRect(0,0,W,H);
const db=(x,y,w,h)=>{ctx.fillStyle=”#6a2a2a”;ctx.fillRect(x,y,w,h);ctx.fillStyle=“rgba(0,0,0,0.3)”;ctx.fillRect(x+1,y+h-4,w-2,4);};
for(let row=0;row<=Math.ceil(H/(BH+M));row++){const off=(row%2)*(BW+M)/2,y=row*(BH+M)+M;for(let col=-1;col<=Math.ceil(W/(BW+M));col++)db(col*(BW+M)+off+M,y,BW,BH);}
return mktex(c);
}
function makeAzulejoCeil() {
const W=512,H=512,S=128,G=5,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); ctx.fillStyle=”#b8a860”; ctx.fillRect(0,0,W,H); const B=”#1a2e8a”;
const dt=(ox,oy,sz)=>{const p=G/2,ts=sz-G,cx2=ox+sz/2,cy2=oy+sz/2,r=sz/2-G;ctx.fillStyle=”#f2ecda”;ctx.fillRect(ox+p,oy+p,ts,ts);ctx.strokeStyle=B;ctx.lineWidth=sz*0.04;ctx.strokeRect(ox+p+4,oy+p+4,ts-8,ts-8);ctx.fillStyle=B;for(let i=0;i<6;i++){const a=i*Math.PI/3,px=cx2+Math.cos(a)*r*0.3,py=cy2+Math.sin(a)*r*0.3;ctx.beginPath();ctx.ellipse(px,py,r*0.22,r*0.1,a,0,Math.PI*2);ctx.fill();}ctx.fillStyle=”#f2ecda”;ctx.beginPath();ctx.arc(cx2,cy2,r*0.18,0,Math.PI*2);ctx.fill();ctx.strokeStyle=B;ctx.lineWidth=sz*0.035;ctx.beginPath();ctx.arc(cx2,cy2,r*0.18,0,Math.PI*2);ctx.stroke();ctx.fillStyle=B;ctx.beginPath();ctx.arc(cx2,cy2,r*0.07,0,Math.PI*2);ctx.fill();};
for(let r=0;r<4;r++)for(let col=0;col<4;col++)dt(col*S,r*S,S);
return mktex(c);
}
function makeBackroomsCeil() {
const W=512,H=512,S=128,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); ctx.fillStyle=”#ddd5a8”; ctx.fillRect(0,0,W,H);
ctx.strokeStyle=“rgba(160,148,90,0.6)”; ctx.lineWidth=2;
for(let x=0;x<=W;x+=S){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
for(let y=0;y<=H;y+=S){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
for(let i=0;i<2000;i++){const x=Math.random()*W,y=Math.random()*H,v=Math.random()*20-10|0;ctx.fillStyle=“rgba(”+(200+v)+”,”+(190+v)+”,”+(155+v)+”,0.25)”;ctx.fillRect(x,y,2,2);}
for(let row=0;row<W/S;row++){for(let col=0;col<H/S;col++){const lx=col*S+S*0.2,ly=row*S+S*0.35,lw=S*0.6,lh=S*0.3;const g=ctx.createRadialGradient(lx+lw/2,ly+lh/2,0,lx+lw/2,ly+lh/2,S*0.5);g.addColorStop(0,“rgba(255,250,220,0.6)”);g.addColorStop(1,“rgba(255,250,220,0)”);ctx.fillStyle=g;ctx.fillRect(col*S,row*S,S,S);ctx.fillStyle=“rgba(255,255,240,0.92)”;ctx.fillRect(lx,ly,lw,lh);ctx.strokeStyle=“rgba(180,170,120,0.5)”;ctx.lineWidth=1;ctx.strokeRect(lx,ly,lw,lh);}}
return mktex(c);
}

const WALL_TEXS  = [{label:“Ladrillo”,fn:makeBrickWall},{label:“Piedra”,fn:makeStoneWall},{label:“Metal”,fn:makeMetalWall},{label:“Madera”,fn:makeWoodWall},{label:“Azulejo”,fn:makeAzulejoWall},{label:“Backrooms”,fn:makeBackroomsWall}];
const FLOOR_TEXS = [{label:“Madera”,fn:makeWoodFloor},{label:“Marmol”,fn:makeMarbleFloor},{label:“Alfombra”,fn:makeCarpetFloor},{label:“Tierra”,fn:makeDirtFloor},{label:“Azulejo”,fn:makeAzulejoFloor},{label:“Backrooms”,fn:makeBackroomsFloor}];
const CEIL_TEXS  = [{label:“Piedra”,fn:makeStoneCeil},{label:“Metal”,fn:makeMetalCeil},{label:“Madera”,fn:makeWoodCeil},{label:“Ladrillo”,fn:makeBrickCeil},{label:“Azulejo”,fn:makeAzulejoCeil},{label:“Backrooms”,fn:makeBackroomsCeil}];

function makeStartTexture() {
const W=320,H=160,c=document.createElement(“canvas”);c.width=W;c.height=H;
const ctx=c.getContext(“2d”); ctx.clearRect(0,0,W,H);
ctx.fillStyle=“rgba(200,200,200,0.13)”; ctx.fillRect(0,0,W,H);
ctx.strokeStyle=“rgba(100,100,100,0.25)”; ctx.lineWidth=1; ctx.strokeRect(1,1,W-2,H-2);
const lx=12,ly=12,s=56,g=5;
ctx.fillStyle=”#f3632e”; ctx.fillRect(lx,ly,s,s);
ctx.fillStyle=”#66c557”; ctx.fillRect(lx+s+g,ly,s,s);
ctx.fillStyle=”#3d87cf”; ctx.fillRect(lx,ly+s+g,s,s);
ctx.fillStyle=”#fac705”; ctx.fillRect(lx+s+g,ly+s+g,s,s);
ctx.fillStyle=”#000”; ctx.fillRect(lx+s-1,ly,7,s*2+g); ctx.fillRect(lx,ly+s-1,s*2+g,7);
ctx.fillStyle=“rgba(20,20,20,0.6)”; ctx.font=“bold 11px Arial”; ctx.fillText(“TM”,lx+s*2+g+3,ly+10);
ctx.font=“bold italic 78px ‘Times New Roman’,serif”;
ctx.fillStyle=“rgba(25,8,4,0.42)”; ctx.fillText(“Start”,148,H/2+30);
ctx.fillStyle=“rgba(8,3,1,0.72)”; ctx.fillText(“Start”,146,H/2+28);
return new THREE.CanvasTexture(c);
}

function makeRatTexture() {
const c=document.createElement(“canvas”);c.width=64;c.height=64;const ctx=c.getContext(“2d”);
ctx.fillStyle=”#888”;ctx.beginPath();ctx.ellipse(32,38,14,10,0,0,Math.PI*2);ctx.fill();
ctx.fillStyle=”#999”;ctx.beginPath();ctx.ellipse(32,26,10,12,0,0,Math.PI*2);ctx.fill();
ctx.fillStyle=”#aaa”;ctx.beginPath();ctx.ellipse(26,20,5,7,-0.3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(38,20,5,7,0.3,0,Math.PI*2);ctx.fill();
ctx.fillStyle=”#ff9999”;ctx.beginPath();ctx.ellipse(26,20,3,5,-0.3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(38,20,3,5,0.3,0,Math.PI*2);ctx.fill();
ctx.fillStyle=”#000”;ctx.beginPath();ctx.arc(29,27,2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(35,27,2,0,Math.PI*2);ctx.fill();
ctx.fillStyle=”#ffaaaa”;ctx.beginPath();ctx.arc(32,30,1.5,0,Math.PI*2);ctx.fill();
ctx.strokeStyle=”#888”;ctx.lineWidth=1;
for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(32,30);ctx.lineTo(18,26+i*3);ctx.stroke();}
for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(32,30);ctx.lineTo(46,26+i*3);ctx.stroke();}
ctx.strokeStyle=”#777”;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(46,38);ctx.quadraticCurveTo(60,30,58,42);ctx.stroke();
return new THREE.CanvasTexture(c);
}

function makeMonsterTexture() {
const W = 512, H = 640, c = document.createElement(“canvas”);
c.width = W; c.height = H;
const ctx = c.getContext(“2d”);
ctx.clearRect(0, 0, W, H);

// Outer eerie glow
const outerGlow = ctx.createRadialGradient(W/2, H*0.38, 30, W/2, H*0.38, 320);
outerGlow.addColorStop(0, “rgba(255,255,255,0)”);
outerGlow.addColorStop(0.4, “rgba(255,200,180,0.06)”);
outerGlow.addColorStop(0.7, “rgba(200,60,30,0.04)”);
outerGlow.addColorStop(1, “rgba(0,0,0,0)”);
ctx.fillStyle = outerGlow;
ctx.fillRect(0, 0, W, H);

const cx = W / 2, faceTop = 20, faceBot = H - 30;
const faceH = faceBot - faceTop;
const faceCY = faceTop + faceH * 0.4;

// Main face shape - pale, elongated oval, slightly narrower at top
ctx.save();
ctx.beginPath();
ctx.moveTo(cx, faceTop);
// Top of head - narrower
ctx.bezierCurveTo(cx + 140, faceTop, cx + 190, faceTop + faceH * 0.25, cx + 195, faceCY);
// Right side going down - wider at mouth
ctx.bezierCurveTo(cx + 200, faceCY + faceH * 0.15, cx + 185, faceBot - 60, cx + 140, faceBot);
// Bottom
ctx.bezierCurveTo(cx + 60, faceBot + 15, cx - 60, faceBot + 15, cx - 140, faceBot);
// Left side going up
ctx.bezierCurveTo(cx - 185, faceBot - 60, cx - 200, faceCY + faceH * 0.15, cx - 195, faceCY);
// Back to top
ctx.bezierCurveTo(cx - 190, faceTop + faceH * 0.25, cx - 140, faceTop, cx, faceTop);
ctx.closePath();

// Face gradient - pale white with slight yellowish tint
const faceGrad = ctx.createRadialGradient(cx, faceCY - 30, 20, cx, faceCY, 220);
faceGrad.addColorStop(0, “#fff8f0”);
faceGrad.addColorStop(0.3, “#f0e8dd”);
faceGrad.addColorStop(0.6, “#e0d5c8”);
faceGrad.addColorStop(0.85, “#c8b8a5”);
faceGrad.addColorStop(1, “#a09080”);
ctx.fillStyle = faceGrad;
ctx.fill();

// Subtle face glow
const faceGlow = ctx.createRadialGradient(cx, faceCY - 50, 10, cx, faceCY - 20, 180);
faceGlow.addColorStop(0, “rgba(255,255,255,0.35)”);
faceGlow.addColorStop(1, “rgba(255,255,255,0)”);
ctx.fillStyle = faceGlow;
ctx.fill();
ctx.restore();

// === EYES ===
const eyeY = faceTop + faceH * 0.28;
const eyeLX = cx - 78, eyeRX = cx + 78;
const eyeOuterR = 62, eyeInnerR = 42;

const drawEye = (ex, ey) => {
// Dark brown/rust ring around eye - thick and menacing
for (let i = 3; i >= 0; i–) {
const r = eyeOuterR + i * 4;
const grad = ctx.createRadialGradient(ex, ey, eyeInnerR - 5, ex, ey, r);
grad.addColorStop(0, “rgba(60,20,0,0)”);
grad.addColorStop(0.5, “rgba(80,30,5,” + (0.3 - i * 0.06) + “)”);
grad.addColorStop(0.7, “rgba(50,15,0,” + (0.5 - i * 0.08) + “)”);
grad.addColorStop(1, “rgba(20,5,0,0)”);
ctx.fillStyle = grad;
ctx.beginPath();
ctx.arc(ex, ey, r, 0, Math.PI * 2);
ctx.fill();
}

// Dark ring
ctx.strokeStyle = “rgba(40,10,0,0.9)”;
ctx.lineWidth = 14;
ctx.beginPath();
ctx.arc(ex, ey, eyeOuterR - 5, 0, Math.PI * 2);
ctx.stroke();

// Second darker ring
ctx.strokeStyle = “rgba(20,5,0,0.6)”;
ctx.lineWidth = 8;
ctx.beginPath();
ctx.arc(ex, ey, eyeOuterR + 6, 0, Math.PI * 2);
ctx.stroke();

// Brownish-rust thick ring
ctx.strokeStyle = “rgba(100,40,10,0.85)”;
ctx.lineWidth = 18;
ctx.beginPath();
ctx.arc(ex, ey, eyeOuterR - 14, 0, Math.PI * 2);
ctx.stroke();

// White of the eye
const eyeWhiteGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, eyeInnerR);
eyeWhiteGrad.addColorStop(0, “#fffdf8”);
eyeWhiteGrad.addColorStop(0.7, “#f5f0ea”);
eyeWhiteGrad.addColorStop(1, “#d8cfc2”);
ctx.fillStyle = eyeWhiteGrad;
ctx.beginPath();
ctx.arc(ex, ey, eyeInnerR, 0, Math.PI * 2);
ctx.fill();

// Iris - dark with spiral hint
ctx.fillStyle = “#1a0a00”;
ctx.beginPath();
ctx.arc(ex, ey, 22, 0, Math.PI * 2);
ctx.fill();

// Spiral pattern in iris
ctx.strokeStyle = “rgba(80,30,5,0.5)”;
ctx.lineWidth = 1.5;
ctx.beginPath();
for (let t = 0; t < Math.PI * 6; t += 0.05) {
const r = t * 1.1;
const px = ex + Math.cos(t) * r;
const py = ey + Math.sin(t) * r;
if (t === 0) ctx.moveTo(px, py);
else ctx.lineTo(px, py);
}
ctx.stroke();

// Pupil - pure black, large
ctx.fillStyle = “#000”;
ctx.beginPath();
ctx.arc(ex, ey, 12, 0, Math.PI * 2);
ctx.fill();

// Tiny highlight
ctx.fillStyle = “rgba(255,255,255,0.85)”;
ctx.beginPath();
ctx.arc(ex - 5, ey - 6, 4, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = “rgba(255,255,255,0.4)”;
ctx.beginPath();
ctx.arc(ex + 8, ey + 4, 2, 0, Math.PI * 2);
ctx.fill();

// Veins radiating from eye
ctx.strokeStyle = “rgba(120,30,10,0.35)”;
ctx.lineWidth = 1.5;
for (let i = 0; i < 12; i++) {
const ang = (i / 12) * Math.PI * 2 + Math.random() * 0.2;
const len = eyeOuterR + 15 + Math.random() * 20;
ctx.beginPath();
ctx.moveTo(ex + Math.cos(ang) * eyeInnerR, ey + Math.sin(ang) * eyeInnerR);
const mx = ex + Math.cos(ang + 0.1) * (eyeInnerR + len) * 0.6;
const my = ey + Math.sin(ang - 0.1) * (eyeInnerR + len) * 0.6;
ctx.quadraticCurveTo(mx, my, ex + Math.cos(ang) * len, ey + Math.sin(ang) * len);
ctx.stroke();
}
};

drawEye(eyeLX, eyeY);
drawEye(eyeRX, eyeY);

// === NOSE === (dark shadow area between eyes, below)
const noseY = eyeY + 65;
ctx.fillStyle = “rgba(20,5,0,0.7)”;
ctx.beginPath();
ctx.moveTo(cx - 18, noseY - 10);
ctx.quadraticCurveTo(cx, noseY - 25, cx + 18, noseY - 10);
ctx.quadraticCurveTo(cx + 12, noseY + 5, cx, noseY + 8);
ctx.quadraticCurveTo(cx - 12, noseY + 5, cx - 18, noseY - 10);
ctx.fill();

// Nostrils
ctx.fillStyle = “#000”;
ctx.beginPath();
ctx.ellipse(cx - 10, noseY - 3, 6, 8, -0.2, 0, Math.PI * 2);
ctx.fill();
ctx.beginPath();
ctx.ellipse(cx + 10, noseY - 3, 6, 8, 0.2, 0, Math.PI * 2);
ctx.fill();

// Dark shadow connecting nose to mouth
const noseShadow = ctx.createRadialGradient(cx, noseY + 15, 5, cx, noseY + 30, 60);
noseShadow.addColorStop(0, “rgba(15,2,0,0.6)”);
noseShadow.addColorStop(1, “rgba(15,2,0,0)”);
ctx.fillStyle = noseShadow;
ctx.fillRect(cx - 80, noseY, 160, 80);

// === MOUTH === - Enormous gaping maw
const mouthTop = noseY + 25;
const mouthBot = faceBot - 20;
const mouthW = 170;

// Mouth opening shape - huge, stretched vertically
ctx.save();
ctx.beginPath();
ctx.moveTo(cx - mouthW * 0.3, mouthTop);
// Upper lip - curved down drastically
ctx.bezierCurveTo(cx - mouthW * 0.8, mouthTop + 15, cx - mouthW, mouthTop + 60, cx - mouthW * 0.85, mouthTop + (mouthBot - mouthTop) * 0.5);
// Left side going down
ctx.bezierCurveTo(cx - mouthW * 0.7, mouthBot - 30, cx - mouthW * 0.4, mouthBot + 5, cx, mouthBot);
// Right side
ctx.bezierCurveTo(cx + mouthW * 0.4, mouthBot + 5, cx + mouthW * 0.7, mouthBot - 30, cx + mouthW * 0.85, mouthTop + (mouthBot - mouthTop) * 0.5);
ctx.bezierCurveTo(cx + mouthW, mouthTop + 60, cx + mouthW * 0.8, mouthTop + 15, cx + mouthW * 0.3, mouthTop);
ctx.closePath();

// Abyss black interior
const mouthGrad = ctx.createRadialGradient(cx, mouthTop + (mouthBot - mouthTop) * 0.45, 10, cx, mouthTop + (mouthBot - mouthTop) * 0.45, 200);
mouthGrad.addColorStop(0, “#000000”);
mouthGrad.addColorStop(0.5, “#050000”);
mouthGrad.addColorStop(1, “#100200”);
ctx.fillStyle = mouthGrad;
ctx.fill();

// Dark red gum lining
ctx.strokeStyle = “rgba(80,10,5,0.8)”;
ctx.lineWidth = 6;
ctx.stroke();
ctx.restore();

// === TEETH - Upper row ===
const teethCount = 14;
const mouthMidH = mouthTop + (mouthBot - mouthTop) * 0.5;

// Upper teeth - long, sharp, slightly irregular, pointing downward
for (let i = 0; i < teethCount; i++) {
const t = (i / (teethCount - 1)) - 0.5; // -0.5 to 0.5
const baseX = cx + t * mouthW * 1.4;
// Curve the base along the mouth shape
const curve = 1 - t * t * 3.5;
if (curve < 0.1) continue;
const baseY = mouthTop + 10 + (1 - curve) * 25;
const tipLen = 35 + curve * 50 + Math.random() * 15;
const toothW = 8 + curve * 10;
const tipX = baseX + (Math.random() - 0.5) * 6;

ctx.fillStyle = “#e8ddd0”;
ctx.beginPath();
ctx.moveTo(baseX - toothW / 2, baseY);
ctx.lineTo(tipX, baseY + tipLen);
ctx.lineTo(baseX + toothW / 2, baseY);
ctx.closePath();
ctx.fill();

// Tooth shading
ctx.fillStyle = “rgba(0,0,0,0.2)”;
ctx.beginPath();
ctx.moveTo(baseX, baseY);
ctx.lineTo(tipX, baseY + tipLen);
ctx.lineTo(baseX + toothW / 2, baseY);
ctx.closePath();
ctx.fill();

// Dark tip
ctx.fillStyle = “rgba(100,40,20,0.4)”;
ctx.beginPath();
ctx.moveTo(tipX - 2, baseY + tipLen - 8);
ctx.lineTo(tipX, baseY + tipLen);
ctx.lineTo(tipX + 2, baseY + tipLen - 8);
ctx.closePath();
ctx.fill();
}

// Lower teeth - pointing upward
for (let i = 0; i < teethCount; i++) {
const t = (i / (teethCount - 1)) - 0.5;
const baseX = cx + t * mouthW * 1.3;
const curve = 1 - t * t * 3.5;
if (curve < 0.1) continue;
const baseY = mouthBot - 10 - (1 - curve) * 20;
const tipLen = 30 + curve * 45 + Math.random() * 12;
const toothW = 7 + curve * 9;
const tipX = baseX + (Math.random() - 0.5) * 5;

ctx.fillStyle = “#e0d5c5”;
ctx.beginPath();
ctx.moveTo(baseX - toothW / 2, baseY);
ctx.lineTo(tipX, baseY - tipLen);
ctx.lineTo(baseX + toothW / 2, baseY);
ctx.closePath();
ctx.fill();

ctx.fillStyle = “rgba(0,0,0,0.18)”;
ctx.beginPath();
ctx.moveTo(baseX, baseY);
ctx.lineTo(tipX, baseY - tipLen);
ctx.lineTo(baseX + toothW / 2, baseY);
ctx.closePath();
ctx.fill();

ctx.fillStyle = “rgba(100,40,20,0.35)”;
ctx.beginPath();
ctx.moveTo(tipX - 2, baseY - tipLen + 7);
ctx.lineTo(tipX, baseY - tipLen);
ctx.lineTo(tipX + 2, baseY - tipLen + 7);
ctx.closePath();
ctx.fill();
}

// Inner row of smaller teeth (giving depth)
for (let i = 0; i < 10; i++) {
const t = (i / 9) - 0.5;
const baseX = cx + t * mouthW * 0.9;
const curve = 1 - t * t * 4;
if (curve < 0.15) continue;
const baseY = mouthTop + 35 + (1 - curve) * 15;
const tipLen = 15 + curve * 25;
const toothW = 4 + curve * 5;

ctx.fillStyle = “rgba(180,170,155,0.7)”;
ctx.beginPath();
ctx.moveTo(baseX - toothW / 2, baseY);
ctx.lineTo(baseX, baseY + tipLen);
ctx.lineTo(baseX + toothW / 2, baseY);
ctx.closePath();
ctx.fill();
}

// Gums - reddish tissue at base of teeth
ctx.strokeStyle = “rgba(100,20,15,0.5)”;
ctx.lineWidth = 4;
ctx.beginPath();
ctx.moveTo(cx - mouthW * 0.6, mouthTop + 15);
ctx.quadraticCurveTo(cx, mouthTop + 5, cx + mouthW * 0.6, mouthTop + 15);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(cx - mouthW * 0.55, mouthBot - 12);
ctx.quadraticCurveTo(cx, mouthBot - 2, cx + mouthW * 0.55, mouthBot - 12);
ctx.stroke();

// Dark drool/saliva strands between teeth
ctx.strokeStyle = “rgba(120,90,70,0.25)”;
ctx.lineWidth = 1;
for (let i = 0; i < 8; i++) {
const sx = cx + (Math.random() - 0.5) * mouthW * 1.2;
ctx.beginPath();
ctx.moveTo(sx, mouthTop + 30 + Math.random() * 20);
ctx.quadraticCurveTo(sx + (Math.random() - 0.5) * 20, mouthMidH, sx + (Math.random() - 0.5) * 15, mouthBot - 30 - Math.random() * 20);
ctx.stroke();
}

// Tongue/uvula deep inside
const tongueGrad = ctx.createRadialGradient(cx, mouthMidH + 30, 5, cx, mouthMidH + 30, 50);
tongueGrad.addColorStop(0, “rgba(80,10,10,0.6)”);
tongueGrad.addColorStop(1, “rgba(0,0,0,0)”);
ctx.fillStyle = tongueGrad;
ctx.beginPath();
ctx.ellipse(cx, mouthMidH + 30, 40, 25, 0, 0, Math.PI * 2);
ctx.fill();

// Face edge darkening
const edgeDark = ctx.createRadialGradient(cx, faceCY, 80, cx, faceCY, 260);
edgeDark.addColorStop(0, “rgba(0,0,0,0)”);
edgeDark.addColorStop(0.7, “rgba(0,0,0,0)”);
edgeDark.addColorStop(1, “rgba(0,0,0,0.5)”);
ctx.fillStyle = edgeDark;
ctx.fillRect(0, 0, W, H);

// Wrinkles / cracks on face
ctx.strokeStyle = “rgba(60,30,15,0.15)”;
ctx.lineWidth = 1;
// Forehead wrinkles
for (let i = 0; i < 5; i++) {
const wy = faceTop + 30 + i * 14;
ctx.beginPath();
ctx.moveTo(cx - 80 - i * 5, wy);
ctx.quadraticCurveTo(cx, wy - 4 + Math.random() * 8, cx + 80 + i * 5, wy);
ctx.stroke();
}
// Around mouth stress lines
for (let side = -1; side <= 1; side += 2) {
for (let i = 0; i < 4; i++) {
ctx.beginPath();
const sx = cx + side * (mouthW * 0.85 + i * 8);
ctx.moveTo(sx, mouthTop + 20 + i * 15);
ctx.quadraticCurveTo(sx + side * 20, mouthTop + 40 + i * 15, sx + side * 15, mouthTop + 70 + i * 15);
ctx.stroke();
}
}

return new THREE.CanvasTexture(c);
}

function TexPreview({ fn }) {
const ref=useRef(null);
useEffect(()=>{
if(!ref.current)return; const ctx=ref.current.getContext(“2d”); ctx.clearRect(0,0,60,48);
const src=fn(),img=src.image; const draw=()=>ctx.drawImage(img,0,0,60,48);
if(img instanceof HTMLCanvasElement)draw(); else{img.onload=draw; if(img.complete)draw();}
});
return <canvas ref={ref} width={60} height={48} style={{border:“2px inset #888”,display:“block”,imageRendering:“pixelated”}}/>;
}
function TexSelector({ list, value, onChange }) {
const ab=(lbl,fn)=><button onClick={fn} style={{display:“block”,width:18,height:22,padding:0,cursor:“pointer”,background:”#d4d0c8”,border:“1px outset #fff”,fontSize:9,lineHeight:“20px”,textAlign:“center”}}>{lbl}</button>;
return <div style={{display:“flex”,alignItems:“center”,gap:4}}><TexPreview fn={list[value].fn}/><div style={{display:“flex”,flexDirection:“column”,gap:2}}>{ab(”\u25b2”,()=>onChange((value-1+list.length)%list.length))}{ab(”\u25bc”,()=>onChange((value+1)%list.length))}</div></div>;
}

const W98={fontFamily:“MS Sans Serif, Arial”,fontSize:11};
const POS_OPTS=[{v:“tl”,l:“Arriba izq”},{v:“tr”,l:“Arriba der”},{v:“bl”,l:“Abajo izq”},{v:“br”,l:“Abajo der”},{v:“center”,l:“Centro rotante”}];

function TextureMenu({ sel, onApply, onClose, mmPos, onMmPos, mmOp, onMmOp, devMode, onFloorClick, floorClickCount, onStraight, onMonster, isMobile }) {
const [local,setLocal]=useState({…sel});
const [lPos,setLPos]=useState(mmPos);
const [lOp,setLOp]=useState(mmOp);
const rows=[{key:“ceil”,label:“Ceiling\u2026”,list:CEIL_TEXS},{key:“wall”,label:“Walls\u2026”,list:WALL_TEXS},{key:“floor”,label:“Floor\u2026”,list:FLOOR_TEXS}];
return (

<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:20,background:"rgba(0,0,0,0.5)"}}>
<div style={{border:"3px outset #fff",...W98}}>
<div style={{background:"#000080",color:"#fff",padding:"3px 6px",fontSize:12,fontWeight:"bold",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<span>Maze Setup{devMode?" dev":""}</span>
<span style={{cursor:"pointer",padding:"0 5px",background:"#d4d0c8",color:"#000",border:"1px outset #fff",fontSize:11}} onClick={onClose}>X</span>
</div>
<div style={{background:"#d4d0c8",padding:12}}>
<fieldset style={{border:"1px solid #808080",padding:"8px 10px",marginBottom:8}}>
<legend style={{fontSize:11,padding:"0 4px"}}>Textures</legend>
<div style={{display:"flex",flexDirection:"column",gap:10}}>
{rows.map(({key,label,list})=>(
<div key={key} style={{display:"flex",alignItems:"center",gap:8}}>
<button style={{background:"#d4d0c8",border:"2px outset #fff",padding:"3px 10px",cursor:"pointer",...W98,width:64}} onClick={key==="floor"?onFloorClick:undefined}>{label}</button>
<TexSelector list={list} value={local[key]} onChange={v=>setLocal(p=>({...p,[key]:v}))}/>
<span style={{fontSize:10,color:"#444",marginLeft:4}}>{list[local[key]].label}</span>
</div>
))}
</div>
{floorClickCount>0&&floorClickCount<10&&<div style={{fontSize:9,color:"#888",marginTop:4,textAlign:"right"}}>{floorClickCount}/10\u2026</div>}
</fieldset>
<fieldset style={{border:"1px solid #808080",padding:"8px 10px",marginBottom:8}}>
<legend style={{fontSize:11,padding:"0 4px"}}>Minimap</legend>
<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
{POS_OPTS.map(({v,l})=><button key={v} onClick={()=>setLPos(v)} style={{background:lPos===v?"#000080":"#d4d0c8",color:lPos===v?"#fff":"#000",border:lPos===v?"2px inset #888":"2px outset #fff",padding:"3px 8px",cursor:"pointer",...W98}}>{l}</button>)}
</div>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<span style={{...W98,whiteSpace:"nowrap"}}>Traslucido:</span>
<input type="range" min="0.05" max="1" step="0.05" value={lOp} onChange={e=>setLOp(parseFloat(e.target.value))} style={{flex:1}}/>
<span style={{...W98,width:32,textAlign:"right"}}>{Math.round(lOp*100)}%</span>
</div>
</fieldset>
{devMode&&(
<fieldset style={{border:"2px solid #800000",padding:"8px 10px",marginBottom:8,background:"#ffe8e8"}}>
<legend style={{fontSize:11,padding:"0 4px",color:"#800000",fontWeight:"bold"}}>Modo Desarrollador</legend>
<button onClick={()=>{onStraight();onClose();}} style={{background:"#d4d0c8",border:"2px outset #fff",padding:"4px 10px",cursor:"pointer",...W98,width:"100%",marginBottom:4}}>Mapa linea recta</button>
<button onClick={()=>{onMonster();onClose();}} style={{background:"#d4d0c8",border:"2px outset #fff",padding:"4px 10px",cursor:"pointer",...W98,width:"100%"}}>Liberar monstruo</button>
</fieldset>
)}
<div style={{display:"flex",gap:6,justifyContent:"flex-end",marginBottom:6}}>
<button onClick={()=>{onApply(local);onMmPos(lPos);onMmOp(lOp);onClose();}} style={{background:"#d4d0c8",border:"2px outset #fff",padding:"4px 18px",cursor:"pointer",...W98}}>OK</button>
<button onClick={onClose} style={{background:"#d4d0c8",border:"2px outset #fff",padding:"4px 18px",cursor:"pointer",...W98}}>Cancel</button>
</div>
<div style={{fontSize:10,color:"#666",textAlign:"center",marginBottom:4}}>M - menu \u00b7 Tab - minimapa</div>
{!isMobile&&(
<div style={{padding:"6px 8px",background:"#c8c4bc",border:"1px inset #888",fontSize:10,color:"#333",lineHeight:1.6}}>
<strong style={{display:"block",marginBottom:2}}>Teclado</strong>
W/S - Avanzar \u00b7 A/D - Strafe<br/>
Flechas - Girar \u00b7 Tab - Minimapa \u00b7 M - Menu
</div>
)}
<div style={{marginTop:8,padding:"6px 8px",background:"#c8c4bc",border:"1px inset #888",fontSize:9,color:"#555",textAlign:"center",lineHeight:1.5}}>
Pensado por FacuBis \u00b7 Hecho por Claude
</div>
</div>
</div>
</div>
);
}

function VirtualJoystick({ side, onDelta }) {
const touchId=useRef(null),origin=useRef({x:0,y:0}),[knob,setKnob]=useState({x:0,y:0}),MAX=40;
const onTS=useCallback(e=>{if(touchId.current!==null)return;const t=e.changedTouches[0];touchId.current=t.identifier;origin.current={x:t.clientX,y:t.clientY};setKnob({x:0,y:0});e.preventDefault();},[]);
const onTM=useCallback(e=>{for(const t of e.changedTouches){if(t.identifier!==touchId.current)continue;let dx=t.clientX-origin.current.x,dy=t.clientY-origin.current.y;const d=Math.sqrt(dx*dx+dy*dy);if(d>MAX){dx=dx/d*MAX;dy=dy/d*MAX;}setKnob({x:dx,y:dy});onDelta(dx/MAX,dy/MAX);}e.preventDefault();},[onDelta]);
const onTE=useCallback(e=>{for(const t of e.changedTouches)if(t.identifier===touchId.current){touchId.current=null;setKnob({x:0,y:0});onDelta(0,0);}},[onDelta]);
return (

<div onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE} style={{position:"absolute",bottom:32,[side]:32,width:110,height:110,borderRadius:"50%",background:"rgba(255,255,255,0.08)",border:"2px solid rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",touchAction:"none",userSelect:"none"}}>
<div style={{width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.25)",border:"2px solid rgba(255,255,255,0.5)",transform:"translate("+knob.x+"px,"+knob.y+"px)",transition:touchId.current===null?"transform 0.1s":"none",pointerEvents:"none"}}/>
</div>
);
}

export default function Maze98() {
const mountRef=useRef(null),touchMove=useRef({x:0,y:0}),touchLook=useRef({x:0,y:0});
const wallMatRef=useRef(null),floorMatRef=useRef(null),ceilMatRef=useRef(null);
const minimapRef=useRef(null),visitedRef=useRef(new Set());
const isMobile=window.matchMedia(”(pointer: coarse)”).matches;
const mmModeRef=useRef(1),mmPosRef=useRef(“br”),mmOpRef=useRef(0.45);
const [mmMode,setMmMode]=useState(1);
const [mmPos,setMmPos]=useState(“br”);
const [mmOp,setMmOp]=useState(0.45);
const setMode=v=>{const nv=typeof v===“function”?v(mmModeRef.current):v;mmModeRef.current=nv;setMmMode(nv);};
const setPos=v=>{mmPosRef.current=v;setMmPos(v);};
const setOp=v=>{mmOpRef.current=v;setMmOp(v);};
const monsterActiveRef=useRef(false);
const [,setMonsterActive]=useState(false);
const setMonster=v=>{monsterActiveRef.current=v;setMonsterActive(v);};
const [won,setWon]=useState(false);
const [menuOpen,setMenuOpen]=useState(false);
const [sel,setSel]=useState({wall:0,floor:0,ceil:0});
const [devMode,setDevMode]=useState(false);
const [straight,setStraight]=useState(false);
const [gameKey,setGameKey]=useState(0);
const floorClicksRef=useRef(0);
const [floorCount,setFloorCount]=useState(0);
const handleFloorSecret=()=>{floorClicksRef.current+=1;setFloorCount(floorClicksRef.current);if(floorClicksRef.current>=10){setDevMode(true);floorClicksRef.current=0;setFloorCount(0);}};
const restart=()=>{setWon(false);setMonster(false);setSel({wall:0,floor:0,ceil:0});setMenuOpen(false);visitedRef.current=new Set();setGameKey(k=>k+1);};

useEffect(()=>{
if(wallMatRef.current){wallMatRef.current.map=WALL_TEXS[sel.wall].fn();wallMatRef.current.map.needsUpdate=true;wallMatRef.current.needsUpdate=true;}
if(floorMatRef.current){floorMatRef.current.map=FLOOR_TEXS[sel.floor].fn();floorMatRef.current.map.needsUpdate=true;floorMatRef.current.needsUpdate=true;}
if(ceilMatRef.current){ceilMatRef.current.map=CEIL_TEXS[sel.ceil].fn();ceilMatRef.current.map.needsUpdate=true;ceilMatRef.current.needsUpdate=true;}
const isB=sel.wall===BACKROOMS_IDX&&sel.floor===BACKROOMS_IDX&&sel.ceil===BACKROOMS_IDX;
if(isB) setMonster(true); else setMonster(false);
},[sel]);

useEffect(()=>{
const maze=straight?generateStraight():generateMaze(ROWS,COLS);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x000000);scene.fog=new THREE.Fog(0x000000,30,80);
const camera=new THREE.PerspectiveCamera(70,window.innerWidth/window.innerHeight,0.1,200);
camera.position.set(CELL*.5,CELL*.5,CELL*.5);camera.rotation.order=“YXZ”;
const renderer=new THREE.WebGLRenderer({antialias:false});
renderer.setSize(window.innerWidth,window.innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
mountRef.current.appendChild(renderer.domElement);
scene.add(new THREE.AmbientLight(0xffffff,0.7));
const pt=new THREE.PointLight(0xffffee,1.2,40);camera.add(pt);scene.add(camera);
const wallMat=new THREE.MeshLambertMaterial({map:WALL_TEXS[sel.wall].fn()});
const floorMat=new THREE.MeshLambertMaterial({map:FLOOR_TEXS[sel.floor].fn()});
const ceilMat=new THREE.MeshLambertMaterial({map:CEIL_TEXS[sel.ceil].fn()});
wallMatRef.current=wallMat;floorMatRef.current=floorMat;ceilMatRef.current=ceilMat;
const H=CELL,fGeo=new THREE.PlaneGeometry(CELL,CELL),cGeo=new THREE.PlaneGeometry(CELL,CELL);
for(let r=0;r<ROWS;r++)for(let col=0;col<COLS;col++){
const x=col*CELL+CELL/2,z=r*CELL+CELL/2;
const fl=new THREE.Mesh(fGeo,floorMat);fl.rotation.x=-Math.PI/2;fl.position.set(x,0,z);scene.add(fl);
const ce=new THREE.Mesh(cGeo,ceilMat);ce.rotation.x=Math.PI/2;ce.position.set(x,H,z);scene.add(ce);
}
const wGH=new THREE.PlaneGeometry(CELL,H),wGV=new THREE.PlaneGeometry(CELL,H);
for(let r=0;r<=ROWS;r++)for(let col=0;col<COLS;col++)if(maze.h[r][col]){const w=new THREE.Mesh(wGH,wallMat);w.position.set(col*CELL+CELL/2,H/2,r*CELL);scene.add(w);const w2=w.clone();w2.rotation.y=Math.PI;scene.add(w2);}
for(let r=0;r<ROWS;r++)for(let col=0;col<=COLS;col++)if(maze.v[r][col]){const w=new THREE.Mesh(wGV,wallMat);w.rotation.y=Math.PI/2;w.position.set(col*CELL,H/2,r*CELL+CELL/2);scene.add(w);const w2=w.clone();w2.rotation.y=-Math.PI/2;scene.add(w2);}
const ratRow=straight?0:ROWS-1;
const rat=new THREE.Sprite(new THREE.SpriteMaterial({map:makeRatTexture(),transparent:true}));
rat.scale.set(4,4,1);rat.position.set((COLS-1)*CELL+CELL/2,H*.45,ratRow*CELL+CELL/2);scene.add(rat);
let startYaw=0,spriteDX=0,spriteDZ=-7;
if(!maze.h[1][0]){startYaw=Math.PI;spriteDZ=7;}else if(!maze.v[0][1]){startYaw=Math.PI/2;spriteDX=7;spriteDZ=0;}
const startSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:makeStartTexture(),transparent:true,opacity:0.92,depthWrite:false}));
startSprite.scale.set(7,3.2,1);startSprite.position.set(CELL*.5+spriteDX,CELL*.55,CELL*.5+spriteDZ);scene.add(startSprite);

// Audio
let audioCtx=null,screamGain=null,screamStarted=false;
const startScream=()=>{
if(screamStarted)return; screamStarted=true;
audioCtx=new (window.AudioContext||window.webkitAudioContext)();
screamGain=audioCtx.createGain(); screamGain.gain.value=0; screamGain.connect(audioCtx.destination);
const osc1=audioCtx.createOscillator(); osc1.type=“sawtooth”; osc1.frequency.value=880;
const g1=audioCtx.createGain(); g1.gain.value=0.4; osc1.connect(g1); g1.connect(screamGain); osc1.start();
const osc2=audioCtx.createOscillator(); osc2.type=“square”; osc2.frequency.value=110;
const g2=audioCtx.createGain(); g2.gain.value=0.3; osc2.connect(g2); g2.connect(screamGain); osc2.start();
const buf=audioCtx.createBuffer(1,audioCtx.sampleRate*2,audioCtx.sampleRate);
const d=buf.getChannelData(0); for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
const ns=audioCtx.createBufferSource(); ns.buffer=buf; ns.loop=true;
const nf=audioCtx.createBiquadFilter(); nf.type=“bandpass”; nf.frequency.value=1200; nf.Q.value=0.5;
const ng=audioCtx.createGain(); ng.gain.value=0.25; ns.connect(nf); nf.connect(ng); ng.connect(screamGain); ns.start();
const lfo=audioCtx.createOscillator(); lfo.frequency.value=6;
const lg=audioCtx.createGain(); lg.gain.value=40; lfo.connect(lg); lg.connect(osc1.frequency); lfo.start();
};
const updateScream=(dist)=>{
if(!screamGain||!audioCtx)return;
const maxD=CELL*8,minD=CELL*2;
const vol=dist>maxD?0:dist<minD?1:1-(dist-minD)/(maxD-minD);
screamGain.gain.setTargetAtTime(vol*0.42,audioCtx.currentTime,0.3);
};

// Monster
const spawnCell=findMonsterSpawn(maze);
const monsterPos={x:spawnCell[1]*CELL+CELL*.5,z:spawnCell[0]*CELL+CELL*.5};
let monsterTarget={x:monsterPos.x,z:monsterPos.z},monsterBfsTimer=0;
const monsterSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:makeMonsterTexture(),transparent:true,depthWrite:false}));
monsterSprite.scale.set(11,14,1); monsterSprite.visible=false;
monsterSprite.position.set(monsterPos.x,CELL*.55,monsterPos.z);
scene.add(monsterSprite);

// Monster glow light - eerie reddish
const monsterLight = new THREE.PointLight(0xff2200, 0, 25);
monsterLight.position.copy(monsterSprite.position);
scene.add(monsterLight);

const keys={};
const onKD=e=>{keys[e.code]=true;if([“ArrowUp”,“ArrowDown”,“ArrowLeft”,“ArrowRight”].includes(e.code))e.preventDefault();if(e.code===“Tab”){e.preventDefault();setMode(v=>(v+1)%3);}if(e.code===“KeyM”){e.preventDefault();setMenuOpen(v=>!v);}};
window.addEventListener(“keydown”,onKD);window.addEventListener(“keyup”,e=>{keys[e.code]=false;});
let yaw=startYaw;
const canMove=(nx,nz)=>{
const mg=1.5,r=Math.floor(nz/CELL),col=Math.floor(nx/CELL);
if(r<0||r>=ROWS||col<0||col>=COLS)return false;
const lr=nz/CELL-r,lc=nx/CELL-col;
if(lr<mg/CELL&&maze.h[r][col])return false;if(lr>1-mg/CELL&&maze.h[r+1][col])return false;
if(lc<mg/CELL&&maze.v[r][col])return false;if(lc>1-mg/CELL&&maze.v[r][col+1])return false;
return true;
};
let frame;
const animate=()=>{
frame=requestAnimationFrame(animate);const spd=0.18;
if(keys[“ArrowLeft”])yaw-=0.03;if(keys[“ArrowRight”])yaw+=0.03;
yaw+=touchLook.current.x*.07;
const fX=Math.sin(yaw),fZ=-Math.cos(yaw),rX=Math.cos(yaw),rZ=Math.sin(yaw);
let nx=camera.position.x,nz=camera.position.z;
if(keys[“KeyW”]||keys[“ArrowUp”]){nx+=fX*spd;nz+=fZ*spd;}if(keys[“KeyS”]||keys[“ArrowDown”]){nx-=fX*spd;nz-=fZ*spd;}
if(keys[“KeyA”]){nx-=rX*spd;nz-=rZ*spd;}if(keys[“KeyD”]){nx+=rX*spd;nz+=rZ*spd;}
const tm=touchMove.current;
if(Math.abs(tm.y)>.05){nx+=fX*spd*tm.y*-3.5;nz+=fZ*spd*tm.y*-3.5;}
if(Math.abs(tm.x)>.05){nx+=rX*spd*tm.x*3.5;nz+=rZ*spd*tm.x*3.5;}
if(canMove(nx,nz)){camera.position.x=nx;camera.position.z=nz;}
camera.rotation.y=-yaw;camera.position.y=CELL*.5+Math.sin(Date.now()*.005)*.05;
startSprite.position.y=CELL*.55+Math.sin(Date.now()*.0015)*.25;
if(monsterActiveRef.current){
monsterSprite.visible=true;
startScream();
const distToPlayer=Math.sqrt((camera.position.x-monsterPos.x)**2+(camera.position.z-monsterPos.z)**2);
updateScream(distToPlayer);
// Monster light intensity based on distance
const lightIntensity = distToPlayer < CELL * 6 ? (1 - distToPlayer / (CELL * 6)) * 2.5 : 0;
monsterLight.intensity = lightIntensity;
monsterBfsTimer++;
if(monsterBfsTimer>20){
monsterBfsTimer=0;
const mr=Math.floor(monsterPos.z/CELL),mc2=Math.floor(monsterPos.x/CELL);
const pr2=Math.floor(camera.position.z/CELL),pc2=Math.floor(camera.position.x/CELL);
const next=bfsNext(maze,mr,mc2,pr2,pc2);
if(next)monsterTarget={x:next[1]*CELL+CELL/2,z:next[0]*CELL+CELL/2};
else monsterTarget={x:camera.position.x,z:camera.position.z};
}
const mspd=0.18,mdx=monsterTarget.x-monsterPos.x,mdz=monsterTarget.z-monsterPos.z,md=Math.sqrt(mdx*mdx+mdz*mdz);
if(md>0.1){monsterPos.x+=mdx/md*mspd;monsterPos.z+=mdz/md*mspd;}
// Bobbing + slight jitter for creepiness
const bobY = CELL * 0.55 + Math.sin(Date.now() * 0.008) * 0.15;
const jitterX = Math.sin(Date.now() * 0.037) * 0.08;
const jitterZ = Math.cos(Date.now() * 0.029) * 0.08;
monsterSprite.position.set(monsterPos.x + jitterX, bobY, monsterPos.z + jitterZ);
monsterLight.position.set(monsterPos.x, CELL * 0.5, monsterPos.z);
// Scale pulsing
const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.04;
monsterSprite.scale.set(11 * pulse, 14 * pulse, 1);
if(distToPlayer<1.8)setWon(“caught”);
}
if(camera.position.distanceTo(rat.position)<CELL*1.2)setWon(“win”);
rat.lookAt(camera.position);
const pr=Math.floor(camera.position.z/CELL),pc=Math.floor(camera.position.x/CELL);
visitedRef.current.add(pr+”_”+pc);
const mc=minimapRef.current;
if(mc&&mmModeRef.current>0){
const isCenter=mmPosRef.current===“center”,S=isCenter?14:(mmModeRef.current===2?18:7),VIEW=280;
mc.width=isCenter?VIEW:COLS*S;mc.height=isCenter?VIEW:ROWS*S;
const mx=mc.getContext(“2d”);mx.clearRect(0,0,mc.width,mc.height);
if(isCenter){
mx.save();mx.beginPath();mx.arc(VIEW/2,VIEW/2,VIEW/2,0,Math.PI*2);mx.clip();
mx.translate(VIEW/2,VIEW/2);mx.rotate(-yaw);mx.translate(-(pc*S+S/2),-(pr*S+S/2));
mx.strokeStyle=“rgba(255,220,100,0.95)”;mx.lineWidth=2;
for(const key of visitedRef.current){const[vr,vc]=key.split(”*”).map(Number),cx2=vc*S,cy2=vr*S;if(maze.h[vr][vc]){mx.beginPath();mx.moveTo(cx2,cy2);mx.lineTo(cx2+S,cy2);mx.stroke();}if(maze.h[vr+1][vc]){mx.beginPath();mx.moveTo(cx2,cy2+S);mx.lineTo(cx2+S,cy2+S);mx.stroke();}if(maze.v[vr][vc]){mx.beginPath();mx.moveTo(cx2,cy2);mx.lineTo(cx2,cy2+S);mx.stroke();}if(maze.v[vr][vc+1]){mx.beginPath();mx.moveTo(cx2+S,cy2);mx.lineTo(cx2+S,cy2+S);mx.stroke();}}
mx.restore();mx.fillStyle=”#00ffff”;mx.beginPath();mx.moveTo(VIEW/2,VIEW/2-9);mx.lineTo(VIEW/2-5,VIEW/2+5);mx.lineTo(VIEW/2+5,VIEW/2+5);mx.closePath();mx.fill();
mx.strokeStyle=“rgba(255,220,100,0.4)”;mx.lineWidth=1.5;mx.beginPath();mx.arc(VIEW/2,VIEW/2,VIEW/2-1,0,Math.PI*2);mx.stroke();
}else{
mx.strokeStyle=“rgba(255,220,100,0.9)”;mx.lineWidth=mmModeRef.current===2?2:1.5;
for(const key of visitedRef.current){const[vr,vc]=key.split(”*”).map(Number),cx2=vc*S,cy2=vr*S;if(maze.h[vr][vc]){mx.beginPath();mx.moveTo(cx2,cy2);mx.lineTo(cx2+S,cy2);mx.stroke();}if(maze.h[vr+1][vc]){mx.beginPath();mx.moveTo(cx2,cy2+S);mx.lineTo(cx2+S,cy2+S);mx.stroke();}if(maze.v[vr][vc]){mx.beginPath();mx.moveTo(cx2,cy2);mx.lineTo(cx2,cy2+S);mx.stroke();}if(maze.v[vr][vc+1]){mx.beginPath();mx.moveTo(cx2+S,cy2);mx.lineTo(cx2+S,cy2+S);mx.stroke();}}
const ps=mmModeRef.current===2?5:2.5;mx.fillStyle=”#00ffff”;mx.beginPath();mx.arc(pc*S+S/2,pr*S+S/2,ps,0,Math.PI*2);mx.fill();
mx.strokeStyle=”#00ffff”;mx.lineWidth=mmModeRef.current===2?2:1.5;mx.beginPath();mx.moveTo(pc*S+S/2,pr*S+S/2);mx.lineTo(pc*S+S/2+Math.sin(yaw)*S*0.8,pr*S+S/2-Math.cos(yaw)*S*0.8);mx.stroke();
}
}
renderer.render(scene,camera);
};
animate();
const onResize=()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);};
window.addEventListener(“resize”,onResize);
return ()=>{
cancelAnimationFrame(frame);
window.removeEventListener(“keydown”,onKD);
window.removeEventListener(“resize”,onResize);
if(audioCtx)audioCtx.close();
mountRef.current?.removeChild(renderer.domElement);
renderer.dispose();
};
},[straight,gameKey]);

const posStyle=mmPos===“center”?{top:“50%”,left:“50%”,transform:“translate(-50%,-50%)”}:mmPos===“tl”?{top:60,left:16}:mmPos===“tr”?{top:60,right:16}:mmPos===“bl”?{bottom:80,left:16}:{bottom:80,right:16};

return (

<div className="relative w-full h-screen overflow-hidden select-none" style={{background:"#000"}}>
<div ref={mountRef} className="w-full h-full"/>
{isMobile&&<VirtualJoystick side="left" onDelta={(x,y)=>{touchMove.current={x,y};}}/>}
{isMobile&&<VirtualJoystick side="right" onDelta={(x,y)=>{touchLook.current={x,y};}}/>}
{won&&(
<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.95)",zIndex:10}}>
{won==="caught"?(
<div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%",height:"100%",justifyContent:"center",padding:16,boxSizing:"border-box"}}>
<canvas style={{display:"block",imageRendering:"pixelated",width:"min(70vh,90vw)",height:"min(87.5vh,112.5vw)",marginBottom:16}}
ref={el=>{if(!el)return;el.width=512;el.height=640;const ctx2=el.getContext("2d"),src=makeMonsterTexture(),img=src.image;const draw=()=>ctx2.drawImage(img,0,0,512,640);if(img instanceof HTMLCanvasElement)draw();else{img.onload=draw;if(img.complete)draw();}}}
/>
<div style={{fontSize:"clamp(40px,10vw,88px)",fontWeight:"bold",letterSpacing:10,color:"#ff2222",textShadow:"0 0 30px #ff0000, 0 0 80px #aa0000",marginBottom:24,fontFamily:"MS Sans Serif, Arial"}}>CAGASTE</div>
<button onClick={restart} style={{background:"#d4d0c8",color:"#000",border:"2px outset #fff",padding:"10px 36px",fontFamily:"MS Sans Serif, Arial",fontSize:16,cursor:"pointer"}}>Jugar de nuevo</button>
</div>
):(
<div style={{background:"#000080",border:"4px outset #aaa",padding:"32px",fontFamily:"MS Sans Serif, Arial",color:"#fff",textAlign:"center",width:"80vw",maxWidth:500,boxSizing:"border-box"}}>
<div style={{fontSize:"clamp(48px,10vw,96px)",marginBottom:20}}>🐭</div>
<div style={{fontSize:"clamp(18px,4vw,28px)",fontWeight:"bold",marginBottom:8}}>Encontraste la rata!</div>
<div style={{fontSize:14,color:"#aad",marginBottom:32}}>Felicitaciones. Has completado el laberinto.</div>
<button onClick={restart} style={{background:"#d4d0c8",color:"#000",border:"2px outset #fff",padding:"10px 36px",fontFamily:"MS Sans Serif, Arial",fontSize:16,cursor:"pointer"}}>Jugar de nuevo</button>
</div>
)}
</div>
)}
{menuOpen&&<TextureMenu sel={sel} onApply={setSel} onClose={()=>setMenuOpen(false)} mmPos={mmPos} onMmPos={setPos} mmOp={mmOp} onMmOp={setOp} devMode={devMode} onFloorClick={handleFloorSecret} floorClickCount={floorCount} onStraight={()=>{setStraight(s=>!s);setGameKey(k=>k+1);}} onMonster={()=>setMonster(true)} isMobile={isMobile}/>}
{mmMode>0&&(
<div style={{position:"absolute",lineHeight:0,pointerEvents:"none",borderRadius:mmPos==="center"?"50%":4,...posStyle}}>
<canvas ref={minimapRef} style={{display:"block",imageRendering:"pixelated",opacity:mmOp,borderRadius:mmPos==="center"?"50%":0}}/>
</div>
)}
<button onClick={()=>setMenuOpen(true)} style={{position:"absolute",top:16,left:16,background:"#d4d0c8",color:"#000",border:"2px outset #ffffff",fontFamily:"MS Sans Serif, Arial",fontSize:11,padding:"4px 12px",cursor:"pointer"}}>Menu</button>
</div>
);
}