;Z.$package('Z.parser', function(z, undefined){

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
        }
        preter.eat();
        handleProperties(result, preter);
        return result;
    };

    function handleProperties(obj, preter){
        var token, str, prop, value, tmpObj;
        while((token = preter.eatUntil(['}', '"'])) !== null){
            str = preter.eat();
            if(str === '"'){//property start
                prop = preter.eatUntil(str);
                preter.eatUntil(':');
                preter.eat();//吞掉：
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
            }else if(str === '}'){
                //obj结束了
                return;
            }
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