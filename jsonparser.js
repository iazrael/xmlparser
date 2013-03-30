;Z.$package('Z.parser', function(z, undefined){

    var TOKEN_TABLE = [
        '{', '/' , ':', '"', "'", '}', ',', '[', ']'
    ];

    function JSONParser(){
        this._interpreter = new z.parser.Interpreter(TOKEN_TABLE);
    }

    JSONParser.prototype.parse = function(jsonText) {
        // body...
    };

});