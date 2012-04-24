
;(function(undefined){
    

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
        attributes: {},
        childNodes: [],
        hasAttributes: function(){
            return !Util.isEmptyObject(this.attributes);
        },
        hasChildNodes: function(){
            return !!this.childNodes.length;
        }
        //,TODO appendChild, cloneNode, insertBefore, insertAfter, removeChild, replaceChild, 
        //normalize, contains
        //
    }

    function Element(){

    }

    Element.prototype = {
        tagName: null,
        getAttribute: function(key){

        },
        setAttribute: function(key, value){

        },
        hasAttribute: function(key){

        },
        removeAttribute: function(key){

        },
        //============= 扩展的方法 ========================
        /*getElementById: function(id){

        },
        getElementsByTagName: function(tagName){

        },
        getElementsByName: function(name){
            
        },
        getElementsByClassName: function(className){

        },*/
        /**
         * getAttribute和setAttribute的简写
         * @param  {String} key   
         * @param  {String} value @optional
         * @return {String}, {Node}
         */
        attr: function(key, value){

        },
        /**
         * getElement 系列方法的简写, 仅支持简易的一级选择器
         * @param  {String} selector  
         * @return {Array}, {Node}
         * @example 
         * find('#id');
         * find('.class');
         * find('tag');
         * find('@attr');
         * 
         */
        find: function(selector){

        }
    };

    Util.extend(Element, Node);

    /**
     * 文档定义
     */
    function Document(){

    }

    Document.prototype = {
            
    }
    
    Util.extend(Document, Element);

    function XMLParser(){
    
    }
    
    XMLParser.prototype = {
        /**
         * 解析xml字符串的方法入口, 传入的xml字符串必须严格符合xml规范
         * @param  {String} xmlText 
         * @return {Document}
         */
        parse: function(xmlText){
            var doc = new Document();
            return doc;
        }
    }    
    
    window.XMLParser = XMLParser;
    
})();