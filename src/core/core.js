/** Middle v0.1.0-alpha
* https://github.com/cihantuncer/middle
* (c) 2024, Cihan Tuncer - cihan@cihantuncer.com
* This code is licensed under Apache 2.0 license (see LICENSE.md for details)
*/

// TODO revise data methods


class Middle {

    static cssPrefixes   = ["webkit", "moz", "ms", "o", "khtml"];
    static enablePooling = false;
    static poolInitSize  = 0;
    static poolMaxSize   = 0;
    static cachePool     = null;
    static cacheObj      = function(){

        this.elem = null;
        this.data = {};
    };

    constructor(selector) {
        Middle.construct(selector,this);
    }

    static construct(selector,instance=null){

        // Selector is an instance of Middle.
        // E.g., a=MDL("div"), b=MDL(a) <-- b returns a.
        if (selector instanceof Middle) {
            return selector;
        }

        // Always create new instance if query doesn't have.
        if (!(instance instanceof Middle)) {
            return new Middle(selector);
        }

        // Now, we have instance. Continue...
    
        // No selector, just return instance.
        if (!selector) {
            return instance;
        }
    
        // Selector is a dom element. Add element to instance, return instance.
        if (selector.nodeType) {
            instance[0] = selector;
            instance.length = 1;
            
            return instance;
        }
    
        // Selector is dom query (e.g., ".list > div").
        // Add all elements from query result to instance, return instance.
        if (typeof selector === 'string') {
            Array.prototype.push.apply(instance, document.querySelectorAll(selector));
            instance.length = instance.length || 0;

            return instance;
        }
    }

    static ready(callback) {

        if (document.readyState === "interactive" || document.readyState === "complete") {

            callback(Middle);

        } else {

            document.addEventListener("DOMContentLoaded", () => {
                callback(Middle);
            }, { once: true });
        }
    }

    static loaded(callback) {

        if (document.readyState === "complete") {

            callback(Middle);

        } else {

            window.addEventListener("load", () => {
                callback(Middle);
            }, { once: true });

        }
    }

    static cloneObject(obj, deep = false, visiteds = new WeakMap()) {
    
        if (!obj || typeof obj !== 'object')
            return obj;

        if (visiteds.has(obj))
            return visiteds.get(obj);

        let clone;

        if (Array.isArray(obj)) {
            clone = [];
            visiteds.set(obj, clone);
            clone = obj.map(item => (deep ? Middle.cloneObject(item, true, visiteds) : item));
        }
        else if (obj instanceof Date) {
            clone = new Date(obj);
        }
        else if (obj instanceof RegExp) {
            clone = new RegExp(obj);
        }
        else if (typeof obj === 'function') {
            clone = obj;
        }
        else {
            const keys = [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)];
            clone = Object.create(Object.getPrototypeOf(obj));
            visiteds.set(obj, clone);

            keys.forEach(key => {
                clone[key] = deep ? Middle.cloneObject(obj[key], true, visiteds) : obj[key];
            });
        }

        return clone;
    }

    static extend(...args) {
        const deep = typeof args[0] === "boolean" ? args.shift() : false;
        let target = deep ? Middle.cloneObject(args.shift(), true) : args.shift();

        args.forEach(obj => {

            Object.keys(obj).forEach(key => {
                target[key] = deep ? Middle.cloneObject(obj[key], true) : obj[key];
            });
        });

        return target;
    }

    static extendDeep(...args) {
        return Middle.extend(true,...args)
    }

    static isNative(fn) {
        return /^\s*function[^{]+{\s*\[native code\]\s*}\s*}$/.test(fn);
    }

    static inArray(val, arr) {
        return (arr.constructor === Array) ? arr.indexOf(val) : false;
    }

    static inNodeList(node, nodeList) {

        for (let i = 0, len = nodeList.length; i < len; i++) {
            if (nodeList[i] === node)
                return i;
        }

        return -1;
    }

    static nodesToArray(nodeList) {
        return [...nodeList];
    }

    static cssPrefix(css) {

        const style = document.documentElement.style;

        if (css in style)
            return css;

        const prefix = Middle.cssPrefixes.find(pref => `-${pref}-${css}` in style);

        return prefix ? `-${prefix}-${css}` : null;
    }

    static getStyle(el) {
        return window.getComputedStyle(el);
    }
    
    static css(el,_styleName,val) {

        const elStyles  = window.getComputedStyle(el);
        const styleName = Middle.cssPrefix(_styleName);

        if (styleName === null)
            return null;

        if (val === undefined){
            return elStyles.getPropertyValue(styleName);
        }

        el.style[styleName]=val;
    }

    static testCss(prop, val) {

        const testEl = document.createElement('div');
        const _prop  = Middle.cssPrefix(prop);

        let result;

        if (_prop === null)
            return false;

        document.body.insertBefore(testEl, null);

        if (testEl.style[_prop] !== undefined) {
            testEl.style[_prop] = val;
            result = Middle.getStyle(testEl).getPropertyValue(_prop);
        }

        document.body.removeChild(testEl);

        return (result !== undefined && result.length > 0 && result !== "none") ? _prop : false;
    }

    static addClass(el, className) {
        return el.classList.add(className);
    }

    static removeClass(el, className) {
        return el.classList.remove(className);
    }

    static isVisible(el) {
        const elStyle=window.getComputedStyle(el);
        return elStyle.display !== 'none' && elStyle.visibility !== 'hidden';
    }

    static docWidth() {

        return Math.max(
            document.body.scrollWidth, document.documentElement.scrollWidth,
            document.body.offsetWidth, document.documentElement.offsetWidth,
            document.body.clientWidth, document.documentElement.clientWidth
        );
    }

    static docHeight() {

        return Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
    }

    static position(el) {

        const elStyle = window.getComputedStyle(el);
        const pos     = elStyle.position;

        let elOff, parStyle, parOff  = [0, 0];

        if (pos == "fixed") {

            let elRect = el.getBoundingClientRect();

            elOff    = [0, 0];
            elOff[0] = elRect.left;
            elOff[1] = elRect.top;
        }
        else {

            elOff = Middle.offset(el);

            if (el.offsetParent.tagName !== "html") {
                parOff   = Middle.offset(el.offsetParent, null, null, false);
                parStyle = Middle.getStyle(el.offsetParent);
            }

            parOff.left += parseFloat(parStyle.borderLeftWidth) || 0;
            parOff.top  += parseFloat(parStyle.borderTopWidth) || 0;
        }

        return [elOff[0] - parOff[0] - (parseFloat(elStyle.marginLeft) || 0),
                elOff[1] - parOff[1] - (parseFloat(elStyle.marginTop)  || 0)];
    }

    static offset(el, args = null, store = false, type = null) {

        if (!args) {

            let
            elRect    = el.getBoundingClientRect(),
            elL       = elRect.left,
            elT       = elRect.top,
            docEl     = document.documentElement,
            clLeft    = (type == "inner") ? el.clientLeft : 0,
            clTop     = (type == "inner") ? el.clientTop : 0,
            tmpLeft   = elL + clLeft + window.scrollX - docEl.clientLeft,
            tmpTop    = elT + clTop + window.scrollY - docEl.clientTop,
            tmpRight  = tmpLeft + (type == "inner" ? el.clientWidth : el.offsetWidth),
            tmpBottom = tmpTop + (type == "inner" ? el.clientHeight : el.offsetHeight);

            if (store) {

                Middle.setOffsetData(el, tmpLeft, tmpTop, tmpRight, tmpBottom);

                if (store == "only") return;
            }

            return [tmpLeft, tmpTop, tmpRight, tmpBottom];


        } else {

            let
            elStyle   = Middle.getStyle(el),
            tmpCssPos = elStyle.position,
            tmpCssTop, tmpCssLeft, tmpOffset, numPosLeft, numPosTop;

            if (tmpCssPos === "static") {
                el.style.position = "relative";
            }

            tmpOffset  = Middle.offset(el);
            tmpCssTop  = elStyle.top;
            tmpCssLeft = elStyle.left;

            if ((tmpCssPos === "fixed" || tmpCssPos === "absolute") && (tmpCssTop === "auto" || tmpCssLeft === "auto")) {
                let tmpPos     = Middle.position(el);
                    numPosLeft = tmpPos[0];
                    numPosTop  = tmpPos[1];
            }
            else {
                numPosLeft = parseFloat(tmpCssLeft) || 0;
                numPosTop  = parseFloat(tmpCssTop) || 0;
            }

            var x = (args[0] - tmpOffset[0]) + numPosLeft, y = (args[1] - tmpOffset[1]) + numPosTop;

            if (args[0] !== null) { el.style.left = x + "px"; }
            if (args[1] !== null) { el.style.top = y + "px"; }

            if (store)
                Middle.offset(el, null, true);
        }
    }
    static setOffsetData(el, l, t, r, b) {

        let off;

        if (off = Middle.getData(el, "offset")) {

            off[0] = l; off[1] = t; off[2] = r; off[3] = b;

        } else {
            Middle.data(el, "offset", [l, t, r, b]);

        }
    }

    static regToArray(str, exp, delim=",") {

        if (str === undefined || str === "" || str === "none" || typeof str != "string")
            return null;

        const reg = new RegExp(exp);
        const matches = str.match(reg);
        return matches && matches[1] ? matches[1].split(delim) : null;
    }

    static getMatrixXY(el) {

        const arr = Middle.regToArray(Middle.getStyle(el)[Middle.transform], /\((.*?)\)/);

        if (!arr)
            return [0, 0];

        return arr.length === 16 ? [Number(arr[12]), Number(arr[13])] : [Number(arr[4]), Number(arr[5])];
    }

    static getTransformXY(el) {

        const txy = el.style[Middle.transform];

        if (txy == "" || txy == null || txy == "none") {

            return Middle.getMatrixXY(el);

        } else {

            var arr = Middle.regToArray(txy, /\((.*?)\)/);

            if (arr === null) 
                return [0, 0];

            return [parseFloat(arr[0]), parseFloat(arr[1])];

        }
    }

    static setTransformXY(x, y) {

        return (Middle.moveMode == "3d") ? "translate3d(" + Number(x) + "px, " + Number(y) + "px, 0px)" :
            (Middle.moveMode == "2d") ? "translate(" + Number(x) + "px, " + Number(y) + "px)" : null;
    }

    static setMoveMode(mode) {

        switch (mode) {

            case "auto":
            case "3d":
                Middle.moveMode = (Middle.has3d) ? "3d" : (Middle.has2d) ? "2d" : "basic";
                break;

            case "3d!":
                Middle.moveMode = (Middle.has3d) ? "3d" : "basic";
                break;

            case "2d":
            case "2d!":
                Middle.moveMode = (Middle.has2d) ? "2d" : "basic";
                break;

            case "basic":
            default:
                Middle.moveMode = "basic";
        }

        Middle.moveType = (Middle.moveMode == "3d" || Middle.moveMode == "2d") ? "transform" : "basic";
    }

    static parents(el, selector) {

        const nodeArr = [];

        let node = el.parentNode || false;

        while (node && node !== document) {

            if (!selector || (!!selector && node.matches?.(selector)))
                 nodeArr.unshift(node);

            node = node.parentNode;
        }

        return nodeArr;
    }

    static closest(el, selector, outer=false) {

        let node = (outer) ? el.parentNode : el;

        while (node) {

            if (node.matches(selector)) {
                return node;
            } else {
                node = node.parentElement;
            }
        }

        return null;
    }

    static closestInside(el, topNode, selector, outer=false) {

        let node = (outer) ? el.parentNode : el;

        while (node && topNode && node !== topNode) {

            if (node.matches(selector)) {
                return node;
            } else {
                node = node.parentElement;
            }
        }

        return null;
    }

    static find(el, selector) {
        return el.querySelectorAll(selector);
    }

    static capitalize(string=""){
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    

    // --- Pool Factory ---
    
    static poolCreate(constr, size, maxSize, resetCall, deInitCall, initCall, deepCopy) {

        return Middle.poolSetup.call(constr, size, maxSize, resetCall, deInitCall, initCall, deepCopy);
    }

    static poolSetup(size, maxSize, resetCall, deInitCall, initCall, deepCopy) {

        const constr = (typeof this === "function" || typeof this === "object") ? this : [],
              pool   = new Middle.poolObject(constr, size, maxSize, resetCall, deInitCall, initCall, deepCopy);

        if (pool.size > pool.maxSize)
            pool.maxSize = 0;

        pool.stack.length = pool.size;

        for (let i = 0; i < pool.size; i++) {

            pool.stack[i] = (typeof constr == "function") ? new constr() : Middle.cloneObject(constr, pool.deepCopy);

            let reset = pool.resetCall;

            reset && typeof reset === "function" ? reset.apply(pool.stack[i]) :
            reset && typeof reset === "string"  && pool.stack[i][reset] && pool.stack[i][reset]();

            pool.slot++;
        }

        console.debug("Pool created: ",pool)

        return pool;
    }

    static poolObject = function(constr, size=0, maxSize=0, resetCall=false, deInitCall=false, initCall=false, deepCopy=false) {

        this.tag             = "MiddleJS Pool Object";
        this.__constructor__ = constr;
        this.stack           = [];
        this.slot            = 0;
        this.size            = size;
        this.maxSize         = maxSize;
        this.deepCopy        = deepCopy;
        this.resetCall       = resetCall;
        this.initCall        = initCall;
        this.deInitCall      = deInitCall;
    }

    static data(el, key, val) {

        if (el === undefined || Middle?.cache === undefined || Middle?.uniqueID === undefined) {
            return undefined;
        }

        const elID = el[Middle.uniqueID];
      
        if (key === undefined) {
            return Middle.cache[elID]?.data;
        }

        if (val === undefined) {
            return Middle.cache[elID]?.data?.[key];
        }

        if (!Middle.cache[elID]) {
            Middle.cache[elID] = new Middle.cacheObj();
        }

        Middle.cache[elID].data[key] = val;

        return true;
    }

    static newData(el) {

        if (typeof el[Middle.uniqueID] === "number")
            return Middle.cache[el[Middle.uniqueID]].data;

        let
        len   = Middle.cache.enumid + 1,
        cache = Middle.cachePool ? Middle.cachePool.pop() : new Middle.cacheObj();

        el[Middle.uniqueID] = len;
        Middle.cache.enumid = len;

        cache.elem = el;

        Middle.cache[len] = cache;

        return cache.data;
    }

    static setData(el, key, val) {

        const data = Middle.newData(el);

        if (typeof key === "undefined")
            return;

        data[key] = val;
    }

    static getData(el, key) {

        if (typeof key === "undefined") {

            return el?.[Middle.uniqueID] && Middle.cache?.[el[Middle.uniqueID]]?.data !== undefined 
                     ? Middle.cache[el[Middle.uniqueID]].data : undefined;
        }

        return el[Middle.uniqueID] ? Middle.cache[el[Middle.uniqueID]].data[key] : undefined;
    }

    static removeData(el, key, del) {

        if (!el || typeof el[Middle.uniqueID] !== "number")
            return;

        if (typeof key === "undefined") {

            const obj = Middle.cache[el[Middle.uniqueID]];

            if (obj) {

                obj.elem = null;
                obj.data = {};

                Middle.cachePool && Middle.cachePool.push(obj);

                if (del)
                    delete Middle.cache[el[Middle.uniqueID]];

                el[Middle.uniqueID] = undefined;
            }

            return;
        }

        if (Middle.cache[el[Middle.uniqueID]]) {

            if (del) {
                delete Middle.cache[el[Middle.uniqueID]].data[key];
            }

            else {
                Middle.cache[el[Middle.uniqueID]].data[key] = undefined;
            }

        }

        return;
    }

    static init() {

        this.timeStamp    = Math.floor((Date.now ? Date.now() : new Date().getTime()) / 1000);
        this.uniqueID     = `MIDUQID${this.timeStamp}`;
        this.transition   = this.cssPrefix("transition");
        this.transform    = this.cssPrefix("transform");
        this.has2d        = this.testCss("transform", "matrix(1, 0, 0, 1, 1, 1)");
        this.has3d        = this.testCss("transform", "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1)");
        this.moveMode     = "basic";
        this.moveType     = "basic";
        this.mouseMode    = ('onmousedown' in window) ? "mousedown"   : false;
        this.touchMode    = ('ontouchstart' in window) ? "touchstart" : false;
        this.pointerMode  = window.PointerEvent && true || false;
        //this.pointerMode  = false;

        this.setMoveMode("auto");

        Middle.enablePooling = window.MID_enablePooling || false;
        Middle.poolInitSize  = window.MID_poolInitSize  || 0;
        Middle.poolMaxSize   = window.MID_poolMaxSize   || 0;

        this.cache = this.cache || { enumid: 0 };

        if (Middle.enablePooling) {
            Middle.cachePool = this.poolCreate(Middle.cacheObj, Middle.poolInitSize, Middle.poolMaxSize, false);
        }
    }

    each(callback) {
        Array.prototype.forEach.call(this, (el, i) => {
          callback.call(el, i, el);
        });
    };

}

// --- Pool Object Prototypes ---

// Take one of cached (as prepared, ready for new usage) object from cache pool.
Middle.poolObject.prototype.pop = function(...args){

    const noArgs = args.length === 0;
    let init=this.initCall, obj;

    // We have available cache object in the pool. Pop object and decrease available slots count by one.
    if(this.slot > 0){
        this.slot--;
        obj = this.stack[this.slot];
        this.stack[this.slot] = undefined;

        console.debug(obj,"Object taken from the cache pool.");
    }

    // No object left in the cache pool. Create new one to use.
    else{
        obj = (typeof this.__constructor__ === "function") ? 
               new this.__constructor__() :
               Middle.cloneObject(this.__constructor__,this.deepCopy);

        console.debug(obj,"No object left in the cache pool, created new one to use.");
    }

    // Object provided. Initialize for use. 

    // Object itself is a initCall function
    init && init === true && typeof obj === "function" ? (noArgs ? obj() : obj.call(undefined,...args)) :
    // initCall is a function
    init && typeof func === "function" ? (noArgs ? func.call(obj) : func.call(obj,...args)) :
    // initCall is a initialization function's name
    init && typeof func === "string" && obj[func] && (noArgs ? obj[init]() : obj[func].call(obj,...args));
         
    return obj;
};

// Push used object (as resetted to its defaults for future usage) to cache pool.
Middle.poolObject.prototype.push = function(obj,...args){
    
    const noArgs = args.length === 0;
    const deInit = this.deInitCall;

    // First, reset (or whatever you want before storing it in the cache) object to its defaults.

    // Object itself is a deInitCall function
    deInit && deInit === true && typeof obj === "function" ? (noArgs ? obj() : obj.call(undefined,...args)) :
    // deInitCall is a function
    deInit && typeof deInit == "function" ? (noArgs ? deInit.call(obj) : deInit.call(obj,...args)) :
    // deInitCall is a deinitialization function's name
    deInit && typeof deInit == "string" && obj[deInit] && (noArgs ? obj[deInit]() : obj[deInit].call(obj,...args));

    // Then, store it in the cache pool.
    if(this.slot < this.maxSize || this.maxSize <= 0){
        this.stack[this.slot++] = obj;
        (this.slot > this.size) && (this.size = this.slot)
    }
};

// Reset cache pool. Refill with new objects.
Middle.poolObject.prototype.reset = function(){

    const reset = this.resetCall;

    this.slot = 0;
    this.size = this.stack.length;

    for(let i=0; i < this.size; i++){

        this.stack[i] = (typeof this.__constructor__ === "function") ?
                         new this.__constructor__() :
                         Middle.cloneObject(this.__constructor__,this.deepCopy);
        

        // Created new object. Now call reset function on it.
        reset && typeof reset === "function" ?  reset.call(this.stack[i]) :
        reset && typeof reset === "string"   && this.stack[i][reset] && this.stack[i][reset]();

        this.slot++;
    }
};

// Increase cache pool by given number or 25% of its size by default.
Middle.poolObject.prototype.increase = function(add){

    add = (add && add > 0) ? add : Math.floor(this.size*25/100);

    let inUse = this.size - this.slot;

    this.size += add;

    let max = this.size - inUse;

    this.stack.length = this.size;

    let reset = this.resetCall;

    for(; this.slot < max; this.slot++){

        this.stack[this.slot] = (typeof this.__constructor__ == "function") ?
                                 new this.__constructor__() :
                                 Middle.cloneObject(this.__constructor__,this.deepCopy);
          
        // Created new object. Now call reset function on it.
        reset && typeof reset === "function" ?  reset.call(this.stack[this.slot]) :
        reset && typeof reset === "string"   && this.stack[this.slot][reset] && this.stack[this.slot][reset]();
    } 
};

Middle.init();

function MDL(selector) {

    return Middle.construct(selector)
}



export { Middle, MDL }