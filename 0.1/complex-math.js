/***** Complex Number Calculation Library 0.1 *****/

/* requires "prec-math.js" */
/* requires "tools.js" */

(function (window, undefined){
  /*
  3i+5+2^3+exp(34)-24*5!-(3i^sin(32-i)+5/3)^4
  
  ["sub", 
    ["sub", 
      ["add", 
        ["add", 
          ["add", "‘0,3’", "‘5,0’"], 
          ["pow", "‘2,0’", "‘3,0’"]], 
        ["exp", "‘34,0’"]], 
      ["mult", 
        "‘24,0’", 
        ["fact", "‘5,0’"]]], 
    ["pow", 
      ["add", 
        ["pow", 
          "‘0,3’", 
          ["sin", ["sub", "‘32,0’", "‘0,1’"]]], 
        ["div", "‘5,0’", "‘3,0’"]], 
      "‘4,0’"]]
      
  -23^2*5-2+4/3*2/4*2/5!/3/2/6!^10-2
  
  ["sub", 
    ["add", 
      ["sub", 
        ["sub",
          "0", 
          ["mult", ["pow", "23", "2"], "5"]], 
        "2"], 
      ["div", 
        ["div", 
          ["div", 
            ["div", 
              ["mult", 
                ["div", 
                  ["mult", 
                    ["div", "4", "3"], 
                    "2"], 
                  "4"], 
                "2"], 
              "5"], 
            "3"], 
          "2"], 
        ["pow", ["fact", "6"], "10"]]], 
    "2"]
      
  ([i0-9)!])- | $1+-
  -([0-9.]+i?)\^ | -1*$1^
  (-?\b[0-9.]+)(?![i0-9.]) | ‘$1,0’
  (-?\b[0-9.]+)i | ‘0,$1’
  (-?\b)i\b | ‘0,$11’
  -(?![0-9.]) | ‘-1,0’*
  
  ‘0,3’+‘5,0’+‘2,0’^‘3,0’+exp(‘34,0’!,‘16,0’)+‘-24,0’*‘5,0’!+‘-1,0’*(‘0,3’^sin(‘32,0’+‘0,-1’)+‘5,0’/‘3,0’)^‘4,0’
  
  http://stackoverflow.com/questions/2447915/javascript-string-regex-backreferences
  ([a-zA-Z0-9]*)\(([^()]*)\) | function (match, $1, $2, offset, original){
    return ([$1]).concat(calcAll($2.split(/,(?=‘)/)));
  }
  
  calcAll
  
  ([-0-9a-z ‘,’"\[\]]+)! | ["fact", "$1"]
  ([-0-9a-z ‘,’"\[\]]+)\^([-0-9a-z ‘,’"\[\]]+) | ["pow", "$1", "$2"]
  
  
  
  3i+5+2^3+exp(34)-24*5!-(3i^sin(32-i)+5/3)^4
  
  
  */
  
  function preparse(expr){
    expr = String(expr);
    
    //// clear whitespace
    expr = expr.replace(/\s/g, "");
    
    //// check for illegal characters
    var illchars = expr.match(/[^a-zA-Z0-9,!*+^.=()//-]/);
    if (illchars != null){
      throw "Syntax Error: Illegal Character \"" + illchars[0] + "\"";
    }
    
    //// replace "3i" and "5x" with "3*i" and "5*x"
    expr = expr.replace(/\b([0-9]+)([a-zA-Z]+)/g, "($1*$2)");
    
    return expr;
  }
  
  function parse(expr){
    var pos = 0;
    var before;
    var next = getNextObject(expr, pos);
    if (isOperator(next)){
      if (/[-+]/.test(next)){
        before = "0";
      } else {
        throw "Error: parse: Invalid operator at start of expr";
      }
    } else if (isNumber(next)){
      before = next;
      pos += next.length;
    }
    var operand, after;
    while (pos < expr.length){
      next = getNextObject(expr, pos);
      if (isOperator(next)){
        if (isFact(next)){
          before = ["fact", before];
          pos += next.length;
        } else {
          operand = getOperand(expr, next, pos);
          after = parse(operand);
          
          before = [getOperatorWord(next), before, after];
          pos += next.length + operand.length;
        }
      } else {
        throw "Error: parse: Next object not an operator";
      }
    }
    
    return before;
  }
  
  function getNextObject(expr, pos){
    if (pos >= expr.length)return null;
    if (isNumber(expr[pos])){
      return expr.substring(pos, expr.length).match(/^[0-9]+/)[0];
    } else if (isOperator(expr[pos])){
      return expr[pos];
    }
    
    throw "Error: getNextObject: Not number or operator";
  }
  
  function getOperand(expr, oper, pos){
    var oper1 = getNextObject(expr, pos);
    if (!isOperator(oper1)){
      throw "Error: getOperand: Object at given position not an operator";
    }
    pos += oper1.length;
    
    var next = getNextObject(expr, pos);
    if (isNumber(next)){
      pos += next.length;
      var oper2 = getNextObject(expr, pos);
      if (oper2 === null)return next;
      else if (!isOperator(oper2)){
        throw "Error: getOperand: Object after first number not an operator";
      }
      
      if (hasHigherPrecedence(oper2, oper)){
        return next+oper2+getOperand(expr, oper, pos);
      } else {
        return next;
      }
    } else if (isFact(oper1)){
      if (next === null)return "";
      else if (!isOperator(next)){
        throw "Error: getOperand: Object after factorial not an operator";
      }
      
      if (hasHigherPrecedence(next, oper)){
        return next+getOperand(expr, oper, pos);
      } else {
        return "";
      }
    } else throw "Error: getOperand: Object after non-factorial operator not a number";
  }
  
  function hasHigherPrecedence(oper2, oper1){
    return getPrecedenceLevel(oper2) > getPrecedenceLevel(oper1);
  }
  
  function getPrecedenceLevel(oper){
    switch (oper){
      case "+":
      case "-": return 0;
      case "*":
      case "/": return 1;
      case "^": return 2;
      case "!": return 3;
      default: throw "Error: getPrecedenceLevel: Unknown operator \"" + oper + "\"";
    }
  }
  
  function getOperatorWord(oper){
    switch (oper){
      case "+": return "add";
      case "-": return "sub";
      case "*": return "mult";
      case "/": return "div";
      case "^": return "pow";
      case "!": return "fact";
      default: throw "Error: getOperatorWord: Unknown operator \"" + oper + "\"";
    }
  }
  
  function isNumber(obj){
    return /^[0-9]+$/.test(obj);
  }
  
  function isOperator(obj){
    return /^[-+*^//!]$/.test(obj);
  }
  
  function isFact(obj){
    return obj == "!";
  }
  
  window.CMath = {
    parse: parse
  }
  // alert($.toStr(parse("-23^2*5-2+4/3*2/4*2/5!/3/2/6!^10-2")))
})(window);