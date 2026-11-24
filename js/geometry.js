/* js/geometry.js — izvorni modul čiste kalibracijske matematike.
   Vir je ta datoteka; `npm run modules:sync` vstavi vsebino v označeni blok
   znotraj tehnicka-risba-pro.html. Funkciji ne uporabljata DOM ali stanja S. */

function solve(A,b){var i,j,c,p,d,t,nn=b.length,M=A.map(function(r,k){return r.concat([b[k]])});for(c=0;c<nn;c++){p=c;for(i=c+1;i<nn;i++)if(Math.abs(M[i][c])>Math.abs(M[p][c]))p=i;if(Math.abs(M[p][c])<1e-12)throw new Error("Točke so izrojene.");t=M[c];M[c]=M[p];M[p]=t;d=M[c][c];for(j=c;j<=nn;j++)M[c][j]/=d;for(i=0;i<nn;i++){if(i===c)continue;var q=M[i][c];if(Math.abs(q)<1e-15)continue;for(j=c;j<=nn;j++)M[i][j]-=q*M[c][j]}}return M.map(function(r){return r[nn]})}
function homography(src,dst){var A=[],b=[];src.forEach(function(p,i){var X=dst[i].x,Y=dst[i].y,u=p.x,v=p.y;A.push([u,v,1,0,0,0,-u*X,-v*X]);b.push(X);A.push([0,0,0,u,v,1,-u*Y,-v*Y]);b.push(Y)});var h=solve(A,b);return[h[0],h[1],h[2],h[3],h[4],h[5],h[6],h[7],1]}
