'use strict';
// Single unified CASANOVA coordinate system traced from the two user-provided concept maps.
// Pixel points on a 1536x1024 reference, converted into continuous world metres.
const MAP_SCALE=8.0, MAP_CENTER=[768,520];
const W=(x,y)=>[(x-MAP_CENTER[0])*MAP_SCALE,(y-MAP_CENTER[1])*MAP_SCALE];
const DISTRICTS=[
 ['Derb Sultana',964,428,'derb','THE DEBT'],['Old Madina',1010,230,'medina','OLD QUARTER'],
 ['Habbous',846,287,'medina','ARTISANS'],['Maarif',748,408,'downtown','CITY CENTRE'],
 ['Gauthier & Racine',618,288,'downtown','BOULEVARDS'],['Anfa',402,349,'rich','PRIVATE VILLAS'],
 ['Ain Diab Corniche',284,298,'coast','ATLANTIC NIGHTLIFE'],['Oasis',512,400,'rich','GARDEN DISTRICT'],
 ['Hay Hassani',416,548,'residential','SOUTHWEST'],['Sidi Hajjar',872,569,'residential','WORKING STREETS'],
 ['Hay Ennour',1112,583,'danger','RIVAL TERRITORY'],['Roches Noires',1155,368,'industrial','WAREHOUSE BELT'],
 ['The Port',1188,189,'port','CONTAINERS & CRANES'],['Bouskoura Hills',232,687,'rich','GREEN HILLS'],
 ['Airport',783,883,'airport','RUNWAYS'],['Grand Mosque',795,127,'mosque','WATERFRONT LANDMARK'],
 ['Ring Road',650,730,'road','HIGHWAY'],['Coastal Highway',470,218,'road','SEASIDE ROAD']
].map(([name,px,py,kind,tag])=>({name,px,py,kind,tag,x:W(px,py)[0],z:W(px,py)[1]}));
const HIGHWAYS={
 coast:[[0,400],[110,370],[180,305],[260,262],[340,253],[445,237],[530,216],[630,197],[710,177],[798,157],[895,137],[965,137],[1030,139],[1100,112],[1195,82],[1290,62]],
 ring:[[1,982],[80,898],[152,805],[212,680],[250,570],[235,477],[210,383],[225,344],[295,345],[360,440],[395,557],[410,660],[420,719],[500,728],[610,728],[705,724],[820,724],[945,688],[1050,662],[1150,645],[1222,578],[1273,482],[1274,376],[1290,270]],
 axis1:[[275,250],[303,350],[395,425],[512,455],[617,460],[733,471],[841,476],[946,460],[1090,457],[1194,454]],
 axis2:[[745,196],[736,287],[748,408],[760,535],[766,660],[779,768],[788,899]],
 port:[[1004,232],[1070,255],[1173,268],[1248,285],[1290,270]],
 airport:[[250,839],[380,827],[520,810],[680,810],[783,801],[935,817],[1054,849]],
 derb:[[864,307],[916,367],[965,428],[1010,501],[1050,570]],
 commercial:[[498,284],[574,300],[618,288],[685,336],[748,408],[824,410],[906,388],[982,324],[1030,247]]
};
const ROUTES=[
 {id:'COASTAL HIGHWAY',points:HIGHWAYS.coast,width:18,lanes:4,speed:23},
 {id:'RING ROAD',points:HIGHWAYS.ring,width:23,lanes:4,speed:25},
 {id:'AVENUE PRINCIPALE',points:HIGHWAYS.axis1,width:16,lanes:4,speed:15},
 {id:'NORTH–SOUTH',points:HIGHWAYS.axis2,width:17,lanes:4,speed:15},
 {id:'PORT CONNECTOR',points:HIGHWAYS.port,width:13,lanes:2,speed:12},
 {id:'AIRPORT ROAD',points:HIGHWAYS.airport,width:15,lanes:4,speed:17},
 {id:'DERB STREET',points:HIGHWAYS.derb,width:9,lanes:2,speed:8},
 {id:'CITY BOULEVARD',points:HIGHWAYS.commercial,width:12,lanes:2,speed:12}
].map(r=>({...r,points:r.points.map(p=>W(...p))}));
function hash(n){let x=Math.sin(n*157.173+17.337)*43758.5453;return x-Math.floor(x)}
function coastLine(px){let a=[[0,385],[110,325],[220,251],[350,215],[500,199],[640,185],[790,140],[925,122],[1040,113],[1180,87],[1360,39],[1536,1]];for(let i=1;i<a.length;i++){if(px<=a[i][0]){let t=(px-a[i-1][0])/(a[i][0]-a[i-1][0]);return a[i-1][1]+t*(a[i][1]-a[i-1][1]);}}return 0;}
function land(x,z){
 let px=x/MAP_SCALE+768,py=z/MAP_SCALE+520;
 // The mosque occupies a coastal artificial platform with a walkable causeway.
 const mosque=DISTRICTS[15];
 if(Math.hypot(x-mosque.x,z-mosque.z)<58)return true;
 const tx=mosque.x+48,tz=mosque.z+66,dx=tx-mosque.x,dz=tz-mosque.z;
 let t=Math.max(0,Math.min(1,((x-mosque.x)*dx+(z-mosque.z)*dz)/(dx*dx+dz*dz)));
 if(Math.hypot(x-mosque.x-t*dx,z-mosque.z-t*dz)<10)return true;
 return py>coastLine(px)+8;
}
function closestDistrict(x,z){let best=DISTRICTS[0],d=Infinity;for(let i=0;i<16;i++){let q=DISTRICTS[i],v=(q.x-x)**2+(q.z-z)**2;if(v<d){d=v;best=q}}return best}
function nearestRoad(x,z){let best={distance:1e9};for(const r of ROUTES){const p=r.points;for(let i=0;i<p.length-1;i++){let ax=p[i][0],az=p[i][1],bx=p[i+1][0],bz=p[i+1][1],dx=bx-ax,dz=bz-az,len2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/len2)),qx=ax+t*dx,qz=az+t*dz,d=Math.hypot(x-qx,z-qz);if(d<best.distance)best={distance:d,width:r.width,dx:dx/Math.sqrt(len2),dz:dz/Math.sqrt(len2),route:r,index:i,progress:t,point:[qx,qz]}}}return best}

// Connecting routes guarantee every gameplay district has a road connection to the arterial system.
// The local terrain remains a single continuous world: these do not create separate levels.
const DISTRICT_CONNECTORS=DISTRICTS.slice(0,16).map((d,i)=>{
 let n=nearestRoad(d.x,d.z);
 if(n.distance<10)return null;
 return {id:'ACCESS · '+d.name, points:[[d.x,d.z],n.point], width:['derb','medina'].includes(d.kind)?7.5:10,
  lanes:2,speed:['derb','medina','danger'].includes(d.kind)?7.5:11, connector:true};
}).filter(Boolean);
ROUTES.push(...DISTRICT_CONNECTORS);
function segIntersect(a,b,c,d){
 let r=[b[0]-a[0],b[1]-a[1]],s=[d[0]-c[0],d[1]-c[1]],den=r[0]*s[1]-r[1]*s[0];
 if(Math.abs(den)<1e-6)return null;
 let q=[c[0]-a[0],c[1]-a[1]],t=(q[0]*s[1]-q[1]*s[0])/den,u=(q[0]*r[1]-q[1]*r[0])/den;
 if(t<.10||t>.90||u<.10||u>.90)return null;
 return t;
}
function installSignals(){
 ROUTES.forEach(r=>r.signals=[]);
 for(let i=0;i<ROUTES.length;i++)for(let j=i+1;j<ROUTES.length;j++){
  let a=ROUTES[i],b=ROUTES[j];if(a.connector&&b.connector)continue;
  let la=0;
  for(let k=0;k<a.points.length-1;k++){
   let aa=a.points[k],ab=a.points[k+1],al=Math.hypot(ab[0]-aa[0],ab[1]-aa[1]),lb=0;
   for(let m=0;m<b.points.length-1;m++){
    let ba=b.points[m],bb=b.points[m+1],bl=Math.hypot(bb[0]-ba[0],bb[1]-ba[1]),t=segIntersect(aa,ab,ba,bb);
    if(t!==null){let tt=segIntersect(ba,bb,aa,ab),da=la+t*al,db=lb+tt*bl,
     aL=sampleRoute(a,0).routeDistance,bL=sampleRoute(b,0).routeDistance,
     arcA=Math.PI*(a.width*.25+.7),arcB=Math.PI*(b.width*.25+.7);
     let phase=i*4+j*9;
     for(let dist of [da,2*aL+arcA-da])a.signals.push({carDist:dist,phase});
     for(let dist of [db,2*bL+arcB-db])b.signals.push({carDist:dist,phase:phase+13});
    }
    lb+=bl;
   }
   la+=al;
  }
 }
}
installSignals();
function roadClearance(x,z,w,d){let r=nearestRoad(x,z);
 // Half diagonal is conservative: keeps built geometry outside the asphalt and shoulders.
 return r.distance > r.width*.5 + Math.hypot(w,d)*.5 + 3.2;
}
function spawnForDistrict(index){
 const d=DISTRICTS[index];
 // Move onto a nearby local grid road, never into a building, sea tile or mountain.
 let best=null,bestScore=1e30;
 for(let kx=-2;kx<=2;kx++)for(let kz=-2;kz<=2;kz++){
  for(let lane=0;lane<2;lane++){
   let bx=Math.floor(d.x/CELL+0.5+kx)*CELL, bz=Math.floor(d.z/CELL+0.5+kz)*CELL;
   let xx=lane===0?bx+CELL*.5:bx+12, zz=lane===0?bz+12:bz+CELL*.5;
   if(!land(xx,zz))continue;
   let q=Math.hypot(xx-d.x,zz-d.z);
   if(q<bestScore){best={x:xx,z:zz};bestScore=q}
  }
 }
 if(best)return best;
 let road=nearestRoad(d.x,d.z);
 return {x:road.point[0],z:road.point[1]};
}

function sampleRoute(route,distance){let pts=route.points,total=0;for(let i=0;i<pts.length-1;i++)total+=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);let s=((distance%total)+total)%total;if(distance>0&&Math.abs(s)<1e-7)s=total;for(let i=0;i<pts.length-1;i++){let a=pts[i],b=pts[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(s<=len||i===pts.length-2){let t=Math.min(1,s/len);return{x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,yaw:Math.atan2(b[0]-a[0],b[1]-a[1]),routeDistance:total};}s-=len}return{x:0,z:0,yaw:0,routeDistance:total}}

'use strict';
// CASANOVA native WebGPU renderer, with instanced meshes, textured forward lighting and distance haze.
const SHADER=String.raw`
struct Globals {
 vp:mat4x4<f32>,
 eye:vec4<f32>,
 sun:vec4<f32>,
 sky:vec4<f32>,
 options:vec4<f32>,
};
@group(0) @binding(0) var<uniform> u:Globals;
@group(1) @binding(0) var texSampler:sampler;
@group(1) @binding(1) var colorTex:texture_2d<f32>;
struct Input {
 @location(0) pos:vec3<f32>,
 @location(1) norm:vec3<f32>,
 @location(2) uv:vec2<f32>,
 @location(3) color:vec4<f32>,
 @location(4) pscale:vec4<f32>,
 @location(5) rotTint:vec4<f32>,
};
struct Output {
 @builtin(position) clip:vec4<f32>,
 @location(0) world:vec3<f32>,
 @location(1) norm:vec3<f32>,
 @location(2) uv:vec2<f32>,
 @location(3) color:vec4<f32>,
};
@vertex fn vertex(v:Input)->Output {
 var o:Output;
 let c=cos(v.rotTint.x);let s=sin(v.rotTint.x);
 let p=v.pos*v.pscale.w;
 let wp=vec3<f32>(p.x*c+p.z*s,p.y,-p.x*s+p.z*c)+v.pscale.xyz;
 let n=v.norm;
 o.norm=normalize(vec3<f32>(n.x*c+n.z*s,n.y,-n.x*s+n.z*c));
 o.world=wp;o.clip=u.vp*vec4<f32>(wp,1.0);o.uv=v.uv;
 o.color=vec4<f32>(v.color.rgb*v.rotTint.yzw, v.color.a);
 return o;
}
@fragment fn fragment(i:Output)->@location(0) vec4<f32>{
 let albedo=textureSample(colorTex,texSampler,i.uv).rgb*i.color.rgb;
 let n=normalize(i.norm);
 let sunDir=normalize(u.sun.xyz);
 let diffuse=max(dot(n,sunDir),0.0);
 let hemi=0.61+0.14*max(n.y,0.0);
 // Bright Atlantic daylight with a warm late-afternoon sun and cool skylight fill.
 let lighting=vec3<f32>(0.82,0.89,1.0)*hemi+vec3<f32>(1.14,1.05,0.90)*diffuse*0.86;
 let viewDir=normalize(u.eye.xyz-i.world);
 let h=normalize(sunDir+viewDir);
 let highlight=pow(max(dot(n,h),0.0),36.0)*u.sun.w*0.055;
 var col=albedo*lighting+highlight;
 let dist=distance(i.world,u.eye.xyz);
 let fogAmt=1.0-exp(-pow(max(dist-u.options.x,0.0)*u.options.y,1.25));
 col=mix(col,u.sky.xyz,clamp(fogAmt,0.0,0.48));
 // Soft shoulder tone mapping: avoid the muddy/crushed contrast of the former version.
 col=col/(col+vec3<f32>(0.42));
 col=pow(clamp(col,vec3<f32>(0.0),vec3<f32>(1.0)),vec3<f32>(0.97));
 return vec4<f32>(col,1.0);
}
`;
function mat4Multiply(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[4*c]+a[4+r]*b[4*c+1]+a[8+r]*b[4*c+2]+a[12+r]*b[4*c+3];return o}
function projection(fov,ratio,near,far){let f=1/Math.tan(fov*0.5),m=new Float32Array(16);m[0]=f/ratio;m[5]=f;m[10]=far/(near-far);m[11]=-1;m[14]=far*near/(near-far);return m}
function viewMatrix(x,y,z,yaw,pitch){let cp=Math.cos(pitch),sp=Math.sin(pitch),fw=[Math.sin(yaw)*cp,sp,Math.cos(yaw)*cp];let rx=Math.cos(yaw),rz=-Math.sin(yaw);let upx=-Math.sin(yaw)*sp,upy=cp,upz=-Math.cos(yaw)*sp;return new Float32Array([rx,upx,-fw[0],0,0,upy,-fw[1],0,rz,upz,-fw[2],0,-(rx*x+rz*z),-(upx*x+upy*y+upz*z),fw[0]*x+fw[1]*y+fw[2]*z,1])}
class CasaGPU {
 constructor(canvas){this.canvas=canvas;this.meshes=[];this.textures=new Map();this.flags={webgpu:true};this.fps=0;this.draws=0}
 async init(){
  if(!isSecureContext)throw Error('WebGPU requires a secure context. Open this demo from an HTTPS site or a secure file origin.');
  if(!navigator.gpu)throw Error('WebGPU is unavailable in this Chrome/Android configuration. Update Chrome. Some Snapdragon 685 drivers may not support WebGPU.');
  let adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
  if(!adapter){try{adapter=await navigator.gpu.requestAdapter({featureLevel:'compatibility'})}catch(e){}}
  if(!adapter)throw Error('No WebGPU adapter was found on this phone. This is a device/driver limitation, not a missing game file.');
  this.adapter=adapter;this.device=await adapter.requestDevice();this.device.lost.then(info=>{document.getElementById('statusInfo').textContent='GPU DEVICE LOST: '+info.message});
  this.ctx=this.canvas.getContext('webgpu');this.format=navigator.gpu.getPreferredCanvasFormat();
  this.ctx.configure({device:this.device,format:this.format,alphaMode:'opaque'});
  this.sampler=this.device.createSampler({magFilter:'linear',minFilter:'linear',mipmapFilter:'linear',addressModeU:'repeat',addressModeV:'repeat'});
  this.uniform=this.device.createBuffer({size:144,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  this.uniformBindLayout=this.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:'uniform'}}]});
  this.texBindLayout=this.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,sampler:{type:'filtering'}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:'float'}}]});
  this.layout=this.device.createPipelineLayout({bindGroupLayouts:[this.uniformBindLayout,this.texBindLayout]});
  this.uniformBG=this.device.createBindGroup({layout:this.uniformBindLayout,entries:[{binding:0,resource:{buffer:this.uniform}}]});
  let module=this.device.createShaderModule({code:SHADER});let errs=await module.getCompilationInfo();for(let m of errs.messages)if(m.type==='error')throw Error('WGSL: '+m.message+' at '+m.lineNum);
  this.pipeline=this.device.createRenderPipeline({layout:this.layout,vertex:{module,entryPoint:'vertex',buffers:[{arrayStride:48,stepMode:'vertex',attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'float32x3'},{shaderLocation:2,offset:24,format:'float32x2'},{shaderLocation:3,offset:32,format:'float32x4'}]},{arrayStride:32,stepMode:'instance',attributes:[{shaderLocation:4,offset:0,format:'float32x4'},{shaderLocation:5,offset:16,format:'float32x4'}]}]},fragment:{module,entryPoint:'fragment',targets:[{format:this.format}]},primitive:{topology:'triangle-list',cullMode:'none'},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less'},multisample:{count:1}});
  let white=new Uint8Array([255,255,255,255]);this.defaultTexture=this.textureBytes('white',white,1,1);
  this.resize();window.addEventListener('resize',()=>this.resize());this.flags.device=adapter.info?.device||'WebGPU adapter';
 }
 resize(){if(!this.device)return;let dpr=Math.min(window.devicePixelRatio||1,quality==='HIGH'?1.35:quality==='ECO'?.73:1.0);let width=Math.max(4,Math.floor(innerWidth*dpr)),height=Math.max(4,Math.floor(innerHeight*dpr));if(this.canvas.width===width&&this.canvas.height===height)return;this.canvas.width=width;this.canvas.height=height;this.ctx.configure({device:this.device,format:this.format,alphaMode:'opaque'});this.depth?.destroy();this.depth=this.device.createTexture({size:[width,height],format:'depth24plus',usage:GPUTextureUsage.RENDER_ATTACHMENT});}
 textureBytes(name,data,w,h){if(this.textures.has(name))return this.textures.get(name);let tex=this.device.createTexture({size:[w,h],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.device.queue.writeTexture({texture:tex},data,{bytesPerRow:w*4,rowsPerImage:h},[w,h]);let bg=this.device.createBindGroup({layout:this.texBindLayout,entries:[{binding:0,resource:this.sampler},{binding:1,resource:tex.createView()}]});let ob={tex,bg};this.textures.set(name,ob);return ob}
 async textureImage(name,bytes,type='image/png'){if(this.textures.has(name))return this.textures.get(name);let image=await createImageBitmap(new Blob([bytes],{type}),{colorSpaceConversion:'default'});let tex=this.device.createTexture({size:[image.width,image.height],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});this.device.queue.copyExternalImageToTexture({source:image},{texture:tex},[image.width,image.height]);image.close();let bg=this.device.createBindGroup({layout:this.texBindLayout,entries:[{binding:0,resource:this.sampler},{binding:1,resource:tex.createView()}]});let ob={tex,bg};this.textures.set(name,ob);return ob}
 async textureURL(name,url){let response=await fetch(url);if(!response.ok)throw Error('Texture missing '+url);return this.textureImage(name,new Uint8Array(await response.arrayBuffer()),url.endsWith('.jpg')?'image/jpeg':'image/png')}
 makeMesh(name,vertices,indices){if(!vertices?.length||!indices?.length)return null;let v=new Float32Array(vertices),idx=new Uint32Array(indices);let vb=this.device.createBuffer({size:Math.ceil(v.byteLength/4)*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(vb,0,v);let ib=this.device.createBuffer({size:Math.ceil(idx.byteLength/4)*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(ib,0,idx);return{name,vb,ib,num:idx.length};}
 makeDraw(mesh,tex=this.defaultTexture,instances=[[0,0,0,1,0,1,1,1]],dynamic=false){if(!mesh)return null;let item={mesh,tex,buf:null,count:0,capacity:0,dynamic};this.updateInstances(item,instances);return item}
 updateInstances(item,instances){let d=instances instanceof Float32Array?instances:new Float32Array(instances.flat());let count=d.length/8;if(count>item.capacity){item.buf?.destroy();item.capacity=Math.max(count,2);item.buf=this.device.createBuffer({size:Math.ceil(item.capacity*32/4)*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST})}if(d.length)this.device.queue.writeBuffer(item.buf,0,d);item.count=count;return item}
 destroyDraw(item){if(!item)return;item.buf?.destroy()}
 destroyMesh(mesh){if(!mesh)return;mesh.vb?.destroy();mesh.ib?.destroy()}
 render(items,camera,now){if(!this.device||!this.depth)return;this.resize();let sky=[0.63,0.75,0.85];let vp=mat4Multiply(projection(75*Math.PI/180,this.canvas.width/this.canvas.height,0.13,1800),viewMatrix(camera.x,camera.y,camera.z,camera.yaw,camera.pitch));let values=new Float32Array(36);values.set(vp,0);values.set([camera.x,camera.y,camera.z,1],16);values.set([-0.51,0.78,-0.36,1],20);values.set([...sky,1],24);values.set([160,quality==='HIGH'?0.0008:0.00115,0,0],28);this.device.queue.writeBuffer(this.uniform,0,values);
 let enc=this.device.createCommandEncoder();let p=enc.beginRenderPass({colorAttachments:[{view:this.ctx.getCurrentTexture().createView(),clearValue:{r:0.69,g:0.81,b:0.92,a:1},loadOp:'clear',storeOp:'store'}],depthStencilAttachment:{view:this.depth.createView(),depthClearValue:1.0,depthLoadOp:'clear',depthStoreOp:'store'}});
 p.setPipeline(this.pipeline);p.setBindGroup(0,this.uniformBG);let draws=0;for(let it of items){if(!it||!it.count)continue;p.setBindGroup(1,it.tex?.bg||this.defaultTexture.bg);p.setVertexBuffer(0,it.mesh.vb);p.setVertexBuffer(1,it.buf);p.setIndexBuffer(it.mesh.ib,'uint32');p.drawIndexed(it.mesh.num,it.count,0,0,0);draws++}p.end();this.device.queue.submit([enc.finish()]);this.draws=draws}
}
// Procedural mesh construction with normals and UVs. Each mesh uses the original texture pixels unchanged.
class Geometry {
 constructor(){this.v=[];this.i=[]}
 quad(a,b,c,d,n=[0,1,0],col=[1,1,1,1],uv=[0,0,1,1]){let k=this.v.length/12;let coords=[[uv[0],uv[1]],[uv[2],uv[1]],[uv[2],uv[3]],[uv[0],uv[3]]];for(let [j,p] of [a,b,c,d].entries())this.v.push(...p,...n,...coords[j],...col);this.i.push(k,k+1,k+2,k,k+2,k+3);return this}
 box(x,y,z,w,h,d,col=[1,1,1,1],tile=1){let a=x-w/2,b=x+w/2,c=y,d0=y+h,e=z-d/2,f=z+d/2,t=[0,0,tile,tile];this.quad([a,d0,f],[b,d0,f],[b,c,f],[a,c,f],[0,0,1],col,t);this.quad([b,d0,e],[a,d0,e],[a,c,e],[b,c,e],[0,0,-1],col,t);this.quad([b,d0,f],[b,d0,e],[b,c,e],[b,c,f],[1,0,0],col,t);this.quad([a,d0,e],[a,d0,f],[a,c,f],[a,c,e],[-1,0,0],col,t);this.quad([a,d0,e],[b,d0,e],[b,d0,f],[a,d0,f],[0,1,0],col,t);this.quad([a,c,f],[b,c,f],[b,c,e],[a,c,e],[0,-1,0],col,t);return this}
 strip(x1,z1,x2,z2,width,y,col=[1,1,1,1],tiles=1){let dx=x2-x1,dz=z2-z1,l=Math.hypot(dx,dz)||1,nx=-dz/l*width/2,nz=dx/l*width/2;this.quad([x1-nx,y,z1-nz],[x2-nx,y,z2-nz],[x2+nx,y,z2+nz],[x1+nx,y,z1+nz],[0,1,0],col,[0,0,tiles,l/5]);return this}
 append(g){let k=this.v.length/12;this.v.push(...g.v);this.i.push(...g.i.map(x=>x+k))}
}

'use strict';
// GLB/gltf 2.0 reader for the exact original uploaded files. No mesh decimation or texture downsampling.
const GLB_SOURCE={}; // Populated at packaging time by the original uploads' base64 bytes.
function decode64(b64){let text=atob(b64),o=new Uint8Array(text.length);for(let i=0;i<text.length;i++)o[i]=text.charCodeAt(i);return o}
function gltfMatMul(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o}
const ID=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function nodeMatrix(n){if(n.matrix)return new Float32Array(n.matrix);let [x,y,z,w]=n.rotation||[0,0,0,1],s=n.scale||[1,1,1],p=n.translation||[0,0,0],x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;return new Float32Array([(1-(yy+zz))*s[0],(xy+wz)*s[0],(xz-wy)*s[0],0,(xy-wz)*s[1],(1-(xx+zz))*s[1],(yz+wx)*s[1],0,(xz+wy)*s[2],(yz-wx)*s[2],(1-(xx+yy))*s[2],0,...p,1])}
function applyMat(m,p,w=1){return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+w*m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+w*m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+w*m[14]]}
function parseGLB(bytes){let dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);if(dv.getUint32(0,true)!==0x46546C67)throw Error('Not a GLB file');let off=12,doc=null,bin=null;while(off<bytes.length){let len=dv.getUint32(off,true),typ=dv.getUint32(off+4,true);if(typ===0x4E4F534A)doc=JSON.parse(new TextDecoder().decode(bytes.subarray(off+8,off+8+len)));if(typ===0x004E4942)bin=bytes.subarray(off+8,off+8+len);off+=len+8}if(!doc||!bin)throw Error('Missing GLB data');return{doc,bin}}
function accessorData(g,index){if(index===undefined)return null;let a=g.doc.accessors[index],bv=g.doc.bufferViews[a.bufferView],start=(bv.byteOffset||0)+(a.byteOffset||0),stride=bv.byteStride||0,cn=({SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16})[a.type]||1;let type=a.componentType,len=type===5126||type===5125?4:type===5123||type===5122?2:1;stride=stride||cn*len;let dv=new DataView(g.bin.buffer,g.bin.byteOffset,g.bin.byteLength);let out=new Float32Array(a.count*cn);for(let i=0;i<a.count;i++)for(let j=0;j<cn;j++){let off=start+i*stride+j*len,v=type===5126?dv.getFloat32(off,true):type===5125?dv.getUint32(off,true):type===5123?dv.getUint16(off,true):type===5122?dv.getInt16(off,true):type===5121?dv.getUint8(off):dv.getInt8(off);if(a.normalized&&type!==5126)v=type===5121?v/255:type===5123?v/65535:type===5120?Math.max(-1,v/127):type===5122?Math.max(-1,v/32767):v;out[i*cn+j]=v}return out}
async function loadOriginalModel(engine,key,targetHeight,rawBytes=null){let b64=GLB_SOURCE[key];if(!b64&&!rawBytes)throw Error('Missing source model: '+key);let glb=parseGLB(rawBytes||decode64(b64)),doc=glb.doc,raw=[];let scene=doc.scenes[doc.scene||0]||doc.scenes[0];if(!scene)throw Error('GLB has no scene');let names=['x','y','z'];let bounds=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];
 function walk(nodeID,m,parentDepth=0){if(parentDepth>32)return;let node=doc.nodes[nodeID];let mat=gltfMatMul(m,nodeMatrix(node));if(node.mesh!==undefined){let mesh=doc.meshes[node.mesh];for(let prim of mesh.primitives){if(prim.mode!==undefined&&prim.mode!==4)continue;let positions=accessorData(glb,prim.attributes.POSITION),normals=accessorData(glb,prim.attributes.NORMAL),uv=accessorData(glb,prim.attributes.TEXCOORD_0),colors=accessorData(glb,prim.attributes.COLOR_0),indices=accessorData(glb,prim.indices);if(!positions)continue;let points=[];for(let i=0;i<positions.length;i+=3){let p=applyMat(mat,[positions[i],positions[i+1],positions[i+2]]);points.push(p);for(let j=0;j<3;j++){bounds[j]=Math.min(bounds[j],p[j]);bounds[3+j]=Math.max(bounds[3+j],p[j]);}}raw.push({points,normals,uv,colors,indices,material:prim.material,mat})}}for(let child of node.children||[])walk(child,mat,parentDepth+1)}
 for(let root of scene.nodes||[])walk(root,ID);if(!raw.length)throw Error('No triangle meshes in model '+key);let dim=[bounds[3]-bounds[0],bounds[4]-bounds[1],bounds[5]-bounds[2]],spec=MODEL_CATALOG[key]||{length:targetHeight||10,category:'building'};
 // Original exporters use wildly different units. Model instance scale uses real-world metre targets.
 // Vehicle length is along Z after orienting longest horizontal axis. No vertex decimation/texture resampling.
 let rotateCar=spec.category==='vehicle'&&dim[0]>dim[2];
 let scale=spec.renderHeight?spec.renderHeight/Math.max(0.01,dim[1]):spec.length/Math.max(0.01,dim[0],dim[2]);
 let xc=(bounds[0]+bounds[3])/2,zc=(bounds[2]+bounds[5])/2;
 const images=doc.images||[],textures=doc.textures||[],materials=doc.materials||[];let imageGPU={};
 async function getTexture(matIndex){let m=materials[matIndex]||{},pbr=m.pbrMetallicRoughness||{},ti=pbr.baseColorTexture?.index;ti=ti??m.extensions?.KHR_materials_pbrSpecularGlossiness?.diffuseTexture?.index;if(ti===undefined)return engine.defaultTexture;let imageIndex=textures[ti]?.source;if(imageIndex===undefined)return engine.defaultTexture;if(imageGPU[imageIndex])return imageGPU[imageIndex];let im=images[imageIndex],dat=null,mime=im.mimeType||'image/png';if(im.bufferView!==undefined){let bv=doc.bufferViews[im.bufferView],start=bv.byteOffset||0;dat=glb.bin.subarray(start,start+bv.byteLength)}else if(im.uri?.startsWith('data:')){dat=decode64(im.uri.split(',')[1]);mime=im.uri.split(';')[0].split(':')[1]}if(!dat)return engine.defaultTexture;try{imageGPU[imageIndex]=await engine.textureImage(key+':'+imageIndex,dat,mime)}catch(e){console.warn('Texture decoding failed',key,im,e);imageGPU[imageIndex]=engine.defaultTexture}return imageGPU[imageIndex]}
 let parts=[];for(let [pi,pr] of raw.entries()){let g=new Geometry(),mat=materials[pr.material]||{},col=mat.pbrMetallicRoughness?.baseColorFactor||mat.extensions?.KHR_materials_pbrSpecularGlossiness?.diffuseFactor||[1,1,1,1];let verts=[],idx=[];let ct=pr.points.length;for(let i=0;i<ct;i++){let p=pr.points[i],n=pr.normals?applyMat(pr.mat,[pr.normals[3*i],pr.normals[3*i+1],pr.normals[3*i+2]],0):[0,1,0],nl=Math.hypot(...n)||1,c=pr.colors?[pr.colors[i*4]??1,pr.colors[i*4+1]??1,pr.colors[i*4+2]??1,pr.colors[i*4+3]??1]:[1,1,1,1];let px=p[0]-xc,pz=p[2]-zc,nnx=n[0],nnz=n[2];if(rotateCar){let oldx=px;px=-pz;pz=oldx;let oldnx=nnx;nnx=-nnz;nnz=oldnx;}
 verts.push(px*scale,(p[1]-bounds[1])*scale,pz*scale,nnx/nl,n[1]/nl,nnz/nl,pr.uv?.[i*2]||0,pr.uv?.[i*2+1]||0,(col[0]??1)*c[0],(col[1]??1)*c[1],(col[2]??1)*c[2],(col[3]??1)*c[3]);}
 if(pr.indices){for(let i=0;i<pr.indices.length;i++)idx.push(pr.indices[i])}else{for(let i=0;i<ct;i++)idx.push(i)}let mesh=engine.makeMesh(key+':'+pi,verts,idx);if(mesh)parts.push({mesh,tex:await getTexture(pr.material)})}
 return{key,parts,sourceDimension:dim,scale,height:dim[1]*scale,width:(rotateCar?dim[2]:dim[0])*scale,depth:(rotateCar?dim[0]:dim[2])*scale,placeInstances:[],originalBytes:rawBytes?.byteLength||Math.ceil((b64?.length||0)*0.75)}
}

'use strict';
// Unified streamed 3D city — buildings, stores, rooftops, streets, coast, port, airport and pedestrians.
const CELL=112;const CELL_RADIUS=2;
const SIGN_TEXT=['CAFÉ ATLAS','GARAGE BOUZID','TÉLÉBOUTIQUE','EPICERIE','HAMMAM','PHARMACIE','SNACK CASA','BOUCHERIE','SALON','TAXIPHONE','LALLA FATIMA','SOUK','LIBRAIRIE','PRESSING','MÉCANIQUE','ALIMENTATION'];
function zoneAt(x,z){return closestDistrict(x,z).kind}
const rand2=(a,b)=>hash(a*129.32+b*43.84);
const rgba=(r,g,b)=>[r/255,g/255,b/255,1];

// Every upload has an entry in the canonical library. Original GLB bytes are never edited.
const MODEL_CATALOG={"2000_dacia_sandero":{"file":"2000_dacia_sandero.glb","category":"vehicle","style":"vehicle","length":4.0,"bytes":11311848,"triangles":102365,"dimensions":[83.941,62.568,171.325],"meshNodes":66,"era":"post2007","auto":false,"veryHeavy":false,"sha256":"edb9f49ba6651525c7d7c63e73f003a1f9f67e2b9319d5f0f4ed918fb5e61a62"},"2009_dacia_logan":{"file":"2009_dacia_logan.glb","category":"vehicle","style":"vehicle","length":4.25,"bytes":3923396,"triangles":66135,"dimensions":[8.929,8.177,19.252],"meshNodes":10,"era":"post2007","auto":false,"veryHeavy":false,"sha256":"2c84112ebceca4c2c17c5fa80d0e4f9de51e99c4440ab918c1fc21df7ae0cf98"},"4_street-light":{"file":"4_street-light.glb","category":"infrastructure","style":"street","length":9,"bytes":24157000,"triangles":400200,"dimensions":[28.649,94.484,25.429],"meshNodes":5,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"renderHeight":9,"sha256":"7a268d4b06f23e964d0b12c7f9efc1fb7339738969d46e74e8ca970e412ecdef"},"abandoned_building":{"file":"abandoned_building.glb","category":"building","style":"danger","length":12,"bytes":1729088,"triangles":8174,"dimensions":[3.486,8.459,4.798],"meshNodes":4,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"e45ce5ce36fbc61d67efa1f592127ad6b6e719bb92c4688b0e3e85d25e8630f8"},"american_road":{"file":"american_road.glb","category":"road","style":"road","length":18,"bytes":16094392,"triangles":51360,"dimensions":[3212.454,370.352,10070.24],"meshNodes":3,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"08eea3cce9d7e7167518cf856faff74377ce750e72726f8452b504c8d75d8ffe"},"asia_building":{"file":"asia_building.glb","category":"building","style":"downtown","length":28,"bytes":3029860,"triangles":14336,"dimensions":[168.829,175.074,159.634],"meshNodes":53,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"43805d60cb619b8144c8b3073e28747ef6ab2dd77ff9d5471b48dd7ded746694"},"bali_villa_-_roman_villa_influence":{"file":"bali_villa_-_roman_villa_influence.glb","category":"building","style":"rich","length":42,"bytes":491766820,"triangles":8500872,"dimensions":[711.957,464.926,1310.596],"meshNodes":259,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":true,"sha256":"ba1bcb245c2a04702da994bca51991008087c0a67a195310e38a623eaa540e89"},"barbed_wire_pack_3_1":{"file":"barbed_wire_pack_3.1.glb","category":"infrastructure","style":"street","length":5,"bytes":82499276,"triangles":3396776,"dimensions":[22.061,2.745,6.728],"meshNodes":47,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":true,"sha256":"f6aae6d6a11640cb8930a84deef2fb2fb84b8acdcf800a1a4e5c229601aeded4"},"barbed_wire_wooden_-_9mb_-_2part":{"file":"barbed_wire_wooden_-_9mb_-_2part.glb","category":"infrastructure","style":"street","length":5,"bytes":4700728,"triangles":9600,"dimensions":[0.123,1.1,12.562],"meshNodes":4,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"72cf42c2a8c9eceffc6aaaf786e24d935755d8634696671ae7cebfa9d3ad7bde"},"bugatti_eb110_super_sport_1992_by_alex_ka":{"file":"bugatti_eb110_super_sport_1992_by_alex.ka..glb","category":"vehicle","style":"vehicle","length":4.4,"bytes":11266904,"triangles":169059,"dimensions":[10.992,1.192,10.952],"meshNodes":61,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"e23f06b6468bfba58ccd0fd25450022d864ec7f1391cd92387015c7b2dc32ff9"},"building":{"file":"building.glb","category":"building","style":"downtown","length":22,"bytes":2510788,"triangles":1346,"dimensions":[549.994,1098.194,1691.561],"meshNodes":2,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"7e653e1a9049e813f1c4de4ad5a166c80aca7a46006e78979ebde5f64a3884ff"},"building_03":{"file":"building_03.glb","category":"building","style":"downtown","length":13,"bytes":40813704,"triangles":660568,"dimensions":[2.0,4.141,2.0],"meshNodes":17,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"240c5280f9b531b54dd6bb9867e364364ce504c606c860ea30eab8441961dc1f"},"building_set":{"file":"building_set.glb","category":"building","style":"downtown","length":35,"bytes":31408628,"triangles":162667,"dimensions":[10.467,14.428,36.82],"meshNodes":132,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"ac42f652f6a49de0af52ec9e883ba6f6e25397c8c89fa09b6af31dbaeaf3b0e3"},"bus_stop_1":{"file":"bus_stop (1).glb","category":"infrastructure","style":"street","length":5,"bytes":3067296,"triangles":8586,"dimensions":[6.357,3.624,1.731],"meshNodes":2,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"07cde2ce16d2ba75aa4f2cd999caefe820029ada714292d5d8408fa4fcf4be68"},"bus_stop":{"file":"bus_stop.glb","category":"infrastructure","style":"street","length":5,"bytes":4561248,"triangles":3404,"dimensions":[3.508,1.214,2.904],"meshNodes":5,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"7a53139932fdd8fa7e7d91da69440fc7b84e4b1afe7259d04a1f8d1cba942551"},"car_burned_in_the_fire_old_car_samand":{"file":"car_burned_in_the_fire_old_car_samand.glb","category":"vehicle","style":"vehicle","length":4.5,"bytes":24510716,"triangles":540909,"dimensions":[0.323,0.222,0.732],"meshNodes":6,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"413c0ba40df371d8e0ea9d72a62718f2347752586e94e079d193c49202fb5d10"},"chicago_buildings":{"file":"chicago_buildings.glb","category":"building","style":"downtown","length":45,"bytes":4280928,"triangles":2270,"dimensions":[176.095,95.735,113.276],"meshNodes":2,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"14b59daf9da1ad9884137449a463fdd026e5679d05bb7cdcfd42444ae94c942c"},"citroen_berlingo_full_electric":{"file":"citroen_berlingo_full_electric.glb","category":"vehicle","style":"vehicle","length":4.45,"bytes":37995892,"triangles":834113,"dimensions":[2.584,2.783,5.825],"meshNodes":189,"era":"post2007","auto":false,"veryHeavy":false,"sha256":"92afab721e671821fb2a0675c0e02e687c0dcafaaf986bc112ddf90717197cc1"},"citroen_c1":{"file":"citroen_c1.glb","category":"vehicle","style":"vehicle","length":3.43,"bytes":11350980,"triangles":303576,"dimensions":[849.721,455.895,472.794],"meshNodes":217,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"3eb6c23ec9540cbf319a4b286f43c8108ede61030f95057bab3a6addaec12d52"},"concrete_barrier__drum_barrel__fences":{"file":"concrete_barrier__drum_barrel__fences.glb","category":"infrastructure","style":"street","length":5,"bytes":4887704,"triangles":13221,"dimensions":[0.075,0.02,0.026],"meshNodes":88,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"01bbaf556861a42c19e2ca6b2eb3e5bf59602d080cbdbd788cf539317f762db9"},"dacia_duster_low_poly":{"file":"dacia_duster_low_poly.glb","category":"vehicle","style":"vehicle","length":4.32,"bytes":6974892,"triangles":31082,"dimensions":[4.229,1.867,1.97],"meshNodes":12,"era":"post2007","auto":false,"veryHeavy":false,"sha256":"0a639cf9a397e104d4b32fc9f76173d3c22d3940a4d13d97d4cea86db6d6a1d6"},"dirty_car":{"file":"dirty_car.glb","category":"vehicle","style":"vehicle","length":4.5,"bytes":6834384,"triangles":16708,"dimensions":[262.062,178.615,600.781],"meshNodes":3,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"781dadeb7df4da96fd4e75609147a5ff7740cf93522afb544576f1baf66577fc"},"electrical_substation":{"file":"electrical_substation.glb","category":"infrastructure","style":"street","length":5,"bytes":3522252,"triangles":2066,"dimensions":[0.336,0.094,0.136],"meshNodes":1,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"renderHeight":2.5,"sha256":"8228a24a0ed2c86767bceae25cae2ff5c8b3bedfcd9869d4e53f12ef4d909f9c"},"fence_protective_fence_metallic_avenue_farm":{"file":"fence_protective_fence_metallic_avenue_farm.glb","category":"infrastructure","style":"street","length":5,"bytes":12646080,"triangles":123860,"dimensions":[228.321,210.0,1012.767],"meshNodes":4,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"52c9de53a3a8343d28d4da85c2d529d4022e5cf95406e103c663650c2d681e07"},"free_1975_porsche_911_930_turbo":{"file":"free_1975_porsche_911_930_turbo.glb","category":"vehicle","style":"vehicle","length":4.3,"bytes":21970656,"triangles":241260,"dimensions":[3.296,2.327,6.233],"meshNodes":75,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"e1d7de07dda7d42aa9d87da33af4d4b05ed344e9c0222d571dce19e3658436ac"},"gravel_road":{"file":"gravel_road.glb","category":"road","style":"road","length":18,"bytes":18384228,"triangles":158392,"dimensions":[1.812,0.187,4.032],"meshNodes":8,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"15733a1df7f46a41e3bb198dd1abbc5c68f1daef28245fa187ebb3d4150fb394"},"japanese_traffic_assets":{"file":"japanese_traffic_assets.glb","category":"infrastructure","style":"street","length":5,"bytes":61779856,"triangles":29476,"dimensions":[0.092,0.043,0.036],"meshNodes":80,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":true,"sha256":"51d9b2704066449f40b6bd865e1a0fc2cd6498eea49a2926fad950b5534487b8"},"low_poly_electrical_panel":{"file":"low_poly_electrical_panel.glb","category":"infrastructure","style":"street","length":5,"bytes":4629364,"triangles":29112,"dimensions":[5.1,2.862,0.786],"meshNodes":12,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"renderHeight":1.8,"sha256":"c8081929eb3e01ca45531974bd59755ae1d3d34c00b11d2a13ca667a1ab57cfc"},"lowpoly_abandoned_simple_car_prop_-_game_ready":{"file":"lowpoly_abandoned_simple_car_prop_-_game_ready.glb","category":"vehicle","style":"vehicle","length":4.1,"bytes":2917168,"triangles":2504,"dimensions":[70.335,24.313,28.744],"meshNodes":1,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"eec5ed3bc7a922cc8752e8c8e4640405c62eba1ffe2c2de95d6542670287d170"},"modern_luxury_villa_house_building_design":{"file":"modern_luxury_villa_house_building_design.glb","category":"building","style":"rich","length":34,"bytes":16026656,"triangles":58164,"dimensions":[30.417,11.012,28.485],"meshNodes":211,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"b16549f6c250695e2f7164a2d62247dd198e9e2a5ded4f9e4d79d6a735bbffbf"},"modern_luxury_villa_house_building_with_pool":{"file":"modern_luxury_villa_house_building_with_pool.glb","category":"building","style":"rich","length":36,"bytes":6662252,"triangles":133529,"dimensions":[27.049,9.786,34.994],"meshNodes":1345,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"a94e47158bdeac0f911d6c0e6e5a31f43e1c54cde867e33d5987c0339da9702e"},"moroccan_national_police_car_low_poly_game_ready":{"file":"moroccan_national_police_car_low_poly_game_ready.glb","category":"vehicle","style":"vehicle","length":4.65,"bytes":40871152,"triangles":1040774,"dimensions":[3.561,1.764,1.565],"meshNodes":14,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":true,"sha256":"b1ab2c1ea5f358ed21cbe95c4b67153dbf01f110d4fe59b7b6175d427d897c62"},"mosque":{"file":"mosque.glb","category":"building","style":"mosque","length":48,"bytes":6406832,"triangles":151783,"dimensions":[1.634,2.156,1.295],"meshNodes":26,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"1dfe1d646efa78d0c56f3f49982143490f92cce194c1c7539df866facf813bf4"},"mosque_al_mohamadi":{"file":"mosque_al_mohamadi.glb","category":"building","style":"mosque","length":62,"bytes":2298604,"triangles":587,"dimensions":[78.817,48.056,72.574],"meshNodes":1,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"415e76b6dd2648f75a8775287d0858a0e62f12c349a8db9f2f38177f184e7e71"},"old_bicycle":{"file":"old_bicycle.glb","category":"vehicle","style":"vehicle","length":1.75,"bytes":3986744,"triangles":55279,"dimensions":[16.731,9.123,3.812],"meshNodes":34,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"c847039ac5df3f4b23bce846984b8f5c2a5283bf40802d5f6d713d1acd8a46c9"},"old_building__lowpoly":{"file":"old_building__lowpoly.glb","category":"building","style":"derb","length":11,"bytes":1073544,"triangles":2872,"dimensions":[9.044,9.01,9.044],"meshNodes":8,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"85cb62df8104e366ce2a0447cc202d95207ac42ed86e9ce9d03395a0c0554c29"},"old_buildings":{"file":"old_buildings.glb","category":"building","style":"medina","length":33,"bytes":5833288,"triangles":232,"dimensions":[371.054,107.909,37.108],"meshNodes":2,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"2ce0ad05cf2cab38f9905b58adfc836eb663aadc5aa78ac88317907a3255572f"},"old_car":{"file":"old_car.glb","category":"vehicle","style":"vehicle","length":4.4,"bytes":13544604,"triangles":150796,"dimensions":[5.475,1.936,2.132],"meshNodes":23,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"720f9a0ca350ac501b2d0c9e31cbe684c61e86dd5ea2c2f827b0e21054662c05"},"old_car_wreck":{"file":"old_car_wreck.glb","category":"vehicle","style":"vehicle","length":4.5,"bytes":3462140,"triangles":3624,"dimensions":[71.295,57.189,181.926],"meshNodes":1,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"10ea1bc932ef896797027d57d98f3034b5b6f7b405b35a9774664c051b499e98"},"old_residential_building_4k":{"file":"old_residential_building_4k.glb","category":"building","style":"derb","length":18,"bytes":33990640,"triangles":276674,"dimensions":[19.501,14.374,11.493],"meshNodes":25,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"6689fb781e7630ce798bea6be844281b6511fb4627273f6b2f39494b1c2a2233"},"old_rusty_car":{"file":"old_rusty_car.glb","category":"vehicle","style":"vehicle","length":4.35,"bytes":5626704,"triangles":3132,"dimensions":[1056.48,184.846,1327.188],"meshNodes":3,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"2f61b39d8fcee9887628e4d68524a3f7b657fe6293c236e3ebce0bbb7a78435c"},"peugeot_405_glx_1987":{"file":"peugeot_405_glx_1987.glb","category":"vehicle","style":"vehicle","length":4.4,"bytes":115535016,"triangles":3889459,"dimensions":[4.328,1.456,2.018],"meshNodes":50,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":true,"sha256":"d92d70eaa0383e1d66c3e07baf90b1a93b52afa5bfb369bfb43d886885d6503d"},"peugeot_407":{"file":"peugeot_407.glb","category":"vehicle","style":"vehicle","length":4.68,"bytes":15921092,"triangles":270320,"dimensions":[2.018,1.408,4.595],"meshNodes":210,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"832e7228d965b1b7c313184b252772b30fd562ca896d5dc6335114e5daa92f78"},"piaggio_si_scooter":{"file":"piaggio_si_scooter.glb","category":"vehicle","style":"vehicle","length":1.8,"bytes":3720360,"triangles":22456,"dimensions":[321.918,192.935,83.558],"meshNodes":5,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"c470ef4a8e68ed6f11091174a8e46683ccac621abfb796445f59f361eb2a463d"},"procedural_hong_kong_building":{"file":"procedural_hong_kong_building.glb","category":"building","style":"downtown","length":19,"bytes":27723852,"triangles":197097,"dimensions":[8.113,8.238,4.785],"meshNodes":1295,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"38737a4896a147e5d92204b9bc8a30225445ffd47fe52e44c34f83f8d960b53a"},"projectplaytime_destroy-a-toy_fences-pack":{"file":"projectplaytime_destroy-a-toy_fences-pack.glb","category":"infrastructure","style":"street","length":5,"bytes":61393516,"triangles":761114,"dimensions":[26.368,16.077,0.497],"meshNodes":46,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":true,"sha256":"dd8df0edb81a479b01fbdf83dc1df1171b0f2e7968dc681e793a21f2f172c280"},"psx_style_street_light_kit":{"file":"psx_style_street_light_kit.glb","category":"infrastructure","style":"street","length":5,"bytes":40556,"triangles":196,"dimensions":[14.581,23.938,21.354],"meshNodes":7,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"89bc298a5e61f820ee7483edbf0b9a907658cf4cb017cf8b478375935c481c04"},"road_1":{"file":"road (1).glb","category":"road","style":"road","length":18,"bytes":3836360,"triangles":36,"dimensions":[7.247,0.217,4.242],"meshNodes":1,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"3d060419b6ec6b7324a63f208ff3ae423a3a893546d554aab555f3ad79c01990"},"road":{"file":"road.glb","category":"road","style":"road","length":18,"bytes":55867728,"triangles":857534,"dimensions":[5402.146,411.811,798.584],"meshNodes":61,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"8dce55ec056def9a6244292574b3e5cf596321d562d82de9e5dd4ed76a9fec48"},"road__avenue__street":{"file":"road__avenue__street.glb","category":"road","style":"road","length":18,"bytes":3592988,"triangles":620,"dimensions":[1000.0,20.0,1500.0],"meshNodes":1,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"ecdecf51165b585129801fdd3949d81f15863e089417d24287159731cedcbae9"},"road_hd":{"file":"road_hd.glb","category":"road","style":"road","length":18,"bytes":3379172,"triangles":96,"dimensions":[35.19,0.197,234.599],"meshNodes":1,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"4b3aee9f94ba6648668aa4bf2c9e1142230776285eecbd60990d64d6b5466f36"},"road_intersection":{"file":"road_intersection.glb","category":"road","style":"road","length":18,"bytes":5690008,"triangles":11780,"dimensions":[121.874,8.933,232.183],"meshNodes":7,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"69a40e2b5428cd41e8538b9c57936fee4c9e1d57181f137a21e2a94ccae55367"},"school_building":{"file":"school_building.glb","category":"building","style":"residential","length":33,"bytes":3212760,"triangles":20386,"dimensions":[2.599,0.461,2.206],"meshNodes":9,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"cb9df67992f90f6046af93126a4c45621dbe81bae246211e33369612c78494b0"},"slum_house":{"file":"slum_house.glb","category":"building","style":"danger","length":14,"bytes":22641140,"triangles":127846,"dimensions":[11.398,4.498,9.435],"meshNodes":754,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"75b469ef0dda5684dd1ae6a9ef96ca03306f3a1ca11573452914b942deaefb3a"},"standard_bus_stop":{"file":"standard_bus_stop.glb","category":"infrastructure","style":"street","length":5,"bytes":7196760,"triangles":11616,"dimensions":[4.844,2.988,2.509],"meshNodes":5,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"0bcf90ac83f9ba6146f72066c5134e9b22d5ba057eb59017d7dd94fbcfd3f356"},"electrical_box":{"file":"street_electrical_box_chrome_low-poly.glb","category":"infrastructure","style":"street","length":5,"bytes":869080,"triangles":176,"dimensions":[1.008,1.829,1.444],"meshNodes":1,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"renderHeight":1.8,"sha256":"3ecea4a4cd5d769839a49f0efb40134da2d51c0d3426b4e90db36487ab65c516"},"street_light_alt":{"file":"street_light (1).glb","category":"infrastructure","style":"street","length":8,"bytes":95820,"triangles":2658,"dimensions":[26.984,505.594,211.921],"meshNodes":2,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"renderHeight":8,"sha256":"3e97c479352bb5c83fca8ae3fd365ff1da156405e7a27b4f1e854318b2b48341"},"street_light":{"file":"street_light.glb","category":"infrastructure","style":"street","length":8,"bytes":8171084,"triangles":23272,"dimensions":[716.213,638.602,6137.914],"meshNodes":3,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"renderHeight":8,"sha256":"1ed6c8ceae4968a789772098bf9f79f2a6043878d94398646683493a29831648"},"telephone_pole_scene":{"file":"telephone_pole_scene.glb","category":"infrastructure","style":"street","length":9,"bytes":3608416,"triangles":25384,"dimensions":[66.965,23.232,8.169],"meshNodes":17,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"renderHeight":8.5,"sha256":"e509854810420d28eb2cc5b38adb402c9dcc128a8c2bae148cc53c5bffdceb9b"},"telephone_poles":{"file":"telephone_poles.glb","category":"infrastructure","style":"street","length":9,"bytes":6070112,"triangles":5316,"dimensions":[29.096,31.443,5.399],"meshNodes":35,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"renderHeight":9,"sha256":"a2dd11acf9943a74e13601240657c7000121e21a58b06731409a793cd4dc36c1"},"traffic_cones":{"file":"traffic_cones.glb","category":"infrastructure","style":"street","length":5,"bytes":5019420,"triangles":18966,"dimensions":[2.404,1.805,3.356],"meshNodes":32,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"renderHeight":0.85,"sha256":"2e9013c1a890001eeaae146606b15dd298674514987555943e0663b241c95e83"},"traffic_light":{"file":"traffic_light.glb","category":"infrastructure","style":"street","length":7,"bytes":26038796,"triangles":43153,"dimensions":[2.333,10.674,2.337],"meshNodes":16,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"renderHeight":6.8,"sha256":"32c0812f095e22c686a87a707ed8cdf423b31265655313dbd48108795e1d5c68"},"traffic_signs":{"file":"traffic_signs.glb","category":"infrastructure","style":"street","length":5,"bytes":1824336,"triangles":5448,"dimensions":[1.252,0.631,0.062],"meshNodes":18,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":false,"sha256":"56301c3b637b7e267856a0b0b2bcc74a2fed8cd792ac48c8d45aa317a43fe2d9"},"tuscan_villa_-_italian_villa":{"file":"tuscan_villa_-_italian_villa.glb","category":"building","style":"rich","length":39,"bytes":436546004,"triangles":7015280,"dimensions":[836.776,407.337,1436.533],"meshNodes":260,"era":"2006-compatible-or-undated","auto":false,"veryHeavy":true,"sha256":"9c2dfd71f974a6bb9db11839fcc6fcd12f00a907ac0ff5455d8fe4626e75c402"},"villa_by_the_sea":{"file":"villa_by_the_sea.glb","category":"building","style":"coast","length":19,"bytes":3755408,"triangles":80907,"dimensions":[13.282,5.8,14.021],"meshNodes":22,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"d4e378aac531afb88c236ab4ffa93445ce0c0c5f62bf069d53f24d50bc87837d"},"warehouse_building":{"file":"warehouse_building.glb","category":"building","style":"port","length":37,"bytes":2219408,"triangles":3248,"dimensions":[25.711,34.103,40.765],"meshNodes":2,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"bf8aae99710b9596ad00b33f18163e61a4c33e21bd6a27b2419f8cc8c796c145"},"zaz-1102":{"file":"zaz-1102.glb","category":"vehicle","style":"vehicle","length":3.7,"bytes":820820,"triangles":5934,"dimensions":[1.567,1.217,2.978],"meshNodes":23,"era":"2006-compatible-or-undated","auto":true,"veryHeavy":false,"sha256":"1c39102c11d9dbe674c053ed0f0e42627a162c4e3c0c82648f3ec81e5bbf52c1"}};
const RAW_ASSET_FILES=new Map(), RAW_PACKS=new Map();
let assetBusy=false, assetTick=0, mountedFiles=0, packBytes=0, manualRequested=null;
const ZONE_SITE_MODELS={
 0:['old_residential_building_4k','old_building__lowpoly','slum_house','old_building__lowpoly','old_residential_building_4k','school_building'],
 1:['old_buildings','old_building__lowpoly','building_set','mosque','old_building__lowpoly'],
 2:['mosque_al_mohamadi','old_building__lowpoly','old_buildings','school_building','building_set'],
 3:['building','building_03','procedural_hong_kong_building','building','asia_building'],
 4:['chicago_buildings','building_03','building','procedural_hong_kong_building'],
 5:['modern_luxury_villa_house_building_with_pool','modern_luxury_villa_house_building_design','tuscan_villa_-_italian_villa','bali_villa_-_roman_villa_influence','villa_by_the_sea'],
 6:['villa_by_the_sea','modern_luxury_villa_house_building_design','modern_luxury_villa_house_building_with_pool','building_03'],
 7:['modern_luxury_villa_house_building_design','villa_by_the_sea','modern_luxury_villa_house_building_with_pool'],
 8:['old_residential_building_4k','slum_house','old_building__lowpoly','school_building'],
 9:['slum_house','old_residential_building_4k','old_building__lowpoly','school_building'],
 10:['abandoned_building','slum_house','abandoned_building','old_residential_building_4k'],
 11:['warehouse_building','abandoned_building','warehouse_building','building_set'],
 12:['warehouse_building','warehouse_building','abandoned_building','building_set'],
 13:['tuscan_villa_-_italian_villa','bali_villa_-_roman_villa_influence','modern_luxury_villa_house_building_with_pool'],
 14:['warehouse_building','building_set','building'],
 15:['mosque_al_mohamadi','mosque']
};
const DISTRICT_PARKED={
 derb:['old_car','old_rusty_car','zaz-1102','peugeot_405_glx_1987','dirty_car'],
 medina:['zaz-1102','old_car','old_bicycle','dirty_car'],
 residential:['peugeot_407','old_car','citroen_c1','zaz-1102'],
 downtown:['peugeot_407','citroen_c1','old_car','moroccan_national_police_car_low_poly_game_ready'],
 rich:['free_1975_porsche_911_930_turbo','bugatti_eb110_super_sport_1992_by_alex_ka','peugeot_407'],
 coast:['free_1975_porsche_911_930_turbo','peugeot_407','citroen_c1'],
 port:['old_car','old_rusty_car','dirty_car','moroccan_national_police_car_low_poly_game_ready'],
 industrial:['old_car_wreck','dirty_car','car_burned_in_the_fire_old_car_samand'],
 danger:['car_burned_in_the_fire_old_car_samand','old_car_wreck','dirty_car'],
 airport:['peugeot_407','citroen_c1'],
 road:['old_car','peugeot_407']
};
const WORLD_SITES=[];
const ZONE_RADII=[590,500,560,660,750,900,730,730,800,740,720,710,780,1080,950,130];
function zoneIndexAt(x,z){let best=0,dist=Infinity;for(let i=0;i<16;i++){let d=DISTRICTS[i],v=(d.x-x)**2+(d.z-z)**2;if(v<dist){dist=v;best=i}}return best}
// Parcel sampling over the ENTIRE district territory instead of a tight cluster at its label.
function parcelCandidate(zone,n,kind){
 const d=DISTRICTS[zone],radius=ZONE_RADII[zone];
 for(let attempt=0;attempt<200;attempt++){
  let seed=zone*17309+n*2497+attempt*193+kind*311;
  let angle=hash(seed+3)*Math.PI*2,dist=Math.sqrt(hash(seed+17))*radius;
  let cx=Math.round((d.x+Math.cos(angle)*dist)/CELL),cz=Math.round((d.z+Math.sin(angle)*dist)/CELL);
  if(cx*CELL===d.x&&cz*CELL===d.z)continue;
  if(zoneIndexAt(cx*CELL,cz*CELL)!==zone||!land(cx*CELL,cz*CELL))continue;
  return {cx,cz};
 }
 return {cx:Math.round(d.x/CELL)+((n%3)-1),cz:Math.round(d.z/CELL)+(Math.floor(n/3)-1)};
}
function roadsideParcel(zone,n,key){
 const p=parcelCandidate(zone,n,Math.floor(hash(zone+n*17)*3)),spec=MODEL_CATALOG[key]||{length:7};
 const long=Math.min(58,spec.length),edge=Math.max(6,CELL*.5-long*.49-4.5),side=n%4;
 let x=p.cx*CELL+(side===0?edge:side===1?-edge:((n%3)-1)*11);
 let z=p.cz*CELL+(side===2?edge:side===3?-edge:((n%3)-1)*11);
 let yaw=side===0?-Math.PI/2:side===1?Math.PI/2:side===2?Math.PI:0;
 return{x,z,yaw,zone,key};
}
const BUILDINGS_PER_ZONE=[24,20,20,24,21,19,18,17,20,20,23,18,17,17,5,2];
for(let zone=0;zone<16;zone++){
 let keys=ZONE_SITE_MODELS[zone]||[],num=BUILDINGS_PER_ZONE[zone],used=new Set();
 for(let n=0;n<num;n++){
  if(!keys.length)break;
  let key=keys[n%keys.length],sp=MODEL_CATALOG[key];if(!sp)continue;
  // Very large villas appear at most once per district; smaller architecture repeats naturally.
  if(sp.veryHeavy&&used.has(key))key=keys.find(k=>MODEL_CATALOG[k]?.auto)||keys[0];
  used.add(key);
  let site=roadsideParcel(zone,n,key);
  if(!land(site.x,site.z)||!roadClearance(site.x,site.z,Math.min(sp.length,48),Math.min(sp.length,48)))continue;
  let tooClose=WORLD_SITES.some(old=>old.zone===zone&&Math.hypot(old.x-site.x,old.z-site.z)<75);
  if(tooClose)continue;
  WORLD_SITES.push({...site,category:'building',length:sp.length});
 }
}
const ZONE_DECOR={
 0:['traffic_light','street_light_alt','telephone_poles','street_electrical_box_chrome_low-poly','bus_stop','traffic_signs'],
 1:['street_light_alt','traffic_signs','street_electrical_box_chrome_low-poly','bus_stop'],
 2:['street_light_alt','traffic_signs','bus_stop_1'],
 3:['traffic_light','4_street-light','standard_bus_stop','traffic_signs','traffic_cones'],
 4:['traffic_light','street_light','standard_bus_stop','traffic_signs'],
 5:['street_light_alt','fence_protective_fence_metallic_avenue_farm','standard_bus_stop'],
 6:['street_light_alt','traffic_light','standard_bus_stop'],
 7:['street_light_alt','standard_bus_stop'],
 8:['telephone_poles','traffic_signs','street_light_alt'],
 9:['telephone_poles','street_light_alt','bus_stop'],
 10:['telephone_poles','barbed_wire_wooden_-_9mb_-_2part','traffic_cones'],
 11:['electrical_substation','telephone_poles','concrete_barrier__drum_barrel__fences','traffic_light'],
 12:['electrical_substation','concrete_barrier__drum_barrel__fences','fence_protective_fence_metallic_avenue_farm'],
 13:['telephone_pole_scene','street_light_alt'],
 14:['traffic_light','traffic_signs','concrete_barrier__drum_barrel__fences'],
 15:['street_light_alt','traffic_signs']
};
const VEHICLE_SITES=[];
for(let zone=0;zone<16;zone++){
 let d=DISTRICTS[zone],fleet=fleetForKind(d.kind),nCar=Math.min(21,8+Math.floor(ZONE_RADII[zone]/90));
 for(let n=0;n<nCar;n++){
  if(!fleet.length)break;let key=fleet[n%fleet.length],p=parcelCandidate(zone,n+151,4);
  let side=n%4;
  let x=p.cx*CELL+(side<2?(side?1:-1)*(CELL*.5-7):((n%3)-1)*18);
  let z=p.cz*CELL+(side>=2?(side===2?1:-1)*(CELL*.5-7):((n%3)-1)*18);
  if(!land(x,z))continue;
  VEHICLE_SITES.push({x,z,key,zone,yaw:side<2?0:Math.PI/2,category:'vehicle'});
 }
}
const DECOR_SITES=[];
for(let zone=0;zone<16;zone++){
 const items=ZONE_DECOR[zone]||[],nProps=Math.min(19,7+Math.floor(ZONE_RADII[zone]/95));
 for(let n=0;n<nProps;n++){
  if(!items.length)continue;let key=items[n%items.length];if(!MODEL_CATALOG[key])continue;
  let p=parcelCandidate(zone,n+511,5),side=n%4;
  let x=p.cx*CELL+(side<2?(side?1:-1)*(CELL*.5-4):10);
  let z=p.cz*CELL+(side>=2?(side===2?1:-1)*(CELL*.5-4):10);
  if(land(x,z))DECOR_SITES.push({x,z,key,yaw:side*Math.PI/2,zone,category:'infrastructure'});
 }
}
function nearbySiteKeys(x,z,radius){return [...WORLD_SITES,...DECOR_SITES,...VEHICLE_SITES].filter(site=>Math.hypot(x-site.x,z-site.z)<radius).sort((a,b)=>Math.hypot(x-a.x,z-a.z)-Math.hypot(x-b.x,z-b.z)).map(site=>site.key);} 
function fleetForKind(kind){return (DISTRICT_PARKED[kind]||DISTRICT_PARKED.residential).filter(k=>MODEL_CATALOG[k]&&MODEL_CATALOG[k].era!=='post2007');}

function makeCubeMesh(){let a=new Geometry();a.box(0,0,0,1,1,1);return a}
function streetCarMesh(){let g=new Geometry();g.box(0,0.34,0,1.68,0.42,3.56,rgba(225,225,219));g.box(0,0.78,-0.20,1.48,0.54,1.94,rgba(190,203,205));g.box(0,0.9,0.76,1.37,0.30,0.04,rgba(31,52,65));g.box(0,0.9,-1.15,1.37,0.30,0.04,rgba(31,52,65));g.box(0,0.45,1.8,1.58,0.26,0.1,rgba(61,70,75));g.box(0,0.45,-1.78,1.58,0.26,0.1,rgba(62,65,70));for(let s of [-1,1])for(let z of [-1.2,1.2]){g.box(s*0.85,0.25,z,0.18,0.48,0.60,rgba(29,30,31));g.box(s*0.948,0.25,z,0.03,0.24,0.26,rgba(147,153,154))}for(let s of [-1,1]){g.box(s*0.55,0.57,1.80,0.31,0.15,0.03,rgba(240,222,170));g.box(s*0.55,0.57,-1.80,0.31,0.15,0.03,rgba(209,66,51))}return g}
function streetPersonMesh(){let g=new Geometry();g.box(0,0.86,0,0.44,0.75,0.25,rgba(70,85,93));g.box(0,1.55,0,0.28,0.34,0.27,rgba(169,127,98));g.box(-.34,.89,0,.17,.68,.21,rgba(175,148,102));g.box(.34,.89,0,.17,.68,.21,rgba(175,148,102));g.box(-.13,.20,0,.18,.52,.23,rgba(56,64,77));g.box(.13,.20,0,.18,.52,.23,rgba(56,64,77));return g}
function buildCity(engine,px,pz,models,world){
 let ccx=Math.floor(px/CELL),ccz=Math.floor(pz/CELL),radius=quality==='HIGH'?3:quality==='ECO'?1:2;
 let key=ccx+':'+ccz+':'+quality;if(world.chunkKey===key)return false;
 world.chunkKey=key;
 for(let v of world.cityDraws||[])engine.destroyDraw(v);
 for(let m of world.cityMeshes||[])engine.destroyMesh(m);
 for(let v of world.modelDraws||[])engine.destroyDraw(v);
 world.cityDraws=[];world.cityMeshes=[];world.modelDraws=[];world.blocks=[];
 const groups={plaster:new Geometry(),cream:new Geometry(),stone:new Geometry(),warehouse:new Geometry(),roof:new Geometry(),asphalt:new Geometry(),cobble:new Geometry(),pavement:new Geometry(),sand:new Geometry(),water:new Geometry(),foliage:new Geometry(),white:new Geometry(),glass:new Geometry(),signs:new Geometry(),avenue:new Geometry(),highway:new Geometry(),gravel:new Geometry(),derbroad:new Geometry()};
 let modelInst={},addModel=(name,x,z,s,yaw=0,rgb=[1,1,1])=>{if(!models[name])return;(modelInst[name]??=[]).push([x,0,z,s,yaw,...rgb])};
 const push=(mat,g,what)=>{if(what===''){};groups[mat].append(g)};
 for(let cx=ccx-radius;cx<=ccx+radius;cx++)for(let cz=ccz-radius;cz<=ccz+radius;cz++){
  const xc=cx*CELL,zc=cz*CELL;
  if(Math.abs(xc)>MAP_SCALE*815||Math.abs(zc)>MAP_SCALE*570)continue;
  let type=zoneAt(xc,zc),isRural=type==='rich'&&hash(cx*cx+cz*49)>.65;
  let landHere=land(xc,zc);
  if(!landHere){groups.water.box(xc,-.30,zc,CELL+.5,0.07,CELL+.5,[.87,.99,1,1]);continue}
  // Ground tiles share the same connected world coordinates.
  let soil=type==='rich'?'foliage':type==='coast'?'sand':type==='port'||type==='industrial'?'warehouse':'pavement';
  groups[soil].box(xc,-.23,zc,CELL+.2,0.22,CELL+.2,[.98,.98,.98,1]);
  // Local street grid with wide sidewalks. Main highways are added separately below.
  let localWidth=type==='medina'?5.2:type==='downtown'?11:type==='rich'?8.5:type==='airport'?13:7.8;
  // Road materials are extracted from the user's unaltered uploaded road models, not random noise.
  let localMaterial=type==='medina'?'cobble':type==='downtown'?'avenue':type==='rich'||type==='coast'?'highway':type==='industrial'||type==='port'?'gravel':'derbroad';
  let offsetX=xc-CELL/2+5,offsetZ=zc-CELL/2+5;
  for(let o of [-CELL/2,CELL/2]){
   let x=xc+o,z=zc+o;
   groups.pavement.strip(x,zc-CELL/2,x,zc+CELL/2,localWidth+2.5,-.01,[.91,.88,.82,1],5);
   groups[localMaterial].strip(x,zc-CELL/2,x,zc+CELL/2,localWidth,.035,[.98,.96,.91,1],5);
   groups.pavement.strip(xc-CELL/2,z,xc+CELL/2,z,localWidth+2.5,-.01,[.91,.88,.82,1],5);
   groups[localMaterial].strip(xc-CELL/2,z,xc+CELL/2,z,localWidth,.035,[.98,.96,.91,1],5);
   // Intersections, intermittent center stripes, drainage edges.
   for(let v=-CELL/2+8;v<CELL/2-8;v+=16){
    if(type==='downtown'||type==='coast'){
     groups.white.strip(x,zc+v,x,zc+v+4,.11,.065,[.91,.84,.64,1],1);
     groups.white.strip(xc+v,z,xc+v+4,z,.11,.065,[.91,.84,.64,1],1);
    }
   }
  }
  // Authored assets: fixed parcels distributed across the full mapped district footprint.
  for(const site of WORLD_SITES){if(Math.abs(site.x-xc)>CELL*.56||Math.abs(site.z-zc)>CELL*.56)continue;
   const model=models[site.key];if(!model)continue;
   addModel(site.key,site.x,site.z,1,site.yaw);
   let swap=Math.abs(Math.cos(site.yaw))<.30,w=swap?model.depth:model.width,d=swap?model.width:model.depth;
   if(w>.7&&d>.7)world.blocks.push({x:site.x,z:site.z,w:w*.91,d:d*.91});
  }
  for(const site of VEHICLE_SITES){if(Math.abs(site.x-xc)>CELL*.56||Math.abs(site.z-zc)>CELL*.56)continue;
   if(models[site.key])addModel(site.key,site.x,site.z,1,site.yaw);
  }
  for(const site of DECOR_SITES){if(Math.abs(site.x-xc)>CELL*.56||Math.abs(site.z-zc)>CELL*.56)continue;
   if(models[site.key])addModel(site.key,site.x,site.z,1,site.yaw);
  }
  const crowded=['derb','medina','danger','residential','industrial','port'].includes(type);
  const plots=type==='downtown'?3:type==='medina'||type==='derb'||type==='danger'?4:3;
  for(let ix=0;ix<plots;ix++)for(let iz=0;iz<plots;iz++){
   let seed=cx*1093+cz*349+ix*71+iz*29,rv=rand2(seed,31);if(rv<.08||(!land(xc+(ix-1)*24,zc+(iz-1)*24)))continue;
   let spread=CELL/plots,xx=xc-CELL/2+(ix+.5)*spread+(rand2(seed,16)-.5)*5,zz=zc-CELL/2+(iz+.5)*spread+(rand2(seed,17)-.5)*5;
   if(!land(xx,zz))continue;
   // Do not bury authored buildings under procedural lots.
   let reserved=WORLD_SITES.some(site=>models[site.key]&&Math.abs(site.x-xx)<(spread*.5+site.length*.50+3)&&Math.abs(site.z-zz)<(spread*.5+site.length*.50+3));
   if(reserved)continue;
   let ww=spread*(type==='medina'?.80:.74),dd=spread*(type==='medina'?.81:.76),floor=type==='downtown'?6+Math.floor(rv*7):type==='rich'?2+Math.floor(rv*2):type==='industrial'||type==='port'?2+Math.floor(rv*2):type==='medina'?2+Math.floor(rv*3):3+Math.floor(rv*4);let h=floor*3.05;
   if(type==='airport'){floor=1;h=6}
   if(!roadClearance(xx,zz,ww,dd)||type==='airport'||type==='mosque')continue;
   // Local street centerlines run at each cell boundary. Keep building walls behind real curb clearance.
   const maxW=2*(CELL*.5-localWidth*.5-3.2-Math.abs(xx-xc)),maxD=2*(CELL*.5-localWidth*.5-3.2-Math.abs(zz-zc));
   ww=Math.min(ww,maxW);dd=Math.min(dd,maxD);if(ww<5.0||dd<5.0)continue;
   if(isRural&&rand2(seed,77)>.23)continue;
   let wallMat=type==='medina'?'stone':type==='downtown'?'cream':type==='industrial'||type==='port'?'warehouse':rand2(seed,62)<.55?'plaster':'cream';
   let tint= type==='rich'?[1.10,1.06,.98,1]:type==='danger'?[.87,.83,.78,1]:type==='industrial'?[.77,.82,.85,1]:[.98,.98,.97,1];

   groups[wallMat].box(xx,0,zz,ww,h,dd,tint,1.5);
   groups.roof.box(xx,h,zz,ww+.8,.22,dd+.7,[.99,.96,.96,1]);
   world.blocks.push({x:xx,z:zz,w:ww*.96,d:dd*.96});
   let frontZ=zz+dd/2+.025;
   let winRows=Math.min(7,Math.floor(h/3)),winCols=Math.max(2,Math.min(5,Math.floor(ww/3.2)));let glass=groups.glass;
   for(let fy=1;fy<winRows;fy++)for(let wx=0;wx<winCols;wx++){
    let windowX=xx+(wx+.5-winCols/2)*ww/(winCols+.25),windowY=fy*3.0+1.05;
    glass.box(windowX,windowY,frontZ+.04,1.10,1.44,.08,[.20,.30,.34,1]);
    groups.white.box(windowX,windowY-.82,frontZ+.13,1.27,.12,.17,[.79,.78,.71,1]);
    if(type!=='industrial'&&rand2(seed+fy,wx)>.29){let shade=rand2(seed+fy,wx+76);groups.white.box(windowX+(.63),windowY,frontZ+.12,.13,1.53,.10,shade>.5?[.31,.43,.51,1]:[.28,.52,.58,1]);}
    if(type==='derb'||type==='residential'||type==='medina'){
     if(rand2(seed*fy,wx+7)>.55){groups.white.box(windowX,windowY-.92,frontZ+.63,1.5,.12,.95,[.71,.66,.57,1]);for(let k=-1;k<=1;k++)groups.glass.box(windowX+k*.60,windowY-.59,frontZ+1.08,.045,.57,.06,[.30,.32,.31,1]);}
    }
   }
   if(type==='derb'||type==='medina'||type==='residential'||type==='danger'){
    // Ground-floor roll-up storefront, colored signs and awnings.
    let sclr=rand2(seed,3);let shopColor=sclr<.3?[.31,.39,.47,1]:sclr<.6?[.25,.44,.42,1]:[.48,.36,.27,1];
    groups.white.box(xx,.95,frontZ+.07,Math.min(ww-1,5.2),1.95,.11,shopColor);
    let signW=Math.min(ww-1,6.1),signIdx=Math.floor(rand2(seed,97)*SIGN_TEXT.length),su=(signIdx%4)/4,sv=Math.floor(signIdx/4)/4;
    groups.signs.quad([xx-signW/2,2.95,frontZ+.31],[xx+signW/2,2.95,frontZ+.31],[xx+signW/2,2.24,frontZ+.31],[xx-signW/2,2.24,frontZ+.31],[0,0,1],[1,1,1,1],[su,sv,su+.25,sv+.25]);
    if(rand2(seed,98)>.34)groups.roof.box(xx,2.85,frontZ+.85,Math.min(ww-1,5.2),.13,1.5,rand2(seed,111)>.5?[.57,.24,.21,1]:[.24,.47,.45,1]);
    
   }
   if(type==='industrial'||type==='port'){
    groups.white.box(xx,2.9,frontZ+.15,ww*.68,4.1,.14,[.36,.42,.43,1]);
   }
   if(type==='rich'){
    // Gardens, walls, low hedges, rare uploaded villa / school architecture.
    
    if(rand2(seed,12)>.5){for(let d0 of [-1,1])groups.foliage.box(xx+d0*(ww/2+.8),.08,zz,1.4,1.18,dd,[.75,.91,.76,1]);}
   }
   
   // Rooftop satellite dishes and water tanks: iconic early-2000s skyline.
   if(crowded&&rand2(seed,6)>.53){groups.white.box(xx+ww*.27,h+.2,zz-dd*.15,1.2,.85,1.2,[.34,.37,.42,1]);groups.glass.box(xx-ww*.18,h+.3,zz+dd*.19,.13,.85,.13,[.67,.66,.66,1]);}
  }
  if(['downtown','derb','residential'].includes(type)&&rand2(cx,cz)>.63){
   for(let s=-2;s<=2;s++)groups.white.strip(xc+s*1.4,zc-CELL*.50-3.1,xc+s*1.4,zc-CELL*.50+3.1,.63,.072,[.93,.91,.81,1]);
  }
  let sn=cx*123+cz*297;
  if(models['street_light_alt']&&rand2(sn,520)>.35){
   let lx=xc-CELL*.39,lz=zc+CELL*.37;
   if(land(lx,lz))addModel('street_light_alt',lx,lz,1.0,0);
  }
  if(models['electrical_box']&&['derb','industrial','residential'].includes(type)&&rand2(sn,543)>.72){
   addModel('electrical_box',xc+CELL*.38,zc-CELL*.37,1.0,.2);
  }
  if(models['bus_stop']&&['downtown','residential','derb'].includes(type)&&rand2(sn,800)>.73){
   addModel('bus_stop',xc+CELL*.31,zc-CELL*.43,1.0,-1.57);
  }
  // Parked user-uploaded vehicles on the curb (outside of building plots).
  for(let slot=0;slot<2;slot++){
   let px0=xc+(slot===0?-CELL/2+7:CELL/2-7),pz0=zc+(rand2(sn,slot+337)-.5)*CELL*.70;
   if(!land(px0,pz0)||nearestRoad(px0,pz0).distance<3.0)continue;
   let choices=fleetForKind(type),vehicle=choices.length?choices[Math.floor(rand2(sn,slot+933)*choices.length)]:null;
   if(models[vehicle])addModel(vehicle,px0,pz0,1,slot?0:Math.PI,[1,1,1]);
  }
  // Service props, walls, palms and garden patches.
  if(type==='rich'||type==='coast')for(let i=0;i<5;i++){
   let tx=xc+(rand2(sn,i*14)-.5)*CELL,tz=zc+(rand2(sn,i*33)-.5)*CELL;
   if(!land(tx,tz)||nearestRoad(tx,tz).distance<8)continue;
   let trunk=5+rand2(sn,i)*2.8;groups.plaster.box(tx,0,tz,.40,trunk,.40,[.52,.47,.30,1]);for(let j=0;j<7;j++){let theta=j*Math.PI*2/7,ex=tx+Math.cos(theta)*2.7,ez=tz+Math.sin(theta)*2.7;
    groups.foliage.strip(tx,tz,ex,ez,.24,trunk+0.25,[.50,.83,.48,1],1)}
  }
  if(type==='derb'||type==='medina'||type==='residential')for(let i=0;i<4;i++){
   let qx=xc+(rand2(sn,i+111)-.5)*CELL,qz=zc+(rand2(sn,i+222)-.5)*CELL;
   if(!land(qx,qz)||nearestRoad(qx,qz).distance<3)continue;
   groups.white.box(qx,0,qz,1.65,1.18,1.4,[.25,.30,.34,1]);groups.white.box(qx,.98,qz,1.7,.13,1.5,[.30,.33,.33,1]);
  }
 }
 // Handmade connected trunk roads traced through the reference map; draw them on top of local grid.
 const roadPlayerRadius=(radius+.9)*CELL;
 for(const route of ROUTES){let pts=route.points;for(let i=0;i<pts.length-1;i++){
  let a=pts[i],b=pts[i+1],mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;
  if(Math.hypot(mx-px,mz-pz)>roadPlayerRadius+Math.hypot(b[0]-a[0],b[1]-a[1])*.5)continue;
  groups.pavement.strip(a[0],a[1],b[0],b[1],route.width+2.2,.031,[.82,.81,.75,1],Math.max(3,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/8)));
  groups[route.id.includes('HIGHWAY')||route.id.includes('RING')||route.id.includes('AIRPORT')?'highway':route.id.includes('BOULEVARD')||route.id.includes('PRINCIPALE')?'avenue':route.id.includes('DERB')?'derbroad':'asphalt'].strip(a[0],a[1],b[0],b[1],route.width,.078,[.97,.97,.97,1],Math.max(3,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/8)));
  let len=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=(b[0]-a[0])/len,dz=(b[1]-a[1])/len,nx=-dz,nz=dx;
  for(let t=0;t<len;t+=10){let t2=Math.min(len,t+4),x=a[0]+dx*t,z=a[1]+dz*t,y=.115;
    if(route.lanes>=4)for(let side of [-.25,.25])groups.white.strip(x+nx*route.width*side,z+nz*route.width*side,x+dx*(t2-t)+nx*route.width*side,z+dz*(t2-t)+nz*route.width*side,.12,y,[.88,.83,.65,1]);
    else groups.white.strip(x,z,x+dx*(t2-t),z+dz*(t2-t),.08,y,[.86,.77,.65,1]);
  }
 }
 }
 // Waterfront and port/airport landmarks, grounded in the same continuous map.
 for(let landmark of DISTRICTS.slice(0,16)){
  if(Math.hypot(px-landmark.x,pz-landmark.z)>roadPlayerRadius+120)continue;
  if(landmark.kind==='port'){
   for(let i=0;i<18;i++){let x=landmark.x+(i%6-2.5)*21,z=landmark.z+(Math.floor(i/6)-1)*24;groups.warehouse.box(x,0,z,13,2.8,5,[.70+rand2(i,4)*.2,.57+rand2(i,2)*.2,.48+rand2(i,8)*.25,1]);}
   for(let i=0;i<3;i++){let x=landmark.x-40+i*36,z=landmark.z+50;groups.white.box(x,0,z,1.3,24,1.6,[.71,.30,.25,1]);groups.white.box(x,23,z+14,1.2,1.1,38,[.73,.31,.29,1]);}
  }else if(landmark.kind==='airport'){
   groups.asphalt.box(landmark.x,-.01,landmark.z,190,.08,40,[.83,.85,.86,1]);
   groups.white.box(landmark.x-60,0,landmark.z-37,68,7,21,[.71,.78,.82,1]);
  }else if(landmark.kind==='mosque'){
   groups.stone.box(landmark.x,-.19,landmark.z,110,.24,103,[.94,.92,.83,1]);
   groups.asphalt.strip(landmark.x+4,landmark.z+4,landmark.x+52,landmark.z+80,13,.18,[.90,.90,.88,1],6);
   if(models['mosque_al_mohamadi'])addModel('mosque_al_mohamadi',landmark.x,landmark.z,1.85,-.1);
   else {groups.cream.box(landmark.x,0,landmark.z,24,14,32,[1,1,1,1]);groups.stone.box(landmark.x+18,0,landmark.z-12,4,37,4,[.89,.87,.73,1]);}
  }
 }
 // Isolated asset-inspection lot at the airport: lets the user view every original,
 // including post-2007 cars, incompatible collection packs, and very large models by choice.
 if(world.previewKey&&models[world.previewKey]){
  const a=DISTRICTS[14],showX=a.x+72,showZ=a.z+94;
  if(Math.hypot(px-showX,pz-showZ)<roadPlayerRadius+60){
   let spec=MODEL_CATALOG[world.previewKey],m=models[world.previewKey];
   groups.pavement.box(showX,-.20,showZ,Math.max(45,m.width+15),.20,Math.max(45,m.depth+15),[1,1,1,1]);
   addModel(world.previewKey,showX,showZ,1,0);
  }
 }
 // Material batching: one mesh per texture for all visible streaming cells.
 for(let [mat,g] of Object.entries(groups)){
  if(!g.i.length)continue;
  let mesh=engine.makeMesh('city_'+mat,g.v,g.i);if(!mesh)continue;world.cityMeshes.push(mesh);
  let tex=engine.textures.get(mat)||engine.defaultTexture;
  let inst=engine.makeDraw(mesh,tex,[[0,0,0,1,0,1,1,1]]);world.cityDraws.push(inst);
 }
 world.modelDraws=[];
 for(let [key,inst] of Object.entries(modelInst)){
  if(!models[key])continue;for(let part of models[key].parts){world.modelDraws.push(engine.makeDraw(part.mesh,part.tex,inst));}
 }
 world.roadCount=ROUTES.length;world.buildingCount=world.blocks.length;world.nearDistrict=closestDistrict(px,pz).name;
 return true;
}

'use strict';
class Simulation {
 constructor(engine,templates){this.engine=engine;this.models=templates;this.time=0;this.traffic=[];this.people=[];this.npcDraws=[];this.carMesh=null;this.personMesh=null;this.carDraw=null;this.personDraw=null;this.speedKmh=0;this.chunks={cityDraws:[],cityMeshes:[],modelDraws:[],blocks:[],chunkKey:''};this.inCar=-1;this.camera={x:spawnForDistrict(0).x,y:1.7,z:spawnForDistrict(0).z,yaw:-1.15,pitch:-.03};this.vx=0;this.vz=0;this.yVelocity=0;this.playerCar=null;this.sprint=false;this.npcNear=0;this.trafficNear=0;this.lastDistrict='';this.lastSim=0}
 setup(){this.carMesh=this.engine.makeMesh('procedural_vehicles',streetCarMesh().v,streetCarMesh().i);let pg=streetPersonMesh();this.personMesh=this.engine.makeMesh('street_people',pg.v,pg.i);this.carDraw=this.engine.makeDraw(this.carMesh,this.engine.defaultTexture,[[0,-99,0,1,0,1,1,1]],true);this.personDraw=this.engine.makeDraw(this.personMesh,this.engine.defaultTexture,[[0,-99,0,1,0,1,1,1]],true);
  let routeList=ROUTES;let idx=0;for(let r of routeList){let L=sampleRoute(r,0).routeDistance,total=2*L+2*Math.PI*(r.width*.25+.7),count=Math.min(45,Math.max(3,Math.round(total/360)));for(let i=0;i<count;i++){let seed=idx++*33+i*3;this.traffic.push({route:r,dist:total*(i+.16*hash(seed))/count,side:(i%2===0?1:-1),speed:r.speed*.65+hash(seed+3)*r.speed*.26,targetSpeed:r.speed*.65+hash(seed+6)*r.speed*.24,color:this.vehicleColor(seed),model:(()=>{let q=sampleRoute(r,total*(i+.16*hash(seed))/count),fleet=fleetForKind(zoneAt(q.x,q.z));return fleet.length?fleet[Math.floor(hash(seed+12)*fleet.length)]:null})(),id:idx})}};
  this.traffic.push({manual:true,manualX:this.camera.x+4,manualZ:this.camera.z,manualYaw:Math.PI/2,side:1,route:ROUTES[6],dist:0,speed:0,targetSpeed:0,color:[.85,.85,.77],id:9999});
  for(let i=0;i<420;i++){let zone=DISTRICTS[i%15],angle=hash(i*7)*Math.PI*2,r=22+hash(i*17)*125;
   let x0=zone.x+Math.cos(angle)*r,z0=zone.z+Math.sin(angle)*r;
   // Local grid sidewalks — pedestrians must not spawn inside building lots.
   let nearestX=(Math.round((x0-CELL*.5)/CELL)*CELL+CELL*.5);
   let nearestZ=(Math.round((z0-CELL*.5)/CELL)*CELL+CELL*.5);
   let vertical=hash(i*22)>.5,x=vertical?nearestX+6.3:x0,z=vertical?z0:nearestZ+6.3;
   if(!land(x,z))continue;
   this.people.push({x,z,yaw:hash(i+9)*6.28,speed:.65+hash(i*32)*.55,phase:hash(i)*6.28,
    tx:vertical?x:x+9,tz:vertical?z+9:z,vertical,anchorX:x,anchorZ:z,seed:i})}
 }
 vehicleColor(i){let a=[[.69,.16,.13],[.87,.87,.81],[.25,.36,.43],[.26,.32,.25],[.66,.63,.52],[.16,.20,.26],[.55,.47,.33]];return a[Math.floor(hash(i*3)*a.length)]}
 getNearCar(){let c=this.camera,dist=7,best=-1;for(let i=0;i<this.traffic.length;i++){let car=this.traffic[i],r=this.trafficPosition(car),d=Math.hypot(r.x-c.x,r.z-c.z);if(d<dist){dist=d;best=i}}return best}
 trafficPosition(car){
  if(car.manual)return{x:car.manualX,z:car.manualZ,yaw:car.manualYaw};
  const route=car.route,pts=route.points,L=sampleRoute(route,0).routeDistance;
  const r=route.width*.25+.7,arc=Math.PI*r,loopLength=2*L+2*arc;
  let d=((car.dist%loopLength)+loopLength)%loopLength;
  if(d<L){let p=sampleRoute(route,d);let n=[Math.cos(p.yaw),-Math.sin(p.yaw)];return{x:p.x+n[0]*r,z:p.z+n[1]*r,yaw:p.yaw}}
  d-=L;
  if(d<arc){let p=sampleRoute(route,L),t=d/r,n=[Math.cos(p.yaw),-Math.sin(p.yaw)],f=[Math.sin(p.yaw),Math.cos(p.yaw)];
   return{x:p.x+n[0]*r*Math.cos(t)+f[0]*r*Math.sin(t),z:p.z+n[1]*r*Math.cos(t)+f[1]*r*Math.sin(t),yaw:p.yaw-t}}
  d-=arc;
  if(d<L){let p=sampleRoute(route,L-d),n=[Math.cos(p.yaw),-Math.sin(p.yaw)];return{x:p.x-n[0]*r,z:p.z-n[1]*r,yaw:p.yaw+Math.PI}}
  d-=L;
  let p=sampleRoute(route,0),t=d/r,n=[Math.cos(p.yaw),-Math.sin(p.yaw)],f=[Math.sin(p.yaw),Math.cos(p.yaw)];
  return{x:p.x-n[0]*r*Math.cos(t)-f[0]*r*Math.sin(t),z:p.z-n[1]*r*Math.cos(t)-f[1]*r*Math.sin(t),yaw:p.yaw+Math.PI-t};
 }
 collide(x,z,r=.42){
  for(let b of this.chunks.blocks){
   let dx=Math.max(0,Math.abs(x-b.x)-b.w*.5),dz=Math.max(0,Math.abs(z-b.z)-b.d*.5);
   if(dx*dx+dz*dz<r*r)return true;
  }
  return false;
 }
 toggleDrive(){if(this.inCar>=0){let p=this.playerCar,p0=this.trafficPosition(p),side=2.4;this.camera.x=p0.x+Math.cos(p0.yaw)*side;this.camera.z=p0.z-Math.sin(p0.yaw)*side;this.camera.y=1.65;this.inCar=-1;this.playerCar=null;this.speedKmh=0;return false}let near=this.getNearCar();if(near>=0){this.inCar=near;this.playerCar=this.traffic[near];this.playerCar.driveVelocity=0;this.playerCar.driveYaw=this.trafficPosition(this.playerCar).yaw;this.playerCar.driveX=this.trafficPosition(this.playerCar).x;this.playerCar.driveZ=this.trafficPosition(this.playerCar).z;return true}return false}
 teleport(index){let d=DISTRICTS[index];if(!d)return;this.inCar=-1;this.playerCar=null;let safe=spawnForDistrict(index);this.camera.x=safe.x;this.camera.z=safe.z;this.camera.y=1.70;this.camera.yaw=-1.25;this.camera.pitch=-.04;this.chunks.chunkKey='';document.getElementById('mapOverlay').classList.remove('open');buildCity(this.engine,this.camera.x,this.camera.z,this.models,this.chunks)}
 update(dt,ctrl){dt=Math.min(.045,dt);this.time+=dt;let c=this.camera;
  if(this.inCar>=0){let car=this.playerCar,throttle=-ctrl.moveY,steer=ctrl.moveX,velocity=car.driveVelocity||0;
   // Vehicle controls: throttle/engine drag, reverse, wheelbase turn-in and swept collision.
   const onRoad=nearestRoad(car.driveX??c.x,car.driveZ??c.z);
   const paved=onRoad.distance<onRoad.width*.65+2;
   const maxFwd=paved?32:18,accel=paved?8.8:5.5,brake=12.0;
   velocity+=(throttle>=0?throttle*accel:throttle*brake)*dt;
   const resistance=.50+.0055*Math.pow(Math.abs(velocity),2);
   if(Math.abs(throttle)<.05)velocity=Math.abs(velocity)<resistance*dt?0:velocity-Math.sign(velocity)*resistance*dt;
   velocity=Math.max(-9,Math.min(maxFwd,velocity));
   // Wheelbase bicycle approximation: tight steering at low speed, slower at high speed.
   const desiredSteering=steer*.56;
   car.steerAngle=(car.steerAngle??0)+(desiredSteering-(car.steerAngle??0))*Math.min(1,dt*6.5);
   let grip=paved?1:0.72;
   const yawRate=Math.tan(car.steerAngle)*velocity/3.15*grip;
   car.driveYaw+=Math.max(-1.1,Math.min(1.1,yawRate))*dt;
   let nx=car.driveX??this.trafficPosition(car).x,nz=car.driveZ??this.trafficPosition(car).z;
   let steps=Math.max(1,Math.ceil(Math.abs(velocity*dt)/.75)),step=velocity*dt/steps,blocked=false;
   for(let s=0;s<steps;s++){
    let xx=nx+Math.sin(car.driveYaw)*step,zz=nz+Math.cos(car.driveYaw)*step;
    if(this.collide(xx,zz,1.05)){blocked=true;break}
    nx=xx;nz=zz;
   }
   if(blocked){velocity=Math.min(0,velocity)*-.12;this.impactTime=this.time}
   car.driveX=nx;car.driveZ=nz;
   car.driveVelocity=velocity;this.speedKmh=Math.abs(velocity)*3.6;
   c.x=(car.driveX??nx);c.z=(car.driveZ??nz);c.y=1.7;c.yaw=car.driveYaw;c.pitch= Math.min(.17,Math.max(-.13,c.pitch+ctrl.lookY*.0016));
  }else{
   let speed=ctrl.run?7.3:4.2,mx=ctrl.moveX,my=-ctrl.moveY;
   let len=Math.max(1,Math.hypot(mx,my));mx/=len;my/=len;
   let ax=Math.cos(c.yaw)*mx+Math.sin(c.yaw)*my,az=-Math.sin(c.yaw)*mx+Math.cos(c.yaw)*my;
   let smooth=Math.min(1,dt*13);this.vx+=(ax*speed-this.vx)*smooth;this.vz+=(az*speed-this.vz)*smooth;
   let nx=c.x+this.vx*dt,nz=c.z+this.vz*dt;
   if(!this.collide(nx,c.z))c.x=nx;else this.vx=0;
   if(!this.collide(c.x,nz))c.z=nz;else this.vz=0;
   if(ctrl.jump&&c.y<=1.72){this.yVelocity=5.6;ctrl.jump=false}
   this.yVelocity-=18*dt;c.y+=this.yVelocity*dt;if(c.y<1.72){c.y=1.72;this.yVelocity=0}
   c.yaw+=ctrl.lookX*.0021;c.pitch=Math.max(-1.18,Math.min(1.20,c.pitch+ctrl.lookY*.0016));this.speedKmh=0;
  }
  // Traffic: bidirectional route loops, deterministic signal phases, distance-based headway.
  const byRoute=new Map();
  for(let car of this.traffic){if(car.manual||car===this.playerCar)continue;
   if(!byRoute.has(car.route))byRoute.set(car.route,[]);
   byRoute.get(car.route).push(car);
  }
  for(let [route,cars] of byRoute){
   let L=sampleRoute(route,0).routeDistance,loop=2*L+2*Math.PI*(route.width*.25+.7);
   cars.sort((a,b)=>a.dist-b.dist);
   for(let i=0;i<cars.length;i++){
    let car=cars[i],front=cars[(i+1)%cars.length];
    let p=this.trafficPosition(car),playerD=Math.hypot(p.x-c.x,p.z-c.z);
    let target=car.targetSpeed, gap=(front.dist-car.dist+loop)%loop;
    if(gap<38)target=Math.min(target,front.speed*Math.max(0,(gap-5)/32));
    if(playerD<4.4&&this.inCar<0)target=0;
    // Controlled intersections: cars brake approaching real route crossings.
    let signals=route.signals||[];
    if(signals.length&&playerD<440){
     for(let signal of signals){
      let forwardDist=(signal.carDist-car.dist+loop)%loop;
      let phase=(this.time+signal.phase)%27;
      if(phase<10&&forwardDist>0&&forwardDist<34)target=Math.min(target,Math.max(0,(forwardDist-4.7)*.52));
     }
    }
    let slowing=target<car.speed;
    car.speed+=(target-car.speed)*Math.min(1,dt*(slowing?2.8:.60));
    car.speed=Math.max(0,car.speed);
    car.dist=(car.dist+car.speed*dt)%loop;
   }
  }
  // People wander between corners, pause for traffic and avoid the player.
  let pedestrians=[];
  for(let p of this.people){if(Math.hypot(p.x-c.x,p.z-c.z)>240)continue;
   let dd=Math.hypot(p.tx-p.x,p.tz-p.z);if(dd<1.2||hash(p.seed+Math.floor(this.time/21))>.998){p.tx=p.vertical?p.anchorX:p.anchorX+(hash(p.seed+Math.floor(this.time)*3)-.5)*28;p.tz=p.vertical?p.anchorZ+(hash(p.seed+Math.floor(this.time)*7)-.5)*28:p.anchorZ;dd=Math.hypot(p.tx-p.x,p.tz-p.z)}
   let dx=(p.tx-p.x)/Math.max(dd,.01),dz=(p.tz-p.z)/Math.max(dd,.01);let pd=Math.hypot(p.x-c.x,p.z-c.z);
   if(pd<2.5){dx=(p.x-c.x)/pd;dz=(p.z-c.z)/pd}
   p.yaw=Math.atan2(dx,dz);let rate=p.speed*dt;
   let xx=p.x+dx*rate,zz=p.z+dz*rate;if(!this.collide(xx,zz,.28)&&land(xx,zz)){p.x=xx;p.z=zz}
   if(pd<185)pedestrians.push([p.x,.03+Math.sin(this.time*p.speed*8+p.phase)*.045,p.z,1,p.yaw,hash(p.seed*3)*.3+.6,hash(p.seed+97)*.4+.55,hash(p.seed*2+20)*.3+.68]);
  }
  this.npcNear=pedestrians.length;
  this.engine.updateInstances(this.personDraw,pedestrians.length?pedestrians:[[0,-999,0,1,0,1,1,1]]);
  let cars=[],modelCars={};for(let i=0;i<this.traffic.length;i++){
   let car=this.traffic[i],p=i===this.inCar?{x:car.driveX,z:car.driveZ,yaw:car.driveYaw}:this.trafficPosition(car);if(p.x===undefined)continue;
   if(Math.hypot(p.x-c.x,p.z-c.z)>330||i===this.inCar)continue;
   let color=car.color,inst=[p.x,.1,p.z,.94,p.yaw,...color];
   if(car.model&&this.models[car.model]&&Math.hypot(p.x-c.x,p.z-c.z)<170){(modelCars[car.model]??=[]).push([p.x,.07,p.z,1.0,p.yaw,1,1,1])}else cars.push(inst);
  }
  this.trafficNear=cars.length+Object.values(modelCars).reduce((s,x)=>s+x.length,0);
  this.engine.updateInstances(this.carDraw,cars.length?cars:[[0,-999,0,1,0,1,1,1]]);
  // Road scene is regenerated only when entering new streaming cell.
  if(buildCity(this.engine,c.x,c.z,this.models,this.chunks))this._refreshModelInstances();
  this._refreshLiveModels(modelCars);
 }
 _refreshModelInstances(){this.modelDraws=this.chunks.modelDraws;}
 _refreshLiveModels(modelCars){for(let [name,model] of Object.entries(this.models)){
  if(MODEL_CATALOG[name]?.category!=='vehicle')continue;
  if(!model.dynamicDraws){model.dynamicDraws=model.parts.map(part=>this.engine.makeDraw(part.mesh,part.tex,[[0,-999,0,1,0,1,1,1]],true))}
  let inst=modelCars[name]||[];for(let d of model.dynamicDraws)this.engine.updateInstances(d,inst.length?inst:[[0,-999,0,1,0,1,1,1]])}
 }
 draws(){let out=[...this.chunks.cityDraws,...this.chunks.modelDraws,this.carDraw,this.personDraw];for(let m of Object.values(this.models))if(m.dynamicDraws)out.push(...m.dynamicDraws);return out}
}

'use strict';
let quality='BALANCED',gpu,sim,originalModels={},simReady=false,loading=false,started=false,paused=true,viewMode='WALK';
const $=s=>document.getElementById(s);
const control={moveX:0,moveY:0,lookX:0,lookY:0,run:false,jump:false};
const keys=new Set();let joystickTouch=null,lookTouch=null,last=0,frames=0,fpsTime=0,prevNow=0,toastUntil=0;
const ASSETS_TO_LOAD=[
 ['old_building__lowpoly',10],['warehouse_building',10],['abandoned_building',10],
 ['zaz-1102',1.45],['dirty_car',1.55],['street_light_alt',8],['electrical_box',1.8]
];
function progress(n,label){$('progressBar').style.width=Math.max(0,Math.min(100,n))+'%';$('loadingText').textContent=label;}
function message(txt){$('toast').textContent=txt;$('toast').classList.add('show');toastUntil=performance.now()+2800}
function onError(err){console.error(err);$('errorMessage').textContent=err?.message||String(err);$('errorOverlay').classList.add('open');$('landing').classList.remove('open');$('statusInfo').textContent='NOT RUNNING • WEBGPU ERROR'}
function sourceData(){let el=$('sourceGLB'),obj=JSON.parse(el.textContent);Object.assign(GLB_SOURCE,obj);el.textContent='';const status=document.getElementById('assetStatus');if(status)status.textContent=Object.keys(obj).length+' / 67 ORIGINAL GLBs EMBEDDED · ADD MORE FROM DOWNLOADS';}
async function loadTex(){let el=$('sourceTextures'),obj=JSON.parse(el.textContent),items=Object.entries(obj);el.textContent='';for(let [key,b64] of items){await gpu.textureImage(key,decode64(b64),'image/png')}}
async function getModel(name,h,raw=null){if(originalModels[name])return originalModels[name];let bytes=raw||(RAW_ASSET_FILES.has(name)?new Uint8Array(await RAW_ASSET_FILES.get(name).arrayBuffer()):null);let model=await loadOriginalModel(gpu,name,h,bytes);originalModels[name]=model;delete GLB_SOURCE[name];if(sim)sim.chunks.chunkKey='';return model} 
async function boot(){if(loading)return;loading=true;$('start').disabled=true;$('start').textContent='INITIALISING WEBGPU...';$('capabilities').textContent='Requesting native WebGPU adapter…';
 try{
  progress(5,'Checking WebGPU support and secure context…');gpu=new CasaGPU($('game'));await gpu.init();
  progress(19,'Building original high-resolution textures…');await loadTex();
  progress(29,'Preparing unified city, traffic and pedestrians…');sim=new Simulation(gpu,originalModels);sim.setup();sim.update(.017,control);
  $('start').textContent='ENTER CASANOVA';$('start').disabled=false;$('capabilities').textContent='Native WebGPU ready. Original uploaded GLBs keep their native vertices and textures. Add your other originals with the ASSETS button. Performance depends on your device.';
  progress(43,'WebGPU ready • loading original 3D assets…');
  let loaded=0;let ok=0;for(const [name,h] of ASSETS_TO_LOAD){try{await getModel(name,h);ok++;}catch(e){console.warn('Failed original GLB',name,e);}loaded++;progress(43+loaded/ASSETS_TO_LOAD.length*56,`Imported ${ok}/${loaded} original 3D assets • ${name}`);await new Promise(r=>setTimeout(r,0))}
  progress(100,`Ready — ${ok} original user-uploaded GLBs and one connected 3D city`);
 }catch(err){onError(err)}
}
function start(){if(!gpu||!sim)return;started=true;paused=false;$('landing').classList.remove('open');$('statusInfo').textContent='WEBGPU • ONE CONTINUOUS CITY';message('WELCOME TO DERB SULTANA · 2006');if(!prevNow)requestAnimationFrame(loop)}
function loop(now){if(!started)return;let dt=prevNow?Math.min(.045,(now-prevNow)*.001):.017;prevNow=now;fpsTime+=dt;frames++;
 try{
  let dx=0,dy=0;
  if(keys.has('KeyW')||keys.has('ArrowUp'))dy=-1;
  if(keys.has('KeyS')||keys.has('ArrowDown'))dy+=1;
  if(keys.has('KeyA')||keys.has('ArrowLeft'))dx=-1;
  if(keys.has('KeyD')||keys.has('ArrowRight'))dx+=1;
  if(dx||dy){control.moveX=dx;control.moveY=dy}else if(joystickTouch===null){control.moveX=0;control.moveY=0}
  control.run=control.run||keys.has('ShiftLeft')||keys.has('ShiftRight');
  if(!paused)sim.update(dt,control);
  gpu.render(sim.draws(),sim.camera,sim.time);
  if(now-lastLoadCheck>1700){lastLoadCheck=now;void streamNearbyAssets();}
  control.lookX=0;control.lookY=0;
  if(fpsTime>.5){$('fps').textContent=`${Math.round(frames/fpsTime)} FPS · ${sim.trafficNear} CARS · ${sim.npcNear} PEOPLE`;frames=0;fpsTime=0;
   let district=closestDistrict(sim.camera.x,sim.camera.z);$('zoneLabel').textContent=district.name;$('subtitle').textContent=district.tag;
   $('statusInfo').textContent=`WEBGPU • ${sim.chunks.buildingCount||0} NEARBY BUILDINGS • ${sim.traffic.length} ROUTE CARS`;let isDrive=sim.inCar>=0;$('speedBox').style.display=isDrive?'block':'none';$('speedValue').textContent=Math.round(sim.speedKmh);
   $('driveBtn').textContent=isDrive?'EXIT':sim.getNearCar()>=0?'DRIVE':'FIND CAR';
  }
  if(now>toastUntil)$('toast').classList.remove('show');
 }catch(err){paused=true;onError(err);return}
 requestAnimationFrame(loop)
}
function openMap(){if(!sim)return;paused=true;$('mapOverlay').classList.add('open');positionPins()}
function closeMap(){paused=false;$('mapOverlay').classList.remove('open')}
function positionPins(){let im=$('mapImage'),container=$('mapWrap'),pins=$('pins');pins.innerHTML='';let ir=im.getBoundingClientRect(),cr=container.getBoundingClientRect();for(let [i,d] of DISTRICTS.entries()){let b=document.createElement('button');b.type='button';b.style.left=((ir.left-cr.left+d.px/1536*ir.width)/cr.width*100)+'%';b.style.top=((ir.top-cr.top+d.py/1024*ir.height)/cr.height*100)+'%';b.title='Travel to '+d.name;b.onclick=()=>{sim.teleport(i);closeMap();message('ARRIVED IN '+d.name.toUpperCase())};pins.appendChild(b)}}
function pointerLook(event){if(lookTouch===null)return;control.lookX+=event.movementX||0;control.lookY-=event.movementY||0}

// Phone-safe file picker. Select your original GLBs or a ZIP_STORED asset pack; no remote hosting needed.
const ARCHIVE_FILES=new Map();let streamingNow=false,lastLoadCheck=0;
function readName(fileName){for(const [key,sp] of Object.entries(MODEL_CATALOG))if(sp.file===fileName||('original_glbs/'+sp.file)===fileName)return key;return null;}
async function mountAssetZip(file){
 const last=Math.max(0,file.size-66000),tail=new DataView(await file.slice(last).arrayBuffer());let at=-1;
 for(let j=tail.byteLength-22;j>=0;j--)if(tail.getUint32(j,true)===0x06054b50){at=j;break}
 if(at<0)throw Error('ZIP central directory not found.');
 const cdSize=tail.getUint32(at+12,true),cdAt=tail.getUint32(at+16,true);
 const cd=new DataView(await file.slice(cdAt,cdAt+cdSize).arrayBuffer());let pos=0,n=0;
 while(pos+46<=cd.byteLength&&cd.getUint32(pos,true)===0x02014b50){
  let method=cd.getUint16(pos+10,true),comp=cd.getUint32(pos+20,true),orig=cd.getUint32(pos+24,true),namelen=cd.getUint16(pos+28,true),extra=cd.getUint16(pos+30,true),comment=cd.getUint16(pos+32,true),offset=cd.getUint32(pos+42,true);
  let path=new TextDecoder().decode(new Uint8Array(cd.buffer,cd.byteOffset+pos+46,namelen));
  let key=readName(path.substring(path.lastIndexOf('/')+1));
  if(key&&method===0){ARCHIVE_FILES.set(key,{file,offset,length:comp,original:orig});n++}
  pos+=46+namelen+extra+comment;
 }
 return n;
}
async function readOriginalBytes(key){
 if(RAW_ASSET_FILES.has(key))return new Uint8Array(await RAW_ASSET_FILES.get(key).arrayBuffer());
 const ent=ARCHIVE_FILES.get(key);if(ent){let fd=new DataView(await ent.file.slice(ent.offset,ent.offset+30).arrayBuffer());if(fd.getUint32(0,true)!==0x04034b50)throw Error('Invalid original archive entry');let hlen=30+fd.getUint16(26,true)+fd.getUint16(28,true);return new Uint8Array(await ent.file.slice(ent.offset+hlen,ent.offset+hlen+ent.length).arrayBuffer())}
 return null;
}
async function mountFiles(files){let added=0;for(let file of files){let suffix=file.name.toLowerCase();if(suffix.endsWith('.zip')){try{added+=await mountAssetZip(file)}catch(e){console.error(e);message('ZIP ERROR: '+e.message)}}else if(suffix.endsWith('.glb')){let key=readName(file.name);if(key){RAW_ASSET_FILES.set(key,file);added++}}}
 mountedFiles=[...new Set([...RAW_ASSET_FILES.keys(),...ARCHIVE_FILES.keys()])].length;
 const status=document.getElementById('assetStatus');if(status)status.textContent=mountedFiles+' / 67 ORIGINAL GLBs AVAILABLE ON THIS DEVICE';
 message('REGISTERED '+added+' ORIGINAL MODELS • SELECTED FILES STAY UNMODIFIED');
 renderCatalog();if(sim)sim.chunks.chunkKey='';void streamNearbyAssets();
}
async function streamNearbyAssets(forceName=null){
 if(streamingNow||!gpu||!sim)return;streamingNow=true;
 try{
  let p=sim.camera, candidates=forceName?[forceName]:nearbySiteKeys(p.x,p.z,470);
  const fleet=fleetForKind(zoneAt(p.x,p.z));candidates.push(...fleet);
  for(const name of [...new Set(candidates)]){
   let sp=MODEL_CATALOG[name];if(!sp||originalModels[name]||(!sp.auto&&!forceName)||!((RAW_ASSET_FILES.has(name)||ARCHIVE_FILES.has(name)||GLB_SOURCE[name])))continue;
   let ext=Object.keys(originalModels).filter(k=>MODEL_CATALOG[k]?.external);
   // Avoid loading megamodels without an explicit user action. Never reduce their original quality.
   if(sp.veryHeavy&&!forceName)continue;
   if(!forceName&&sp.triangles>500000)continue;
   let bytes=await readOriginalBytes(name);if(!bytes&&!GLB_SOURCE[name])continue;
   await getModel(name,sp.length,bytes);
   MODEL_CATALOG[name].external=true;
   message('IMPORTED ORIGINAL • '+sp.file);
   renderCatalog();
   break; // one GLB per iteration so the GPU has time to render between imports
  }
 }catch(e){console.error('Asset stream failure:',e);message('ASSET ERROR: '+e.message.slice(0,90))}finally{streamingNow=false;}
}
async function manuallyLoad(name){let sp=MODEL_CATALOG[name];if(!sp)return;
 if(!RAW_ASSET_FILES.has(name)&&!ARCHIVE_FILES.has(name)&&!GLB_SOURCE[name]){message('SELECT THIS ORIGINAL GLB WITH THE FILE PICKER FIRST');return;}
 if(sp.veryHeavy&& !confirm(sp.file+' is '+(sp.bytes/1048576).toFixed(0)+' MB and '+(sp.triangles/1e6).toFixed(1)+' million triangles. It may crash this phone. Load full original anyway?'))return;
 await streamNearbyAssets(name);const site=[...WORLD_SITES,...VEHICLE_SITES,...DECOR_SITES].find(x=>x.key===name);
 if(sim){sim.chunks.previewKey=site?null:name;let a=site||{x:DISTRICTS[14].x+54,z:DISTRICTS[14].z+115};
 sim.camera.x=a.x+10;sim.camera.z=a.z+11;sim.camera.y=1.72;sim.camera.yaw=-.3;sim.chunks.chunkKey='';}
 document.getElementById('assetOverlay').classList.remove('open');paused=false;
}
function renderCatalog(){let box=document.getElementById('assetList');if(!box)return;let filter=document.getElementById('assetFilter')?.value||'all';box.innerHTML='';for(const [key,sp] of Object.entries(MODEL_CATALOG)){
  if(filter!=='all'&&sp.category!==filter)continue;
  let ok=!!(RAW_ASSET_FILES.has(key)||ARCHIVE_FILES.has(key)||GLB_SOURCE[key]||originalModels[key]),loaded=!!originalModels[key];
  let row=document.createElement('div');row.className='assetRow';let text=document.createElement('span');text.textContent=(loaded?'● ':ok?'◉ ':'○ ')+sp.file+' · '+(sp.bytes/1048576).toFixed(1)+' MB'+(sp.era==='post2007'?' · POST-2007':'');row.appendChild(text);
  let b=document.createElement('button');b.textContent=loaded?'GO TO':'LOAD';b.disabled=!ok;b.onclick=()=>manuallyLoad(key);row.appendChild(b);box.appendChild(row);
 }
}
function setupAssetControls(){let picker=document.getElementById('assetPicker');if(!picker)return;
 picker.onchange=async e=>{await mountFiles(Array.from(e.target.files||[]));picker.value='';};
 document.getElementById('assetsBtn').onclick=()=>{paused=true;renderCatalog();document.getElementById('assetOverlay').classList.add('open')};
 document.getElementById('assetClose').onclick=()=>{document.getElementById('assetOverlay').classList.remove('open');paused=false};
 document.getElementById('assetFilter').onchange=renderCatalog;
 document.getElementById('selectOriginals').onclick=()=>picker.click();
}

function initControls(){const joy=$('joystick'),stick=$('stick'),look=$('lookZone');
 joy.addEventListener('pointerdown',e=>{e.preventDefault();joystickTouch=e.pointerId;joy.setPointerCapture(e.pointerId);updateJoy(e)});
 joy.addEventListener('pointermove',e=>{if(joystickTouch===e.pointerId)updateJoy(e)});
 const endJoy=e=>{if(joystickTouch!==e.pointerId)return;joystickTouch=null;control.moveX=0;control.moveY=0;stick.style.transform='translate(0px,0px)'};
 joy.addEventListener('pointerup',endJoy);joy.addEventListener('pointercancel',endJoy);
 function updateJoy(e){let r=joy.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.max(1,Math.hypot(dx,dy)),dist=Math.min(42,len),x=dx/len*dist,y=dy/len*dist;control.moveX=x/42;control.moveY=y/42;stick.style.transform=`translate(${x}px,${y}px)`}
 let lastX=0,lastY=0;
 look.addEventListener('pointerdown',e=>{lookTouch=e.pointerId;lastX=e.clientX;lastY=e.clientY;look.setPointerCapture(e.pointerId)});
 look.addEventListener('pointermove',e=>{if(lookTouch!==e.pointerId)return;control.lookX+=(e.clientX-lastX)*1.1;control.lookY+=(lastY-e.clientY)*1.1;lastX=e.clientX;lastY=e.clientY});
 const endLook=e=>{if(lookTouch===e.pointerId)lookTouch=null};look.addEventListener('pointercancel',endLook);look.addEventListener('pointerup',endLook);
 $('jumpBtn').addEventListener('pointerdown',e=>{control.jump=true;e.preventDefault()});
 $('runBtn').addEventListener('pointerdown',e=>{control.run=true;e.preventDefault()});
 window.addEventListener('pointerup',()=>{control.run=false});
 $('driveBtn').onclick=()=>{let driving=sim.toggleDrive();message(driving?'VEHICLE ENGINE ON':'LEFT VEHICLE')};
 $('mapBtn').onclick=openMap;$('mapClose').onclick=closeMap;$('qualityBtn').onclick=()=>{quality=quality==='BALANCED'?'HIGH':quality==='HIGH'?'ECO':'BALANCED';$('qualityBtn').textContent=quality==='BALANCED'?'BALANCED':quality==='ECO'?'ECO':'HD';if(sim)sim.chunks.chunkKey='';gpu?.resize();message('GRAPHICS: '+quality)};
 $('start').onclick=start;$('errorClose').onclick=()=>{$('errorOverlay').classList.remove('open');$('landing').classList.add('open')};
 window.addEventListener('keydown',e=>{keys.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Space')control.jump=true;if(e.code==='KeyM'){e.preventDefault();$('mapOverlay').classList.contains('open')?closeMap():openMap()};if(e.code==='KeyE'&&sim)sim.toggleDrive();if(e.code==='Escape'&&$('mapOverlay').classList.contains('open'))closeMap()});
 window.addEventListener('keyup',e=>keys.delete(e.code));
 window.addEventListener('resize',()=>{if($('mapOverlay').classList.contains('open'))positionPins()});
}
initControls();setupAssetControls();sourceData();boot();