class BalsGame extends GameEngine {
  constructor(config){
    super(config);
    this.BURBUJA_RADIO=85; this.RADIO_LIMITE=400;
    this.burbujas=[]; this.paso=0;
    this.crearBurbujas(); this.mostrarPregunta();
  }

  crearBurbujas(){
    const total=this.preguntas.length;
    for(let i=0;i<total;i++){
      const phi=Math.acos(1-2*i/total);
      const theta=Math.PI*(1.5+Math.sqrt(9))*i;
      const x=this.RADIO_LIMITE*Math.sin(phi)*Math.cos(theta);
      const y=this.RADIO_LIMITE*Math.sin(phi)*Math.sin(theta);
      const z=this.RADIO_LIMITE*Math.cos(phi);
      const group=this.createBubble(this.preguntas[i].translation,this.BURBUJA_RADIO);
      group.position.set(x,y,z);
      group.userData.translation=this.preguntas[i].translation;
      group.userData.velocity=new THREE.Vector3((Math.random()-0.5)*30,(Math.random()-0.5)*30,(Math.random()-0.5)*30);
      this.scene.add(group); this.bubbles.push(group);
    }
  }

  mostrarPregunta(){
    if(this.paso>=this.preguntas.length){
      document.getElementById('preguntaArea').innerHTML="<strong>¡Juego completado!</strong>";
      return;
    }
    const p=this.preguntas[this.paso];
    document.getElementById('preguntaArea').innerHTML=`<strong>${p.question}</strong><div id="preguntaEstado">Paso ${this.paso+1} / ${this.preguntas.length}</div>`;
  }

  onSelect(vec2){
    this.raycaster.setFromCamera(vec2,this.camera);
    const ints=this.raycaster.intersectObjects(this.bubbles.map(b=>b.userData.sphere));
    if(ints.length>0){
      const b=this.bubbles.find(bb=>bb.userData.sphere===ints[0].object);
      if(b.userData.translation===this.preguntas[this.paso].translation){
        this.scene.remove(b); this.bubbles.splice(this.bubbles.indexOf(b),1);
        this.paso++; setTimeout(()=>this.mostrarPregunta(),200);
      } else {
        const est=document.getElementById('preguntaEstado');
        est.style.color='blue'; est.innerText='Respuesta incorrecta';
        setTimeout(()=>{ est.style.color='#9be7a6'; est.innerText=`Paso ${this.paso+1} / ${this.preguntas.length}`; },900);
      }
    }
  }

  update(dt){
    for(const b of this.bubbles){
      b.position.addScaledVector(b.userData.velocity,dt);
      if(b.position.length()>this.RADIO_LIMITE){
        b.position.setLength(this.RADIO_LIMITE);
        b.userData.velocity.reflect(b.position.clone().normalize());
      }
    }
    this.camera.position.set(0,0,700); this.camera.lookAt(0,0,0);
  }
}
