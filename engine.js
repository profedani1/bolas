class GameEngine {
  constructor({ preguntas }) {
    this.preguntas = preguntas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(80, innerWidth/innerHeight, 0.1, 5000);
    this.renderer = new THREE.WebGLRenderer({ antialias:true });
    this.renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // luces
    this.scene.add(new THREE.AmbientLight(0x666666));
    const ptLight = new THREE.PointLight(0xffffff, 1.2);
    ptLight.position.set(200,200,400);
    this.scene.add(ptLight);

    // input
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.bubbles = [];

    // cámara orbital
    this.targetRotX = 0; this.targetRotY = 0;
    this.rotX = 0; this.rotY = 0;

    this._bindEvents();
    this.last = performance.now();
  }

  // --- creación de sprites de texto ---
  makeTextSprite(text, baseFont=120, bulge=0.35) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1024; canvas.height = 512;
    const cx = canvas.width/2, cy = canvas.height/2;
    const maxHalf = canvas.width*0.45;
    const chars = Array.from(text);

    const metrics=[]; let totalW=0;
    for(let i=0;i<chars.length;i++){
      const xApprox=(i-(chars.length-1)/2)*(baseFont*0.6);
      const dist=Math.abs(xApprox);
      const f=1+bulge*Math.max(0,1-(dist/maxHalf)**2);
      const fontSize=Math.round(baseFont*f);
      ctx.font=`bold ${fontSize}px monospace`;
      const w=ctx.measureText(chars[i]).width;
      metrics.push({char:chars[i], fontSize, w});
      totalW+=w;
    }

    let x=cx-totalW/2;
    ctx.textBaseline='middle';
    ctx.fillStyle='white';
    ctx.shadowColor='rgba(0,0,0,0.45)';
    ctx.shadowBlur=10; ctx.shadowOffsetX=3; ctx.shadowOffsetY=3;
    for(const m of metrics){
      ctx.font=`bold ${m.fontSize}px monospace`;
      ctx.fillText(m.char, x+m.w/2, cy);
      x+=m.w;
    }

    const tex=new THREE.CanvasTexture(canvas);
    const mat=new THREE.SpriteMaterial({ map: tex, transparent:true });
    const s=new THREE.Sprite(mat);
    return s;
  }

  createBubble(text, radius=100) {
    const geom=new THREE.SphereGeometry(radius,32,32);
    const mat=new THREE.MeshBasicMaterial({
      color:new THREE.Color().setHSL(Math.random(),0.7,0.5),
      transparent:true, opacity:0.5, depthWrite:false
    });
    const sphere=new THREE.Mesh(geom,mat);
    const sprite=this.makeTextSprite(text);
    sprite.scale.set(radius*1.6, radius*0.65, 1);

    const group=new THREE.Object3D();
    group.add(sphere); group.add(sprite);
    group.userData={ sphere, baseColor: mat.color.clone() };
    return group;
  }

  // --- ciclo ---
  start(){ this.animate(); }
  animate(now=performance.now()){
    requestAnimationFrame(t=>this.animate(t));
    const dt=(now-this.last)/1000; this.last=now;
    this.update(dt);
    this.renderer.render(this.scene,this.camera);
  }

  // --- controles comunes ---
  _bindEvents(){
    window.addEventListener('resize',()=>this.onResize());

    if(this.isMobile){
      let lastTouch=null;
      this.renderer.domElement.addEventListener('touchstart',e=>{
        if(e.touches.length===1){
          lastTouch={x:e.touches[0].clientX,y:e.touches[0].clientY};
          this.onSelect(this._touchToVec(e.touches[0]));
        }
      });
      this.renderer.domElement.addEventListener('touchmove',e=>{
        if(e.touches.length===1 && lastTouch){
          const dx=e.touches[0].clientX-lastTouch.x;
          const dy=e.touches[0].clientY-lastTouch.y;
          const S=0.02;
          this.targetRotY+=dx*S;
          this.targetRotX+=-dy*S;
          lastTouch={x:e.touches[0].clientX,y:e.touches[0].clientY};
        }
        e.preventDefault();
      },{passive:false});
      this.renderer.domElement.addEventListener('touchend',()=>{lastTouch=null;});
    } else {
      window.addEventListener('mousemove',e=>{
        this.mouse.x=(e.clientX/innerWidth)*2-1;
        this.mouse.y=-(e.clientY/innerHeight)*2+1;
      });
      window.addEventListener('click',()=>this.onSelect(this.mouse));
    }
  }
  _touchToVec(t){ return new THREE.Vector2((t.clientX/innerWidth)*2-1, -(t.clientY/innerHeight)*2+1); }

  getIntersectedBubble(){
    this.raycaster.setFromCamera(this.mouse,this.camera);
    const ints=this.raycaster.intersectObjects(this.bubbles.map(b=>b.userData.sphere));
    if(ints.length>0){
      return this.bubbles.find(bb=>bb.userData.sphere===ints[0].object);
    }
    return null;
  }

  highlightBubble(group, active){
    if(!group) return;
    if(active){
      const factor=1+0.05*Math.sin(performance.now()*0.02*20);
      group.scale.set(factor,factor,factor);
      group.userData.sphere.material.color.set(0xff0000);
    } else {
      group.userData.sphere.material.color.copy(group.userData.baseColor);
      group.scale.set(1,1,1);
    }
  }

  // --- hooks ---
  update(dt){}       // lógica frame a frame
  onResize(){}       // reacción a resize
  onSelect(vec2){}   // al click/tap
}
