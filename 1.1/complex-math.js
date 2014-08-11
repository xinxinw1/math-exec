/***** Complex Number Calculation Library 1.1 *****/

/* requires "prec-math.js" */
/* requires "tools.js" */

(function (window, undefined){
  // changes math expr into form processable by parsePrepared
  function prepare(expr){
    expr = String(expr);
    
    //// clear whitespace
    expr = expr.replace(/\s/g, "");
    
    //// check for illegal characters
    var illchars = expr.match(/[^a-zA-Z0-9,!*+^.=()//-]/);
    if (illchars != null){
      error("Error: prepare: Illegal Character \"" + illchars[0] + "\"");
    }
    
    //// replace "3i" and "5x" with "3*i" and "5*x"
    expr = expr.replace(/\b([0-9.]+)([a-zA-Z]+)\b/g, "($1*$2)");
    
    //// check if set variables ("x=132")
    var equpos = expr.indexOf("=");
    if (equpos != -1){
      var varname = expr.substring(0, equpos);
      if (!/^[a-zA-Z0-9]$/.test(varname) || /^(i|pi|e)$/.test(varname)){
        error("Error: prepare: Invalid variable name \"" + varname + "\"");
      }
      expr = expr.substring(equpos+1, expr.length);
    }
    
    //// replace variables with their values
    var varregex;
    for (var i = 0; i < variables.length; i++){
      varregex = new RegExp("\\b" + variables[i][0] + "(?!\\()\\b", "g");
      if (varregex.test(expr)){
        expr = expr.replace(varregex, "(" + variables[i][1] + ")");
        log("Variable " + variables[i][0] + ":", expr);
      }
    }
    
    //// if set variable, add to array after other vars have been replaced
    if (varname != undefined){
      setVariable(varname, expr);
    }
    
    expr = expr.replace(/\b([0-9.]+)\b/g, "‘$1,0’"); // real numbers
    expr = expr.replace(/\bi\b/g, "‘0,1’"); // imaginary numbers
    
    return expr;
  }
  
  // converts prepared math expr -> lisp array
  function parsePrepared(expr){
    var pos = 0;
    var before;
    var curr = getObject(expr, pos);
    if (isOperator(curr)){
      if (/[-+]/.test(curr)){
        before = "‘0,0’";
      } else {
        error("Error: parse: Invalid operator \"" + curr + "\" at start of expr");
      }
    } else if (isNumber(curr)){
      before = curr;
      pos += curr.length;
    } else if (isBracket(curr)){
      before = parsePrepared(curr.substring(1, curr.length-1));
      pos += curr.length;
    } else if (isFunction(curr)){
      before = parseFunction(curr);
      pos += curr.length;
    } else if (curr == ""){
      return "";
    } else {
      error("Error: parse: Unknown object \"" + curr + "\"");
    }
    var operand, after;
    while (pos < expr.length){
      curr = getObject(expr, pos);
      if (isOperator(curr)){
        if (isFact(curr)){
          before = ["fact", before];
          pos += curr.length;
        } else {
          operand = getOperand(expr, pos);
          after = parsePrepared(operand);
          
          before = [getOperatorWord(curr), before, after];
          pos += curr.length + operand.length;
        }
      } else {
        error("Error: parse: Object \"" + curr + "\" not an operator");
      }
    }
    
    return before;
  }
  
  // converts function expr -> lisp array
  function parseFunction(expr){
    var name = expr.substring(0, expr.indexOf("("));
    var args = [];
    var blevel = 1; // bracket level
    var nlevel = 0; // number level
    var lastbound = expr.indexOf("(");
    for (var i = lastbound+1; i < expr.length-1; i++){
      switch (expr[i]){
        case "(": blevel++; break;
        case ")": blevel--; break;
        case "‘": nlevel++; break;
        case "’": nlevel--; break;
        case ",": if (blevel == 1 && nlevel == 0){
          args.push(expr.substring(lastbound+1, i));
          lastbound = i;
        }
      }
    }
    args.push(expr.substring(lastbound+1, expr.length-1));
    
    for (var i = 0; i < args.length; i++){
      args[i] = parsePrepared(args[i]);
    }
    
    return [name].concat(args);
  }
  
  // gets the object starting at pos
  function getObject(expr, pos){
    if (pos >= expr.length)return "";
    var expr2 = expr.substring(pos, expr.length);
    
    if (expr2[0] == "‘"){
      return expr2.match(/^‘[0-9.]+,[0-9.]+’/)[0];
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
      error("Error: getObject: Brackets not matched");
    } else {
      error("Error: getObject: Character \"" + expr2[0] + "\" not a number or an operator");
    }
  }
  
  // gets the operand of an operator given position of the operator
  function getOperand(expr, pos){
    var oper = getObject(expr, pos);
    if (!isOperator(oper)){
      error("Error: getOperand: Object \"" + oper + "\" not an operator");
    }
    pos += oper.length;
    
    var operand = "";
    var last = oper;
    var curr;
    while (true){
      curr = getObject(expr, pos);
      if (isNumber(curr) || isBracket(curr) || isFunction(curr)){
        if (isOperator(last) && !isFact(last)){
          pos += curr.length;
          operand += curr;
          last = curr;
        } else {
          error("Error: getOperand: Object \"" + last + "\" before number, bracket, or function not a non-factorial operator");
        }
      } else if (isOperator(curr)){
        if (!isOperator(last) || isFact(last)){
          if (hasHigherPrecedence(curr, oper)){
            pos += curr.length;
            operand += curr;
            last = curr;
          } else {
            break;
          }
        } else {
          error("Error: getOperand: Object \"" + last + "\" before operator is a non-factorial operator");
        }
      } else if (curr == ""){
        if (!isOperator(last) || isFact(last)){
          break;
        } else {
          error("Error: getOperand: Missing object after non-factorial operator \"" + last + "\"");
        }
      } else {
        error("Error: getOperand: Unknown object \"" + curr + "\"");
      }
    }
    
    return operand;
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
      default: error("Error: getPrecedenceLevel: Unknown operator \"" + oper + "\"");
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
      default: error("Error: getOperatorWord: Unknown operator \"" + oper + "\"");
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
    return /^‘[0-9.]+,[0-9.]+’$/.test(obj);
  }
  
  function isOperator(obj){
    return /^[-+*^//!]$/.test(obj);
  }
  
  function isFact(obj){
    return obj == "!";
  }
  
  // evaluates lisp array into ‘a,b’
  function evalLisp(lisp){
    if (Array.isArray(lisp)){
      var func = getFunction(lisp[0]);
      if (!func)error("Error: evalLisp: Function \"" + lisp[0] + "\" not found");
      var args = [];
      for (var i = 1; i < lisp.length; i++){
        args.push(evalLisp(lisp[i]));
      }
      try {
        var result = func.apply(this, args);
        log("Finish evalLisp:", $.toStr(lisp) + " -> " + result);
        return result;
      } catch (e){
        error(e);
      }
    } else {
      return (lisp == "")?undefined:lisp;
    }
  }
  
  // gets function reference from functions list given name as string
  function getFunction(name){
    for (var i = 0; i < functions.length; i++){
      if (functions[i][0] == name)return functions[i][1];
    }
    
    return false;
  }
  
  function setVariable(name, value){
    for (var i = 0; i < variables.length; i++){
      if (variables[i][0] == name)variables[i][1] = value;
    }
    
    variables.push([name, value]);
  }
  
  // converts ‘a,b’ -> a+bi
  function numToDisp(num){
    var re = C.getA(num);
    var b = C.getB(num);
    var im = R.abs(b);
    switch (im){
      case "0": return re;
      case "1": im = "i"; break;
      default: im += "i"; break;
    }
    var sign = R.isNeg(b);
    if (re == "0"){
      return (sign?"-":"") + im;
    } else {
      return re + (sign?"-":"+") + im;
    }
  }
  
  // converts math expr -> lisp array
  function parse(expr){
    expr = prepare(expr);
    log("Finish prepare:", expr);
    expr = parsePrepared(expr);
    log("Finish parsePrepared:", expr);
    
    return expr;
  }
  
  // converts math expr -> a+bi
  function calc(expr){
    log("Input:", expr);
    expr = parse(expr);
    expr = evalLisp(expr);
    log("Finish evalLisp:", expr);
    expr = numToDisp(expr);
    log("Finish numToDisp:", expr);
    
    return expr;
  }
  
  function error(str){
    var arr = String(str).split(": ");
    var name = "", func = "", data = "";
    if (arr.length == 2){
      name = arr.shift();
      data = arr.join(": ");
      log(name + ":", data);
    } else if (arr.length == 3){
      name = arr.shift();
      func = arr.shift();
      data = arr.join(": ");
      log(name + ":", func + ": " + data);
    }
    
    throw str;
  }
  
  function log(name, data){
    logCallback(name, $.toStr(data));
  }
  
  function setLogCallback(func){
    logCallback = func;
  }
  
  var logCallback = function (name, data){};
  
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
    parse: parse,
    evalLisp: evalLisp,
    numToDisp: numToDisp,
    calc: calc,
    setLogCallback: setLogCallback
  }
})(window);