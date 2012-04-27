
;(function(undefined){
    var PACKAGE_STATUS = {
        UNDEFINED: 0,
        BUILDED: 1,
        LOADED: 2,
        INITED: 3
    };
    var LIBRARY_NAME = 'Z';
    
    var packageList = {};
    var dependenceQueue = {};
    
    var emptyFunction = function(){};
    
    var isDebuging = 0;
    var debug = isDebuging ? (window.console ? function(data){
        console.debug ? console.debug(data) : console.log(data);
    } : emptyFunction) : emptyFunction;
    
    var anonymousCount = 0;
    var getAnonymousPackageName = function(){
        return LIBRARY_NAME + '.' + 'anonymous' + '.' + anonymousCount++;
    }

    /**
     * @param {String} packageName
     */
    var buildPackage = function(packageName){
        var pack = packageList[packageName];
        if(!pack){
            pack = window;
            var nameList = packageName.split('.');
            for(var i in nameList){
                if(!(nameList[i] in pack)){
                    pack[nameList[i]] = {};
                }
                pack = pack[nameList[i]];
            }
            packageList[packageName] = pack;
        }
        if(!('packageName' in pack)){
            pack.packageName = packageName;
        }
        if(!('packageStatus' in pack)){
            pack.packageStatus = PACKAGE_STATUS.BUILDED;
        }
        debug('buildPackage: ' + packageName);
        return pack;
    };
    
    var getPackage = function(packageName){
        if(packageList[packageName]){
            return packageList[packageName];
        }
        var nameList = packageName.split('.');
        var pack = window;
        for(var i in nameList){
            if(!(nameList[i] in pack)){
                return undefined;
            }
            pack = pack[nameList[i]];
        }
        return pack;
    };
    
    var getPackageStatus = function(packageName){
        var pack = getPackage(packageName);
        var status = pack ? pack.packageStatus : PACKAGE_STATUS.UNDEFINED;
        return status;
    };
    
    var initPackage = function(pack, requirePackages, constructor){
        if(typeof pack === 'string'){
            pack = getPackage(pack);
        }
        var require = {};
        var library = getPackage(LIBRARY_NAME);
        if(requirePackages){
            for(var r in requirePackages){
                require[r] = getPackage(requirePackages[r]);
            }
        }
        debug('initPackage: ' + pack.packageName);
        if(constructor){
            constructor.call(pack, library, require);
            debug('package [[' + pack.packageName + ' inited]]');
        }
        pack.packageStatus = PACKAGE_STATUS.INITED;
        runDependenceQueue(pack.packageName);
    };
    
    var checkDependence = function(requirePackages){
        if(!requirePackages){
            return true;
        }
        var requirePackageName;
        for(var r in requirePackages){
            requirePackageName = requirePackages[r];
            if(getPackageStatus(requirePackageName) !== PACKAGE_STATUS.INITED){
                return false;
            }
        }
        return true;
    };
    
    var addToDependenceQueue = function(packageName, requirePackages, constructor){
        debug('>>>addToDependenceQueue, package: ' + packageName);
        var requirePackageName;
        for(var r in requirePackages){
            requirePackageName = requirePackages[r];
            if(!dependenceQueue[requirePackageName]){
                dependenceQueue[requirePackageName] = [];
            }
            dependenceQueue[requirePackageName].push({
                packageName: packageName, 
                requirePackages: requirePackages, 
                constructor: constructor
            });
        }
    };
    
    var runDependenceQueue = function(packageName){
        var requireQueue = dependenceQueue[packageName];
        if(!requireQueue){
            return false;
        }
        debug('<<<runDependenceQueue, dependented package: ' + packageName);
        var flag = false, require;
        for(var r = 0; r < requireQueue.length; r++ ){
            require = requireQueue[r];
            if(checkDependence(require.requirePackages)){
                flag = true;
                initPackage(require.packageName, require.requirePackages, require.constructor);
            }
        }
        delete dependenceQueue[packageName];
        return flag;
    };
    
    /**
     * @param {String} packageName
     * @param {Object} requirePackages for 异步按需加载各种依赖模块
     * { shortName: packageName } or [packageName]
     * @param {Function} constructor
     * @example 
     *  Z.$package('Z.test', function(z){
        });
        Z.$package('Z.test.test1', {
            t: 'Z.test2',
            u: 'Z.util',
            o: 'Z.tools'
        }, function(z, d){
            console.log(d.t);
        });
        Z.$package('Z.test2', function(z){
            console.log(11111111);
        });
        Z.$package('Z.test2', function(z){
            console.log(22222222);
        });
        Z.$package('Z.util', {
            t: 'Z.tools'
        }, function(z){
        });
        Z.$package('Z.tools',function(z){
        });
     */
    var $package = function(){
        var packageName, requirePackages,  constructor;
        packageName = arguments[0];
        if(arguments.length === 3){
            requirePackages = arguments[1];
            constructor = arguments[2];
        }else if(arguments.length === 2){
            constructor = arguments[1];
        }else{
            packageName = getAnonymousPackageName();
            constructor = arguments[0];
        }
        var pack = buildPackage(packageName);
        if(pack.packageStatus === PACKAGE_STATUS.BUILDED){
            pack.packageStatus = PACKAGE_STATUS.LOADED;
        }
        if(requirePackages && !checkDependence(requirePackages)){
            addToDependenceQueue(packageName, requirePackages, constructor);
        }else{
            initPackage(pack, requirePackages, constructor);
        }
    };
    
    /**
     * init the library
     */
    $package(LIBRARY_NAME, function(z){
        
        z.PACKAGE_STATUS = PACKAGE_STATUS;
        z.$package = $package;
        z.getPackage = getPackage;
        z.getPackageStatus = getPackageStatus;
        
    });
    
})();
;Z.$package('Z.array', function(z){
    
    /**
     * 从给定数组移除指定元素, 只删除一个
     * @param  {Array} arr  
     * @param  {Object},{String} key or item
     * @param {Object} value @optional 指定值
     * @return {Boolean}      找到并移除返回 true
     */
    this.remove = function(arr, key, value){
        var flag = false;
        if(arguments.length === 2){//两个参数
            var item = key;
            var index = arr.indexOf(item);
            if(index !== -1){
                arr.splice(index, 1);
                flag = true;
            }
            return flag;
        }else{
            for(var i = 0, len = arr.length; i < len; i++){
                if(arr[i][key] === value){
                    arr.splice(i, 1);
                    flag = true;
                    break;
                }
            }
            return flag;
        }
    };

    /**
     * 根据指定 key 和 value 进行筛选
     * @param  {Array} arr   
     * @param  {String} key   
     * @param  {Object} value 
     * @return {Array}       
     */
    this.filter = function(arr, key, value){
        var result = [];
        for(var i in arr){
            if(arr[i][key] === value){
                result.push(arr[i]);
            }
        }
        return result;
    }

    /**
     * 判断arr是否包含元素o
     * @memberOf array
     * @param {Array} arr
     * @param {Obejct} o
     * @return {Boolean}
     */
    this.contains = function(arr, o){
        return arr.indexOf(o) > -1;
    };
    
    /**
     * 对数组进行去重
     * @memberOf array
     * @param {Array} arr
     * @return {Array} 由不重复元素构成的数组
     */
    this.uniquelize = function(arr){
        var result = [];
        for(var i = 0, len = arr.length; i < len; i++){
            if(!this.contains(result, arr[i])){
                result.push(arr[i]);
            }
        }
        return result;
    };
    
    /**
     * 把伪数组转换成速组, 如 NodeList , Arguments等有下标和length的对象
     * @param  {Object}, {NodeList} obj 
     * @return {Array}
     */
    this.parse = function(obj){
        return Array.prototype.slice.call(obj);
    }

});
/**
 * 一些最基本的方法, 提供简单的访问方式
 */
;Z.$package('Z', function(z){
    
    /**
     * 简易的 debug 方法, 没有 console 则不起任何作用
     * @param  {Object} data 
     */
    this.debug = function(data){
        if(window.console){
            console.debug ? console.debug(data) : console.log(data);
        }else{
            //alert(data);
        }
    };

    var toString = Object.prototype.toString;

    this.is = function(type, obj) {
        var clas = toString.call(obj).slice(8, -1);
        return obj !== undefined && obj !== null && clas === type;
    }
    
    this.isString = function(obj){
        return toString.call(obj) === '[object String]';
    }
    
    this.isArray = Array.isArray || function(obj){
        return toString.call(obj) === '[object Array]';
    }
    
    this.isArguments = function(obj){
        return toString.call(obj) === '[object Arguments]';
    }
    
    this.isObject = function(obj){
        return toString.call(obj) === '[object Object]';
    }
    
    this.isFunction = function(obj){
        return toString.call(obj) === '[object Function]';
    }
    
    this.isUndefined = function(obj){
        return toString.call(obj) === '[object Undefined]';
    }
    
    /**
     * 判断对象或数组是否为空, 如{},[]责返回false
     * @param  {Object} 
     * @return {Boolean}
     */
    this.isEmpty = function(obj){
        if(!obj){
            return false;
        }else if(this.isArray(obj)){
            return !!obj.length;
        }else{
            for(var i in obj){  
                return false;
            }
            return true;
        }
    }

    /**
     * 合并几个对象并返回 baseObj,
     * 如果 extendObj 有数组属性, 则直接拷贝引用
     * @param {Object} baseObj 基础对象
     * @param {Object} extendObj ... 
     * 
     * @return {Object} baseObj
     * 
     **/
    var merge = function(baseObj, extendObj1, extendObj2/*, extnedObj3...*/){
        var argu = arguments;
        var extendObj;
        for(var i = 1; i < argu.length; i++){
            extendObj = argu[i];
            for(var j in extendObj){
                if(z.isArray(extendObj[j])){
                    baseObj[j] = extendObj[j].concat();
                }else if(z.isObject(extendObj[j])){
                    if(baseObj[j] && z.isArray(baseObj[j])){
                    //避免给数组做 merge
                        baseObj[j] = merge({}, extendObj[j]);
                    }else{
                        baseObj[j] = merge({}, baseObj[j], extendObj[j]);
                    }
                }else{
                    baseObj[j] = extendObj[j];
                }
            }
        }
        return baseObj;
    }
    
    /**
     * 把传入的对象或数组或者参数对象(arguments)复制一份
     * @param {Object}, {Array}
     * @return {Object}, {Array} 一个新的对象或数组
     */
    var duplicate = function(obj){
        if(z.isArray(obj)){
            return obj.concat();
        }else if(z.isArguments(obj)){
            var result = [];
            for(var a = 0, p; p = obj[a]; a++){
                result.push(duplicate(p));
            }
            return result;
        }else if(z.isObject(obj)){
            return merge({}, obj);
        }else{
            throw new Error('the argument isn\'t an object or array');
        }
    }

    /**
     * 使子类简单继承父类, 仅仅将父类的静态属性方法和实例属性方法拷贝给子类
     * @param  {Function} child  子类
     * @param  {Function} parent 父类
     * @return {Function} child 
     * @example
     * function parent(){
     * }
     * parent.prototype {};
     * function child(){
     * }
     * child.prototype = {};
     * extend(child, parent);
     */
    var extend = function(child, parent){
        //继承 parent 的静态方法
        merge(child, parent);
        //继承 parent 的 prototype
        child.prototype = merge({}, parent.prototype, child.prototype);
        child.prototype.constructor = child;
    }

    this.merge = merge;
    this.duplicate = duplicate;
    this.extend = extend;
    
});
;Z.$package('Z.browser', function(z){
    var packageContext = this;
    
    (function(){
        var browser = {};
        browser.set = function(name, version){
            this.name = name;
            this.version = version;
            this[name] = version;
        };
        var s, ua = navigator.userAgent.toLowerCase();
        (s = ua.match(/msie ([\d.]+)/)) ? browser.set("ie",(s[1])):
        (s = ua.match(/firefox\/([\d.]+)/)) ? browser.set("firefox",(s[1])) :
        (s = ua.match(/chrome\/([\d.]+)/)) ? browser.set("chrome",(s[1])) :
        (s = ua.match(/opera.([\d.]+)/)) ? browser.set("opera",(s[1])) :
        (s = ua.match(/version\/([\d.]+).*safari/)) ? browser.set("safari",(s[1])) : 0;
        
        Z.merge(packageContext, browser);
        
    })();
    
    var privatePrefixs = {
        ie: 'Ms',
        firefox: 'Moz',
        opera: 'O',
        chrome: 'Webkit',
        safari: 'Webkit'
    };
    var getPrivatePrefix = function(browserName){
        return privatePrefixs[browserName || z.browser.name];
    };
    
    var checkerElement;
    
    var getCheckerElement = function(){
        if(!checkerElement){
            checkerElement = document.createElement('div');
        }
        return checkerElement;
    }
    
    /**
     * 检测 css 的支持
     * @param {String} property 指定需要检测的属性
     * @param {String} value 检测是否支持指定值 @optional
     * @param {Boolean} checkPrivate 指定是否尝试检测浏览器的私有支持 @default false @optional
     */
    this.cssSupport = function(property, value, checkPrivate){
        // throw new Error('not support');
        var element = getCheckerElement();
        if(property in element.style){//TODO 不够完善
            element.style[property] = value;
            return element.style[property] === value;
        }else if(checkPrivate){
            var firstChar = property.charAt(0).toUpperCase();
            property = getPrivatePrefix() + firstChar + property.substr(1);
            return cssSupport(property, false, value);
        }else{
            return false;
        }
    }
    
    
});

;Z.$package('Z', function(z){
    
    var emptyFunction = function(){};

    /**
     * @ignore
     */
    var _classToString = function(){
        return this.className;
    }

    /**
     * 定义类
     * @param {Object} option , 可指定 extend 和 implements, statics
     * {extend: {Class}, //继承的父类
     * implements: [{Interface}],//所实现的接口
     * name: {String}, //类名
     * statics: {{String}: {Function}||{Object}},//定义的静态变量和方法
     * }
     * 
     * @param {Object} prototype, 原型链, 必须要有 init 方法
     **/
    var defineClass = function(option, prototype){
        if(arguments.length === 1){
            prototype = option;
            option = {};
        }
        prototype = prototype || {};
        if(!z.isFunction(prototype.init)){
            // throw new Error('a class must have a "init" method');
           // 没有的 init 方法的时候指定一个空的
           prototype.init = emptyFunction;
        }
        var newClass = function(){
            // z.debug( 'class [' + newClass.className + '] init');
            return this.init.apply(this, arguments);
        };
        var superClass = option.extend;
        if(superClass){
            if(isInterface(superClass)){
                throw new Error('can not extend a interface!');
            }
            var superInit = superClass.prototype.init;
            var thisInit = prototype.init;//释放传入 prototype 变量的引用, 以便内存回收
            var superPrototype = z.duplicate(superClass.prototype);
            delete superPrototype.init;
            var newPrototype = newClass.prototype = z.merge({}, superClass.prototype, prototype);
            //处理被重写的方法, 提供在子类调用 this.$super(); 的方式调用
            for(var prop in superPrototype){
                if(z.isFunction(superPrototype[prop]) && z.isFunction(newPrototype[prop])){
                    newPrototype[prop] = (function(superFn, subFn){
                        return function(){
                            var tmp = this.$super;
                            this.$super = superFn;
                            subFn.apply(this, arguments);
                            this.$super = tmp;
                        }
                    })(superPrototype[prop], newPrototype[prop]);
                }
            }
            newClass.prototype.init = function(){
                var argus = z.duplicate(arguments);
                superInit.apply(this, argus);
                this.$static = newClass;//提供更快速的访问类方法的途径
                thisInit.apply(this, arguments);
            }
        }else{
            var thisInit = prototype.init;
            newClass.prototype = prototype;
            newClass.prototype.init = function(){
                this.$static = newClass;//提供更快速的访问类方法的途径
                var argus = arguments;
                thisInit.apply(this, argus);
            }
        }
        newClass.prototype.constructor = newClass;
        newClass.type = 'class';
        newClass.className = option.name || 'anonymous';
        // newClass.toString = _classToString;

        var impls = option['implements'];
        if(impls){
            var unImplMethods = [], implCheckResult;
            for(var i in impls){
                implCheckResult = impls[i].checkImplements(newClass.prototype);
                unImplMethods = unImplMethods.concat(implCheckResult);
            }
            if(unImplMethods.length){
                throw new Error('the \'' + newClass.className + '\' class hasn\'t implemented the interfaces\'s methods . [' + unImplMethods + ']');
            }
        }
        if(option.statics){
            z.merge(newClass, option.statics);
        }
        return newClass;
    }
    
    /**
     * 判断传入类是否是接口
     **/
    var isInterface = function(cls){
        if(cls.type === 'interface' && z.isArray(cls.methods) && z.isFunction(cls.checkImplements)){
            return true;
        }
        return false;
    }
    
    /**
     * @ignore
     */
    var _checkImplements = function(instance){
        var unImplMethods = [], impl;
        for(var i in this.methods){
            impl = instance[this.methods[i]];
            if(!impl || !z.isFunction(impl)){
                unImplMethods.push(methods[i]);
            }
        }
        return unImplMethods;
    }

    /**
     * @ignore
     */
    var _interfaceToString = function(){
        return this.interfaceName;
    }

    /**
     * 定义接口
     **/
    var defineInterface = function(option, methods){
        if(arguments.length === 1){
            methods = option;
            option = {};
        }
        var newInterface = function(){
            throw new Error('the interface can not be Instantiated!');
        }
        newInterface.type = 'interface'
        newInterface.interfaceName = option.name || 'anonymous';
        newInterface.methods = methods;
        newInterface.checkImplements = _checkImplements;
        return newInterface;
    }
    
    /**
     * 定义类或接口
     * @example
     *  var A = define('class', {
            name: 'classA'
        }, {
            init: function(){
                console.log('A init');
            },
            alertA: function(){
                alert('A');
            }
        });
        
        var B = define('class', { extend: A , statics: {
            kill: function(){
                alert('kill B');
            }
            
        }}, {
            init: function(){
                console.log('B init');
            },
            alertB: function(){
                alert('B');
            }
        });
        
        var C = define('interface', [
            'foo',
            'bar'
        ]);
        
        var D = define('class', { extend: B, 'implements': [ C ]}, {
            init: function(){
                console.log('D init');
            },
            foo: function(){
                console.log('foooooo');
            },
            bar: function(){
            }
        });

     *
     **/
    var define = function(type, option, prototype){
        var args = Array.prototype.slice.call(arguments, 1);
        if(type === 'class'){
            return defineClass.apply(this, args);
        }else if(type === 'interface'){
            return defineInterface.apply(this, args);
        }
        
    }
    
    this.define = define;
    this.$class = defineClass;
    this.$interface = defineInterface;
});
;Z.$package('Z.cookie', function(z){

    var defaultDomain = window.location.host;
    
    /**
     * 设置一个 cookie 
     * @param {String} name 
     * @param {String},{Object} value  
     * @param {String} domain 
     * @param {String} path   
     * @param {Number} hour  
     */
    this.set = function(name, value, domain, path, hour) {
        if (hour) {
            var today = +new Date;
            var expire = new Date();
            expire.setTime(today + 3600000 * hour);
        }
        if(!z.isString(value)){
            value = JSON.stringify(value);
        }
        value = window.encodeURIComponent(value);
        window.document.cookie = name + '=' + value + '; ' 
            + (hour ? ('expires=' + expire.toGMTString() + '; ') : '') 
            + (path ? ('path=' + path + '; ') : 'path=/; ') 
            + (domain ? ('domain=' + domain + ';') : ('domain=' + defaultDomain + ';'));
    }
    
    /**
     * 取 cookie 值
     * @param  {String} name 
     * @return {String}      
     */
    this.get = function(name) {
        var r = new RegExp('(?:^|;+|\\s+)' + name + '=([^;]*)');
        var m = window.document.cookie.match(r);
        var value = !m ? '' : m[1];
        value = window.decodeURIComponent(value);
        try{
            value = JSON.parse(value);
        }catch(e){

        }
        return value;
    }
    
    /**
     * 删除指定cookie
     * 
     * @param {String} name
     * @param {String} domain
     * @param {String} path 
     */
    this.remove = function(name, domain, path) {
        window.document.cookie = name + '=; expires=Mon, 26 Jul 1997 05:00:00 GMT; ' 
            + (path ? ('path=' + path + '; ') : 'path=/; ') 
            + (domain ? ('domain=' + domain + ';') : ('domain=' + defaultDomain + ';'));
    }
    
});

;Z.$package('Z.date', function(z){
    
    /**
     * 格式化日期
     * @param {Date} date
     * @param {String} format "yyyy-MM-dd hh:mm:ss"
     */
    this.format = function(date, format) {
        /*
         * eg:format="yyyy-MM-dd hh:mm:ss";
         */
        var o = {
            "M+" : date.getMonth() + 1, // month
            "d+" : date.getDate(), // day
            "h+" : date.getHours(), // hour
            "m+" : date.getMinutes(), // minute
            "s+" : date.getSeconds(), // second
            "q+" : Math.floor((date.getMonth() + 3) / 3), // quarter
            "S" : date.getMilliseconds()
                // millisecond
        }

        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4
                    - RegExp.$1.length));
        }

        for (var k in o) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1
                        ? o[k]
                        : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return format;
    }
    
});

;Z.$package('Z.dom', function(z){

    var ELLIPSIS_TEMP_STYLE = 'position: absolute;left: -99999em;width: auto !important;';
    /**
     * 文本溢出处理, 默认替换为 "…"
     * @param {HTMLElement} element
     * @param {String} ellipsisText @optional
     */
    this.ellipsis = function(element, ellipsisText){
        //TODO 多行支持
        var limitWidth = element.clientWidth;
        ellipsisText = ellipsisText || '…';
        var temp = element.cloneNode(true);
        temp.id = 'checkTextLengthNode';
        temp.style.cssText = ELLIPSIS_TEMP_STYLE;
        element.parentNode.appendChild(temp);
        var realWidth = temp.clientWidth;
        if(realWidth <= limitWidth){
            return;
        }
        temp.innerHTML = ellipsisText;
        var elliWidth = temp.clientWidth;

        var str = element.innerHTML;
        str = str.replace(/\s+/g, ' ');
        var s, totalWidth = 0;
        for(var i = 0, len = str.length; i < len; i++){
            s = str.charAt(i);
            temp.innerHTML = (s === ' ' ? '&nbsp;' : s);
            totalWidth += temp.clientWidth ;
            if(totalWidth + elliWidth > limitWidth){
                str = str.substr(0, i);
                break;
            }
        }
        element.innerHTML = str + ellipsisText;
        temp.parentNode.removeChild(temp);
    }
    
});

;Z.$package('Z.dom', ['Z.string'], function(z){
    
    var packageContext = this;

    /**
     * shot of getElementById
     * @param {String} id 
     */
    this.get = function(id){
        return document.getElementById(id);
    }

    /**
     * 简单的查找封装, 只支持一个选择符, 性能不高, 需要高性能的请使用jquery
     * 改方法只是提供用于 简单页面, 不需要jquery的场景使用
     * @param  {String} selector 选择器, 如 #id, .class, tag
     * @return {NodeList}, {Node}
     */
    this.query = function(selector, parentNode){
        parentNode = parentNode || document;
        var s = selector.charAt(0);
        var v = selector.substring(1);
        if(s === '#'){
            return this.get(v);
        }else if(s === '.'){
            return parentNode.querySelectorAll(selector);
        }else{
            return parentNode.getElementsByTagName(selector);
        }
    }
    
    var templateList = {};
    
    /**
     * 获取页面的一个 html 模板
     * @param {String} tmplId 模板的 dom id
     */
    this.getTemplate = function(tmplId){
        var tmpl = templateList[tmplId];
        if(!tmpl){
            var tmplNode = this.get(tmplId);
            tmpl = tmplNode.innerHTML;
            tmplNode.parentNode.removeChild(tmplNode);
            templateList[tmplId] = tmpl;
        }
        if(!tmpl){
            throw new Error('no such template. [id="' + tmplId + '"]');
        }
        return tmpl;
    }
    
    /**
     * 获取点击的事件源, 该事件源是有 cmd 属性的 默认从 event.target 往上找三层,找不到就返回null
     * 
     * @param {Event}
     *            event
     * @param {Int}
     *            level 指定寻找的层次, 默认 3
     * @param {String}
     *            property 查找具有特定属性的target,默认为cmd
     * @param {HTMLElement} parent 指定查找结束点, 默认为document.body
     * @return {HTMLElement} | null
     */
    this.getActionTarget = function(event, level, property, parent){
        var t = event.target,
            l = level || 3,
            s = level !== -1,
            p = property || 'cmd',
            end = parent || document.body;
        while(t && (t !== end) && (s ? (l-- > 0) : true)){
            if(t.getAttribute(p)){
                return t;
            }else{
                t = t.parentNode;
            }
        }
        return null;
    }
    
    /**
     *  @param {HTMLElement},{String} targetId, target dom or dom id
     *  @param {String} tmplId template dom id
     *  @param {Object} data
     *  @param {Number} position @optional the index to insert, -1 to plus to last
     */
    this.render = function(target, tmplId, data, position){
        data = data || {};
        var tabTmpl = this.getTemplate(tmplId);
        var html = z.string.template(tabTmpl, data);
        if(typeof target === 'string'){
            target = this.get(target);
        }
        if(!z.isUndefined(position) && target.childElementCount){
            var tempNode = document.createElement('div');
            tempNode.innerHTML = html;
            var nodes = tempNode.children;
            var fragment = document.createDocumentFragment();
            while(nodes[0]){
                fragment.appendChild(nodes[0]);
            }
            if(position === -1 || position >= target.childElementCount - 1){
                target.appendChild(fragment);
            }else{
                target.insertBefore(fragment, target.children[position]);
            }
            delete tempNode;
        }else{
            target.innerHTML = html;
        }
    }
    
    /**
     * @param  {HTMLElement}  targetElement   
     * @param  {String}  eventName 触发命令的事件名
     * @param {Object} commends 命令对象
     * 
     * @example
     * bindCommends(cmds);
     * bindCommends(el, cmds);
     * bindCommends(el, 'click', cmds);
     * 
     * function(param, target, event){
     * }
     */
    this.bindCommends = function(targetElement, eventName, commends){
        var defaultEvent = 'click';
        if(arguments.length === 1){
            commends = targetElement;
            targetElement = document.body;
            eventName = defaultEvent;
        }else if(arguments.length === 2){
            commends = eventName;
            eventName = defaultEvent;
        }
        if(targetElement.__commends){//已经有commends 就合并
            z.merge(targetElement.__commends, commends);
            return;
        }
        targetElement.__commends = commends;
        targetElement.addEventListener(eventName, function(e){
            var target = packageContext.getActionTarget(e, 3, 'cmd', this);
            if(target){
                var cmd = target.getAttribute('cmd');
                var param = target.getAttribute('param');
                if(target.href && target.getAttribute('href').indexOf('#') === 0){
                    e.preventDefault();
                }
                if(this.__commends[cmd]){
                    this.__commends[cmd](param, target, e);
                }
            }
        });
    }
    /**
     * 判断 element 在 reference 中是否可见, reference 必须是 relative 或 absolute  定位, 最好是可滚动的
     * @param  {HTMLElement}  element   
     * @param  {HTMLElement}  reference 
     * @param {Boolean} strict 指定严格模式, 若为 true, 则需要 element 完全在可视区才返回 true
     * @return {Boolean} 可见范围中返回 true
     */
    this.isVisible = function(element, reference, strict){
        if(strict){
            if(element.offsetTop - reference.scrollTop >= 0 && 
                element.offsetTop + element.clientHeight - reference.scrollTop <= reference.clientHeight){
                return true;
            }else{
                return false;
            }
        }else{
            if(element.offsetTop + element.clientHeight - reference.scrollTop > 0 && 
                element.offsetTop - reference.scrollTop < reference.clientHeight){
                return true;
            }else{
                return false;
            }
        }
    }
    
});
/**
 * @namespace Z.message
 * zTool 使用全局的消息通知机制, 需要监听消息的模块调用addListener注册一个回调函数,
 * 当有指定消息到达时触发
 */
;Z.$package('Z.message', function(z) {
    var IE_CUSTOM_EVENT = 'onpropertychange';
    var IE_EVENT_ELEMENT_STYLE = 'position: absolute; top: -9999em; left: -9999em; width: 0px; height: 0px;';

    var eventElement;

    var increaseId = 0;

    var getEventElement = function() {
        if (!eventElement) {
            eventElement = document.createElement('div');
            if (!document.createEvent) {
                eventElement.style.cssText = IE_EVENT_ELEMENT_STYLE;
                document.body.appendChild(eventElement);
            }
        }
        return eventElement;
    }

    var getListenerId = function(){
        return +new Date + '' + increaseId++ ;
    }

    /**
     * 添加事件监听
     * @param {Object} model 消息的挂载目标, 可选, 默认为 window
     * @param {String} type 消息类型
     * @param {Function} func 监听函数
     * func 的调用参数为 ({String}: type, {Object}: message)
     */
    var addListener = function(model, type, func) {
        var listener;
        var wrapFunc;
        var element;
        var listeners;
        var listenerId;
        if(arguments.length < 2){
            throw new Error('addListener arguments not enough');
        }else if (arguments.length === 2) {
            func = type;
            type = model;
            model = window;
        }
        if (!model.__listeners) {
            model.__listeners = {};
            model.__listenerId = getListenerId();
        }
        listeners = model.__listeners;
        listenerId = model.__listenerId;
        if (!listeners[type]) {
            listeners[type] = [];
        } else {
            for (var i in listeners[type]) {
                listener = listeners[type][i];
                if (listener.func === func) {
                    return false;
                }
            }
        }
        element = getEventElement();
        if (element.addEventListener) {
            wrapFunc = function(e) {
                func.apply(window, e.params);
            }
            element.addEventListener(listenerId + '-' + type, wrapFunc, false);
        } else {
            wrapFunc = function(e) {
                e = window.event;
                //TODO ie8及以下的浏览器后绑定的方法先执行, 导致触发的事件执行顺序倒过来了
                //没精力去自己实现顺序执行, 先这样吧
                var lid = e.params.pop();
                if (type === e.params[1] && lid === listenerId) {
                    func.apply(window, e.params);
                }
            }
            element.attachEvent(IE_CUSTOM_EVENT, wrapFunc);
        }
        listener = {
            func: func,
            wrapFunc: wrapFunc
        };
        listeners[type].push(listener);
        return true;
    }
    /**
     * 移除事件监听
     * @param {Object} model 消息的挂载目标, 可选, 默认为 window
     * @param {String} type
     * @param {Function} func 监听函数
     */
    var removeListener = function(model, type, func) {
        var listener;
        var element;
        var listeners;
        var listenerId;
        if(arguments.length < 2){
            throw new Error('removeListener arguments not enough');
        }else if (arguments.length === 2) {
            func = type;
            type = model;
            model = window;
        }
        listeners = model.__listeners;
        listenerId = model.__listenerId;
        if (!listeners || !listeners[type]) {
            return false;
        }
        element = getEventElement();
        // TODO 这个支持有存在的必要吗
        // if (!func) {
        //     for (var i in listeners[type]) {
        //         listener = listeners[type][i];
        //         if (element.removeEventListener) {
        //             element.removeEventListener(type, listener.wrapFunc, false);
        //         } else {
        //             element.detachEvent(IE_CUSTOM_EVENT, listener.wrapFunc);
        //         }
        //     }
        //     listeners[type] = null;
        //     delete listeners[type];
        //     return true;
        // }
        for (var i in listeners[type]) {
            listener = listeners[type][i];
            if (listener.func === func) {
                listeners[type].slice(i, 1);
                if (element.removeEventListener) {
                    element.removeEventListener(listenerId + '-' + type, listener.wrapFunc, false);
                } else {
                    element.detachEvent(IE_CUSTOM_EVENT, listener.wrapFunc);
                }
                return true;
            }
        }
        return false;
    }

    /** 
     * 向消息的监听者广播一条消息
     * @param {Object} model 消息的挂载目标, 可选, 默认为 window
     * @param {String} type ,消息类型
     * @param {Object} message, 消息体, 可选
     * @example
     * var func1 = function(type, message){
            console.log('help!!!!! don\t kill me ..... call 110.');
            throw '110';
        }
        
        z.message.on('kill', func1);
        
        z.message.on('kill', function(type, message){
            console.log('ok, i m dead.');
            
        });
        
        //notify it
        z.message.notify('kill')
        //or 
        z.message.notify(window, 'kill')
     *
     */
    var notify = function(model, type, message) {
        var element;
        var event;
        var listeners;
        var listenerId;
        if (arguments.length === 1) {
            type = model;
            model = window;
        }else if (arguments.length === 2 && z.isString(model)) {
            message = type;
            type = model;
            model = window;
        }
        z.debug('notify message: ' + type);
        listeners = model.__listeners;
        listenerId = model.__listenerId;
        if (!listeners || !listeners[type]) {
            return false;
        }

        element = getEventElement();
        if (document.createEvent) {
            event = document.createEvent('Events');
            event.initEvent(listenerId + '-' + type, false, false);
            event.params = [message, type];
            element.dispatchEvent(event);
        } else {
            event = document.createEventObject(IE_CUSTOM_EVENT);
            event.params = [message, type, listenerId];
            element.fireEvent(IE_CUSTOM_EVENT, event);
        }
        return listeners[type].length !== 0;
    }

    this.addListener = addListener;
    this.on = addListener;
    this.removeListener = removeListener;
    this.off = removeListener;
    this.notify = notify;
});

;Z.$package('Z.number', function(z){
    
    /**
     * 格式化数字
     * @param {Number} number
     * @param {String} pattern "00#.###.##00"
     * @return {String}
     */
    this.format = function(number, pattern){
        var strarr = number.toString().split('.');
        var fmtarr = pattern ? pattern.split('.') : [''];
        var retstr='';

        // 整数部分
        var str = strarr[0];
        var fmt = fmtarr[0];
        var i = str.length-1;  
        var comma = false;
        for(var f=fmt.length-1;f>=0;f--){
            switch(fmt.substr(f,1)){
                case '#':
                    if(i>=0 ) retstr = str.substr(i--,1) + retstr;
                    break;
                case '0':
                    if(i>=0){
                        retstr = str.substr(i--,1) + retstr;
                    }
                    else {
                        retstr = '0' + retstr;
                    }
                    break;
                case ',':
                    comma = true;
                    retstr=','+retstr;
                    break;
            }
        }
        if(i>=0){
            if(comma){
                var l = str.length;
                for(;i>=0;i--){
                    retstr = str.substr(i,1) + retstr;
                    if(i>0 && ((l-i)%3)==0){
                        retstr = ',' + retstr;
                    }
                }
            }
            else{
                retstr = str.substr(0,i+1) + retstr;
            }
        }
        retstr = retstr+'.';
        // 处理小数部分
        str=strarr.length>1?strarr[1]:'';
        fmt=fmtarr.length>1?fmtarr[1]:'';
        i=0;
        for(var f=0;f<fmt.length;f++){
            switch(fmt.substr(f,1)){
            case '#':
                if(i<str.length){
                    retstr+=str.substr(i++,1);
                }
                break;
            case '0':
                if(i<str.length){
                    retstr+= str.substr(i++,1);
                }
                else retstr+='0';
                break;
            }
        }
        return retstr.replace(/^,+/,'').replace(/\.$/,'');
    }
    
    /**
     * 
     * 由给定数组,计算出最大值和最小值返回
     * @param {Array} array
     * @return {Object} 返回最大最小值组成的对象,{max,min}
     */
    this.getMaxMin = function(array){
        //TODO 这个方法的实现太搓, 是病, 得治
        var max = 0, min = 0, len = array.length;
        if(len > 0){
            min = array[0];
            for(var i = 0; i < len; i++){
                if(array[i] > max){
                    max = array[i];
                }else if(array[i] < min){
                    min = array[i];
                }
            }
        }
        return {max: max,min: min};
    }

    /**
     * 返回指定范围的随机整数, 如 (9, 15], 将返回 9 < n <= 15, 不包括 9 本身
     * @param  {Number} start 随机数下限, 不包括下限
     * @param  {Number} end   随机数上限, 包括上限
     * @return {Number}
     */
    this.random = function(start, end){
        return Math.ceil(Math.random()*(end - start) + start);
    }
    
});

;Z.$package('Z.storage', function(z){


    var Storage = z.$class({
        name: 'Storage'
    }, {
        init: function(storage){
            this._storage = storage;
        },

        isSupport: function(){
            return this._storage != null;
        },

        /**
         * 设置内容到本地存储
         * @param {String} key   要设置的 key
         * @param {String}, {Object} value 要设置的值, 可以是字符串也可以是可序列化的对象
         */
        set: function(key, value){
            if(this.isSupport()){
                if(!z.isString(value)){
                    value = JSON.stringify(value);
                }
                this._storage.setItem(key, value);
                return true;
            }
            return false;
            
        },

        get: function(key){
            if(this.isSupport()){
                var value = this._storage.getItem(key);
                try{
                    value = JSON.parse(value);
                }catch(e){

                }
                return value;
            }
            return false;
        },

        remove: function(key){
            if(this.isSupport()){
                this._storage.removeItem(key);
                return true;
            }
            return false;
        },

        clear: function(){
            if(this.isSupport()){
                this._storage.clear();
                return true;
            }
            return false;
        }
    });

    this.local = new Storage(window.localStorage);

    this.session = new Storage(window.sessionStorage);
    
});

;Z.$package('Z.string', function(z){
    
    /**
     * 
     * @param {Object} obj 要转换成查询字符串的对象
     * @return {String} 返回转换后的查询字符串
     */
    var toQueryPair = function(key, value) {
        return encodeURIComponent(String(key)) + "=" + encodeURIComponent(String(value));
    };
    
    /**
     * 
     * @param {Object} obj 要转换成查询字符串的对象
     * @return {String} 返回转换后的查询字符串
     */
    this.toQueryString = function(obj){
        var result=[];
        for(var key in obj){
            result.push(toQueryPair(key, obj[key]));
        }
        return result.join("&");
    };
    
    var templateCache = {};
      
    /**
     * 多行或单行字符串模板处理
     * 
     * @method template
     * @memberOf string
     * 
     * @param {String} str 模板字符串
     * @param {Object} obj 要套入的数据对象
     * @return {String} 返回与数据对象合成后的字符串
     * 
     * @example
     * <script type="text/html" id="user_tmpl">
     *   <% for ( var i = 0; i < users.length; i++ ) { %>
     *     <li><a href="<%=users[i].url%>"><%=users[i].name%></a></li>
     *   <% } %>
     * </script>
     * 
     * Jx().$package(function(J){
     *  // 用 obj 对象的数据合并到字符串模板中
     *  J.template("Hello, {name}!", {
     *      name:"Kinvix"
     *  });
     * };
     */
    var template = this.template = function(str, data){
        // Figure out if we're getting a template, or if we need to
        // load the template - and be sure to cache the result.
        var fn = !/\W/.test(str) ?
          templateCache[str] = templateCache[str] ||
            template(document.getElementById(str).innerHTML) :
          
          // Generate a reusable function that will serve as a template
          // generator (and which will be cached).
          new Function("obj",
            "var z_tmp=[],print=function(){z_tmp.push.apply(z_tmp,arguments);};" +
            
            // Introduce the data as local variables using with(){}
            "with(obj){z_tmp.push('" +
            
            // Convert the template into pure JavaScript
            str
              .replace(/[\r\t\n]/g, " ")
              .split("<%").join("\t")
              .replace(/((^|%>)[^\t]*)'/g, "$1\r")
              .replace(/\t=(.*?)%>/g, "',$1,'")
              .split("\t").join("');")
              .split("%>").join("z_tmp.push('")
              .split("\r").join("\\'")
          + "');}return z_tmp.join('');");
        
        // Provide some basic currying to the user
        return data ? fn( data ) : fn;
    };
    
    /**
     * 字符串格式函数
     * 
     * @Example 
     * var a = "I Love {0}, and You Love {1},Where are {0}! {4}";
     * alert(z.string.format(a, "You","Me")); 
     */
    this.format = function(str, arg1, arg2/*...*/) {
        if( arguments.length == 0 )
            return null;
        var str = arguments[0];
        for(var i=1;i<arguments.length;i++) {
            var re = new RegExp('\\{' + (i-1) + '\\}','gm');
            str = str.replace(re, arguments[i]);
        }
        return str;
    }
});

;Z.$package('Z.ui', ['Z.util'], function(z){

    /**
     * 滚动条的通用逻辑封装
     *
     */
    this.ScrollAction = z.define('class', {
        init: function(option){
            this._id = 'scroll_action_' + (option.id || option.element.getAttribute('id'));
            this._el = option.element;
            
            this._step = option.step || 50;
            this._animationDuration = option.animationDuration || 10;
            this._scrollEventDelay = option.scrollEventDelay || 200; 
            
            this._onScrollToBottom = option.onScrollToBottom;
            this._onScrollToTop = option.onScrollToTop;
            this._onAnimationStart = option.onAnimationStart;
            this._onAnimationEnd = option.onAnimationEnd;
            
            
            var context = this;
            this._el.addEventListener('scroll', function(e){
                //保证这个延迟的时间比动画长, 不能在下一个动画还没执行, 这里已经触发了
                var delayTime = context._scrollEventDelay + context._animationDuration;
                z.util.delay(context._id + '_scroll', delayTime, function(){
                    if(context._noScollEvent){
                        context._noScollEvent = false;
                        return;
                    }
                    if(context.isTop() && context._onScrollToTop){
                        context._onScrollToTop();
                    }else if(context.isBottom() && context._onScrollToBottom){
                        context._onScrollToBottom();
                    }
                });
            },false);
        },
        /**
         * 获取当前滚动条的位置
         */
        getScrollTop: function(){
            return this._el.scrollTop;
        },
        /**
         * 判断滚动条是否已经在顶部了
         * @return {Boolean} 
         */
        isTop: function(){
            return this._el.scrollTop === 0;
        },
        /**
         * 判断是否滚动条已经到底部了
         * @return {Boolean} 
         */
        isBottom: function(){
            return this._el.scrollTop === this._el.scrollHeight - this._el.clientHeight;
        },
        /**
         * 设置动画的参数
         * @param {Number} step 每次动画滚动的步长
         * @param {Number} duration 每次滚动执行的间隔
         */
        setAnimation: function(step, duration){
            if(step){
                this._step = step;
            }
            if(duration){
                this._animationDuration = duration;
            }
        },
        /**
         * 滚动到指定位置
         * @param {Number},{String} scrollTop 指定scrollTop, 或者关键字 'top'/'bottom'
         * @param {Boolean} hasAnimation 指示是否执行滚动动画
         * @param {Boolean} noScollEvent 指示改行为是否不要出发 scrollEvent
         * @example
         * 1.scrollAction.scrollTo(0);
         * 2.scrollAction.scrollTo(200);
         * 3.scrollAction.scrollTo('top', true);
         * 4.scrollAction.scrollTo('bottom');
         * 
         */
        scrollTo: function(scrollTop, hasAnimation, noScollEvent){
            var context = this;
            z.util.clearLoop(this._id);
            var maxScrollHeight = this._el.scrollHeight - this._el.clientHeight;
            if(z.isString(scrollTop)){
                if(scrollTop === 'top'){
                    scrollTop = 0;
                }
                if(scrollTop === 'bottom'){
                    scrollTop = maxScrollHeight;
                }
            }
            if(scrollTop < 0){
                scrollTop = 0;
            }
            if(scrollTop > maxScrollHeight){
                scrollTop = maxScrollHeight;
            }
            if(scrollTop === this._el.scrollTop){
                return false;
            }
            this._noScollEvent = noScollEvent;
            if(!hasAnimation){
                this._el.scrollTop = scrollTop;
            }else{
                var from = context._el.scrollTop, to = scrollTop;
                var sign = (to - from > 0) ? 1 : -1;
                var isStarted = false;
                z.util.loop(this._id, this._animationDuration, function(){
                    if(!isStarted){
                        isStarted = true;
                        if(context._onAnimationStart){
                            context._onAnimationStart();
                        }
                    }
                    from = from + sign * context._step;
                    var isEnd = false;
                    if((sign > 0 && from > to) || (sign < 0 && from < to)){
                        from = to;
                        isEnd = true;
                        z.util.clearLoop(context._id);
                    }
                    context._el.scrollTop = from;
                    if(isEnd && context._onAnimationEnd){
                        context._onAnimationEnd();
                    }
                });
            }
            return true;
        }
    });
    
});/**
 * 节拍器, 节省设置多个setIntervel带来的性能消耗
 * 最长节拍是一分钟
 * 节拍的起点未必完全正确, 节拍越长, 起点的误差会越大
 * 不能用于节拍间距比较长(大于一分钟的那种)并且要求精度比较高的情况
 * 一秒内的情况比较好用
 */
;Z.$package('Z.util', ['Z.message'], function(z){
    
    this.Beater = z.$class({
        name: 'Beater',
        statics: {
            DEFAULT_INTERVAL: 50,
            DEFAULT_MAX_INTERVAL: 60 * 1000
        }
    }, {
        init: function(option){
            option = option || {};
            this._triggers = {};
            this._beaters = {};
            this._isStart = false;
            this._autoStart = ('autoStart' in option) ? option.autoStart : true;
            this._interval = option.interval || this.$static.DEFAULT_INTERVAL;
            //maxInterval 是为了防止timecount会一直无限增上去
            this._maxInterval = option.maxInterval || this.$static.DEFAULT_MAX_INTERVAL;
        },
        checkBeater: function(){
            var count = 0;
            for(var i in this._beaters){
                count += this._beaters[i];
            }
            return !!count;
        },
        add: function(bid, time, func){
        	
        	if(time % this._interval){
        		//time 不能整除
        		time = Math.round(time / this._interval) * this._interval;
        	}else if(time < this._interval){//不能小于
                time = this._interval;
            }else if(time > this._maxInterval){
                time = this._maxInterval;
            }
            
            if(this._triggers[bid]){
                throw new Error('beater is exist');
            }
            var event = 'Beater-' + time;
            this._beaters[time] = this._beaters[time] || 0;
            this._triggers[bid] = {
                time: time,
                func: func
            };
            z.message.on(this, event, func);
            this._beaters[time]++;
            if(!this._isStart && this._autoStart){
                this.start();
            }
            return true;
        },
        remove: function(bid){
            var trigger = this._triggers[bid];
            if(!trigger){
                return false;
            }
            var event = 'Beater-' + trigger.time;
            this._beaters[trigger.time]--;
            this._triggers[bid] = null;
            delete this._triggers[bid];
            z.message.off(this, event, trigger.func);
            if(!this.checkBeater()){
                this.stop();
            }
            return true;
        },
        start: function(){
            if(this._isStart){
                return false;
            }
            var context = this;
            var timeCount = 0, interval = this._interval;
            this._timer = setInterval(function(){
                timeCount += interval;
                if(timeCount >= context._maxInterval){
                    timeCount = 0;
                }
                var inter;
                for(var i in context._beaters){
                	if(!context._beaters[i]){
                		//这下面没有挂 beater
                		continue;
                	}
                	inter = Number(i);
                	if(!(timeCount % inter)){
                        z.message.notify(context, 'Beater-' + inter, {time: inter});
                    }
                }
                
            }, interval);
            this._isStart = true;
            return true;
        },
        stop: function(){
            if(!this._isStart){
                return false;
            }
            clearInterval(this._timer);
            this._timer = 0;
            this._isStart = false;
            return true;
        }
    });
    
});

;Z.$package('Z.util', ['Z.message', 'Z.array'], function(z){
    
    /**
     * 通用 collection 类
     */
    this.Collection = new z.$class({
        name: 'Collection'
    }, {
        init: function(option){
            option = option || {};
            this._keyName = option.keyName || 'id';
            this._arr = [];
            this._map = {};
            this._modifyTime = 0;

            var self = this;
            function onModify(){
                self.setModify();
            }

            z.message.on(this, 'add', onModify);
            z.message.on(this, 'remove', onModify);
            z.message.on(this, 'clear', onModify);
            z.message.on(this, 'update', onModify);
        },
        /**
         * 设置一个修改状态位, 每当 collection有了变更, 这个 modifyTime 就会变
         * 通过对比 modifyTime 的值就能判断出这个 collection 是否被修改了
         */
        setModify: function(){
            this._modifyTime = +new Date();
        },
        getModify: function(){
            return this._modifyTime;
        },
        /**
         * @deprecated 已废弃, 用 get 代替
         */
        getByKey: function(key){
            return this.get(key);
        },
        /**
         * @deprecated 已废弃, 用 index 代替
         */
        getByIndex: function(index){
            return this.index(index);
        },
        getIndexByKey: function(key, keyName){
            keyName = keyName || this._keyName;
            var item = this._map[key];
            if(item){
                for(var i in this._arr){
                    if(this._arr[i][keyName] == key){
                        return i;
                    }
                }
            }
            return null;
        },
        getKeyByIndex: function(index, keyName){
            keyName = keyName || this._keyName;
            var item = this.getByIndex(index);
            if(item){
                return item[keyName];
            }
            return null;
        },
        /**
         * 返回指定 key 的元素
         * @param  {Number},{String} key 
         * @return {Object}
         */
        get: function(key){
            return this._map[key];
        },
        /**
         * 返回指定下标的元素
         * @param  {Number} index 
         * @return {Object}
         */
        index: function(index){
            return this._arr[index];
        },
        getRange: function(start, count){
            var end = start + count;
            return this._arr.slice(start, end);
        },
        /**
         * 使用指定 key 和 value 进行过滤
         * @param  {Number}, {String} key
         * @param  {Object} value 
         * @return {Array}
         */
        filter: function(key, value){
            return z.array.filter(this._arr, key, value);
        },
        /**
         * 添加元素, 只接受新的 key
         * @param  {Object} item    
         * @param  {Number} index   
         * @param  {Boolean} noEvent 
         * @return {Object}, {Boolean}
         */
        add: function(item, index, noEvent){
            var existItem = this._map[item[this._keyName]];
            if(existItem){
                return false;
            }
            this._map[item[this._keyName]] = item;
            if(z.isUndefined(index)){
                index = this._arr.length;
                this._arr.push(item);
            }else{
                this._arr.splice(index, 0, item);
            }

            if(!noEvent){
                z.message.notify(this, 'add', {
                    items: [item],
                    index: index
                });
            }
            return item;
        },
        /**
         * 批量添加, 如果有 key 一样的将会排除掉
         */
        addRange: function(items, index, noEvent){
            var newItems = [], item, keyName = this._keyName;
            for(var i in items){
                item = items[i];
                if(!this._map[item[keyName]]){
                    newItems.push(item);
                    this._map[item[keyName]] = item;
                }
            }
            if(!newItems.length){
                return false;
            }
            if(z.isUndefined(index)){
                index = this._arr.length;
                this._arr = this._arr.concat(newItems);
            }else{
                var param = [index, 0].concat(newItems);
                Array.prototype.splice.apply(this._arr, param);
            }
            if(!noEvent){
                z.message.notify(this, 'add', {
                    items: newItems,
                    index: index
                });
            }
            return newItems;
        },
        removeByKey: function(key, noEvent){
            var item = this._map[key];
            if(item){
                var index = this.getIndexByKey(key);
                this._arr.splice(index, 1);
                delete this._map[key];
                if(!noEvent){
                    z.message.notify(this, 'remove', {
                        items: [item],
                        index: index,
                        key: key
                    });
                }
                return item;
            }
            return false;
        },
        removeByIndex: function(index, noEvent){
            var item = this._arr[index];
            if(item){
                this._arr.splice(index, 1);
                delete this._map[item[this._keyName]];
                if(!noEvent){
                    z.message.notify(this, 'remove', {
                        items: [item],
                        index: index,
                        key: item[this._keyName]
                    });
                }
                return item;
            }
            return false;
        },
        /**
         * 删除指定key的元素, removeByKey 的简写
         */
        remove: function(key){
            return this.removeByKey(key);
        },
        removeRange: function(items, noEvent){
            var removedItems = [], item, keyName = this._keyName;
            for(var i in items){
                item = items[i];
                if(this.removeByKey(item[keyName], true)){
                    removedItems.push(item);
                }
            }
            if(!removedItems.length){
                return false;
            }
            if(!noEvent){
                z.message.notify(this, 'remove', {
                    items: removedItems
                });
            }
            return removedItems;
        },
        /**
         * 更新一个元素
         * @param  {Object} item    
         * @param  {Boolean} noEvent 
         * @return {Object}, {Boolean}
         */
        update: function(item, noEvent){
            var exists = this.get(item.id);
            if(exists){
                z.merge(exists, item);
                if(!noEvent){
                    z.message.notify(this, 'update', {
                        items: [exists]
                    });
                }
                return exists;
            }
            return false;
        },
        /**
         * 批量更新
         * @param  {Array} items 
         * @return {Object}, {Boolean}       
         */
        updateRange: function(items){
            var updatedItems = [], newItem;
            for(var i in items){
                newItem = this.update(items[i], true);
                if(newItem){
                    updatedItems.push(newItem);
                }
            }
            if(updatedItems.length){
                z.message.notify(this, 'update', {
                    items: [updatedItems]
                });
            }
            return false;
        },
        length: function(){
            return this._arr.length;
        },
        clear: function(noEvent){
            var items = this._arr;
            this._arr = [];
            this._map = {};
            if(!noEvent){
                z.message.notify(this, 'clear', {
                    items: items
                });
            }
        },
        getFirst: function() {
            return this.index(0);
        },
        getLast: function() {
            return this.index(this.length() - 1);
        },
        getAll: function(){
            return this.getRange(0, this.length());
        },
        /**
         * 按数组下标顺序遍历 Collection 的所有元素
         * @param  {Function} callback callback(item, index)
         * 
         */
        each: function(callback, context){
            context = context || this;
            for(var i = 0, item; item = this._arr[i]; i ++){
                callback.call(context, item, i);
            }
        },
        /**
         * 判断指定 key 的元素是否存在
         * @param  {Number},{String} key 
         * @return {Boolean}
         */
        exist: function(key){
            return !!this.get(key);
        }
    });
    
});

;Z.$package('Z.util', function(z){
    
    /**
     * @class
     * 一系列方法的执行依赖队列, 每个方法执行完成之后必须手动调用 next() 方法
     * 整个队列执行完成之后自动执行初始化时传入的 onFinish 方法
     */
    this.DependentQueue = new z.$class({
            name: 'DependentQueue',
            statics: {
                STATUS_INIT: 1,
                STATUS_RUNNING: 2,
                STATUS_PAUSE: 3,
                STATUS_STOP: 4
            }
        }, {
        /**
         * @param {Object} option
         * {
         *  onPause: 
         *  onFinish:
         *  onStop:
         * }
         */
        init: function(option){
            option = option || {};
            this._onFinish = option.onFinish;
            this._onPause = option.onPause;
            this._onStop = option.onStop;
            
            this._currentIndex = -1;
            this._items = [];
            
            this._status = this.$static.STATUS_INIT;
        },
        /**
         * @param {Object} item
         * {
         *  id: 'xxx'
         *  exec: function(queue, item){}
         *  
         * }
         * 
         */
        add: function(item){
            if(this.isRunning()){
                return false;
            }
            this._items.push(item);
            return true;
        },
        isRunning: function(){
            return this._status === this.$static.STATUS_RUNNING;
        },
        run: function(){
            if(this.isRunning()){
                return false;
            }
            if(this._items.length <= 0){
                return false;
            }
            if(this._currentIndex >= this._items.length - 1){
                return false;
            }
            this._status = this.$static.STATUS_RUNNING;
            this.next();
        },
        reRun: function(){
            this._currentIndex--;
            this.next();
        },
        next: function(){
            this._currentIndex++;
            var item = this._items[this._currentIndex];
            if(item){
                item.exec(this, item);
            }else{
                if(this._onFinish){
                    this._onFinish(this);
                }
            }
        },
        pause: function(){
            this._status = this.$static.STATUS_PAUSE;
            if(this._onPause){
                var item = this._items[this._currentIndex];
                this._onPause(this, item);
            }
        },
        stop: function(){
            this._status = this.$static.STATUS_STOP;
            if(this._onStop){
                var item = this._items[this._currentIndex];
                this._onStop(this, item);
            }
        }
    });

    
});

;Z.$package('Z.util', ['Z.message', 'Z.string', 'Z.util'], function(z){
    
    /**
     * Http请求的缓存封装
     */
    this.HttpRequest = new z.$class({
        init: function(option){
            this._require = option.require;//must fill
            
            this._requestCollection = new z.util.Collection({
                keyName: 'id'
            });
        },
        /**
         * 
         * @param {Object} param 底层 require 方法需要的参数
         * @param {Object} option httpRequest 需要的配置参数
         * { 
         *  cacheTime: 0 @default
         *  }
         */
        require: function(url, param, option){
            var argus = z.string.toQueryString(param.data);
            var key;
            if(url.indexOf('?') == -1){
                key = url + '?' + argus;
            }else{
                key = url + '&' + argus;
            }
            option = option || {};
            var onSuccessOld = param.onSuccess;
            var onErrorOld = param.onError;
            var onTimeoutOld = param.onTimeout;
            var oldRequest = this._requestCollection.get(key);
            if(oldRequest){
                if(oldRequest.status === 'loading'){
                    return false;//-----------------return
                }
                if(option.cacheTime && (oldRequest.responseTime - oldRequest.requireTime) < option.cacheTime){
                    //有cacheTime 且未过期的时候直接使用cache
                    var context = param.context || window;
                    if(onSuccessOld){
                        onSuccessOld.call(context, oldRequest.response);
                    }
                    return true;//-----------------return
                }else{//否则删除cache , 重新请求
                    this._requestCollection.remove(key);
                }
            }
            
            var requestItem = {
                id: key,
                param: param,
                requireTime: +new Date,
                status: 'loading'
            };
            this._requestCollection.add(requestItem);
            param.onSuccess = function(data){
                if(option.cacheTime){
                    requestItem.responseTime = +new Date;
                    requestItem.status = 'loaded';
                    requestItem.response = data;
                }else{
                    this._requestCollection.remove(key);
                }
                var context = param.context || window;
                if(onSuccessOld){
                    onSuccessOld.call(context, data);
                }
            };
            param.onError = function(data){
                this._requestCollection.remove(key);
                var context = param.context || window;
                if(onErrorOld){
                    onErrorOld.call(context, data);
                }
            };
            param.onTimeout = function(data){
                this._requestCollection.remove(key);
                var context = param.context || window;
                if(onTimeoutOld){
                    onTimeoutOld.call(context, data);
                }
            };

            this._require(url, param);
        }
    });
    
});

;Z.$package('Z.util', function(z){
    
    /**
     * 返回一个方法, 在一段时间内多次调用只执行一次
     * @param  {Number} time 进行调用限制的时间范围
     * @param  {Function} func 需要包装的方法
     * @param  {Boolean} immediate 指示在第一次调用时执行, 还是间隔time毫秒之后执行
     * @return {Function}
     * 
     * @example
     * 
function a(){
    console.log('exec a');
}
var b = debounce(1000, a);
var c = debounce(1000, a, true);
function testCase1(){
    var i = 0; 
    var id = setInterval(function(){
        if(i++ < 30){
            console.log('call b' + i);
            b();
        }else{
            clearInterval(id)
        }
    },100);
}
function testCase2(){
    var i = 0; 
    var id = setInterval(function(){
        if(i++ < 30){
            console.log('call c' + i);
            c();
        }else{
            clearInterval(id)
        }
    },100);
}

     */
    this.debounce = function(time, func, immediate){
        var lastExecTime;
        return function(){
            if(!lastExecTime || (+new Date - lastExecTime > time)){
                immediate ? func() : setTimeout(func, time);
                lastExecTime = +new Date;
            }
        };
    }

    
});/**
 * setTimout 的封装, 用于处理输入检测等触发过快的事件/方法
 */
;Z.$package('Z.util', function(z){
    
    var DELAY_STATUS = {
        NORMAL: 0,
        ID_EXIST: 1,
        ID_NOT_EXIST: 2
    };

    var timerList = {};
    /**
     * @param {String} id @optional
     * @param {Number} time @optional
     * @param {Function} func
     * @param {Object} funcContext @optional func的执行上下文, 默认 window
     * @example
     * 1. delay('id01', 1000, func)
     * 2. delay(1000, func)
     * 3. delay(func) === delay(0, func)
     * 4. delay('id02', 1000, func, context)
     * TODO 5. delay({
     *     id: 'id03',
     *     time: 1000,
     *     func: func,
     *     context: this,
     *     onClear: func
     * })
     */
    this.delay = function(id, time, func, funcContext){
        var argu = arguments;
        var flag = DELAY_STATUS.NORMAL;
        if(argu.length === 1){
            func = id;
            time = 0;
            id = null;
        }else if(argu.length === 2){
            func = time;
            time = id;
            id = null;
        }
        time = time || 0;
        if(id && time){
            if(id in timerList){
                window.clearTimeout(timerList[id]);
                flag = DELAY_STATUS.ID_EXIST;
            }
            var wrapFunc = function(){
                timerList[id] = 0;
                delete timerList[id];
                func.apply(funcContext || window, [id]);
            };
            var timer = window.setTimeout(wrapFunc, time);
            timerList[id] = timer;
        }else{
            if(funcContext){
                var wrapFunc = function(){
                    func.apply(funcContext || window);
                };
                window.setTimeout(wrapFunc, time);
            }else{
                window.setTimeout(func, time);
            }
        }
        return flag;
    }
    
    this.clearDelay = function(id){
        if(id in timerList){
            window.clearTimeout(timerList[id]);
            timerList[id] = 0;
            delete timerList[id];
            return DELAY_STATUS.NORMAL;
        }
        return DELAY_STATUS.ID_NOT_EXIST;
    }
    
});
;Z.$package('Z.util', function(z){
    
    //防止 hasOwnProperty 被污染
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    /**
     * 计算对象的属性数量
     * @param  {Object} obj 
     * @return {Number}
     */
    this.sizeof = function(obj){
        if(z.isArray(obj)){
            return obj.length;
        }else{
            var n, count = 0;  
            for(n in obj){  
                if(hasOwnProperty.call(obj, n)){  
                    count++;  
                }  
            }  
            return count;  
        }
    };

    
});
/**
 * setTimout 的封装, 用于处理输入检测等触发过快的事件/方法
 */
;Z.$package('Z.util', function(z){
    
    var LOOP_STATUS = {
        NORMAL: 0,
        ID_EXIST: 1,
        ID_NOT_EXIST: 2
    };

    var intervalerList = {};
    
    /**
     * 定时循环执行传入的func
     */
    this.loop = function(id, time, func, funcContext){
        var argu = arguments;
        var flag = LOOP_STATUS.NORMAL;
        if(argu.length == 2){
            func = time;
            time = id;
        }
        time = time || 0;
        if(id && time){
            if(id in intervalerList){
                window.clearInterval(intervalerList[id]);
                flag = LOOP_STATUS.ID_EXIST;
            }
            var wrapFunc = function(){
                func.apply(funcContext || window, [id]);
            };
            var intervaler = window.setInterval(wrapFunc, time);
            intervalerList[id] = intervaler;
        }else{
            setInterval(func, time);
        }
        return flag;
    }
    
    this.clearLoop = function(id){
        if(id in intervalerList){
            window.clearInterval(intervalerList[id]);
            intervalerList[id] = 0;
            delete intervalerList[id];
            return LOOP_STATUS.NORMAL;
        }
        return LOOP_STATUS.ID_NOT_EXIST;
    }
    
});
;Z.$package('Z.util', function(z){
    
    var timeTaken = function(func){
        var name = '>>>', beforeCb, afterCb;
        if(arguments.length === 2){
            if(typeof(arguments[1]) === 'function'){
                afterCb = arguments[1];
            }else{
                name = '\"' + arguments[1] + '\"';
            }
        }else if(arguments.length === 3){
            beforeCb = arguments[1];
            afterCb = arguments[2];
        }
        z.debug(name + ' time test start.');
        beforeCb && beforeCb();
        var start = +new Date;
        func();
        var taken = +new Date - start;
        afterCb && afterCb(taken);
        z.debug(name + ' time test end. time taken: ' + taken);
    }
    
    this.timeTaken = timeTaken;
});
