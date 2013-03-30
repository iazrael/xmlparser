
;Z.$package('Z.parser', function(z, undefined){

    var TOKEN_TABLE = [
        '<', '<?' , '</', '<!', '<!--', '<![CDATA[',//可能需要回溯判断的 token 们
        '>', '/>', '?>', '-->', ']]>', '=', '"', "'", ' '
    ];


    var MODE_TABLE = [
        '<', '<?' , '</', '<!', '<!--', '<![CDATA['
    ];


    function XMLParser(){
        this._interpreter = new z.parser.Interpreter(TOKEN_TABLE);
        this._attrpreter = new z.parser.Interpreter(TOKEN_TABLE);
    }


    XMLParser.prototype = {
        /**
         * 解析xml字符串的方法入口, 传入的xml字符串必须严格符合xml规范
         * @param  {String} xmlText 
         * @return {Document}
         * 
         */
        parse: function(xmlText){
            var preter = this._interpreter;
            var attrpreter = this._attrpreter;
            preter.prepare(xmlText);
            var token,
                doc = new z.parser.Document(),
                currentNode = doc,
                mode = 'element',
                buffer = '',
                str;
            while((token = preter.eat()) !== null){
                switch(token){
                    case '<': //element start
                        str = preter.eat();
                        var element = new z.parser.Element(str);
                        currentNode.appendChild(element);
                        str = preter.eatUntil(['>', '/>']);
                        var ch = preter.eat();//把 > 或 /> 吞掉
                        if(ch === '>'){//当结束符是 > 时, 假定element有子节点
                            currentNode = element;
                            mode = 'element';
                            buffer = '';
                        }
                        if(str.trim().length){
                            attrpreter.prepare(str);
                            var attr, value , split;
                            while((ch = attrpreter.eat()) !== null){
                                if(ch === ' '){//attr start
                                    attr = attrpreter.eatUntil(['=', ' ']);
                                    if(attr === null || !attr.trim().length){
                                        break;
                                    }
                                    split = attrpreter.eat();//看看下一个字符是什么
                                    if(split === ' '){//该属性没有值的

                                    }else if(split === '='){
                                        split = attrpreter.eatUntil(['"', "'"]);//跳过可能的空格
                                        split = attrpreter.eat();
                                        value = attrpreter.eatUntil(split);
                                        attrpreter.eat();//跳过最后一个结束符
                                    }
                                    element.attr(attr, value || attr);
                                }
                            }
                        }
                        break;
                    case '</'://element end
                        str = preter.eatUntil('>');
                        str = str.trim();
                        if(currentNode.tagName !== str){
                            //不是? 那往上找
                            while(currentNode.parentNode !== null && currentNode.tagName !== str){
                                currentNode = currentNode.parentNode;
                            }
                        }
                        if(currentNode.tagName === str){
                            //可以结束当前的节点了
                            currentNode = currentNode.parentNode;
                            preter.eat();//干掉 >
                            mode = 'normal';
                        }else{
                            //一直没找到,  这不是规范的xml
                            throw new Error('ugly xml: ' + str + ", pos: " + preter.getProgress() + ", nextToken: " + preter.eatNotMove());
                        }
                        break;
                    case '<!--'://注释开始
                        str = preter.eatUntil('-->');
                        preter.eat();
                        var comment = new z.parser.Comment(str);
                        currentNode.appendChild(comment);
                        buffer = '';
                        break;
                    case '<![CDATA[':
                        str = preter.eatUntil(']]>');
                        preter.eat();
                        var cdata = new z.parser.CDATA(str);
                        currentNode.appendChild(CDATA);
                        buffer = '';
                        break;
                    case '<?':
                        str = preter.eat();
                        var metaNode = new z.parser.XMLMetaNode(str);
                        currentNode.appendChild(metaNode);
                        str = preter.eatUntil('?>');
                        if(str !== null){
                            metaNode.nodeValue = str.trim();
                            preter.eat();//干掉 ?>
                        }
                        buffer = '';
                        break;
                    case '<!':
                        str = preter.eat();
                        var docType = new z.parser.DocumentType(str);
                        currentNode.appendChild(docType);
                        str = preter.eatUntil('>');
                        if(str !== null){
                            docType.nodeValue = str.trim();
                            preter.eat();//干掉 >
                        }
                        buffer = '';
                        break;
                    default:
                        buffer += token;
                        if(mode === 'element'){//这里的内容可能是currentNode的子节点
                            str = preter.eatUntil(MODE_TABLE);
                            str = buffer + (str || '');
                            if(str.trim().length){
                                //前面的都是文本节点
                                var textNode = new z.parser.Text(str);
                                currentNode.appendChild(textNode);
                            }
                        }
                        break;
                }

            }
            return doc;
        }
    };
    
    this.XMLParser = XMLParser;

});