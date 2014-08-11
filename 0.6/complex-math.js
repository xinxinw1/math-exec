/***** Complex Number Calculation Library 0.6 *****/

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
    
    //// replace variables with their values
    var varregex;
    for (var i = 0; i < variables.length; i++){
      varregex = new RegExp("\\b" + variables[i][0] + "(?!\\()\\b", "g");
      if (varregex.test(expr)){
        expr = expr.replace(varregex, "(" + variables[i][1] + ")");
      }
    }
    
    //// check if set variables ("x=132")
    var equpos = expr.indexOf("=");
    if (equpos != -1){
      var name = expr.substring(0, equpos);
      if (!/^[a-zA-Z0-9]$/.test(name) || /^(i|pi|e)$/.test(name)){
        throw "Error: preparse: Invalid variable name";
      }
      var data = expr.substring(equpos+1, expr.length);
      variables.push([name, data]);
      expr = data;
    }
    
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
    } else if (next == ""){
      return "";
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
    if (pos >= expr.length)return "";
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
      if (oper2 == "")return next;
      else if (!isOperator(oper2)){
        throw "Error: getOperand: Object after number or bracket not an operator";
      }
      
      if (hasHigherPrecedence(oper2, oper)){
        return next+oper2+getOperand(expr, oper, pos);
      } else {
        return next;
      }
    } else if (isFact(oper1)){
      if (next == "")return "";
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
    if (obj.length == 0)return false;
    return (obj[0] == "(") && (obj[obj.length-1] == ")");
  }
  
  function isFunction(obj){
    if (obj.length == 0)return false;
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
  
  function evalLisp(lisp){
    if (Array.isArray(lisp)){
      var func = getFunction(lisp[0]);
      if (!func)throw "Error: evalLisp: Function not found";
      var args = [];
      for (var i = 1; i < lisp.length; i++){
        args.push(evalLisp(lisp[i]));
      }
      return func.apply(this, args);
    } else {
      return (lisp == "")?undefined:lisp;
    }
  }
  
  function getFunction(name){
    for (var i = 0; i < functions.length; i++){
      if (functions[i][0] == name)return functions[i][1];
    }
    
    return false;
  }
  
  var variables = [];
  variables.push(["e", "e()"]);
  variables.push(["pi", "pi()"]);
  variables.push(["phi", "phi()"]);
  
  var functions = [];
  functions.push(["add", C.add]);
  functions.push(["sub", C.sub]);
  functions.push(["mult", C.mult]);
  functions.push(["div", C.div]);
  functions.push(["exp", C.exp]);
  functions.push(["ln", C.ln]);
  functions.push(["pow", C.pow]);
  functions.push(["root", C.root]);
  functions.push(["sqrt", C.sqrt]);
  functions.push(["cbrt", C.cbrt]);
  functions.push(["abs", C.abs]);
  functions.push(["arg", C.arg]);
  functions.push(["sgn", C.sgn]);
  functions.push(["sign", C.sgn]);
  functions.push(["sin", C.sin]);
  functions.push(["cos", C.cos]);
  functions.push(["sinh", C.sinh]);
  functions.push(["cosh", C.cosh]);
  functions.push(["fact", C.fact]);
  functions.push(["bin", C.bin]);
  functions.push(["agm", C.agm]);
  functions.push(["round", C.round]);
  functions.push(["trunc", C.trunc]);
  functions.push(["floor", C.floor]);
  functions.push(["ceil", C.ceil]);
  functions.push(["re", C.re]);
  functions.push(["Re", C.re]);
  functions.push(["im", C.im]);
  functions.push(["Im", C.im]);
  functions.push(["conj", C.conj]);
  functions.push(["pi", C.pi]);
  functions.push(["e", C.e]);
  functions.push(["phi", C.phi]);
  
  window.CMath = {
    parse: parse
  }
  
  alert($.toStr(evalLisp(parse(preparse("-(53*3-2/(4i))+((34+53i)/(23-34i))*(-i)")))));
  alert($.toStr(evalLisp(parse(preparse("pi(100)")))))
})(window);