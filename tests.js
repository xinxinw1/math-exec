QUnit.test('Executor', function (assert){
  assert.same(PMath.calc("-(53*3-2/(4i))+((34+53i)/(23-34i))*(-i)"), "-157.5905044510385757+0.1053412462908012i");
  assert.same(PMath.calc("exp(i*pi)"), "-1");
  assert.same(PMath.calc("sqrt(-1)"), "i");
  assert.same(PMath.calc("1000!"), "402387260077093773543702433923003985719374864210714632543799910429938512398629020592044208486969404800479988610197196058631666872994808558901323829669944590997424504087073759918823627727188732519779505950995276120874975462497043601418278094646496291056393887437886487337119181045825783647849977012476632889835955735432513185323958463075557409114262417474349347553428646576611667797396668820291207379143853719588249808126867838374559731746136085379534524221586593201928090878297308431392844403281231558611036976801357304216168747609675871348312025478589320767169132448426236131412508780208000261683151027341827977704784635868170164365024153691398281264810213092761244896359928705114964975419909342221566832572080821333186116811553615836546984046708975602900950537616475847728421889679646244945160765353408198901385442487984959953319101723355556602139450399736280750137837615307127761926849034352625200015888535147331611702103968175921510907788019393178114194545257223865541461062892187960223838971476088506276862967146674697562911234082439208160153780889893964518263243671616762179168909779911903754031274622289988005195444414282012187361745992642956581746628302955570299024324153181617210465832036786906117260158783520751516284225540265170483304226143974286933061690897968482590125458327168226458066526769958652682272807075781391858178889652208164348344825993266043367660176999612831860788386150279465955131156552036093988180612138558600301435694527224206344631797460594682573103790084024432438465657245014402821885252470935190620929023136493273497565513958720559654228749774011413346962715422845862377387538230483865688976461927383814900140767310446640259899490222221765904339901886018566526485061799702356193897017860040811889729918311021171229845901641921068884387121855646124960798722908519296819372388642614839657382291123125024186649353143970137428531926649875337218940694281434118520158014123344828015051399694290153483077644569099073152433278288269864602789864321139083506217095002597389863554277196742822248757586765752344220207573630569498825087968928162753848863396909959826280956121450994871701244516461260379029309120889086942028510640182154399457156805941872748998094254742173582401063677404595741785160829230135358081840096996372524230560855903700624271243416909004153690105933983835777939410970027753472000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
  assert.same(PMath.calc("2^1000"), "10715086071862673209484250490600018105614048117055336074437503883703510511249361224931983788156958581275946729175531468251871452856923140435984577574698574803934567774824230985421074605062371141877954182153046474983581941267398767559165543946077062914571196477686542167660429831652624386837205668069376");
  assert.same(PMath.calc("2^3^4"), "2417851639229258349412352");
  assert.same(PMath.calc("-i^2"), "1");
  assert.same(PMath.calc("i^-1"), "-i");
  assert.same(PMath.calc("-i^2"), "1");
  assert.same(PMath.calc("i^-1"), "-i");
  assert.same(PMath.calc("2i^2"), "-2");
  assert.same(PMath.calc("2^2i"), "4i");
  assert.same(PMath.calc("1/2^2"), "0.25");
  assert.same(PMath.calc("1/2i"), "0.5i");
  assert.same(PMath.calc("1/2/2"), "0.25");
  assert.same(PMath.calc("1/2*2/4"), "0.25");
  assert.same(PMath.calc("3!/2"), "3");
  assert.same(PMath.calc("3!/-2"), "-3");
  assert.same(PMath.calc("x=3, x"), "3");
  assert.same(PMath.calc("x=3, 2x^2"), "18");
  assert.same(PMath.calc("2sqrt(2)"), "2.82842712474619");
  assert.same(PMath.calc("sqrt(2, 300)"), "1.41421356237309504880168872420969807856967187537694807317667973799073247846210703885038753432764157273501384623091229702492483605585073721264412149709993583141322266592750559275579995050115278206057147010955997160597027453459686201472851741864088919860955232923048430871432145083976260362799525140799");
  assert.same(PMath.calc("piFn(300)"), "3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141274");
  assert.same(PMath.calc("phiFn(300)"), "1.618033988749894848204586834365638117720309179805762862135448622705260462818902449707207204189391137484754088075386891752126633862223536931793180060766726354433389086595939582905638322661319928290267880675208766892501711696207032221043216269548626296313614438149758701220340805887954454749246185695365");
  assert.same(PMath.calc("ln(2, 300)"), "0.69314718055994530941723212145817656807550013436025525412068000949339362196969471560586332699641868754200148102057068573368552023575813055703267075163507596193072757082837143519030703862389167347112335011536449795523912047517268157493206515552473413952588295045300709532636664265410423915781495204374");
  assert.same(PMath.calc("cbrt(-1)"), "-1");
  assert.same(PMath.calc("(-1)^div(1, 3, 20)"), "0.5+0.8660254037844386i");
  assert.same(PMath.calc("sqrt(i)"), "0.7071067811865475+0.7071067811865475i");
  
  assert.same(PMath.calc("f(x)=x^2+2x+1, f(3)"), "16");
  assert.throws(function (){
    PMath.calc("g(x)=(r=3, x*r), g(2), r");
  }, "16");
});