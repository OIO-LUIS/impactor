// jsep@1.4.0 downloaded from https://ga.jspm.io/npm:jsep@1.4.0/dist/jsep.js

class Hooks{
/**
	 * @callback HookCallback
	 * @this {*|Jsep} this
	 * @param {Jsep} env
	 * @returns: void
	 */
/**
	 * Adds the given callback to the list of callbacks for the given hook.
	 *
	 * The callback will be invoked when the hook it is registered for is run.
	 *
	 * One callback function can be registered to multiple hooks and the same hook multiple times.
	 *
	 * @param {string|object} name The name of the hook, or an object of callbacks keyed by name
	 * @param {HookCallback|boolean} callback The callback function which is given environment variables.
	 * @param {?boolean} [first=false] Will add the hook to the top of the list (defaults to the bottom)
	 * @public
	 */
add(e,t,s){if(typeof arguments[0]!="string")for(let e in arguments[0])this.add(e,arguments[0][e],arguments[1]);else(Array.isArray(e)?e:[e]).forEach((function(e){this[e]=this[e]||[];t&&this[e][s?"unshift":"push"](t)}),this)}
/**
	 * Runs a hook invoking all registered callbacks with the given environment variables.
	 *
	 * Callbacks will be invoked synchronously and in the order in which they were registered.
	 *
	 * @param {string} name The name of the hook.
	 * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
	 * @public
	 */run(e,t){this[e]=this[e]||[];this[e].forEach((function(e){e.call(t&&t.context?t.context:t,t)}))}}class Plugins{constructor(e){this.jsep=e;this.registered={}}
/**
	 * @callback PluginSetup
	 * @this {Jsep} jsep
	 * @returns: void
	 */
/**
	 * Adds the given plugin(s) to the registry
	 *
	 * @param {object} plugins
	 * @param {string} plugins.name The name of the plugin
	 * @param {PluginSetup} plugins.init The init function
	 * @public
	 */register(...e){e.forEach((e=>{if(typeof e!=="object"||!e.name||!e.init)throw new Error("Invalid JSEP plugin format");if(!this.registered[e.name]){e.init(this.jsep);this.registered[e.name]=e}}))}}class Jsep{
/**
	 * @returns {string}
	 */
static get version(){return"1.4.0"}
/**
	 * @returns {string}
	 */static toString(){return"JavaScript Expression Parser (JSEP) v"+Jsep.version}
/**
	 * @method addUnaryOp
	 * @param {string} op_name The name of the unary op to add
	 * @returns {Jsep}
	 */
static addUnaryOp(e){Jsep.max_unop_len=Math.max(e.length,Jsep.max_unop_len);Jsep.unary_ops[e]=1;return Jsep}
/**
	 * @method jsep.addBinaryOp
	 * @param {string} op_name The name of the binary op to add
	 * @param {number} precedence The precedence of the binary op (can be a float). Higher number = higher precedence
	 * @param {boolean} [isRightAssociative=false] whether operator is right-associative
	 * @returns {Jsep}
	 */static addBinaryOp(e,t,s){Jsep.max_binop_len=Math.max(e.length,Jsep.max_binop_len);Jsep.binary_ops[e]=t;s?Jsep.right_associative.add(e):Jsep.right_associative.delete(e);return Jsep}
/**
	 * @method addIdentifierChar
	 * @param {string} char The additional character to treat as a valid part of an identifier
	 * @returns {Jsep}
	 */static addIdentifierChar(e){Jsep.additional_identifier_chars.add(e);return Jsep}
/**
	 * @method addLiteral
	 * @param {string} literal_name The name of the literal to add
	 * @param {*} literal_value The value of the literal
	 * @returns {Jsep}
	 */static addLiteral(e,t){Jsep.literals[e]=t;return Jsep}
/**
	 * @method removeUnaryOp
	 * @param {string} op_name The name of the unary op to remove
	 * @returns {Jsep}
	 */static removeUnaryOp(e){delete Jsep.unary_ops[e];e.length===Jsep.max_unop_len&&(Jsep.max_unop_len=Jsep.getMaxKeyLen(Jsep.unary_ops));return Jsep}
/**
	 * @method removeAllUnaryOps
	 * @returns {Jsep}
	 */static removeAllUnaryOps(){Jsep.unary_ops={};Jsep.max_unop_len=0;return Jsep}
/**
	 * @method removeIdentifierChar
	 * @param {string} char The additional character to stop treating as a valid part of an identifier
	 * @returns {Jsep}
	 */static removeIdentifierChar(e){Jsep.additional_identifier_chars.delete(e);return Jsep}
/**
	 * @method removeBinaryOp
	 * @param {string} op_name The name of the binary op to remove
	 * @returns {Jsep}
	 */static removeBinaryOp(e){delete Jsep.binary_ops[e];e.length===Jsep.max_binop_len&&(Jsep.max_binop_len=Jsep.getMaxKeyLen(Jsep.binary_ops));Jsep.right_associative.delete(e);return Jsep}
/**
	 * @method removeAllBinaryOps
	 * @returns {Jsep}
	 */static removeAllBinaryOps(){Jsep.binary_ops={};Jsep.max_binop_len=0;return Jsep}
/**
	 * @method removeLiteral
	 * @param {string} literal_name The name of the literal to remove
	 * @returns {Jsep}
	 */static removeLiteral(e){delete Jsep.literals[e];return Jsep}
/**
	 * @method removeAllLiterals
	 * @returns {Jsep}
	 */static removeAllLiterals(){Jsep.literals={};return Jsep}
/**
	 * @returns {string}
	 */
get char(){return this.expr.charAt(this.index)}
/**
	 * @returns {number}
	 */get code(){return this.expr.charCodeAt(this.index)}
/**
	 * @param {string} expr a string with the passed in express
	 * @returns Jsep
	 */
constructor(e){this.expr=e;this.index=0}
/**
	 * static top-level parser
	 * @returns {jsep.Expression}
	 */static parse(e){return new Jsep(e).parse()}
/**
	 * Get the longest key length of any object
	 * @param {object} obj
	 * @returns {number}
	 */static getMaxKeyLen(e){return Math.max(0,...Object.keys(e).map((e=>e.length)))}
/**
	 * `ch` is a character code in the next three functions
	 * @param {number} ch
	 * @returns {boolean}
	 */static isDecimalDigit(e){return e>=48&&e<=57}
/**
	 * Returns the precedence of a binary operator or `0` if it isn't a binary operator. Can be float.
	 * @param {string} op_val
	 * @returns {number}
	 */static binaryPrecedence(e){return Jsep.binary_ops[e]||0}
/**
	 * Looks for start of identifier
	 * @param {number} ch
	 * @returns {boolean}
	 */static isIdentifierStart(e){return e>=65&&e<=90||e>=97&&e<=122||e>=128&&!Jsep.binary_ops[String.fromCharCode(e)]||Jsep.additional_identifier_chars.has(String.fromCharCode(e))}
/**
	 * @param {number} ch
	 * @returns {boolean}
	 */static isIdentifierPart(e){return Jsep.isIdentifierStart(e)||Jsep.isDecimalDigit(e)}
/**
	 * throw error at index of the expression
	 * @param {string} message
	 * @throws
	 */throwError(e){const t=new Error(e+" at character "+this.index);t.index=this.index;t.description=e;throw t}
/**
	 * Run a given hook
	 * @param {string} name
	 * @param {jsep.Expression|false} [node]
	 * @returns {?jsep.Expression}
	 */runHook(e,t){if(Jsep.hooks[e]){const s={context:this,node:t};Jsep.hooks.run(e,s);return s.node}return t}
/**
	 * Runs a given hook until one returns a node
	 * @param {string} name
	 * @returns {?jsep.Expression}
	 */searchHook(e){if(Jsep.hooks[e]){const t={context:this};Jsep.hooks[e].find((function(e){e.call(t.context,t);return t.node}));return t.node}}gobbleSpaces(){let e=this.code;while(e===Jsep.SPACE_CODE||e===Jsep.TAB_CODE||e===Jsep.LF_CODE||e===Jsep.CR_CODE)e=this.expr.charCodeAt(++this.index);this.runHook("gobble-spaces")}
/**
	 * Top-level method to parse all expressions and returns compound or single node
	 * @returns {jsep.Expression}
	 */parse(){this.runHook("before-all");const e=this.gobbleExpressions();const t=e.length===1?e[0]:{type:Jsep.COMPOUND,body:e};return this.runHook("after-all",t)}
/**
	 * top-level parser (but can be reused within as well)
	 * @param {number} [untilICode]
	 * @returns {jsep.Expression[]}
	 */gobbleExpressions(e){let t,s,i=[];while(this.index<this.expr.length){t=this.code;if(t===Jsep.SEMCOL_CODE||t===Jsep.COMMA_CODE)this.index++;else if(s=this.gobbleExpression())i.push(s);else if(this.index<this.expr.length){if(t===e)break;this.throwError('Unexpected "'+this.char+'"')}}return i}
/**
	 * The main parsing function.
	 * @returns {?jsep.Expression}
	 */gobbleExpression(){const e=this.searchHook("gobble-expression")||this.gobbleBinaryExpression();this.gobbleSpaces();return this.runHook("after-expression",e)}
/**
	 * Search for the operation portion of the string (e.g. `+`, `===`)
	 * Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
	 * and move down from 3 to 2 to 1 character until a matching binary operation is found
	 * then, return that binary operation
	 * @returns {string|boolean}
	 */gobbleBinaryOp(){this.gobbleSpaces();let e=this.expr.substr(this.index,Jsep.max_binop_len);let t=e.length;while(t>0){if(Jsep.binary_ops.hasOwnProperty(e)&&(!Jsep.isIdentifierStart(this.code)||this.index+e.length<this.expr.length&&!Jsep.isIdentifierPart(this.expr.charCodeAt(this.index+e.length)))){this.index+=t;return e}e=e.substr(0,--t)}return false}
/**
	 * This function is responsible for gobbling an individual expression,
	 * e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
	 * @returns {?jsep.BinaryExpression}
	 */gobbleBinaryExpression(){let e,t,s,i,r,n,o,h,p;n=this.gobbleToken();if(!n)return n;t=this.gobbleBinaryOp();if(!t)return n;r={value:t,prec:Jsep.binaryPrecedence(t),right_a:Jsep.right_associative.has(t)};o=this.gobbleToken();o||this.throwError("Expected expression after "+t);i=[n,r,o];while(t=this.gobbleBinaryOp()){s=Jsep.binaryPrecedence(t);if(s===0){this.index-=t.length;break}r={value:t,prec:s,right_a:Jsep.right_associative.has(t)};p=t;const comparePrev=e=>r.right_a&&e.right_a?s>e.prec:s<=e.prec;while(i.length>2&&comparePrev(i[i.length-2])){o=i.pop();t=i.pop().value;n=i.pop();e={type:Jsep.BINARY_EXP,operator:t,left:n,right:o};i.push(e)}e=this.gobbleToken();e||this.throwError("Expected expression after "+p);i.push(r,e)}h=i.length-1;e=i[h];while(h>1){e={type:Jsep.BINARY_EXP,operator:i[h-1].value,left:i[h-2],right:e};h-=2}return e}
/**
	 * An individual part of a binary expression:
	 * e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
	 * @returns {boolean|jsep.Expression}
	 */gobbleToken(){let e,t,s,i;this.gobbleSpaces();i=this.searchHook("gobble-token");if(i)return this.runHook("after-token",i);e=this.code;if(Jsep.isDecimalDigit(e)||e===Jsep.PERIOD_CODE)return this.gobbleNumericLiteral();if(e===Jsep.SQUOTE_CODE||e===Jsep.DQUOTE_CODE)i=this.gobbleStringLiteral();else if(e===Jsep.OBRACK_CODE)i=this.gobbleArray();else{t=this.expr.substr(this.index,Jsep.max_unop_len);s=t.length;while(s>0){if(Jsep.unary_ops.hasOwnProperty(t)&&(!Jsep.isIdentifierStart(this.code)||this.index+t.length<this.expr.length&&!Jsep.isIdentifierPart(this.expr.charCodeAt(this.index+t.length)))){this.index+=s;const e=this.gobbleToken();e||this.throwError("missing unaryOp argument");return this.runHook("after-token",{type:Jsep.UNARY_EXP,operator:t,argument:e,prefix:true})}t=t.substr(0,--s)}if(Jsep.isIdentifierStart(e)){i=this.gobbleIdentifier();Jsep.literals.hasOwnProperty(i.name)?i={type:Jsep.LITERAL,value:Jsep.literals[i.name],raw:i.name}:i.name===Jsep.this_str&&(i={type:Jsep.THIS_EXP})}else e===Jsep.OPAREN_CODE&&(i=this.gobbleGroup())}if(!i)return this.runHook("after-token",false);i=this.gobbleTokenProperty(i);return this.runHook("after-token",i)}
/**
	 * Gobble properties of of identifiers/strings/arrays/groups.
	 * e.g. `foo`, `bar.baz`, `foo['bar'].baz`
	 * It also gobbles function calls:
	 * e.g. `Math.acos(obj.angle)`
	 * @param {jsep.Expression} node
	 * @returns {jsep.Expression}
	 */gobbleTokenProperty(e){this.gobbleSpaces();let t=this.code;while(t===Jsep.PERIOD_CODE||t===Jsep.OBRACK_CODE||t===Jsep.OPAREN_CODE||t===Jsep.QUMARK_CODE){let s;if(t===Jsep.QUMARK_CODE){if(this.expr.charCodeAt(this.index+1)!==Jsep.PERIOD_CODE)break;s=true;this.index+=2;this.gobbleSpaces();t=this.code}this.index++;if(t===Jsep.OBRACK_CODE){e={type:Jsep.MEMBER_EXP,computed:true,object:e,property:this.gobbleExpression()};e.property||this.throwError('Unexpected "'+this.char+'"');this.gobbleSpaces();t=this.code;t!==Jsep.CBRACK_CODE&&this.throwError("Unclosed [");this.index++}else if(t===Jsep.OPAREN_CODE)e={type:Jsep.CALL_EXP,arguments:this.gobbleArguments(Jsep.CPAREN_CODE),callee:e};else if(t===Jsep.PERIOD_CODE||s){s&&this.index--;this.gobbleSpaces();e={type:Jsep.MEMBER_EXP,computed:false,object:e,property:this.gobbleIdentifier()}}s&&(e.optional=true);this.gobbleSpaces();t=this.code}return e}
/**
	 * Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
	 * keep track of everything in the numeric literal and then calling `parseFloat` on that string
	 * @returns {jsep.Literal}
	 */gobbleNumericLiteral(){let e,t,s="";while(Jsep.isDecimalDigit(this.code))s+=this.expr.charAt(this.index++);if(this.code===Jsep.PERIOD_CODE){s+=this.expr.charAt(this.index++);while(Jsep.isDecimalDigit(this.code))s+=this.expr.charAt(this.index++)}e=this.char;if(e==="e"||e==="E"){s+=this.expr.charAt(this.index++);e=this.char;e!=="+"&&e!=="-"||(s+=this.expr.charAt(this.index++));while(Jsep.isDecimalDigit(this.code))s+=this.expr.charAt(this.index++);Jsep.isDecimalDigit(this.expr.charCodeAt(this.index-1))||this.throwError("Expected exponent ("+s+this.char+")")}t=this.code;Jsep.isIdentifierStart(t)?this.throwError("Variable names cannot start with a number ("+s+this.char+")"):(t===Jsep.PERIOD_CODE||s.length===1&&s.charCodeAt(0)===Jsep.PERIOD_CODE)&&this.throwError("Unexpected period");return{type:Jsep.LITERAL,value:parseFloat(s),raw:s}}
/**
	 * Parses a string literal, staring with single or double quotes with basic support for escape codes
	 * e.g. `"hello world"`, `'this is\nJSEP'`
	 * @returns {jsep.Literal}
	 */gobbleStringLiteral(){let e="";const t=this.index;const s=this.expr.charAt(this.index++);let i=false;while(this.index<this.expr.length){let t=this.expr.charAt(this.index++);if(t===s){i=true;break}if(t==="\\"){t=this.expr.charAt(this.index++);switch(t){case"n":e+="\n";break;case"r":e+="\r";break;case"t":e+="\t";break;case"b":e+="\b";break;case"f":e+="\f";break;case"v":e+="\v";break;default:e+=t}}else e+=t}i||this.throwError('Unclosed quote after "'+e+'"');return{type:Jsep.LITERAL,value:e,raw:this.expr.substring(t,this.index)}}
/**
	 * Gobbles only identifiers
	 * e.g.: `foo`, `_value`, `$x1`
	 * Also, this function checks if that identifier is a literal:
	 * (e.g. `true`, `false`, `null`) or `this`
	 * @returns {jsep.Identifier}
	 */gobbleIdentifier(){let e=this.code,t=this.index;Jsep.isIdentifierStart(e)?this.index++:this.throwError("Unexpected "+this.char);while(this.index<this.expr.length){e=this.code;if(!Jsep.isIdentifierPart(e))break;this.index++}return{type:Jsep.IDENTIFIER,name:this.expr.slice(t,this.index)}}
/**
	 * Gobbles a list of arguments within the context of a function call
	 * or array literal. This function also assumes that the opening character
	 * `(` or `[` has already been gobbled, and gobbles expressions and commas
	 * until the terminator character `)` or `]` is encountered.
	 * e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
	 * @param {number} termination
	 * @returns {jsep.Expression[]}
	 */gobbleArguments(e){const t=[];let s=false;let i=0;while(this.index<this.expr.length){this.gobbleSpaces();let r=this.code;if(r===e){s=true;this.index++;e===Jsep.CPAREN_CODE&&i&&i>=t.length&&this.throwError("Unexpected token "+String.fromCharCode(e));break}if(r===Jsep.COMMA_CODE){this.index++;i++;if(i!==t.length)if(e===Jsep.CPAREN_CODE)this.throwError("Unexpected token ,");else if(e===Jsep.CBRACK_CODE)for(let e=t.length;e<i;e++)t.push(null)}else if(t.length!==i&&i!==0)this.throwError("Expected comma");else{const e=this.gobbleExpression();e&&e.type!==Jsep.COMPOUND||this.throwError("Expected comma");t.push(e)}}s||this.throwError("Expected "+String.fromCharCode(e));return t}
/**
	 * Responsible for parsing a group of things within parentheses `()`
	 * that have no identifier in front (so not a function call)
	 * This function assumes that it needs to gobble the opening parenthesis
	 * and then tries to gobble everything within that parenthesis, assuming
	 * that the next thing it should see is the close parenthesis. If not,
	 * then the expression probably doesn't have a `)`
	 * @returns {boolean|jsep.Expression}
	 */gobbleGroup(){this.index++;let e=this.gobbleExpressions(Jsep.CPAREN_CODE);if(this.code===Jsep.CPAREN_CODE){this.index++;return e.length===1?e[0]:!!e.length&&{type:Jsep.SEQUENCE_EXP,expressions:e}}this.throwError("Unclosed (")}
/**
	 * Responsible for parsing Array literals `[1, 2, 3]`
	 * This function assumes that it needs to gobble the opening bracket
	 * and then tries to gobble the expressions as arguments.
	 * @returns {jsep.ArrayExpression}
	 */gobbleArray(){this.index++;return{type:Jsep.ARRAY_EXP,elements:this.gobbleArguments(Jsep.CBRACK_CODE)}}}const e=new Hooks;Object.assign(Jsep,{hooks:e,plugins:new Plugins(Jsep),COMPOUND:"Compound",SEQUENCE_EXP:"SequenceExpression",IDENTIFIER:"Identifier",MEMBER_EXP:"MemberExpression",LITERAL:"Literal",THIS_EXP:"ThisExpression",CALL_EXP:"CallExpression",UNARY_EXP:"UnaryExpression",BINARY_EXP:"BinaryExpression",ARRAY_EXP:"ArrayExpression",TAB_CODE:9,LF_CODE:10,CR_CODE:13,SPACE_CODE:32,PERIOD_CODE:46,COMMA_CODE:44,SQUOTE_CODE:39,DQUOTE_CODE:34,OPAREN_CODE:40,CPAREN_CODE:41,OBRACK_CODE:91,CBRACK_CODE:93,QUMARK_CODE:63,SEMCOL_CODE:59,COLON_CODE:58,unary_ops:{"-":1,"!":1,"~":1,"+":1},binary_ops:{"||":1,"??":1,"&&":2,"|":3,"^":4,"&":5,"==":6,"!=":6,"===":6,"!==":6,"<":7,">":7,"<=":7,">=":7,"<<":8,">>":8,">>>":8,"+":9,"-":9,"*":10,"/":10,"%":10,"**":11},right_associative:new Set(["**"]),additional_identifier_chars:new Set(["$","_"]),literals:{true:true,false:false,null:null},this_str:"this"});Jsep.max_unop_len=Jsep.getMaxKeyLen(Jsep.unary_ops);Jsep.max_binop_len=Jsep.getMaxKeyLen(Jsep.binary_ops);const jsep=e=>new Jsep(e).parse();const t=Object.getOwnPropertyNames(class Test{});Object.getOwnPropertyNames(Jsep).filter((e=>!t.includes(e)&&jsep[e]===void 0)).forEach((e=>{jsep[e]=Jsep[e]}));jsep.Jsep=Jsep;const s="ConditionalExpression";var i={name:"ternary",init(e){e.hooks.add("after-expression",(function gobbleTernary(t){if(t.node&&this.code===e.QUMARK_CODE){this.index++;const i=t.node;const r=this.gobbleExpression();r||this.throwError("Expected expression");this.gobbleSpaces();if(this.code===e.COLON_CODE){this.index++;const n=this.gobbleExpression();n||this.throwError("Expected expression");t.node={type:s,test:i,consequent:r,alternate:n};if(i.operator&&e.binary_ops[i.operator]<=.9){let s=i;while(s.right.operator&&e.binary_ops[s.right.operator]<=.9)s=s.right;t.node.test=s.right;s.right=t.node;t.node=i}}else this.throwError("Expected :")}}))}};jsep.plugins.register(i);export{Jsep,jsep as default};

