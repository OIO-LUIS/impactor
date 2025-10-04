// autolinker@4.1.5 downloaded from https://ga.jspm.io/npm:autolinker@4.1.5/dist/es2015/index.js

import{__extends as e,__assign as t,__spreadArray as a,__read as n}from"tslib";import{h as r,t as i,a as s,i as c,r as o}from"../../_/c6OZZOdk.js";import{truncateSmart as u}from"./truncate/truncate-smart.js";import{truncateMiddle as h}from"./truncate/truncate-middle.js";var l="4.1.5";var f=/\s+/;var p=function(){
/**
     * @method constructor
     * @param {Object} [cfg] The configuration properties for this class, in an Object (map)
     */
function e(e){e===void 0&&(e={});this.tagName="";this.attrs={};this.innerHTML="";this.tagName=e.tagName||"";this.attrs=e.attrs||{};this.innerHTML=e.innerHtml||e.innerHTML||""}
/**
     * Sets the tag name that will be used to generate the tag with.
     *
     * @param {String} tagName
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */e.prototype.setTagName=function(e){this.tagName=e;return this};e.prototype.getTagName=function(){return this.tagName};
/**
     * Sets an attribute on the HtmlTag.
     *
     * @param {String} attrName The attribute name to set.
     * @param {String} attrValue The attribute value to set.
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */e.prototype.setAttr=function(e,t){var a=this.getAttrs();a[e]=t;return this};
/**
     * Retrieves an attribute from the HtmlTag. If the attribute does not exist, returns `undefined`.
     *
     * @param {String} attrName The attribute name to retrieve.
     * @return {String} The attribute's value, or `undefined` if it does not exist on the HtmlTag.
     */e.prototype.getAttr=function(e){return this.getAttrs()[e]};
/**
     * Sets one or more attributes on the HtmlTag.
     *
     * @param {Object.<String, String>} attrs A key/value Object (map) of the attributes to set.
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */e.prototype.setAttrs=function(e){Object.assign(this.getAttrs(),e);return this};e.prototype.getAttrs=function(){return this.attrs};
/**
     * Sets the provided `cssClass`, overwriting any current CSS classes on the HtmlTag.
     *
     * @param {String} cssClass One or more space-separated CSS classes to set (overwrite).
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */e.prototype.setClass=function(e){return this.setAttr("class",e)};
/**
     * Convenience method to add one or more CSS classes to the HtmlTag. Will not add duplicate CSS classes.
     *
     * @param {String} cssClass One or more space-separated CSS classes to add.
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */e.prototype.addClass=function(e){var t=this.getClass();var a=t?t.split(f):[];var n=e.split(f);var r;while(r=n.shift())a.indexOf(r)===-1&&a.push(r);this.getAttrs().class=a.join(" ");return this};
/**
     * Convenience method to remove one or more CSS classes from the HtmlTag.
     *
     * @param {String} cssClass One or more space-separated CSS classes to remove.
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */e.prototype.removeClass=function(e){var t=this.getClass();var a=t?t.split(f):[];var n=e.split(f);var r;while(a.length&&(r=n.shift())){var i=a.indexOf(r);i!==-1&&a.splice(i,1)}this.getAttrs().class=a.join(" ");return this};e.prototype.getClass=function(){return this.getAttrs().class||""};
/**
     * Convenience method to check if the tag has a CSS class or not.
     *
     * @param {String} cssClass The CSS class to check for.
     * @return {Boolean} `true` if the HtmlTag has the CSS class, `false` otherwise.
     */e.prototype.hasClass=function(e){return(" "+this.getClass()+" ").indexOf(" "+e+" ")!==-1};
/**
     * Sets the inner HTML for the tag.
     *
     * @param {String} html The inner HTML to set.
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */e.prototype.setInnerHTML=function(e){this.innerHTML=e;return this};
/**
     * Backwards compatibility method name.
     *
     * @param {String} html The inner HTML to set.
     * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
     */e.prototype.setInnerHtml=function(e){return this.setInnerHTML(e)};e.prototype.getInnerHTML=function(){return this.innerHTML||""};e.prototype.getInnerHtml=function(){return this.getInnerHTML()};e.prototype.toAnchorString=function(){var e=this.getTagName();var t=this.buildAttrsStr();t=t?" "+t:"";return["<",e,t,">",this.getInnerHtml(),"</",e,">"].join("")};e.prototype.buildAttrsStr=function(){var e=this.getAttrs(),t=[];for(var a in e)r.call(e,a)&&t.push(a+'="'+e[a]+'"');return t.join(" ")};return e}();var g=function(){
/**
     * @method constructor
     * @param {Object} [cfg] The configuration options for the AnchorTagBuilder instance, specified in an Object (map).
     */
function e(e){e===void 0&&(e={});this.newWindow=false;this.truncate={};this.className="";this.newWindow=e.newWindow||false;this.truncate=e.truncate||{};this.className=e.className||""}
/**
     * Generates the actual anchor (&lt;a&gt;) tag to use in place of the
     * matched text, via its `match` object.
     *
     * @param match The Match instance to generate an anchor tag from.
     * @return The HtmlTag instance for the anchor tag.
     */e.prototype.build=function(e){return new p({tagName:"a",attrs:this.createAttrs(e),innerHtml:this.processAnchorText(e.getAnchorText())})};
/**
     * Creates the Object (map) of the HTML attributes for the anchor (&lt;a&gt;)
     *   tag being generated.
     *
     * @protected
     * @param match The Match instance to generate an anchor tag from.
     * @return A key/value Object (map) of the anchor tag's attributes.
     */e.prototype.createAttrs=function(e){var t={href:e.getAnchorHref()};var a=this.createCssClass(e);a&&(t.class=a);if(this.newWindow){t.target="_blank";t.rel="noopener noreferrer"}this.truncate.length&&this.truncate.length<e.getAnchorText().length&&(t.title=e.getAnchorHref());return t};
/**
     * Creates the CSS class that will be used for a given anchor tag, based on
     * the `matchType` and the {@link #className} config.
     *
     * Example returns:
     *
     * - ""                                      // no {@link #className}
     * - "myLink myLink-url"                     // url match
     * - "myLink myLink-email"                   // email match
     * - "myLink myLink-phone"                   // phone match
     * - "myLink myLink-hashtag"                 // hashtag match
     * - "myLink myLink-mention myLink-twitter"  // mention match with Twitter service
     *
     * @protected
     * @param match The Match instance to generate an
     *   anchor tag from.
     * @return The CSS class string for the link. Example return:
     *   "myLink myLink-url". If no {@link #className} was configured, returns
     *   an empty string.
     */e.prototype.createCssClass=function(e){var t=this.className;if(t){var a=[t],n=e.getCssClassSuffixes();for(var r=0,i=n.length;r<i;r++)a.push(t+"-"+n[r]);return a.join(" ")}return""};
/**
     * Processes the `anchorText` by truncating the text according to the
     * {@link #truncate} config.
     *
     * @private
     * @param anchorText The anchor tag's text (i.e. what will be
     *   displayed).
     * @return The processed `anchorText`.
     */e.prototype.processAnchorText=function(e){e=this.doTruncate(e);return e};
/**
     * Performs the truncation of the `anchorText` based on the {@link #truncate}
     * option. If the `anchorText` is longer than the length specified by the
     * {@link #truncate} option, the truncation is performed based on the
     * `location` property. See {@link #truncate} for details.
     *
     * @private
     * @param anchorText The anchor tag's text (i.e. what will be
     *   displayed).
     * @return The truncated anchor text.
     */e.prototype.doTruncate=function(e){var t=this.truncate;if(!t.length)return e;var a=t.length,n=t.location;return n==="smart"?u(e,a):n==="middle"?h(e,a):i(e,a)};return e}();var d=function(){
/**
     * @member Autolinker.match.Match
     * @method constructor
     * @param {Object} cfg The configuration properties for the Match
     *   instance, specified in an Object (map).
     */
function e(e){this._=null;this.matchedText="";this.offset=0;this.tagBuilder=e.tagBuilder;this.matchedText=e.matchedText;this.offset=e.offset}e.prototype.getMatchedText=function(){return this.matchedText};
/**
     * Sets the {@link #offset} of where the match was made in the input string.
     *
     * A {@link Autolinker.matcher.Matcher} will be fed only HTML text nodes,
     * and will therefore set an original offset that is relative to the HTML
     * text node itself. However, we want this offset to be relative to the full
     * HTML input string, and thus if using {@link Autolinker#parse} (rather
     * than calling a {@link Autolinker.matcher.Matcher} directly), then this
     * offset is corrected after the Matcher itself has done its job.
     *
     * @private
     * @param {Number} offset
     */e.prototype.setOffset=function(e){this.offset=e};e.prototype.getOffset=function(){return this.offset};e.prototype.getCssClassSuffixes=function(){return[this.type]};e.prototype.buildTag=function(){return this.tagBuilder.build(this)};return e}();function m(e){return e>=0&&e<=31||e==127}function b(e){return e>=65&&e<=90||e>=97&&e<=122}function x(e){return e>=48&&e<=57}function v(e){return e==34||e==39}function y(e){return e<8232?e<160?e>=9&&e<=13||e==32:e<5760?e==160:e==5760||e>=8192&&e<=8202:e<8287?e>=8232&&e<=8233||e==8239:e<12288?e==8287:e==12288||e==65279}function k(e){return e<4800?e<2949?e<2451?e<1425?e<768?e<192?e<169?e<65?e>=48&&e<=57:e>=65&&e<=90||e>=97&&e<=122:e<181?e>=169&&e<=170||e==174:e==181||e==186:e<710?e<216?e>=192&&e<=214:e>=216&&e<=246||e>=248&&e<=705:e<748?e>=710&&e<=721||e>=736&&e<=740:e==748||e==750:e<910?e<895?e<886?e>=768&&e<=884:e>=886&&e<=887||e>=890&&e<=893:e<904?e==895||e==902:e>=904&&e<=906||e==908:e<1155?e<931?e>=910&&e<=929:e>=931&&e<=1013||e>=1015&&e<=1153:e<1369?e>=1155&&e<=1327||e>=1329&&e<=1366:e==1369||e>=1377&&e<=1415:e<1808?e<1552?e<1476?e<1471?e>=1425&&e<=1469:e==1471||e>=1473&&e<=1474:e<1488?e>=1476&&e<=1477||e==1479:e>=1488&&e<=1514||e>=1520&&e<=1522:e<1749?e<1568?e>=1552&&e<=1562:e>=1568&&e<=1641||e>=1646&&e<=1747:e<1770?e>=1749&&e<=1756||e>=1759&&e<=1768:e>=1770&&e<=1788||e==1791:e<2230?e<2042?e<1869?e>=1808&&e<=1866:e>=1869&&e<=1969||e>=1984&&e<=2037:e<2112?e==2042||e>=2048&&e<=2093:e>=2112&&e<=2139||e>=2208&&e<=2228:e<2406?e<2260?e>=2230&&e<=2237:e>=2260&&e<=2273||e>=2275&&e<=2403:e<2437?e>=2406&&e<=2415||e>=2417&&e<=2435:e>=2437&&e<=2444||e>=2447&&e<=2448:e<2693?e<2579?e<2519?e<2486?e<2474?e>=2451&&e<=2472:e>=2474&&e<=2480||e==2482:e<2503?e>=2486&&e<=2489||e>=2492&&e<=2500:e>=2503&&e<=2504||e>=2507&&e<=2510:e<2534?e<2524?e==2519:e>=2524&&e<=2525||e>=2527&&e<=2531:e<2565?e>=2534&&e<=2545||e>=2561&&e<=2563:e>=2565&&e<=2570||e>=2575&&e<=2576:e<2631?e<2613?e<2602?e>=2579&&e<=2600:e>=2602&&e<=2608||e>=2610&&e<=2611:e<2620?e>=2613&&e<=2614||e>=2616&&e<=2617:e==2620||e>=2622&&e<=2626:e<2649?e<2635?e>=2631&&e<=2632:e>=2635&&e<=2637||e==2641:e<2662?e>=2649&&e<=2652||e==2654:e>=2662&&e<=2677||e>=2689&&e<=2691:e<2821?e<2759?e<2730?e<2703?e>=2693&&e<=2701:e>=2703&&e<=2705||e>=2707&&e<=2728:e<2741?e>=2730&&e<=2736||e>=2738&&e<=2739:e>=2741&&e<=2745||e>=2748&&e<=2757:e<2784?e<2763?e>=2759&&e<=2761:e>=2763&&e<=2765||e==2768:e<2809?e>=2784&&e<=2787||e>=2790&&e<=2799:e==2809||e>=2817&&e<=2819:e<2887?e<2858?e<2831?e>=2821&&e<=2828:e>=2831&&e<=2832||e>=2835&&e<=2856:e<2869?e>=2858&&e<=2864||e>=2866&&e<=2867:e>=2869&&e<=2873||e>=2876&&e<=2884:e<2911?e<2902?e>=2887&&e<=2888||e>=2891&&e<=2893:e>=2902&&e<=2903||e>=2908&&e<=2909:e<2929?e>=2911&&e<=2915||e>=2918&&e<=2927:e==2929||e>=2946&&e<=2947:e<3517?e<3205?e<3046?e<2984?e<2969?e<2958?e>=2949&&e<=2954:e>=2958&&e<=2960||e>=2962&&e<=2965:e<2974?e>=2969&&e<=2970||e==2972:e>=2974&&e<=2975||e>=2979&&e<=2980:e<3014?e<2990?e>=2984&&e<=2986:e>=2990&&e<=3001||e>=3006&&e<=3010:e<3024?e>=3014&&e<=3016||e>=3018&&e<=3021:e==3024||e==3031:e<3142?e<3086?e<3072?e>=3046&&e<=3055:e>=3072&&e<=3075||e>=3077&&e<=3084:e<3114?e>=3086&&e<=3088||e>=3090&&e<=3112:e>=3114&&e<=3129||e>=3133&&e<=3140:e<3160?e<3146?e>=3142&&e<=3144:e>=3146&&e<=3149||e>=3157&&e<=3158:e<3174?e>=3160&&e<=3162||e>=3168&&e<=3171:e>=3174&&e<=3183||e>=3200&&e<=3203:e<3333?e<3274?e<3242?e<3214?e>=3205&&e<=3212:e>=3214&&e<=3216||e>=3218&&e<=3240:e<3260?e>=3242&&e<=3251||e>=3253&&e<=3257:e>=3260&&e<=3268||e>=3270&&e<=3272:e<3296?e<3285?e>=3274&&e<=3277:e>=3285&&e<=3286||e==3294:e<3313?e>=3296&&e<=3299||e>=3302&&e<=3311:e>=3313&&e<=3314||e>=3329&&e<=3331:e<3423?e<3389?e<3342?e>=3333&&e<=3340:e>=3342&&e<=3344||e>=3346&&e<=3386:e<3402?e>=3389&&e<=3396||e>=3398&&e<=3400:e>=3402&&e<=3406||e>=3412&&e<=3415:e<3458?e<3430?e>=3423&&e<=3427:e>=3430&&e<=3439||e>=3450&&e<=3455:e<3482?e>=3458&&e<=3459||e>=3461&&e<=3478:e>=3482&&e<=3505||e>=3507&&e<=3515:e<3804?e<3722?e<3570?e<3535?e<3520?e==3517:e>=3520&&e<=3526||e==3530:e<3544?e>=3535&&e<=3540||e==3542:e>=3544&&e<=3551||e>=3558&&e<=3567:e<3664?e<3585?e>=3570&&e<=3571:e>=3585&&e<=3642||e>=3648&&e<=3662:e<3716?e>=3664&&e<=3673||e>=3713&&e<=3714:e==3716||e>=3719&&e<=3720:e<3754?e<3737?e<3725?e==3722:e==3725||e>=3732&&e<=3735:e<3749?e>=3737&&e<=3743||e>=3745&&e<=3747:e==3749||e==3751:e<3776?e<3757?e>=3754&&e<=3755:e>=3757&&e<=3769||e>=3771&&e<=3773:e<3784?e>=3776&&e<=3780||e==3782:e>=3784&&e<=3789||e>=3792&&e<=3801:e<4176?e<3902?e<3872?e<3840?e>=3804&&e<=3807:e==3840||e>=3864&&e<=3865:e<3895?e>=3872&&e<=3881||e==3893:e==3895||e==3897:e<3974?e<3913?e>=3902&&e<=3911:e>=3913&&e<=3948||e>=3953&&e<=3972:e<4038?e>=3974&&e<=3991||e>=3993&&e<=4028:e==4038||e>=4096&&e<=4169:e<4688?e<4301?e<4256?e>=4176&&e<=4253:e>=4256&&e<=4293||e==4295:e<4348?e==4301||e>=4304&&e<=4346:e>=4348&&e<=4680||e>=4682&&e<=4685:e<4746?e<4698?e>=4688&&e<=4694||e==4696:e>=4698&&e<=4701||e>=4704&&e<=4744:e<4786?e>=4746&&e<=4749||e>=4752&&e<=4784:e>=4786&&e<=4789||e>=4792&&e<=4798:e<11035?e<7416?e<6176?e<5873?e<4992?e<4824?e<4802?e==4800:e>=4802&&e<=4805||e>=4808&&e<=4822:e<4888?e>=4824&&e<=4880||e>=4882&&e<=4885:e>=4888&&e<=4954||e>=4957&&e<=4959:e<5121?e<5024?e>=4992&&e<=5007:e>=5024&&e<=5109||e>=5112&&e<=5117:e<5761?e>=5121&&e<=5740||e>=5743&&e<=5759:e>=5761&&e<=5786||e>=5792&&e<=5866:e<6002?e<5920?e<5888?e>=5873&&e<=5880:e>=5888&&e<=5900||e>=5902&&e<=5908:e<5984?e>=5920&&e<=5940||e>=5952&&e<=5971:e>=5984&&e<=5996||e>=5998&&e<=6e3:e<6108?e<6016?e>=6002&&e<=6003:e>=6016&&e<=6099||e==6103:e<6155?e>=6108&&e<=6109||e>=6112&&e<=6121:e>=6155&&e<=6157||e>=6160&&e<=6169:e<6783?e<6512?e<6400?e<6272?e>=6176&&e<=6263:e>=6272&&e<=6314||e>=6320&&e<=6389:e<6448?e>=6400&&e<=6430||e>=6432&&e<=6443:e>=6448&&e<=6459||e>=6470&&e<=6509:e<6608?e<6528?e>=6512&&e<=6516:e>=6528&&e<=6571||e>=6576&&e<=6601:e<6688?e>=6608&&e<=6617||e>=6656&&e<=6683:e>=6688&&e<=6750||e>=6752&&e<=6780:e<7040?e<6832?e<6800?e>=6783&&e<=6793:e>=6800&&e<=6809||e==6823:e<6992?e>=6832&&e<=6846||e>=6912&&e<=6987:e>=6992&&e<=7001||e>=7019&&e<=7027:e<7245?e<7168?e>=7040&&e<=7155:e>=7168&&e<=7223||e>=7232&&e<=7241:e<7376?e>=7245&&e<=7293||e>=7296&&e<=7304:e>=7376&&e<=7378||e>=7380&&e<=7414:e<8450?e<8130?e<8025?e<7960?e<7424?e>=7416&&e<=7417:e>=7424&&e<=7669||e>=7675&&e<=7957:e<8008?e>=7960&&e<=7965||e>=7968&&e<=8005:e>=8008&&e<=8013||e>=8016&&e<=8023:e<8031?e<8027?e==8025:e==8027||e==8029:e<8118?e>=8031&&e<=8061||e>=8064&&e<=8116:e>=8118&&e<=8124||e==8126:e<8205?e<8150?e<8134?e>=8130&&e<=8132:e>=8134&&e<=8140||e>=8144&&e<=8147:e<8178?e>=8150&&e<=8155||e>=8160&&e<=8172:e>=8178&&e<=8180||e>=8182&&e<=8188:e<8305?e<8252?e==8205:e==8252||e==8265:e<8336?e==8305||e==8319:e>=8336&&e<=8348||e>=8400&&e<=8432:e<8579?e<8486?e<8469?e<8455?e==8450:e==8455||e>=8458&&e<=8467:e<8482?e==8469||e>=8473&&e<=8477:e==8482||e==8484:e<8495?e<8488?e==8486:e==8488||e>=8490&&e<=8493:e<8517?e>=8495&&e<=8505||e>=8508&&e<=8511:e>=8517&&e<=8521||e==8526:e<9410?e<9e3?e<8592?e>=8579&&e<=8580:e>=8592&&e<=8703||e>=8986&&e<=8987:e<9193?e==9e3||e==9167:e>=9193&&e<=9203||e>=9208&&e<=9210:e<9723?e<9654?e==9410||e>=9642&&e<=9643:e==9654||e==9664:e<10548?e>=9723&&e<=9726||e>=9728&&e<=10175:e>=10548&&e<=10549||e>=11013&&e<=11015:e<43259?e<12445?e<11688?e<11520?e<11264?e<11088?e>=11035&&e<=11036:e==11088||e==11093:e<11360?e>=11264&&e<=11310||e>=11312&&e<=11358:e>=11360&&e<=11492||e>=11499&&e<=11507:e<11568?e<11559?e>=11520&&e<=11557:e==11559||e==11565:e<11647?e>=11568&&e<=11623||e==11631:e>=11647&&e<=11670||e>=11680&&e<=11686:e<11744?e<11712?e<11696?e>=11688&&e<=11694:e>=11696&&e<=11702||e>=11704&&e<=11710:e<11728?e>=11712&&e<=11718||e>=11720&&e<=11726:e>=11728&&e<=11734||e>=11736&&e<=11742:e<12330?e<11823?e>=11744&&e<=11775:e==11823||e>=12293&&e<=12294:e<12353?e>=12330&&e<=12341||e>=12347&&e<=12349:e>=12353&&e<=12438||e>=12441&&e<=12442:e<42512?e<12951?e<12549?e<12449?e>=12445&&e<=12447:e>=12449&&e<=12538||e>=12540&&e<=12543:e<12704?e>=12549&&e<=12589||e>=12593&&e<=12686:e>=12704&&e<=12730||e>=12784&&e<=12799:e<19968?e<12953?e==12951:e==12953||e>=13312&&e<=19893:e<42192?e>=19968&&e<=40917||e>=40960&&e<=42124:e>=42192&&e<=42237||e>=42240&&e<=42508:e<42891?e<42623?e<42560?e>=42512&&e<=42539:e>=42560&&e<=42610||e>=42612&&e<=42621:e<42775?e>=42623&&e<=42725||e>=42736&&e<=42737:e>=42775&&e<=42783||e>=42786&&e<=42888:e<43072?e<42928?e>=42891&&e<=42926:e>=42928&&e<=42935||e>=42999&&e<=43047:e<43216?e>=43072&&e<=43123||e>=43136&&e<=43205:e>=43216&&e<=43225||e>=43232&&e<=43255:e<55243?e<43744?e<43488?e<43312?e<43261?e==43259:e==43261||e>=43264&&e<=43309:e<43392?e>=43312&&e<=43347||e>=43360&&e<=43388:e>=43392&&e<=43456||e>=43471&&e<=43481:e<43600?e<43520?e>=43488&&e<=43518:e>=43520&&e<=43574||e>=43584&&e<=43597:e<43642?e>=43600&&e<=43609||e>=43616&&e<=43638:e>=43642&&e<=43714||e>=43739&&e<=43741:e<43824?e<43785?e<43762?e>=43744&&e<=43759:e>=43762&&e<=43766||e>=43777&&e<=43782:e<43808?e>=43785&&e<=43790||e>=43793&&e<=43798:e>=43808&&e<=43814||e>=43816&&e<=43822:e<44012?e<43868?e>=43824&&e<=43866:e>=43868&&e<=43877||e>=43888&&e<=44010:e<44032?e>=44012&&e<=44013||e>=44016&&e<=44025:e>=44032&&e<=55203||e>=55216&&e<=55238:e<64848?e<64298?e<64112?e<55296?e>=55243&&e<=55291:e>=55296&&e<=57343||e>=63744&&e<=64109:e<64275?e>=64112&&e<=64217||e>=64256&&e<=64262:e>=64275&&e<=64279||e>=64285&&e<=64296:e<64320?e<64312?e>=64298&&e<=64310:e>=64312&&e<=64316||e==64318:e<64326?e>=64320&&e<=64321||e>=64323&&e<=64324:e>=64326&&e<=64433||e>=64467&&e<=64829:e<65296?e<65024?e<64914?e>=64848&&e<=64911:e>=64914&&e<=64967||e>=65008&&e<=65019:e<65136?e>=65024&&e<=65039||e>=65056&&e<=65071:e>=65136&&e<=65140||e>=65142&&e<=65276:e<65474?e<65345?e>=65296&&e<=65305||e>=65313&&e<=65338:e>=65345&&e<=65370||e>=65382&&e<=65470:e<65490?e>=65474&&e<=65479||e>=65482&&e<=65487:e>=65490&&e<=65495||e>=65498&&e<=65500}function w(e){return e<47?e<42?e==33||e>=35&&e<=39:e>=42&&e<=43||e==45:e<63?e==47||e==61:e<94?e==63:e>=94&&e<=96||e>=123&&e<=126}function T(e){return e<91?e<47?e>=35&&e<=43||e==45:e<61?e==47:e==61||e==64:e<95?e==91||e==93:e<123?e==95:e>=123&&e<=126||e==10003}function M(e){return e<58?e<44?e==33:e==44||e==46:e<63?e>=58&&e<=59:e==63||e==94}function j(e){return e<91?e==40:e==91||e==123}function S(e){return e<93?e==41:e==93||e==125}var I=/^(?:xn--vermgensberatung-pwb|xn--vermgensberater-ctb|xn--clchc0ea0b2g2a9gcd|xn--w4r85el8fhu5dnra|travelersinsurance|vermögensberatung|xn--5su34j936bgsg|xn--bck1b9a5dre4c|xn--mgbah1a3hjkrd|xn--mgbai9azgqp6j|xn--mgberp4a5d4ar|xn--xkc2dl3a5ee0h|vermögensberater|xn--fzys8d69uvgm|xn--mgba7c0bbn0a|xn--mgbcpq6gpa1a|xn--xkc2al3hye2a|americanexpress|kerryproperties|sandvikcoromant|xn--i1b6b1a6a2e|xn--kcrx77d1x4a|xn--lgbbat1ad8j|xn--mgba3a4f16a|xn--mgbc0a9azcg|xn--nqv7fs00ema|americanfamily|weatherchannel|xn--54b7fta0cc|xn--6qq986b3xl|xn--80aqecdr1a|xn--b4w605ferd|xn--fiq228c5hs|xn--h2breg3eve|xn--jlq480n2rg|xn--mgba3a3ejt|xn--mgbaam7a8h|xn--mgbayh7gpa|xn--mgbbh1a71e|xn--mgbca7dzdo|xn--mgbi4ecexp|xn--mgbx4cd0ab|xn--rvc1e0am3e|international|lifeinsurance|wolterskluwer|xn--cckwcxetd|xn--eckvdtc9d|xn--fpcrj9c3d|xn--fzc2c9e2c|xn--h2brj9c8c|xn--tiq49xqyj|xn--yfro4i67o|xn--ygbi2ammx|construction|lplfinancial|scholarships|versicherung|xn--3e0b707e|xn--45br5cyl|xn--4dbrk0ce|xn--80adxhks|xn--80asehdb|xn--8y0a063a|xn--gckr3f0f|xn--mgb9awbf|xn--mgbab2bd|xn--mgbgu82a|xn--mgbpl2fh|xn--mgbt3dhd|xn--mk1bu44c|xn--ngbc5azd|xn--ngbe9e0a|xn--ogbpf8fl|xn--qcka1pmc|accountants|barclaycard|blackfriday|blockbuster|bridgestone|calvinklein|contractors|creditunion|engineering|enterprises|investments|kerryhotels|lamborghini|motorcycles|olayangroup|photography|playstation|productions|progressive|redumbrella|williamhill|xn--11b4c3d|xn--1ck2e1b|xn--1qqw23a|xn--2scrj9c|xn--3bst00m|xn--3ds443g|xn--3hcrj9c|xn--42c2d9a|xn--45brj9c|xn--55qw42g|xn--6frz82g|xn--80ao21a|xn--9krt00a|xn--cck2b3b|xn--czr694b|xn--d1acj3b|xn--efvy88h|xn--fct429k|xn--fjq720a|xn--flw351e|xn--g2xx48c|xn--gecrj9c|xn--gk3at1e|xn--h2brj9c|xn--hxt814e|xn--imr513n|xn--j6w193g|xn--jvr189m|xn--kprw13d|xn--kpry57d|xn--mgbbh1a|xn--mgbtx2b|xn--mix891f|xn--nyqy26a|xn--otu796d|xn--pgbs0dh|xn--q9jyb4c|xn--rhqv96g|xn--rovu88b|xn--s9brj9c|xn--ses554g|xn--t60b56a|xn--vuq861b|xn--w4rs40l|xn--xhq521b|xn--zfr164b|சிங்கப்பூர்|accountant|apartments|associates|basketball|bnpparibas|boehringer|capitalone|consulting|creditcard|cuisinella|eurovision|extraspace|foundation|healthcare|immobilien|industries|management|mitsubishi|nextdirect|properties|protection|prudential|realestate|republican|restaurant|schaeffler|tatamotors|technology|university|vlaanderen|xn--30rr7y|xn--3pxu8k|xn--45q11c|xn--4gbrim|xn--55qx5d|xn--5tzm5g|xn--80aswg|xn--90a3ac|xn--9dbq2a|xn--9et52u|xn--c2br7g|xn--cg4bki|xn--czrs0t|xn--czru2d|xn--fiq64b|xn--fiqs8s|xn--fiqz9s|xn--io0a7i|xn--kput3i|xn--mxtq1m|xn--o3cw4h|xn--pssy2u|xn--q7ce6a|xn--unup4y|xn--wgbh1c|xn--wgbl6a|xn--y9a3aq|accenture|allfinanz|amsterdam|analytics|aquarelle|barcelona|bloomberg|christmas|community|directory|education|equipment|fairwinds|financial|firestone|fresenius|furniture|goldpoint|hisamitsu|homedepot|homegoods|homesense|institute|insurance|kuokgroup|landrover|lifestyle|marketing|marshalls|melbourne|microsoft|panasonic|pramerica|richardli|shangrila|solutions|statebank|statefarm|stockholm|travelers|vacations|xn--90ais|xn--c1avg|xn--d1alf|xn--e1a4c|xn--fhbei|xn--j1aef|xn--j1amh|xn--l1acc|xn--ngbrx|xn--nqv7f|xn--p1acf|xn--qxa6a|xn--tckwe|xn--vhquv|yodobashi|موريتانيا|abudhabi|airforce|allstate|attorney|barclays|barefoot|bargains|baseball|boutique|bradesco|broadway|brussels|builders|business|capetown|catering|catholic|cipriani|cleaning|clinique|clothing|commbank|computer|delivery|deloitte|democrat|diamonds|discount|discover|download|engineer|ericsson|exchange|feedback|fidelity|firmdale|football|frontier|goodyear|grainger|graphics|hdfcbank|helsinki|holdings|hospital|infiniti|ipiranga|istanbul|jpmorgan|lighting|lundbeck|marriott|mckinsey|memorial|merckmsd|mortgage|observer|partners|pharmacy|pictures|plumbing|property|redstone|reliance|saarland|samsclub|security|services|shopping|softbank|software|stcgroup|supplies|training|vanguard|ventures|verisign|woodside|xn--90ae|xn--node|xn--p1ai|xn--qxam|yokohama|السعودية|abogado|academy|agakhan|alibaba|android|athleta|auction|audible|auspost|banamex|bauhaus|bestbuy|booking|brother|capital|caravan|careers|channel|charity|chintai|citadel|clubmed|college|cologne|company|compare|contact|cooking|corsica|country|coupons|courses|cricket|cruises|dentist|digital|domains|exposed|express|farmers|fashion|ferrari|ferrero|finance|fishing|fitness|flights|florist|flowers|forsale|frogans|fujitsu|gallery|genting|godaddy|grocery|guitars|hamburg|hangout|hitachi|holiday|hosting|hotmail|hyundai|ismaili|jewelry|juniper|kitchen|komatsu|lacaixa|lanxess|lasalle|latrobe|leclerc|limited|lincoln|markets|monster|netbank|netflix|network|neustar|okinawa|organic|origins|philips|pioneer|politie|realtor|recipes|rentals|reviews|rexroth|samsung|sandvik|schmidt|schwarz|science|shiksha|singles|staples|storage|support|surgery|systems|temasek|theater|theatre|tickets|toshiba|trading|walmart|wanggou|watches|weather|website|wedding|whoswho|windows|winners|yamaxun|youtube|zuerich|католик|البحرين|الجزائر|العليان|پاکستان|كاثوليك|இந்தியா|abbott|abbvie|africa|agency|airbus|airtel|alipay|alsace|alstom|amazon|anquan|aramco|author|bayern|beauty|berlin|bharti|bostik|boston|broker|camera|career|casino|center|chanel|chrome|church|circle|claims|clinic|coffee|comsec|condos|coupon|credit|cruise|dating|datsun|dealer|degree|dental|design|direct|doctor|dunlop|dupont|durban|emerck|energy|estate|events|expert|family|flickr|futbol|gallup|garden|george|giving|global|google|gratis|health|hermes|hiphop|hockey|hotels|hughes|imamat|insure|intuit|jaguar|joburg|juegos|kaufen|kindle|kosher|latino|lawyer|lefrak|living|locker|london|luxury|madrid|maison|makeup|market|mattel|mobile|monash|mormon|moscow|museum|nagoya|nissan|nissay|norton|nowruz|office|olayan|online|oracle|orange|otsuka|pfizer|photos|physio|pictet|quebec|racing|realty|reisen|repair|report|review|rogers|ryukyu|safety|sakura|sanofi|school|schule|search|secure|select|shouji|soccer|social|stream|studio|supply|suzuki|swatch|sydney|taipei|taobao|target|tattoo|tennis|tienda|tjmaxx|tkmaxx|toyota|travel|unicom|viajes|viking|villas|virgin|vision|voting|voyage|walter|webcam|xihuan|yachts|yandex|zappos|москва|онлайн|ابوظبي|ارامكو|الاردن|المغرب|امارات|فلسطين|مليسيا|भारतम्|இலங்கை|ファッション|actor|adult|aetna|amfam|amica|apple|archi|audio|autos|azure|baidu|beats|bible|bingo|black|boats|bosch|build|canon|cards|chase|cheap|cisco|citic|click|cloud|coach|codes|crown|cymru|dance|deals|delta|drive|dubai|earth|edeka|email|epson|faith|fedex|final|forex|forum|gallo|games|gifts|gives|glass|globo|gmail|green|gripe|group|gucci|guide|homes|honda|horse|house|hyatt|ikano|irish|jetzt|koeln|kyoto|lamer|lease|legal|lexus|lilly|loans|locus|lotte|lotto|mango|media|miami|money|movie|music|nexus|nikon|ninja|nokia|nowtv|omega|osaka|paris|parts|party|phone|photo|pizza|place|poker|praxi|press|prime|promo|quest|radio|rehab|reise|ricoh|rocks|rodeo|rugby|salon|sener|seven|sharp|shell|shoes|skype|sling|smart|smile|solar|space|sport|stada|store|study|style|sucks|swiss|tatar|tires|tirol|tmall|today|tokyo|tools|toray|total|tours|trade|trust|tunes|tushu|ubank|vegas|video|vodka|volvo|wales|watch|weber|weibo|works|world|xerox|yahoo|ישראל|ایران|بازار|بھارت|سودان|سورية|همراه|भारोत|संगठन|বাংলা|భారత్|ഭാരതം|嘉里大酒店|aarp|able|aero|akdn|ally|amex|arab|army|arpa|arte|asda|asia|audi|auto|baby|band|bank|bbva|beer|best|bike|bing|blog|blue|bofa|bond|book|buzz|cafe|call|camp|care|cars|casa|case|cash|cbre|cern|chat|citi|city|club|cool|coop|cyou|data|date|dclk|deal|dell|desi|diet|dish|docs|dvag|erni|fage|fail|fans|farm|fast|fido|film|fire|fish|flir|food|ford|free|fund|game|gbiz|gent|ggee|gift|gmbh|gold|golf|goog|guge|guru|hair|haus|hdfc|help|here|host|hsbc|icbc|ieee|imdb|immo|info|itau|java|jeep|jobs|jprs|kddi|kids|kiwi|kpmg|kred|land|lego|lgbt|lidl|life|like|limo|link|live|loan|love|ltda|luxe|maif|meet|meme|menu|mini|mint|mobi|moda|moto|name|navy|news|next|nico|nike|ollo|open|page|pars|pccw|pics|ping|pink|play|plus|pohl|porn|post|prod|prof|qpon|read|reit|rent|rest|rich|room|rsvp|ruhr|safe|sale|sarl|save|saxo|scot|seat|seek|sexy|shia|shop|show|silk|sina|site|skin|sncf|sohu|song|sony|spot|star|surf|talk|taxi|team|tech|teva|tiaa|tips|town|toys|tube|vana|visa|viva|vivo|vote|voto|wang|weir|wien|wiki|wine|work|xbox|yoga|zara|zero|zone|дети|сайт|بارت|بيتك|ڀارت|تونس|شبكة|عراق|عمان|موقع|भारत|ভারত|ভাৰত|ਭਾਰਤ|ભારત|ଭାରତ|ಭಾರತ|ලංකා|アマゾン|グーグル|クラウド|ポイント|组织机构|電訊盈科|香格里拉|aaa|abb|abc|aco|ads|aeg|afl|aig|anz|aol|app|art|aws|axa|bar|bbc|bbt|bcg|bcn|bet|bid|bio|biz|bms|bmw|bom|boo|bot|box|buy|bzh|cab|cal|cam|car|cat|cba|cbn|ceo|cfa|cfd|com|cpa|crs|dad|day|dds|dev|dhl|diy|dnp|dog|dot|dtv|dvr|eat|eco|edu|esq|eus|fan|fit|fly|foo|fox|frl|ftr|fun|fyi|gal|gap|gay|gdn|gea|gle|gmo|gmx|goo|gop|got|gov|hbo|hiv|hkt|hot|how|ibm|ice|icu|ifm|inc|ing|ink|int|ist|itv|jcb|jio|jll|jmp|jnj|jot|joy|kfh|kia|kim|kpn|krd|lat|law|lds|llc|llp|lol|lpl|ltd|man|map|mba|med|men|mil|mit|mlb|mls|mma|moe|moi|mom|mov|msd|mtn|mtr|nab|nba|nec|net|new|nfl|ngo|nhk|now|nra|nrw|ntt|nyc|obi|one|ong|onl|ooo|org|ott|ovh|pay|pet|phd|pid|pin|pnc|pro|pru|pub|pwc|red|ren|ril|rio|rip|run|rwe|sap|sas|sbi|sbs|scb|sew|sex|sfr|ski|sky|soy|spa|srl|stc|tab|tax|tci|tdk|tel|thd|tjx|top|trv|tui|tvs|ubs|uno|uol|ups|vet|vig|vin|vip|wed|win|wme|wow|wtc|wtf|xin|xxx|xyz|you|yun|zip|бел|ком|қаз|мкд|мон|орг|рус|срб|укр|հայ|קום|عرب|قطر|كوم|مصر|कॉम|नेट|คอม|ไทย|ລາວ|ストア|セール|みんな|中文网|亚马逊|天主教|我爱你|新加坡|淡马锡|飞利浦|ac|ad|ae|af|ag|ai|al|am|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cw|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|ss|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw|ελ|ευ|бг|ею|рф|გე|닷넷|닷컴|삼성|한국|コム|世界|中信|中国|中國|企业|佛山|信息|健康|八卦|公司|公益|台湾|台灣|商城|商店|商标|嘉里|在线|大拿|娱乐|家電|广东|微博|慈善|手机|招聘|政务|政府|新闻|时尚|書籍|机构|游戏|澳門|点看|移动|网址|网店|网站|网络|联通|谷歌|购物|通販|集团|食品|餐厅|香港)$/;var z=/https?:\/\//i;var C=new RegExp("^"+z.source,"i");var A=/^(javascript|vbscript):/i;var N=/^[A-Za-z][-.+A-Za-z0-9]*:(\/\/)?([^:/]*)/;var q=/^(?:\/\/)?([^/#?:]+)/;var P=b;function E(e){return b(e)||x(e)||e===43||e===45||e===46}var O=k;function R(e){return e===95||O(e)}function H(e){return k(e)||T(e)||M(e)}function B(e){return e===47||e===63||e===35}function L(e){return I.test(e.toLowerCase())}function U(e){if(A.test(e))return false;var t=e.match(N);if(!t)return false;var a=!!t[1];var n=t[2];return!!a||!(n.indexOf(".")===-1||!/[A-Za-z]/.test(n))}function D(e){var t=e.match(q);if(!t)return false;var a=t[0];var n=a.split(".");if(n.length<2)return false;var r=n[n.length-1];return!!L(r)}var W=/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;var _=/[:/?#]/;function V(e){var t=e.split(_,1)[0];return W.test(t)}var $=/^(https?:\/\/)?(?:www\.)?/i;var F=/^\/\//;var Z=function(t){e(a,t);
/**
     * @method constructor
     * @param {Object} cfg The configuration properties for the Match
     *   instance, specified in an Object (map).
     */function a(e){var a=t.call(this,e)||this;a.type="url";a.url="";a.urlMatchType="scheme";a.protocolRelativeMatch=false;a.stripPrefix={scheme:true,www:true};a.stripTrailingSlash=true;a.decodePercentEncoding=true;a.protocolPrepended=false;a.urlMatchType=e.urlMatchType;a.url=e.url;a.protocolRelativeMatch=e.protocolRelativeMatch;a.stripPrefix=e.stripPrefix;a.stripTrailingSlash=e.stripTrailingSlash;a.decodePercentEncoding=e.decodePercentEncoding;return a}a.prototype.getType=function(){return"url"};a.prototype.getUrlMatchType=function(){return this.urlMatchType};a.prototype.getUrl=function(){var e=this.url;if(!this.protocolRelativeMatch&&this.urlMatchType!=="scheme"&&!this.protocolPrepended){e=this.url="http://"+e;this.protocolPrepended=true}return e};a.prototype.getAnchorHref=function(){var e=this.getUrl();return e.replace(/&amp;/g,"&")};a.prototype.getAnchorText=function(){var e=this.getMatchedText();this.protocolRelativeMatch&&(e=J(e));this.stripPrefix.scheme&&(e=Y(e));this.stripPrefix.www&&(e=G(e));this.stripTrailingSlash&&(e=K(e));this.decodePercentEncoding&&(e=Q(e));return e};return a}(d);
/**
 * Strips the scheme prefix (such as "http://" or "https://") from the given
 * `url`.
 *
 * @private
 * @param {String} url The text of the anchor that is being generated, for
 *   which to strip off the url scheme.
 * @return {String} The `url`, with the scheme stripped.
 */function Y(e){return e.replace(C,"")}
/**
 * Strips the 'www' prefix from the given `url`.
 *
 * @private
 * @param {String} url The text of the anchor that is being generated, for
 *   which to strip off the 'www' if it exists.
 * @return {String} The `url`, with the 'www' stripped.
 */function G(e){return e.includes("www.")?e.replace($,"$1"):e}
/**
 * Strips any protocol-relative '//' from the anchor text.
 *
 * @private
 * @param {String} text The text of the anchor that is being generated, for which to strip off the
 *   protocol-relative prefix (such as stripping off "//")
 * @return {String} The `anchorText`, with the protocol-relative prefix stripped.
 */function J(e){return e.replace(F,"")}
/**
 * Removes any trailing slash from the given `anchorText`, in preparation for the text to be displayed.
 *
 * @private
 * @param {String} anchorText The text of the anchor that is being generated, for which to remove any trailing
 *   slash ('/') that may exist.
 * @return {String} The `anchorText`, with the trailing slash removed.
 */function K(e){e.charAt(e.length-1)==="/"&&(e=e.slice(0,-1));return e}
/**
 * Decodes percent-encoded characters from the given `anchorText`, in
 * preparation for the text to be displayed.
 *
 * @private
 * @param {String} anchorText The text of the anchor that is being
 *   generated, for which to decode any percent-encoded characters.
 * @return {String} The `anchorText`, with the percent-encoded characters
 *   decoded.
 */function Q(e){var t=e.replace(/%(?:22|26|27|3C|3E)/gi,(function(e){return e==="%22"?"&quot;":e==="%26"?"&amp;":e==="%27"?"&#39;":e==="%3C"||e==="%3c"?"&lt;":"&gt;"}));if(t.includes("%"))try{return decodeURIComponent(t)}catch(e){}return t}var X=/^mailto:/i;var ee=k;function te(e){return ee(e)||w(e)}
/**
 * Determines if the given email address is valid. We consider it valid if it
 * has a valid TLD in its host.
 *
 * @param emailAddress email address
 * @return true is email have valid TLD, false otherwise
 */function ae(e){var t=e.split(".").pop();return L(t)}var ne=function(t){e(a,t);
/**
     * @method constructor
     * @param {Object} cfg The configuration properties for the Match
     *   instance, specified in an Object (map).
     */function a(e){var a=t.call(this,e)||this;a.type="email";a.email="";a.email=e.email;return a}a.prototype.getType=function(){return"email"};a.prototype.getEmail=function(){return this.email};a.prototype.getAnchorHref=function(){return"mailto:"+this.email};a.prototype.getAnchorText=function(){return this.email};return a}(d);function re(e){return e===95||k(e)}function ie(e){return e.length<=140}var se=["twitter","facebook","instagram","tiktok","youtube"];var ce=function(t){e(a,t);
/**
     * @method constructor
     * @param {Object} cfg The configuration properties for the Match
     *   instance, specified in an Object (map).
     */function a(e){var a=t.call(this,e)||this;a.type="hashtag";a.serviceName="twitter";a.hashtag="";a.serviceName=e.serviceName;a.hashtag=e.hashtag;return a}a.prototype.getType=function(){return"hashtag"};a.prototype.getServiceName=function(){return this.serviceName};a.prototype.getHashtag=function(){return this.hashtag};a.prototype.getAnchorHref=function(){var e=this.serviceName,t=this.hashtag;switch(e){case"twitter":return"https://twitter.com/hashtag/"+t;case"facebook":return"https://www.facebook.com/hashtag/"+t;case"instagram":return"https://instagram.com/explore/tags/"+t;case"tiktok":return"https://www.tiktok.com/tag/"+t;case"youtube":return"https://youtube.com/hashtag/"+t;default:s(e)}};a.prototype.getAnchorText=function(){return"#"+this.hashtag};a.prototype.getCssClassSuffixes=function(){var e=t.prototype.getCssClassSuffixes.call(this),a=this.getServiceName();a&&e.push(a);return e};return a}(d);var oe={twitter:/^@\w{1,15}$/,instagram:/^@[_\w]{1,30}$/,soundcloud:/^@[-a-z0-9_]{3,25}$/,tiktok:/^@[.\w]{1,23}[\w]$/,youtube:/^@[-.·\w]{3,30}$/};function ue(e){return e===45||e===46||e===95||b(e)||x(e)}function he(e,t){var a=oe[t];return a.test(e)}var le=["twitter","instagram","soundcloud","tiktok","youtube"];var fe=function(t){e(a,t);
/**
     * @method constructor
     * @param {Object} cfg The configuration properties for the Match
     *   instance, specified in an Object (map).
     */function a(e){var a=t.call(this,e)||this;a.type="mention";a.serviceName="twitter";a.mention="";a.mention=e.mention;a.serviceName=e.serviceName;return a}a.prototype.getType=function(){return"mention"};a.prototype.getMention=function(){return this.mention};a.prototype.getServiceName=function(){return this.serviceName};a.prototype.getAnchorHref=function(){switch(this.serviceName){case"twitter":return"https://twitter.com/"+this.mention;case"instagram":return"https://instagram.com/"+this.mention;case"soundcloud":return"https://soundcloud.com/"+this.mention;case"tiktok":return"https://www.tiktok.com/@"+this.mention;case"youtube":return"https://youtube.com/@"+this.mention;default:s(this.serviceName)}};a.prototype.getAnchorText=function(){return"@"+this.mention};a.prototype.getCssClassSuffixes=function(){var e=t.prototype.getCssClassSuffixes.call(this),a=this.getServiceName();a&&e.push(a);return e};return a}(d);var pe=/[-. ()]/;var ge=/(?:(?:(?:(\+)?\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4})|(?:(\+)(?:9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)[-. ]?(?:\d[-. ]?){6,12}\d+))([,;]+[0-9]+#?)*/;var de=/(0([1-9]-?[1-9]\d{3}|[1-9]{2}-?\d{3}|[1-9]{2}\d{1}-?\d{2}|[1-9]{2}\d{2}-?\d{1})-?\d{4}|0[789]0-?\d{4}-?\d{4}|050-?\d{4}-?\d{4})/;var me=new RegExp("^".concat(ge.source,"|").concat(de.source,"$"));function be(e){return e===45||e===46||e===32}function xe(e){return e===44||e===59}function ve(e){var t=e.charAt(0)==="+"||pe.test(e);return t&&me.test(e)}var ye=function(t){e(a,t);
/**
     * @method constructor
     * @param {Object} cfg The configuration properties for the Match
     *   instance, specified in an Object (map).
     */function a(e){var a=t.call(this,e)||this;a.type="phone";a.number="";a.plusSign=false;a.number=e.number;a.plusSign=e.plusSign;return a}a.prototype.getType=function(){return"phone"};a.prototype.getPhoneNumber=function(){return this.number};a.prototype.getNumber=function(){return this.getPhoneNumber()};a.prototype.getAnchorHref=function(){return"tel:"+(this.plusSign?"+":"")+this.number};a.prototype.getAnchorText=function(){return this.matchedText};return a}(d);var ke=function(){function e(e,t){this.charIdx=0;this.matches=[];this._stateMachines=[];this.schemeUrlMachinesCount=0;this.text=e;this.tagBuilder=t.tagBuilder;this.stripPrefix=t.stripPrefix;this.stripTrailingSlash=t.stripTrailingSlash;this.decodePercentEncoding=t.decodePercentEncoding;this.hashtagServiceName=t.hashtagServiceName;this.mentionServiceName=t.mentionServiceName}Object.defineProperty(e.prototype,"stateMachines",{get:function(){return this._stateMachines},enumerable:false,configurable:true});e.prototype.addMachine=function(e){this._stateMachines.push(e);Tt(e)&&this.schemeUrlMachinesCount++};e.prototype.removeMachine=function(e){this._stateMachines=this._stateMachines.filter((function(t){return t!==e}));Tt(e)&&this.schemeUrlMachinesCount--};e.prototype.hasSchemeUrlMachine=function(){return this.schemeUrlMachinesCount>0};return e}();function we(e,t){var a=new ke(e,t);for(;a.charIdx<a.text.length;a.charIdx++){var n=e.charAt(a.charIdx);var r=e.charCodeAt(a.charIdx);if(a.stateMachines.length===0)Te(a,n,r);else{for(var i=a.stateMachines.length-1;i>=0;i--){var c=a.stateMachines[i];switch(c.state){case 11:Ce(a,c,r);break;case 12:Ae(a,c,r);break;case 0:Me(a,c,r);break;case 1:je(a,c,r);break;case 2:Se(a,c,r);break;case 3:Ie(a,c,r);break;case 4:ze(a,c,n,r);break;case 5:Ne(a,c,r);break;case 6:qe(a,c,n,r);break;case 7:Pe(a,c,n,r);break;case 13:Ee(a,c,r);break;case 14:Oe(a,c,r);break;case 8:Re(a,c,r);break;case 9:He(a,c,r);break;case 10:Be(a,c,r);break;case 15:Le(a,c,n,r);break;case 16:Ue(a,c,n,r);break;case 17:De(a,c,n,r);break;case 18:We(a,c,n,r);break;case 19:_e(a,c,n,r);break;case 20:Ve(a,c,r);break;case 21:$e(a,c,r);break;case 22:Fe(a,c,r);break;case 23:Ze(a,c,r);break;case 24:Ye(a,c,r);break;case 25:Ge(a,c,r);break;case 26:Je(a,c,r);break;case 27:Ke(a,c,r);break;case 28:Qe(a,c,r);break;case 29:Xe(a,c,r);break;case 30:et(a,c,r);break;case 31:tt(a,c,r);break;case 32:nt(a,c,n,r);break;case 33:rt(a,c,r);break;case 34:it(a,c,r);break;case 35:st(a,c,r);break;case 36:ct(a,c,n,r);break;case 37:at(a,c,n,r);break;case 38:ot(a,c,n,r);break;case 39:ut(a,c,n,r);break;case 40:ht(a,c,r);break;case 41:lt(a,c,r);break;default:s(c.state)}}if(!a.hasSchemeUrlMachine()&&a.charIdx>0&&P(r)){var o=a.text.charCodeAt(a.charIdx-1);P(o)||a.addMachine(mt(a.charIdx,0))}}}for(var u=a.stateMachines.length-1;u>=0;u--)a.stateMachines.forEach((function(e){return ft(a,e)}));return a.matches}function Te(e,t,a){var n=e.charIdx;if(a===35)e.addMachine(yt(n,28));else if(a===64)e.addMachine(kt(n,30));else if(a===47)e.addMachine(bt(n,11));else if(a===43)e.addMachine(wt(n,37));else if(a===40)e.addMachine(wt(n,32));else{if(x(a)){e.addMachine(wt(n,38));e.addMachine(xt(n,13))}if(ee(a)){var r=t.toLowerCase()==="m"?15:22;e.addMachine(vt(n,r))}P(a)&&e.addMachine(mt(n,0));k(a)&&e.addMachine(bt(n,5))}}function Me(e,t,a){a===58?t.state=2:a===45?t.state=1:E(a)||e.removeMachine(t)}function je(e,t,a){var n=e.charIdx;if(a===45);else if(a===47){e.removeMachine(t);e.addMachine(bt(n,11))}else E(a)?t.state=0:e.removeMachine(t)}function Se(e,t,a){var n=e.charIdx;if(a===47)t.state=3;else if(a===46)e.removeMachine(t);else if(O(a)){t.state=5;P(a)&&e.addMachine(mt(n,0))}else e.removeMachine(t)}function Ie(e,t,a){if(a===47)t.state=4;else if(H(a)){t.state=10;t.acceptStateReached=true}else ft(e,t)}function ze(e,t,a,n){if(n===47){t.state=10;t.acceptStateReached=true}else if(O(n)){t.state=5;t.acceptStateReached=true}else e.removeMachine(t)}function Ce(e,t,a){a===47?t.state=12:e.removeMachine(t)}function Ae(e,t,a){O(a)?t.state=5:e.removeMachine(t)}function Ne(e,t,a){a===46?t.state=7:a===45?t.state=6:a===58?t.state=8:B(a)?t.state=10:R(a)||ft(e,t)}function qe(e,t,a,n){n===45||(n===46?ft(e,t):O(n)?t.state=5:ft(e,t))}function Pe(e,t,a,n){if(n===46)ft(e,t);else if(O(n)){t.state=5;t.acceptStateReached=true}else ft(e,t)}function Ee(e,t,a){a===46?t.state=14:a===58?t.state=8:x(a)||(B(a)?t.state=10:k(a)?e.removeMachine(t):ft(e,t))}function Oe(e,t,a){if(x(a)){t.octetsEncountered++;t.octetsEncountered===4&&(t.acceptStateReached=true);t.state=13}else ft(e,t)}function Re(e,t,a){x(a)?t.state=9:ft(e,t)}function He(e,t,a){x(a)||(B(a)?t.state=10:ft(e,t))}function Be(e,t,a){H(a)||ft(e,t)}function Le(e,t,a,n){a.toLowerCase()==="a"?t.state=16:Fe(e,t,n)}function Ue(e,t,a,n){a.toLowerCase()==="i"?t.state=17:Fe(e,t,n)}function De(e,t,a,n){a.toLowerCase()==="l"?t.state=18:Fe(e,t,n)}function We(e,t,a,n){a.toLowerCase()==="t"?t.state=19:Fe(e,t,n)}function _e(e,t,a,n){a.toLowerCase()==="o"?t.state=20:Fe(e,t,n)}function Ve(e,t,a){a===58?t.state=21:Fe(e,t,a)}function $e(e,t,a){te(a)?t.state=22:e.removeMachine(t)}function Fe(e,t,a){a===46?t.state=23:a===64?t.state=24:te(a)?t.state=22:e.removeMachine(t)}function Ze(e,t,a){a===46||a===64?e.removeMachine(t):te(a)?t.state=22:e.removeMachine(t)}function Ye(e,t,a){O(a)?t.state=25:e.removeMachine(t)}function Ge(e,t,a){a===46?t.state=27:a===45?t.state=26:R(a)||ft(e,t)}function Je(e,t,a){a===45||a===46?ft(e,t):R(a)?t.state=25:ft(e,t)}function Ke(e,t,a){if(a===46||a===45)ft(e,t);else if(O(a)){t.state=25;t.acceptStateReached=true}else ft(e,t)}function Qe(e,t,a){if(re(a)){t.state=29;t.acceptStateReached=true}else e.removeMachine(t)}function Xe(e,t,a){re(a)||ft(e,t)}function et(e,t,a){if(ue(a)){t.state=31;t.acceptStateReached=true}else e.removeMachine(t)}function tt(e,t,a){ue(a)||(k(a)?e.removeMachine(t):ft(e,t))}function at(e,t,a,n){if(x(n))t.state=38;else{e.removeMachine(t);Te(e,a,n)}}function nt(e,t,a,n){x(n)?t.state=33:e.removeMachine(t);Te(e,a,n)}function rt(e,t,a){x(a)?t.state=34:e.removeMachine(t)}function it(e,t,a){x(a)?t.state=35:e.removeMachine(t)}function st(e,t,a){a===41?t.state=36:e.removeMachine(t)}function ct(e,t,a,n){x(n)?t.state=38:be(n)?t.state=39:e.removeMachine(t)}function ot(e,t,a,n){var r=e.charIdx;t.acceptStateReached=true;if(xe(n))t.state=40;else if(n===35)t.state=41;else if(x(n));else if(n===40)t.state=32;else if(be(n))t.state=39;else{ft(e,t);P(n)&&e.addMachine(mt(r,0))}}function ut(e,t,a,n){if(x(n))t.state=38;else if(n===40)t.state=32;else{ft(e,t);Te(e,a,n)}}function ht(e,t,a){xe(a)||(a===35?t.state=41:x(a)?t.state=38:ft(e,t))}function lt(e,t,a){xe(a)?t.state=40:x(a)?e.removeMachine(t):ft(e,t)}function ft(e,t){var a=e.matches,n=e.text,r=e.charIdx,i=e.tagBuilder,c=e.stripPrefix,o=e.stripTrailingSlash,u=e.decodePercentEncoding,h=e.hashtagServiceName,l=e.mentionServiceName;e.removeMachine(t);if(t.acceptStateReached){var f=t.startIdx;var p=n.slice(t.startIdx,r);p=dt(p);switch(t.type){case 0:var g=n.charCodeAt(t.startIdx-1);if(g===64)return;switch(t.matchType){case 0:var d=z.exec(p);if(d){f+=d.index;p=p.slice(d.index)}if(!U(p))return;break;case 1:if(!D(p))return;break;case 2:if(!V(p))return;break;default:s(t)}a.push(new Z({tagBuilder:i,matchedText:p,offset:f,urlMatchType:pt(t.matchType),url:p,protocolRelativeMatch:p.slice(0,2)==="//",stripPrefix:c,stripTrailingSlash:o,decodePercentEncoding:u}));break;case 1:ae(p)&&a.push(new ne({tagBuilder:i,matchedText:p,offset:f,email:p.replace(X,"")}));break;case 2:ie(p)&&a.push(new ce({tagBuilder:i,matchedText:p,offset:f,serviceName:h,hashtag:p.slice(1)}));break;case 3:he(p,l)&&a.push(new fe({tagBuilder:i,matchedText:p,offset:f,serviceName:l,mention:p.slice(1)}));break;case 4:p=p.replace(/ +$/g,"");if(ve(p)){var m=p.replace(/[^0-9,;#]/g,"");a.push(new ye({tagBuilder:i,matchedText:p,offset:f,number:m,plusSign:p.charAt(0)==="+"}))}break;default:s(t)}}}function pt(e){switch(e){case 0:return"scheme";case 1:return"tld";case 2:return"ipV4";default:s(e)}}var gt={")":"(","}":"{","]":"["};
/**
 * Determines if a match found has unmatched closing parenthesis,
 * square brackets or curly brackets. If so, these unbalanced symbol(s) will be
 * removed from the URL match itself.
 *
 * A match may have an extra closing parenthesis/square brackets/curly brackets
 * at the end of the match because these are valid URL path characters. For
 * example, "wikipedia.com/something_(disambiguation)" should be auto-linked.
 *
 * However, an extra parenthesis *will* be included when the URL itself is
 * wrapped in parenthesis, such as in the case of:
 *
 *     "(wikipedia.com/something_(disambiguation))"
 *
 * In this case, the last closing parenthesis should *not* be part of the
 * URL itself, and this method will exclude it from the returned URL.
 *
 * For square brackets in URLs such as in PHP arrays, the same behavior as
 * parenthesis discussed above should happen:
 *
 *     "[http://www.example.com/foo.php?bar[]=1&bar[]=2&bar[]=3]"
 *
 * The very last closing square bracket should not be part of the URL itself,
 * and therefore this method will remove it.
 *
 * @param matchedText The full matched URL/email/hashtag/etc. from the state
 *   machine parser.
 * @return The updated matched text with extraneous suffix characters removed.
 */function dt(e){var t={"(":0,"{":0,"[":0};for(var a=0;a<e.length;a++){var n=e.charAt(a);var r=e.charCodeAt(a);j(r)?t[n]++:S(r)&&t[gt[n]]--}var i=e.length-1;while(i>=0){n=e.charAt(i);r=e.charCodeAt(i);if(S(r)){var s=gt[n];if(!(t[s]<0))break;t[s]++;i--}else{if(!M(r))break;i--}}return e.slice(0,i+1)}function mt(e,t){return{type:0,startIdx:e,state:t,acceptStateReached:false,matchType:0}}function bt(e,t){return{type:0,startIdx:e,state:t,acceptStateReached:false,matchType:1}}function xt(e,t){return{type:0,startIdx:e,state:t,acceptStateReached:false,matchType:2,octetsEncountered:1}}function vt(e,t){return{type:1,startIdx:e,state:t,acceptStateReached:false}}function yt(e,t){return{type:2,startIdx:e,state:t,acceptStateReached:false}}function kt(e,t){return{type:3,startIdx:e,state:t,acceptStateReached:false}}function wt(e,t){return{type:4,startIdx:e,state:t,acceptStateReached:false}}function Tt(e){return e.type===0&&e.matchType===0}var Mt=function(){function e(e){e===void 0&&(e={});this.idx=e.idx!==void 0?e.idx:-1;this.type=e.type||"tag";this.name=e.name||"";this.isOpening=!!e.isOpening;this.isClosing=!!e.isClosing}return e}();var jt=new Mt;var St=function(){function e(e,t){this.charIdx=0;this.state=0;this.currentDataIdx=0;this.currentTag=jt;this.html=e;this.callbacks=t}return e}();
/**
 * Parses an HTML string, calling the callbacks to notify of tags and text.
 *
 * ## History
 *
 * This file previously used a regular expression to find html tags in the input
 * text. Unfortunately, we ran into a bunch of catastrophic backtracking issues
 * with certain input text, causing Autolinker to either hang or just take a
 * really long time to parse the string.
 *
 * The current code is intended to be a O(n) algorithm that walks through
 * the string in one pass, and tries to be as cheap as possible. We don't need
 * to implement the full HTML spec, but rather simply determine where the string
 * looks like an HTML tag, and where it looks like text (so that we can autolink
 * that).
 *
 * This state machine parser is intended just to be a simple but performant
 * parser of HTML for the subset of requirements we have. We simply need to:
 *
 * 1. Determine where HTML tags are
 * 2. Determine the tag name (Autolinker specifically only cares about <a>,
 *    <script>, and <style> tags, so as not to link any text within them)
 *
 * We don't need to:
 *
 * 1. Create a parse tree
 * 2. Auto-close tags with invalid markup
 * 3. etc.
 *
 * The other intention behind this is that we didn't want to add external
 * dependencies on the Autolinker utility which would increase its size. For
 * instance, adding htmlparser2 adds 125kb to the minified output file,
 * increasing its final size from 47kb to 172kb (at the time of writing). It
 * also doesn't work exactly correctly, treating the string "<3 blah blah blah"
 * as an HTML tag.
 *
 * Reference for HTML spec:
 *
 *     https://www.w3.org/TR/html51/syntax.html#sec-tokenization
 *
 * @param {String} html The HTML to parse
 * @param {Object} callbacks
 * @param {Function} callbacks.onOpenTag Callback function to call when an open
 *   tag is parsed. Called with the tagName as its argument.
 * @param {Function} callbacks.onCloseTag Callback function to call when a close
 *   tag is parsed. Called with the tagName as its argument. If a self-closing
 *   tag is found, `onCloseTag` is called immediately after `onOpenTag`.
 * @param {Function} callbacks.onText Callback function to call when text (i.e
 *   not an HTML tag) is parsed. Called with the text (string) as its first
 *   argument, and offset (number) into the string as its second.
 */function It(e,t){var a=new St(e,t);var n=e.length;while(a.charIdx<n){var r=e.charAt(a.charIdx);var i=e.charCodeAt(a.charIdx);switch(a.state){case 0:zt(a,r);break;case 1:Ct(a,r,i);break;case 2:Nt(a,r,i);break;case 3:At(a,r,i);break;case 4:qt(a,r,i);break;case 5:Pt(a,r,i);break;case 6:Et(a,r,i);break;case 7:Ot(a,r,i);break;case 8:Rt(a,r);break;case 9:Ht(a,r);break;case 10:Bt(a,r,i);break;case 11:Lt(a,r,i);break;case 12:Ut(a,r);break;case 13:Dt(a);break;case 14:Wt(a,r);break;case 15:_t(a,r);break;case 16:Vt(a,r);break;case 17:$t(a,r);break;case 18:Ft(a,r);break;case 19:Zt(a,r);break;case 20:Yt(a,r);break;default:s(a.state)}a.charIdx++}a.currentDataIdx<a.charIdx&&Qt(a)}function zt(e,t){t==="<"&&Jt(e)}function Ct(e,a,n){if(a==="!")e.state=13;else if(a==="/"){e.state=2;e.currentTag=new Mt(t(t({},e.currentTag),{isClosing:true}))}else if(a==="<")Jt(e);else if(b(n)){e.state=3;e.currentTag=new Mt(t(t({},e.currentTag),{isOpening:true}))}else{e.state=0;e.currentTag=jt}}function At(e,a,n){if(y(n)){e.currentTag=new Mt(t(t({},e.currentTag),{name:Xt(e)}));e.state=4}else if(a==="<")Jt(e);else if(a==="/"){e.currentTag=new Mt(t(t({},e.currentTag),{name:Xt(e)}));e.state=12}else if(a===">"){e.currentTag=new Mt(t(t({},e.currentTag),{name:Xt(e)}));Kt(e)}else b(n)||x(n)||a===":"||Gt(e)}function Nt(e,t,a){t===">"?Gt(e):b(a)?e.state=3:Gt(e)}function qt(e,t,a){y(a)||(t==="/"?e.state=12:t===">"?Kt(e):t==="<"?Jt(e):t==="="||v(a)||m(a)?Gt(e):e.state=5)}function Pt(e,t,a){y(a)?e.state=6:t==="/"?e.state=12:t==="="?e.state=7:t===">"?Kt(e):t==="<"?Jt(e):v(a)&&Gt(e)}function Et(e,t,a){y(a)||(t==="/"?e.state=12:t==="="?e.state=7:t===">"?Kt(e):t==="<"?Jt(e):v(a)?Gt(e):e.state=5)}function Ot(e,t,a){y(a)||(t==='"'?e.state=8:t==="'"?e.state=9:/[>=`]/.test(t)?Gt(e):t==="<"?Jt(e):e.state=10)}function Rt(e,t){t==='"'&&(e.state=11)}function Ht(e,t){t==="'"&&(e.state=11)}function Bt(e,t,a){y(a)?e.state=4:t===">"?Kt(e):t==="<"&&Jt(e)}function Lt(e,t,a){if(y(a))e.state=4;else if(t==="/")e.state=12;else if(t===">")Kt(e);else if(t==="<")Jt(e);else{e.state=4;ea(e)}}function Ut(e,a){if(a===">"){e.currentTag=new Mt(t(t({},e.currentTag),{isClosing:true}));Kt(e)}else Gt(e)}function Dt(e){var a=e.html,n=e.charIdx;if(a.slice(n,n+2)==="--"){e.charIdx++;e.currentTag=new Mt(t(t({},e.currentTag),{type:"comment"}));e.state=14}else if(a.slice(n,n+7).toUpperCase()==="DOCTYPE"){e.charIdx+=6;e.currentTag=new Mt(t(t({},e.currentTag),{type:"doctype"}));e.state=20}else Gt(e)}function Wt(e,t){t==="-"?e.state=15:t===">"?Gt(e):e.state=16}function _t(e,t){t==="-"?e.state=18:t===">"?Gt(e):e.state=16}function Vt(e,t){t==="-"&&(e.state=17)}function $t(e,t){e.state=t==="-"?18:16}function Ft(e,t){t===">"?Kt(e):t==="!"?e.state=19:t==="-"||(e.state=16)}function Zt(e,t){t==="-"?e.state=17:t===">"?Kt(e):e.state=16}function Yt(e,t){t===">"?Kt(e):t==="<"&&Jt(e)}function Gt(e){e.state=0;e.currentTag=jt}function Jt(e){e.state=1;e.currentTag=new Mt({idx:e.charIdx})}function Kt(e){var t=e.html.slice(e.currentDataIdx,e.currentTag.idx);t&&e.callbacks.onText(t,e.currentDataIdx);var a=e.currentTag;if(a.type==="comment")e.callbacks.onComment(a.idx);else if(a.type==="doctype")e.callbacks.onDoctype(a.idx);else{a.isOpening&&e.callbacks.onOpenTag(a.name,a.idx);a.isClosing&&e.callbacks.onCloseTag(a.name,a.idx)}Gt(e);e.currentDataIdx=e.charIdx+1}function Qt(e){var t=e.html.slice(e.currentDataIdx,e.charIdx);e.callbacks.onText(t,e.currentDataIdx);e.currentDataIdx=e.charIdx+1}function Xt(e){var t=e.currentTag.idx+(e.currentTag.isClosing?2:1);return e.html.slice(t,e.charIdx).toLowerCase()}function ea(e){e.charIdx--}var ta=function(){
/**
     * @method constructor
     * @param {Object} [cfg] The configuration options for the Autolinker instance,
     *   specified in an Object (map).
     */
function e(t){t===void 0&&(t={});this.version=e.version;this.urls={};this.email=true;this.phone=true;this.hashtag=false;this.mention=false;this.newWindow=true;this.stripPrefix={scheme:true,www:true};this.stripTrailingSlash=true;this.decodePercentEncoding=true;this.truncate={length:0,location:"end"};this.className="";this.replaceFn=null;this.context=void 0;this.sanitizeHtml=false;this.tagBuilder=null;this.urls=aa(t.urls);this.email=c(t.email)?t.email:this.email;this.phone=c(t.phone)?t.phone:this.phone;this.hashtag=t.hashtag||this.hashtag;this.mention=t.mention||this.mention;this.newWindow=c(t.newWindow)?t.newWindow:this.newWindow;this.stripPrefix=na(t.stripPrefix);this.stripTrailingSlash=c(t.stripTrailingSlash)?t.stripTrailingSlash:this.stripTrailingSlash;this.decodePercentEncoding=c(t.decodePercentEncoding)?t.decodePercentEncoding:this.decodePercentEncoding;this.sanitizeHtml=t.sanitizeHtml||false;var a=this.mention;if(a!==false&&le.indexOf(a)===-1)throw new Error("invalid `mention` cfg '".concat(a,"' - see docs"));var n=this.hashtag;if(n!==false&&se.indexOf(n)===-1)throw new Error("invalid `hashtag` cfg '".concat(n,"' - see docs"));this.truncate=ra(t.truncate);this.className=t.className||this.className;this.replaceFn=t.replaceFn||this.replaceFn;this.context=t.context||this}
/**
     * Automatically links URLs, Email addresses, Phone Numbers, Twitter handles,
     * Hashtags, and Mentions found in the given chunk of HTML. Does not link URLs
     * found within HTML tags.
     *
     * For instance, if given the text: `You should go to http://www.yahoo.com`,
     * then the result will be `You should go to &lt;a href="http://www.yahoo.com"&gt;http://www.yahoo.com&lt;/a&gt;`
     *
     * Example:
     *
     *     var linkedText = Autolinker.link( "Go to google.com", { newWindow: false } );
     *     // Produces: "Go to <a href="http://google.com">google.com</a>"
     *
     * @static
     * @param {String} textOrHtml The HTML or text to find matches within (depending
     *   on if the {@link #urls}, {@link #email}, {@link #phone}, {@link #mention},
     *   {@link #hashtag}, and {@link #mention} options are enabled).
     * @param {Object} [options] Any of the configuration options for the Autolinker
     *   class, specified in an Object (map). See the class description for an
     *   example call.
     * @return {String} The HTML text, with matches automatically linked.
     */e.link=function(t,a){var n=new e(a);return n.link(t)};
/**
     * Parses the input `textOrHtml` looking for URLs, email addresses, phone
     * numbers, username handles, and hashtags (depending on the configuration
     * of the Autolinker instance), and returns an array of {@link Autolinker.match.Match}
     * objects describing those matches (without making any replacements).
     *
     * Note that if parsing multiple pieces of text, it is slightly more efficient
     * to create an Autolinker instance, and use the instance-level {@link #parse}
     * method.
     *
     * Example:
     *
     *     var matches = Autolinker.parse("Hello google.com, I am asdf@asdf.com", {
     *         urls: true,
     *         email: true
     *     });
     *
     *     console.log(matches.length);         // 2
     *     console.log(matches[0].getType());   // 'url'
     *     console.log(matches[0].getUrl());    // 'google.com'
     *     console.log(matches[1].getType());   // 'email'
     *     console.log(matches[1].getEmail());  // 'asdf@asdf.com'
     *
     * @static
     * @param {String} textOrHtml The HTML or text to find matches within
     *   (depending on if the {@link #urls}, {@link #email}, {@link #phone},
     *   {@link #hashtag}, and {@link #mention} options are enabled).
     * @param {Object} [options] Any of the configuration options for the Autolinker
     *   class, specified in an Object (map). See the class description for an
     *   example call.
     * @return {Autolinker.match.Match[]} The array of Matches found in the
     *   given input `textOrHtml`.
     */e.parse=function(t,a){var n=new e(a);return n.parse(t)};
/**
     * Parses the input `textOrHtml` looking for URLs, email addresses, phone
     * numbers, username handles, and hashtags (depending on the configuration
     * of the Autolinker instance), and returns an array of {@link Autolinker.match.Match}
     * objects describing those matches (without making any replacements).
     *
     * This method is used by the {@link #link} method, but can also be used to
     * simply do parsing of the input in order to discover what kinds of links
     * there are and how many.
     *
     * Example usage:
     *
     *     var autolinker = new Autolinker( {
     *         urls: true,
     *         email: true
     *     } );
     *
     *     var matches = autolinker.parse( "Hello google.com, I am asdf@asdf.com" );
     *
     *     console.log( matches.length );           // 2
     *     console.log( matches[ 0 ].getType() );   // 'url'
     *     console.log( matches[ 0 ].getUrl() );    // 'google.com'
     *     console.log( matches[ 1 ].getType() );   // 'email'
     *     console.log( matches[ 1 ].getEmail() );  // 'asdf@asdf.com'
     *
     * @param {String} textOrHtml The HTML or text to find matches within
     *   (depending on if the {@link #urls}, {@link #email}, {@link #phone},
     *   {@link #hashtag}, and {@link #mention} options are enabled).
     * @return {Autolinker.match.Match[]} The array of Matches found in the
     *   given input `textOrHtml`.
     */e.prototype.parse=function(e){var t=this;var r=["a","style","script"];var i=0;var s=[];It(e,{onOpenTag:function(e){r.indexOf(e)>=0&&i++},onText:function(e,r){if(i===0){var c=/(&nbsp;|&#160;|&lt;|&#60;|&gt;|&#62;|&quot;|&#34;|&#39;)/gi;var o=e.split(c);var u=r;o.forEach((function(e,r){if(r%2===0){var i=t.parseText(e,u);s.push.apply(s,a([],n(i),false))}u+=e.length}))}},onCloseTag:function(e){r.indexOf(e)>=0&&(i=Math.max(i-1,0))},onComment:function(){},onDoctype:function(){}});s=this.compactMatches(s);s=this.removeUnwantedMatches(s);return s};
/**
     * After we have found all matches, we need to remove matches that overlap
     * with a previous match. This can happen for instance with an
     * email address where the local-part of the email is also a top-level
     * domain, such as in "google.com@aaa.com". In this case, the entire email
     * address should be linked rather than just the 'google.com' part.
     *
     * @private
     * @param {Autolinker.match.Match[]} matches
     * @return {Autolinker.match.Match[]}
     */e.prototype.compactMatches=function(e){e.sort(ia);var t=0;while(t<e.length-1){var a=e[t];var n=a.getOffset();var r=a.getMatchedText().length;if(t+1<e.length&&e[t+1].getOffset()===n){var i=e[t+1].getMatchedText().length>r?t:t+1;e.splice(i,1)}else t++}return e};
/**
     * Removes matches for matchers that were turned off in the options. For
     * example, if {@link #hashtag hashtags} were not to be matched, we'll
     * remove them from the `matches` array here.
     *
     * Note: we *must* use all Matchers on the input string, and then filter
     * them out later. For example, if the options were `{ url: false, hashtag: true }`,
     * we wouldn't want to match the text '#link' as a HashTag inside of the text
     * 'google.com/#link'. The way the algorithm works is that we match the full
     * URL first (which prevents the accidental HashTag match), and then we'll
     * simply throw away the URL match.
     *
     * @private
     * @param {Autolinker.match.Match[]} matches The array of matches to remove
     *   the unwanted matches from. Note: this array is mutated for the
     *   removals.
     * @return {Autolinker.match.Match[]} The mutated input `matches` array.
     */e.prototype.removeUnwantedMatches=function(e){this.hashtag||o(e,(function(e){return e.getType()==="hashtag"}));this.email||o(e,(function(e){return e.getType()==="email"}));this.phone||o(e,(function(e){return e.getType()==="phone"}));this.mention||o(e,(function(e){return e.getType()==="mention"}));this.urls.schemeMatches||o(e,(function(e){return e.getType()==="url"&&e.getUrlMatchType()==="scheme"}));this.urls.tldMatches||o(e,(function(e){return e.getType()==="url"&&e.getUrlMatchType()==="tld"}));this.urls.ipV4Matches||o(e,(function(e){return e.getType()==="url"&&e.getUrlMatchType()==="ipV4"}));return e};
/**
     * Parses the input `text` looking for URLs, email addresses, phone
     * numbers, username handles, and hashtags (depending on the configuration
     * of the Autolinker instance), and returns an array of {@link Autolinker.match.Match}
     * objects describing those matches.
     *
     * This method processes a **non-HTML string**, and is used to parse and
     * match within the text nodes of an HTML string. This method is used
     * internally by {@link #parse}.
     *
     * @private
     * @param {String} text The text to find matches within (depending on if the
     *   {@link #urls}, {@link #email}, {@link #phone},
     *   {@link #hashtag}, and {@link #mention} options are enabled). This must be a non-HTML string.
     * @param {Number} [offset=0] The offset of the text node within the
     *   original string. This is used when parsing with the {@link #parse}
     *   method to generate correct offsets within the {@link Autolinker.match.Match}
     *   instances, but may be omitted if calling this method publicly.
     * @return {Autolinker.match.Match[]} The array of Matches found in the
     *   given input `text`.
     */e.prototype.parseText=function(e,t){t=t||0;var a=we(e,{tagBuilder:this.getTagBuilder(),stripPrefix:this.stripPrefix,stripTrailingSlash:this.stripTrailingSlash,decodePercentEncoding:this.decodePercentEncoding,hashtagServiceName:this.hashtag,mentionServiceName:this.mention||"twitter"});for(var n=0,r=a.length;n<r;n++)a[n].setOffset(t+a[n].getOffset());return a};
/**
     * Automatically links URLs, Email addresses, Phone numbers, Hashtags,
     * and Mentions (Twitter, Instagram, Soundcloud) found in the given chunk of HTML. Does not link
     * URLs found within HTML tags.
     *
     * For instance, if given the text: `You should go to http://www.yahoo.com`,
     * then the result will be `You should go to
     * &lt;a href="http://www.yahoo.com"&gt;http://www.yahoo.com&lt;/a&gt;`
     *
     * This method finds the text around any HTML elements in the input
     * `textOrHtml`, which will be the text that is processed. Any original HTML
     * elements will be left as-is, as well as the text that is already wrapped
     * in anchor (&lt;a&gt;) tags.
     *
     * @param {String} textOrHtml The HTML or text to autolink matches within
     *   (depending on if the {@link #urls}, {@link #email}, {@link #phone}, {@link #hashtag}, and {@link #mention} options are enabled).
     * @return {String} The HTML, with matches automatically linked.
     */e.prototype.link=function(e){if(!e)return"";this.sanitizeHtml&&(e=e.replace(/</g,"&lt;").replace(/>/g,"&gt;"));var t=this.parse(e);var a=new Array(t.length*2+1);var n=0;for(var r=0,i=t.length;r<i;r++){var s=t[r];a.push(e.substring(n,s.getOffset()));a.push(this.createMatchReturnVal(s));n=s.getOffset()+s.getMatchedText().length}a.push(e.substring(n));return a.join("")};
/**
     * Creates the return string value for a given match in the input string.
     *
     * This method handles the {@link #replaceFn}, if one was provided.
     *
     * @private
     * @param {Autolinker.match.Match} match The Match object that represents
     *   the match.
     * @return {String} The string that the `match` should be replaced with.
     *   This is usually the anchor tag string, but may be the `matchStr` itself
     *   if the match is not to be replaced.
     */e.prototype.createMatchReturnVal=function(e){var t;this.replaceFn&&(t=this.replaceFn.call(this.context,e));if(typeof t==="string")return t;if(t===false)return e.getMatchedText();if(t instanceof p)return t.toAnchorString();var a=e.buildTag();return a.toAnchorString()};e.prototype.getTagBuilder=function(){var e=this.tagBuilder;e||(e=this.tagBuilder=new g({newWindow:this.newWindow,truncate:this.truncate,className:this.className}));return e};e.version=l;return e}();
/**
 * Normalizes the {@link #urls} config into an Object with its 2 properties:
 * `schemeMatches` and `tldMatches`, both booleans.
 *
 * See {@link #urls} config for details.
 *
 * @private
 * @param {Boolean/Object} urls
 * @return {Object}
 */function aa(e){e==null&&(e=true);return c(e)?{schemeMatches:e,tldMatches:e,ipV4Matches:e}:{schemeMatches:!c(e.schemeMatches)||e.schemeMatches,tldMatches:!c(e.tldMatches)||e.tldMatches,ipV4Matches:!c(e.ipV4Matches)||e.ipV4Matches}}
/**
 * Normalizes the {@link #stripPrefix} config into an Object with 2
 * properties: `scheme`, and `www` - both Booleans.
 *
 * See {@link #stripPrefix} config for details.
 *
 * @private
 * @param {Boolean/Object} stripPrefix
 * @return {Object}
 */function na(e){e==null&&(e=true);return c(e)?{scheme:e,www:e}:{scheme:!c(e.scheme)||e.scheme,www:!c(e.www)||e.www}}
/**
 * Normalizes the {@link #truncate} config into an Object with 2 properties:
 * `length` (Number), and `location` (String).
 *
 * See {@link #truncate} config for details.
 *
 * @private
 * @param {Number/Object} truncate
 * @return {Object}
 */function ra(e){return typeof e==="number"?{length:e,location:"end"}:t({length:Number.POSITIVE_INFINITY,location:"end"},e)}function ia(e,t){return e.getOffset()-t.getOffset()}export{d as AbstractMatch,g as AnchorTagBuilder,ta as Autolinker,ne as EmailMatch,ce as HashtagMatch,p as HtmlTag,fe as MentionMatch,ye as PhoneMatch,Z as UrlMatch,ta as default,dt as excludeUnbalancedTrailingBracesAndPunctuation,we as parseMatches,f as whitespaceRe};

