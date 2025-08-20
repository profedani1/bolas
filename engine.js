class GameEngine {
  constructor({ preguntas }) {
    this.preguntas = preguntas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(80, innerWidth/innerHeight, 0.1, 5000);
    this.renderer = new THREE.WebGLRenderer({ antialias:true });
    this.renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0x666666));
    const ptLight = new THREE.PointLight(0xffffff, 1.2);
    ptLight.position.set(200,200,400);
    this.scene.add(ptLight);

    this.isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.bubbles = [];
    this.last = performance.now();

    this._bindEvents();
  }

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
    return new THREE.Sprite(mat);
  }

  createBubble(text, radius=100) {
    const geom=new THREE.SphereGeometry(radius,32,32);
    const mat=new THREE.MeshBasicMaterial({
      color:new THREE.Color().setHSL(Math.random(),0.7,0.5),
      transparent:true, opacity:0.5, depthWrite:false
    });
    const sphere=new THREE.Mesh(geom,mat);
    const sprite=this.makeTextSprite(text);
    const group=new THREE.Object3D();
    group.add(sphere); group.add(sprite);
    group.userData={ sphere, baseColor: mat.color.clone() };
    return group;
  }

  start(){ this.animate(); }
  animate(now=performance.now()){
    requestAnimationFrame(t=>this.animate(t));
    const dt=(now-this.last)/1000; this.last=now;
    this.update(dt);
    this.renderer.render(this.scene,this.camera);
  }

  _bindEvents(){
    window.addEventListener('resize',()=>this.onResize());
    if(this.isMobile){
      this.renderer.domElement.addEventListener('touchstart',e=>{
        if(e.touches.length===1){
          this.onSelect(this._touchToVec(e.touches[0]));
        }
      });
    } else {
      window.addEventListener('mousemove',e=>{
        this.mouse.x=(e.clientX/innerWidth)*2-1;
        this.mouse.y=-(e.clientY/innerHeight)*2+1;
      });
      window.addEventListener('click',()=>this.onSelect(this.mouse));
    }
  }
  _touchToVec(t){ return new THREE.Vector2((t.clientX/innerWidth)*2-1, -(t.clientY/innerHeight)*2+1); }

  update(dt){} // override
  onResize(){} // override
  onSelect(vec2){} // override
}
