export const vertexShader = /* glsl */`
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}
`;
export const fragmentShader = /* glsl */`
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uScale;
uniform vec2 uCenters[4];
uniform float uEnergy[4];
uniform float uVisibility[4];
uniform float uPulse[4];
varying vec2 vUv;
#define PI 3.14159265359
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float a=.5,v=0.;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(13.1,4.7);a*=.5;}return v;}
float capsule(vec2 p){p.y-=clamp(p.y,-40.,40.);return length(p)-64.;}
vec3 tint(int id){if(id==0)return vec3(1.,.075,.008);if(id==1)return vec3(1.,.59,.035);if(id==2)return vec3(.015,.8,.48);return vec3(1.,.035,.37);}
vec3 petals(vec2 p,float t){
 vec3 c=vec3(0.);
 for(int j=0;j<9;j++){
  float i=float(j);float a=(i-4.)*.31;
  float flutter=sin(t*1.1+i*1.7)*.025;
  a+=flutter;
  vec2 dir=vec2(sin(a),cos(a));vec2 side=vec2(dir.y,-dir.x);
  vec2 q=p-vec2(0.,-87.);
  float len=218.-abs(i-4.)*6.;
  float along=dot(q,dir)/len;
  float across=dot(q,side)+sin(clamp(along,0.,1.)*PI)*sin(t*.8+i)*5.;
  float w=pow(max(sin(clamp(along,0.,1.)*PI),0.),.58)*(25.+abs(i-4.)*2.);
  float d=abs(across)-w;
  float mask=smoothstep(1.,-1.,d)*step(0.,along)*step(along,1.);
  float rib=exp(-abs(across)*.12)*.22;
  float edge=exp(-abs(d)*.55)*step(0.,along)*step(along,1.);
  float bands=pow(.5+.5*sin(along*17.+across*.16-t*.5+i),3.)*.08;
  vec3 body=mix(vec3(.32,.004,.12),vec3(1.,.18,.5),clamp(abs(across)/max(w,1.),0.,1.));
  body+=vec3(1.,.43,.64)*(rib+bands);
  c=mix(c,body,mask*.84);
  c+=edge*vec3(1.,.69,.81)*.95;
  c+=exp(-abs(d)*.13)*vec3(.55,.04,.2)*.18*step(0.,along)*step(along,1.);
 }
 // The two low petals spread out across the base of the flower.
 for(int j=0;j<2;j++){
  float side=float(j)*2.-1.;vec2 q=p-vec2(side*66.,-78.);
  q=mat2(.94,side*.34,-side*.34,.94)*q;
  float r=length(q/vec2(88.,27.));
  float m=smoothstep(1.02,.96,r);
  c=mix(c,vec3(.6,.035,.25)+vec3(.55,.3,.38)*pow(clamp(r,0.,1.),3.),m*.8);
  c+=exp(-abs(r-1.)*60.)*vec3(1.,.68,.82)*.85;
 }
 return c;
}
vec3 effects(vec2 p,int id,float energy,float pulse){
 vec3 color=vec3(0.);float t=uTime;float d=capsule(p);
 if(id==0){
  float y=(p.y-77.)/82.;
  if(y>-.1&&y<1.5&&abs(p.x)<110.){
   float n=fbm(vec2(p.x*.045,p.y*.035-t*2.9));
   float f=0.;
   for(int j=0;j<7;j++){
    float i=float(j);float h=.58+.36*sin(i*3.7+t*1.7)+.17*sin(t*4.+i);
    float rise=clamp(y/h,0.,1.5);
    float center=(i-3.)*17.+sin(y*8.-t*3.+i*2.)*y*13.;
    float width=(1.-smoothstep(-.15,h,y))*(18.+10.*sin(i+2.));
    f=max(f,(1.-abs(p.x-center)/(width+1.)) * smoothstep(h+.12,h-.12,y));
   }
   f=clamp(f*1.5-n*.45,0.,1.)*smoothstep(-.12,.18,y);
   color+=vec3(1.,.04,.002)*smoothstep(.02,.3,f)*.85;
   color+=vec3(1.,.34,.018)*smoothstep(.24,.65,f)*1.1;
   color+=vec3(1.,.85,.5)*smoothstep(.5,.92,f)*1.4;
   color+=vec3(.8,.06,.001)*exp(-abs(p.x)*.018)*exp(-pow((y-.2)*2.,2.))*.15;
  }
  color+=vec3(1.,.12,.025)*exp(-abs(d)*.14)*.6;
 }else if(id==1){
  float a=atan(p.y*.72,p.x);
  float rays=pow(max(0.,sin(a*47.+sin(a*13.)*1.8+t*.16)),8.);
  rays+=pow(max(0.,sin(a*83.-t*.09)),28.)*.5;
  float modulation=.6+.4*sin(a*17.+t*.6)*sin(a*9.-t*.5);
  float reach=27.+49.*modulation;
  float corona=exp(-max(d,0.)/reach)*smoothstep(220.,15.,d);
  color+=vec3(1.,.67,.075)*rays*corona*.85*smoothstep(-1.,6.,d);
  color+=vec3(1.,.66,.07)*exp(-abs(d)*.065)*.85;
  color+=vec3(1.,.93,.64)*exp(-abs(d)*.7)*1.9;
 }else if(id==2){
  for(int j=0;j<9;j++){
   float i=float(j);float a=atan(p.y/1.4,p.x);
   vec2 q=p;
   q.x+=sin(p.y*.025+t*1.5+i*.7)*4.;
   float r=length(q/vec2(72.+i*4.5,114.+i*3.8));
   float wave=sin(a*(3.+mod(i,3.))+t*(1.5+i*.09)+i*2.4);
   float line=exp(-abs(r-1.-sin(a*5.-t*2.+i)*.018)*160.);
   float streak=smoothstep(-.2,.8,wave);
   color+=vec3(.15,1.,.73)*line*streak*(.65-i*.04);
   color+=vec3(.015,.28,.2)*exp(-abs(r-1.)*28.)*.15;
  }
  color+=vec3(.04,.93,.66)*exp(-abs(d)*.13)*.5;
 }else{
  color+=petals(p,t);
  color+=vec3(1.,.12,.5)*exp(-abs(d)*.1)*.35;
 }
 color+=tint(id)*pulse*exp(-pow((length(p)-(1.-pulse)*180.)/12.,2.))*.08;
 return color*energy*smoothstep(-240.,-165.,p.y);
}
vec3 element(vec2 p,int id,float energy,float pulse){
 float d=capsule(p);float inside=smoothstep(1.,-.7,d);
 vec3 color=tint(id)*exp(-dot(p/vec2(170.,180.),p/vec2(170.,180.)))*.065*energy;
 color+=effects(p,id,energy,pulse);
 float lower=1.-smoothstep(-100.,45.,p.y);
 vec3 surface=vec3(.0015,.002,.002)+tint(id)*lower*.038;
 surface+=vec3(.012)*exp(-length(p-vec2(-30.,87.))*.025);
 vec3 litSurface;
 if(id==0){litSurface=mix(vec3(.39,.006,.13),vec3(.77,.2,.16),smoothstep(-80.,110.,p.y));litSurface+=vec3(.02,.23,.2)*exp(-length(p-vec2(28.,76.))*.017);}
 else if(id==1){litSurface=mix(vec3(.82,.29,.13),vec3(.59,.79,.35),smoothstep(-70.,90.,p.y*.6+p.x*.65));litSurface+=vec3(.23,.16,.09)*exp(-length(p-vec2(-35.,35.))*.014);}
 else if(id==2){litSurface=mix(vec3(.015,.48,.19),vec3(.27,.66,.65),smoothstep(-85.,110.,p.y));litSurface+=vec3(.18,.09,.12)*exp(-length(p-vec2(30.,35.))*.02);}
 else{litSurface=mix(vec3(.38,.006,.12),vec3(.66,.12,.42),smoothstep(-85.,100.,p.y));litSurface+=vec3(.24,.24,.09)*exp(-length(p-vec2(36.,60.))*.02);}
 litSurface+=vec3(.1)*pow(clamp(p.y/208.+.5,0.,1.),2.);
 surface=mix(surface,litSurface,energy*.91);
 color=mix(color,surface,inside);
 float edge=exp(-abs(d)*1.15);
 float light=clamp(.38+p.y*.004-p.x*.002,0.,1.);
 color+=edge*mix(vec3(.09)*light,vec3(1.,.79,.68)*(.35+.65*light),energy);
 color+=vec3(1.,.73,.55)*exp(-abs(d)*.26)*energy*.18;
 return color;
}
void main(){
 vec2 screen=(vUv-.5)*uResolution/uScale;
 float grain=hash(gl_FragCoord.xy+mod(uTime,100.))-.5;
 vec3 color=vec3(.006,.006,.006)+grain*.005;
 float vignette=1.-smoothstep(200.,750.,length(screen));color*=.5+.5*vignette;
 for(int i=0;i<4;i++){
  float vis=uVisibility[i];if(vis<.001)continue;
  vec2 p=screen-uCenters[i];float e=uEnergy[i];
  if(abs(p.x)<290.&&p.y>-285.&&p.y<295.)color+=element(p,i,e,uPulse[i])*vis;
  color+=tint(i)*exp(-dot(p/vec2(180.,190.),p/vec2(180.,190.)))*.07*e*vis;
  float floorY=-185.;
  color+=tint(i)*exp(-pow(p.x/102.,2.)-pow((p.y-floorY)/5.,2.))*.14*e*vis;
  if(p.y<-196.&&p.y>-395.&&abs(p.x)<185.){
   vec2 rp=vec2(p.x,(p.y+202.)/-0.55-112.);
   rp.x+=sin(p.y*.07+uTime*.5)*1.4;
   float fade=exp(-(-p.y-196.)*.02)*.14;
   vec3 reflection=(element(rp+vec2(-4.,2.),i,e,0.)+element(rp,i,e,0.)+element(rp+vec2(4.,-2.),i,e,0.))/3.;
   color+=reflection*fade*vis*smoothstep(-196.,-211.,p.y);
  }
 }
 color=max(color,vec3(0.));
 gl_FragColor=vec4(color,1.);
}
`;
export const particleVertex = /* glsl */`
attribute vec4 aSeed;
uniform vec2 uResolution;
uniform float uScale;
uniform float uTime;
uniform vec2 uCenters[4];
uniform float uEnergy[4];
uniform float uVisibility[4];
uniform float uDpr;
varying vec3 vColor;
varying float vAlpha;
void main(){
 int id=int(aSeed.w);float t=uTime;float life=fract(aSeed.x+t*(.15+aSeed.y*.2));
 vec2 p;float alpha=sin(life*3.14159);float size=1.5;
 if(id==0){
  p=vec2((aSeed.y-.5)*(125.+life*80.)+sin(t*1.4+aSeed.z*40.+life*4.)*15.,80.+life*145.);
  vColor=vec3(1.,.22+aSeed.y*.4,.03);size=1.+aSeed.z*2.8;alpha*=1.-life;
 }else if(id==1){
  float a=aSeed.x*6.283+t*.12;float r=1.+aSeed.y*.9;
  p=vec2(cos(a)*70.,sin(a)*110.)*r;
  vColor=vec3(1.,.7,.12);size=1.2+aSeed.z*2.;alpha*=.6;
 }else if(id==2){
  float a=aSeed.x*6.283+t*(.25+aSeed.y*.3);float r=1.05+aSeed.y*.45;
  p=vec2(cos(a)*80.,sin(a)*120.)*r;
  vColor=vec3(.12,1.,.72);size=1.+aSeed.z*1.4;alpha*=.45;
 }else{
  float a=aSeed.x*6.283+t*.1;float r=60.+aSeed.y*98.;
  p=vec2(cos(a)*r,sin(a)*r*.8+32.+life*48.);
  vColor=vec3(1.,.32,.67);size=1.+aSeed.z*2.;alpha*=.6;
 }
 p+=uCenters[id];
 gl_Position=vec4(p*uScale/uResolution*2.,0.,1.);
 gl_PointSize=size*uScale*uDpr;
 vAlpha=alpha*uEnergy[id]*uVisibility[id];
}
`;
export const particleFragment = /* glsl */`
precision highp float;
varying vec3 vColor;
varying float vAlpha;
void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(vColor,exp(-d*d*4.)*vAlpha*smoothstep(1.,.6,d));}
`;
