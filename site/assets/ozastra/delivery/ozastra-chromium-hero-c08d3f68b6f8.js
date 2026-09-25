var X=Object.defineProperty;var j=(t,e)=>()=>(t&&(e=t(t=0)),e);var J=(t,e)=>{for(var l in e)X(t,l,{get:e[l],enumerable:!0})};var Y={};J(Y,{createChromiumRenderer:()=>Q});function Q(t){let e=t.getContext("webgl2",{alpha:!1,antialias:!0,powerPreference:"default"});if(!e)throw new Error("WebGL 2 unavailable");let l=[],g=[],L=[],M=`
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
}`,q=`#version 300 es
precision highp float;
in vec2 position;
uniform float aspect;
out vec3 worldPosition;
${M}
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
}`,m=`
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
`,D=`#version 300 es
precision highp float;
in vec3 worldPosition;out vec4 color;
uniform vec2 resolution;
${M}
${m}
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
}`,B=`#version 300 es
in vec2 position;out vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`,_=`#version 300 es
precision highp float;
in vec2 uv;out vec4 color;uniform vec2 resolution;uniform float portrait;
${m}
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
}`;function x(o,a){let i=e.createProgram();L.push(i);for(let[d,f]of[[e.VERTEX_SHADER,o],[e.FRAGMENT_SHADER,a]]){let s=e.createShader(d);if(e.shaderSource(s,f),e.compileShader(s),!e.getShaderParameter(s,e.COMPILE_STATUS))throw Error(e.getShaderInfoLog(s));e.attachShader(i,s),e.deleteShader(s)}if(e.linkProgram(i),!e.getProgramParameter(i,e.LINK_STATUS))throw Error(e.getProgramInfoLog(i));return i}function P(o,a,i){let d=e.createVertexArray();g.push(d),e.bindVertexArray(d);let f=e.createBuffer();l.push(f),e.bindBuffer(e.ARRAY_BUFFER,f),e.bufferData(e.ARRAY_BUFFER,a,e.STATIC_DRAW);let s=e.getAttribLocation(o,"position");if(e.enableVertexAttribArray(s),e.vertexAttribPointer(s,2,e.FLOAT,!1,0,0),i){let c=e.createBuffer();l.push(c),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,c),e.bufferData(e.ELEMENT_ARRAY_BUFFER,i,e.STATIC_DRAW)}return d}let b=x(q,D),v=x(B,_),C=new Map;function R(o){if(C.has(o))return C.get(o);let a=o?160:384,i=o?120:288,d=new Float32Array((a+1)*(i+1)*2),f=new Uint32Array(a*i*6);for(let c=0;c<=i;c++)for(let h=0;h<=a;h++){let u=(c*(a+1)+h)*2;d[u]=h/a*2-1,d[u+1]=c/i}for(let c=0,h=0;c<i;c++)for(let u=0;u<a;u++){let T=c*(a+1)+u,r=T+1,n=T+a+1,y=n+1;f.set([T,n,r,r,n,y],h),h+=6}let s={vao:P(b,d,f),count:f.length};return C.set(o,s),s}let E,k=P(v,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1])),S={};for(let o of["aspect","time","resolution","recession","portrait"])S[o]=e.getUniformLocation(b,o);let p=e.getUniformLocation(v,"resolution"),w=e.getUniformLocation(v,"recession"),U=e.getUniformLocation(v,"portrait"),F=0;return t.dataset.msaaSamples=String(e.getParameter(e.SAMPLES)),{resize(o,a,i=Math.min(devicePixelRatio,2)){let d=Math.max(0,Math.min(1,(900-o)/260)),f=Math.max(0,Math.min(1,(1.15-o/a)/.45));F=d*f*f*(3-2*f),t.dataset.framing=F.toFixed(3);let s=o<=991;E=R(s),i=Math.min(i,s?1.25:2);let h=Math.min(1,Math.sqrt((s?75e4:52e5)/(o*a*i*i))),u=Math.max(1,Math.floor(o*i*h)),T=Math.max(1,Math.floor(a*i*h));(t.width!==u||t.height!==T)&&(t.width=u,t.height=T,e.viewport(0,0,t.width,t.height)),t.dataset.quality=s?"mobile":"desktop",t.dataset.triangles=String(E.count/3),t.dataset.resolution=t.width+"\xD7"+t.height},draw(o,a=0){e.disable(e.DEPTH_TEST),e.depthMask(!1),e.useProgram(v),e.bindVertexArray(k),e.uniform2f(p,t.width,t.height),e.uniform1f(w,a),e.uniform1f(U,F),e.drawArrays(e.TRIANGLES,0,6),e.depthMask(!0),e.enable(e.DEPTH_TEST),e.clear(e.DEPTH_BUFFER_BIT),e.useProgram(b),e.bindVertexArray(E.vao),e.uniform1f(S.aspect,t.width/t.height),e.uniform1f(S.time,o),e.uniform1f(S.recession,a),e.uniform1f(S.portrait,F),e.uniform2f(S.resolution,t.width,t.height),e.drawElements(e.TRIANGLES,E.count,e.UNSIGNED_INT,0)},destroy(){l.forEach(o=>e.deleteBuffer(o)),g.forEach(o=>e.deleteVertexArray(o)),L.forEach(o=>e.deleteProgram(o))}}}var $=j(()=>{});var K=document.documentElement.dataset.ozastraHero,W=matchMedia("(prefers-reduced-motion: reduce)"),I=matchMedia("(max-width: 991px)"),O=navigator.connection,Z=navigator.deviceMemory&&navigator.deviceMemory<=2,z=document.documentElement.dataset.ozastraTransition==="on",ee=()=>!!document.documentElement.dataset.ozastraSafariViewport,A=z?[...document.querySelectorAll(document.documentElement.dataset.ozastraMission==="on"?"[data-ozastra-stage]":'[data-ozastra-stage]:not([data-ozastra-stage="mission"])')]:[],te=[...document.querySelectorAll(z?'[data-ozastra-chromium="environment"]':'[data-ozastra-chromium="layer"]')];if(K!=="original")for(let t of te)oe(t);function oe(t){let e=t.querySelector("canvas"),l=z&&ee()&&typeof CSS<"u"&&CSS.supports("animation-timeline","scroll(root block)")&&CSS.supports("animation-range","0px 100px");l&&(t.dataset.shading="native");let g,L=!1,M=!1,q=!1,m=0,D=8,B=0,_=null,x=0,P=0,b=0,v=!1,C=0,R=1,E=!1,k=0,S=0,p,w=document.createElement("button");w.className="ozastra-motion-control",w.type="button",w.textContent="Pause background animation",(z?A[0]:t.closest(".default-section")).append(w),w.addEventListener("click",()=>{v=!v,w.textContent=v?"Resume background animation":"Pause background animation",w.setAttribute("aria-pressed",String(v)),o()});let U=()=>K==="still"||W.matches||O?.saveData||Z;function F(){m&&cancelAnimationFrame(m),m=0,B=0,_=null,x=0,P=0}async function o(){let r=U()||M;if(w.hidden=!!(r||E),r||!q||document.hidden||v||E){F(),t.dataset.state=r?"still":g?"paused":"poster";return}if(!g){if(L)return;L=!0;try{let{createChromiumRenderer:n}=await Promise.resolve().then(()=>($(),Y));g=n(e),a()}catch(n){M=!0,console.warn("Chromium hero: using the still image.",n)}return L=!1,o()}m||(m=requestAnimationFrame(d))}function a(){let{width:r,height:n}=t.getBoundingClientRect();if(g&&r>0&&n>0){if(r===k&&n===S)return;k=r,S=n,g.resize(r,n,I.matches?Math.min(devicePixelRatio,1.25)*R:void 0),t.dataset.renderScale=R.toFixed(2),i()}}function i(){g.draw(D,l?0:C)}function d(r){if(m=0,D+=B?Math.min(.05,(r-B)/1e3)*.65:0,B=r,I.matches&&_!==null&&r-_<1e3/30-1){m=requestAnimationFrame(d);return}if(_=r,i(),t.dataset.state="running",t.dataset.time=D.toFixed(2),x||(x=r),P++,r-x>=2500){let n=P*1e3/(r-x);if(t.dataset.fps=String(Math.round(n)),b=n<24?b+1:0,x=r,P=0,b>=2)if(I.matches){let y=Math.max(.5,R*.8);y!==R&&(R=y,k=0,a()),b=0}else{E=!0,o();return}}m=requestAnimationFrame(d)}let f=new Map,s=new IntersectionObserver(r=>{for(let n of r)f.set(n.target,n.isIntersecting);q=[...f.values()].some(Boolean),o()});(z?A:[t]).forEach(r=>s.observe(r));function c(){if(!z)return;if(!l){u();return}let r=A[0].getBoundingClientRect(),n=A[A.length-1].getBoundingClientRect(),y=t.getBoundingClientRect();p={start:r.top+scrollY,span:Math.max(1,r.height*.95),end:n.bottom+scrollY,height:y.height,width:y.width},t.style.setProperty("--ozastra-shade-start",`${p.start}px`),t.style.setProperty("--ozastra-shade-end",`${p.start+p.span}px`),u()}function h(){let r=t.getBoundingClientRect();if(l&&p&&r.width===p.width&&r.height===p.height){u();return}c()}function u(){if(!z)return;if(!l){let H=A[0].getBoundingClientRect(),N=Math.max(0,Math.min(1,-H.top/Math.max(1,H.height*.95)));C=N*N*(3-2*N);let V=C.toFixed(4);t.dataset.recession!==V&&(t.style.setProperty("--recession",V),t.dataset.recession=V)}let r=l?p.end-scrollY:A[A.length-1].getBoundingClientRect().bottom,n=l?p.height:t.getBoundingClientRect().height,y=Math.max(0,Math.min(n,n-r)),G=l&&y===0?"none":`inset(0 0 ${y}px 0)`;t.style.clipPath!==G&&(t.style.clipPath=G),!l&&g&&!m&&q&&!document.hidden&&!U()&&!M&&i()}if(z){addEventListener("scroll",u,{passive:!0}),addEventListener("resize",h),I.addEventListener("change",c);let r=new ResizeObserver(c);A.forEach(n=>r.observe(n)),c()}new ResizeObserver(a).observe(t),W.addEventListener("change",o),I.addEventListener("change",()=>{E=!1,b=0,x=0,P=0,R=1,k=0,a(),o()}),O?.addEventListener("change",o),document.addEventListener("visibilitychange",o),addEventListener("pagehide",F),addEventListener("pageshow",()=>{z&&c(),o()}),e.addEventListener("webglcontextlost",r=>{r.preventDefault(),M=!0,o()}),o()}
