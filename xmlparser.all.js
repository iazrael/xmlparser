
;Z.$package('Z.parser', function(z, undefined){

    var MATCH_NONE = 0;//没有匹配
    var MATCH_EXACTLY = 1;//完全匹配了一个
    var MATCH_POLYSEMY = 2;//存在多个可能的匹配项

    function isArray (obj){
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    /**
     * 通用文本解析引擎，可以用来解析xml, JSON等
     */
    function Interpreter(tokenArray){
        this.tokenArray = tokenArray;
    }

    Interpreter.prototype = {
        /**
         * 判读一个字符或字符串是否是token, 严格匹配
         * @param  {String}  text 
         * @param {Array} extra 
         * @return {Boolean}
         */
        isToken: function(text, extra){
            var match = this.tokenArray.indexOf(text) > -1;
            if(match && extra){
                return extra.indexOf(text) > -1;
            }
            return match;
        },
        /**
         * 判断一个字符或字符串是否匹配到了一个 token
         * 匹配情况分三种
         * 1: 唯一完全匹配, 返回会 MATCH_ONE
         * 2: 匹配了多个开头, 返回 MATCH_POLYSEMY
         * 3: 未有匹配, 返回 MATCH_NONE
         * @param  {String}  text 
         * @return {Number}
         */
        checkToken: function(text){
            var count = 0;
            for(var i = 0, t; t = this.tokenArray[i]; i++){
                if(t.indexOf(text) === 0){
                    count++;
                }
                if (count >= 2) {//已经有两个匹配了, 可以退出循环了
                    break;
                }
            }
            if(count > 1){
                return MATCH_POLYSEMY;
            }
            if(!count){//0
                return MATCH_NONE;
            }
            if(this.isToken(text)){
                return MATCH_EXACTLY;
            }
            return MATCH_POLYSEMY;
        },
        /**
         * 设置将要解析的文本，准备解析
         * @param  {String} text 
         */
        prepare: function(text){
            this.text = text;
            this.length = text.length;
            this.pos = 0;
        },
        /**
         * 获取当前处理进度
         * @return {Number} 
         */
        getProgress: function(){
            return this.pos;
        },
        /**
         * 把文本按照tokenArray进行切割，按顺序返回一个字符或字串
         * @return {{String}|null} 返回字符或字串，如果已经到结尾，则返回null
         */
        eat: function(){
            var ch, m, 
                text, 
                buffer = '',
                polysemy = false
                ;
            while(this.pos < this.length){
                ch = this.text.charAt(this.pos);
                if(polysemy){
                    text = buffer + ch;
                }else{
                    text = ch;
                }
                m = this.checkToken(text);
                if(m === MATCH_POLYSEMY){
                    if(!polysemy && buffer.length){
                        return buffer;
                    }
                    buffer += ch;
                    this.pos ++;
                    polysemy = true;
                }else if(m === MATCH_EXACTLY){
                    if(polysemy){
                        this.pos ++;
                        return text;
                    }
                    if(buffer.length){
                        return buffer;
                    }
                    this.pos ++;
                    return ch;
                }else{
                    if(polysemy){
                        return buffer;
                    }
                    buffer += ch;
                    this.pos ++;
                }
            }
            return null;
        },
        /**
         * 把指定until之前的字符都返回，until可以是字符串或者字符串数组，
         * 但都必须是tokenArray的子集，否则忽略掉
         * @param  {{String}|{Array}} until 限定用的token
         * @return {String} 返回指定字符串，当在until之前都没有字符时，返回空串''
         */
        eatUntil: function(until){
            if(until && !isArray(until)){
                until = [until];
            }
            var pos = this.pos,
                result = '',
                food;
            while((food = this.eat()) !== null && !this.isToken(food, until)){
                result += food;
                pos = this.pos;
            }
            this.pos = pos;
            return result;
        }
    };

    this.Interpreter = Interpreter;

});
;Z.$package('Z.parser', function(z, undefined){

    /**
     * 节点定义
     * @class
     * @name Node
     */
    var Node = this.Node = z.$class({
        init: function(){
            this.nodeType = null;
            this.nodeName = null;
            this.nodeValue = null;
            this.parentNode = null;
            this.attributes = {};
            this.childNodes = [];
        },
        hasAttributes: function(){
            return !z.isEmpty(this.attributes);
        },
        hasChildNodes: function(){
            return !!this.childNodes.length;
        },
        appendChild: function(node){
            if(!this.contains(node)){
                node.parentNode = this;
                this.childNodes.push(node);
            }
        },
        removeChild: function(node){
            z.array.removeChild(this.childNodes, node);
            node.parentNode = null;
        },
        contains: function(node){
            return this.childNodes.indexOf(node) > -1;
        },
        cloneNode: function(){
            return z.duplicate(this);
        },
        //,TODO  insertBefore, insertAfter, replaceChild, normalize
        //
        toObject: function(){
            var obj = {}, val;
            for(var i in this){
                if(!this.hasOwnProperty(i)){
                    continue;
                }
                val = this[i];
                if(z.isString(val) || z.isBoolean(val) || z.isNumber(val) || z.isUndefined(val)){
                    obj[i] = val;
                }else if(z.isObject(val) && i === 'attributes'){
                    obj[i] = val;
                }else if(z.isArray(val) && i === 'childNodes'){
                    obj[i] = [];
                    for(var j in val){
                        obj[i].push(val[j].toObject());
                    }
                }
            }
            return obj;
        },
        toJSONString: function(){
            var str = JSON.stringify(this.toObject());
            return str;
        },
        toXMLString: function(tabCount){
            tabCount = tabCount || 0;
            var str = generateString('\t', tabCount) + '<' + this.nodeName + '>' + this.nodeValue + '</' + this.nodeName + '>';
            return str;
        },
        toString: function(){
            return this.toXMLString();
        }
    });

    /*
     * Node 类型常量定义
     */
    Node.ELEMENT_NODE = 1;
    Node.ATTRIBUTE_NODE = 2;
    Node.TEXT_NODE = 3;
    Node.CDATA_SECTION_NODE = 4;
    Node.COMMENT_NODE = 8;
    Node.DOCUMENT_NODE = 9;
    Node.DOCUMENT_TYPE_NODE = 10;
    Node.META_NODE = 12;


    /**
     * @class
     * @name Element
     */
    var Element = this.Element = z.$class({extend: Node }, {
        init: function(tagName){
            this.tagName = tagName;
            this.nodeType = Node.ELEMENT_NODE;
            this.nodeName = tagName;
        },
        toXMLString: function(tabCount){
            tabCount = tabCount || 0;
            var str = generateString('\t', tabCount) + '<' + this.nodeName;
            for(var i in this.attributes){
                if(this.attributes.hasOwnProperty(i)){
                    str += ' ' + i + '="' + this.attributes[i] + '"';
                }
            }
            if(this.childNodes.length){
                str += '>' + '\n';
                for(var j in this.childNodes){
                    str += this.childNodes[j].toXMLString(tabCount + 1) + '\n';
                }
                str += generateString('\t', tabCount) + '</' + this.nodeName + '>';
            }else{
                str += '/>';
            }
            return str;
        },
        getAttribute: function(key){
            return this.attributes[key];
        },
        setAttribute: function(key, value){
            this.attributes[key] = value;
        },
        hasAttribute: function(key){
            return !!this.attributes[key];
        },
        removeAttribute: function(key){
            delete this.attributes[key];
        },
        getElementsByTagName: function(tag){
            //TODO 广度优先,深度优先
        },
        //============= 扩展的方法 ========================
        /**
         * getAttribute和setAttribute的简写
         * @param  {String} key   
         * @param  {String} value @optional
         * @return {String}, {Node}
         */
        attr: function(key, value){
            if(arguments.length === 2){
                this.setAttribute(key, value);
            }else{
                return this.getAttribute(key);
            }
        },
        /**
         * getElement 系列方法的简写, 仅支持简易的一级选择器
         * @param  {String} selector  
         * @return {Array}, {Node}
         * @example 
         * find('#id');
         * find('.class');
         * find('tag');
         * find('@attr=value');
         * 
         */
        find: function(selector){
            var s = selector.charAt(0);
            var value = selector.substring(1);
            var attr;
            if(s === '#'){
                attr = 'id';
            }else if(s === '.'){
                attr = 'class'
            }else if(s === '@'){
                value = value.split('=');
                attr = value[0];
                value = value[1];
            }
            if(attr){//attr
                return z.array.filter(this.childNodes, attr, value);
            }else{//tag
                return this.getElementsByTagName(selector);
            }
        }
    });

    /**
     * @class
     * @name Text
     */
    var Text = this.Text = z.$class({extend: Node}, {
        init: function(value){
            this.nodeValue = value;
            this.nodeType = Node.TEXT_NODE;
        },
        toObject: function(){
            var obj = {
                nodeType: this.nodeType,
                nodeValue: this.nodeValue
            };
            return obj;
        },
        toXMLString: function(tabCount){
            tabCount = tabCount || 0;
            var str = generateString('\t', tabCount) + this.nodeValue;
            return str;
        }
    });

    /**
     * @class
     * @name Comment
     */
    var Comment = this.Comment = z.$class({extend: Node}, {
        init: function(value){
            this.nodeValue = value;
            this.nodeType = Node.COMMENT_NODE;
        },
        toObject: function(){
            var obj = {
                nodeType: this.nodeType,
                nodeValue: this.nodeValue
            };
            return obj;
        },
        toXMLString: function(tabCount){
            tabCount = tabCount || 0;
            var str = generateString('\t', tabCount) 
                + '<!--' + this.nodeValue + '-->';
            return str;
        }
    });

    /**
     * @class
     * @name CDATA
     */
    var CDATA = this.CDATA = z.$class({extend: Node}, {
        init: function(value){
            this.nodeValue = value;
            this.nodeType = Node.CDATA_SECTION_NODE;
        },
        toObject: function(){
            var obj = {
                nodeType: this.nodeType,
                nodeValue: this.nodeValue
            };
            return obj;
        },
        toXMLString: function(tabCount){
            tabCount = tabCount || 0;
            var str = generateString('\t', tabCount) 
                + '<![CDATA[' + this.nodeValue + ']]>';
            return str;
        }
    });

    /**
     * 文档定义
     * @class
     * @name Document
     */
    var Document = this.Document = z.$class({extend: Element}, {
        init: function(){
            this.nodeName = 'document';
            this.nodeType = Node.DOCUMENT_NODE;
        },
        toXMLString: function(){
            var str = '';
            if(this.childNodes.length){
                for(var j in this.childNodes){
                    str += this.childNodes[j].toXMLString() + '\n';
                }
            }
            return str;
        }
    });

    var DocumentType = this.DocumentType = z.$class({extend: Node}, {
        init: function(value){
            this.nodeName = value;
            this.nodeType = Node.DOCUMENT_TYPE_NODE;
        },
        toObject: function(){
            var obj = {
                nodeName: this.nodeName,
                nodeType: this.nodeType,
                nodeValue: this.nodeValue
            };
            return obj;
        },
        toXMLString: function(tabCount){
            tabCount = tabCount || 0;
            var str = generateString('\t', tabCount) 
                + '<!' + this.nodeName + ' ' + this.nodeValue + '>';
            return str;
        }
    });

    /**
     * 
     * @class
     * @name XMLMetaNode
     */
    var XMLMetaNode = this.XMLMetaNode = z.$class({extend: Node}, {
        init: function(value){
            this.nodeName = value;
            this.nodeType = Node.DOCUMENT_TYPE_NODE;
        },
        toObject: function(){
            var obj = {
                nodeName: this.nodeName,
                nodeType: this.nodeType,
                nodeValue: this.nodeValue
            };
            return obj;
        },
        toXMLString: function(tabCount){
            tabCount = tabCount || 0;
            var str = generateString('\t', tabCount) 
                + '<?' + this.nodeName;
            // for(var i in this.attributes){
            //     if(this.attributes.hasOwnProperty(i)){
            //         str += ' ' + i + '="' + this.attributes[i] + '"';
            //     }
            // }
            str += ' ' + this.nodeValue;
            str += '?>';
            return str;
        }
    });
    
    var generateString = function(ch, count){
        var result = '';
        for (var i = 0; i < count; i++) {
            result += ch;
        };
        return result;
    }

});
;Z.$package('Z.parser', function(z, undefined){

    var TOKEN_TABLE = [
        '<', '<?' , '</', '<!', '<!--', '<![CDATA[',//可能需要回溯判断的 token 们
        '>', '/>', '?>', '-->', ']]>', '=', '"', "'", ' '
    ];


    var MODE_TABLE = [
        '<', '<?' , '</', '<!', '<!--', '<![CDATA['
    ];


    function XMLParser(){
        this._interpreter = new z.parser.Interpreter(TOKEN_TABLE);
        this._attrpreter = new z.parser.Interpreter(TOKEN_TABLE);
    }

    /**
     * 解析xml字符串的方法入口, 传入的xml字符串必须严格符合xml规范
     * @param  {String} xmlText 
     * @return {Document}
     * 
     */
    XMLParser.prototype.parse = function(xmlText){
        var preter = this._interpreter;
        var attrpreter = this._attrpreter;
        preter.prepare(xmlText);
        var token,
            doc = new z.parser.Document(),
            currentNode = doc,
            mode = 'element',
            buffer = '',
            str;
        while((token = preter.eat()) !== null){
            switch(token){
                case '<': //element start
                    str = preter.eat();
                    var element = new z.parser.Element(str);
                    currentNode.appendChild(element);
                    str = preter.eatUntil(['>', '/>']);
                    var ch = preter.eat();//把 > 或 /> 吞掉
                    if(ch === '>'){//当结束符是 > 时, 假定element有子节点
                        currentNode = element;
                        mode = 'element';
                        buffer = '';
                    }
                    if(str.trim().length){
                        attrpreter.prepare(str);
                        var attr, value , split;
                        while((ch = attrpreter.eat()) !== null){
                            if(ch === ' '){//attr start
                                attr = attrpreter.eatUntil(['=', ' ']);
                                if(attr === null || !attr.trim().length){
                                    break;
                                }
                                split = attrpreter.eat();//看看下一个字符是什么
                                if(split === ' '){//该属性没有值的

                                }else if(split === '='){
                                    split = attrpreter.eatUntil(['"', "'"]);//跳过可能的空格
                                    split = attrpreter.eat();
                                    value = attrpreter.eatUntil(split);
                                    attrpreter.eat();//跳过最后一个结束符
                                }
                                element.attr(attr, value || attr);
                            }
                        }
                    }
                    break;
                case '</'://element end
                    str = preter.eatUntil('>');
                    str = str.trim();
                    if(currentNode.tagName !== str){
                        //不是? 那往上找
                        while(currentNode.parentNode !== null && currentNode.tagName !== str){
                            currentNode = currentNode.parentNode;
                        }
                    }
                    if(currentNode.tagName === str){
                        //可以结束当前的节点了
                        currentNode = currentNode.parentNode;
                        preter.eat();//干掉 >
                        mode = 'normal';
                    }else{
                        //一直没找到,  这不是规范的xml
                        throw new Error('ugly xml: ' + str + ", pos: " + preter.getProgress() + ", nextToken: " + preter.eat());
                    }
                    break;
                case '<!--'://注释开始
                    str = preter.eatUntil('-->');
                    preter.eat();
                    var comment = new z.parser.Comment(str);
                    currentNode.appendChild(comment);
                    buffer = '';
                    break;
                case '<![CDATA[':
                    str = preter.eatUntil(']]>');
                    preter.eat();
                    var cdata = new z.parser.CDATA(str);
                    currentNode.appendChild(CDATA);
                    buffer = '';
                    break;
                case '<?':
                    str = preter.eat();
                    var metaNode = new z.parser.XMLMetaNode(str);
                    currentNode.appendChild(metaNode);
                    str = preter.eatUntil('?>');
                    if(str !== null){
                        metaNode.nodeValue = str.trim();
                        preter.eat();//干掉 ?>
                    }
                    buffer = '';
                    break;
                case '<!':
                    str = preter.eat();
                    var docType = new z.parser.DocumentType(str);
                    currentNode.appendChild(docType);
                    str = preter.eatUntil('>');
                    if(str !== null){
                        docType.nodeValue = str.trim();
                        preter.eat();//干掉 >
                    }
                    buffer = '';
                    break;
                default:
                    buffer += token;
                    if(mode === 'element'){//这里的内容可能是currentNode的子节点
                        str = preter.eatUntil(MODE_TABLE);
                        str = buffer + (str || '');
                        if(str.trim().length){
                            //前面的都是文本节点
                            var textNode = new z.parser.Text(str);
                            currentNode.appendChild(textNode);
                        }
                    }
                    break;
            }

        }
        return doc;
    };
    
    this.XMLParser = XMLParser;

});