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
  
  var varp = Parser.varp;
  var prs = Parser.prs;
  
  var proc = Checker.proc;
  
  ////// Evaluator //////
  
  // evaluates lisp array into a number
  function evl(a, log, env){
    if (udfp(env))env = car(envs);
    if (arrp(a)){
      if (setp(a[0], env)){
        var f = ref(a[0], env);
        switch (typ(f)){
        case "spec":
          log("Start evl spec", "$1", a);
          var r = apl(dat(f), arrd(log, env, sli(a, 1)));
          log("Finish evl spec", "$1 -> $2", a, r);
          return r;
        case "fn":
          log("Start evl fn", "$1", a);
          var r = apl(dat(f), evlarr(sli(a, 1), log, env));
          log("Finish evl fn", "$1 -> $2", a, r);
          return r;
        default:
          err(evl, "Unknown type $1", typ(f));
        }
      }
      err(evl, "Unknown function $1", a[0]);
    }
    if (varp(a)){
      if (setp(a, env)){
        var x = ref(a, env);
        if (isa("smac", x)){
          log("Start eval smac", "$1", a);
          var n = apl(dat(x), [env]);
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
  
  function dsp(a){
    var t = typ(a);
    switch (t){
      case "cmpl": return C.tostr(a);
      case "fn": return "<fn>";
      case "spec": return "<spec>";
      case "nil": return "<nil>";
    }
    err(dsp, "Unknown type $1", t);
  }
  
  function fn(f){
    return mkdat("fn", f);
  }
  
  function sp(f){
    return mkdat("spec", f);
  }
  
  function sm(f){
    return mkdat("smac", f);
  }
  
  setDspFn("fn", function (){
    return "<fn>";
  });
  
  setDspFn('spec', function (){
    return "<spec>";
  });
  
  setDspFn('nil', function (){
    return "<nil>";
  });
  
  ////// Variables //////
  
  var glbs = {};
  
  var envs = lis(glbs);
  function ref(a, env){
    if (udfp(env))env = car(envs);
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
    if (udfp(env))env = car(envs);
    var topenv = env;
    while (true){
      if (udfp(env))return put(a, x, topenv);
      if (!udfp(env[a]))return put(a, x, env);
      env = env[0];
    }
  }
  
  function unset(a, env){
    if (udfp(env))env = car(envs);
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
    if (udfp(env))env = car(envs);
    return put(a, x, env);
  }
  
  function undef(a, x, env){
    if (udfp(env))env = car(envs);
    if (!udfp(env[a])){
      var x = env[a];
      delete env[a];
      return x;
    }
    return nil();
  }
  
  function setp(a, env){
    if (udfp(env))env = car(envs);
    while (true){
      if (udfp(env))return false;
      if (!udfp(env[a]))return true;
      env = env[0];
    }
  }
  
  function spec(nm, f){
    return set(nm, sp(f));
  }
  
  function func(nm, f){
    return set(nm, fn(f));
  }
  
  function smac(nm, f){
    return set(nm, sm(f));
  }
  
  function chkfn(nm, f){
    return func(nm, proc(f));
  }
  
  spec("set", function (log, env, name, value){
    if (arrp(name)){
      var fname = name[0];
      var prms = sli(name, 1);
      return def(fname, fn(function (){
        return evl(value, log, parenv(prms, arguments, {0: env}));
      }), env);
    }
    return def(name, evl(value, log, env), env);
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
    calc: calc
  };
  
  if (nodep)module.exports = PMath;
  else window.PMath = PMath;
  
  ////// Testing //////
  
  
  
})();
