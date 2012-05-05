
;Z.$package(function(z, undefined){

    /**
     * 节点定义
     */
    function Node(){
        
    }

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

    Node.prototype = {
        nodeType: null,
        nodeName: null,
        nodeValue: null,
        parentNode: null,
        attributes: {},
        childNodes: [],
        hasAttributes: function(){
            return !Util.isEmptyObject(this.attributes);
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
            return z.array.contains(this.childNodes, node);
        },
        cloneNode: function(){
            return z.duplicate(this);
        }
        //,TODO  insertBefore, insertAfter, replaceChild, normalize
        //
    };

    function Element(tagName){
        this.tagName = tagName;
        this.nodeType = Node.ELEMENT_NODE;
        this.nodeName = tagName;
    }

    Element.prototype = {
        tagName: null,
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
    };

    z.extend(Element, Node);

    function Text(value){
        this.nodeValue = value;
        this.nodeType = Node.TEXT_NODE;
    }

    Text.prototype = {
        toString: function(){
            return this.nodeValue || '';
        }
    };

    z.extend(Text, Node);

    /**
     * 文档定义
     */
    function Document(){

    }

    Document.prototype = {
            
    };
    
    z.extend(Document, Element);

    /**
     * xml 文本解析引擎
     */
    function Interpreter(){

    }

//     <?xml …?> /*XML说明*/
// 　　<!DOCTYPE …> /*XML文档说明*/
// 　　<!-- … --> /*XML注释*/
// 　　<?xml-stylesheet …?> /*XML指令*/
// 　　<root> /*根数据元素*/
// 　　<child>
// 　　…<![CDATA[…]]>
// 　　</child>
// 　　</root>
    var TOKEN_TABLE = [
        '<', '<?' , '</', '<!', '<!--', '<![CDATA[',//可能需要回溯判断的 token 们
        '>', '/>', '?>', '-->', ']]>', '=', '"', '\'', ' '
    ];

    var NOT_MATCH = 0;
    var MATCH_ONE = 1;
    var MATCH_POLYSEMY = 2;

    /**
     * 判断一个字符或字符串是否匹配到了一个 token
     * 匹配情况分三种
     * 1: 唯一完全匹配, 返回会 MATCH_ONE
     * 2: 匹配了多个开头, 返回 MATCH_POLYSEMY
     * 3: 未有匹配, 返回 NOT_MATCH
     * @param  {String}  text 
     * @return {Boolean}
     */
    function isMatchToken(text){
        var count = 0;
        for(var i = 0, t; t = TOKEN_TABLE[i]; i++){
            if(t.indexOf(text) === 0){
                count++;
            }
            if (count >= 2) {//已经有两个匹配了, 可以退出循环了
                return MATCH_POLYSEMY;
            }
        }
        return count ? MATCH_ONE : NOT_MATCH;
    }

    var EMPTY_CHAR_REGEXP = /\s/;

    /**
     * 判断是否是空白字符, 如空格,换行,缩进等
     * @param  {String}  ch  
     * @return {Boolean}    
     */
    function isEmptyChar (ch) {
        return EMPTY_CHAR_REGEXP.test(ch);
    }

    var NORMAL_MODE = 0;
    var TOKEN_MODE = 1;
    var ELEMENT_MODE = 2;
    var STRING_MODE = 3;
    var ID_MODE = 4;
    var COMMENT_MODE = 5;
    var DATA_MODE = 6;
    var END_ID_MODE = 7;

    var MODE_TABLE = {
        '<': ELEMENT_MODE,
        '<?': ELEMENT_MODE, 
        '</': ELEMENT_MODE, 
        '<!': ELEMENT_MODE, 
        '<!--': COMMENT_MODE, 
        '<![CDATA[': DATA_MODE, 
        '"': STRING_MODE, 
        //TODO '\'': STRING_MODE,
        ' ': ID_MODE,
        '=': END_ID_MODE
    };

    Interpreter.prototype = {
        init: function(xmlText){
            this.text = xmlText;
            this.length = xmlText.length;
            this.pos = 0;
            this.lastPos = 0;
            this.stack = [];
            this.mode = NORMAL_MODE;
        },
        nextToken: function(){
            var ch, m, 
                text, 
                token = null;
            this.stack = [];
            while(this.pos < this.length){
                ch = this.text.charAt(this.pos);
                if((/*this.mode === NORMAL_MODE || */this.mode === ID_MODE) && isEmptyChar(ch)){
                    //跳过无用的空白字符
                    this.pos++;
                    continue;
                }
                if(this.mode === TOKEN_MODE){
                    text = this.stack.join('') + ch;
                }else{
                    text = ch;
                }
                m = isMatchToken(text);
                if(m === MATCH_POLYSEMY){
                    //还不确定是哪一个,要继续吃下一个
                    this.mode = TOKEN_MODE;
                }else if(m === MATCH_ONE){//TODO
                    if(this.mode === NORMAL_MODE){
                        token = text;
                        this.pos++;
                        break;
                    }else if(this.mode === ELEMENT_MODE){
                        token = this.stack.join('');
                        this.mode = MODE_TABLE[text] || NORMAL_MODE;
                        if(this.mode === ID_MODE){
                            //这里开启了 id 的匹配模式, 说明这个是空格, 跳过
                            this.pos++;
                        }
                        break;
                    }else if(this.mode === ID_MODE){
                        if(MODE_TABLE[text]){
                            this.mode = MODE_TABLE[text];
                        }
                        if(this.mode === END_ID_MODE){//结束 id 匹配模式
                            token = this.stack.join('');
                            this.pos++;
                            break;
                        }
                    }else if(this.mode === END_ID_MODE){
                        this.mode = MODE_TABLE[text] || NORMAL_MODE;
                        this.pos++;
                        continue;
                    }else if(this.mode === STRING_MODE){
                        if(this.mode === MODE_TABLE[text]){
                            //string 匹配模式结束
                            token = this.stack.join('');
                            this.pos++;
                            this.mode = ID_MODE;
                            break;
                        }
                    }
                }else{// NOT_MATCH
                    if(this.mode === TOKEN_MODE){//因 TOKEN_MODE 导致的 NOT_MATCH 要回溯
                        token = this.stack.join('');
                        //根据是什么 token 切换到指定 mode
                        this.mode = MODE_TABLE[token] || NORMAL_MODE;
                        break;
                    }else{
                        //this.mode = STRING_MODE;
                    }
                }
                this.stack.push(ch);
                this.pos++;
            }
            return token;
        }
    };

    window.Interpreter = Interpreter;

    function XMLParser(){
        this._interpreter = new Interpreter();
    }
    
    XMLParser.prototype = {
        /**
         * 解析xml字符串的方法入口, 传入的xml字符串必须严格符合xml规范
         * @param  {String} xmlText 
         * @return {Document}
         * @example 
         * 
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <title>Test</title>
</head>
         */
        parse: function(xmlText){
            
        }
    };
    
    window.XMLParser = XMLParser;
    
});