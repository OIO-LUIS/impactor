// quickselect@3.0.0 downloaded from https://ga.jspm.io/npm:quickselect@3.0.0/index.js

/**
 * Rearranges items so that all items in the [left, k] are the smallest.
 * The k-th element will have the (k - left + 1)-th smallest value in [left, right].
 *
 * @template T
 * @param {T[]} arr the array to partially sort (in place)
 * @param {number} k middle index for partial sorting (as defined above)
 * @param {number} [left=0] left index of the range to sort
 * @param {number} [right=arr.length-1] right index
 * @param {(a: T, b: T) => number} [compare = (a, b) => a - b] compare function
 */
function quickselect(t,e,s=0,a=t.length-1,o=defaultCompare){while(a>s){if(a-s>600){const c=a-s+1;const n=e-s+1;const l=Math.log(c);const i=.5*Math.exp(2*l/3);const h=.5*Math.sqrt(l*i*(c-i)/c)*(n-c/2<0?-1:1);const f=Math.max(s,Math.floor(e-n*i/c+h));const p=Math.min(a,Math.floor(e+(c-n)*i/c+h));quickselect(t,e,f,p,o)}const c=t[e];let n=s;
/** @type {number} */let l=a;swap(t,s,e);o(t[a],c)>0&&swap(t,s,a);while(n<l){swap(t,n,l);n++;l--;while(o(t[n],c)<0)n++;while(o(t[l],c)>0)l--}if(o(t[s],c)===0)swap(t,s,l);else{l++;swap(t,l,a)}l<=e&&(s=l+1);e<=l&&(a=l-1)}}
/**
 * @template T
 * @param {T[]} arr
 * @param {number} i
 * @param {number} j
 */function swap(t,e,s){const a=t[e];t[e]=t[s];t[s]=a}
/**
 * @template T
 * @param {T} a
 * @param {T} b
 * @returns {number}
 */function defaultCompare(t,e){return t<e?-1:t>e?1:0}export{quickselect as default};

