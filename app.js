(() => {
  const $ = s => document.querySelector(s);
  const home = $('#homeView'), game = $('#gameView'), grid = $('#gameGrid'), stage = $('#gameStage'), hud = $('#gameHud');
  const title = $('#gameTitle'), mode = $('#gameMode'), toast = $('#toast');
  const stats = JSON.parse(localStorage.getItem('srbStats') || '{"played":0,"wins":0,"best2048":0,"snake":0}');
  let current = null, cleanup = () => {}, sound = true;
  const games = [
    {id:'ttt',name:'Tic Tac Toe',desc:'Classic 3×3 duel',emoji:'✕◯',mode:'2 PLAYERS',art:'ttt'},
    {id:'c4',name:'Connect 4',desc:'Drop. Stack. Connect.',emoji:'🔴',mode:'2 PLAYERS',art:'c4'},
    {id:'dots',name:'Dots & Boxes',desc:'Claim the most boxes',emoji:'◆',mode:'2 PLAYERS',art:'dots'},
    {id:'sos',name:'SOS',desc:'Build SOS, score points',emoji:'SOS',mode:'2 PLAYERS',art:'sos'},
    {id:'g2048',name:'2048',desc:'Merge tiles, chase 2048',emoji:'2048',mode:'1 PLAYER',art:'g2048'},
    {id:'snake',name:'Snake',desc:'Eat. Grow. Survive.',emoji:'🐍',mode:'1 PLAYER',art:'snake'}
  ];
  function save(){ localStorage.setItem('srbStats',JSON.stringify(stats)); updateStats(); }
  function updateStats(){ $('#playedCount').textContent=stats.played; $('#winsCount').textContent=stats.wins; $('#best2048').textContent=stats.best2048; }
  function ping(freq=460,d=.05){ if(!sound) return; try{const a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.035,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d);}catch(e){} }
  function showToast(t){ toast.textContent=t;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1400); }
  function renderHome(){ grid.innerHTML=games.map(g=>`<button class="game-card" data-game="${g.id}"><div class="art ${g.art}"><span class="emoji">${g.emoji}</span></div><span class="mode-badge">${g.mode}</span><h4>${g.name}</h4><p>${g.desc}</p></button>`).join(''); grid.querySelectorAll('.game-card').forEach(b=>b.addEventListener('click',()=>openGame(b.dataset.game))); }
  function openGame(id){ cleanup(); current=id; stats.played++; save(); const g=games.find(x=>x.id===id); title.textContent=g.name;mode.textContent=g.mode;home.classList.remove('active');game.classList.add('active');ping(520,.06); startGame(); }
  function goHome(){ cleanup();game.classList.remove('active');home.classList.add('active');current=null; }
  function startGame(){ cleanup(); cleanup=()=>{}; stage.innerHTML='';hud.innerHTML=''; if(current==='ttt') ticTacToe(); if(current==='c4') connect4(); if(current==='dots') dotsBoxes(); if(current==='sos') sosGame(); if(current==='g2048') game2048(); if(current==='snake') snakeGame(); }
  $('#backBtn').addEventListener('click',goHome); $('#restartBtn').addEventListener('click',startGame); $('#soundBtn').addEventListener('click',e=>{sound=!sound;e.currentTarget.textContent=sound?'🔊':'🔇';showToast(sound?'Sound on':'Sound off');});

  function hud2(p1,p2,turn=1){ hud.innerHTML=`<div class="hud"><div class="hud-card ${turn===1?'turn-active':''}"><span>PLAYER 1</span><strong>${p1}</strong></div><div class="hud-card ${turn===2?'turn-active':''}"><span>PLAYER 2</span><strong>${p2}</strong></div></div>`; }
  function ticTacToe(){ let b=Array(9).fill(''),turn='X',done=false; const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; function draw(){hud2(turn==='X'?'Your turn':'X',turn==='O'?'Your turn':'O',turn==='X'?1:2);stage.innerHTML=`<div class="board ttt-board">${b.map((v,i)=>`<button class="cell ${v==='X'?'mark-x':v==='O'?'mark-o':''}" data-i="${i}">${v}</button>`).join('')}</div><p class="game-help">Take turns on the same device • First line of 3 wins</p>`;stage.querySelectorAll('.cell').forEach(c=>c.addEventListener('click',()=>move(+c.dataset.i)));} function move(i){if(done||b[i])return;b[i]=turn;ping(turn==='X'?520:680);const w=wins.find(a=>a.every(k=>b[k]===turn));if(w){done=true;draw();w.forEach(i=>stage.children[0].children[i].classList.add('win-cell'));stats.wins++;save();showToast(`Player ${turn==='X'?1:2} wins! 🏆`);return;}if(b.every(Boolean)){done=true;draw();showToast('Draw game 🤝');return;}turn=turn==='X'?'O':'X';draw();} draw(); }

  function connect4(){ const rows=6,cols=7,b=Array.from({length:rows},()=>Array(cols).fill(0));let turn=1,done=false; function draw(){hud2(turn===1?'Your turn':'Red',turn===2?'Your turn':'Gold',turn);stage.innerHTML=`<div class="connect-board board">${b.flatMap((r,ri)=>r.map((v,ci)=>`<button class="cell" data-c="${ci}">${v?`<span class="disc p${v}"></span>`:''}</button>`)).join('')}</div><p class="game-help">Tap any column • Connect 4 horizontally, vertically or diagonally</p>`;stage.querySelectorAll('.cell').forEach(c=>c.addEventListener('click',()=>drop(+c.dataset.c)));} function win(r,c,p){for(const [dr,dc] of [[1,0],[0,1],[1,1],[1,-1]]){let n=1;for(const s of [-1,1]){let rr=r+dr*s,cc=c+dc*s;while(rr>=0&&rr<rows&&cc>=0&&cc<cols&&b[rr][cc]===p){n++;rr+=dr*s;cc+=dc*s;}}if(n>=4)return true;}return false;} function drop(c){if(done)return;let r=rows-1;while(r>=0&&b[r][c])r--;if(r<0)return; b[r][c]=turn;ping(turn===1?420:620,.07);if(win(r,c,turn)){done=true;draw();stats.wins++;save();showToast(`Player ${turn} connects 4! 🏆`);return;}turn=turn===1?2:1;draw();} draw(); }

  function dotsBoxes(){ const n=4;let h=Array.from({length:n},()=>Array(n-1).fill(0)),v=Array.from({length:n-1},()=>Array(n).fill(0)),boxes=Array.from({length:n-1},()=>Array(n-1).fill(0)),turn=1,score=[0,0,0]; function complete(r,c){return h[r][c]&&h[r+1][c]&&v[r][c]&&v[r][c+1]} function draw(){hud2(`${score[1]} boxes`,`${score[2]} boxes`,turn);let html='<div class="dots-board">';for(let R=0;R<2*n-1;R++){for(let C=0;C<2*n-1;C++){if(R%2===0&&C%2===0)html+='<span class="dot"></span>';else if(R%2===0)html+=`<button class="line h ${h[R/2][(C-1)/2]?'on'+h[R/2][(C-1)/2]:''}" data-t="h" data-r="${R/2}" data-c="${(C-1)/2}"></button>`;else if(C%2===0)html+=`<button class="line v ${v[(R-1)/2][C/2]?'on'+v[(R-1)/2][C/2]:''}" data-t="v" data-r="${(R-1)/2}" data-c="${C/2}"></button>`;else{let o=boxes[(R-1)/2][(C-1)/2];html+=`<span class="boxfill ${o?'b'+o:''}">${o?'P'+o:''}</span>`}}}html+='</div><p class="game-help">Complete a box to score and take another turn</p>';stage.innerHTML=html;stage.querySelectorAll('.line').forEach(x=>x.addEventListener('click',()=>play(x.dataset.t,+x.dataset.r,+x.dataset.c)));} function play(t,r,c){let arr=t==='h'?h:v;if(arr[r][c])return;arr[r][c]=turn;ping(500+turn*100);let got=0;for(let br=0;br<n-1;br++)for(let bc=0;bc<n-1;bc++)if(!boxes[br][bc]&&complete(br,bc)){boxes[br][bc]=turn;score[turn]++;got++;}if(!got)turn=turn===1?2:1;draw();if(score[1]+score[2]===(n-1)*(n-1)){if(score[1]!==score[2]){stats.wins++;save();showToast(`Player ${score[1]>score[2]?1:2} wins! 🏆`)}else showToast('Draw! 🤝')}} draw(); }

  function sosGame(){ const N=5,b=Array(N*N).fill('');let turn=1,letter='S',score=[0,0,0],done=false;const dirs=[[1,0],[0,1],[1,1],[1,-1]];function countSOS(idx){let r=Math.floor(idx/N),c=idx%N,count=0;for(const[dr,dc]of dirs)for(let off=-2;off<=0;off++){let s='';for(let k=0;k<3;k++){let rr=r+(off+k)*dr,cc=c+(off+k)*dc;s+=rr>=0&&rr<N&&cc>=0&&cc<N?b[rr*N+cc]:' ';}if(s==='SOS')count++;}return count;}function draw(){hud2(`${score[1]} pts`,`${score[2]} pts`,turn);stage.innerHTML=`<div class="letter-controls"><button class="letter-btn ${letter==='S'?'active':''}" data-l="S">S</button><button class="letter-btn ${letter==='O'?'active':''}" data-l="O">O</button></div><div class="board sos-board">${b.map((x,i)=>`<button class="cell ${x==='S'?'mark-x':x==='O'?'mark-o':''}" data-i="${i}">${x}</button>`).join('')}</div><p class="game-help">Choose S or O • Every SOS scores 1 point and gives another turn</p>`;stage.querySelectorAll('.letter-btn').forEach(x=>x.addEventListener('click',()=>{letter=x.dataset.l;draw()}));stage.querySelectorAll('.cell').forEach(x=>x.addEventListener('click',()=>play(+x.dataset.i)));}function play(i){if(done||b[i])return;b[i]=letter;ping(letter==='S'?500:660);let pts=countSOS(i);score[turn]+=pts;if(!pts)turn=turn===1?2:1;if(b.every(Boolean)){done=true;if(score[1]!==score[2]){stats.wins++;save();showToast(`Player ${score[1]>score[2]?1:2} wins! 🏆`)}else showToast('Draw! 🤝')}draw();}draw(); }

  function game2048(){ let b=Array(16).fill(0),score=0,startX=0,startY=0;function add(){let e=b.map((v,i)=>v?null:i).filter(v=>v!==null);if(!e.length)return;b[e[Math.floor(Math.random()*e.length)]]=Math.random()<.9?2:4;}function moveLine(a){let x=a.filter(Boolean),out=[];for(let i=0;i<x.length;i++){if(x[i]===x[i+1]){out.push(x[i]*2);score+=x[i]*2;i++;}else out.push(x[i]);}while(out.length<4)out.push(0);return out;}function move(dir){let old=b.join(',');if(dir==='l'||dir==='r')for(let r=0;r<4;r++){let row=b.slice(r*4,r*4+4);if(dir==='r')row.reverse();row=moveLine(row);if(dir==='r')row.reverse();b.splice(r*4,4,...row);}else for(let c=0;c<4;c++){let col=[b[c],b[c+4],b[c+8],b[c+12]];if(dir==='d')col.reverse();col=moveLine(col);if(dir==='d')col.reverse();for(let r=0;r<4;r++)b[r*4+c]=col[r];}if(b.join(',')!==old){add();ping(420+Math.min(score,1000)/5,.04);stats.best2048=Math.max(stats.best2048,score);save();draw();}if(!canMove())showToast('Game over • Restart ↻');}function canMove(){if(b.includes(0))return true;for(let r=0;r<4;r++)for(let c=0;c<4;c++){let i=r*4+c;if(c<3&&b[i]===b[i+1])return true;if(r<3&&b[i]===b[i+4])return true;}return false;}function draw(){hud.innerHTML=`<div class="hud"><div class="hud-card turn-active"><span>SCORE</span><strong>${score}</strong></div><div class="hud-card"><span>BEST</span><strong>${stats.best2048}</strong></div></div>`;stage.innerHTML=`<div class="board g2048-board">${b.map(v=>`<div class="tile ${v?'t'+Math.min(v,2048):''}">${v||''}</div>`).join('')}</div><p class="game-help">Swipe anywhere on the board • Arrow keys also work</p>`;let el=stage.querySelector('.g2048-board');el.addEventListener('touchstart',e=>{startX=e.touches[0].clientX;startY=e.touches[0].clientY},{passive:true});el.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});el.addEventListener('touchend',e=>{e.preventDefault();let dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;if(Math.max(Math.abs(dx),Math.abs(dy))<25)return;move(Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u'));},{passive:false});}function key(e){let m={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d'}[e.key];if(m){e.preventDefault();move(m)}}window.addEventListener('keydown',key);cleanup=()=>window.removeEventListener('keydown',key);add();add();draw(); }

  function snakeGame(){ hud.innerHTML=`<div class="hud"><div class="hud-card turn-active"><span>SCORE</span><strong id="snakeScore">0</strong></div><div class="hud-card"><span>BEST</span><strong>${stats.snake}</strong></div></div>`;stage.innerHTML=`<div class="snake-wrap"><div class="speed-picker" aria-label="Snake speed"><button type="button" class="speed-btn" data-speed="slow">SLOW</button><button type="button" class="speed-btn active" data-speed="medium">MEDIUM</button><button type="button" class="speed-btn" data-speed="fast">FAST</button></div><canvas class="snake-canvas" width="360" height="360"></canvas><div class="dpad"><span class="empty"></span><button data-d="u">↑</button><span class="empty"></span><button data-d="l">←</button><button data-d="d">↓</button><button data-d="r">→</button></div><p class="game-help">Choose your speed • Swipe the board or use controls</p></div>`;const c=stage.querySelector('canvas'),ctx=c.getContext('2d'),N=18,S=c.width/N;const speeds={slow:{base:260,min:155},medium:{base:185,min:110},fast:{base:120,min:75}};let speedMode='medium',snake=[{x:9,y:9},{x:8,y:9},{x:7,y:9}],dir={x:1,y:0},next={x:1,y:0},food={},score=0,timer,startX,startY;function delay(){let cfg=speeds[speedMode];return Math.max(cfg.min,cfg.base-score*3);}function restartTimer(){clearInterval(timer);timer=setInterval(tick,delay());}function spawn(){do{food={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)}}while(snake.some(s=>s.x===food.x&&s.y===food.y));}function set(d){let m={u:{x:0,y:-1},d:{x:0,y:1},l:{x:-1,y:0},r:{x:1,y:0}}[d];if(m.x!==-dir.x||m.y!==-dir.y)next=m;}function paint(){ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#0b1515';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='rgba(255,255,255,.035)';for(let i=0;i<=N;i++){ctx.beginPath();ctx.moveTo(i*S,0);ctx.lineTo(i*S,c.height);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*S);ctx.lineTo(c.width,i*S);ctx.stroke()}snake.forEach((s,i)=>{let g=ctx.createLinearGradient(s.x*S,s.y*S,(s.x+1)*S,(s.y+1)*S);g.addColorStop(0,i?'#77ed58':'#d7ff66');g.addColorStop(1,i?'#16b99b':'#4de3a4');ctx.fillStyle=g;ctx.shadowColor='#65ff88';ctx.shadowBlur=i?7:14;roundRect(ctx,s.x*S+2,s.y*S+2,S-4,S-4,6);ctx.fill();});ctx.shadowBlur=18;ctx.fillStyle='#ff4f8b';ctx.beginPath();ctx.arc(food.x*S+S/2,food.y*S+S/2,S*.31,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}function roundRect(x,a,b,w,h,r){x.beginPath();x.roundRect(a,b,w,h,r)}function tick(){dir=next;let h={x:(snake[0].x+dir.x+N)%N,y:(snake[0].y+dir.y+N)%N};if(snake.some(s=>s.x===h.x&&s.y===h.y)){clearInterval(timer);stats.snake=Math.max(stats.snake,score);save();showToast(`Game over • Score ${score}`);return;}snake.unshift(h);if(h.x===food.x&&h.y===food.y){score++;$('#snakeScore').textContent=score;ping(650,.05);spawn();restartTimer();}else snake.pop();paint();}function key(e){let m={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d'}[e.key];if(m){e.preventDefault();set(m)}}stage.querySelectorAll('[data-d]').forEach(b=>b.addEventListener('click',()=>set(b.dataset.d)));stage.querySelectorAll('[data-speed]').forEach(btn=>btn.addEventListener('click',()=>{speedMode=btn.dataset.speed;stage.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===btn));restartTimer();showToast(`${btn.textContent} speed selected`);}));c.addEventListener('touchstart',e=>{startX=e.touches[0].clientX;startY=e.touches[0].clientY},{passive:true});c.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});c.addEventListener('touchend',e=>{e.preventDefault();let dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;if(Math.max(Math.abs(dx),Math.abs(dy))<20)return;set(Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u'));},{passive:false});window.addEventListener('keydown',key);spawn();paint();restartTimer();cleanup=()=>{clearInterval(timer);window.removeEventListener('keydown',key)}; }

  // PWA install button. Always gives the user a useful install path when not already installed.
  let deferredPrompt=null;
  const installBtn=document.getElementById('installBtn');
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);

  function syncInstallButton(){
    if(!installBtn)return;
    const installed=isStandalone();
    installBtn.hidden=installed;
    document.body.classList.toggle('install-cta-visible',!installed);
  }

  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    deferredPrompt=e;
    syncInstallButton();
  });

  installBtn?.addEventListener('click',async()=>{
    if(isStandalone()){syncInstallButton();return;}
    if(deferredPrompt){
      deferredPrompt.prompt();
      try{await deferredPrompt.userChoice;}catch(e){}
      deferredPrompt=null;
      syncInstallButton();
      return;
    }
    if(isIOS){
      showToast('Safari: Share ↑ → Add to Home Screen');
    }else{
      showToast('Browser menu ⋮ → Install app / Add to Home screen');
    }
  });

  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;
    syncInstallButton();
    showToast('SRB Games installed! 🎮');
  });

  renderHome();updateStats();syncInstallButton();
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
})();
