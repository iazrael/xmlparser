
;(function(undefined){
    
    /**
     * 节点定义
     */
    function Node(){
        this._attrs = {};
    }

    Node.prototype = {
        children: [],
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

        },
        getAttribute: function(key){

        },
        setAttribute: function(key, value){

        },
        getElementById: function(id){

        },
        getElementsByName: function(name){
            
        },
        getElementsByTagName: function(tagName){

        },
        getElementsByClassName: function(className){

        }
    };

    /**
     * 文档定义
     */
    function Document(){

    }

    Document.prototype = {
        getElementById: function(id){

        },
        getElementsByName: function(name){
            
        },
        getElementsByTagName: function(tagName){

        },
        getElementsByClassName: function(className){

        }
    }

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