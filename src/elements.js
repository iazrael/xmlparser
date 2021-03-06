
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