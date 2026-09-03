(() => {
  const $ = s => document.querySelector(s);
  const home = $('#homeView'), game = $('#gameView'), grid = $('#gameGrid'), stage = $('#gameStage'), hud = $('#gameHud');
  const title = $('#gameTitle'), toast = $('#toast');
  const resultLayer = $('#gameResult'), resultTitle = $('#gameResultTitle'), resultText = $('#gameResultText'), resultIcon = $('#gameResultIcon');
  const turnBanner = $('#turnBanner'), turnBannerText = $('#turnBannerText');
  const resetConfirm = $('#resetConfirm');
  const stats = JSON.parse(localStorage.getItem('srbStats') || '{"played":0,"wins":0,"best2048":0,"snake":0}');
  let current = null, cleanup = () => {}, sound = true, gameFilter = 'solo', turnTimer = 0;

  const games = [
    {id:'ttt',name:'Tic Tac Toe',desc:'Classic 3×3 duel',emoji:'✕◯',mode:'2 PLAYERS',art:'ttt',type:'multi'},
    {id:'c4',name:'Connect 4',desc:'Drop. Stack. Connect.',emoji:'🔴',mode:'2 PLAYERS',art:'c4',type:'multi'},
    {id:'dots',name:'Dots & Boxes',desc:'Claim the most boxes',emoji:'◆',mode:'2 PLAYERS',art:'dots',type:'multi'},
    {id:'sos',name:'SOS',desc:'Build SOS, score points',emoji:'SOS',mode:'2 PLAYERS',art:'sos',type:'multi'},
    {id:'g2048',name:'2048',desc:'Merge tiles, chase 2048',emoji:'2048',mode:'1 PLAYER',art:'g2048',type:'solo'},
    {id:'snake',name:'Snake',desc:'Eat. Grow. Survive.',emoji:'🐍',mode:'1 PLAYER',art:'snake',type:'solo'},
    {id:'memory',name:'Memory Match',desc:'Flip cards, find pairs',emoji:'🃏',mode:'1 PLAYER',art:'memory',type:'solo'},
    {id:'memory2',name:'Memory Match',desc:'Pair hunt with extra turns',emoji:'🃏',mode:'2 PLAYERS',art:'memory',type:'multi'},
    {id:'rps',name:'Rock Paper Scissors',desc:'Secret picks • Best of 3/5',emoji:'✊',mode:'2 PLAYERS',art:'rps',type:'multi'},
    {id:'hockey',name:'Air Hockey',desc:'Real-time neon duel',emoji:'🏒',mode:'2 PLAYERS',art:'hockey',type:'multi'}
  ];

  function save(){ localStorage.setItem('srbStats',JSON.stringify(stats)); updateStats(); }
  function updateStats(){ $('#playedCount').textContent=stats.played; $('#winsCount').textContent=stats.wins; $('#best2048').textContent=stats.best2048; }
  function ping(freq=460,d=.05){ if(!sound) return; try{const a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.035,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d);}catch(e){} }
  function showToast(t){ toast.textContent=t;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1400); }
  function trackEvent(name,params={}){ try{ if(typeof window.gtag==='function') window.gtag('event',name,params); }catch(e){} }

  function showTurn(text){
    clearTimeout(turnTimer);
    if(current==='memory2'){
      const m=text.match(/^PLAYER ([AB]) (TURN|AGAIN)$/);
      if(m) turnBannerText.innerHTML=`PLAYER <em class="turn-player turn-player-${m[1].toLowerCase()}">${m[1]}</em> <b>${m[2]}</b>`;
      else turnBannerText.textContent=text;
    }else turnBannerText.textContent=text;
    turnBanner.hidden=false; turnBanner.classList.remove('turn-pop'); void turnBanner.offsetWidth; turnBanner.classList.add('turn-pop');
    turnTimer=setTimeout(()=>{turnBanner.hidden=true;},900);
  }
  function hideResult(){ resultLayer.hidden=true; }
  function showGameResult(main,sub='',icon='🏆'){
    resultTitle.textContent=main; resultText.textContent=sub; resultIcon.textContent=icon; resultLayer.hidden=false; ping(icon==='🏆'?820:540,.1);
  }
  $('#gameResultAction').addEventListener('click',()=>{hideResult();startGame();});
  $('#gameResultHome').addEventListener('click',()=>{hideResult(); if(current) history.back(); else goHome(false);});

  function clearGameClasses(){ [...document.body.classList].filter(c=>c.startsWith('game-')).forEach(c=>document.body.classList.remove(c)); }
  function renderHome(){
    const visible=games.filter(g=>g.type===gameFilter);
    grid.innerHTML=visible.map(g=>`<button class="game-card" data-game="${g.id}"><div class="art ${g.art}"><span class="emoji">${g.emoji}</span></div><span class="mode-badge">${g.mode}</span><h4>${g.name}</h4><p>${g.desc}</p></button>`).join('');
    $('#gameCountPill').textContent=`${visible.length} Games`;
    grid.querySelectorAll('.game-card').forEach(b=>b.addEventListener('click',()=>openGame(b.dataset.game,true)));
  }
  document.querySelectorAll('.game-tab').forEach(tab=>tab.addEventListener('click',()=>{
    gameFilter=tab.dataset.filter;document.querySelectorAll('.game-tab').forEach(t=>{const active=t===tab;t.classList.toggle('active',active);t.setAttribute('aria-selected',String(active));});renderHome();ping(560,.035);trackEvent('game_filter',{filter:gameFilter});
  }));
  $('#instagramFollow')?.addEventListener('click',()=>trackEvent('instagram_follow_click',{profile:'saurabh_rai_srb'}));

  function openGame(id,push=true){
    cleanup(); hideResult(); current=id; stats.played++; save(); const g=games.find(x=>x.id===id); if(!g)return;
    trackEvent('game_start',{game_name:id,game_title:g.name,game_mode:g.mode}); title.textContent=g.name;
    home.classList.remove('active');game.classList.add('active');document.body.classList.add('playing');clearGameClasses();document.body.classList.add(`game-${id}`);stage.dataset.game=id;ping(520,.06);startGame();
    if(push) history.pushState({srbView:'game',game:id},'',location.pathname+location.search+`#${id}`);
  }
  function goHome(updateHistory=false){ cleanup();hideResult();clearTimeout(turnTimer);turnBanner.hidden=true;game.classList.remove('active');home.classList.add('active');current=null;stage.innerHTML='';hud.innerHTML='';document.body.classList.remove('playing');clearGameClasses();delete stage.dataset.game;if(updateHistory)history.replaceState({srbView:'home'},'',location.pathname+location.search); }
  function startGame(){ cleanup(); cleanup=()=>{}; hideResult(); stage.innerHTML='';hud.innerHTML=''; if(current==='ttt') ticTacToe(); if(current==='c4') connect4(); if(current==='dots') dotsBoxes(); if(current==='sos') sosGame(); if(current==='g2048') game2048(); if(current==='snake') snakeGame(); if(current==='memory') memoryMatch(false); if(current==='memory2') memoryMatch(true); if(current==='rps') rpsGame(); if(current==='hockey') airHockey(); }

  history.replaceState({srbView:'home'},'',location.pathname+location.search);
  window.addEventListener('popstate',e=>{
    const st=e.state;
    if(st?.srbView==='game'&&st.game){ if(current!==st.game) openGame(st.game,false); }
    else goHome(false);
  });
  $('#backBtn').addEventListener('click',()=>{ if(current) history.back(); });
  $('#restartBtn').addEventListener('click',()=>{ if(!current)return; resetConfirm.hidden=false; });
  $('#cancelReset').addEventListener('click',()=>resetConfirm.hidden=true);
  $('#confirmReset').addEventListener('click',()=>{resetConfirm.hidden=true;trackEvent('game_reset',{game_name:current});startGame();});
  resetConfirm.addEventListener('click',e=>{if(e.target===resetConfirm)resetConfirm.hidden=true;});
  $('#soundBtn').addEventListener('click',e=>{sound=!sound;e.currentTarget.textContent=sound?'🔊':'🔇';showToast(sound?'Sound on':'Sound off');});

  function hud2(p1,p2,turn=1,n1='PLAYER A',n2='PLAYER B'){ hud.innerHTML=`<div class="hud"><div class="hud-card ${turn===1?'turn-active':''}"><span>${n1}</span><strong>${p1}</strong></div><div class="hud-card ${turn===2?'turn-active':''}"><span>${n2}</span><strong>${p2}</strong></div></div>`; }

  function ticTacToe(){
    let b=Array(9).fill(''),turn='X',done=false; const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    function draw(){hud2(turn==='X'?'YOUR TURN':'X',turn==='O'?'YOUR TURN':'O',turn==='X'?1:2);stage.innerHTML=`<div class="board ttt-board">${b.map((v,i)=>`<button class="cell ${v==='X'?'mark-x':v==='O'?'mark-o':''}" data-i="${i}">${v}</button>`).join('')}</div><p class="game-help">Take turns on the same device • First line of 3 wins</p>`;stage.querySelectorAll('.cell').forEach(c=>c.addEventListener('click',()=>move(+c.dataset.i)));}
    function move(i){if(done||b[i])return;b[i]=turn;ping(turn==='X'?520:680);const w=wins.find(a=>a.every(k=>b[k]===turn));if(w){done=true;draw();w.forEach(i=>stage.children[0].children[i].classList.add('win-cell'));stats.wins++;save();showGameResult(`PLAYER ${turn==='X'?'A':'B'} WINS!`,'Three in a row.','🏆');return;}if(b.every(Boolean)){done=true;draw();showGameResult('DRAW GAME','Perfectly matched.','🤝');return;}turn=turn==='X'?'O':'X';draw();}
    draw();
  }

  function connect4(){
    const rows=6,cols=7,b=Array.from({length:rows},()=>Array(cols).fill(0));let turn=1,done=false;
    function draw(){hud2(turn===1?'YOUR TURN':'RED',turn===2?'YOUR TURN':'GOLD',turn);stage.innerHTML=`<div class="connect-board board">${b.flatMap((r,ri)=>r.map((v,ci)=>`<button class="cell" data-c="${ci}">${v?`<span class="disc p${v}"></span>`:''}</button>`)).join('')}</div><p class="game-help">Tap any column • Connect 4 horizontally, vertically or diagonally</p>`;stage.querySelectorAll('.cell').forEach(c=>c.addEventListener('click',()=>drop(+c.dataset.c)));}
    function win(r,c,p){for(const [dr,dc] of [[1,0],[0,1],[1,1],[1,-1]]){let n=1;for(const s of [-1,1]){let rr=r+dr*s,cc=c+dc*s;while(rr>=0&&rr<rows&&cc>=0&&cc<cols&&b[rr][cc]===p){n++;rr+=dr*s;cc+=dc*s;}}if(n>=4)return true;}return false;}
    function drop(c){if(done)return;let r=rows-1;while(r>=0&&b[r][c])r--;if(r<0)return;b[r][c]=turn;ping(turn===1?420:620,.07);if(win(r,c,turn)){done=true;draw();stats.wins++;save();showGameResult(`PLAYER ${turn===1?'A':'B'} WINS!`,'Connected four.','🏆');return;}if(b.flat().every(Boolean)){done=true;draw();showGameResult('DRAW GAME','Board is full.','🤝');return;}turn=turn===1?2:1;draw();}
    draw();
  }

  function dotsBoxes(){
    const n=4;let h=Array.from({length:n},()=>Array(n-1).fill(0)),v=Array.from({length:n-1},()=>Array(n).fill(0)),boxes=Array.from({length:n-1},()=>Array(n-1).fill(0)),turn=1,score=[0,0,0],done=false;
    function complete(r,c){return h[r][c]&&h[r+1][c]&&v[r][c]&&v[r][c+1]}
    function draw(){hud2(`${score[1]} BOXES`,`${score[2]} BOXES`,turn);let html='<div class="dots-board">';for(let R=0;R<2*n-1;R++){for(let C=0;C<2*n-1;C++){if(R%2===0&&C%2===0)html+='<span class="dot"></span>';else if(R%2===0)html+=`<button class="line h ${h[R/2][(C-1)/2]?'on'+h[R/2][(C-1)/2]:''}" data-t="h" data-r="${R/2}" data-c="${(C-1)/2}"></button>`;else if(C%2===0)html+=`<button class="line v ${v[(R-1)/2][C/2]?'on'+v[(R-1)/2][C/2]:''}" data-t="v" data-r="${(R-1)/2}" data-c="${C/2}"></button>`;else{let o=boxes[(R-1)/2][(C-1)/2];html+=`<span class="boxfill ${o?'b'+o:''}">${o?'P'+o:''}</span>`}}}html+='</div><p class="game-help">Complete a box to score and take another turn</p>';stage.innerHTML=html;stage.querySelectorAll('.line').forEach(x=>x.addEventListener('click',()=>play(x.dataset.t,+x.dataset.r,+x.dataset.c)));}
    function play(t,r,c){if(done)return;let arr=t==='h'?h:v;if(arr[r][c])return;arr[r][c]=turn;ping(500+turn*100);let got=0;for(let br=0;br<n-1;br++)for(let bc=0;bc<n-1;bc++)if(!boxes[br][bc]&&complete(br,bc)){boxes[br][bc]=turn;score[turn]++;got++;}if(!got)turn=turn===1?2:1;draw();if(score[1]+score[2]===(n-1)*(n-1)){done=true;if(score[1]!==score[2]){const w=score[1]>score[2]?1:2;stats.wins++;save();showGameResult(`PLAYER ${w===1?'A':'B'} WINS!`,`${score[1]} – ${score[2]} boxes`,'🏆')}else showGameResult('DRAW GAME',`${score[1]} – ${score[2]} boxes`,'🤝')}}
    draw();
  }

  function sosGame(){
    const N=5,b=Array(N*N).fill('');let turn=1,letter='S',score=[0,0,0],done=false;const dirs=[[1,0],[0,1],[1,1],[1,-1]];
    function countSOS(idx){let r=Math.floor(idx/N),c=idx%N,count=0;for(const[dr,dc]of dirs)for(let off=-2;off<=0;off++){let s='';for(let k=0;k<3;k++){let rr=r+(off+k)*dr,cc=c+(off+k)*dc;s+=rr>=0&&rr<N&&cc>=0&&cc<N?b[rr*N+cc]:' ';}if(s==='SOS')count++;}return count;}
    function draw(){hud2(`${score[1]} PTS`,`${score[2]} PTS`,turn);stage.innerHTML=`<div class="letter-controls"><button class="letter-btn ${letter==='S'?'active':''}" data-l="S">S</button><button class="letter-btn ${letter==='O'?'active':''}" data-l="O">O</button></div><div class="board sos-board">${b.map((x,i)=>`<button class="cell ${x==='S'?'mark-x':x==='O'?'mark-o':''}" data-i="${i}">${x}</button>`).join('')}</div><p class="game-help">Choose S or O • Every SOS scores 1 point and gives another turn</p>`;stage.querySelectorAll('.letter-btn').forEach(x=>x.addEventListener('click',()=>{letter=x.dataset.l;draw()}));stage.querySelectorAll('.cell').forEach(x=>x.addEventListener('click',()=>play(+x.dataset.i)));}
    function play(i){if(done||b[i])return;b[i]=letter;ping(letter==='S'?500:660);let pts=countSOS(i);score[turn]+=pts;if(!pts)turn=turn===1?2:1;if(b.every(Boolean)){done=true;draw();if(score[1]!==score[2]){const w=score[1]>score[2]?1:2;stats.wins++;save();showGameResult(`PLAYER ${w===1?'A':'B'} WINS!`,`${score[1]} – ${score[2]} points`,'🏆')}else showGameResult('DRAW GAME',`${score[1]} – ${score[2]} points`,'🤝');return;}draw();}
    draw();
  }

  function game2048(){
    let b=Array(16).fill(0),score=0,startX=0,startY=0,done=false;
    function add(){let e=b.map((v,i)=>v?null:i).filter(v=>v!==null);if(!e.length)return;b[e[Math.floor(Math.random()*e.length)]]=Math.random()<.9?2:4;}
    function moveLine(a){let x=a.filter(Boolean),out=[];for(let i=0;i<x.length;i++){if(x[i]===x[i+1]){out.push(x[i]*2);score+=x[i]*2;i++;}else out.push(x[i]);}while(out.length<4)out.push(0);return out;}
    function move(dir){if(done)return;let old=b.join(',');if(dir==='l'||dir==='r')for(let r=0;r<4;r++){let row=b.slice(r*4,r*4+4);if(dir==='r')row.reverse();row=moveLine(row);if(dir==='r')row.reverse();b.splice(r*4,4,...row);}else for(let c=0;c<4;c++){let col=[b[c],b[c+4],b[c+8],b[c+12]];if(dir==='d')col.reverse();col=moveLine(col);if(dir==='d')col.reverse();for(let r=0;r<4;r++)b[r*4+c]=col[r];}if(b.join(',')!==old){add();ping(420+Math.min(score,1000)/5,.04);stats.best2048=Math.max(stats.best2048,score);save();draw();}if(!canMove()&&!done){done=true;showGameResult('GAME OVER',`Score ${score} • Best ${stats.best2048}`,'2048');}}
    function canMove(){if(b.includes(0))return true;for(let r=0;r<4;r++)for(let c=0;c<4;c++){let i=r*4+c;if(c<3&&b[i]===b[i+1])return true;if(r<3&&b[i]===b[i+4])return true;}return false;}
    function draw(){hud.innerHTML=`<div class="hud"><div class="hud-card turn-active"><span>SCORE</span><strong>${score}</strong></div><div class="hud-card"><span>BEST</span><strong>${stats.best2048}</strong></div></div>`;stage.innerHTML=`<div class="board g2048-board">${b.map(v=>`<div class="tile ${v?'t'+Math.min(v,2048):''}">${v||''}</div>`).join('')}</div><p class="game-help">Swipe anywhere on the board • Arrow keys also work</p>`;let el=stage.querySelector('.g2048-board');el.addEventListener('touchstart',e=>{startX=e.touches[0].clientX;startY=e.touches[0].clientY},{passive:true});el.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});el.addEventListener('touchend',e=>{e.preventDefault();let dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;if(Math.max(Math.abs(dx),Math.abs(dy))<25)return;move(Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u'));},{passive:false});}
    function key(e){let m={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d'}[e.key];if(m){e.preventDefault();move(m)}}window.addEventListener('keydown',key);cleanup=()=>window.removeEventListener('keydown',key);add();add();draw();
  }

  function snakeGame(){
    hud.innerHTML=`<div class="hud"><div class="hud-card turn-active"><span>SCORE</span><strong id="snakeScore">0</strong></div><div class="hud-card"><span>BEST</span><strong>${stats.snake}</strong></div></div>`;
    stage.innerHTML=`<div class="snake-wrap"><div class="speed-picker" aria-label="Snake speed"><button type="button" class="speed-btn" data-speed="slow">SLOW</button><button type="button" class="speed-btn active" data-speed="medium">MEDIUM</button><button type="button" class="speed-btn" data-speed="fast">FAST</button></div><canvas class="snake-canvas" width="360" height="360"></canvas><div class="dpad"><span class="empty"></span><button data-d="u">↑</button><span class="empty"></span><button data-d="l">←</button><button data-d="d">↓</button><button data-d="r">→</button></div><p class="game-help">Walls wrap around • only your own body can knock you out</p></div>`;
    const c=stage.querySelector('canvas'),ctx=c.getContext('2d'),N=18,S=c.width/N;const speeds={slow:{base:260,min:155},medium:{base:185,min:110},fast:{base:120,min:75}};let speedMode='medium',snake=[{x:9,y:9},{x:8,y:9},{x:7,y:9}],dir={x:1,y:0},next={x:1,y:0},food={},score=0,timer,startX,startY,ended=false;
    function delay(){let cfg=speeds[speedMode];return Math.max(cfg.min,cfg.base-score*3);}function restartTimer(){clearInterval(timer);if(!ended)timer=setInterval(tick,delay());}function spawn(){do{food={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)}}while(snake.some(s=>s.x===food.x&&s.y===food.y));}function set(d){let m={u:{x:0,y:-1},d:{x:0,y:1},l:{x:-1,y:0},r:{x:1,y:0}}[d];if(m.x!==-dir.x||m.y!==-dir.y)next=m;}
    function paint(){ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#0b1515';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='rgba(255,255,255,.035)';for(let i=0;i<=N;i++){ctx.beginPath();ctx.moveTo(i*S,0);ctx.lineTo(i*S,c.height);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*S);ctx.lineTo(c.width,i*S);ctx.stroke()}snake.forEach((s,i)=>{let g=ctx.createLinearGradient(s.x*S,s.y*S,(s.x+1)*S,(s.y+1)*S);g.addColorStop(0,i?'#77ed58':'#d7ff66');g.addColorStop(1,i?'#16b99b':'#4de3a4');ctx.fillStyle=g;ctx.shadowColor='#65ff88';ctx.shadowBlur=i?7:14;ctx.beginPath();ctx.roundRect(s.x*S+2,s.y*S+2,S-4,S-4,6);ctx.fill();});ctx.shadowBlur=18;ctx.fillStyle='#ff4f8b';ctx.beginPath();ctx.arc(food.x*S+S/2,food.y*S+S/2,S*.31,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
    function tick(){dir=next;let h={x:(snake[0].x+dir.x+N)%N,y:(snake[0].y+dir.y+N)%N};if(snake.some(s=>s.x===h.x&&s.y===h.y)){ended=true;clearInterval(timer);stats.snake=Math.max(stats.snake,score);save();showGameResult('GAME OVER',`Snake score ${score}`,'🐍');return;}snake.unshift(h);if(h.x===food.x&&h.y===food.y){score++;$('#snakeScore').textContent=score;ping(650,.05);spawn();restartTimer();}else snake.pop();paint();}
    function key(e){let m={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d'}[e.key];if(m){e.preventDefault();set(m)}}stage.querySelectorAll('[data-d]').forEach(b=>b.addEventListener('click',()=>set(b.dataset.d)));stage.querySelectorAll('[data-speed]').forEach(btn=>btn.addEventListener('click',()=>{speedMode=btn.dataset.speed;stage.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===btn));restartTimer();showToast(`${btn.textContent} speed selected`);}));c.addEventListener('touchstart',e=>{startX=e.touches[0].clientX;startY=e.touches[0].clientY},{passive:true});c.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});c.addEventListener('touchend',e=>{e.preventDefault();let dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;if(Math.max(Math.abs(dx),Math.abs(dy))<20)return;set(Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u'));},{passive:false});window.addEventListener('keydown',key);spawn();paint();restartTimer();cleanup=()=>{clearInterval(timer);window.removeEventListener('keydown',key)};
  }

  function classicLudo(){
    const colors=['#ff315e','#ffd43b','#27d980','#3b82f6'];
    const names=['RED','YELLOW','GREEN','BLUE'];
    const route=[[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]];
    const offsets=[0,13,26,39];
    const lanes=[[[7,1],[7,2],[7,3],[7,4],[7,5]],[[1,7],[2,7],[3,7],[4,7],[5,7]],[[7,13],[7,12],[7,11],[7,10],[7,9]],[[13,7],[12,7],[11,7],[10,7],[9,7]]];
    const bases=[[[1,1],[1,4],[4,1],[4,4]],[[1,10],[1,13],[4,10],[4,13]],[[10,10],[10,13],[13,10],[13,13]],[[10,1],[10,4],[13,1],[13,4]]];
    const safeAbs=new Set([0,8,13,21,26,34,39,47]);
    let players=2,turn=0,roll=null,rolling=false,winner=null,tokens=[];
    function resetPlayers(n){players=n;turn=0;roll=null;rolling=false;winner=null;tokens=Array.from({length:n},()=>[-1,-1,-1,-1]);draw();setTimeout(()=>showTurn('PLAYER 1 TURN'),120);}
    function absIndex(p,step){return (step+offsets[p])%52;}
    function canMove(step,d){if(step<0)return d===6;return step+d<=57;}
    function coordFor(p,ti,step){if(step<0)return bases[p][ti];if(step<=51)return route[absIndex(p,step)];if(step<=56)return lanes[p][step-52];return [[7,6],[6,7],[7,8],[8,7]][p];}
    function piecesAt(r,c){let out=[];for(let p=0;p<players;p++)for(let t=0;t<4;t++){let q=coordFor(p,t,tokens[p][t]);if(q&&q[0]===r&&q[1]===c){const movable=p===turn&&roll!==null&&canMove(tokens[p][t],roll);out.push(`<button type="button" class="classic-token ${movable?'movable':''}" data-token="${t}" data-owner="${p}" style="--pc:${colors[p]}" aria-label="Player ${p+1} token ${t+1}"></button>`)}}return out.join('');}
    function cellClass(r,c){let cls='ludo-grid-cell';if(r<6&&c<6)cls+=' home-zone hz0';else if(r<6&&c>8)cls+=' home-zone hz1';else if(r>8&&c>8)cls+=' home-zone hz2';else if(r>8&&c<6)cls+=' home-zone hz3';const ri=route.findIndex(q=>q[0]===r&&q[1]===c);if(ri>=0)cls+=' path-cell'+(safeAbs.has(ri)?' safe-cell':'');for(let p=0;p<4;p++)if(lanes[p].some(q=>q[0]===r&&q[1]===c))cls+=` lane-cell lane-${p}`;if(r>=6&&r<=8&&c>=6&&c<=8)cls+=' center-cell';return cls;}
    function dieDots(n){return `<span class="die-face d${n}">${Array.from({length:9},(_,i)=>`<i class="dot-${i+1}"></i>`).join('')}</span>`;}
    function draw(){
      hud.innerHTML=`<div class="ludo-hud"><div><span>TURN</span><strong style="color:${colors[turn]}">PLAYER ${turn+1}</strong></div><div><span>ROLL</span><strong>${roll??'—'}</strong></div></div>`;
      let cells='';for(let r=0;r<15;r++)for(let c=0;c<15;c++)cells+=`<div class="${cellClass(r,c)}" data-r="${r}" data-c="${c}">${piecesAt(r,c)}</div>`;
      stage.innerHTML=`<div class="ludo-toolbar"><span>PLAYERS</span>${[2,3,4].map(n=>`<button type="button" data-p="${n}" class="mini-chip ${players===n?'active':''}">${n}</button>`).join('')}</div><div class="classic-ludo-board">${cells}<div class="classic-center-dice"><div class="dice-number">${roll??'—'}</div><div class="dice-shell ${rolling?'rolling':''}" id="ludoDie">${dieDots(roll||1)}</div></div></div><button type="button" class="primary-game-btn ludo-roll-btn" id="rollDice" ${rolling||roll!==null||winner!==null?'disabled':''}>${winner!==null?`PLAYER ${winner+1} WON 🏆`:rolling?'ROLLING…':roll===null?'ROLL DICE':'MOVE A TOKEN'}</button><p class="game-help">Roll 6 to bring a token out • tap a glowing token • capture gives another turn</p>`;
      stage.querySelectorAll('[data-p]').forEach(b=>b.addEventListener('click',()=>resetPlayers(+b.dataset.p)));
      stage.querySelector('#rollDice')?.addEventListener('click',rollDice);
      stage.querySelectorAll('.classic-token[data-token]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();if(+b.dataset.owner===turn)moveToken(+b.dataset.token);}));
    }
    function rollDice(){
      if(rolling||roll!==null||winner!==null)return;rolling=true;draw();const die=stage.querySelector('#ludoDie'),num=stage.querySelector('.dice-number');let ticks=0;const iv=setInterval(()=>{const n=1+Math.floor(Math.random()*6);if(num)num.textContent=n;if(die)die.innerHTML=dieDots(n);ticks++;},75);
      setTimeout(()=>{clearInterval(iv);roll=1+Math.floor(Math.random()*6);rolling=false;ping(420+roll*35,.08);draw();const movable=tokens[turn].some(s=>canMove(s,roll));if(!movable)setTimeout(()=>{showToast(`Player ${turn+1} has no move`);roll=null;turn=(turn+1)%players;draw();showTurn(`PLAYER ${turn+1} TURN`);},850);},720);
    }
    function moveToken(ti){
      if(roll===null||winner!==null)return;let step=tokens[turn][ti];if(!canMove(step,roll))return;const wasSix=roll===6;step=step<0?0:step+roll;tokens[turn][ti]=step;let captured=false;
      if(step<=51){const ai=absIndex(turn,step);if(!safeAbs.has(ai)){for(let p=0;p<players;p++)if(p!==turn)for(let j=0;j<4;j++){const os=tokens[p][j];if(os>=0&&os<=51&&absIndex(p,os)===ai){tokens[p][j]=-1;captured=true;}}}}
      if(tokens[turn].every(s=>s===57)){winner=turn;stats.wins++;save();draw();showGameResult(`PLAYER ${turn+1} WINS!`,'Classic Ludo champion.','🏆');return;}
      ping(captured?760:560,.07);roll=null;if(captured||wasSix){draw();showTurn(`PLAYER ${turn+1} AGAIN`);}else{turn=(turn+1)%players;draw();showTurn(`PLAYER ${turn+1} TURN`);}
    }
    resetPlayers(2);
  }

  function memoryMatch(twoPlayer=false){
    const icons=['🎮','👾','🚀','💎','⚡','🎯','🔥','👑','🌟','🍀','🛸','🎧'];
    let cards=[],open=[],matched=new Set(),moves=0,seconds=0,lock=false,timer=null,started=false,turn=1,score=[0,0,0],finished=false;
    function shuffle(){cards=[...icons,...icons].sort(()=>Math.random()-.5);}
    function startTimer(){if(started)return;started=true;timer=setInterval(()=>{seconds++;updateHud();},1000);}
    function updateHud(){if(twoPlayer)hud2(`${score[1]} PAIRS`,`${score[2]} PAIRS`,turn);else hud.innerHTML=`<div class="hud"><div class="hud-card turn-active"><span>MOVES</span><strong>${moves}</strong></div><div class="hud-card"><span>TIME</span><strong>${seconds}s</strong></div></div>`;}
    function draw(){updateHud();stage.innerHTML=`<div class="memory-board">${cards.map((v,i)=>`<button type="button" class="memory-card ${open.includes(i)||matched.has(i)?'flipped':''} ${matched.has(i)?'matched':''}" data-i="${i}"><span class="memory-inner"><span class="memory-back" aria-label="Hidden card"><i></i></span><span class="memory-face">${v}</span></span></button>`).join('')}</div><p class="game-help">${twoPlayer?'Match a pair to play again • miss and the turn switches':'Find all 12 matching pairs • fewer moves = better'}</p>`;stage.querySelectorAll('.memory-card').forEach(b=>b.addEventListener('click',()=>flip(+b.dataset.i)));}
    function finish(){clearInterval(timer);finished=true;if(twoPlayer){if(score[1]===score[2])showGameResult('DRAW GAME',`${score[1]} pairs each`,'🤝');else{const w=score[1]>score[2]?1:2;stats.wins++;save();showGameResult(`PLAYER ${w===1?'A':'B'} WINS!`,`${score[w]} matching pairs`,'🏆');}}else showGameResult('ALL PAIRS FOUND!',`${moves} moves • ${seconds}s`,'🃏');}
    function flip(i){if(lock||finished||matched.has(i)||open.includes(i))return;startTimer();open.push(i);ping(520,.04);draw();if(open.length===2){moves++;const[a,b]=open;if(cards[a]===cards[b]){matched.add(a);matched.add(b);open=[];score[turn]++;ping(760,.08);draw();if(matched.size===cards.length){finish();return;}if(twoPlayer)showTurn(`PLAYER ${turn===1?'A':'B'} AGAIN`);}else{lock=true;setTimeout(()=>{open=[];lock=false;if(twoPlayer){turn=turn===1?2:1;draw();showTurn(`PLAYER ${turn===1?'A':'B'} TURN`);}else draw();},760);}}}
    shuffle();draw();if(twoPlayer)setTimeout(()=>showTurn('PLAYER A TURN'),180);cleanup=()=>clearInterval(timer);
  }

  function rpsGame(){
    const choices=[['rock','✊'],['paper','✋'],['scissors','✌️']];let target=2,score=[0,0,0],round=1,p1=null,phase=1,done=false;
    function result(a,b){if(a===b)return 0;if((a==='rock'&&b==='scissors')||(a==='paper'&&b==='rock')||(a==='scissors'&&b==='paper'))return 1;return 2;}
    function draw(){hud2(`${score[1]} WINS`,`${score[2]} WINS`,phase===1?1:2);let body='';if(done){body=`<div class="rps-result"><div class="rps-big">🏆</div><h3>Match complete</h3></div>`;}else if(phase===1){body=`<div class="rps-secret"><span class="round-pill">ROUND ${round}</span><h3>Player A — pick secretly</h3><div class="rps-choices">${choices.map(([v,e])=>`<button data-rps="${v}">${e}<small>${v}</small></button>`).join('')}</div></div>`;}else if(phase===2){body=`<div class="rps-pass"><div class="pass-icon">📱</div><h3>Pass phone to Player B</h3><p>Player A's choice is hidden.</p><button class="primary-game-btn" id="rpsReady">PLAYER B READY</button></div>`;}else{body=`<div class="rps-secret"><span class="round-pill">ROUND ${round}</span><h3>Player B — choose</h3><div class="rps-choices">${choices.map(([v,e])=>`<button data-rps2="${v}">${e}<small>${v}</small></button>`).join('')}</div></div>`;}stage.innerHTML=`<div class="rps-format"><span>BEST OF</span><button data-best="3" class="mini-chip ${target===2?'active':''}">3</button><button data-best="5" class="mini-chip ${target===3?'active':''}">5</button></div>${body}`;
      stage.querySelectorAll('[data-best]').forEach(b=>b.addEventListener('click',()=>{target=+b.dataset.best===3?2:3;score=[0,0,0];round=1;p1=null;phase=1;done=false;draw();}));
      stage.querySelectorAll('[data-rps]').forEach(b=>b.addEventListener('click',()=>{p1=b.dataset.rps;phase=2;ping(500);draw();}));stage.querySelector('#rpsReady')?.addEventListener('click',()=>{phase=3;draw();});
      stage.querySelectorAll('[data-rps2]').forEach(b=>b.addEventListener('click',()=>{let p2=b.dataset.rps2,w=result(p1,p2);if(w)score[w]++;const em=x=>choices.find(c=>c[0]===x)[1];if(score[1]>=target||score[2]>=target){done=true;stats.wins++;save();draw();setTimeout(()=>showGameResult(`PLAYER ${w===1?'A':'B'} WINS!`,`${em(p1)} vs ${em(p2)} • ${score[1]} – ${score[2]}`,'🏆'),120);}else{showToast(w?`${em(p1)} vs ${em(p2)} • Player ${w===1?'A':'B'} wins round`:`${em(p1)} vs ${em(p2)} • Draw`);round++;phase=1;p1=null;draw();}}));
    }
    draw();
  }

  function airHockey(){
    hud2('0 goals','0 goals',1);
    stage.innerHTML=`<div class="hockey-wrap"><canvas class="hockey-canvas" width="360" height="520"></canvas><div class="hockey-overlay"><button type="button" id="hockeyStart" class="primary-game-btn">START MATCH</button><small>Two players • drag your paddle • first to 5</small></div></div>`;
    const c=stage.querySelector('canvas'),ctx=c.getContext('2d'),W=c.width,H=c.height;
    let running=false,raf=0,score=[0,0,0],p1={x:W/2,y:H-70,r:28},p2={x:W/2,y:70,r:28},puck={x:W/2,y:H/2,vx:2.6,vy:3.2,r:13},ptr=new Map();
    function resetPuck(dir=1){puck={x:W/2,y:H/2,vx:(Math.random()>.5?1:-1)*2.4,vy:dir*3.4,r:13};}
    function clampPad(p,top){p.x=Math.max(p.r,Math.min(W-p.r,p.x));if(top)p.y=Math.max(p.r+15,Math.min(H/2-25,p.y));else p.y=Math.max(H/2+25,Math.min(H-p.r-15,p.y));}
    function local(e){const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
    function onDown(e){c.setPointerCapture?.(e.pointerId);const q=local(e),who=q.y<H/2?2:1;ptr.set(e.pointerId,who);(who===1?p1:p2).x=q.x;(who===1?p1:p2).y=q.y;clampPad(who===1?p1:p2,who===2);}
    function onMove(e){let who=ptr.get(e.pointerId);if(!who)return;const q=local(e),p=who===1?p1:p2;p.x=q.x;p.y=q.y;clampPad(p,who===2);}
    function onUp(e){ptr.delete(e.pointerId);}
    function hit(p){let dx=puck.x-p.x,dy=puck.y-p.y,d=Math.hypot(dx,dy),min=p.r+puck.r;if(d<min&&d>0){let nx=dx/d,ny=dy/d,s=Math.max(4.3,Math.hypot(puck.vx,puck.vy)*1.03);puck.x=p.x+nx*(min+1);puck.y=p.y+ny*(min+1);puck.vx=nx*s;puck.vy=ny*s;ping(540,.025);}}
    function update(){if(!running)return;puck.x+=puck.vx;puck.y+=puck.vy;if(puck.x-puck.r<8){puck.x=8+puck.r;puck.vx=Math.abs(puck.vx)}if(puck.x+puck.r>W-8){puck.x=W-8-puck.r;puck.vx=-Math.abs(puck.vx)}hit(p1);hit(p2);
      const goalL=W*.31,goalR=W*.69;if(puck.y<-puck.r){if(puck.x>goalL&&puck.x<goalR){score[1]++;goal(1)}else{puck.y=puck.r;puck.vy=Math.abs(puck.vy)}}if(puck.y>H+puck.r){if(puck.x>goalL&&puck.x<goalR){score[2]++;goal(2)}else{puck.y=H-puck.r;puck.vy=-Math.abs(puck.vy)}}}
    function goal(w){ping(820,.12);hud2(`${score[1]} goals`,`${score[2]} goals`,w);if(score[w]>=5){running=false;stats.wins++;save();showToast(`Player ${w} wins Air Hockey! 🏆`);stage.querySelector('.hockey-overlay').classList.remove('hidden');stage.querySelector('#hockeyStart').textContent='REMATCH';return;}showToast(`GOAL • Player ${w}`);resetPuck(w===1?1:-1);}
    function circle(x,y,r,fill,glow){ctx.save();ctx.shadowColor=glow;ctx.shadowBlur=18;ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();}
    function draw(){ctx.clearRect(0,0,W,H);let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#102a42');g.addColorStop(.5,'#12102b');g.addColorStop(1,'#35122d');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=3;ctx.strokeRect(8,8,W-16,H-16);ctx.beginPath();ctx.moveTo(8,H/2);ctx.lineTo(W-8,H/2);ctx.stroke();ctx.beginPath();ctx.arc(W/2,H/2,48,0,Math.PI*2);ctx.stroke();ctx.lineWidth=8;ctx.strokeStyle='#50d9ff';ctx.beginPath();ctx.moveTo(W*.31,8);ctx.lineTo(W*.69,8);ctx.stroke();ctx.strokeStyle='#ff5aa7';ctx.beginPath();ctx.moveTo(W*.31,H-8);ctx.lineTo(W*.69,H-8);ctx.stroke();circle(p2.x,p2.y,p2.r,'#36cdf7','#36cdf7');circle(p1.x,p1.y,p1.r,'#ff4f8b','#ff4f8b');circle(puck.x,puck.y,puck.r,'#f9fbff','#ffffff');}
    function loop(){update();draw();raf=requestAnimationFrame(loop)}
    c.addEventListener('pointerdown',onDown);c.addEventListener('pointermove',onMove);c.addEventListener('pointerup',onUp);c.addEventListener('pointercancel',onUp);stage.querySelector('#hockeyStart').addEventListener('click',()=>{if(score[1]>=5||score[2]>=5)score=[0,0,0];hud2(`${score[1]} goals`,`${score[2]} goals`,1);running=true;resetPuck(Math.random()>.5?1:-1);stage.querySelector('.hockey-overlay').classList.add('hidden');});draw();loop();cleanup=()=>{running=false;cancelAnimationFrame(raf);c.removeEventListener('pointerdown',onDown);c.removeEventListener('pointermove',onMove);c.removeEventListener('pointerup',onUp);c.removeEventListener('pointercancel',onUp)};
  }

  let deferredPrompt=null;
  const installBtn=document.getElementById('installBtn');
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  function syncInstallButton(){if(!installBtn)return;const installed=isStandalone();installBtn.hidden=installed;document.body.classList.toggle('install-cta-visible',!installed);}
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;syncInstallButton();});
  installBtn?.addEventListener('click',async()=>{trackEvent('pwa_install_click');if(isStandalone()){syncInstallButton();return;}if(deferredPrompt){deferredPrompt.prompt();try{await deferredPrompt.userChoice;}catch(e){}deferredPrompt=null;syncInstallButton();return;}if(isIOS)showToast('Safari: Share ↑ → Add to Home Screen');else showToast('Browser menu ⋮ → Install app / Add to Home screen');});
  window.addEventListener('appinstalled',()=>{trackEvent('pwa_installed');deferredPrompt=null;syncInstallButton();showToast('SRB Games installed! 🎮');});

  renderHome();updateStats();syncInstallButton();

  if('serviceWorker' in navigator){
    const updateBar=$('#updateBar'),updateNowBtn=$('#updateNowBtn');let refreshing=false,waitingWorker=null;const showUpdate=worker=>{waitingWorker=worker;updateBar.hidden=false;document.body.classList.add('update-ready');};
    updateNowBtn?.addEventListener('click',()=>{trackEvent('pwa_update_click');if(waitingWorker)waitingWorker.postMessage({type:'SKIP_WAITING'});});
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;window.location.reload();});
    window.addEventListener('load',async()=>{try{const reg=await navigator.serviceWorker.register('./service-worker.js');if(reg.waiting&&navigator.serviceWorker.controller)showUpdate(reg.waiting);reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate(worker);});});setInterval(()=>reg.update().catch(()=>{}),30*60*1000);}catch(e){}});
  }
})();
