/***** Complex Number Calculation Library Devel *****/

/* requires "tools.js" */
  /* functions isArr, toStr */
/* requires "prec-math.js" */
/* requires "prec-math-check.js" */

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
    } else if (isNumber(curr) || isVariable(curr)){
      before = curr;
      pos += curr.length;
    } else if (isBracket(curr)){
      before = parsePrepared(curr.substring(1, curr.length-1));
      pos += curr.length;
    } else if (isFunction(curr)){
      before = parseFunction(curr);
      pos += curr.length;
    } else if (isEquation(curr)){
      var equpos = curr.indexOf("=");
      var name = curr.substring(0, equpos);
      var data = parsePrepared(curr.substring(equpos+1, curr.length));
      return ["set", name, data];
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
    if (expr[lastbound+1] != ")"){
      args.push(expr.substring(lastbound+1, expr.length-1));
    }
    
    for (var i = 0; i < args.length; i++){
      args[i] = parsePrepared(args[i]);
    }
    
    return [name].concat(args);
  }
  
  // gets the object starting at pos
  function getObject(expr, pos){
    if (pos >= expr.length)return "";
    var expr2 = expr.substring(pos, expr.length);
    
    if (expr2[0] == "‘"){ // Numbers
      return expr2.match(/^‘[0-9.]+,[0-9.]+’/)[0];
    } else if (isOperator(expr2[0])){ // Operators
      return expr2[0];
    } else if (expr2[0] == "(" || /^[a-zA-Z0-9]+\(/.test(expr2)){
      // Brackets and Functions
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
    } else if (/^[a-zA-Z0-9]+=/.test(expr2)){ // Equations
      return expr2;
    } else if (/^[a-zA-Z0-9]+/.test(expr2)){ // Variables
      return expr2.match(/^[a-zA-Z0-9]+/)[0];
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
      if (isNumber(curr) || isBracket(curr) || isFunction(curr) || isVariable(curr) || isEquation(curr)){
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
    if (oper2 == "^" && oper2 == "^")return true;
    
    return getPrecedenceLevel(oper2) > getPrecedenceLevel(oper1);
  }
  
  function getPrecedenceLevel(oper){
    switch (oper){
      case ",": return 0;
      case "+":
      case "-": return 1;
      case "*":
      case "/": return 2;
      case "^": return 3;
      case "!": return 4;
      default: error("Error: getPrecedenceLevel: Unknown operator \"" + oper + "\"");
    }
  }
  
  function getOperatorWord(oper){
    switch (oper){
      case ",": return "progn";
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
  
  function isVariable(obj){
    return /^[a-zA-Z0-9]+$/.test(obj);
  }
  
  function isOperator(obj){
    return /^[-+*^//!,]$/.test(obj);
  }
  
  function isEquation(obj){
    return /^[a-zA-Z0-9]+=/.test(obj);
  }
  
  function isFact(obj){
    return obj == "!";
  }
  
  // evaluates lisp array into ‘a,b’
  function evalLisp(lisp){
    if ($.isArr(lisp)){
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
    } else if (isNumber(lisp)){
      return [lisp.substring("1", lisp.indexOf(",")),
              lisp.substring(lisp.indexOf(",")+1, lisp.length-1)];
    } else {
      return lisp;
    }
  }
  
  function processVariables(lisp){
    if ($.isArr(lisp)){
      var func = lisp[0];
      if (func == "set"){
        var name = lisp[1];
        if (name == undefined){
          error("Error: processVariables: set: Name is undefined");
        } else if (/^(i|pi|e|phi)$/.test(name)){
          error("Error: processVariables: set: Invalid variable name");
        }
        var data = lisp[2];
        if (data == undefined){
          error("Error: processVariables: set: Data is undefined");
        }
        data = processVariables(data);
        setVariable(name, data);
        log("Set Variable:", name + " = " + $.toStr(data));
        return data;
      } else if (func == "unset"){
        var name = lisp[1];
        if (name == undefined){
          error("Error: processVariables: unset: Name is undefined");
        } else if (/^(i|pi|e|phi)$/.test(name)){
          error("Error: processVariables: unset: Cannot unset i, pi, or e");
        }
        data = getVariable(name);
        if (!data)error("Error: processVariables: unset: Variable \"" + name + "\" is already unset");
        unsetVariable(name);
        log("Unset Variable:", name);
        return data;
      } else if (func == "progn"){
        var args = [];
        for (var i = 1; i < lisp.length; i++){
          args.push(processVariables(lisp[i]));
        }
        log("Finish progn:", lisp);
        return args[args.length-1];
      } else {
        var args = [];
        for (var i = 1; i < lisp.length; i++){
          args.push(processVariables(lisp[i]));
        }
        return [func].concat(args);
      }
    } else if (isVariable(lisp)){
      var data = getVariable(lisp);
      if (!data)error("Error: processVariables: Variable \"" + lisp + "\" is undefined");
      log("Get Variable " + lisp + ":", $.toStr(data));
      return data;
    } else {
      return lisp;
    }
  }
  
  // gets function reference from functions list given name as string
  function getFunction(name){
    for (var i = 0; i < functions.length; i++){
      if (functions[i][0] == name)return functions[i][1];
    }
    
    return false;
  }
  
  function getVariable(name){
    for (var i = 0; i < variables.length; i++){
      if (variables[i][0] == name)return variables[i][1];
    }
    
    return false;
  }
  
  function setVariable(name, value){
    for (var i = 0; i < variables.length; i++){
      if (variables[i][0] == name){
        variables[i][1] = value;
        return;
      }
    }
    
    variables.push([name, value]);
  }
  
  function unsetVariable(name){
    for (var i = 0; i < variables.length; i++){
      if (variables[i][0] == name){
        variables.splice(i, 1);
        return;
      }
    }
  }
  
  // converts ‘a,b’ -> a+bi
  function numToDisp(num){
    if (num == "")return num;
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
    expr = processVariables(expr);
    log("Finish processVariables:", expr);
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
  
  function addVar(name, lisp){
    variables.push([name, lisp]);
  }
  
  function addFunc(name, ref){
    functions.push([name, ref]);
  }
  
  function addCheckedFunc(name, ref){
    addFunc(name, PMath.makeProcessor(ref));
  }
  
  var variables = [];
  addVar("e", ["e"]);
  addVar("pi", ["pi"]);
  addVar("phi", ["phi"]);
  addVar("ln2", ["ln2"]);
  addVar("ln5", ["ln5"]);
  addVar("ln10", ["ln10"]);
  
  var functions = [];
  addCheckedFunc("add", C.add);
  addCheckedFunc("sub", C.sub);
  addCheckedFunc("mult", C.mult);
  addCheckedFunc("div", C.div);
  
  addCheckedFunc("round", C.round);
  addCheckedFunc("ceil", C.ceil);
  addCheckedFunc("floor", C.floor);
  addCheckedFunc("trunc", C.trunc);
  
  addCheckedFunc("exp", C.exp);
  addCheckedFunc("ln", C.ln);
  addCheckedFunc("pow", C.pow);
  addCheckedFunc("root", C.root);
  addCheckedFunc("sqrt", C.sqrt);
  addCheckedFunc("cbrt", C.cbrt);
  addCheckedFunc("fact", C.fact);
  addCheckedFunc("bin", C.bin);
  addCheckedFunc("agm", C.agm);
  addCheckedFunc("sin", C.sin);
  addCheckedFunc("cos", C.cos);
  addCheckedFunc("sinh", C.sinh);
  addCheckedFunc("cosh", C.cosh);
  
  addCheckedFunc("abs", C.abs);
  addCheckedFunc("arg", C.arg);
  addCheckedFunc("sgn", C.sgn);
  addCheckedFunc("sign", C.sgn);
  addCheckedFunc("re", C.re);
  addCheckedFunc("Re", C.re);
  addCheckedFunc("im", C.im);
  addCheckedFunc("Im", C.im);
  addCheckedFunc("conj", C.conj);
  
  addCheckedFunc("pi", C.pi);
  addCheckedFunc("e", C.e);
  addCheckedFunc("phi", C.phi);
  addCheckedFunc("ln2", C.ln2);
  addCheckedFunc("ln5", C.ln5);
  addCheckedFunc("ln10", C.ln10);
  
  window.CMath = {
    parse: parse,
    evalLisp: evalLisp,
    numToDisp: numToDisp,
    calc: calc,
    setLogCallback: setLogCallback
  }
  
  //alert($.toStr(calc("3i+5+2^3+exp(34)-24*5!-(3i^sin(32-i)+5/3)^4")));
  //alert($.toStr(calc("-23^2*5-2+4/3*2/4*2/5!/3/2/6!^10-2")));
  //alert($.toStr(calc("-(53*3-2/(4i))+((34+53i)/(23-34i))*(-i)")));
  //alert($.toStr(calc("mult(34i+2!, 243*32i/5, 50*1, 3, 60))")));
})(window);