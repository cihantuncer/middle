/** Dragger v0.1.0-alpha
* https://github.com/cihantuncer/middle
* (c) 2024, Cihan Tuncer - cihan@cihantuncer.com
* This code is licensed under Apache 2.0 license (see LICENSE.md for details)
*/

import { Middle } from '../core/core.js';

class Dragger {

    static namespace        = "dragger";
    static nameclass        = "mdl-dragger";
    static prefix           = "drag";
    static infix            = "Drag";

    static enablePooling    = true;
    static poolInitSize     = "auto";
    static poolMaxSize      = "auto";
    static poolAutoIncrease = true;
    static cachePool        = null;
    static doc              = document;
    static docEl            = this.doc.documentElement;

    // Raf engine
    static rafMove          = requestAnimationFrame ? true : false;

    static zMax             = 900;
    static unholdables      = "input, textarea, button, select, option, .mdl-unholdable";
    
    static eventActions = {
        start   : { touch:"touchstart"  ,pointer:"pointerdown"   ,mouse:"mousedown"                         },
        move    : { touch:"touchmove"   ,pointer:"pointermove"   ,mouse:"mousemove"                         },
        end     : { touch:"touchend"    ,pointer:"pointerup"     ,mouse:"mouseup"                           },
        cancel  : { touch:"touchcancel" ,pointer:"pointercancel" ,mouse:false                               },
        touch   : { start:"touchstart"  ,move   :"touchmove"     ,end  :"touchend"  ,cancel:"touchcancel"   },
        pointer : { start:"pointerdown" ,move   :"pointermove"   ,end  :"pointerup" ,cancel:"pointercancel" },
        mouse   : { start:"mousedown"   ,move   :"mousemove"     ,end  :"mouseup"   ,cancel:false           }
    }

    static CN = {
        "touch-action" : Middle.cssPrefix("touch-action")
    }

    // Dragger default options
    static defaults = function(){

        // Set provided element as delegator for draggable children elements.
        // values: "CSS selector" | false
        this.delegate = false;
                
        // Set drag direction.
        // values: "x" | "y" | "both"
        this.axis = "both";
        
        // Set drag element z-index mode.
        // values : number (for stay at given level)  | "swap" (For reset to element's default z-index) 
        this.zMode = "swap";

        // Set container for drag element. Element can't be dragged out of its container bounds. 
        // values: false (For disable container)
        //         true | "parent" (Set parent node element as container)
        //         domElement (Set given dom element node as container)
        //        "CSS selector" (Set container as closest parent element matches given css selector)
        //         "document" | document (Set document element (Whole page) as container)
        //         "window" | window (Set window element (Browser's viewport) as container)
        this.container = false;
        
        // Enable/disable container sides.
        // values : Array [ 0|1 (left), 0|1 (top), 0|1 (right), 0|1 (bottom)]
        this.containerSides = [1,1,1,1];

        // Set scroll target.
        // values: false (For disable scrolling when dragging)
        //         true | window | "window" (For scroll whole page)
        //        "CSS selector" (Set scroll target as closest parent element matches given css selector)
        //        "parent" (Set scroll target as drag element's parent dom element)
        //         domElement (Set scroll target as given dom element)
        this.scroll = true;
        
        // Set what the scrolling behavior will be based on.
        // values: false (based on drag element's position)
        //        "pointer" (based on pointer position)
        this.scrollMode = "pointer";
        
        // Set scroll speed.
        // value: number
        this.scrollSpeed = 20;
        
        // Set scroll sensitivity.
        // value: number
        this.scrollSensitivity = 20;
        
        // Set the draggable element's drag grip. The element will only be dragged with the grip.
        // values: "css selector" | false
        this.holder = false;
        
        // Set drag hold offset for element while dragging.
        // values : false | {left:X, top:Y, percent:true|false}
        // "left,top" values are pixels by default. "percent:true" converts them to percentage.
        // examples:
        // {top:100} --> While dragging the element, keep the pointer at top:100px
        // {left:50, top:50, percent:true} --> While dragging the element, center it to pointer.
        // {left:100, top:100, percent:true} --> While dragging the element, keep the pointer at element's bottom right corner.
        this.holdOffset = false;
        
        // "CSS selector" to define unholdable inner elements to prevent start drag action.
        // values : "CSS selector" | false
        this.unholdables = false;
        
        // Enable predefined unholdable elements hold prevention while drag start action.
        // They are in Dragger.unholdables variable.
        // values : true | false
        this.unholdDefaults = true;
                
        // Revert drag element position after drag action.
        // values  : true (default:300 milliseconds) | milliseconds | Object {ms:num, easing:"css easing name" }
        // examples: true -> default ms(300) || 2000 -> 2000 milliseconds | {ms:1000, easing:"cubic-bezier(0, 0.55, 0.45, 1)" 
        this.revert = false;
        
        // Set milliseconds to start drag delayed when element held down.
        // values : true | milliseconds | false
        this.delay = false;
                
        // Cancel drag start when element is held down but not dragged at least the given distance.
        // values : num (distance in pixels) | false
        this.distance = false;

        // Cancel drag start when element is held down but not moved in given milliseconds.
        // values : milliseconds | false
        this.timeOut = false;

        // Call the "onDragWithFreq" hook function at the given millisecond intervals during dragging.
        // values : milliseconds | false
        this.frequency = false;

        // Drag element with provided grid.
        // values : Array [num(width),num(height)] | domElement (auto gets its width/height) | false
        this.grid = false;
        
        // Drag a helper element instead of dragging the element itself.
        // values : true | "clone" (Use element's clone as drag element.)
        //         "htmlString" (Use given html string as drag element.)
        //          Function (Call Function to create, prepare helper element to use as drag element.)
        this.helper = true;

        // Lock drag processes fps to provided value.
        // values : number | false (For unlocked fps).
        // Note: RAF engine syncs frames with device screen automatically by default.         
        this.renderFps = false;

        // Use native stopPropagation function for events.
        // values : true | false
        this.stopPropagation = false;  
        
        // Use native preventDefault function for events.
        // values : true | false
        this.preventDefault = true;
    }

    constructor() {
        
        // "true" for set all default props of new instance.
        this.delegator = true;
        // Set default props for instance
        this.defaultProps();
    }

    // Creates new instance or get one of stored instances from cache pool.
    static newInstance = function(el,options={},delegated){

        const instance = Dragger.cachePool ? Dragger.cachePool.pop() : new Dragger();

        Middle.setData(el,"dragger",instance); // Store instance.
        
        if(delegated){
            return instance;
        }
        else{
            instance.init(el,options); // Initialize instance.
        }
    }

    // Gets instance itself
    getInstance(){
        return this;
    }

    // Initializes instance.
    init( el, options) {

        this.options        = (new Dragger.defaults()).extend(options);  // Extend with user-defined options.
        this.activePointers = new Map();                                 // Event store for active pointers.
        this.activeTouches  = new Map();                                 // Event store for active touches.
        this.initialElement = el;                                        // Assign target element.
        this.onPointerStart = (event) => this.pointerStart(event);       // Attach start event.

        // Delegate option selected.
        // Element is delegator. It triggers drag events for its draggable children.
        if(this.options.delegate){
            el.nodeType === 1 && Middle.addClass(el, `${Dragger.nameclass}-delegator`);
        }
        // Element is draggable element itself.
        else{
            this.dragElement = el;
            el.nodeType === 1 && Middle.addClass(el, `${Dragger.nameclass}-element`);
        }

        this.initialElement.style[Dragger.CN['touch-action']]="none"

        // Attach "Pointer" start event (new standard)
        if( Middle.pointerMode){
          el.addEventListener("pointerdown", this.onPointerStart, { passive: false, capture: false });
        }
        // Attach "Touch, Mouse" start events
        else{
          el.addEventListener("mousedown",  this.onPointerStart, { passive: false, capture: false });
          el.addEventListener("touchstart", this.onPointerStart,  { passive: false, capture: false });
        }

        // Call user-defined function on init.
        this.hook("onInit");
    }
    

    // ==== Property Processes ======================

    // Resets instance properties at new instance creation and every "drag end" process.
    defaultProps(){

        if(this.delegator){
            this.onPointerStart   = null;
            this.onPointerMove   = null;
            this.onPointerEnd     = null;
            this.delegator       = null;
            this.options         = null;
            this.initialElement  = null;
            this.dragElement     = null;
            this.dragElementData = null;
            this.helperEl        = null;
            this.timeWait        = null;
            this.eventScope      = null;
            this.eventActions    = this.eventActions || Dragger.eventActions.mouse;
        }

        this.rafId           = null;
        this.process         = "pointerdown";
        this.pointerId       = null;
        this.distanced       = true;
        this.delayed         = true;
        this.event           = null;
        this.zIndex          = null;
        this.moveX           = null;
        this.moveY           = null;
        this.lastX           = null;
        this.lastY           = null;
        this.dragInited      = false;
        this.container       = null;
        this.contOff         = null;
        this.scrollContainer = null;
        this.timeStamp       = null;
        this.lastTime        = Date.now();

        if(this.delegator !== true)
            return;

        this.scrL  = this.scrT  = this.scrL2 = this.scrT2 = this.rectL = this.rectT = 0;
        this.docCl = this.docCt = this.wPX   = this.wPY   = 0;
        this.oW    = this.oH    = this.tX    = this.tY    = this.oX    = this.oY    = 0;
        this.pageX = this.pageY = this.gX    = this.gY    = 0;
        this.dfX   = this.dfY   = this.hdfX  = this.hdfY  = 0;
    }

    // Initializes first properties for instance at every "drag start" process.
    initProps(initialInstance,pointer,event){

        const thisInstance=this;

        // --- Initial properties for dynamically created instance ---
        if(thisInstance !== initialInstance){
            thisInstance.delegator      = initialInstance;
            thisInstance.options        = initialInstance.options;
            thisInstance.process        = "pointerdown";
            thisInstance.initialElement = initialInstance.initialElement;
            thisInstance.dragElement    = initialInstance.dragElement;
        }

        // --- Set initial flags ---
        thisInstance.distanced  = (thisInstance.options.distance) ? false : true;
        thisInstance.delayed    = true;
        thisInstance.zIndex     = thisInstance.dragElement.style.zIndex;
        thisInstance.event      = event;

        // --- Set initial shared flags ---
        thisInstance.dragElementData = Middle.getData(thisInstance.dragElement) || Middle.newData(thisInstance.dragElement);
        thisInstance.dragElementData.dragAvailable   = thisInstance.dragElementData.dragAvailable || true;
        thisInstance.dragElementData.pressed         = true;
        thisInstance.dragElementData.moved           = false;
        thisInstance.dragElementData.dragPrevented   = false;

        // --- Set initial metrics for target element ---
        thisInstance.updateElementMetrics(thisInstance.dragElement, pointer, true);

        // --- Set event actions ---
        switch(thisInstance.event.type){

            case "pointerdown":
                thisInstance.eventActions = Dragger.eventActions.pointer;
                thisInstance.eventScope   = document;
                break;

            case "touchstart":
                thisInstance.eventActions = Dragger.eventActions.touch;
                thisInstance.eventScope   = thisInstance.dragElement;
                break;

            case "mousedown":
            default:
                thisInstance.eventActions = Dragger.eventActions.mouse;
                thisInstance.eventScope   = document;
                break;
        };

        thisInstance.activePointers = initialInstance.activePointers;
        thisInstance.activeTouches  = initialInstance.activeTouches;

        // --- Assign move, end events ---
        thisInstance.onPointerMove     = (event) => thisInstance.pointerMove(event);
        thisInstance.onPointerEnd      = (event) => thisInstance.pointerEnd(event);
        thisInstance.onPointerCancel   = (event) => thisInstance.pointerCancel(event);
    }

    // Set initial metrics for drag element
    updateElementMetrics(el,e,offCache){
       
        const
        docEl  = document.documentElement,
        dL     = docEl.clientLeft,
        dT     = docEl.clientTop,
        wX     = window.scrollX,
        wY     = window.scrollY,
        trsXY  = Middle.getMatrixXY(el),
        elRect = el.getBoundingClientRect(),
        elL    = elRect.left, elT = elRect.top, elR = elRect.right, elB = elRect.bottom,
        offX   = elL + wX - dL,
        offY   = elT + wY - dT;

        if(offCache){

            let off;

            if(off = Middle.getData(el,"offset")){

                 off[0] = offX; off[1] = offY; off[2] = offX+(elR - elL); off[3] = offY+(elB - elT);

            }else{

                Middle.setData(el,"offset",[offX, offY, offX+(elR - elL), offY+(elB - elT)]);
            }
        }

        this.cssPos  = Middle.getStyle(el).position;
        this.scrL    = el.parentNode.scrollLeft || 0;
        this.scrT    = el.parentNode.scrollTop  || 0;
        this.scrL2   = 0;
        this.scrT2   = 0;
        this.rectL   = elL;
        this.rectT   = elT;
        this.docCl   = dL;
        this.docCt   = dT;
        this.wPX     = wX;
        this.wPY     = wY;
        this.oW      = elR - elL;
        this.oH      = elB - elT;
        this.tX      = trsXY[0];
        this.tY      = trsXY[1];
        this.oX      = offX;
        this.oY      = offY;
        this.pageX   = e.pageX || null;
        this.pageY   = e.pageY || null;
        this.gX      = e.pageX || null;
        this.gY      = e.pageY || null;
        this.dfX     = e.pageX - offX || null;
        this.dfY     = e.pageY - offY || null;
        this.hdfX    = e.pageX - offX || null;
        this.hdfY    = e.pageY - offY || null;
    }


    // ==== Event Handlers ==========================

    addListener(...args){

        args.forEach(arg => {
            this.eventActions[arg] && 
            this.eventScope.addEventListener(
                this.eventActions[arg],
                this[`onPointer${Middle.capitalize(arg)}`], 
                { passive: false, capture: false }
            );

        });
    }

    removeListener(...args){

        args.forEach(arg => {
            this.eventActions[arg] && 
            this.eventScope.removeEventListener(
                this.eventActions[arg],
                this[`onPointer${Middle.capitalize(arg)}`], 
                { passive: false, capture: false }
            );

        });
    }

    dispatchTouchEvents(event,eventFun){

        this.eventType = "touch";
        const touchPointers = event.changedTouches;
        const elData = Middle.newData(this.dragElement);
    
        for (let i = 0; i < touchPointers.length; i++) {
    
            const thisTouch = touchPointers[i];
            const activeTouchId = this.activeTouches.get(this.dragElement);
    
            if (event.type === "start") {
                if (!activeTouchId && !elData.pressed) {
                    this.activeTouches.set(this.dragElement, thisTouch.identifier);
                    this[eventFun](thisTouch, event);
                }
            }
            else if (event.type === "move" && activeTouchId === thisTouch.identifier) {
                this[eventFun](thisTouch, event);
            }
            else if ((event.type === "end" || event.type === "cancel") && activeTouchId === thisTouch.identifier) {
                this.activeTouches.delete(this.dragElement);
                this[eventFun](thisTouch, event);
            }
        }
    }

    dispatchPointerEvents(event,eventFun){
        
        this.eventType = "pointer";
        let pointerId = event.pointerId;
        const activePointerId = this.activePointers.get(this.dragElement);
        const elData = Middle.newData(this.dragElement);
    
        if (event.type === "pointerdown") {

            if (!activePointerId && !elData.hasPointer) {
                this.activePointers.set(this.dragElement, pointerId);
                this[eventFun](event, event);
                elData.hasPointer=true;
            }
        }

        if (event.type === "pointermove") {
            if (activePointerId === pointerId) {
                this[eventFun](event, event);
            }
        }

        if (event.type === "pointerup" || event.type == "pointercancel") {

            if (activePointerId === pointerId && elData.hasPointer) {
                elData.hasPointer=false;
                this.activePointers.delete(this.dragElement);
                this[eventFun](event, event);
            }
        }
    }

    dispatchMouseEvents(event,eventFun){
        this.eventType = "mouse";
        this[eventFun](event, event);
    }

    setEventHandler(event,eventFun,eventAction){

        if (event.type === Dragger.eventActions.touch[eventAction]) {
            this.dispatchTouchEvents(event,eventFun,eventAction);
        }
        else if(event.type === Dragger.eventActions.pointer[eventAction]) {
            this.dispatchPointerEvents(event,eventFun,eventAction);
        }
        else if(event.type === Dragger.eventActions.mouse[eventAction]) {
            this.dispatchMouseEvents(event,eventFun,eventAction);
        }
    }

    pointerStart(event) {

        if( !(this.dragElement = this.getDragElement(event)) )
            return;

        this.setEventHandler(event,"handlePointerStart","start");
    }

    handlePointerStart(pointer,event){
        
        let instance = this.options.delegate ? Dragger.newInstance(this.dragElement,{},true) : this; // Create new instance for delegation.

        instance.initProps(this,pointer,event); // Set initial properties for instance.

        instance.options.stopPropagation && event.stopPropagation(); // Use Native stopPropagation
        instance.options.preventDefault  && event.cancelable && event.preventDefault();  // Use Native preventDefault

        if(instance.cssPos == "static")
            this.dragElement.style.position = instance.cssPos = "relative"; // Static elements can't move.

        instance.setHoldDiffs(pointer.pageX,pointer.pageY,instance.options.holdOffset); // Calc hold offsets.

        instance.hook("onPointerStart"); // Hook user-defined pointer down function.

        instance.setTimeOut(); // Remove move event if provided time exceeds.
        instance.setDelay();   // Start drag action after a delay if delay time is provided.

        // Add event listeners for drag.
        instance.addListener("end","cancel","move");

        console.log("pointerStart",this.dragElement.id);

    }

    pointerMove(event){

        this.setEventHandler(event,"handlePointerMove","move");
    }

    handlePointerMove(pointer,event) {

        if(pointer.pageX === this.lastX && pointer.pageY === this.lastY) {
            this.skip=true;
            return;
        }

        this.skip=false;

        this.lastX   = pointer.pageX;
        this.lastY   = pointer.pageY;
        this.process = "dragMove";
        this.event   = event;

        this.options.distance && !this.distanced && this.checkDistance(pointer.pageX,pointer.pageY);

        if(!this.delayed || !this.distanced)
            return;

        !this.dragInited && this.dragInit(pointer);

        this.calcPos(pointer.pageX,pointer.pageY);

        this.options.container && this.container && this.stayInside();

        if(this.options.scroll){
            this.scroll();
        }

        this.hook("onDrag");

        if(this.options.frequency && event.timeStamp - this.timeStamp >= this.options.frequency ) {
            this.timeStamp = event.timeStamp;
            this.hook("onDragWithFreq");
        }

        console.log("pointerMove",this.dragElement.id);
    }

    pointerEnd(event){

        this.setEventHandler(event,"handlePointerEnd","end");
    }

    handlePointerEnd(pointer, event) {

        this.freePropagation(this.dragElement);
        this.eventType=null;

        if(!this.dragElementData.pressed)
            return;
        
        this.dragElementData.pressed = false;

        this.event      = event;
        this.isDragging = false;

        // Remove up event for drag end action.
        this.eventScope.removeEventListener(this.eventActions.end,  this.onPointerEnd, { passive: false, capture: false });
        // Remove cancel event for drag action.
        this.eventActions.cancel && this.eventScope.removeEventListener(this.eventActions.cancel,  this.onPointerCancel, { passive: false, capture: false });
        // Remove move event for drag action.
        this.eventScope.removeEventListener(this.eventActions.move,  this.onPointerMove, { passive: false, capture: false });

        this.options.delay   && this.delayWait !== null && clearTimeout(this.delayWait);
        this.options.timeOut && this.timeWait  !== null && clearTimeout(this.timeWait);

        // TODO >>>>>>>>>>>> bundan sonrasını fix
        if(!this.dragElementData.moved)
            return;

        this.rafId && cancelAnimationFrame(this.rafId);

        this.dragElementData.moved         = false;
        this.dragElementData.dragAvailable = false;

        //Middle.setData(this.initialElement,"moved",false);
        //Middle.setData(this.initialElement,"dragAvailable",false);

        this.hook("beforePointerUp");

        let ms      = this.options.revert ? this.revert() : 30;
        let dragEnd = () => {this.dragEnd()} 
            
        setTimeout(dragEnd,ms);
        
        
    }

    pointerCancel       = this.pointerEnd;
    handlePointerCancel = this.handlePointerEnd;


    // ==== Drag Processes ==========================

    // Inits drag processes after drag element was determined.
    dragInit(event){

        // Drag start flags.
        this.dragInited   = true;
        this.timeStamp    = this.event.timeStamp;
        this.process      = "dragInit";
        this.isDragging   = true;

        // Drag start flags.
        this.calcPos(event.pageX, event.pageY);

        // Drag start shared flags
        //this.dragElementData.moved = true;

        // Options progress
        this.options.timeOut   && this.timeWait !== null && clearTimeout(this.timeWait);
        this.options.helper    && this.injectHelper();
        this.options.zMode     && this.setZIndex();
        this.options.container && this.setContainer();
        this.options.scroll    && this.setScroll();

        this.renderPos();

        this.hook("onDragStart");
    }

    // TODO review
    dragEnd(){

        // drag finish processes

        this.dragElement.style[Middle.transition] = "";     
        this.process = "dragEnd";
        this.options.zMode && this.resetZIndex();

        // TODO improve helper after css etc
        if(this.options.helper ){
            this.dragElement.parentNode.removeChild(this.dragElement);
            this.dragElement=this.initialElement;
        }

        if(this.options.scrollContainer){
            //this.shareData("scrollContainer",-1);
            this.options.container && window.removeEventListener("scroll", this.onWindowScroll, {passive:false, capture:false});
        }

        this.options.container && this.shareData("container",-1);

        this.hook("afterPointerUp");

        if(this.delegator){
            Dragger.enablePooling && Dragger.cachePool && Dragger.cachePool.push(this);
            Middle.setData(this.dragElement,"dragger",null);
        }

        this.dragElementData.dragAvailable=true;
        this.defaultProps();
    }

    // Calculates and sets element's position.
    calcPos(epageX,epageY){

        let 
        pageX     = (this.options.axis != "y") ? epageX : this.pageX,
        pageY     = (this.options.axis != "x") ? epageY : this.pageY,
        tmpLeft   = pageX - this.pageX + this.rectL +  this.wPX - this.docCl - (this.hdfX - this.dfX),
        tmpTop    = pageY - this.pageY + this.rectT +  this.wPY - this.docCt - (this.hdfY - this.dfY),
        tmpRight  = tmpLeft + this.oW,
        tmpBottom = tmpTop  + this.oH,
        off;

        if(off = Middle.data(this.dragElement,"offset")){
            off[0] = tmpLeft; off[1] = tmpTop; off[2] = tmpRight; off[3] = tmpBottom;
        }else{
            Middle.data(this.dragElement,"offset",[tmpLeft, tmpTop, tmpRight, tmpBottom]); 
        }

        this.setPos(pageX, pageY);
    }

    // Sets element's position.
    setPos(pageX,pageY){

        let axis=this.options.axis, grid=this.options.grid;

        if(!grid){

            this.moveX = (Middle.moveType == "transform") ?
                          ( (axis != "y") ? pageX - this.pageX + this.tX - (this.hdfX - this.dfX) :
                                            this.tX - (this.hdfX - this.dfX) ) :
                          ( (axis != "y") ? pageX-this.hdfX : Middle.data(this.dragElement,"offset")[0]);

            this.moveY = (Middle.moveType == "transform") ?
                          ( (axis != "x") ? pageY - this.pageY + this.tY - (this.hdfY - this.dfY) :
                                            this.tY - (this.hdfY - this.dfY) ) :
                          ( (axis != "x") ? pageY-this.hdfY : Middle.data(this.dragElement,"offset")[1]);
        }else{

            const gridX = (grid.nodeType) ? grid.offsetWidth  : grid[0];
            const gridY = (grid.nodeType) ? grid.offsetHeight : grid[1];

            let distX = 0, distY = 0;

            if(axis != "y" && Math.abs(pageX - this.gX)  > gridX ){
                distX= Math.round((pageX - this.gX) / gridX) * gridX;
            }

            if(axis != "x" && Math.abs(pageY - this.gY)  > gridY ){
                distY= Math.round((pageY - this.gY) / gridY) * gridY;
            }

            this.moveX = this.tX+distX;
            this.moveY = this.tY+distY;
        }
    }

    // Writes calculated position to element's style.
    writePos(){

        if(Middle.moveType == "transform"){         
            this.dragElement.style[Middle.transform] = Middle.setTransformXY(this.moveX+this.scrL2, this.moveY+this.scrT2);
        }else{
            Middle.offset(this.dragElement, [this.moveX, this.moveY]);
        }
    }

    // Renders drag animation frames
    renderPos(){
         
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }

        if(this.options.renderFps){

            const now      = Date.now();
            const delta    = now - this.lastTime;
            const interval = 1000 / 60;

            if (delta > interval) {
                this.writePos();
                this.lastTime = now - (delta % interval);
                this.rafId = requestAnimationFrame(() => this.renderPos());
            }
        }
        else{
            this.writePos();
            this.rafId = requestAnimationFrame(() => this.renderPos());
        }
    }

    // Measures distance between hold point and drag element's bounds. 
    setHoldDiffs(pageX,pageY,holdOffset,element){

        const
        obj    = element && element.nodeType ? element : this,  // Check if obj is instance or element.
        isNode = (obj.nodeType === 1) ? true           : false, // Check if obj is acceptable dom element.
        el     = isNode ? obj                          : obj.dragElement, // Get target element
        oW     = isNode ? obj.clientWidth              : obj.oW, // Get target element's width
        oH     = isNode ? obj.clientHeight             : obj.oH; // Get target element's height
        
        let hdfX, hdfY, off = !holdOffset && isNode ? Middle.offset(el) : null;

        // Calculate hold offsets.

        if(holdOffset && holdOffset?.left){
            hdfX = (holdOffset.percent) ? oW*(holdOffset.left || 0)/100 : (holdOffset.left || 0);
        }
        else{
            hdfX = isNode ? pageX-off[0] : pageX-Middle.getData(el,"offset")[0];
        }

        if(holdOffset && holdOffset?.top){
            hdfY = (holdOffset.percent) ? oH*(holdOffset.top  || 0)/100 : (holdOffset.top  || 0);
        }
        else{
            hdfY = isNode ? pageY-off[1] : pageY-Middle.getData(el,"offset")[1];
        }

        hdfX = (isNaN(hdfX)) ? 0 : hdfX;
        hdfY = (isNaN(hdfY)) ? 0 : hdfY;

        // If obj is element, return
        if(isNode)
            return [hdfX, hdfY];

        // Or, obj is instance, store values in the instance.
        this.hdfX=hdfX;
        this.hdfY=hdfY;
    }


    // ==== Event Controls ==========================

    // TODO test all control functions, determine if freePropagation is required.

    // Checks drag start conditions and get real drag element.
    getDragElement(event){

        // Prevent middle(1) and right(2) mouse clicks.
        if (event.button === 1 || event.button === 2)
            return null;

        // Prevent browser's fail-safe mouse event while touch event is active.
        if(event.type === "mousedown" && event.type == "touchstart")
            return null;

        // Determine drag element
        let dragElement = 
        this.options.delegate
        // Element is delegator. It triggers drag events for its draggable children.
        ? Middle.closestInside(event.target, this.initialElement, this.options.delegate)
        // Element is drag item itself.
        : this.initialElement;

        if (!dragElement)
            return null;

        if(!this.stopPropagation(dragElement)){
            return null;
        }

        // If drag element is prevented to drag, cancel event.
        if(this.checkDragPrevented(dragElement) || !this.checkDragAvailable(dragElement) || !this.checkHoldable(dragElement,event))
            return null;

        return dragElement;
    }

    // Checks element's preventers list size to determine if it's prevented by child element(s).
    // If it's not empty, some of its child elements are being dragged and it's unavailable.
    checkDragPrevented(el){

        if(Middle.data(el)?.dragPreventers?.size > 0){
            this.freePropagation(el);
            return true;
        }
    }

    // Checks available flag for drag element.
    checkDragAvailable(el){
        return Middle.getData(el, "dragAvailable") !== false;
    }

    // Checks if drag element is holdable.
    checkHoldable(el,event){

        // Merge user-defined and Dragger default un-hold declarations.
        let unholdables = (this.options.unholdDefaults) ? Dragger.unholdables : "" ;
            unholdables = (this.options.unholdables) ? unholdables + " , " + this.options.unholdables : unholdables;

        // Check if pressed element is in the unholdables.
        return ( this.options.holder && Middle.inNodeList( event.target, Middle.find(el,this.options.holder) ) === -1 ) ||
            ( Middle.inNodeList( event.target, Middle.find(el, unholdables) ) !== -1)
            ? false : true;
    }

    // Stops propagation for delegated drag element.
    // Adds element to parents' preventers list.
    // Adds parents to element's prevented list.
    stopPropagation(el){

        if(this.options.stopPropagation)
            return;

        let   node    = el.parentNode || false;
        const elData  = Middle.newData(el);
        const css     = this.options.delegate || `.${Dragger.nameclass}-element`;
        const topNode = this.options.delegate ? this.initialElement : document;

        elData.dragPreventeds = elData.dragPreventeds || new Map();

        while (node && node !== topNode) {

            if (node.matches(css)){

                const nodeData = Middle.newData(node);

                if (nodeData.pressed){
                    this.freePropagation(el);
                    return false;
                }

                const dragPreventers = nodeData.dragPreventers || new Map();

                !dragPreventers.has(el) && dragPreventers.set(el,node);
                nodeData.dragPreventers = dragPreventers;
                elData.dragPreventeds.set(node,el);
            }
            node = node.parentNode;
        }

        return true;
    }

    // Frees propagation for delegated drag element.
    // Removes element from parents' preventers list.
    // Empties element's prevented list.
    freePropagation(el) {

        const elData= Middle.newData(el);

        if (!this.options.stopPropagation && elData?.dragPreventeds?.size > 0) {

            elData?.dragPreventeds?.forEach((value, node) => {
                const nodeData = Middle.data(node);
                nodeData?.dragPreventers?.delete(el);
            });

            elData?.dragPreventeds?.clear();
        }
    }


    // ==== Drag Options Processes ==================

    // Reverts drag element position
    revert(){

        //  TODO refine rules (add requestAnm)

        let easing="ease-in-out", ms=300;

        if(Middle.transition){

            switch(typeof this.options.revert) {
                 case "number":
                    ms=this.options.revert;
                    break;
                case "object":
                    ms=!this.options.revert.ms || this.options.revert.ms === true ? ms : this.options.revert.ms;
                    easing=this.options.revert.easing || easing;
                    break;
            }

            this.dragElement.style[Middle.transition]=`all ${ms}ms ${easing}`;
        }

        if(Middle.moveType == "transform"){
            this.dragElement.style[Middle.transform] = Middle.setTransformXY(this.tX, this.tY);
        }else{

            this.tX = this.tY = 0;

            Middle.offset(this.dragElement,[this.oX - this.tX - this.dragElement.parentNode.scrollLeft,
                                            this.oY - this.tY - this.dragElement.parentNode.scrollTop]);
        }

        return Middle.transition ? ms : 30;
    }

    // TODO fix shared data, work with scroll window option (buggy).
    // Set container.
    setContainer(){

        this.container = (this.options.container === true || this.options.container == "parent") ? this.dragElement.parentNode : 
                         (this.options.container === "window"   || this.options.container === window)   ? window   :
                         (this.options.container === "document" || this.options.container === document) ? document :
                         (typeof this.options.container == "string") ? Middle.closest(this.dragElement,this.options.container) : 
                         (this.options.container?.nodeType === 1) ? this.options.container : null;

        if(!this.container)
            return;

        if( !this.checkSharedData("container") ){
            
            let conL,conT,conR,conB;

            if(this.container === window){

                const docEl = document.documentElement;

                conL = window.scrollX;
                conT = window.scrollY;
                conR = conL+docEl.clientWidth;
                conB = conT+docEl.clientHeight;

            }
            else if(this.container === document){

                conL = 0;
                conT = 0;
                conR = Middle.docWidth();
                conB = Middle.docHeight();

            }
            else{

                let off = Middle.offset(this.container, null, true, "inner");
                conL=off[0]; conT=off[1]; conR=off[2]; conB=off[3]; 
            }

            Middle.setOffsetData(this.container,conL,conT,conR,conB);
        }

        //this.shareData("container",1);

        const cOff = Middle.data(this.container, "offset");

        if(this.options.grid){

            const
            gridX = this.options.grid?.nodeType ? this.options.grid.offsetWidth  : this.options.grid[0],
            gridY = this.options.grid?.nodeType ? this.options.grid.offsetHeight : this.options.grid[1],
            eB    = Middle.getData(this.dragElement,"offset"),
            oL    = cOff[0] + Math.abs((cOff[0]-eB[0]) % gridX),
            oT    = cOff[1] + Math.abs((cOff[1]-eB[1]) % gridY),
            oR    = cOff[2] - Math.abs((cOff[2]-eB[2]) % gridX),
            oB    = cOff[3] - Math.abs((cOff[3]-eB[3]) % gridY);

            this.contOff = [oL,oT,oR,oB];

        }else{

            this.contOff = cOff;

        }
    }

    // Stay drag element inside provided container while dragging.
    stayInside(){

        let
        axis  = this.options.axis,
        sides = this.options.containerSides,
        elOff = Middle.data(this.dragElement,"offset");

        // to left
        if( sides[0] && (axis != "y") && (elOff[0] <= this.contOff[0])){

            this.moveX = (Middle.moveType == "transform") ? this.contOff[0] - this.oX + this.tX : this.contOff[0];
            elOff[0] = this.contOff[0];
            elOff[2] = this.contOff[0] + this.oW;
        }

        // to right
        if( sides[2] && (axis != "y") && (elOff[2] >= this.contOff[2])){

            this.moveX = (Middle.moveType == "transform") ? this.contOff[2] - this.oX + this.tX - this.oW : this.contOff[2] - this.oW;
            elOff[2] = this.contOff[2];
            elOff[0] = this.contOff[2] - this.oW;
        }

        // to top
        if( sides[1] && (axis != "x") && (elOff[1] <= this.contOff[1])){

            this.moveY = (Middle.moveType == "transform") ? this.contOff[1] - this.oY  + this.tY : this.contOff[1];
            elOff[1] = this.contOff[1];
            elOff[3] = this.contOff[1] + this.oH;
        }

        // to bottom
        if( sides[3] && (axis != "x") && (elOff[3] >= this.contOff[3])){

            this.moveY = (Middle.moveType == "transform") ? this.contOff[3] - this.oY + this.tY - this.oH : this.contOff[3] - this.oH;
            elOff[3] = this.contOff[3];
            elOff[1] = this.contOff[3] - this.oH;
        }
    }

    // TODO fix shared data.
    // Sets scroll target.
    setScroll(){

        const opt=this.options.scroll;

        this.scrollContainer =
        // Set scroll target as window.
        ( opt === true || opt === "window" || opt === window) ? window :
        // Set scroll target as drag element's parent dom element.
        (opt === "parent") ? this.dragElement.parentNode :
        // Set scroll target as closest dom element according to given css selector.
        (typeof opt === "string") ? Middle.closest(this.dragElement,opt) :
        // Set scroll target as given dom element.
        (opt?.nodeType === 1) ? opt :
        // disabled or no available scroll target for given scroll option.
        null;

        if(!this.scrollContainer)
            return;


        if(this.container){

            this.onWindowScroll = (event) => {
                this.setContainer();
            }

            window.addEventListener("scroll", this.onWindowScroll, {passive:false, capture:false});

        }

        // Calculate scroll target metrics, set shared flag to prevent unnecessary repeated calculations.
        if( !this.checkSharedData("scrollContainer") ){

            let offW,offH,scW,scH,scL,scT,cW,cH;

            if(this.scrollContainer === window){

                let bodyEl = document.body;

                if(bodyEl.offsetWidth > bodyEl.scrollWidth && bodyEl.offsetHeight > bodyEl.scrollHeight){
                    this.scrollContainer=null;
                    return;
                }

                let
                scData = Middle.newData(window),
                docEl  = document.documentElement;

                scData.scL = window.scrollX     || docEl.scrollLeft;
                scData.scT = window.scrollY     || docEl.scrollTop;
                scData.cW  = window.innerWidth  || docEl.clientWidth;
                scData.cH  = window.innerHeight || docEl.clientHeight;

                Middle.setOffsetData(window,0,0,Middle.docWidth(),Middle.docHeight());
            }
            else{

                let
                offW = this.scrollContainer.offsetWidth,
                offH = this.scrollContainer.offsetHeight,
                scW  = this.scrollContainer.scrollWidth,
                scH  = this.scrollContainer.scrollHeight;

                if(offW >= scW && offH >= scH){
                    this.scrollContainer=null;
                    return;
                }

                let scData = Middle.newData(this.scrollContainer);

                scData.cW  = this.scrollContainer.clientWidth;
                scData.cH  = this.scrollContainer.clientHeight;
                scData.scL = this.scrollContainer.scrollLeft;
                scData.scT = this.scrollContainer.scrollTop;
                scData.scW = scW;
                scData.scH = scH;

                Middle.offset(this.scrollContainer,false,"only","inner");
            }

        }

        //TODO fix : this.shareData("scrollContainer",1); 
    }

    // Scroll process while dragging.
    scroll(){

        if(!this.scrollContainer)
            return;

        let x = 0, y = 0;
        
        const
        sens     = this.options.scrollSensitivity,
        speed    = this.options.scrollSpeed,
        elOff    = Middle.data(this.dragElement,"offset"),
        scData   = Middle.data(this.scrollContainer),
        myLeft   = (this.options.scrollMode == "pointer") ? this.event.pageX : elOff[0],
        myTop    = (this.options.scrollMode == "pointer") ? this.event.pageY : elOff[1],
        myRight  = (this.options.scrollMode == "pointer") ? this.event.pageX : elOff[2],
        myBottom = (this.options.scrollMode == "pointer") ? this.event.pageY : elOff[3];

        if(this.scrollContainer === window){

            //move to left
            if( scData.scL > 0 && (myLeft - scData.scL < sens) ){

              x=-speed;
              this.moveX-=speed;
              (this.cssPos == "fixed") && (this.scrL2=this.wPX-scData.scL+speed);

            }

            //move to right
            if( scData.scL+scData.cW < scData.offset[2] && (scData.scL + scData.cW - myRight < sens) ){

              x=speed;
              this.moveX+=speed;
              (this.cssPos == "fixed") && (this.scrL2=this.wPX-scData.scL-speed);
            }

            //move to top
            if( scData.scT > 0 && (myTop - scData.scT < sens) ){

              y=-speed;
              this.moveY-=speed;
              (this.cssPos == "fixed") && (this.scrT2=this.wPY-scData.scT+speed);
            }

            //move to bottom
            if( scData.scT+scData.cH < scData.offset[3] && (scData.scT + scData.cH - myBottom < sens) ){

              y=speed;
              this.moveY+=speed;
              (this.cssPos == "fixed") && (this.scrT2=this.wPY-scData.scT-speed);

            }

            scData.scL += x;
            scData.scT += y;

            window.scrollBy(x,y);

        }else{

            //move to left
            if(scData.scL > 0 && (myLeft - scData.offset[0] < sens)) {

                scData.scL = this.scrollContainer.scrollLeft -= speed;
                (!this.options.grid) && (this.scrL2=scData.scL - this.scrL);
            }

            //move to right
            if(scData.scL + scData.cW < scData.scW && (scData.offset[2] - myRight < sens) ){

                scData.scL = this.scrollContainer.scrollLeft += speed;
                (!this.options.grid) && (this.scrL2=scData.scL - this.scrL);
            }

            //move to top
            if(scData.scT > 0 && (myTop - scData.offset[1] < sens) ){

                scData.scT = this.scrollContainer.scrollTop -= speed;
                (!this.options.grid) && (this.scrT2=scData.scT - this.scrT);
            }

            //move to bottom
            if(scData.scT + scData.cH < scData.scH && (scData.offset[3] - myBottom < sens) ){

                scData.scT = this.scrollContainer.scrollTop += speed;
                (!this.options.grid) && (this.scrT2 = scData.scT - this.scrT);
            }

            (this.cssPos === "fixed") && (this.scrT2 = this.scrL2 = 0);
        }
    }

    // TODO fix helper funcs
    // Inject a helper element to drag instead of real drag element.
    injectHelper(){

        return;

        const parent=this.dragElement.parentNode;
        const opt = this.options.helper;
        let helper;

        if(opt === true || opt === "clone"){

            helper = this.dragElement.cloneNode(true);

            if(helper.id)
                helper.id += "-drag-helper";

            if(opt === true){
                helper.style.width  = this.oW +"px";
                helper.style.height = this.oH +"px";
            }

            parent.append(helper);
            Middle.addClass(helper,"mdl-drag-helper");

            if(Middle.moveType=="transform"){

                let off= Middle.offset(helper);

                helper.style[Middle.transform]= Middle.setTransformXY(
                  this.event.pageX - off[0] + this.tX - (this.hdfX),
                  this.event.pageY - off[1] + this.tY - (this.hdfY)
                );

                //this= this.allocData(helper,this.event,true);

            }else{

                Middle.offset( helper,[this.event.pageX,this.event.pageY]);
            }

            helper.style.position = this.cssPos == "fixed" ? "fixed": "absolute";

            this.realDragElement = this.dragElement;
            this.helperElement   = helper;
            this.dragElement     = helper;

        }else{

            helper=document.createElement('div');

            if(typeof opt === "string"){

                helper.innerHTML=opt;

            }
            else if(opt.nodeType === 1){

                helper.appendChild(opt);

            }
            else if(typeof opt === "function"){

              opt.call(helper,this.dragElement);
            }

            parent.append(helper);
            Middle.addClass(helper,"mdl-drag-helper");
            helper.style.position = this.cssPos == "fixed" ? "fixed" : "absolute";

            let
            hdf = this.options.holdOffset ? this.setHoldDiffs(helper,null,null,this.options.holdOffset) : [0,0],
            off = Middle.offset(helper);

            if(Middle.moveType=="transform"){
                helper.style[Middle.transform] = Middle.setTransformXY(
                    this.event.pageX - off[0] + this.tX - hdf[0],
                    this.event.pageY - off[1] + this.tY - hdf[1]
                );
            }else{
                Middle.offset( helper, [this.event.pageX-hdf[0], this.event.pageY-hdf[1]]);
            }

            Middle.data(helper,"dragAvailable",false);

            this.hdfX   = hdf[0];
            this.hdfY   = hdf[1];
            //this.realDragElement = this.dragElement;
            //this.helperElement   = helper;
            //this.dragElement     = helper;
        }
    }

    // Cancels drag event if provided time exceeds while pressing.
    setTimeOut(){

        if(this.options.timeOut){
            this.timeWait = setTimeout(() => {
                clearTimeout(this.timeWait);
                this.eventScope.removeEventListener(this.eventActions.move,this.onPointerMove,{ passive: false, capture: false });
            }, this.options.timeOut);
        }
    }

    // Sets first delay if provided in the options.
    setDelay(){
        if (this.options.delay) {
            this.delayed = false;
            this.delayWait = setTimeout(() => {
                clearTimeout(this.delayWait);
                this.delayed = true;
            }, this.options.delay);
        }
    }

    // Checks whether the pointer has been dragged by the user-defined distance before the element can start being dragged.
    checkDistance(pageX,pageY){

        this.distanced = (Math.abs(pageX - this.pageX) > this.options.distance ||
                        Math.abs(pageY - this.pageY) > this.options.distance)
                        ? true : false;
    }

    // TODO fix z-index order
    // Set Z-Index for drag element.
    setZIndex(element=this.dragElement){
        element.style.zIndex = (typeof this.options.zMode === "number") ? this.options.zMode : Dragger.zMax++;
    }

    // Reset Z-Index for drag element.
    resetZIndex(element=this.dragElement){
        element.style.zIndex = (this.options.zMode === "swap") ? (this.zIndex || "") : element.style.zIndex;
    }


    // ==== Utilities ===============================

    // Sets data as "shared" for optimize performance while repeating processes.
    shareData(dataName,num){

        if(!this[dataName])
            return;

        let data = Middle.data(this[dataName]) || Middle.newData(this[dataName]);

        data[dataName] = typeof data[dataName] == "number" ? data[dataName] + num : num;
    }

    // Checks if data is shared for repeating processes.
    checkSharedData(dataName){
        return this[dataName] && Middle.data(this[dataName], dataName) > 0 ? true : false;
    }

    // Call user-defined functions on events.
    hook(hookName){
        if (this.options[hookName] !== undefined) {
            this.options[hookName].call(this);
        }
    }


    // ==== Instance Processes ======================

    // TODO create instance processes

    enable(){
    }

    disable(){
    }

    destroy(){
    }

}

Dragger.defaults.prototype.extend = function(options){

    for (let key in options) {
      if (options.hasOwnProperty(key)) {
        this[key] = options[key];
      }
    }
    return this;
};

Dragger.prototype.each=Middle.prototype.each;

// We have a "Middle" instance object with dom elements in it.
// We are creating or modifying Middle.dragger instance.
Middle.prototype["dragger"] = function(options) {

    let args = arguments;

    // Create new instance.
    if (options === undefined || typeof options === 'object') {

        // Init cache pool if enabled.
        if(Dragger.enablePooling){

            let cacheSize =
            Dragger.poolInitSize == "auto" ? (options && options?.delegate) ? 25 :
            this.length+Math.floor(this.length*25/100) : Dragger.poolInitSize;

            let cacheMaxSize = 
            /*Dragger.poolMaxSize == "auto" ||*/
            typeof Dragger.poolMaxSize !== "number" ? 0 : Dragger.poolMaxSize;

            // Create new cache pool.
            if (!Dragger.cachePool){
                Dragger.cachePool = Middle.poolCreate(Dragger,cacheSize)
            }

            typeof Dragger.cachePool == "object" && Dragger.poolAutoIncrease && Dragger.cachePool.increase(cacheSize);
            (typeof Dragger.cachePool != "object") && (Dragger.cachePool = Middle.poolCreate(Dragger,cacheSize,cacheMaxSize));
        }

        // Create new instance (if it's not exist) for every element. 
        return this.each(function (i,el) {
             !Middle.getData(el,"dragger") && Dragger.newInstance(el,options);
        });

    }
    // if "options" is function, execute or if it is set/get method, return/change value
    else if(typeof options === 'string') {

        let result;

        this.each(function() {

            let instance = Middle.getData(this, "dragger");

            // Get & Set option
            if(instance instanceof Dragger && args[0] === "option"){

                // Get option
                if(args[1] !== undefined && args[2] === undefined){
                    result = instance.options[args[1]];
                }
                // Set option
                else if(args[1] !== undefined && args[2] !== undefined) {
                    instance.options[args[1]] = args[2];
                }
            }

            else if (instance instanceof Dragger && typeof instance[options] === 'function') {
                //result = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                result = instance[options].call(instance, ...args.slice(1));
            }

        });

        // return result value
        return result !== undefined ? result : this;
    }
}

export default Dragger
