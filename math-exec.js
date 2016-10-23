/***** Math Executor *****/

/* require tools */
/* require prec-math */
/* require cmpl-math */
/* require math-check */
/* require math-parse */

(function (udf){
  ////// Import //////
  
  var nodep = $.nodep;
  
  var udfp = $.udfp;
  var arrp = $.arrp;
  
  var al = $.al;
  
  var las = $.las;
  
  var apl = $.apl;
  var map = $.map;
  var has = $.has;
  
  var sli = $.sli;
  var app = $.app;
  
  var setDspFn = $.setDspFn;
  
  var each = $.each;
  var mrem = $.mrem;
  var push = $.push;
  
  var att = $.att;
  
  var stf = $.stf;
  
  var oref = $.oref;
  var oset = $.oset;
  var osetp = $.osetp;
  var odel = $.odel;
  
  var head = $.head;
  var arrd = $.arrd;
  
  var typ = $.typ;
  var dat = $.dat;
  var mkdat = $.mkdat;
  var isa = $.isa;
  
  var sta = $.sta;
  var car = $.car;
  var lis = $.lis;
  var nil = $.nil;
  
  var err = $.err;
  
  var cmplp = C.cmplp;
  var zerop = C.zerop;
  
  var varp = Parser.varp;
  var prs = Parser.prs;
  
  var proc = Checker.proc;
  
  ////// Evaluator //////
  
  // evaluates lisp array into a number
  function evl(a, log, env){
    if (udfp(env))env = glbs;
    if (arrp(a)){
      var f = evl(a[0], log, env);
      switch (typ(f)){
      case "specref":
        log("Start evl specref", "$1", a);
        var r = apl(stdspecs[dat(f)], arrd(log, env, sli(a, 1)));
        log("Finish evl specref", "$1 -> $2", a, r);
        return r;
      case "fnref":
        log("Start evl fnref", "$1", a);
        var r = apl(stdfns[dat(f)], evlarr(sli(a, 1), log, env));
        log("Finish evl fnef", "$1 -> $2", a, r);
        return r;
      case "fn":
        log("Start evl fn", "$1", a);
        var args = evlarr(sli(a, 1), log, env);
        var r = evl(f.code, log, parenv(f.params, args, {0: f.env}));
        log("Finish evl fn", "$1 -> $2", a, r);
        return r;
      default:
        err(evl, "f = $1 is not a function", f);
      }
    }
    if (varp(a)){
      if (setp(a, env)){
        var x = ref(a, env);
        if (isa("smacref", x)){
          log("Start eval smac", "$1", a);
          var n = apl(stdsmacs[dat(x)], [env]);
          log("Smac transform", "$1 -> $2", a, n);
          return evl(n, log, env);
        }
        log("Found variable", "$1 -> $2", a, x);
        return x;
      }
      err(evl, "Unknown variable $1", a);
    }
    return a;
  }
  
  function evlarr(a, log, env){
    return map(function (a){
      return evl(a, log, env);
    }, a);
  }
  
  // a = ["x", "y"], b = [<cmpl 1>, <cmpl 2>]
  function parenv(a, b, env){
    for (var i = 0; i < a.length; i++){
      put(a[i], b[i], env);
    }
    return env;
  }
  
  ////// Calculator //////
  
  // converts math expr -> a+bi
  function calc(a, log){
    if (udfp(log))log = function (){};
    log("Input", "$1", a);
    a = prs(a, log);
    a = evl(a, log);
    log("Finish evl", "$1", a);
    a = dsp(a);
    log("Finish dsp", "$1", a);
    
    return a;
  }
  
  ////// Types //////
  
  // have env only store objects with a named link to the actual function
  //   so that env is serializable
  
  function fnref(name){
    return mkdat("fnref", name);
  }
  
  function specref(name){
    return mkdat("specref", name);
  }
  
  function smacref(name){
    return mkdat("smacref", name);
  }
  
  // for user-defined fns
  function fn(name, params, code, env){
    return {type: "fn", name: name, params: params, code: code, env: env};
  }
  
  function dsp(a){
    if (typ(a) === "cmpl")return C.tostr(a);
    return $.dsp(a);
  }
  
  setDspFn("fnref", function (a){
    return "<fnref " + dat(a) + ">";
  });
  
  setDspFn('specref', function (a){
    return "<specref " + dat(a) + ">";
  });
  
  setDspFn("fn", function (a){
    if (udfp(a.name))return "<fn>";
    return "<fn " + a.name + ">";
  });
  
  setDspFn('nil', function (){
    return "<nil>";
  });
  
  ////// Variables //////
  
  var glbs = {};
  
  function ref(a, env){
    while (true){
      if (udfp(env))err(ref, "Unknown variable a = $1", a);
      if (!udfp(env[a]))return env[a];
      env = env[0];
    }
  }
  
  function put(a, x, env){
    return env[a] = x;
  }
  
  function set(a, x, env){
    var topenv = env;
    while (true){
      if (udfp(env))return put(a, x, topenv);
      if (!udfp(env[a]))return put(a, x, env);
      env = env[0];
    }
  }
  
  function unset(a, env){
    while (true){
      if (udfp(env))return nil();
      if (!udfp(env[a])){
        var x = env[a];
        delete env[a];
        return x;
      }
      env = env[0];
    }
  }
  
  function def(a, x, env){
    return put(a, x, env);
  }
  
  function undef(a, x, env){
    if (!udfp(env[a])){
      var x = env[a];
      delete env[a];
      return x;
    }
    return nil();
  }
  
  function setp(a, env){
    while (true){
      if (udfp(env))return false;
      if (!udfp(env[a]))return true;
      env = env[0];
    }
  }
  
  ////// Reference Procedure Definitions //////
  
  var stdfns = {};
  var stdspecs = {};
  var stdsmacs = {};
  
  function spec(nm, f){
    stdspecs[nm] = f;
    return set(nm, specref(nm), glbs);
  }
  
  function func(nm, f){
    stdfns[nm] = f;
    return set(nm, fnref(nm), glbs);
  }
  
  function smac(nm, f){
    stdsmacs[nm] = f;
    return set(nm, smacref(nm), glbs);
  }
  
  function chkfn(nm, f){
    return func(nm, proc(f));
  }
  
  spec("if", function (log, env, cond, yes, no){
    var test = evl(cond, log, env);
    if (cmplp(test) && zerop(test))return evl(yes, log, env);
    return evl(no, log, env);
  });
  
  spec("set", function (log, env, name, value){
    if (arrp(name)){
      var fname = name[0];
      if (fname === "lambda")fname = undefined;
      var prms = sli(name, 1);
      var f = fn(fname, prms, value, env);
      return udfp(fname)?f:set(fname, f, env);
    }
    return set(name, evl(value, log, env), env);
  });
  
  spec("unset", function (log, env, name){
    return unset(name, env);
  });
  
  smac("pi", function (env){
    return prs("piFn()");
  });
  
  smac("e", function (env){
    return prs("eFn()");
  });
  
  smac("phi", function (env){
    return prs("phiFn()");
  });
      
  func("progn", function (){
    return $.las_(arguments);
  });
  
  
  chkfn("add", C.add);
  chkfn("sub", C.sub);
  chkfn("mul", C.mul);
  chkfn("div", C.div);
  
  chkfn("rnd", C.rnd);
  chkfn("cei", C.cei);
  chkfn("flr", C.flr);
  chkfn("trn", C.trn);
  
  chkfn("round", C.rnd);
  chkfn("ceil", C.cei);
  chkfn("floor", C.flr);
  chkfn("trunc", C.trn);
  
  chkfn("abs", C.abs);
  chkfn("arg", C.arg);
  chkfn("sgn", C.sgn);
  chkfn("sign", C.sgn);
  chkfn("re", C.re);
  chkfn("Re", C.re);
  chkfn("im", C.im);
  chkfn("Im", C.im);
  chkfn("conj", C.conj);
  
  chkfn("exp", C.exp);
  chkfn("ln", C.ln);
  chkfn("pow", C.pow);
  chkfn("root", C.root);
  chkfn("sqrt", C.sqrt);
  chkfn("cbrt", C.cbrt);
  chkfn("fact", C.fact);
  chkfn("nCr", C.bin);
  chkfn("bin", C.bin);
  chkfn("quo", C.quo);
  chkfn("rem", C.mod);
  chkfn("mod", C.mod);
  chkfn("modPow", C.modPow);
  chkfn("gcd", C.gcd);
  chkfn("agm", C.agm);
  chkfn("rand", C.rand);
  chkfn("sin", C.sin);
  chkfn("cos", C.cos);
  chkfn("sinh", C.sinh);
  chkfn("cosh", C.cosh);
  
  chkfn("atan2", C.atan2);
  
  chkfn("piFn", C.pi);
  chkfn("eFn", C.e);
  chkfn("phiFn", C.phi);
  
  ////// Object exposure //////
  
  var PMath = {
    evl: evl,
    calc: calc,
    glbs: glbs
  };
  
  if (nodep)module.exports = PMath;
  else window.PMath = PMath;
  
  ////// Testing //////
  
  
  
})();
