
;Z.$package(function(z, undefined){

    /**
     * 节点定义
     * @class
     * @name Node
     */
    var Node = z.$class({
        init: function(){
            this.nodeType = null;
            this.nodeName = null;
            this.nodeValue = null;
            this.parentNode = null;
            this.attributes = {};
            this.childNodes = [];
        },
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
        },
        //,TODO  insertBefore, insertAfter, replaceChild, normalize
        //
        toObject: function(){

        },
        toJSONString: function(){
            var str = JSON.stringify(this.toObject());
            return str;
        },
        toXMLString: function(){

        },
        toString: function(){
            return this.toJSONString();
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


    /**
     * @class
     * @name Element
     */
    var Element = z.$class({extend: Node }, {
        init: function(tagName){
            this.tagName = tagName;
            this.nodeType = Node.ELEMENT_NODE;
            this.nodeName = tagName;
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
        },
        toObject: function(){

        },
        toXMLString: function(){

        }
    });

    /**
     * @class
     * @name Text
     */
    var Text = z.$class({extend: Node}, {
        init: function(value){
            this.nodeValue = value;
            this.nodeType = Node.TEXT_NODE;
        },
        toString: function(){
            return this.nodeValue || '';
        }
    });

    /**
     * 文档定义
     * @class
     * @name Document
     */
    var Document = z.$class({extend: Element}, {
            
    });
    

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

    var MATCH_NONE = 0;
    var MATCH_EXACTLY = 1;
    var MATCH_POLYSEMY = 2;

    /**
     * 判读一个字符或字符串是否是token, 严格匹配
     * @param  {String}  text 
     * @return {Boolean}
     */
    function isToken(text){
        return TOKEN_TABLE.indexOf(text) > -1;
    }

    /**
     * 判断一个字符或字符串是否匹配到了一个 token
     * 匹配情况分三种
     * 1: 唯一完全匹配, 返回会 MATCH_ONE
     * 2: 匹配了多个开头, 返回 MATCH_POLYSEMY
     * 3: 未有匹配, 返回 MATCH_NONE
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
                break;
            }
        }
        if(count > 1){
            return MATCH_POLYSEMY;
        }
        if(!count){//0
            return MATCH_NONE;
        }
        if(isToken(text)){
            return MATCH_EXACTLY;
        }
        return MATCH_POLYSEMY;
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

    var MODE_NORMAL = 'normal';
    var MODE_TOKEN = 'token';
    var MODE_ELEMENT = 'element';
    var MODE_STRING = 'string';
    var MODE_ID = 'id';
    var MODE_COMMENT = 'comment';
    var MODE_DATA = 'data';
    var MODE_END_ID = 'end-id';

    var MODE_TABLE = {
        '<': MODE_ELEMENT,
        '<?': MODE_ELEMENT, 
        '</': MODE_ELEMENT, 
        '<!': MODE_ELEMENT, 
        '<!--': MODE_COMMENT, 
        '<![CDATA[': MODE_DATA, 
        '"': MODE_STRING, 
        //TODO '\'': MODE_STRING,
        ' ': MODE_ID,
        '=': MODE_END_ID
    };

    Interpreter.prototype = {
        init: function(xmlText){
            this.text = xmlText;
            this.length = xmlText.length;
            this.pos = 0;
            this.lastPos = 0;
            this.stack = [];
            this.mode = MODE_NORMAL;
        },
        next: function(){
            var ch, m, 
                text, 
                stack = [],
                polysemy = false
                ;
            while(this.pos < this.length){
                ch = this.text.charAt(this.pos);
                if(polysemy){
                    text = stack.join('') + ch;
                }else{
                    text = ch;
                }
                m = isMatchToken(text);
                if(m === MATCH_POLYSEMY){
                    if(!polysemy && stack.length){
                        return stack.join('');
                    }
                    stack.push(ch);
                    this.pos ++;
                    polysemy = true;
                }else if(m === MATCH_EXACTLY){
                    if(polysemy){
                        this.pos ++;
                        return text;
                    }
                    if(stack.length){
                        return stack.join('');
                    }
                    this.pos ++;
                    return ch;
                }else{
                    if(polysemy){
                        return stack.join('');
                    }
                    stack.push(ch);
                    this.pos ++;
                }
            }
            return null;
        },
        next2: function(){
            var first = this.next();
            if(isToken(first)){
                return first;
            }
            var pos = this.pos;
            var secend = this.next();
            while(secend !== null && !isToken(secend)){
                first += secend;
                pos = this.pos;
                secend = this.next();
            }
            this.pos = pos;
            return first;
        },
        nextToken: function(){
            var ch, m, 
                text, 
                token = null;
            this.stack = [];
            while(this.pos < this.length){
                ch = this.text.charAt(this.pos);
                if((/*this.mode === MODE_NORMAL || */this.mode === MODE_ID) && isEmptyChar(ch)){
                    //跳过无用的空白字符
                    this.pos++;
                    continue;
                }
                if(this.mode === MODE_TOKEN){
                    text = this.stack.join('') + ch;
                }else{
                    text = ch;
                }
                m = isMatchToken(text);
                if(m === MATCH_POLYSEMY){
                    //还不确定是哪一个,要继续吃下一个
                    this.mode = MODE_TOKEN;
                }else if(m === MATCH_ONE){//TODO
                    if(this.mode === MODE_NORMAL){
                        token = text;
                        this.pos++;
                        break;
                    }else if(this.mode === MODE_ELEMENT){
                        token = this.stack.join('');
                        this.mode = MODE_TABLE[text] || MODE_NORMAL;
                        if(this.mode === MODE_ID){
                            //这里开启了 id 的匹配模式, 说明这个是空格, 跳过
                            this.pos++;
                        }
                        break;
                    }else if(this.mode === MODE_ID){
                        if(MODE_TABLE[text]){
                            this.mode = MODE_TABLE[text];
                        }
                        if(this.mode === MODE_END_ID){//结束 id 匹配模式
                            token = this.stack.join('');
                            this.pos++;
                            break;
                        }
                    }else if(this.mode === MODE_END_ID){
                        this.mode = MODE_TABLE[text] || MODE_NORMAL;
                        this.pos++;
                        continue;
                    }else if(this.mode === MODE_STRING){
                        if(this.mode === MODE_TABLE[text]){
                            //string 匹配模式结束
                            token = this.stack.join('');
                            this.pos++;
                            this.mode = MODE_ID;
                            break;
                        }
                    }
                }else{// MATCH_NONE
                    if(this.mode === MODE_TOKEN){//因 MODE_TOKEN 导致的 MATCH_NONE 要回溯
                        token = this.stack.join('');
                        //根据是什么 token 切换到指定 mode
                        this.mode = MODE_TABLE[token] || MODE_NORMAL;
                        break;
                    }else{
                        //this.mode = MODE_STRING;
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

    var SIGNIFICANT_WHITESPACE = {
        'before-element': true
    };

    XMLParser.prototype = {
        /**
         * 解析xml字符串的方法入口, 传入的xml字符串必须严格符合xml规范
         * @param  {String} token xmlText 
         * @return {Document}
         * @example 
         * 
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <title>Test</title>
</head>
         */
        parse: function(token){
            /**
             * before-element |
             * element |
             * before-name |
             * name |
             * before-value |
             * value
             */
            var state = 'before-element',
                index,
                buffer = '',
                text,
                name,
                value,
                temp,
                elementName,
                elementRegex = /[^<>&\/\\ ]+(?=(>|\/>| ))/g,
                regexMatchs,
                doc,
                root,
                currentNode,
                node;
            for(var character, i = 0; character = token.charAt(i); i++) {
                switch (character) {

                    case ' ':
                    case '\t':
                    case '\r':
                    case '\n':
                    case '\f':
                        switch(state){
                            case 'element':
                                state = 'before-name';
                                break;
                        }
                        // if(SIGNIFICANT_WHITESPACE[state]){
                        //     buffer += character;
                        // }
                        break;
                    //string 
                    case '"':
                        if(state === 'before-value'){
                            index = token.indexOf('"', i + 1) ;
                            if (index === -1) {
                                throw '" is missing';
                            }
                            value = token.slice(i + 1, index );
                            currentNode.setAttribute(name, value);
                            i = index;
                            state = 'element';
                        }else{
                            buffer += character;
                        }
                        break;
                    case "'":
                        // index = token.indexOf("'", i + 1);
                        // if (index === -1) {
                        //     throw "' is missing";
                        // }
                        // buffer += token.slice(i, index + 1);
                        // i = index;
                        // switch (state) {
                        //     case 'before-value':
                        //         state = 'value';
                        //         break;
                        // }
                        break;
                    case '<':
                        if(state === 'before-element'){
                            text = buffer.trim();
                            if(text && currentNode){
                                node = new Text(text);
                                currentNode.appendChild(node);
                                buffer = '';
                            }
                            if(token.indexOf('<!--', i) === i){// comment
                                index = token.indexOf('-->', i + 4);
                                if(index === -1){
                                    throw '--> is missing';
                                }
                                

                            }else if(token.indexOf('<!', i) === i){// doctype

                            }else if(token.indexOf('<![CDATA[', i) === i){// cdata

                            }else if(token.indexOf('<?', i) === i){// xml declear

                            }else if(token.indexOf('</', i) === i){// element really close
                                temp = '</' + elementName + '>';
                                if(token.indexOf(temp, i) === i){
                                    i += temp.length;
                                    state = 'before-element';
                                    currentNode = currentNode.parentNode;
                                    if(currentNode){
                                        elementName = currentNode.nodeName;
                                    }
                                }else{
                                    throw new SyntaxError('unclose tag ' + elementName);
                                }
                            }else{//element
                                elementRegex.lastIndex = i + 1;
                                regexMatchs = elementRegex.exec(token);
                                if(regexMatchs && regexMatchs.index === i + 1){
                                    elementName = regexMatchs[0];
                                    node = new Element(elementName);
                                    if(currentNode){
                                        currentNode.appendChild(node);
                                    }
                                    currentNode = node;
                                    if(!root){
                                        root = node;
                                    }
                                    i += elementName.length;
                                    state = 'element';
                                    buffer = '';
                                }else{
                                    throw new SyntaxError('unexpect <');
                                }
                            }
                        }else {//end if state
                            buffer += character;
                        }
                        break;
                    // element half close
                    case '>':
                        if(state === 'element'){// element no really close 
                            state = 'before-element';
                        }else {//end if state
                            buffer += character;
                        }
                        break;
                    // element attr name end
                    case '=':
                        if(state === 'name'){
                            name = buffer.trim();
                            state = 'before-value';
                            buffer = '';
                        }else{
                            buffer += character;
                        }
                        break;
                    case '/':
                        if(state === 'before-name'){
                            if(token.indexOf('/>', i) === i){// element really close
                                state = 'before-element';
                                currentNode = currentNode.parentNode;
                                if(currentNode){
                                    elementName = currentNode.nodeName;
                                }
                                i += 1;
                            }else{
                                throw new SyntaxError('unexpect /');
                            }
                        }else{
                            buffer += character;
                        }
                        break;
                    default:
                        switch(state){
                            case 'before-name':
                                state = 'name';
                                break;
                        }
                        buffer += character;
                }//end switch
            }// end for
            return root;
        }
    };
    
    window.XMLParser = XMLParser;
   



});