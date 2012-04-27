
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

    function XMLParser(){
    
    }
    
    XMLParser.prototype = {
        /**
         * 解析xml字符串的方法入口, 传入的xml字符串必须严格符合xml规范
         * @param  {String} xmlText 
         * @return {Document}
         * @example 
         * <head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <title>Test</title>
</head>
         */
        parse: function(xmlText){
            var root;
            var char, type, start, end, tmp, tag, currNode, node, attr, value;
            for(var i = 0, l = xmlText.length; i < l; i++){
                char = xmlText.charAt(i);
                switch(char){
                    case '<':
                        if(type === 'tagAttrValueStart'){
                            tmp.push(char);
                        }else if(type === 'tagEnd'){//遇到子节点了
                            type = 'subTagStart';
                            tmp = [];
                        }else if(type === 'subTagStart'){//遇到文本节点
                            type = 'subTagEnd';
                            value = tmp.join('');
                            node = new Text(value);
                            currNode.appendChild(node);
                            tmp = [];
                        }else{
                            type = 'tagStart';
                            tmp = [];
                        }
                        break;
                    case '>':
                        if(type === 'tagStart'){
                        //表示这个标签没有属性和空格
                        //如 <html>
                            type = 'tagEnd';
                            tag = tmp.join('');
                            tmp = [];
                            node = new Element(tag);
                            if(!root){
                                root = node;
                            }
                            if(currNode){
                                currNode.appendChild(node);
                            }
                            currNode = node;
                        }else if(type === 'tagExpectEnd'){
                            type = 'holdTagEnd';
                            //结束一个标签
                            currNode = currNode.parentNode;
                        }
                        break;
                    case '\/':
                        if(type === 'tagAttrValueStart'){
                            tmp.push(char);
                        }else if(type === 'tagAttrQuotEnd'){//这个标签的属性已经整完了
                            type = 'tagExpectEnd';
                        }else if(type === 'subTagEnd'){//子标签结束了
                            type = 'tagExpectEnd';
                        }else if(type === 'tagStart'){
                            type = 'tagHasEnd';
                        }
                        break;
                    case '=':
                        if(type === 'tagAttrStart'){
                            type = 'tagAttrQuotStart';
                            attr = tmp.join('');
                            tmp = [];
                        }else if(type === 'tagAttrValueStart'){
                            tmp.push(char);
                        }
                        break;
                    case ' ':
                        if(type === 'tagStart'){//遇到属性了
                            type = 'tagAttrStart';
                            tag = tmp.join('');
                            tmp = [];
                            node = new Element(tag);
                            if(!root){
                                root = node;
                            }
                            if(currNode){
                                currNode.appendChild(node);
                            }
                            currNode = node;
                        }else if(type === 'tagAttrQuotEnd'){//结束了一个属性
                            type = 'tagAttrStart';
                            tmp = [];
                        }else if(type === 'tagAttrValueStart'){
                            tmp.push(char);
                        }else if(type === 'subTagStart'){
                            tag = tmp.join('');
                            tmp = [];
                            node = new Element(tag);

                            currNode.appendChild(node);
                            currNode = node;
                        }
                        break;
                    case '"':
                        if(type === 'tagAttrQuotStart'){
                            type = 'tagAttrValueStart';
                        }else if(type === 'tagAttrValueStart'){
                            type = 'tagAttrQuotEnd';
                            value = tmp.join('');
                            currNode.attr(attr, value);
                        }
                        break;
                    case '!':
                        break;
                    case '?':
                        break;
                    default:
                        if(type === 'tagStart'){
                            tmp.push(char);
                        }else if(type === 'tagAttrStart'){
                            tmp.push(char);
                        }else if(type === 'tagAttrValueStart'){
                            tmp.push(char);
                        }else if(type === 'tagEnd'){
                            tmp.push(char);
                        }else if(type === 'subTagStart'){
                            tmp.push(char);
                        }
                        break;
                }
                
            }

            return root;
        }
    };
    
    window.XMLParser = XMLParser;
    
});