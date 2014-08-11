/***** Complex Number Calculation Library 0.4 *****/

/* requires "prec-math.js" */
/* requires "tools.js" */

(function (window, undefined){
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
    expr = expr.replace(/\b([0-9]+)([a-zA-Z]+)\b/g, "($1*$2)");
    
    expr = expr.replace(/\b([0-9]+)\b/g, "‘$1,0’"); // real numbers
    expr = expr.replace(/\bi\b/g, "‘0,1’"); // imaginary numbers
    
    return expr;
  }
  
  function parse(expr){
    var pos = 0;
    var before;
    var next = getNextObject(expr, pos);
    if (isOperator(next)){
      if (/[-+]/.test(next)){
        before = "‘0,0’";
      } else {
        throw "Error: parse: Invalid operator at start of expr";
      }
    } else if (isNumber(next)){
      before = next;
      pos += next.length;
    } else if (isBracket(next)){
      before = parse(next.substring(1, next.length-1));
      pos += next.length;
    } else if (isFunction(next)){
      var name = next.substring(0, next.indexOf("("));
      before = [name];
      var blevel = 1; // bracket level
      var nlevel = 0; // number level
      var lastbound = name.length;
      for (var i = name.length+1; i < next.length-1; i++){
        switch (next[i]){
          case "(": blevel++; break;
          case ")": blevel--; break;
          case "‘": nlevel++; break;
          case "’": nlevel--; break;
          case ",": if (blevel == 1 && nlevel == 0){
            before.push(parse(next.substring(lastbound+1, i)));
            lastbound = i;
          }
        }
      }
      before.push(parse(next.substring(lastbound+1, next.length-1)));
      pos += next.length;
    } else {
      throw "Error: parse: Next object not a number or an operator";
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
    var expr2 = expr.substring(pos, expr.length);
    if (expr2[0] == "‘"){
      return expr2.match(/^‘[0-9]+,[0-9]+’/)[0];
    } else if (isOperator(expr2[0])){
      return expr2[0];
    } else if (expr2[0] == "(" || /^[a-zA-Z0-9]+\(/.test(expr2)){
      var start = (expr2[0] == "(")?1:(expr2.indexOf("(")+1);
      var level = 1;
      for (var i = start; i < expr2.length; i++){
        if (expr2[i] == "(")level++;
        else if (expr2[i] == ")")level--;
        if (level == 0){
          return expr2.substring(0, i+1);
        }
      }
      
      throw "Error: getNextObject: Brackets not matched";
    }
    
    throw "Error: getNextObject: Character \"" + expr2[0] + "\" not a number or an operator";
  }
  
  function getOperand(expr, oper, pos){
    var oper1 = getNextObject(expr, pos);
    if (!isOperator(oper1)){
      throw "Error: getOperand: Object at given position not an operator";
    }
    pos += oper1.length;
    
    var next = getNextObject(expr, pos);
    if (isNumber(next) || isBracket(next) || isFunction(next)){
      pos += next.length;
      var oper2 = getNextObject(expr, pos);
      if (oper2 === null)return next;
      else if (!isOperator(oper2)){
        throw "Error: getOperand: Object after number or bracket not an operator";
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
  
  function isBracket(obj){
    return (obj[0] == "(") && (obj[obj.length-1] == ")");
  }
  
  function isFunction(obj){
    return /^[a-zA-Z0-9]+\(/.test(obj) && (obj[obj.length-1] == ")");
  }
  
  function isNumber(obj){
    return /^‘[0-9]+,[0-9]+’$/.test(obj);
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
  
  // alert($.toStr(parse(preparse("2e2xp2(sin(342i+32, 16)!^3i-4, cos(34)/10^150i)"))))
})(window);