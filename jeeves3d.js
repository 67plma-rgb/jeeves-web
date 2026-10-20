/* Jeeves 3D · modelo original de Jeeves Robotics (Three.js r128) */
(function(){
'use strict';
/* Fabrica el robot original dentro de una escena */
function makeJeeves(scene){
var cl={color:{setHex:function(){}}},pl=cl;
var W=new THREE.MeshPhysicalMaterial({color:0xf2f4f8,roughness:.3,metalness:.05,clearcoat:.7,clearcoatRoughness:.2}),
W2=W.clone(),
D=new THREE.MeshStandardMaterial({color:0x0d1118,roughness:.32,metalness:.55}),
V=new THREE.MeshPhysicalMaterial({color:0x04060a,roughness:.06,metalness:.5,clearcoat:1,clearcoatRoughness:.05}),
T=new THREE.MeshStandardMaterial({color:0x14171c,roughness:.9,metalness:0}),
G=new THREE.MeshStandardMaterial({color:0x2c333d,roughness:.5,metalness:.6}),
L=new THREE.MeshStandardMaterial({color:0x2f9e5f,emissive:0x2f9e5f,emissiveIntensity:1.3});
W2.side=THREE.DoubleSide;
var bot=new THREE.Group();scene.add(bot);
function rbox(w,h,d,r){
  var b=Math.min(r*.5,w/4,h/4,d/4),cr=Math.max(r-b,.001),sw=w-2*b,sh=h-2*b,x=-sw/2,y=-sh/2,s=new THREE.Shape();
  s.moveTo(x+cr,y);s.lineTo(x+sw-cr,y);s.quadraticCurveTo(x+sw,y,x+sw,y+cr);s.lineTo(x+sw,y+sh-cr);
  s.quadraticCurveTo(x+sw,y+sh,x+sw-cr,y+sh);s.lineTo(x+cr,y+sh);s.quadraticCurveTo(x,y+sh,x,y+sh-cr);
  s.lineTo(x,y+cr);s.quadraticCurveTo(x,y,x+cr,y);
  var g=new THREE.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:4,curveSegments:8});
  g.center();return g;
}
function add(g,m,x,y,z){var o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=!m.isMeshBasicMaterial;o.receiveShadow=true;bot.add(o);return o}
function cyl(r,len,m,x,y,z){var g=new THREE.CylinderGeometry(r,r,len,32);g.rotateZ(Math.PI/2);return add(g,m,x,y,z)}
/* base */
add(rbox(.62,.1,.52,.035),W,0,.17,0);add(rbox(.6,.05,.5,.02),D,0,.11,0);add(rbox(.63,.012,.53,.005),L,0,.128,0);
[-1,1].forEach(function(s){
  cyl(.085,.07,T,s*.355,.085,-.12);cyl(.052,.074,W,s*.355,.085,-.12);cyl(.022,.08,D,s*.355,.085,-.12);
  var f=new THREE.CylinderGeometry(.1,.1,.085,32,1,true,0,Math.PI);f.rotateZ(Math.PI/2);add(f,W2,s*.355,.085,-.12);
  add(new THREE.SphereGeometry(.045,20,16),G,s*.22,.045,.2);
  /* estructura sin huecos */
  add(rbox(.05,.74,.05,.02),W,s*.255,.59,.2);
  add(rbox(.008,.56,.016,.003),L,s*.281,.59,.2);
  add(rbox(.008,.56,.016,.003),L,s*.281,.6,-.17);
  /* luces de la cabeza */
  cyl(.058,.016,D,s*.283,1.07,0);
  var ring=new THREE.TorusGeometry(.046,.009,12,40);ring.rotateY(Math.PI/2);add(ring,L,s*.292,1.07,0);
});
add(rbox(.56,.76,.12,.03),W,0,.6,-.17);
[.4,.72].forEach(function(y){add(rbox(.56,.026,.48,.012),D,0,y,0);add(rbox(.575,.008,.495,.004),L,0,y-.016,0)});
/* cuello y cabeza */
add(rbox(.56,.05,.5,.02),D,0,.955,0);
add(rbox(.56,.26,.26,.06),W,0,1.07,0);
add(rbox(.46,.21,.03,.04),V,0,1.07,.13);
/* logo en la base */
var lc=document.createElement('canvas');lc.width=512;lc.height=100;var lg=lc.getContext('2d');
var ltex=new THREE.CanvasTexture(lc);ltex.encoding=THREE.sRGBEncoding;
function drawLogo(){lg.clearRect(0,0,512,100);lg.fillStyle='#0F172A';lg.font='800 64px Montserrat,Arial,sans-serif';lg.textAlign='center';lg.textBaseline='middle';lg.fillText('JEEVES',256,52);ltex.needsUpdate=true}
drawLogo();if(document.fonts&&document.fonts.load){document.fonts.load('800 64px Montserrat').then(drawLogo)}
add(new THREE.PlaneGeometry(.3,.0586),new THREE.MeshBasicMaterial({map:ltex,transparent:true,toneMapped:false}),0,.172,.2615);
/* pantalla con ojos */
var ec=document.createElement('canvas');ec.width=512;ec.height=256;var cx=ec.getContext('2d');
var tex=new THREE.CanvasTexture(ec);tex.encoding=THREE.sRGBEncoding;
add(new THREE.PlaneGeometry(.37,.185),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}),0,1.07,.1465);
/* piso: sombra y charco de luz */
var sh=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.ShadowMaterial({opacity:.45}));sh.rotation.x=-Math.PI/2;sh.position.y=.001;sh.receiveShadow=true;scene.add(sh);
var gl=new THREE.Mesh(new THREE.CircleGeometry(.66,48),new THREE.MeshBasicMaterial({color:0x2f9e5f,transparent:true,opacity:.2,depthWrite:false,toneMapped:false}));
gl.rotation.x=-Math.PI/2;gl.position.y=.003;bot.add(gl);
var state='dormitando',blink=0;
var COL={dormitando:0x2f9e5f,alerta:0x2f86e8,sorprendido:0xe8962a,feliz:0x3ecf6a,bloqueado:0xe5533d};
var TXT={dormitando:'Dormitando: esperando la próxima orden',alerta:'Alerta: va en camino a su destino',sorprendido:'Sorprendido: detectó un obstáculo',feliz:'Feliz: entrega completada',bloqueado:'Bloqueado: detenido, avisa con luces'};
function rr(x,y,w,h,r){cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()}
function eyes(t){
  var c='#'+('000000'+COL[state].toString(16)).slice(-6),s=state;
  cx.setTransform(1,0,0,1,0,0);cx.globalAlpha=1;cx.fillStyle='#05070b';cx.fillRect(0,0,512,256);
  cx.fillStyle=cx.strokeStyle=c;cx.shadowColor=c;cx.shadowBlur=22;cx.lineCap='round';cx.lineJoin='round';
  [187,327].forEach(function(x){
    if(s==='dormitando'){
      var h=24+10*Math.sin(t*1.4),dy=4*Math.sin(t*.7);
      rr(x-64,128+dy-h/2,128,h,h/2);cx.fill();
    }else if(s==='alerta'){
      var dx=18*Math.sin(t*1.3),h=125*(1-blink*.9);
      rr(x+dx-50,120-h/2,100,h,Math.min(45,h/2));cx.fill();
    }else if(s==='sorprendido'){
      var k=1+.07*Math.sin(t*7),w=115*k,h=Math.max(8,160*k*(1-blink*.9));
      cx.lineWidth=13;rr(x-w/2,131-h/2,w,h,Math.min(w/2,h/2));cx.stroke();
    }else if(s==='feliz'){
      var dy=-10*Math.abs(Math.sin(t*3));
      cx.lineWidth=20;cx.beginPath();cx.arc(x,150+dy,46,Math.PI,2*Math.PI);cx.stroke();
    }else{
      var dx=Math.sin(t*2)>0?5*Math.sin(t*34):0;
      cx.globalAlpha=Math.sin(t*5)>0?1:.35;cx.lineWidth=20;
      cx.beginPath();cx.moveTo(x+dx-50,76);cx.lineTo(x+dx+50,180);cx.moveTo(x+dx+50,76);cx.lineTo(x+dx-50,180);cx.stroke();
    }
  });
  cx.globalAlpha=1;tex.needsUpdate=true;
}

function setS(s){state=s;L.color.setHex(COL[s]);L.emissive.setHex(COL[s]);gl.material.color.setHex(COL[s])}
setS('dormitando');
return {bot:bot,setS:setS,TXT:TXT,eyes:function(t,b){blink=b;eyes(t)}};
}

function mount(box){
  var cv=box.querySelector('canvas'),renderer;
  if(!window.THREE||!cv)return;
  try{renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true})}catch(e){return}
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor(0,0);
  var scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,1,.1,50);
  cam.position.set(0,.85,3.4);cam.lookAt(0,.6,0);
  try{
    var pm=new THREE.PMREMGenerator(renderer),es=new THREE.Scene();es.background=new THREE.Color(0x0f1626);
    var sb=function(w,h,x,y,z,r,g,b){var m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));m.material.color.setRGB(r,g,b);m.position.set(x,y,z);m.lookAt(0,0,0);es.add(m)};
    sb(8,8,0,6,0,3,3,3.2);sb(4,5,-5,2,4,3,3,3);sb(3,5,5,2,-4,.6,1,2.6);sb(6,2,0,-1,5,.6,.7,1);sb(10,10,0,-4,0,.15,.18,.25);
    scene.environment=pm.fromScene(es,.03).texture;pm.dispose();
  }catch(e){}
  
  scene.add(new THREE.HemisphereLight(0xffffff,0xd6d4d2,.55));
  var key=new THREE.DirectionalLight(0xffffff,.95);key.position.set(2.2,4,3);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
  var sc=key.shadow.camera;sc.left=-1.2;sc.right=1.2;sc.top=1.8;sc.bottom=-.6;sc.near=.5;sc.far=10;key.shadow.bias=-.0004;key.shadow.radius=4;scene.add(key);
  var rim=new THREE.DirectionalLight(0x9fc2ff,.5);rim.position.set(-3,2.5,-2.5);scene.add(rim);
  var J=makeJeeves(scene),bot=J.bot;
  /* controles */
  var rot=-.55,drag=false,lx=0,idle=99,vis=true,raf=0,state='dormitando',stateEl=document.getElementById('v3dState');
  cv.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX;idle=0;try{cv.setPointerCapture(e.pointerId)}catch(_){}});
  cv.addEventListener('pointermove',function(e){if(!drag)return;rot+=(e.clientX-lx)*.01;lx=e.clientX;if(!vis)draw(0)});
  ['pointerup','pointercancel','pointerleave'].forEach(function(n){cv.addEventListener(n,function(){drag=false})});
  cv.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();rot+=(e.key==='ArrowLeft'?-1:1)*.3;idle=0;if(reduce)draw(0)}});
  Array.prototype.forEach.call(document.querySelectorAll('[data-s]'),function(b){
    b.addEventListener('click',function(){
      state=b.getAttribute('data-s');J.setS(state);if(stateEl)stateEl.textContent=J.TXT[state];
      Array.prototype.forEach.call(document.querySelectorAll('[data-s]'),function(o){o.setAttribute('aria-pressed',String(o===b))});
      if(reduce)draw(0);
    });
  });
  function size(){var w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);cam.aspect=w/h;cam.fov=w<h?40:32;cam.updateProjectionMatrix();draw(0)}
  var T=0,last=performance.now();
  function draw(dt){
    T+=dt;var ph=T%4.2;J.eyes(reduce?0:T,ph>4?Math.sin((ph-4)/.2*Math.PI):0);
    idle+=dt;if(!drag&&!reduce&&idle>2.5)rot+=dt*.35;
    bot.rotation.y=rot;renderer.render(scene,cam);
  }
  function loop(now){var dt=Math.min((now-last)/1000,.05);last=now;draw(dt);if(vis&&!document.hidden&&!reduce)raf=requestAnimationFrame(loop)}
  function go(){cancelAnimationFrame(raf);if(vis&&!document.hidden&&!reduce){last=performance.now();raf=requestAnimationFrame(loop)}}
  if(window.ResizeObserver)new ResizeObserver(size).observe(cv);window.addEventListener('resize',size);
  document.addEventListener('visibilitychange',go);
  if('IntersectionObserver' in window)new IntersectionObserver(function(e){vis=e[0].isIntersecting;go()}).observe(cv);
  size();box.classList.add('ready');go();
}
window.Jeeves3D={mount:mount,makeJeeves:makeJeeves};
})();
