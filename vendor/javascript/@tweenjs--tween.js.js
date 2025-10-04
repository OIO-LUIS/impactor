// @tweenjs/tween.js@25.0.0 downloaded from https://ga.jspm.io/npm:@tweenjs/tween.js@25.0.0/dist/tween.esm.js

var t=Object.freeze({Linear:Object.freeze({None:function(t){return t},In:function(t){return t},Out:function(t){return t},InOut:function(t){return t}}),Quadratic:Object.freeze({In:function(t){return t*t},Out:function(t){return t*(2-t)},InOut:function(t){return(t*=2)<1?.5*t*t:-.5*(--t*(t-2)-1)}}),Cubic:Object.freeze({In:function(t){return t*t*t},Out:function(t){return--t*t*t+1},InOut:function(t){return(t*=2)<1?.5*t*t*t:.5*((t-=2)*t*t+2)}}),Quartic:Object.freeze({In:function(t){return t*t*t*t},Out:function(t){return 1- --t*t*t*t},InOut:function(t){return(t*=2)<1?.5*t*t*t*t:-.5*((t-=2)*t*t*t-2)}}),Quintic:Object.freeze({In:function(t){return t*t*t*t*t},Out:function(t){return--t*t*t*t*t+1},InOut:function(t){return(t*=2)<1?.5*t*t*t*t*t:.5*((t-=2)*t*t*t*t+2)}}),Sinusoidal:Object.freeze({In:function(t){return 1-Math.sin((1-t)*Math.PI/2)},Out:function(t){return Math.sin(t*Math.PI/2)},InOut:function(t){return.5*(1-Math.sin(Math.PI*(.5-t)))}}),Exponential:Object.freeze({In:function(t){return t===0?0:Math.pow(1024,t-1)},Out:function(t){return t===1?1:1-Math.pow(2,-10*t)},InOut:function(t){return t===0?0:t===1?1:(t*=2)<1?.5*Math.pow(1024,t-1):.5*(2-Math.pow(2,-10*(t-1)))}}),Circular:Object.freeze({In:function(t){return 1-Math.sqrt(1-t*t)},Out:function(t){return Math.sqrt(1- --t*t)},InOut:function(t){return(t*=2)<1?-.5*(Math.sqrt(1-t*t)-1):.5*(Math.sqrt(1-(t-=2)*t)+1)}}),Elastic:Object.freeze({In:function(t){return t===0?0:t===1?1:-Math.pow(2,10*(t-1))*Math.sin(5*(t-1.1)*Math.PI)},Out:function(t){return t===0?0:t===1?1:Math.pow(2,-10*t)*Math.sin(5*(t-.1)*Math.PI)+1},InOut:function(t){if(t===0)return 0;if(t===1)return 1;t*=2;return t<1?-.5*Math.pow(2,10*(t-1))*Math.sin(5*(t-1.1)*Math.PI):.5*Math.pow(2,-10*(t-1))*Math.sin(5*(t-1.1)*Math.PI)+1}}),Back:Object.freeze({In:function(t){var e=1.70158;return t===1?1:t*t*((e+1)*t-e)},Out:function(t){var e=1.70158;return t===0?0:--t*t*((e+1)*t+e)+1},InOut:function(t){var e=2.5949095;return(t*=2)<1?t*t*((e+1)*t-e)*.5:.5*((t-=2)*t*((e+1)*t+e)+2)}}),Bounce:Object.freeze({In:function(e){return 1-t.Bounce.Out(1-e)},Out:function(t){return t<1/2.75?7.5625*t*t:t<2/2.75?7.5625*(t-=1.5/2.75)*t+.75:t<2.5/2.75?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375},InOut:function(e){return e<.5?t.Bounce.In(e*2)*.5:t.Bounce.Out(e*2-1)*.5+.5}}),generatePow:function(t){t===void 0&&(t=4);t=t<Number.EPSILON?Number.EPSILON:t;t=t>1e4?1e4:t;return{In:function(e){return Math.pow(e,t)},Out:function(e){return 1-Math.pow(1-e,t)},InOut:function(e){return e<.5?Math.pow(e*2,t)/2:(1-Math.pow(2-e*2,t))/2+.5}}}});var now=function(){return performance.now()};var e=function(){function Group(){var t=[];for(var e=0;e<arguments.length;e++)t[e]=arguments[e];this._tweens={};this._tweensAddedDuringUpdate={};this.add.apply(this,t)}Group.prototype.getAll=function(){var t=this;return Object.keys(this._tweens).map((function(e){return t._tweens[e]}))};Group.prototype.removeAll=function(){this._tweens={}};Group.prototype.add=function(){var t;var e=[];for(var r=0;r<arguments.length;r++)e[r]=arguments[r];for(var n=0,i=e;n<i.length;n++){var a=i[n];(t=a._group)===null||t===void 0?void 0:t.remove(a);a._group=this;this._tweens[a.getId()]=a;this._tweensAddedDuringUpdate[a.getId()]=a}};Group.prototype.remove=function(){var t=[];for(var e=0;e<arguments.length;e++)t[e]=arguments[e];for(var r=0,n=t;r<n.length;r++){var i=n[r];i._group=void 0;delete this._tweens[i.getId()];delete this._tweensAddedDuringUpdate[i.getId()]}};Group.prototype.allStopped=function(){return this.getAll().every((function(t){return!t.isPlaying()}))};Group.prototype.update=function(t,e){t===void 0&&(t=now());e===void 0&&(e=true);var r=Object.keys(this._tweens);if(r.length!==0)while(r.length>0){this._tweensAddedDuringUpdate={};for(var n=0;n<r.length;n++){var i=this._tweens[r[n]];var a=!e;i&&i.update(t,a)===false&&!e&&this.remove(i)}r=Object.keys(this._tweensAddedDuringUpdate)}};return Group}();var r={Linear:function(t,e){var n=t.length-1;var i=n*e;var a=Math.floor(i);var s=r.Utils.Linear;return e<0?s(t[0],t[1],i):e>1?s(t[n],t[n-1],n-i):s(t[a],t[a+1>n?n:a+1],i-a)},Bezier:function(t,e){var n=0;var i=t.length-1;var a=Math.pow;var s=r.Utils.Bernstein;for(var o=0;o<=i;o++)n+=a(1-e,i-o)*a(e,o)*t[o]*s(i,o);return n},CatmullRom:function(t,e){var n=t.length-1;var i=n*e;var a=Math.floor(i);var s=r.Utils.CatmullRom;if(t[0]===t[n]){e<0&&(a=Math.floor(i=n*(1+e)));return s(t[(a-1+n)%n],t[a],t[(a+1)%n],t[(a+2)%n],i-a)}return e<0?t[0]-(s(t[0],t[0],t[1],t[1],-i)-t[0]):e>1?t[n]-(s(t[n],t[n],t[n-1],t[n-1],i-n)-t[n]):s(t[a?a-1:0],t[a],t[n<a+1?n:a+1],t[n<a+2?n:a+2],i-a)},Utils:{Linear:function(t,e,r){return(e-t)*r+t},Bernstein:function(t,e){var n=r.Utils.Factorial;return n(t)/n(e)/n(t-e)},Factorial:function(){var t=[1];return function(e){var r=1;if(t[e])return t[e];for(var n=e;n>1;n--)r*=n;t[e]=r;return r}}(),CatmullRom:function(t,e,r,n,i){var a=.5*(r-t);var s=.5*(n-e);var o=i*i;var u=i*o;return(2*e-2*r+a+s)*u+(-3*e+3*r-2*a-s)*o+a*i+e}}};var n=function(){function Sequence(){}Sequence.nextId=function(){return Sequence._nextId++};Sequence._nextId=0;return Sequence}();var i=new e;var a=function(){function Tween(e,a){this._isPaused=false;this._pauseStart=0;this._valuesStart={};this._valuesEnd={};this._valuesStartRepeat={};this._duration=1e3;this._isDynamic=false;this._initialRepeat=0;this._repeat=0;this._yoyo=false;this._isPlaying=false;this._reversed=false;this._delayTime=0;this._startTime=0;this._easingFunction=t.Linear.None;this._interpolationFunction=r.Linear;this._chainedTweens=[];this._onStartCallbackFired=false;this._onEveryStartCallbackFired=false;this._id=n.nextId();this._isChainStopped=false;this._propertiesAreSetUp=false;this._goToEnd=false;this._object=e;if(typeof a==="object"){this._group=a;a.add(this)}else if(a===true){this._group=i;i.add(this)}}Tween.prototype.getId=function(){return this._id};Tween.prototype.isPlaying=function(){return this._isPlaying};Tween.prototype.isPaused=function(){return this._isPaused};Tween.prototype.getDuration=function(){return this._duration};Tween.prototype.to=function(t,e){e===void 0&&(e=1e3);if(this._isPlaying)throw new Error("Can not call Tween.to() while Tween is already started or paused. Stop the Tween first.");this._valuesEnd=t;this._propertiesAreSetUp=false;this._duration=e<0?0:e;return this};Tween.prototype.duration=function(t){t===void 0&&(t=1e3);this._duration=t<0?0:t;return this};Tween.prototype.dynamic=function(t){t===void 0&&(t=false);this._isDynamic=t;return this};Tween.prototype.start=function(t,e){t===void 0&&(t=now());e===void 0&&(e=false);if(this._isPlaying)return this;this._repeat=this._initialRepeat;if(this._reversed){this._reversed=false;for(var r in this._valuesStartRepeat){this._swapEndStartRepeatValues(r);this._valuesStart[r]=this._valuesStartRepeat[r]}}this._isPlaying=true;this._isPaused=false;this._onStartCallbackFired=false;this._onEveryStartCallbackFired=false;this._isChainStopped=false;this._startTime=t;this._startTime+=this._delayTime;if(!this._propertiesAreSetUp||e){this._propertiesAreSetUp=true;if(!this._isDynamic){var n={};for(var i in this._valuesEnd)n[i]=this._valuesEnd[i];this._valuesEnd=n}this._setupProperties(this._object,this._valuesStart,this._valuesEnd,this._valuesStartRepeat,e)}return this};Tween.prototype.startFromCurrentValues=function(t){return this.start(t,true)};Tween.prototype._setupProperties=function(t,e,r,n,i){for(var a in r){var s=t[a];var o=Array.isArray(s);var u=o?"array":typeof s;var h=!o&&Array.isArray(r[a]);if(u!=="undefined"&&u!=="function"){if(h){var p=r[a];if(p.length===0)continue;var l=[s];for(var f=0,_=p.length;f<_;f+=1){var c=this._handleRelativeValue(s,p[f]);if(isNaN(c)){h=false;console.warn("Found invalid interpolation list. Skipping.");break}l.push(c)}h&&(r[a]=l)}if(u!=="object"&&!o||!s||h){(typeof e[a]==="undefined"||i)&&(e[a]=s);o||(e[a]*=1);n[a]=h?r[a].slice().reverse():e[a]||0}else{e[a]=o?[]:{};var d=s;for(var v in d)e[a][v]=d[v];n[a]=o?[]:{};p=r[a];if(!this._isDynamic){var y={};for(var v in p)y[v]=p[v];r[a]=p=y}this._setupProperties(d,e[a],p,n[a],i)}}}};Tween.prototype.stop=function(){if(!this._isChainStopped){this._isChainStopped=true;this.stopChainedTweens()}if(!this._isPlaying)return this;this._isPlaying=false;this._isPaused=false;this._onStopCallback&&this._onStopCallback(this._object);return this};Tween.prototype.end=function(){this._goToEnd=true;this.update(this._startTime+this._duration);return this};Tween.prototype.pause=function(t){t===void 0&&(t=now());if(this._isPaused||!this._isPlaying)return this;this._isPaused=true;this._pauseStart=t;return this};Tween.prototype.resume=function(t){t===void 0&&(t=now());if(!this._isPaused||!this._isPlaying)return this;this._isPaused=false;this._startTime+=t-this._pauseStart;this._pauseStart=0;return this};Tween.prototype.stopChainedTweens=function(){for(var t=0,e=this._chainedTweens.length;t<e;t++)this._chainedTweens[t].stop();return this};Tween.prototype.group=function(t){if(!t){console.warn("tween.group() without args has been removed, use group.add(tween) instead.");return this}t.add(this);return this};Tween.prototype.remove=function(){var t;(t=this._group)===null||t===void 0?void 0:t.remove(this);return this};Tween.prototype.delay=function(t){t===void 0&&(t=0);this._delayTime=t;return this};Tween.prototype.repeat=function(t){t===void 0&&(t=0);this._initialRepeat=t;this._repeat=t;return this};Tween.prototype.repeatDelay=function(t){this._repeatDelayTime=t;return this};Tween.prototype.yoyo=function(t){t===void 0&&(t=false);this._yoyo=t;return this};Tween.prototype.easing=function(e){e===void 0&&(e=t.Linear.None);this._easingFunction=e;return this};Tween.prototype.interpolation=function(t){t===void 0&&(t=r.Linear);this._interpolationFunction=t;return this};Tween.prototype.chain=function(){var t=[];for(var e=0;e<arguments.length;e++)t[e]=arguments[e];this._chainedTweens=t;return this};Tween.prototype.onStart=function(t){this._onStartCallback=t;return this};Tween.prototype.onEveryStart=function(t){this._onEveryStartCallback=t;return this};Tween.prototype.onUpdate=function(t){this._onUpdateCallback=t;return this};Tween.prototype.onRepeat=function(t){this._onRepeatCallback=t;return this};Tween.prototype.onComplete=function(t){this._onCompleteCallback=t;return this};Tween.prototype.onStop=function(t){this._onStopCallback=t;return this};
/**
     * @returns true if the tween is still playing after the update, false
     * otherwise (calling update on a paused tween still returns true because
     * it is still playing, just paused).
     *
     * @param autoStart - When true, calling update will implicitly call start()
     * as well. Note, if you stop() or end() the tween, but are still calling
     * update(), it will start again!
     */Tween.prototype.update=function(t,e){var r=this;var n;t===void 0&&(t=now());e===void 0&&(e=Tween.autoStartOnUpdate);if(this._isPaused)return true;var i;if(!this._goToEnd&&!this._isPlaying){if(!e)return false;this.start(t,true)}this._goToEnd=false;if(t<this._startTime)return true;if(this._onStartCallbackFired===false){this._onStartCallback&&this._onStartCallback(this._object);this._onStartCallbackFired=true}if(this._onEveryStartCallbackFired===false){this._onEveryStartCallback&&this._onEveryStartCallback(this._object);this._onEveryStartCallbackFired=true}var a=t-this._startTime;var s=this._duration+((n=this._repeatDelayTime)!==null&&n!==void 0?n:this._delayTime);var o=this._duration+this._repeat*s;var calculateElapsedPortion=function(){if(r._duration===0)return 1;if(a>o)return 1;var t=Math.trunc(a/s);var e=a-t*s;var n=Math.min(e/r._duration,1);return n===0&&a===r._duration?1:n};var u=calculateElapsedPortion();var h=this._easingFunction(u);this._updateProperties(this._object,this._valuesStart,this._valuesEnd,h);this._onUpdateCallback&&this._onUpdateCallback(this._object,u);if(this._duration===0||a>=this._duration){if(this._repeat>0){var p=Math.min(Math.trunc((a-this._duration)/s)+1,this._repeat);isFinite(this._repeat)&&(this._repeat-=p);for(i in this._valuesStartRepeat){this._yoyo||typeof this._valuesEnd[i]!=="string"||(this._valuesStartRepeat[i]=this._valuesStartRepeat[i]+parseFloat(this._valuesEnd[i]));this._yoyo&&this._swapEndStartRepeatValues(i);this._valuesStart[i]=this._valuesStartRepeat[i]}this._yoyo&&(this._reversed=!this._reversed);this._startTime+=s*p;this._onRepeatCallback&&this._onRepeatCallback(this._object);this._onEveryStartCallbackFired=false;return true}this._onCompleteCallback&&this._onCompleteCallback(this._object);for(var l=0,f=this._chainedTweens.length;l<f;l++)this._chainedTweens[l].start(this._startTime+this._duration,false);this._isPlaying=false;return false}return true};Tween.prototype._updateProperties=function(t,e,r,n){for(var i in r)if(e[i]!==void 0){var a=e[i]||0;var s=r[i];var o=Array.isArray(t[i]);var u=Array.isArray(s);var h=!o&&u;if(h)t[i]=this._interpolationFunction(s,n);else if(typeof s==="object"&&s)this._updateProperties(t[i],a,s,n);else{s=this._handleRelativeValue(a,s);typeof s==="number"&&(t[i]=a+(s-a)*n)}}};Tween.prototype._handleRelativeValue=function(t,e){return typeof e!=="string"?e:e.charAt(0)==="+"||e.charAt(0)==="-"?t+parseFloat(e):parseFloat(e)};Tween.prototype._swapEndStartRepeatValues=function(t){var e=this._valuesStartRepeat[t];var r=this._valuesEnd[t];this._valuesStartRepeat[t]=typeof r==="string"?this._valuesStartRepeat[t]+parseFloat(r):this._valuesEnd[t];this._valuesEnd[t]=e};Tween.autoStartOnUpdate=false;return Tween}();var s="25.0.0";var o=n.nextId;var u=i;
/**
 * @deprecated The global TWEEN Group will be removed in a following major
 * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
 * group.
 *
 * Old code:
 *
 * ```js
 * import * as TWEEN from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new TWEEN.Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   TWEEN.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 *
 * New code:
 *
 * ```js
 * import {Tween, Group} from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * const group = new Group()
 * group.add(tween)
 * group.add(tween2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   group.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 */var h=u.getAll.bind(u);
/**
 * @deprecated The global TWEEN Group will be removed in a following major
 * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
 * group.
 *
 * Old code:
 *
 * ```js
 * import * as TWEEN from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new TWEEN.Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   TWEEN.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 *
 * New code:
 *
 * ```js
 * import {Tween, Group} from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * const group = new Group()
 * group.add(tween)
 * group.add(tween2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   group.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 */var p=u.removeAll.bind(u);
/**
 * @deprecated The global TWEEN Group will be removed in a following major
 * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
 * group.
 *
 * Old code:
 *
 * ```js
 * import * as TWEEN from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new TWEEN.Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   TWEEN.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 *
 * New code:
 *
 * ```js
 * import {Tween, Group} from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * const group = new Group()
 * group.add(tween)
 * group.add(tween2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   group.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 */var l=u.add.bind(u);
/**
 * @deprecated The global TWEEN Group will be removed in a following major
 * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
 * group.
 *
 * Old code:
 *
 * ```js
 * import * as TWEEN from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new TWEEN.Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   TWEEN.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 *
 * New code:
 *
 * ```js
 * import {Tween, Group} from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * const group = new Group()
 * group.add(tween)
 * group.add(tween2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   group.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 */var f=u.remove.bind(u);
/**
 * @deprecated The global TWEEN Group will be removed in a following major
 * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
 * group.
 *
 * Old code:
 *
 * ```js
 * import * as TWEEN from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new TWEEN.Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   TWEEN.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 *
 * New code:
 *
 * ```js
 * import {Tween, Group} from '@tweenjs/tween.js'
 *
 * //...
 *
 * const tween = new Tween(obj)
 * const tween2 = new TWEEN.Tween(obj2)
 *
 * //...
 *
 * const group = new Group()
 * group.add(tween)
 * group.add(tween2)
 *
 * //...
 *
 * requestAnimationFrame(function loop(time) {
 *   group.update(time)
 *   requestAnimationFrame(loop)
 * })
 * ```
 */var _=u.update.bind(u);var c={Easing:t,Group:e,Interpolation:r,now:now,Sequence:n,nextId:o,Tween:a,VERSION:s,
/**
     * @deprecated The global TWEEN Group will be removed in a following major
     * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
     * group.
     *
     * Old code:
     *
     * ```js
     * import * as TWEEN from '@tweenjs/tween.js'
     *
     * //...
     *
     * const tween = new TWEEN.Tween(obj)
     * const tween2 = new TWEEN.Tween(obj2)
     *
     * //...
     *
     * requestAnimationFrame(function loop(time) {
     *   TWEEN.update(time)
     *   requestAnimationFrame(loop)
     * })
     * ```
     *
     * New code:
     *
     * ```js
     * import {Tween, Group} from '@tweenjs/tween.js'
     *
     * //...
     *
     * const tween = new Tween(obj)
     * const tween2 = new TWEEN.Tween(obj2)
     *
     * //...
     *
     * const group = new Group()
     * group.add(tween)
     * group.add(tween2)
     *
     * //...
     *
     * requestAnimationFrame(function loop(time) {
     *   group.update(time)
     *   requestAnimationFrame(loop)
     * })
     * ```
     */
getAll:h,
/**
     * @deprecated The global TWEEN Group will be removed in a following major
     * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
     * group.
     *
     * Old code:
     *
     * ```js
     * import * as TWEEN from '@tweenjs/tween.js'
     *
     * //...
     *
     * const tween = new TWEEN.Tween(obj)
     * const tween2 = new TWEEN.Tween(obj2)
     *
     * //...
     *
     * requestAnimationFrame(function loop(time) {
     *   TWEEN.update(time)
     *   requestAnimationFrame(loop)
     * })
     * ```
     *
     * New code:
     *
     * ```js
     * import {Tween, Group} from '@tweenjs/tween.js'
     *
     * //...
     *
     * const tween = new Tween(obj)
     * const tween2 = new TWEEN.Tween(obj2)
     *
     * //...
     *
     * const group = new Group()
     * group.add(tween)
     * group.add(tween2)
     *
     * //...
     *
     * requestAnimationFrame(function loop(time) {
     *   group.update(time)
     *   requestAnimationFrame(loop)
     * })
     * ```
     */
removeAll:p,
/**
     * @deprecated The global TWEEN Group will be removed in a following major
     * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
     * group.
     *
     * Old code:
     *
     * ```js
     * import * as TWEEN from '@tweenjs/tween.js'
     *
     * //...
     *
     * const tween = new TWEEN.Tween(obj)
     * const tween2 = new TWEEN.Tween(obj2)
     *
     * //...
     *
     * requestAnimationFrame(function loop(time) {
     *   TWEEN.update(time)
     *   requestAnimationFrame(loop)
     * })
     * ```
     *
     * New code:
     *
     * ```js
     * import {Tween, Group} from '@tweenjs/tween.js'
     *
     * //...
     *
     * const tween = new Tween(obj)
     * const tween2 = new TWEEN.Tween(obj2)
     *
     * //...
     *
     * const group = new Group()
     * group.add(tween)
     * group.add(tween2)
     *
     * //...
     *
     * requestAnimationFrame(function loop(time) {
     *   group.update(time)
     *   requestAnimationFrame(loop)
     * })
     * ```
     */
add:l,
/**
     * @deprecated The global TWEEN Group will be removed in a following major
     * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
     * group.
     *
     * Old code:
     *
     * ```js
     * import * as TWEEN from '@tweenjs/tween.js'
     *
     * //...
     *
     * const tween = new TWEEN.Tween(obj)
     * const tween2 = new TWEEN.Tween(obj2)
     *
     * //...
     *
     * requestAnimationFrame(function loop(time) {
     *   TWEEN.update(time)
     *   requestAnimationFrame(loop)
     * })
     * ```
     *
     * New code:
     *
     * ```js
     * import {Tween, Group} from '@tweenjs/tween.js'
     *
     * //...
     *
     * const tween = new Tween(obj)
     * const tween2 = new TWEEN.Tween(obj2)
     *
     * //...
     *
     * const group = new Group()
     * group.add(tween)
     * group.add(tween2)
     *
     * //...
     *
     * requestAnimationFrame(function loop(time) {
     *   group.update(time)
     *   requestAnimationFrame(loop)
     * })
     * ```
     */
remove:f,
/**
     * @deprecated The global TWEEN Group will be removed in a following major
     * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
     * group.
     *
     * Old code:
     *
     * ```js
     * import * as TWEEN from '@tweenjs/tween.js'
     *
     * //...
     *
     * const tween = new TWEEN.Tween(obj)
     * const tween2 = new TWEEN.Tween(obj2)
     *
     * //...
     *
     * requestAnimationFrame(function loop(time) {
     *   TWEEN.update(time)
     *   requestAnimationFrame(loop)
     * })
     * ```
     *
     * New code:
     *
     * ```js
     * import {Tween, Group} from '@tweenjs/tween.js'
     *
     * //...
     *
     * const tween = new Tween(obj)
     * const tween2 = new TWEEN.Tween(obj2)
     *
     * //...
     *
     * const group = new Group()
     * group.add(tween)
     * group.add(tween2)
     *
     * //...
     *
     * requestAnimationFrame(function loop(time) {
     *   group.update(time)
     *   requestAnimationFrame(loop)
     * })
     * ```
     */
update:_};export{t as Easing,e as Group,r as Interpolation,n as Sequence,a as Tween,s as VERSION,l as add,c as default,h as getAll,o as nextId,now,f as remove,p as removeAll,_ as update};

