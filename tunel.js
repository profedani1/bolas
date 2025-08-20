class TunelGame extends GameEngine {
  constructor(config){
    super(config);
    this.remaining=this.preguntas.map((_,i)=>i);
    this.answered=new Set();
    this.spawnBag=[];
    this.targetBag=[];
    this.currentTarget=null;
    this.spawnTimer=null;
    this.BURBUJA_RADIO=120;
    this.SPAWN_Z=-3400; this.DESPAWN_Z=400;
    this.startSpawning();
    this.refillTargetBag(); this.nextTarget();
  }

  refillTargetBag(){
    this.targetBag=this.remaining.slice();
    this.shuffle(this.targetBag);
  }
  shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}}

  nextTarget(){
    if(this.remaining.length===0){ this.endGame(); return; }
    if(this.targetBag.length===0) this.refillTargetBag();
    this.currentTarget=this.targetBag.shift();
    const p=this.preguntas[this.currentTarget];
    document.getElementById('preguntaArea').innerHTML=
      `<strong>${p.question}</strong><div id="preguntaEstado">Respondidas: ${this.answered.size} / ${this.preguntas.length}</div>`;
  }

  startSpawning(){
    this.refillSpawnBag();
    this.spawnTimer=setInterval(()=>this.spawnTick(),1200);
  }
  refillSpawnBag(){ this.spawnBag=this.remaining.slice(); this.shuffle(this.spawnBag); }
  spawnTick(){
    if(this.remaining.length===0) return;
    if(this.spawnBag.length===0) this.refillSpawnBag();
    const idx=this.spawnBag.shift();
    const group=this.createBubble(this.preguntas[idx].translation,this.BURBUJA_RADIO);
    group.position.set((Math.random()-0.5)*1400,(Math.random()-0.5)*500,this.SPAWN_Z);
    group.userData.idx=idx;
    group.userData.velocity=new THREE.Vector3((Math.random()-0.5)*40,(Math.random()-0.5)*40,380+Math.random()*420);
    group.userData.birth=performance.now();
    this.scene.add(group); this.bubbles.push(group);
  }

  onSelect(vec2){
    this.raycaster.setFromCamera(vec2,this.camera);
    const ints=this.raycaster.intersectObjects(this.bubbles.map(b=>b.userData.sphere));
    if(ints.length>0){
      const b=this.bubbles.find(bb=>bb.userData.sphere===ints[0].object);
      if(b.userData.idx===this.currentTarget){
        this.markAnswered(b.userData.idx);
      } else {
        const est=document.getElementById('preguntaEstado');
        est.style.color='#ff5b5b'; est.innerText='Respuesta incorrecta';
        setTimeout(()=>{est.style.color='#9be7a6'; est.innerText=`Respondidas: ${this.answered.size} / ${this.preguntas.length}`;},900);
      }
    }
  }

  markAnswered(idx){
    this.answered.add(idx);
    this.remaining=this.remaining.filter(r=>r!==idx);
    this.bubbles=this.bubbles.filter(b=>{if(b.userData.idx===idx){this.scene.remove(b);return false;} return true;});
    this.nextTarget();
  }

  endGame(){
    clearInterval(this.spawnTimer);
    document.getElementById('preguntaArea').style.display='none';
    const el=document.getElementById('mensajeFinal');
    el.style.display='block'; el.innerHTML=`<strong>¡Juego completado!</strong><br>Correctas ${this.answered.size}/${this.preguntas.length}`;
  }

  update(dt){
    for(let i=this.bubbles.length-1;i>=0;i--){
      const b=this.bubbles[i];
      b.position.addScaledVector(b.userData.velocity,dt);
      if(b.position.z>this.DESPAWN_Z){ this.scene.remove(b); this.bubbles.splice(i,1); }
    }
    this.camera.position.set(0,0,0); this.camera.lookAt(0,0,-1);
  }
}
