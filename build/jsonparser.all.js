
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

});;Z.$package('Z.parser', function(z, undefined){

    var TOKEN_TABLE = [
        '{', '/' , ':', '"', "'", '}', ',', '[', ']'
    ];

    function JSONParser(){
        this._interpreter = new z.parser.Interpreter(TOKEN_TABLE);
    }

    JSONParser.prototype.parse = function(jsonText) {
        // throw new Error('not complete');
        var preter = this._interpreter;
        preter.prepare(jsonText);
        var result = {};
        var token = preter.eatUntil('{');//找到第一个 ｛ ，作为json的开始
        if(token === null){
            throw new Error('not json');
        }else if(token.trim()){
            throw new Error('error json format');
        }
        preter.eat();//吞掉｛
        handleProperties(result, preter);
        return result;
    };

    function handleProperties(obj, preter){
        var token, str, prop, value, tmpObj, propState;
        while((token = preter.eatUntil(['}', '"', ':'])) !== null){
            propState = false;
            str = preter.eat();
            if(str === '}'){//obj结束了
                return;
            }
            if(str === '"'){
                //property start
                prop = preter.eatUntil(str);
                preter.eatUntil(':');//吞掉属性后面的引号和空白
                preter.eat();//吞掉：
                propState = true;
            }
            if(str === ':'){
                prop = token.trim();
                propState = true;
            }
            if(propState){
                token = preter.eatUntil([',', '{', '}', '[']);
                str = preter.eat();//吞掉，或｝｛
                if(str === ','){
                    value = getValue(token);
                    obj[prop] = value;
                }else if(str === '}'){
                    value = getValue(token);
                    obj[prop] = value;
                    return;//这个obj已经结束了
                }else if(str === '{'){//嵌套的obj
                    value = {};
                    obj[prop] = value;
                    handleProperties(value, preter);
                }else if(str === '['){
                    value = [];
                    obj[prop] = value;
                    while((token = preter.eatUntil(['{', ']'])) !== null){
                        str = preter.eat();
                        if(str === ']'){
                            //数组结束了
                            break;
                        }else if(str === '{'){
                            tmpObj = {};
                            value.push(tmpObj);
                            handleProperties(tmpObj, preter);
                        }
                    }
                }
            }//end propState
        }
    }

    function getValue(str){
        //目前不支持Date类型
        str = str.trim();
        if(str === 'null'){
            return null;
        }else if(str.indexOf('"') === 0){
            //string
            return str.substring(1, str.length - 1);
        }else if(str === 'true'){
            return true;
        }else if(str === 'false'){
            return false;
        }else {
            return parseFloat(str);
        }
    }

    this.JSONParser = JSONParser;

});