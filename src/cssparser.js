;Z.$package('Z.parser', function(z, undefined){
    
    var TOKEN_TABLE = [
        '@', ';' , 
        '{', '}', 
        '"', "'",
        '/*', '*/'
    ];

    var STYLE_TOKEN_TABLE = [
        ',' , ':' , ';',
        '(' , ')',
        '/*', '*/'
    ];//.concat(TOKEN_TABLE);

    function CSSParser(){
        this._interpreter = new z.parser.Interpreter(TOKEN_TABLE);
        this._stylePreter = new z.parser.Interpreter(STYLE_TOKEN_TABLE);
    }
    
    CSSParser.prototype.parse = function(cssText) {
        var preter = this._interpreter;
        preter.prepare(cssText);
        var result = {};
        handleCssRules(result, preter, this._stylePreter);
        return result;
    };

    var handleCssRules = function(result, preter, stylePreter){
        var food, nextFood, buffer, rule;
        if(!result.cssRules){
            result.cssRules = [];
        }
        while((food = preter.eat()) !== null){
            if(food === '/*'){//处理注释
                buffer = preter.eatUntil('*/');
                preter.eat();//吞掉 */
                result.cssRules.push({
                    type: 'comment',
                    text: buffer
                });
            }else{
                food = food.trim();
                if(!food){
                    continue;
                }
                nextFood = preter.eat();
                switch(nextFood){
                    case '{'://一个样式的开始
                        //TODO 这个不严谨
                        buffer = preter.eatUntil('}');
                        if(buffer === null){
                            break;
                        }
                        rule = {
                            type: 'rule',
                            selectorText: food,
                            cssText: buffer.trim()
                        }
                        preter.eat();//吞掉 } 
                        handleStyle(rule, stylePreter);
                        result.cssRules.push(rule);
                        break;
                    default:
                        
                        break;
                }
            }
        }
    }

    var handleStyle = function(rule, stylePreter){
        var food, prop, value, buffer = '', style, propState = false;
        stylePreter.prepare(rule.cssText);
        delete rule.cssText;
        style = rule.style = {
            length: 0,
            comments: {}
        };
        while((food = stylePreter.eat()) !== null){
            if(food === ':'){//一个属性的开始
                prop = buffer.trim();
                if(!prop){
                    continue;
                }
                value = stylePreter.eatUntil([';']);
                if(!value){
                    continue;
                }
                stylePreter.eat();//吞掉 ;
                buffer = '';
                style[prop] = value.trim();
                style[style.length++] = prop;
                propState = true;
            }else if(food === ';'){//一个值的结束, 可能是多余的
                continue;
            }else if(food === '/*'){
                style.comments[style.length - 1] = {
                    type: 'comment',
                    text: stylePreter.eatUntil('*/')
                }
                stylePreter.eat();//吞掉 */
            }else{
                buffer += food;
            }
        }
    }


    this.CSSParser = CSSParser;

});