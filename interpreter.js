
;Z.$package('imatlas', function(z, undefined){

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

        getProgress: function(){
            return this.pos;
        },

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
        
        eatUntil: function(until){
            if(until && !isArray(until)){
                until = [until];
            }
            var pos = this.pos,
                first = this.eat(),
                secend
                ;
            if(this.isToken(first, until)){
                this.pos = pos;
                // return first;
                return '';
            }
            pos = this.pos;
            while((secend = this.eat()) !== null && !this.isToken(secend, until)){
                first += secend;
                pos = this.pos;
            }
            this.pos = pos;
            return first;
        },

        eatNotMove: function(){
            var pos = this.pos;
            var token = this.eatUntil();
            this.pos = pos;
            return token;
        }
    };

    this.Interpreter = Interpreter;

});