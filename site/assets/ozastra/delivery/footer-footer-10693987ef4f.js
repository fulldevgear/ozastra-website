var N=Object.defineProperty;var G=(t,e)=>()=>(t&&(e=t(t=0)),e);var V=(t,e)=>{for(var d in e)N(t,d,{get:e[d],enumerable:!0})};var D={};V(D,{createChromiumRenderer:()=>H});function H(t){let e=t.getContext("webgl2",{alpha:!1,antialias:!0,powerPreference:"default"});if(!e)throw new Error("WebGL 2 unavailable");let d=[],M=[],T=[],z=`
uniform float time;
uniform float portrait;
vec3 surfaceAt(vec2 p) {
 // Smaller folds and a little more relief remain legible in a narrow frame.
 vec2 frequency=mix(vec2(1.),vec2(1.3,1.12),portrait);
 float amplitude=mix(1.,1.22,portrait);
 p*=frequency;
 float a=p.x*.77+p.y*.38-time*.29;
 float b=p.x*.35-p.y*.65+time*.21;
 float q=p.y*.47+time*.17;
 float c=p.x*1.6+p.y*.43+sin(q)*.7;
 float h=sin(a)*.18+sin(b)*.11+sin(c)*.12;
 vec2 gradient=cos(a)*vec2(.1386,.0684)+cos(b)*vec2(.0385,-.0715)+cos(c)*vec2(.192,.12*(.43+.329*cos(q)));
 return vec3(h*amplitude,gradient*frequency*amplitude);
}`,g=`#version 300 es
precision highp float;
in vec2 position;
uniform float aspect;
out vec3 worldPosition;
${z}
void main(){
 float z=5.2-(exp(position.y*4.1)-1.);
 float x=position.x*(8.+(5.2-z)*.7);
 vec3 field=surfaceAt(vec2(x,z));
 worldPosition=vec3(x,field.x,z);
 vec3 forward=normalize(vec3(0.,-2.65,-10.7));
 vec3 up=vec3(0.,-forward.z,forward.y);
 vec3 relative=worldPosition-vec3(0.,2.65,6.);
 float depth=dot(relative,forward);
 float focal=mix(3.1,2.65,portrait);
 gl_Position=vec4(focal*relative.x/aspect,focal*dot(relative,up),1.0008*depth-.10004,depth);
}`,E=`
uniform float recession;
vec3 space(vec3 ray){
 float haze=exp(-pow((ray.y+.045)*9.,2.));
 return vec3(.0003,.0007,.002)+vec3(.004,.010,.019)*haze;
}
vec3 tone(vec3 c){return pow(vec3(1.)-exp(-max(c,vec3(0.))*1.65),vec3(.454545));}
vec3 displayColor(vec3 linearColor){
 vec3 encoded=tone(linearColor);
 // The previous CSS veil was composited AFTER 8-bit quantization and could
 // reintroduce bands. Apply the identical veil in floating point, before dither.
 float veil=.86*(1.-smoothstep(.08,.44,gl_FragCoord.y/resolution.y));
 encoded=mix(encoded,vec3(2.,5.,10.)/255.,veil);
 // Scroll reduces the light in floating point before the final dither.
 // A little more reflection survives at the edges; the reading area stays calm.
 float edge=smoothstep(.08,.48,abs(gl_FragCoord.x/resolution.x-.5));
 vec3 quiet=vec3(.025,.039,.06)+encoded*(.025+.11*edge);
 encoded=mix(encoded,quiet,recession);
 // Stationary, high-frequency interleaved-gradient dither: one 8-bit code
 // value peak-to-peak. No time-varying grain or visible surface texture.
 float noise=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
 return clamp(encoded+(noise-.5)/255.,0.,1.);
}
`,L=`#version 300 es
precision highp float;
in vec3 worldPosition;out vec4 color;
uniform vec2 resolution;
${z}
${E}
float filteredGaussian(float value,float width){
 float footprint=fwidth(value);float filtered=sqrt(width*width+footprint*footprint/12.);
 return width/filtered*exp(-value*value/(filtered*filtered));
}
vec3 environment(vec3 r){
 vec3 base=mix(vec3(.002,.004,.009),vec3(.021,.03,.043),pow(max(r.y,0.),.7));
 // Broad moving illumination; energy lives inside the reflections, never as
 // drawn contour lines or emissive rings on the surface.
 float drift=sin(time*.13)*.07;
 float softbox=filteredGaussian(r.x+.36+drift,.115)*smoothstep(-.15,.3,r.y)*(1.-smoothstep(.5,.95,r.y));
 float rim=filteredGaussian(r.x-.53-r.z*.17-drift*.5,.065)*smoothstep(-.05,.3,r.y);
 float glow=filteredGaussian(r.y-.2-sin(time*.16)*.06,.23);
 vec3 tint=vec3(.24,.47,.75);
 base+=vec3(.72,.83,1.)*softbox*2.1+vec3(.85,.93,1.)*rim*3.;
 base+=tint*glow*.09*(.85+.15*sin(time*.22+r.x*2.));
 return base;
}
void main(){
 vec3 view=normalize(vec3(0.,2.65,6.)-worldPosition);
 vec3 field=surfaceAt(worldPosition.xz);
 vec3 n=normalize(vec3(-field.y,1.,-field.z));vec3 reflected=reflect(-view,n);
 float fres=pow(1.-max(dot(view,n),0.),5.);
 vec3 metal=vec3(.68,.72,.78);
 vec3 col=environment(reflected)*metal*(.7+fres*.6)+vec3(.001,.002,.004);
 vec3 halfway=normalize(normalize(vec3(-3.,5.,-2.))+view);
 float variance=max(dot(dFdx(n),dFdx(n)),dot(dFdy(n),dFdy(n)));
 float exponent=110./(1.+110.*variance);
 float spec=pow(max(dot(n,halfway),0.),exponent)*exponent/110.;
 col+=vec3(.7,.84,1.)*spec*.75;
 float distanceToCamera=length(worldPosition-vec3(0.,2.65,6.));
 col=mix(col,space(-view),smoothstep(12.,38.,distanceToCamera));
 color=vec4(displayColor(col),1.);
}`,S=`#version 300 es
in vec2 position;out vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`,x=`#version 300 es
precision highp float;
in vec2 uv;out vec4 color;uniform vec2 resolution;uniform float portrait;
${E}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec2 screen=(gl_FragCoord.xy-resolution*.5)/resolution.y;
 vec3 forward=normalize(vec3(0.,-2.65,-10.7));vec3 up=vec3(0.,-forward.z,forward.y);
 vec3 ray=normalize(forward*mix(1.55,1.325,portrait)+vec3(1.,0.,0.)*screen.x+up*screen.y);
 vec3 c=space(ray);
 vec2 grid=vec2(80.,30.);vec2 cell=floor(uv*grid);vec2 offset=.15+.7*vec2(hash(cell),hash(cell+73.));
 vec2 d=(fract(uv*grid)-offset)*resolution/grid;
 float star=step(.95,hash(cell+30.))*smoothstep(.78,.85,uv.y)*exp(-dot(d,d)/2.2);
 c+=vec3(.3,.5,.9)*star*.3;color=vec4(displayColor(c),1.);
}`;function h(o,i){let r=e.createProgram();T.push(r);for(let[u,c]of[[e.VERTEX_SHADER,o],[e.FRAGMENT_SHADER,i]]){let a=e.createShader(u);if(e.shaderSource(a,c),e.compileShader(a),!e.getShaderParameter(a,e.COMPILE_STATUS))throw Error(e.getShaderInfoLog(a));e.attachShader(r,a),e.deleteShader(a)}if(e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS))throw Error(e.getProgramInfoLog(r));return r}function A(o,i,r){let u=e.createVertexArray();M.push(u),e.bindVertexArray(u);let c=e.createBuffer();d.push(c),e.bindBuffer(e.ARRAY_BUFFER,c),e.bufferData(e.ARRAY_BUFFER,i,e.STATIC_DRAW);let a=e.getAttribLocation(o,"position");if(e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),r){let l=e.createBuffer();d.push(l),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,l),e.bufferData(e.ELEMENT_ARRAY_BUFFER,r,e.STATIC_DRAW)}return u}let y=h(g,L),m=h(S,x),P=new Map;function q(o){if(P.has(o))return P.get(o);let i=o?160:384,r=o?120:288,u=new Float32Array((i+1)*(r+1)*2),c=new Uint32Array(i*r*6);for(let l=0;l<=r;l++)for(let v=0;v<=i;v++){let p=(l*(i+1)+v)*2;u[p]=v/i*2-1,u[p+1]=l/r}for(let l=0,v=0;l<r;l++)for(let p=0;p<i;p++){let R=l*(i+1)+p,B=R+1,k=R+i+1,U=k+1;c.set([R,k,B,B,k,U],v),v+=6}let a={vao:A(y,u,c),count:c.length};return P.set(o,a),a}let w,_=A(m,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1])),f={};for(let o of["aspect","time","resolution","recession","portrait"])f[o]=e.getUniformLocation(y,o);let F=e.getUniformLocation(m,"resolution"),s=e.getUniformLocation(m,"recession"),n=e.getUniformLocation(m,"portrait"),b=0;return t.dataset.msaaSamples=String(e.getParameter(e.SAMPLES)),{resize(o,i,r=Math.min(devicePixelRatio,2)){let u=Math.max(0,Math.min(1,(900-o)/260)),c=Math.max(0,Math.min(1,(1.15-o/i)/.45));b=u*c*c*(3-2*c),t.dataset.framing=b.toFixed(3);let a=o<=991;w=q(a),r=Math.min(r,a?1.25:2);let v=Math.min(1,Math.sqrt((a?75e4:52e5)/(o*i*r*r))),p=Math.max(1,Math.floor(o*r*v)),R=Math.max(1,Math.floor(i*r*v));(t.width!==p||t.height!==R)&&(t.width=p,t.height=R,e.viewport(0,0,t.width,t.height)),t.dataset.quality=a?"mobile":"desktop",t.dataset.triangles=String(w.count/3),t.dataset.resolution=t.width+"\xD7"+t.height},draw(o,i=0){e.disable(e.DEPTH_TEST),e.depthMask(!1),e.useProgram(m),e.bindVertexArray(_),e.uniform2f(F,t.width,t.height),e.uniform1f(s,i),e.uniform1f(n,b),e.drawArrays(e.TRIANGLES,0,6),e.depthMask(!0),e.enable(e.DEPTH_TEST),e.clear(e.DEPTH_BUFFER_BIT),e.useProgram(y),e.bindVertexArray(w.vao),e.uniform1f(f.aspect,t.width/t.height),e.uniform1f(f.time,o),e.uniform1f(f.recession,i),e.uniform1f(f.portrait,b),e.uniform2f(f.resolution,t.width,t.height),e.drawElements(e.TRIANGLES,w.count,e.UNSIGNED_INT,0)},destroy(){d.forEach(o=>e.deleteBuffer(o)),M.forEach(o=>e.deleteVertexArray(o)),T.forEach(o=>e.deleteProgram(o))}}}var I=G(()=>{});var C=document.querySelector(".oz-closing");if(C){let _=function(){cancelAnimationFrame(h),h=0,A=0,y=null},f=function(){if(!g||!S||document.hidden)return;let{width:n,height:b}=t.getBoundingClientRect();n===P&&b===q||(P=n,q=b,g.resize(n,b,Math.min(devicePixelRatio,1.25)),g.draw(m,.12))},F=function(n){if(h=0,!(!S||document.hidden||x||w())){if(m+=A?Math.min((n-A)/1e3,.05)*.65:0,A=n,T.matches&&y!==null&&n-y<1e3/30-1){h=requestAnimationFrame(F);return}y=n,g.draw(m,.12),t.dataset.state="running",t.dataset.time=m.toFixed(3),h=requestAnimationFrame(F)}};W=_,O=f,Y=F;let t=C.querySelector(".oz-footer-material"),e=t.querySelector("canvas"),d=C.querySelector(".oz-footer-motion"),M=matchMedia("(prefers-reduced-motion: reduce)"),T=matchMedia("(max-width: 991px)"),z=navigator.connection,g,E=!1,L=!1,S=!1,x=!1,h=0,A=0,y=null,m=8,P=0,q=0,w=()=>M.matches||z?.saveData||navigator.deviceMemory&&navigator.deviceMemory<=2||L;async function s(){if(_(),d.hidden=!!w(),d.textContent=x?"Resume background animation":"Pause background animation",d.setAttribute("aria-pressed",String(x)),w()){t.dataset.state="still";return}if(!(!S||document.hidden||x)){if(!g){if(E)return;E=!0;try{let{createChromiumRenderer:n}=await Promise.resolve().then(()=>(I(),D));g=n(e),f()}catch(n){L=!0,console.warn("Footer: using the still metal surface.",n)}return E=!1,s()}f(),h=requestAnimationFrame(F)}}d.addEventListener("click",()=>{x=!x,s()}),new IntersectionObserver(([n])=>{S=n.isIntersecting,s()}).observe(C),new ResizeObserver(f).observe(t),M.addEventListener("change",s),T.addEventListener("change",s),z?.addEventListener("change",s),document.addEventListener("visibilitychange",s),addEventListener("pagehide",_),addEventListener("pageshow",s),e.addEventListener("webglcontextlost",n=>{n.preventDefault(),L=!0,s()}),s()}var W,O,Y;
