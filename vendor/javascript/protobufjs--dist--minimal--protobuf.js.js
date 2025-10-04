// protobufjs/dist/minimal/protobuf.js@7.5.4 downloaded from https://ga.jspm.io/npm:protobufjs@7.5.4/dist/minimal/protobuf.js

var _global=typeof globalThis!=="undefined"?globalThis:typeof self!=="undefined"?self:global;var exports={};var module={exports:exports};(function(undefined$1){(function(t,o,e){function r(e){var l=o[e];l||t[e][0].call(l=o[e]={exports:{}},r,l,l.exports);return l.exports}var l=r(e[0]);l.util.global.protobuf=l;(true,module.exports)&&(module.exports=l)})({1:[function(t,o,e){o.exports=r;
/**
       * Callback as used by {@link util.asPromise}.
       * @typedef asPromiseCallback
       * @type {function}
       * @param {Error|null} error Error, if any
       * @param {...*} params Additional arguments
       * @returns {undefined}
       */
/**
       * Returns a promise from a node-style callback function.
       * @memberof util
       * @param {asPromiseCallback} fn Function to call
       * @param {*} ctx Function context
       * @param {...*} params Function arguments
       * @returns {Promise<*>} Promisified function
       */function r(t,o){var e=new Array(arguments.length-1),r=0,l=2,i=true;while(l<arguments.length)e[r++]=arguments[l++];return new Promise((function(l,n){e[r]=function(t){if(i){i=false;if(t)n(t);else{var o=new Array(arguments.length-1),e=0;while(e<o.length)o[e++]=arguments[e];l.apply(null,o)}}};try{t.apply(o||null,e)}catch(t){if(i){i=false;n(t)}}}))}},{}],2:[function(t,o,e){var r=e;
/**
       * Calculates the byte length of a base64 encoded string.
       * @param {string} string Base64 encoded string
       * @returns {number} Byte length
       */r.length=function(t){var o=t.length;if(!o)return 0;var e=0;while(--o%4>1&&t.charAt(o)==="=")++e;return Math.ceil(t.length*3)/4-e};var l=new Array(64);var i=new Array(123);for(var n=0;n<64;)i[l[n]=n<26?n+65:n<52?n+71:n<62?n-4:n-59|43]=n++;
/**
       * Encodes a buffer to a base64 encoded string.
       * @param {Uint8Array} buffer Source buffer
       * @param {number} start Source start
       * @param {number} end Source end
       * @returns {string} Base64 encoded string
       */r.encode=function(t,o,e){var r=null,i=[];var n,a=0,s=0;while(o<e){var u=t[o++];switch(s){case 0:i[a++]=l[u>>2];n=(u&3)<<4;s=1;break;case 1:i[a++]=l[n|u>>4];n=(u&15)<<2;s=2;break;case 2:i[a++]=l[n|u>>6];i[a++]=l[u&63];s=0;break}if(a>8191){(r||(r=[])).push(String.fromCharCode.apply(String,i));a=0}}if(s){i[a++]=l[n];i[a++]=61;s===1&&(i[a++]=61)}if(r){a&&r.push(String.fromCharCode.apply(String,i.slice(0,a)));return r.join("")}return String.fromCharCode.apply(String,i.slice(0,a))};var a="invalid encoding";
/**
       * Decodes a base64 encoded string to a buffer.
       * @param {string} string Source string
       * @param {Uint8Array} buffer Destination buffer
       * @param {number} offset Destination offset
       * @returns {number} Number of bytes written
       * @throws {Error} If encoding is invalid
       */r.decode=function(t,o,e){var r=e;var l,n=0;for(var s=0;s<t.length;){var u=t.charCodeAt(s++);if(u===61&&n>1)break;if((u=i[u])===undefined$1)throw Error(a);switch(n){case 0:l=u;n=1;break;case 1:o[e++]=l<<2|(u&48)>>4;l=u;n=2;break;case 2:o[e++]=(l&15)<<4|(u&60)>>2;l=u;n=3;break;case 3:o[e++]=(l&3)<<6|u;n=0;break}}if(n===1)throw Error(a);return e-r};
/**
       * Tests if the specified string appears to be base64 encoded.
       * @param {string} string String to test
       * @returns {boolean} `true` if probably base64 encoded, otherwise false
       */r.test=function(t){return/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(t)}},{}],3:[function(t,o,e){o.exports=r;function r(){
/**
         * Registered listeners.
         * @type {Object.<string,*>}
         * @private
         */
(this||_global)._listeners={}}
/**
       * Registers an event listener.
       * @param {string} evt Event name
       * @param {function} fn Listener
       * @param {*} [ctx] Listener context
       * @returns {util.EventEmitter} `this`
       */r.prototype.on=function(t,o,e){((this||_global)._listeners[t]||((this||_global)._listeners[t]=[])).push({fn:o,ctx:e||this||_global});return this||_global};
/**
       * Removes an event listener or any matching listeners if arguments are omitted.
       * @param {string} [evt] Event name. Removes all listeners if omitted.
       * @param {function} [fn] Listener to remove. Removes all listeners of `evt` if omitted.
       * @returns {util.EventEmitter} `this`
       */r.prototype.off=function(t,o){if(t===undefined$1)(this||_global)._listeners={};else if(o===undefined$1)(this||_global)._listeners[t]=[];else{var e=(this||_global)._listeners[t];for(var r=0;r<e.length;)e[r].fn===o?e.splice(r,1):++r}return this||_global};
/**
       * Emits an event by calling its listeners with the specified arguments.
       * @param {string} evt Event name
       * @param {...*} args Arguments
       * @returns {util.EventEmitter} `this`
       */r.prototype.emit=function(t){var o=(this||_global)._listeners[t];if(o){var e=[],r=1;for(;r<arguments.length;)e.push(arguments[r++]);for(r=0;r<o.length;)o[r].fn.apply(o[r++].ctx,e)}return this||_global}},{}],4:[function(t,o,e){o.exports=r(r);
/**
       * Writes a 32 bit float to a buffer using little endian byte order.
       * @name util.float.writeFloatLE
       * @function
       * @param {number} val Value to write
       * @param {Uint8Array} buf Target buffer
       * @param {number} pos Target buffer offset
       * @returns {undefined}
       */
/**
       * Writes a 32 bit float to a buffer using big endian byte order.
       * @name util.float.writeFloatBE
       * @function
       * @param {number} val Value to write
       * @param {Uint8Array} buf Target buffer
       * @param {number} pos Target buffer offset
       * @returns {undefined}
       */
/**
       * Reads a 32 bit float from a buffer using little endian byte order.
       * @name util.float.readFloatLE
       * @function
       * @param {Uint8Array} buf Source buffer
       * @param {number} pos Source buffer offset
       * @returns {number} Value read
       */
/**
       * Reads a 32 bit float from a buffer using big endian byte order.
       * @name util.float.readFloatBE
       * @function
       * @param {Uint8Array} buf Source buffer
       * @param {number} pos Source buffer offset
       * @returns {number} Value read
       */
/**
       * Writes a 64 bit double to a buffer using little endian byte order.
       * @name util.float.writeDoubleLE
       * @function
       * @param {number} val Value to write
       * @param {Uint8Array} buf Target buffer
       * @param {number} pos Target buffer offset
       * @returns {undefined}
       */
/**
       * Writes a 64 bit double to a buffer using big endian byte order.
       * @name util.float.writeDoubleBE
       * @function
       * @param {number} val Value to write
       * @param {Uint8Array} buf Target buffer
       * @param {number} pos Target buffer offset
       * @returns {undefined}
       */
/**
       * Reads a 64 bit double from a buffer using little endian byte order.
       * @name util.float.readDoubleLE
       * @function
       * @param {Uint8Array} buf Source buffer
       * @param {number} pos Source buffer offset
       * @returns {number} Value read
       */
/**
       * Reads a 64 bit double from a buffer using big endian byte order.
       * @name util.float.readDoubleBE
       * @function
       * @param {Uint8Array} buf Source buffer
       * @param {number} pos Source buffer offset
       * @returns {number} Value read
       */function r(t){typeof Float32Array!=="undefined"?function(){var o=new Float32Array([-0]),e=new Uint8Array(o.buffer),r=e[3]===128;function l(t,r,l){o[0]=t;r[l]=e[0];r[l+1]=e[1];r[l+2]=e[2];r[l+3]=e[3]}function i(t,r,l){o[0]=t;r[l]=e[3];r[l+1]=e[2];r[l+2]=e[1];r[l+3]=e[0]}t.writeFloatLE=r?l:i;t.writeFloatBE=r?i:l;function n(t,r){e[0]=t[r];e[1]=t[r+1];e[2]=t[r+2];e[3]=t[r+3];return o[0]}function a(t,r){e[3]=t[r];e[2]=t[r+1];e[1]=t[r+2];e[0]=t[r+3];return o[0]}t.readFloatLE=r?n:a;t.readFloatBE=r?a:n}():function(){function o(t,o,e,r){var l=o<0?1:0;l&&(o=-o);if(o===0)t(1/o>0?0:2147483648,e,r);else if(isNaN(o))t(2143289344,e,r);else if(o>34028234663852886e22)t((l<<31|2139095040)>>>0,e,r);else if(o<11754943508222875e-54)t((l<<31|Math.round(o/1401298464324817e-60))>>>0,e,r);else{var i=Math.floor(Math.log(o)/Math.LN2),n=Math.round(o*Math.pow(2,-i)*8388608)&8388607;t((l<<31|i+127<<23|n)>>>0,e,r)}}t.writeFloatLE=o.bind(null,l);t.writeFloatBE=o.bind(null,i);function e(t,o,e){var r=t(o,e),l=2*(r>>31)+1,i=r>>>23&255,n=r&8388607;return i===255?n?NaN:l*Infinity:i===0?l*1401298464324817e-60*n:l*Math.pow(2,i-150)*(n+8388608)}t.readFloatLE=e.bind(null,n);t.readFloatBE=e.bind(null,a)}();typeof Float64Array!=="undefined"?function(){var o=new Float64Array([-0]),e=new Uint8Array(o.buffer),r=e[7]===128;function l(t,r,l){o[0]=t;r[l]=e[0];r[l+1]=e[1];r[l+2]=e[2];r[l+3]=e[3];r[l+4]=e[4];r[l+5]=e[5];r[l+6]=e[6];r[l+7]=e[7]}function i(t,r,l){o[0]=t;r[l]=e[7];r[l+1]=e[6];r[l+2]=e[5];r[l+3]=e[4];r[l+4]=e[3];r[l+5]=e[2];r[l+6]=e[1];r[l+7]=e[0]}t.writeDoubleLE=r?l:i;t.writeDoubleBE=r?i:l;function n(t,r){e[0]=t[r];e[1]=t[r+1];e[2]=t[r+2];e[3]=t[r+3];e[4]=t[r+4];e[5]=t[r+5];e[6]=t[r+6];e[7]=t[r+7];return o[0]}function a(t,r){e[7]=t[r];e[6]=t[r+1];e[5]=t[r+2];e[4]=t[r+3];e[3]=t[r+4];e[2]=t[r+5];e[1]=t[r+6];e[0]=t[r+7];return o[0]}t.readDoubleLE=r?n:a;t.readDoubleBE=r?a:n}():function(){function o(t,o,e,r,l,i){var n=r<0?1:0;n&&(r=-r);if(r===0){t(0,l,i+o);t(1/r>0?0:2147483648,l,i+e)}else if(isNaN(r)){t(0,l,i+o);t(2146959360,l,i+e)}else if(r>17976931348623157e292){t(0,l,i+o);t((n<<31|2146435072)>>>0,l,i+e)}else{var a;if(r<22250738585072014e-324){a=r/5e-324;t(a>>>0,l,i+o);t((n<<31|a/4294967296)>>>0,l,i+e)}else{var s=Math.floor(Math.log(r)/Math.LN2);s===1024&&(s=1023);a=r*Math.pow(2,-s);t(a*4503599627370496>>>0,l,i+o);t((n<<31|s+1023<<20|a*1048576&1048575)>>>0,l,i+e)}}}t.writeDoubleLE=o.bind(null,l,0,4);t.writeDoubleBE=o.bind(null,i,4,0);function e(t,o,e,r,l){var i=t(r,l+o),n=t(r,l+e);var a=2*(n>>31)+1,s=n>>>20&2047,u=4294967296*(n&1048575)+i;return s===2047?u?NaN:a*Infinity:s===0?a*5e-324*u:a*Math.pow(2,s-1075)*(u+4503599627370496)}t.readDoubleLE=e.bind(null,n,0,4);t.readDoubleBE=e.bind(null,a,4,0)}();return t}function l(t,o,e){o[e]=t&255;o[e+1]=t>>>8&255;o[e+2]=t>>>16&255;o[e+3]=t>>>24}function i(t,o,e){o[e]=t>>>24;o[e+1]=t>>>16&255;o[e+2]=t>>>8&255;o[e+3]=t&255}function n(t,o){return(t[o]|t[o+1]<<8|t[o+2]<<16|t[o+3]<<24)>>>0}function a(t,o){return(t[o]<<24|t[o+1]<<16|t[o+2]<<8|t[o+3])>>>0}},{}],5:[function(require,module,exports){module.exports=inquire;
/**
       * Requires a module only if available.
       * @memberof util
       * @param {string} moduleName Module to require
       * @returns {?Object} Required module if available and not empty, otherwise `null`
       */function inquire(moduleName){try{var mod=eval("quire".replace(/^/,"re"))(moduleName);if(mod&&(mod.length||Object.keys(mod).length))return mod}catch(t){}return null}},{}],6:[function(t,o,e){o.exports=r;
/**
       * An allocator as used by {@link util.pool}.
       * @typedef PoolAllocator
       * @type {function}
       * @param {number} size Buffer size
       * @returns {Uint8Array} Buffer
       */
/**
       * A slicer as used by {@link util.pool}.
       * @typedef PoolSlicer
       * @type {function}
       * @param {number} start Start offset
       * @param {number} end End offset
       * @returns {Uint8Array} Buffer slice
       * @this {Uint8Array}
       */
/**
       * A general purpose buffer pool.
       * @memberof util
       * @function
       * @param {PoolAllocator} alloc Allocator
       * @param {PoolSlicer} slice Slicer
       * @param {number} [size=8192] Slab size
       * @returns {PoolAllocator} Pooled allocator
       */function r(t,o,e){var r=e||8192;var l=r>>>1;var i=null;var n=r;return function(e){if(e<1||e>l)return t(e);if(n+e>r){i=t(r);n=0}var a=o.call(i,n,n+=e);n&7&&(n=1+(n|7));return a}}},{}],7:[function(t,o,e){var r=e;
/**
       * Calculates the UTF8 byte length of a string.
       * @param {string} string String
       * @returns {number} Byte length
       */r.length=function(t){var o=0,e=0;for(var r=0;r<t.length;++r){e=t.charCodeAt(r);if(e<128)o+=1;else if(e<2048)o+=2;else if((e&64512)===55296&&(t.charCodeAt(r+1)&64512)===56320){++r;o+=4}else o+=3}return o};
/**
       * Reads UTF8 bytes as a string.
       * @param {Uint8Array} buffer Source buffer
       * @param {number} start Source start
       * @param {number} end Source end
       * @returns {string} String read
       */r.read=function(t,o,e){var r=e-o;if(r<1)return"";var l,i=null,n=[],a=0;while(o<e){l=t[o++];if(l<128)n[a++]=l;else if(l>191&&l<224)n[a++]=(l&31)<<6|t[o++]&63;else if(l>239&&l<365){l=((l&7)<<18|(t[o++]&63)<<12|(t[o++]&63)<<6|t[o++]&63)-65536;n[a++]=55296+(l>>10);n[a++]=56320+(l&1023)}else n[a++]=(l&15)<<12|(t[o++]&63)<<6|t[o++]&63;if(a>8191){(i||(i=[])).push(String.fromCharCode.apply(String,n));a=0}}if(i){a&&i.push(String.fromCharCode.apply(String,n.slice(0,a)));return i.join("")}return String.fromCharCode.apply(String,n.slice(0,a))};
/**
       * Writes a string as UTF8 bytes.
       * @param {string} string Source string
       * @param {Uint8Array} buffer Destination buffer
       * @param {number} offset Destination offset
       * @returns {number} Bytes written
       */r.write=function(t,o,e){var r,l,i=e;for(var n=0;n<t.length;++n){r=t.charCodeAt(n);if(r<128)o[e++]=r;else if(r<2048){o[e++]=r>>6|192;o[e++]=r&63|128}else if((r&64512)===55296&&((l=t.charCodeAt(n+1))&64512)===56320){r=65536+((r&1023)<<10)+(l&1023);++n;o[e++]=r>>18|240;o[e++]=r>>12&63|128;o[e++]=r>>6&63|128;o[e++]=r&63|128}else{o[e++]=r>>12|224;o[e++]=r>>6&63|128;o[e++]=r&63|128}}return e-i}},{}],8:[function(t,o,e){var r=e;
/**
       * Build type, one of `"full"`, `"light"` or `"minimal"`.
       * @name build
       * @type {string}
       * @const
       */r.build="minimal";r.Writer=t(16);r.BufferWriter=t(17);r.Reader=t(9);r.BufferReader=t(10);r.util=t(15);r.rpc=t(12);r.roots=t(11);r.configure=l;
/**
       * Reconfigures the library according to the environment.
       * @returns {undefined}
       */function l(){r.util._configure();r.Writer._configure(r.BufferWriter);r.Reader._configure(r.BufferReader)}l()},{10:10,11:11,12:12,15:15,16:16,17:17,9:9}],9:[function(t,o,e){o.exports=s;var r=t(15);var l;var i=r.LongBits,n=r.utf8;function a(t,o){return RangeError("index out of range: "+t.pos+" + "+(o||1)+" > "+t.len)}
/**
       * Constructs a new reader instance using the specified buffer.
       * @classdesc Wire format reader using `Uint8Array` if available, otherwise `Array`.
       * @constructor
       * @param {Uint8Array} buffer Buffer to read from
       */function s(t){
/**
         * Read buffer.
         * @type {Uint8Array}
         */
(this||_global).buf=t;
/**
         * Read buffer position.
         * @type {number}
         */(this||_global).pos=0;
/**
         * Read buffer length.
         * @type {number}
         */(this||_global).len=t.length}var u=typeof Uint8Array!=="undefined"?function(t){if(t instanceof Uint8Array||Array.isArray(t))return new s(t);throw Error("illegal buffer")}:function(t){if(Array.isArray(t))return new s(t);throw Error("illegal buffer")};var f=function(){return r.Buffer?function(t){return(s.create=function(t){return r.Buffer.isBuffer(t)?new l(t):u(t)})(t)}:u};
/**
       * Creates a new reader using the specified buffer.
       * @function
       * @param {Uint8Array|Buffer} buffer Buffer to read from
       * @returns {Reader|BufferReader} A {@link BufferReader} if `buffer` is a Buffer, otherwise a {@link Reader}
       * @throws {Error} If `buffer` is not a valid buffer
       */s.create=f();s.prototype._slice=r.Array.prototype.subarray||r.Array.prototype.slice;
/**
       * Reads a varint as an unsigned 32 bit value.
       * @function
       * @returns {number} Value read
       */s.prototype.uint32=function(){var t=4294967295;return function(){t=((this||_global).buf[(this||_global).pos]&127)>>>0;if((this||_global).buf[(this||_global).pos++]<128)return t;t=(t|((this||_global).buf[(this||_global).pos]&127)<<7)>>>0;if((this||_global).buf[(this||_global).pos++]<128)return t;t=(t|((this||_global).buf[(this||_global).pos]&127)<<14)>>>0;if((this||_global).buf[(this||_global).pos++]<128)return t;t=(t|((this||_global).buf[(this||_global).pos]&127)<<21)>>>0;if((this||_global).buf[(this||_global).pos++]<128)return t;t=(t|((this||_global).buf[(this||_global).pos]&15)<<28)>>>0;if((this||_global).buf[(this||_global).pos++]<128)return t;if(((this||_global).pos+=5)>(this||_global).len){(this||_global).pos=(this||_global).len;throw a(this||_global,10)}return t}}();
/**
       * Reads a varint as a signed 32 bit value.
       * @returns {number} Value read
       */s.prototype.int32=function(){return this.uint32()|0};
/**
       * Reads a zig-zag encoded varint as a signed 32 bit value.
       * @returns {number} Value read
       */s.prototype.sint32=function(){var t=this.uint32();return t>>>1^-(t&1)};function h(){var t=new i(0,0);var o=0;if(!((this||_global).len-(this||_global).pos>4)){for(;o<3;++o){if((this||_global).pos>=(this||_global).len)throw a(this||_global);t.lo=(t.lo|((this||_global).buf[(this||_global).pos]&127)<<o*7)>>>0;if((this||_global).buf[(this||_global).pos++]<128)return t}t.lo=(t.lo|((this||_global).buf[(this||_global).pos++]&127)<<o*7)>>>0;return t}for(;o<4;++o){t.lo=(t.lo|((this||_global).buf[(this||_global).pos]&127)<<o*7)>>>0;if((this||_global).buf[(this||_global).pos++]<128)return t}t.lo=(t.lo|((this||_global).buf[(this||_global).pos]&127)<<28)>>>0;t.hi=(t.hi|((this||_global).buf[(this||_global).pos]&127)>>4)>>>0;if((this||_global).buf[(this||_global).pos++]<128)return t;o=0;if((this||_global).len-(this||_global).pos>4)for(;o<5;++o){t.hi=(t.hi|((this||_global).buf[(this||_global).pos]&127)<<o*7+3)>>>0;if((this||_global).buf[(this||_global).pos++]<128)return t}else for(;o<5;++o){if((this||_global).pos>=(this||_global).len)throw a(this||_global);t.hi=(t.hi|((this||_global).buf[(this||_global).pos]&127)<<o*7+3)>>>0;if((this||_global).buf[(this||_global).pos++]<128)return t}throw Error("invalid varint encoding")}
/**
       * Reads a varint as a signed 64 bit value.
       * @name Reader#int64
       * @function
       * @returns {Long} Value read
       */
/**
       * Reads a varint as an unsigned 64 bit value.
       * @name Reader#uint64
       * @function
       * @returns {Long} Value read
       */
/**
       * Reads a zig-zag encoded varint as a signed 64 bit value.
       * @name Reader#sint64
       * @function
       * @returns {Long} Value read
       */
/**
       * Reads a varint as a boolean.
       * @returns {boolean} Value read
       */s.prototype.bool=function(){return this.uint32()!==0};function b(t,o){return(t[o-4]|t[o-3]<<8|t[o-2]<<16|t[o-1]<<24)>>>0}
/**
       * Reads fixed 32 bits as an unsigned 32 bit integer.
       * @returns {number} Value read
       */s.prototype.fixed32=function(){if((this||_global).pos+4>(this||_global).len)throw a(this||_global,4);return b((this||_global).buf,(this||_global).pos+=4)};
/**
       * Reads fixed 32 bits as a signed 32 bit integer.
       * @returns {number} Value read
       */s.prototype.sfixed32=function(){if((this||_global).pos+4>(this||_global).len)throw a(this||_global,4);return b((this||_global).buf,(this||_global).pos+=4)|0};function g(){if((this||_global).pos+8>(this||_global).len)throw a(this||_global,8);return new i(b((this||_global).buf,(this||_global).pos+=4),b((this||_global).buf,(this||_global).pos+=4))}
/**
       * Reads fixed 64 bits.
       * @name Reader#fixed64
       * @function
       * @returns {Long} Value read
       */
/**
       * Reads zig-zag encoded fixed 64 bits.
       * @name Reader#sfixed64
       * @function
       * @returns {Long} Value read
       */
/**
       * Reads a float (32 bit) as a number.
       * @function
       * @returns {number} Value read
       */s.prototype.float=function(){if((this||_global).pos+4>(this||_global).len)throw a(this||_global,4);var t=r.float.readFloatLE((this||_global).buf,(this||_global).pos);(this||_global).pos+=4;return t};
/**
       * Reads a double (64 bit float) as a number.
       * @function
       * @returns {number} Value read
       */s.prototype.double=function(){if((this||_global).pos+8>(this||_global).len)throw a(this||_global,4);var t=r.float.readDoubleLE((this||_global).buf,(this||_global).pos);(this||_global).pos+=8;return t};
/**
       * Reads a sequence of bytes preceeded by its length as a varint.
       * @returns {Uint8Array} Value read
       */s.prototype.bytes=function(){var t=this.uint32(),o=(this||_global).pos,e=(this||_global).pos+t;if(e>(this||_global).len)throw a(this||_global,t);(this||_global).pos+=t;if(Array.isArray((this||_global).buf))return(this||_global).buf.slice(o,e);if(o===e){var l=r.Buffer;return l?l.alloc(0):new(this||_global).buf.constructor(0)}return(this||_global)._slice.call((this||_global).buf,o,e)};
/**
       * Reads a string preceeded by its byte length as a varint.
       * @returns {string} Value read
       */s.prototype.string=function(){var t=this.bytes();return n.read(t,0,t.length)};
/**
       * Skips the specified number of bytes if specified, otherwise skips a varint.
       * @param {number} [length] Length if known, otherwise a varint is assumed
       * @returns {Reader} `this`
       */s.prototype.skip=function(t){if(typeof t==="number"){if((this||_global).pos+t>(this||_global).len)throw a(this||_global,t);(this||_global).pos+=t}else do{if((this||_global).pos>=(this||_global).len)throw a(this||_global)}while((this||_global).buf[(this||_global).pos++]&128);return this||_global};
/**
       * Skips the next element of the specified wire type.
       * @param {number} wireType Wire type received
       * @returns {Reader} `this`
       */s.prototype.skipType=function(t){switch(t){case 0:this.skip();break;case 1:this.skip(8);break;case 2:this.skip(this.uint32());break;case 3:while((t=this.uint32()&7)!==4)this.skipType(t);break;case 5:this.skip(4);break;default:throw Error("invalid wire type "+t+" at offset "+(this||_global).pos)}return this||_global};s._configure=function(t){l=t;s.create=f();l._configure();var o=r.Long?"toLong":"toNumber";r.merge(s.prototype,{int64:function(){return h.call(this||_global)[o](false)},uint64:function(){return h.call(this||_global)[o](true)},sint64:function(){return h.call(this||_global).zzDecode()[o](false)},fixed64:function(){return g.call(this||_global)[o](true)},sfixed64:function(){return g.call(this||_global)[o](false)}})}},{15:15}],10:[function(t,o,e){o.exports=i;var r=t(9);(i.prototype=Object.create(r.prototype)).constructor=i;var l=t(15);
/**
       * Constructs a new buffer reader instance.
       * @classdesc Wire format reader using node buffers.
       * @extends Reader
       * @constructor
       * @param {Buffer} buffer Buffer to read from
       */function i(t){r.call(this||_global,t);
/**
         * Read buffer.
         * @name BufferReader#buf
         * @type {Buffer}
         */}i._configure=function(){l.Buffer&&(i.prototype._slice=l.Buffer.prototype.slice)};i.prototype.string=function(){var t=this.uint32();return(this||_global).buf.utf8Slice?(this||_global).buf.utf8Slice((this||_global).pos,(this||_global).pos=Math.min((this||_global).pos+t,(this||_global).len)):(this||_global).buf.toString("utf-8",(this||_global).pos,(this||_global).pos=Math.min((this||_global).pos+t,(this||_global).len))};
/**
       * Reads a sequence of bytes preceeded by its length as a varint.
       * @name BufferReader#bytes
       * @function
       * @returns {Buffer} Value read
       */i._configure()},{15:15,9:9}],11:[function(t,o,e){o.exports={};
/**
       * Named roots.
       * This is where pbjs stores generated structures (the option `-r, --root` specifies a name).
       * Can also be used manually to make roots available across modules.
       * @name roots
       * @type {Object.<string,Root>}
       * @example
       * // pbjs -r myroot -o compiled.js ...
       *
       * // in another module:
       * require("./compiled.js");
       *
       * // in any subsequent module:
       * var root = protobuf.roots["myroot"];
       */},{}],12:[function(t,o,e){var r=e;
/**
       * RPC implementation passed to {@link Service#create} performing a service request on network level, i.e. by utilizing http requests or websockets.
       * @typedef RPCImpl
       * @type {function}
       * @param {Method|rpc.ServiceMethod<Message<{}>,Message<{}>>} method Reflected or static method being called
       * @param {Uint8Array} requestData Request data
       * @param {RPCImplCallback} callback Callback function
       * @returns {undefined}
       * @example
       * function rpcImpl(method, requestData, callback) {
       *     if (protobuf.util.lcFirst(method.name) !== "myMethod") // compatible with static code
       *         throw Error("no such method");
       *     asynchronouslyObtainAResponse(requestData, function(err, responseData) {
       *         callback(err, responseData);
       *     });
       * }
       */
/**
       * Node-style callback as used by {@link RPCImpl}.
       * @typedef RPCImplCallback
       * @type {function}
       * @param {Error|null} error Error, if any, otherwise `null`
       * @param {Uint8Array|null} [response] Response data or `null` to signal end of stream, if there hasn't been an error
       * @returns {undefined}
       */r.Service=t(13)},{13:13}],13:[function(t,o,e){o.exports=l;var r=t(15);(l.prototype=Object.create(r.EventEmitter.prototype)).constructor=l;
/**
       * A service method callback as used by {@link rpc.ServiceMethod|ServiceMethod}.
       *
       * Differs from {@link RPCImplCallback} in that it is an actual callback of a service method which may not return `response = null`.
       * @typedef rpc.ServiceMethodCallback
       * @template TRes extends Message<TRes>
       * @type {function}
       * @param {Error|null} error Error, if any
       * @param {TRes} [response] Response message
       * @returns {undefined}
       */
/**
       * A service method part of a {@link rpc.Service} as created by {@link Service.create}.
       * @typedef rpc.ServiceMethod
       * @template TReq extends Message<TReq>
       * @template TRes extends Message<TRes>
       * @type {function}
       * @param {TReq|Properties<TReq>} request Request message or plain object
       * @param {rpc.ServiceMethodCallback<TRes>} [callback] Node-style callback called with the error, if any, and the response message
       * @returns {Promise<Message<TRes>>} Promise if `callback` has been omitted, otherwise `undefined`
       */
/**
       * Constructs a new RPC service instance.
       * @classdesc An RPC service as returned by {@link Service#create}.
       * @exports rpc.Service
       * @extends util.EventEmitter
       * @constructor
       * @param {RPCImpl} rpcImpl RPC implementation
       * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
       * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
       */function l(t,o,e){if(typeof t!=="function")throw TypeError("rpcImpl must be a function");r.EventEmitter.call(this||_global);
/**
         * RPC implementation. Becomes `null` once the service is ended.
         * @type {RPCImpl|null}
         */(this||_global).rpcImpl=t;
/**
         * Whether requests are length-delimited.
         * @type {boolean}
         */(this||_global).requestDelimited=Boolean(o);
/**
         * Whether responses are length-delimited.
         * @type {boolean}
         */(this||_global).responseDelimited=Boolean(e)}
/**
       * Calls a service method through {@link rpc.Service#rpcImpl|rpcImpl}.
       * @param {Method|rpc.ServiceMethod<TReq,TRes>} method Reflected or static method
       * @param {Constructor<TReq>} requestCtor Request constructor
       * @param {Constructor<TRes>} responseCtor Response constructor
       * @param {TReq|Properties<TReq>} request Request message or plain object
       * @param {rpc.ServiceMethodCallback<TRes>} callback Service callback
       * @returns {undefined}
       * @template TReq extends Message<TReq>
       * @template TRes extends Message<TRes>
       */l.prototype.rpcCall=function t(o,e,l,i,n){if(!i)throw TypeError("request must be specified");var a=this||_global;if(!n)return r.asPromise(t,a,o,e,l,i);if(!a.rpcImpl){setTimeout((function(){n(Error("already ended"))}),0);return undefined$1}try{return a.rpcImpl(o,e[a.requestDelimited?"encodeDelimited":"encode"](i).finish(),(function(t,e){if(t){a.emit("error",t,o);return n(t)}if(e===null){a.end(true);return undefined$1}if(!(e instanceof l))try{e=l[a.responseDelimited?"decodeDelimited":"decode"](e)}catch(t){a.emit("error",t,o);return n(t)}a.emit("data",e,o);return n(null,e)}))}catch(t){a.emit("error",t,o);setTimeout((function(){n(t)}),0);return undefined$1}};
/**
       * Ends this service and emits the `end` event.
       * @param {boolean} [endedByRPC=false] Whether the service has been ended by the RPC implementation.
       * @returns {rpc.Service} `this`
       */l.prototype.end=function(t){if((this||_global).rpcImpl){t||this.rpcImpl(null,null,null);(this||_global).rpcImpl=null;this.emit("end").off()}return this||_global}},{15:15}],14:[function(t,o,e){o.exports=l;var r=t(15);
/**
       * Constructs new long bits.
       * @classdesc Helper class for working with the low and high bits of a 64 bit value.
       * @memberof util
       * @constructor
       * @param {number} lo Low 32 bits, unsigned
       * @param {number} hi High 32 bits, unsigned
       */function l(t,o){
/**
         * Low bits.
         * @type {number}
         */
(this||_global).lo=t>>>0;
/**
         * High bits.
         * @type {number}
         */(this||_global).hi=o>>>0}
/**
       * Zero bits.
       * @memberof util.LongBits
       * @type {util.LongBits}
       */var i=l.zero=new l(0,0);i.toNumber=function(){return 0};i.zzEncode=i.zzDecode=function(){return this||_global};i.length=function(){return 1};
/**
       * Zero hash.
       * @memberof util.LongBits
       * @type {string}
       */var n=l.zeroHash="\0\0\0\0\0\0\0\0";
/**
       * Constructs new long bits from the specified number.
       * @param {number} value Value
       * @returns {util.LongBits} Instance
       */l.fromNumber=function(t){if(t===0)return i;var o=t<0;o&&(t=-t);var e=t>>>0,r=(t-e)/4294967296>>>0;if(o){r=~r>>>0;e=~e>>>0;if(++e>4294967295){e=0;++r>4294967295&&(r=0)}}return new l(e,r)};
/**
       * Constructs new long bits from a number, long or string.
       * @param {Long|number|string} value Value
       * @returns {util.LongBits} Instance
       */l.from=function(t){if(typeof t==="number")return l.fromNumber(t);if(r.isString(t)){if(!r.Long)return l.fromNumber(parseInt(t,10));t=r.Long.fromString(t)}return t.low||t.high?new l(t.low>>>0,t.high>>>0):i};
/**
       * Converts this long bits to a possibly unsafe JavaScript number.
       * @param {boolean} [unsigned=false] Whether unsigned or not
       * @returns {number} Possibly unsafe number
       */l.prototype.toNumber=function(t){if(!t&&(this||_global).hi>>>31){var o=1+~(this||_global).lo>>>0,e=~(this||_global).hi>>>0;o||(e=e+1>>>0);return-(o+e*4294967296)}return(this||_global).lo+(this||_global).hi*4294967296};
/**
       * Converts this long bits to a long.
       * @param {boolean} [unsigned=false] Whether unsigned or not
       * @returns {Long} Long
       */l.prototype.toLong=function(t){return r.Long?new r.Long((this||_global).lo|0,(this||_global).hi|0,Boolean(t)):{low:(this||_global).lo|0,high:(this||_global).hi|0,unsigned:Boolean(t)}};var a=String.prototype.charCodeAt;
/**
       * Constructs new long bits from the specified 8 characters long hash.
       * @param {string} hash Hash
       * @returns {util.LongBits} Bits
       */l.fromHash=function(t){return t===n?i:new l((a.call(t,0)|a.call(t,1)<<8|a.call(t,2)<<16|a.call(t,3)<<24)>>>0,(a.call(t,4)|a.call(t,5)<<8|a.call(t,6)<<16|a.call(t,7)<<24)>>>0)};
/**
       * Converts this long bits to a 8 characters long hash.
       * @returns {string} Hash
       */l.prototype.toHash=function(){return String.fromCharCode((this||_global).lo&255,(this||_global).lo>>>8&255,(this||_global).lo>>>16&255,(this||_global).lo>>>24,(this||_global).hi&255,(this||_global).hi>>>8&255,(this||_global).hi>>>16&255,(this||_global).hi>>>24)};
/**
       * Zig-zag encodes this long bits.
       * @returns {util.LongBits} `this`
       */l.prototype.zzEncode=function(){var t=(this||_global).hi>>31;(this||_global).hi=(((this||_global).hi<<1|(this||_global).lo>>>31)^t)>>>0;(this||_global).lo=((this||_global).lo<<1^t)>>>0;return this||_global};
/**
       * Zig-zag decodes this long bits.
       * @returns {util.LongBits} `this`
       */l.prototype.zzDecode=function(){var t=-((this||_global).lo&1);(this||_global).lo=(((this||_global).lo>>>1|(this||_global).hi<<31)^t)>>>0;(this||_global).hi=((this||_global).hi>>>1^t)>>>0;return this||_global};
/**
       * Calculates the length of this longbits when encoded as a varint.
       * @returns {number} Length
       */l.prototype.length=function(){var t=(this||_global).lo,o=((this||_global).lo>>>28|(this||_global).hi<<4)>>>0,e=(this||_global).hi>>>24;return e===0?o===0?t<16384?t<128?1:2:t<2097152?3:4:o<16384?o<128?5:6:o<2097152?7:8:e<128?9:10}},{15:15}],15:[function(t,o,e){var r=e;r.asPromise=t(1);r.base64=t(2);r.EventEmitter=t(3);r.float=t(4);r.inquire=t(5);r.utf8=t(7);r.pool=t(6);r.LongBits=t(14);
/**
       * Whether running within node or not.
       * @memberof util
       * @type {boolean}
       */r.isNode=Boolean(typeof _global!=="undefined"&&_global&&_global.process&&_global.process.versions&&_global.process.versions.node);
/**
       * Global object reference.
       * @memberof util
       * @type {Object}
       */r.global=r.isNode&&_global||typeof window!=="undefined"&&window||typeof self!=="undefined"&&self||this||_global;
/**
       * An immuable empty array.
       * @memberof util
       * @type {Array.<*>}
       * @const
       */r.emptyArray=Object.freeze?Object.freeze([]):[];
/**
       * An immutable empty object.
       * @type {Object}
       * @const
       */r.emptyObject=Object.freeze?Object.freeze({}):{};
/**
       * Tests if the specified value is an integer.
       * @function
       * @param {*} value Value to test
       * @returns {boolean} `true` if the value is an integer
       */r.isInteger=Number.isInteger||function(t){return typeof t==="number"&&isFinite(t)&&Math.floor(t)===t};
/**
       * Tests if the specified value is a string.
       * @param {*} value Value to test
       * @returns {boolean} `true` if the value is a string
       */r.isString=function(t){return typeof t==="string"||t instanceof String};
/**
       * Tests if the specified value is a non-null object.
       * @param {*} value Value to test
       * @returns {boolean} `true` if the value is a non-null object
       */r.isObject=function(t){return t&&typeof t==="object"};
/**
       * Checks if a property on a message is considered to be present.
       * This is an alias of {@link util.isSet}.
       * @function
       * @param {Object} obj Plain object or message instance
       * @param {string} prop Property name
       * @returns {boolean} `true` if considered to be present, otherwise `false`
       */r.isset=
/**
       * Checks if a property on a message is considered to be present.
       * @param {Object} obj Plain object or message instance
       * @param {string} prop Property name
       * @returns {boolean} `true` if considered to be present, otherwise `false`
       */
r.isSet=function(t,o){var e=t[o];return!(e==null||!t.hasOwnProperty(o))&&(typeof e!=="object"||(Array.isArray(e)?e.length:Object.keys(e).length)>0)};
/**
       * Node's Buffer class if available.
       * @type {Constructor<Buffer>}
       */r.Buffer=function(){try{var t=r.inquire("buffer").Buffer;return t.prototype.utf8Write?t:null}catch(t){return null}}();r._Buffer_from=null;r._Buffer_allocUnsafe=null;
/**
       * Creates a new buffer of whatever type supported by the environment.
       * @param {number|number[]} [sizeOrArray=0] Buffer size or number array
       * @returns {Uint8Array|Buffer} Buffer
       */r.newBuffer=function(t){return typeof t==="number"?r.Buffer?r._Buffer_allocUnsafe(t):new r.Array(t):r.Buffer?r._Buffer_from(t):typeof Uint8Array==="undefined"?t:new Uint8Array(t)};
/**
       * Array implementation used in the browser. `Uint8Array` if supported, otherwise `Array`.
       * @type {Constructor<Uint8Array>}
       */r.Array=typeof Uint8Array!=="undefined"?Uint8Array:Array;
/**
       * Long.js's Long class if available.
       * @type {Constructor<Long>}
       */r.Long=r.global.dcodeIO&&r.global.dcodeIO.Long||r.global.Long||r.inquire("long");
/**
       * Regular expression used to verify 2 bit (`bool`) map keys.
       * @type {RegExp}
       * @const
       */r.key2Re=/^true|false|0|1$/;
/**
       * Regular expression used to verify 32 bit (`int32` etc.) map keys.
       * @type {RegExp}
       * @const
       */r.key32Re=/^-?(?:0|[1-9][0-9]*)$/;
/**
       * Regular expression used to verify 64 bit (`int64` etc.) map keys.
       * @type {RegExp}
       * @const
       */r.key64Re=/^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/;
/**
       * Converts a number or long to an 8 characters long hash string.
       * @param {Long|number} value Value to convert
       * @returns {string} Hash
       */r.longToHash=function(t){return t?r.LongBits.from(t).toHash():r.LongBits.zeroHash};
/**
       * Converts an 8 characters long hash string to a long or number.
       * @param {string} hash Hash
       * @param {boolean} [unsigned=false] Whether unsigned or not
       * @returns {Long|number} Original value
       */r.longFromHash=function(t,o){var e=r.LongBits.fromHash(t);return r.Long?r.Long.fromBits(e.lo,e.hi,o):e.toNumber(Boolean(o))};
/**
       * Merges the properties of the source object into the destination object.
       * @memberof util
       * @param {Object.<string,*>} dst Destination object
       * @param {Object.<string,*>} src Source object
       * @param {boolean} [ifNotSet=false] Merges only if the key is not already set
       * @returns {Object.<string,*>} Destination object
       */function l(t,o,e){for(var r=Object.keys(o),l=0;l<r.length;++l)t[r[l]]!==undefined$1&&e||(t[r[l]]=o[r[l]]);return t}r.merge=l;
/**
       * Converts the first character of a string to lower case.
       * @param {string} str String to convert
       * @returns {string} Converted string
       */r.lcFirst=function(t){return t.charAt(0).toLowerCase()+t.substring(1)};
/**
       * Creates a custom error constructor.
       * @memberof util
       * @param {string} name Error name
       * @returns {Constructor<Error>} Custom error constructor
       */function i(t){function o(t,e){if(!((this||_global)instanceof o))return new o(t,e);Object.defineProperty(this||_global,"message",{get:function(){return t}});Error.captureStackTrace?Error.captureStackTrace(this||_global,o):Object.defineProperty(this||_global,"stack",{value:(new Error).stack||""});e&&l(this||_global,e)}o.prototype=Object.create(Error.prototype,{constructor:{value:o,writable:true,enumerable:false,configurable:true},name:{get:function(){return t},set:undefined$1,enumerable:false,configurable:true},toString:{value:function(){return(this||_global).name+": "+(this||_global).message},writable:true,enumerable:false,configurable:true}});return o}r.newError=i;
/**
       * Constructs a new protocol error.
       * @classdesc Error subclass indicating a protocol specifc error.
       * @memberof util
       * @extends Error
       * @template T extends Message<T>
       * @constructor
       * @param {string} message Error message
       * @param {Object.<string,*>} [properties] Additional properties
       * @example
       * try {
       *     MyMessage.decode(someBuffer); // throws if required fields are missing
       * } catch (e) {
       *     if (e instanceof ProtocolError && e.instance)
       *         console.log("decoded so far: " + JSON.stringify(e.instance));
       * }
       */r.ProtocolError=i("ProtocolError");
/**
       * So far decoded message instance.
       * @name util.ProtocolError#instance
       * @type {Message<T>}
       */
/**
       * A OneOf getter as returned by {@link util.oneOfGetter}.
       * @typedef OneOfGetter
       * @type {function}
       * @returns {string|undefined} Set field name, if any
       */
/**
       * Builds a getter for a oneof's present field name.
       * @param {string[]} fieldNames Field names
       * @returns {OneOfGetter} Unbound getter
       */r.oneOfGetter=function(t){var o={};for(var e=0;e<t.length;++e)o[t[e]]=1;
/**
         * @returns {string|undefined} Set field name, if any
         * @this Object
         * @ignore
         */return function(){for(var t=Object.keys(this||_global),e=t.length-1;e>-1;--e)if(o[t[e]]===1&&(this||_global)[t[e]]!==undefined$1&&(this||_global)[t[e]]!==null)return t[e]}};
/**
       * A OneOf setter as returned by {@link util.oneOfSetter}.
       * @typedef OneOfSetter
       * @type {function}
       * @param {string|undefined} value Field name
       * @returns {undefined}
       */
/**
       * Builds a setter for a oneof's present field name.
       * @param {string[]} fieldNames Field names
       * @returns {OneOfSetter} Unbound setter
       */r.oneOfSetter=function(t){
/**
         * @param {string} name Field name
         * @returns {undefined}
         * @this Object
         * @ignore
         */
return function(o){for(var e=0;e<t.length;++e)t[e]!==o&&delete(this||_global)[t[e]]}};
/**
       * Default conversion options used for {@link Message#toJSON} implementations.
       *
       * These options are close to proto3's JSON mapping with the exception that internal types like Any are handled just like messages. More precisely:
       *
       * - Longs become strings
       * - Enums become string keys
       * - Bytes become base64 encoded strings
       * - (Sub-)Messages become plain objects
       * - Maps become plain objects with all string keys
       * - Repeated fields become arrays
       * - NaN and Infinity for float and double fields become strings
       *
       * @type {IConversionOptions}
       * @see https://developers.google.com/protocol-buffers/docs/proto3?hl=en#json
       */r.toJSONOptions={longs:String,enums:String,bytes:String,json:true};r._configure=function(){var t=r.Buffer;if(t){r._Buffer_from=t.from!==Uint8Array.from&&t.from||function(o,e){return new t(o,e)};r._Buffer_allocUnsafe=t.allocUnsafe||function(o){return new t(o)}}else r._Buffer_from=r._Buffer_allocUnsafe=null}},{1:1,14:14,2:2,3:3,4:4,5:5,6:6,7:7}],16:[function(t,o,e){o.exports=h;var r=t(15);var l;var i=r.LongBits,n=r.base64,a=r.utf8;
/**
       * Constructs a new writer operation instance.
       * @classdesc Scheduled writer operation.
       * @constructor
       * @param {function(*, Uint8Array, number)} fn Function to call
       * @param {number} len Value byte length
       * @param {*} val Value to write
       * @ignore
       */function s(t,o,e){
/**
         * Function to call.
         * @type {function(Uint8Array, number, *)}
         */
(this||_global).fn=t;
/**
         * Value byte length.
         * @type {number}
         */(this||_global).len=o;
/**
         * Next operation.
         * @type {Writer.Op|undefined}
         */(this||_global).next=undefined$1;
/**
         * Value to write.
         * @type {*}
         */(this||_global).val=e}function u(){}
/**
       * Constructs a new writer state instance.
       * @classdesc Copied writer state.
       * @memberof Writer
       * @constructor
       * @param {Writer} writer Writer to copy state from
       * @ignore
       */function f(t){
/**
         * Current head.
         * @type {Writer.Op}
         */
(this||_global).head=t.head;
/**
         * Current tail.
         * @type {Writer.Op}
         */(this||_global).tail=t.tail;
/**
         * Current buffer length.
         * @type {number}
         */(this||_global).len=t.len;
/**
         * Next state.
         * @type {State|null}
         */(this||_global).next=t.states}function h(){
/**
         * Current length.
         * @type {number}
         */
(this||_global).len=0;
/**
         * Operations head.
         * @type {Object}
         */(this||_global).head=new s(u,0,0);
/**
         * Operations tail
         * @type {Object}
         */(this||_global).tail=(this||_global).head;
/**
         * Linked forked states.
         * @type {Object|null}
         */(this||_global).states=null}var b=function(){return r.Buffer?function(){return(h.create=function(){return new l})()}:function(){return new h}};
/**
       * Creates a new writer.
       * @function
       * @returns {BufferWriter|Writer} A {@link BufferWriter} when Buffers are supported, otherwise a {@link Writer}
       */h.create=b();
/**
       * Allocates a buffer of the specified size.
       * @param {number} size Buffer size
       * @returns {Uint8Array} Buffer
       */h.alloc=function(t){return new r.Array(t)};r.Array!==Array&&(h.alloc=r.pool(h.alloc,r.Array.prototype.subarray))
/**
       * Pushes a new operation to the queue.
       * @param {function(Uint8Array, number, *)} fn Function to call
       * @param {number} len Value byte length
       * @param {number} val Value to write
       * @returns {Writer} `this`
       * @private
       */;h.prototype._push=function(t,o,e){(this||_global).tail=(this||_global).tail.next=new s(t,o,e);(this||_global).len+=o;return this||_global};function g(t,o,e){o[e]=t&255}function c(t,o,e){while(t>127){o[e++]=t&127|128;t>>>=7}o[e]=t}
/**
       * Constructs a new varint writer operation instance.
       * @classdesc Scheduled varint writer operation.
       * @extends Op
       * @constructor
       * @param {number} len Value byte length
       * @param {number} val Value to write
       * @ignore
       */function p(t,o){(this||_global).len=t;(this||_global).next=undefined$1;(this||_global).val=o}p.prototype=Object.create(s.prototype);p.prototype.fn=c;
/**
       * Writes an unsigned 32 bit value as a varint.
       * @param {number} value Value to write
       * @returns {Writer} `this`
       */h.prototype.uint32=function(t){(this||_global).len+=((this||_global).tail=(this||_global).tail.next=new p((t>>>=0)<128?1:t<16384?2:t<2097152?3:t<268435456?4:5,t)).len;return this||_global};
/**
       * Writes a signed 32 bit value as a varint.
       * @function
       * @param {number} value Value to write
       * @returns {Writer} `this`
       */h.prototype.int32=function(t){return t<0?this._push(_,10,i.fromNumber(t)):this.uint32(t)};
/**
       * Writes a 32 bit value as a varint, zig-zag encoded.
       * @param {number} value Value to write
       * @returns {Writer} `this`
       */h.prototype.sint32=function(t){return this.uint32((t<<1^t>>31)>>>0)};function _(t,o,e){while(t.hi){o[e++]=t.lo&127|128;t.lo=(t.lo>>>7|t.hi<<25)>>>0;t.hi>>>=7}while(t.lo>127){o[e++]=t.lo&127|128;t.lo=t.lo>>>7}o[e++]=t.lo}
/**
       * Writes an unsigned 64 bit value as a varint.
       * @param {Long|number|string} value Value to write
       * @returns {Writer} `this`
       * @throws {TypeError} If `value` is a string and no long library is present.
       */h.prototype.uint64=function(t){var o=i.from(t);return this._push(_,o.length(),o)};
/**
       * Writes a signed 64 bit value as a varint.
       * @function
       * @param {Long|number|string} value Value to write
       * @returns {Writer} `this`
       * @throws {TypeError} If `value` is a string and no long library is present.
       */h.prototype.int64=h.prototype.uint64;
/**
       * Writes a signed 64 bit value as a varint, zig-zag encoded.
       * @param {Long|number|string} value Value to write
       * @returns {Writer} `this`
       * @throws {TypeError} If `value` is a string and no long library is present.
       */h.prototype.sint64=function(t){var o=i.from(t).zzEncode();return this._push(_,o.length(),o)};
/**
       * Writes a boolish value as a varint.
       * @param {boolean} value Value to write
       * @returns {Writer} `this`
       */h.prototype.bool=function(t){return this._push(g,1,t?1:0)};function d(t,o,e){o[e]=t&255;o[e+1]=t>>>8&255;o[e+2]=t>>>16&255;o[e+3]=t>>>24}
/**
       * Writes an unsigned 32 bit value as fixed 32 bits.
       * @param {number} value Value to write
       * @returns {Writer} `this`
       */h.prototype.fixed32=function(t){return this._push(d,4,t>>>0)};
/**
       * Writes a signed 32 bit value as fixed 32 bits.
       * @function
       * @param {number} value Value to write
       * @returns {Writer} `this`
       */h.prototype.sfixed32=h.prototype.fixed32;
/**
       * Writes an unsigned 64 bit value as fixed 64 bits.
       * @param {Long|number|string} value Value to write
       * @returns {Writer} `this`
       * @throws {TypeError} If `value` is a string and no long library is present.
       */h.prototype.fixed64=function(t){var o=i.from(t);return this._push(d,4,o.lo)._push(d,4,o.hi)};
/**
       * Writes a signed 64 bit value as fixed 64 bits.
       * @function
       * @param {Long|number|string} value Value to write
       * @returns {Writer} `this`
       * @throws {TypeError} If `value` is a string and no long library is present.
       */h.prototype.sfixed64=h.prototype.fixed64;
/**
       * Writes a float (32 bit).
       * @function
       * @param {number} value Value to write
       * @returns {Writer} `this`
       */h.prototype.float=function(t){return this._push(r.float.writeFloatLE,4,t)};
/**
       * Writes a double (64 bit float).
       * @function
       * @param {number} value Value to write
       * @returns {Writer} `this`
       */h.prototype.double=function(t){return this._push(r.float.writeDoubleLE,8,t)};var y=r.Array.prototype.set?function(t,o,e){o.set(t,e)}:function(t,o,e){for(var r=0;r<t.length;++r)o[e+r]=t[r]};
/**
       * Writes a sequence of bytes.
       * @param {Uint8Array|string} value Buffer or base64 encoded string to write
       * @returns {Writer} `this`
       */h.prototype.bytes=function(t){var o=t.length>>>0;if(!o)return this._push(g,1,0);if(r.isString(t)){var e=h.alloc(o=n.length(t));n.decode(t,e,0);t=e}return this.uint32(o)._push(y,o,t)};
/**
       * Writes a string.
       * @param {string} value Value to write
       * @returns {Writer} `this`
       */h.prototype.string=function(t){var o=a.length(t);return o?this.uint32(o)._push(a.write,o,t):this._push(g,1,0)};
/**
       * Forks this writer's state by pushing it to a stack.
       * Calling {@link Writer#reset|reset} or {@link Writer#ldelim|ldelim} resets the writer to the previous state.
       * @returns {Writer} `this`
       */h.prototype.fork=function(){(this||_global).states=new f(this||_global);(this||_global).head=(this||_global).tail=new s(u,0,0);(this||_global).len=0;return this||_global};
/**
       * Resets this instance to the last state.
       * @returns {Writer} `this`
       */h.prototype.reset=function(){if((this||_global).states){(this||_global).head=(this||_global).states.head;(this||_global).tail=(this||_global).states.tail;(this||_global).len=(this||_global).states.len;(this||_global).states=(this||_global).states.next}else{(this||_global).head=(this||_global).tail=new s(u,0,0);(this||_global).len=0}return this||_global};
/**
       * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
       * @returns {Writer} `this`
       */h.prototype.ldelim=function(){var t=(this||_global).head,o=(this||_global).tail,e=(this||_global).len;this.reset().uint32(e);if(e){(this||_global).tail.next=t.next;(this||_global).tail=o;(this||_global).len+=e}return this||_global};
/**
       * Finishes the write operation.
       * @returns {Uint8Array} Finished buffer
       */h.prototype.finish=function(){var t=(this||_global).head.next,o=(this||_global).constructor.alloc((this||_global).len),e=0;while(t){t.fn(t.val,o,e);e+=t.len;t=t.next}return o};h._configure=function(t){l=t;h.create=b();l._configure()}},{15:15}],17:[function(t,o,e){o.exports=i;var r=t(16);(i.prototype=Object.create(r.prototype)).constructor=i;var l=t(15);function i(){r.call(this||_global)}i._configure=function(){
/**
         * Allocates a buffer of the specified size.
         * @function
         * @param {number} size Buffer size
         * @returns {Buffer} Buffer
         */
i.alloc=l._Buffer_allocUnsafe;i.writeBytesBuffer=l.Buffer&&l.Buffer.prototype instanceof Uint8Array&&l.Buffer.prototype.set.name==="set"?function(t,o,e){o.set(t,e)}:function(t,o,e){if(t.copy)t.copy(o,e,0,t.length);else for(var r=0;r<t.length;)o[e++]=t[r++]}};i.prototype.bytes=function(t){l.isString(t)&&(t=l._Buffer_from(t,"base64"));var o=t.length>>>0;this.uint32(o);o&&this._push(i.writeBytesBuffer,o,t);return this||_global};function n(t,o,e){t.length<40?l.utf8.write(t,o,e):o.utf8Write?o.utf8Write(t,e):o.write(t,e)}i.prototype.string=function(t){var o=l.Buffer.byteLength(t);this.uint32(o);o&&this._push(n,o,t);return this||_global};
/**
       * Finishes the write operation.
       * @name BufferWriter#finish
       * @function
       * @returns {Buffer} Finished buffer
       */i._configure()},{15:15,16:16}]},{},[8])})();var protobuf=module.exports;const writeFloatLE=module.exports.writeFloatLE,writeFloatBE=module.exports.writeFloatBE,readFloatLE=module.exports.readFloatLE,readFloatBE=module.exports.readFloatBE,writeDoubleLE=module.exports.writeDoubleLE,writeDoubleBE=module.exports.writeDoubleBE,readDoubleLE=module.exports.readDoubleLE,readDoubleBE=module.exports.readDoubleBE;export{protobuf as default,readDoubleBE,readDoubleLE,readFloatBE,readFloatLE,writeDoubleBE,writeDoubleLE,writeFloatBE,writeFloatLE};

