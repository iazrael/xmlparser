用纯js实现XML的解析，纯的！

不推荐用于浏览器js，只在不能使用dom的方法的情况下使用，例如nodejs环境中

一不小心的蛋疼，把JSON的也写了，诶～

###使用方法###
    var Z = require('./ztool.mini.js');
    var Z = require('./xmlparser.all.js');
    var xmlText = '<?xml version="1.0"?> <!DOCTYPE html> <head>\
        <meta http-equiv="content-type" content="text/html; charset=utf-8" />\
        <title>Test</title>\
    </head>\
    <!--  <meta http-equiv="content-type" content="text/html; charset=utf-8" />\
        <title>Test</title>-->';

    var parser = new Z.parser.XMLParser();
    parser.parse(xmlText);

    var jsonText = '{"nodeType":9,"nodeName":"document","attributes":{},"childNodes":[{"nodeName":"xml","nodeType":10,"nodeValue":"version=\"1.0\""},{"nodeName":"DOCTYPE","nodeType":10,"nodeValue":"html"},{"nodeType":1,"nodeName":"head","attributes":{},"childNodes":[{"nodeType":1,"nodeName":"meta","attributes":{"http-equiv":"content-type","content":"text/html; charset=utf-8"},"childNodes":[],"tagName":"meta"},{"nodeType":1,"nodeName":"title","attributes":{},"childNodes":[{"nodeType":3,"nodeValue":"Test"}],"tagName":"title"}],"tagName":"head"},{"nodeType":8,"nodeValue":"  <meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\" />\n    <title>Test</title>"}]}';

    var parser = new Z.parser.JSONParser();
    parser.parse(jsonText);

