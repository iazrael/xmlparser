用纯js实现XML的解析，纯的！

XML需要严格的模式，解析HTML会有问题

不推荐用于浏览器js，只在不能使用dom的方法的情况下使用，例如nodejs环境中

其中把解析器的核心（interpreter）拆分出来了，要扩展解析其他格式的问题也易如反掌

反正我是一不小心的蛋疼，就把JSON的也写了，诶～

使用方法
---

    var Z = require('./ztool.mini.js');
    require('./xmlparser.all.js');
    var xmlText = '<?xml version="1.0"?> <!DOCTYPE html> <head>\
        <meta http-equiv="content-type" content="text/html; charset=utf-8" />\
        <title>Test</title>\
    </head>\
    <!--  <meta http-equiv="content-type" content="text/html; charset=utf-8" />\
        <title>Test</title>-->';
    var parser = new Z.parser.XMLParser();
    var xmlDoc = parser.parse(xmlText);

JSON
---

    var Z = require('./ztool.mini.js');
    require('./jsonparser.all.js');
    var jsonText = '{"nodeType":9,"nodeName":"document","attributes":{},"childNodes":[{"nodeName":"xml","nodeType":10,"nodeValue":"version=\"1.0\""},{"nodeName":"DOCTYPE","nodeType":10,"nodeValue":"html"},{"nodeType":1,"nodeName":"head","attributes":{},"childNodes":[{"nodeType":1,"nodeName":"meta","attributes":{"http-equiv":"content-type","content":"text/html; charset=utf-8"},"childNodes":[],"tagName":"meta"},{"nodeType":1,"nodeName":"title","attributes":{},"childNodes":[{"nodeType":3,"nodeValue":"Test"}],"tagName":"title"}],"tagName":"head"},{"nodeType":8,"nodeValue":"  <meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\" />\n    <title>Test</title>"}]}';

    var parser = new Z.parser.JSONParser();
    var json = parser.parse(jsonText);

