# Math Executing Library

This library makes it easy to calculate math expressions such as "343*(34i-45)^3i". It works in both web js and Node.js

## How to use in HTML

1. Go to https://github.com/xinxinw1/tools/releases and download the latest release.
2. Go to https://github.com/xinxinw1/prec-math/releases and download the latest release.
3. Go to https://github.com/xinxinw1/cmpl-math/releases and download the latest release.
4. Go to https://github.com/xinxinw1/math-check/releases and download the latest release.
5. Go to https://github.com/xinxinw1/math-parse/releases and download the latest release.
6. Go to https://github.com/xinxinw1/math-exec/releases and download the latest release.
7. Extract `tools.js`, `prec-math.js`, `cmpl-math.js`, `math-check.js`, `math-parse.js`, and `math-exec.js` into your project directory.
8. Add
   
   ```html
   <script src="tools.js"></script>
   <script src="prec-math.js"></script>
   <script src="cmpl-math.js"></script>
   <script src="math-check.js"></script>
   <script src="math-parse.js"></script>
   <script src="math-exec.js"></script>
   ```
   
   to your html file.
9. Run `$.al(PMath.calc("-(53*3-2/(4i))+((34+53i)/(23-34i))*(-i)"))` to make sure it works.  
   (Should output `-157.5905044510385757+0.1053412462908012i`)

See http://xinxinw1.github.io/math-exec/ for a demo.

## How to use in Node.js

1. Go to https://github.com/xinxinw1/tools/releases and download the latest release.
2. Go to https://github.com/xinxinw1/prec-math/releases and download the latest release.
3. Go to https://github.com/xinxinw1/cmpl-math/releases and download the latest release.
4. Go to https://github.com/xinxinw1/math-check/releases and download the latest release.
5. Go to https://github.com/xinxinw1/math-parse/releases and download the latest release.
6. Extract `tools.js`, `prec-math.js`, `cmpl-math.js`, `math-check.js`, and `math-parse.js` into your project directory.
7. Run `$ = require("./tools.js")` in node.
8. Run `R = require("./prec-math.js")` in node.
9. Run `C = require("./cmpl-math.js")` in node.
10. Run `Checker = require("./math-check.js")` in node.
11. Run `Parser = require("./math-parse.js")` in node.
12. Run `PMath = require("./math-exec.js")` in node.
13. Run `$.prn(PMath.calc("-(53*3-2/(4i))+((34+53i)/(23-34i))*(-i)"))` to make sure it works.  
    (Should output `-157.5905044510385757+0.1053412462908012i` and return `undefined`)

## Function reference

```
Note: These are all accessed by PMath.<insert name>

### Evaluator

vars(a)           process all setting and unsetting of variables in the
                    lisp-like array; should be run before evl(a)
evl(a)            evaluate the lisp-array by dispatching to math functions
calc(a)           takes a math expression string (ex. "x = 35*43i/86") as input
                    and sends that through Parser.prs, vars, evl, and C.dsp
                    and returns a new math expression string (ex. "17.5i")

### Logging

logfn(f)          add a logging callback; takes a function(subj, data);
                    use this to get the intermediate results from calc(a)
rlogfn(f)         remove a logging callback
```
