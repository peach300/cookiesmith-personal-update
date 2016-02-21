var Cookiesmith = (function($g,$app){
  if(Cookiesmith!==undefined){
    console.log('cookiesmith: reload');
    Cookiesmith.Util.popup('reload');
    Cookiesmith.remove();
  }
  var $o = $g.ObjectsById;
  var $O = $g.Objects;
  var $u = $g.UpgradesById;
  var $U = $g.Upgrades;

  $app.opt = { popup:true, clickPs:20, clicker:true, goldHunter:true, buyer:true, debug:false, };

  /*
  * Utility
  */
  var Util = $app.Util = {};
  Util.maxBy = function(objs,f){
    var maxobj,maxvalue;
    for(var i=0;i<objs.length;i++){
      var val = f===undefined ? objs[i] : f(objs[i]);
      if (maxvalue===undefined || maxvalue < val){
        maxobj = objs[i];
        maxvalue = val;
      }
    }
    return maxobj;
  };
  Util.minBy = function(objs,f){
    var minobj,minvalue;
    for(var i=0;i<objs.length;i++){
      var val = f===undefined ? objs[i] : f(objs[i]);
      if(minvalue===undefined || minvalue > val){
        minobj = objs[i];
        minvalue = val;
      }
    }
    return minobj;
  };
  Util.sumBy = function(objs,f){
    var sum = 0;
    for(var i=0;i<objs.length;i++){
      var val = f===undefined ? objs[i] : f(objs[i]);
      if (val!==undefined) sum += val;
    }
    return sum;
  };
  Util.map = function(objs,f){
    var ret = new Array(objs.length);
    for(var i=0;i<objs.length;i++)
      ret[i] = f(objs[i]);
    return ret;
  };
  Util.forEach = function(objs,f){
    for(var i=0;i<objs.length;i++)
      f(objs[i]);
  };
  Util.median = function(values,f){
    var list = values.sort(f);
    if(list.length%2===0){
      return (list[list.length/2-1]+list[list.length/2])/2;
    } else {
      return list[Math.floor(list.length/2)];
    }
  };

  Util.gameTime = function(date){
    return (date||new Date()).getTime()-$g.startDate;
  };
  Util.pad0 = function(value,digit){
    if( Math.log(value)/Math.log(10) < digit ){
      var base = '0';
      for(var i=2;i<digit;i++) base+='0';
        return (base+value).slice(-digit);
    } else {
      return Math.round(value).toString();
    }
  };
  Util.round = function(value,digit){
    if(digit===undefined) digit = 1;
    return (Math.round(value*Math.pow(10,digit))/Math.pow(10,digit));
  }
  Util.formatDate = function(date){
    var year = date.getYear()+1900;
    var day = Util.pad0(date.getDate(),2);
    var month = Util.pad0(date.getMonth()+1,2);
    var hour = Util.pad0(date.getHours(),2);
    var minute = Util.pad0(date.getMinutes(),2);
    var second = Util.pad0(date.getSeconds(),2);
    return year+'/'+month+'/'+day+' '+hour+':'+minute+':'+second;
  };
  Util.log = function(message){
    var date = new Date();
    var gameTime = Util.pad0(Math.round(Util.gameTime(date)/1000),6);
    var formatDate = Util.formatDate(date);
    console.log('['+formatDate+' '+gameTime+'] '+message);
  };
  Util.debug = function(){
    if($app.opt.debug) console.debug.apply(console,arguments);
  };
  Util.popup = function(message){
    if($app.opt.popup)
      $g.Popup('[Csmith] '+message);
  };
  Util.ordNum = function(num){
    switch(num){
      case 1: return 'first';
      case 2: return 'second';
      case 3: return 'third';
      default:
      switch(num%100){
        case 11: 
        case 12: 
        case 13: return num+'th';
        default:
        switch(num%10){
          case 1: return num+'st';
          case 2: return num+'nd';
          case 3: return num+'rd';
          default: return num+'th';
        }
      }
    }
  };
  Util.delay = function(price,cps){
    return price>0 ? price/cps : 0;
  };
  Util.realDelay = function(price,cps,clickCps){
    if(price<=0) return 0;
    var delay = 0;
    if($g.frenzy>0||$g.clickFrenzy>0){
      var frenzyTime,frenzyCps,total;
      if($g.frenzy>0){
        frenzyTime = $g.frenzy/Timer.fps;
        frenzyCps = cps*$g.frenzyPower;
        total = frenzyCps*frenzyTime;
      } else if($g.clickFrenzy>0){
        frenzyTime = $g.clickFrenzy/Timer.fps;
        frenzyCps = (cps-clickCps)+clickCps*777;
        total = frenzyCps*frenzyTime;
      }
      if(price > total){
        delay += frenzyTime;
        price -= total;
      }else{
        delay = price/frenzyCps;
        price = 0;
      }
    }
    return delay+price/cps;
  };
  Util.merge = function(){
    var base = arguments[0];
    for(var i=1; i<arguments.length; i++){
      for(var k in arguments[i]){
        base[k] = arguments[i][k];
      }
    }
    return base;
  };
  Util.beautifyTime = function(sec){
    var d = Math.floor(sec/86400);
    var h = Math.floor((sec%86400)/3600);
    var m = Math.floor((sec%3600)/60);
    var s = Math.floor(sec%60);
    var str = '';
    if(d!==0) str+=d+'d ';
    if(h!==0||str!==''){
      if(str!=='') str+=Util.pad0(h,2);
      else str+=h;
    }
    if(str!=='') str+=':'+Util.pad0(m,2)
      else str+=m;
    str += ':'+Util.pad0(s,2);
    return str;
  };
  Util.smooth = function(last,current,rate,th){
    if(th===undefined) th=1.0-rate;
    if( last===undefined || Math.abs(last-current)>last*th ) return current;
    return last*rate + current*(1.0-rate);
  };
  Util.unBeautify = function(str){
    return parseFloat(str.replace(/,/g,''));
  };

/*
* Interceptor
*/
var Interceptor = $app.Interceptor = {};
Interceptor.orig = {};
Interceptor.hook = {};
Interceptor.hook.Loop = function(){
  Interceptor.orig.Loop.apply($g);
  window.setTimeout(function(){
    for(var k in Interceptor.loopHook){
      Interceptor.loopHook[k]();
    }
  },0);
};
Interceptor.hook.confirm = function(){
  var res = undefined;
  for(var k in Interceptor.confirmHook){
    var res0 = Interceptor.confirmHook[k].apply(window,arguments);
    if(res0!==undefined){
      res = res0;
    }
  }
  if(res!==undefined){
    return res;
  } else {
    return Interceptor.orig.confirm.apply(window,arguments);
  }
};

Interceptor.set = function(){
  if(this.orig.Loop===undefined){
    this.orig.Loop = $g.Loop;
    $g.Loop = this.hook.Loop;
  }
};
Interceptor.remove = function(){
  if(this.orig.Loop!==undefined) {
    $g.Loop = this.orig.Loop;
  }
};
Interceptor.loopHook = {};
Interceptor.confirmHook = {};

  /*
  * Clicker
  */
  var Clicker = $app.Clicker = {};
  Clicker.start = function(interval){
    if(this.running) this.stop();
    if(interval===undefined) interval = 38;
    this.idClick = window.setInterval($g.ClickCookie,interval);
    this.running = true;
  };
  Clicker.stop = function(){
    if(!this.running) return;
    window.clearInterval(this.idClick);
    this.running = false;
  };

  /*
  * Timer
  */
  var Timer = $app.Timer = {};
  Timer.set = function(){
    if(this.running) return;
    this.last = this.getStatus();
    this.idTimer = window.setInterval(this.Measure,1000);
    this.fps = $g.fps;
    this.running = true;
  };
  Timer.getStatus = function(){
    return {
      T: $g.T,
      time: (new Date()).getTime(),
      clicks: $g.cookieClicks,
    }
  };
  Timer.Measure = function(){
    var self = Timer;
    var stat = self.getStatus();
    var last = self.last;
    var interval = stat.time-last.time;

    if( stat.T<=last.T || stat.clicks<=last.clicks ){
      self.last = stat;
      return;
    }

    var clicksPs = (stat.clicks-last.clicks)/interval*1000;
    clicksPs = Util.smooth( last.clicksPs, clicksPs, 0.8, 0.3 );
    self.clicksPs = stat.clicksPs = clicksPs;

    var fps = (stat.T-last.T)/interval*1000;
    fps = Util.smooth( last.fps, fps, 0.5, 0.1 );
    self.fps = stat.fps = fps;

    self.last = stat;
  };
  Timer.remove = function(){
    if(!this.running) return;
    window.clearInterval(this.idTimer);
    this.clicksPs = undefined;
    this.fps = undefined;
    this.running = false;
  };

  /*
  * GoldHunter
  */
  var GoldHunter = $app.GoldHunter = {};
  GoldHunter.hunt = function(){
    var self = GoldHunter;
    if(self.sleep>0 && self.sleep-- > 0) return;
    if( $g.goldenCookie.time===0 && $g.goldenCookie.life<$g.fps*($g.goldenCookie.dur-3) && $g.goldenCookie.wrath!==1 ){
      self.sleep = 2;
      $g.goldenCookie.click();
      Util.log('got the '+Util.ordNum($g.goldenClicks)+' Golden Cookie!');
      Util.popup('got the '+Util.ordNum($g.goldenClicks)+' Golden Cookie!');
    }
  };
  GoldHunter.start = function(){
    if(this.running) return;
    this.running = true;
    this.sleep = 0;
    Interceptor.loopHook.gh = this.hunt;
  };
  GoldHunter.stop = function(){
    if(!this.running) return;
    this.running = false;
    delete Interceptor.loopHook.gh;
  };

  /*
  * Basic Buyer
  */
  var BasicBuyer = $app.BasicBuyer = function(){};
  BasicBuyer.prototype.init = function(){
    this.interval = 1000;
    this.nextTime = 0;
    this.interceptorKey = 'basicBuyer';
    this.last = {};
    this.saveStatus();
    this.context = {
      buyer: this,
    };
    this.param = {};
    this.processing = false;
  }
  BasicBuyer.prototype.saveStatus = function(){
    this.last.T = $g.T;
    this.last.time = $g.time;
    this.last.cookieClicks = $g.cookieClicks;
  };
  BasicBuyer.prototype.loop = function(){
    if($g.time < this.nextTime || this.processing ) return;
    this.processing = true;

    var itv = $g.time-this.last.time;

    if(Timer.running && Timer.clicksPs!==undefined){
      var clicksPs = Timer.clicksPs;
    } else {
      var itv = $g.time-this.last.time;
      var clicksPs = itv===0 ? 0 : ($g.cookieClicks-this.last.cookieClicks) / (itv/1000);
      clicksPs = Util.smooth( this.context.clicksPs, clicksPs, 0.8 );
    }
    var clickCps = $g.computedMouseCps * clicksPs;
    this.context.clicksPs = clicksPs;
    this.context.clickCps = clickCps;
    this.context.realCps = $g.cookiesPs + clickCps;

    this.action();

    if (this.last.time+this.interval < $g.time){
      this.saveStatus();
    }
    if(this.nextTime <= $g.time){
      this.nextTime = $g.time + this.interval;
    }
    this.processing = false;
  };
  BasicBuyer.prototype.start = function(){
    if(this.running) return;
    this.running = true;
    this.init();
    this.nextTime = $g.time + this.interval;
    var self = this;
    Interceptor.loopHook[this.interceptorKey] = function(){self.loop()};
    Util.log('buyer started');
  };
  BasicBuyer.prototype.stop = function(){
    if(!this.running) return;
    if(Interceptor.loopHook[this.interceptorKey]===undefined) return;
    delete Interceptor.loopHook[this.interceptorKey];
    this.running = false;
    Util.log('buyer stopped');
  };
  BasicBuyer.prototype.action = function(){
    this.nextTime = $g.time + this.interval;
  };

  /*
  * Simple Buyer extends Basic Buyer
  */
  var SimpleBuyer = $app.SimpleBuyer = function(){};
  SimpleBuyer.prototype = Object.create(BasicBuyer.prototype);
  SimpleBuyer.prototype.constructor = SimpleBuyer();
  SimpleBuyer.prototype.init = function(){
    BasicBuyer.prototype.init.apply(this); // super()
    this.interval = 1000;
    this.stgs = {
      cpcpsExp: {
        init: function(ctx){},
        prepare: function(ctx){
          this.denom = 120;
          if(4000<=ctx.estCps)
            this.denom = 300;            
        },
        cost: function(ctx,price,cps,delay){
          var delay = price / ctx.estCps;
          return price/cps * Math.pow(2,delay/this.denom);
        },
      },
      cpcpsLinear: {
        init: function(ctx){},
        prepare: function(ctx){
          this.denom = 60;
        },
        cost: function(ctx,price,cps,delay){
          var delay = price/ctx.estCps;
          return price/cps * (3+delay/this.denom);
        },
      },
      cpcpsMultipass: {
        init: function(ctx){},
        prepare: function(ctx){},
        cost: function(ctx,price,cps,delay){
          var delay = price/ctx.estCps;
          return price/cps * (3+delay/60);
        },
        getPrice: function(obj){
          return obj.price||obj.basePrice||0;
        },
        select: function(ctx){
          for(var i=0;i<ctx.scores.length;i++){
            ctx.scores[i].costs =  ctx.scores[i].costs || ctx.buyer.costFor(ctx.scores[i].obj.name,ctx);
          }

          var self = this;
          var cps = ctx.baseCps;
          var mcps = ctx.baseClickCps;

          var delays = Util.map(ctx.scores,function(s){return Util.realDelay(self.getPrice(s.obj),cps,mcps) });
          var delayMedian = Util.median(delays,function(a,b){return a===b?0:a>b?1:-1;});

          var delayLimit = Math.max(60*60,delayMedian*2);
          var target = Util.maxBy(ctx.scores,function(s){var delay=Util.realDelay(self.getPrice(s.obj),cps,mcps);return delay>delayLimit ? -Infinity : s.s });

          var c = target.costs = target.costs || ctx.buyer.costFor(target.obj.name,ctx);
          Util.debug('first target: '+target.obj.name+' / '+c.cps);
          return this.pass(ctx,target,0)
        },
        pass: function(ctx,target,level){
          if(level>10) return target;
          var maxDelay = this.getPrice(target.obj)/ctx.estCps;
          var c = target.costs = target.costs || ctx.buyer.costFor(target.obj.name,ctx);
          if(!c.cps>0) return target;
          var selected = [ { cps:c.cps, target:target }, ];
          for(var i=0;i<ctx.scores.length;i++){
            var sc = ctx.scores[i];
            var price = this.getPrice(sc.obj);
            var delay = price/ctx.estCps;
            if(delay<maxDelay){
              var c = sc.costs = sc.costs || ctx.buyer.costFor(sc.obj.name,ctx);
              var dcps = c.cps;
              if(dcps===0) continue;
              var t = 0;
              var cps = ctx.baseCps;
              var n = 0;
              while(t<maxDelay){
                var delay = price/cps;
                var delay2 = Math.min(t+delay,maxDelay)-t;
                cps += dcps * (delay2/delay);
                t+=delay;
                n+= delay/delay2;
              }
              if(level>0)
                Util.debug(Util.ordNum(level+2)+' pass: '+sc.obj.name+' / '+(cps-ctx.baseCps)+' ['+Util.round(n,2)+']');
              selected.push({cps:cps-ctx.baseCps,target:sc});
            }
          }
          var select = Util.maxBy(selected,function(sel){return sel.cps});
          var target2 = select.target;
          if(target2!==target)
            Util.debug(Util.ordNum(level+2)+' target: '+target2.obj.name+' / '+select.cps);
          if(target2===target) return target2;
          return this.pass(ctx,target2,level+1);
        }
      },
    };

    this.param = Util.merge(this.param,{
      costDenom: $app.opt.costDenom || 60,
      upgradeDefaultThreshold: $app.opt.upgradeDefaultTime || 60,
    });

    this.context = Util.merge(this.context,{
      buyer: this,
      param: this.param,
      stg : $app.opt.strategy || this.stgs.cpcpsMultipass,
    });

    if(this.context.stg.init) this.context.stg.init(this.context);
    this.action = this.choose;
  }
  SimpleBuyer.prototype.buy = function(){
    if(this.context===undefined || this.context.target===undefined) return;
    if(this.context.lastStat !== this.context.status(this.context)){
      Util.log('Status changed. recalculate.');
      Util.popup('Status changed. recalculate.');
      return this.choose();
    }

    if(this.context.target.type==='obj'){
      var obj = this.context.target.obj;
      if(obj.price > $g.cookies) return;
      var price = obj.price;

      obj.buy();
      Util.log('bought '+(obj.bought===1? 'the first ' : 'a ')+obj.name+' at '+Beautify(price) );
      Util.popup('bought '+(obj.bought===1? 'the first ' : 'a ')+obj.name);

    } else if (this.context.target.type==='ug') {
      var ug = this.context.target.obj;
      if(ug.basePrice > $g.cookies) return;
      ug.buy();
      Util.log('bought '+ug.name+' at '+Beautify(ug.basePrice) );
      Util.popup('bought '+ug.name );

    }
    this.nextTime += this.interval/10;
    this.action = this.choose;
  };

  SimpleBuyer.prototype.stabilize = function(ctx){
    var baseCps = $g.cookiesPs;
    var baseClickCps = ctx.clickCps;
    if($g.frenzy>0) {
      baseCps /= $g.frenzyPower;
      baseClickCps /= $g.frenzyPower;
    }
    if($g.clickFrenzy>0) baseClickCps /= 777;
    baseCps += baseClickCps;
    ctx.baseCps = baseCps;
    ctx.baseClickCps = baseClickCps;

    // estimate golden cookies effect
    var m = 5+9/2;
    var cookies = Math.max(ctx.baseCps*60,$g.cookies);
    if ($g.Has('Lucky day')) m/=2;
    if ($g.Has('Serendipity')) m/=2;
    var gcInterval = Math.ceil(Timer.fps*60*m);
    var gcDist = {frenzy:0.4863403449935448, multiply:0.4863403449935448, chain:0.004544942361020921, click:0.02277436765188959};
    var lucky = $g.Has('Get lucky')+1;
    var gcGain=0;
    // frenzy gain
    gcGain += 77*lucky * ctx.baseCps * gcDist.frenzy;
    // multiply
    gcGain += (Math.min(cookies*0.1,(ctx.baseCps-ctx.baseClickCps)*60*20)+13) * gcDist.multiply;
    // chain
    var chGain=0, p=1.0, e=0, et=0;
    for(var i=1;i<=13;i++){
      e = e*10+6;
      chGain += e * p;
      if(i>4){
        if(cookies+et<=e) break;
        p *= 0.9;
        et += e;
      }
    }
    gcGain += chGain * gcDist.chain;
    // click
    var gcClickGain = 777*lucky * ctx.baseClickCps * gcDist.click;

    ctx.estGcCps = (gcGain+gcClickGain)/gcInterval;
    ctx.estGcClickCps = gcClickGain/gcInterval;
    ctx.estCps = ctx.baseCps + ctx.estGcCps;
    ctx.estClickCps = ctx.baseClickCps + gcClickGain/gcInterval;
  };

  SimpleBuyer.prototype.choose = function(){
    var context = Object.create(this.context);
    
    if($g.cookiesPs<0.1){
      context.target = {
        type: 'obj',
        obj: $o[0],
        s: 0,
      };
    } else {
      context.scores = [];
      this.stabilize(context);
      //this.calcCpsPs(this.context);
      if(this.context.stg.prepare) this.context.stg.prepare(this.context);
      this.calcScoresForUpgrade(context);
      this.calcScoresForObjects(context);

      if(this.context.stg.select){
        context.target = context.stg.select(context);
      }else{
        context.target = Util.maxBy( context.scores, function(s){return s.s} );
      }
    }

    context.status = this.status;
    context.lastStat = this.status(this.context);
    
    Util.merge(this.context,context);
    this.action = this.buy;

    var estCps = this.context.estCps || this.context.realCps;
    var target = context.target;
    if(target.type==='obj'){
      var delay = Math.round( Util.realDelay( target.obj.price-$g.cookies, this.context.baseCps, this.context.baseClickCps ) );
      if(delay===0){
        return this.buy();
      } else {
        Util.log('plan to buy '+(target.obj.bought===0? 'the first ' : 'a ')+target.obj.name+' at '+Beautify(target.obj.price)+' after '+delay+' seconds' );
        Util.popup('Next: '+target.obj.name+' ('+delay+' sec.)');
      }

    } else if (target.type==='ug'){
      var delay = Math.round( Util.realDelay( target.obj.basePrice-$g.cookies, this.context.baseCps, this.context.baseClickCps ) );
      if(delay===0){
        return this.buy();
      } else {
        Util.log('plan to buy the '+target.obj.name+' at '+Beautify(target.obj.basePrice)+' after '+delay+' seconds' );
        Util.popup('Next: '+target.obj.name+' ('+delay+' sec.)' );
      }
    }

  };
  SimpleBuyer.prototype.calcCpsPs = function(context){
    var cpss = [];
    for(var i=0;i<$o.length;i++){
      cpss.push( $o[i].storedCps / ($o[i].price/context.estCps) );
    }
    for(var i=0;i<$u.length;i++){
      var ug = $u[i];
      if(ug.bought===1 || ug.unlocked===0 ) continue;
      var policy = this.getPolicyForUpgrade(ug.name);
      if (policy.p==='cps') {
        cpss.push( policy.cps(context,ug) / (ug.basePrice/context.estCps) );
      }
    }
    context.cpsPs = Util.sumBy(cpss)/cpss.length;
    return context;
  };
  SimpleBuyer.prototype.calcScoresForObjects = function(context){
    var scores = context.scores = context.scores || [];
    for(var i=0;i<$o.length;i++){
      var obj = $o[i];
      var cpcps = obj.price / obj.storedCps;
      var delay = Util.delay(obj.price,this.context.estCps);
      var cost = context.stg.cost(context,obj.price,obj.storedCps,delay);
      if(cost!==undefined)
        scores.push( { type:'obj', s: -cost, obj: obj, } );
    }
    return context;
  };
  SimpleBuyer.prototype.calcScoresForUpgrade = function(context){
    var scores = context.scores = context.scores || [];
    for(var i=0;i<$u.length;i++){
      var ug = $u[i];
      if(ug.bought===1 || ug.unlocked===0 ) continue;

      var policy = this.getPolicyForUpgrade(ug.name);

      switch(policy.p){
        case 'cps':
        var cps = policy.cps(context,ug);
        var cpcps = ug.basePrice / cps;
        var delay = Util.delay(ug.basePrice,context.estCps);
        if( ug.basePrice/context.estCps < 5 ){
          var cost = -Infinity;
        } else {
          var cost = context.stg.cost(context,ug.basePrice,cps,delay);
        }
        scores.push({type:'ug', s: -cost , obj: ug,});
        break;

        case 'delay':
        if( Util.delay(ug.basePrice-$g.cookies,this.context.estCps) <= policy.delay(context,ug) ){
          scores.push({type:'ug', s: Infinity, obj:ug, });
        }
        break;

        case 'ignore':
        default:
      }
    }
    return context;
  };
  SimpleBuyer.prototype.getPolicyForUpgrade = function(name){
    return this.ugPolicyTable[name] || this.ugPolicyTable.Guess(name);
  };
  SimpleBuyer.prototype.ugPolicyTable = (function(){
    function getCookiesMult(){
      var mult = 1;
      for(var i in $U){
        var me = $U[i];
        if(me.type==='cookie' && $g.Has(me.name)){
          console.log(i);
          mult += me.power*0.01;
        }
      }
      return mult;
    }
    var cookiesMultUpdateTime = 0;
    var cookiesMult = 1;
    function gainGlobalCpsMult(rate){
      return cpsPolicy(function(ctx,ug){
        if(cookiesMultUpdateTime < $g.time){
          cookiesMult = getCookiesMult();
          cookiesMultUpdateTime = $g.time;
        }
        var mult = $g.globalCpsMult;
        if($g.frenzy>0) mult /= $g.frenzyPower;
        var kittenMult = mult/cookiesMult;
        return (ctx.estCps-ctx.estClickCps)/$g.globalCpsMult*rate*kittenMult;
      });
    }
    function gainBase(objName,base){
      var obj = $O[objName];
      return cpsPolicy(function(ctx,ug){
        return base * obj.amount;
      });
    }
    function gainRate(objName,rate){
      var obj = $O[objName];
      return cpsPolicy(function(ctx,ug){
        return obj.storedCps * obj.amount * (rate-1);
      });
    };
    function twice(objName){
      return gainRate(objName,2);
    }
    function gainMouseAndCursorBase(mouseBase,cursorBase){
      return cpsPolicy(function(ctx,ug){
        return (mouseBase * ctx.clicksPs) + (cursorBase * $O['Cursor'].amount);
      });
    }
    function twiceMouseAndCursor(){
      return cpsPolicy(function(ctx,ug){
        return $O['Cursor'].storedCps + ctx.estClickCps;
      });
    }
    function gainMouseAndCursorByNonCursor(base){
      return cpsPolicy(function(ctx,ug){
        var amount = 0;
        for(var i=0;i<$o.length;i++){
          if($o[i].name!=='Cursor')
            amount += $o[i].amount;
        }
        return base*amount*($O['Cursor'].amount+ctx.clicksPs);
      });
    }
    function gainClickByCps(rate){
      return cpsPolicy(function(ctx,ug){
        return ctx.estCps * rate * ctx.clicksPs;
      });
    }
    function kitten(rate){
      return cpsPolicy(function(ctx,ug){
        return ctx.estCps * ($g.milkProgress*rate);
      });
    }
    var LuckyTwiceFreq = cpsPolicy(function(ctx,ug){
      return ctx.estGcCps;
    });
    var LuckyTwiceLast = cpsPolicy(function(ctx,ug){
      return ctx.estGcCps-ctx.estGcClickCps;
    })
    var Default = delayPolicy(function(ctx,ug){
      return ctx.param.upgradeDefaultThreshold;
    });
    function cpsPolicy(f){
      return { p:'cps', cps:f };
    }
    function delayPolicy(f){
      return { p:'delay', delay:f };
    }

    var cacheGuessed = {};
    var plurals = {};
    for(var i=0;i<$o.length;i++)
      plurals[$o[i].plural] = $o[i];
    function Guess(name){
      if(cacheGuessed[name]!==undefined) return cacheGuessed[name];
      var cache = cacheGuessed;
      var ug = $U[name];
      if(ug===undefined) return;
      var desc = ug.desc.toLowerCase().replace(/<\/?[a-z]+>/g,' ').replace(/\s+/g,' ');
      var md;
      if(md=desc.match(/^the mouse and cursors gain (another )?\+([\d,\.]+) cookies/)){
        Util.debug('guessed '+name+' -> cookies gain +'+md[2]);
        return cache[name] = gainMouseAndCursorByNonCursor(Util.unBeautify(md[2]));
      }
      if(md=desc.match(/^the mouse and cursors are twice as efficient/)){
        Util.debug('guessed '+name+' -> twice mouse and cursors');
        return cache[name] = twiceMouseAndCursor();
      }
      if(md=desc.match(/^clicking gains \+([\d]+)% of your cps/)){
        Util.debug('guessed '+name+' -> click gain +'+md[1]+'%');
        return cache[name]=gainClickByCps(Util.unBeautify(md[1])*0.01);
      }
      if(md=desc.match(/^([a-z ]+) are twice as efficient/)){
        var obj = plurals[md[1]];
        if(obj!==undefined) { 
          Util.debug('guessed '+name+' -> efficient twice : '+obj.name);
          return cache[name]=twice(obj.name);
        }
      }
      if(md=desc.match(/^([a-z ]+) gain \+([\d,\.]+) base cps/)){
        var obj = plurals[md[1]];
        if(obj!==undefined) {
          Util.debug('guessed '+name+' -> base cps gain : '+obj.name+' +'+md[2]);
          return cache[name]=gainBase(obj.name,Util.unBeautify(md[2]));
        }
      }
      if(md=desc.match(/^cookie production multiplier \+(\d+)%/)){
        Util.debug('guessed '+name+' -> cookie production +'+md[1]+'%');
        return cache[name]=gainGlobalCpsMult(parseInt(md[1])*0.01);
      }
      if(md=desc.match(/^golden cookies appear twice as often and stay twice as long/)){
        Util.debug('guessed '+name+' -> golden cookies frequency twice');
        return cache[name]=LuckyTwiceFreq;
      }
      if(md=desc.match(/^golden cookie effects last twice as long/)){
        Util.debug('guessed '+name+' -> golden cookies effects twice');
        return cache[name]=LuckyTwiceLast;
      }
      Util.debug('guessed '+name+' -> unknown');
      return cache[name]=Default;
    };


    var Ignore = { p:'ignore' };
    return {
      // used when no policies matched
      Guess: Guess,
      // Cursor
      'Reinforced index finger': gainMouseAndCursorBase(1,0.1),
      // Kittens
      'Kitten helpers': kitten(0.05),
      'Kitten workers': kitten(0.1),
      'Kitten engineers': kitten(0.2),
      'Kitten overseers': kitten(0.3),
      // Research
      'Bingo center/Research facility': gainRate('Grandma',4),
      'Sacrificial rolling pins': Ignore,
      // door for wrath
      'One mind': Ignore,
      'Communal brainsweep': Ignore,
      'Elder Pact': Ignore,
      // Repeatable
      'Elder Pledge': Ignore,
      'Elder Covenant': Ignore,
      'Revoke Elder Covenant': Ignore,
      // "Debug purpose only"
      'Ultrascience': Ignore,
      'Gold hoard': Ignore,
      'Neuromancy': Ignore,
      // Switches
      'Milk selector': Ignore,
      'Bunny biscuit': Ignore,
      'Fool&#8217;s biscuit': Ignore,
      'Lovesick biscuit': Ignore,
      'Ghostly biscuit': Ignore,
      'Festive biscuit': Ignore,
    };
  })();
  SimpleBuyer.prototype.status = function(ctx){
    var stat = '';
    for (var i=0;i<$o.length;i++){
      stat += $o[i].bought;
    }
    for (var i=0;i<$u.length;i++){
      stat += $u[i].unlocked<<1 + $u[i].bought;
    }
    stat += Game.goldenClicks;
    return stat;
  }

  // for debugging ...
  SimpleBuyer.prototype.costFor = function(name,_ctx){
    var obj = $O[name] || $U[name];
    var ctx = _ctx || this.context;
    if(obj.price!==undefined){
      var price = obj.price;
      var cps = obj.storedCps;

    } else {
      var price = obj.basePrice;
      var policy = this.getPolicyForUpgrade(obj.name);
      if(policy.p==='cps')
        var cps = policy.cps(ctx,obj);
      else
        var cps = 0;
    }
    return {
      name: name,
      price: price,
      cps: cps,
      cpcps: price/cps,
      cost:  ctx.stg.cost(ctx,price,cps,Util.delay(price,ctx.estCps)),
      delay: Util.delay(price,ctx.estCps),
    };
  }
  SimpleBuyer.prototype.showCosts = function(){
    var ctx = this.context;
    function show(c){
      console.debug(
        c.name,
        'cost:'+Beautify(c.cost),
        'cpsGain:'+Beautify(c.cps),
        'cpcps:'+Beautify(c.price/c.cps),
        'delay:'+Util.round(c.delay)
        );
    }
    var list = [];
    for(var i=0;i<$o.length;i++){
      list.push( this.costFor($o[i].name) );
    }
    for(var i=0;i<$u.length;i++){
      var ud = $u[i];
      if(ud.bought!==0 || ud.unlocked===0) continue;
      var policy = this.getPolicyForUpgrade(ud.name);
      if(policy.p!=='cps') continue;
      list.push( this.costFor(ud.name) );
    }
    var list = list.sort( function(a,b){ return a.cost==b.cost? 0 : a.cost>b.cost ? -1 : 1; } );
    Util.forEach( list,
      function(c){
        show(c);
      });
    //console.debug('cpsPs: '+ctx.cpsPs);
  }

  // set default Buyer
  var Buyer = $app.Buyer = new SimpleBuyer();

  var UI = $app.UI = {};
  UI.set = function(){
    this.origUpdateMenu = this.origUpdateMenu || $g.UpdateMenu;
    $g.UpdateMenu = this.UpdateMenuHook;
    this.cache = {};

    this.const = {
      panelId: 'comments',
      menuId: 'menu',
      buttonId: 'csButton',
      menuName: 'csmith',
    };

    var panel = document.getElementById(this.const.panelId);
    var button = document.createElement('div');
    button.className = 'button';
    button.id = this.const.buttonId;
    button.innerHTML = 'Csmith';
    var self = this;
    button.onclick = function(){
      $g.ShowMenu(self.const.menuName);
    };

    Util.merge(button.style,{
      padding: '6px 2px 0px 2px',
      'font-size': '90%',
      bottom: '16px',
      right: '65px',
    });

    panel.appendChild(button);
  };
  UI.remove = function(){
    if(this.origUpdateMenu===undefined) return;
    $g.UpdateMenu = this.origUpdateMenu;
    this.origUpdateMenu = undefined;
    var panel = document.getElementById(this.const.panelId);
    var button = document.getElementById(this.const.buttonId);
    panel.removeChild(button);
  };
  UI.WriteButton=function(label,callback,cls){
    cls = cls ? ' '+cls : '';
    return '<a class="option'+cls+'" onclick="'+callback+'">'+label+'</a>';
  }
  UI.handle  = function(id){
    var ui = UI;
    switch(id){
      case 'remove':
      ui.cache = {};
      if($g.onMenu===this.const.menuName)
        $g.ShowMenu(this.const.menuName);
      Cookiesmith.remove();
      break;

      case 'stop':
      ui.cache = {};
      Buyer.stop();
      Clicker.stop();
      GoldHunter.stop();
      break;

      case 'start':
      ui.cache = {};
      Buyer.start();
      Clicker.start();
      GoldHunter.start();
      break;

      case 'start-buyer': Buyer.start(); break;
      case 'stop-buyer': Buyer.stop(); break;

      case 'start-clicker': Clicker.start(); break;
      case 'stop-clicker': Clicker.stop(); break;

      case 'start-goldHunter': GoldHunter.start(); break;
      case 'stop-goldHunter': GoldHunter.stop(); break;
    }
  };
  UI.UpdateMenuHook = function(){
    var ui = UI;
    ui.origUpdateMenu.apply($g);
    try {
      ui.makeMenu();
    } catch(e) {
      console.error(e.toString());
    }
  };
  UI.makeMenu = function(){
    var ui = UI;
    var csPref = 'Cookiesmith.'
    var uiPref = csPref + 'UI.'

    if($g.onMenu===ui.const.menuName){
      var str = '<div class="section">Cookiesmith Menu</div>';

      str += '<div class="subsection">'+'<div class="title">General</div>';

      str += '<div class="listing">';
      str += ui.WriteButton('Start',uiPref+"handle('start');");
      str += ui.WriteButton('Stop',uiPref+"handle('stop');");
      str += '<label>Start / Stop all modules</label>';
      str += '</div>';

      str += '<div class="listing">';
      if(Buyer.running){
        str += ui.WriteButton('Stop Buyer',uiPref+"handle('stop-buyer');");
      } else {
        str += ui.WriteButton('Start Buyer',uiPref+"handle('start-buyer');");
      }
      if(Clicker.running){
        str += ui.WriteButton('Stop Clicker',uiPref+"handle('stop-clicker');");
      } else {
        str += ui.WriteButton('Start Clicker',uiPref+"handle('start-clicker');");
      }
      if(GoldHunter.running){
        str += ui.WriteButton('Stop GoldHunter',uiPref+"handle('stop-goldHunter');");
      } else {
        str += ui.WriteButton('Start GoldHunter',uiPref+"handle('start-goldHunter');");
      }
      str += '<label>Start / Stop each module</label>';
      str += '</div>';

      str += '<div class="listing">'+ui.WriteButton('Remove Cookiesmith',uiPref+"handle('remove');")+'<label>Stop and Remove Cookiesmith (this menu will be closed)</label></div>';

      str += '</div>'; // subsection General

      // Buyer menu
      if(Buyer.running){
        str += '<div class="subsection">'+'<div class="title">Buyer</div>';
        str += '<div class="listing"><b>Estimated average Cps :</b> <div class="price plain">'+Beautify(Buyer.context.estCps||0)+'</div></div>';
        
        if(Buyer.context){
          var target = ui.cache.target = Buyer.context.target || ui.cache.target;
          if(target){
            var price = target.obj.price || target.obj.basePrice;
            //var delay = Math.max( 0, (price-$g.cookies)/Buyer.context.realCps );
            var delay =  Util.realDelay( price-$g.cookies, Buyer.context.baseCps, Buyer.context.baseClickCps);
            var name = target.type==='obj' ? target.obj.name+' ('+(target.obj.amount+1)+')' : target.obj.name ;
            str += '<div class="listing"><b>Next target :</b> '+name+' &nbsp; <div class="price plain">'+Beautify(price)+'</div></div>';
            str += '<div class="listing"><b>Wait :</b> '+Math.round(delay)+'</div>';
          }else{
            str += '<div class="listing"><b>Next target :</b></div>';
            str += '<div class="listing"><b>Wait :</b></div>';          
          }

          var list = Buyer.context.scores || ui.cache.scores;
          if(list){
            ui.cache.scores = list;
            str += '<div class="listing"><b style="color:#fff;font-size:120%;">Evaluation table</b>';
            if (!list.sorted) {
              for(var i=0; i<list.length ;i++){
                list[i].costs = Buyer.costFor(list[i].obj.name);
                if(list[i].type==='obj') list[i].amount = list[i].obj.amount;
              }
              list.sort( function(a,b){ return a.costs.cpcps==b.costs.cpcps? 0 : a.costs.cpcps<b.costs.cpcps ? -1 : 1; } );
              list.sorted = true;
            }
            str += '<table><tbody>';
            str += '<tr style="text-align:left;color:gray;font-size:80%;"><th>Object Name</th><th>Cost</th><th>Cps+</th><th>Cost/Cps+</th><th>Time cost</th></tr>';
            for(var i=0; i<list.length ;i++){
              var obj = list[i].obj;
              var c = list[i].costs;
              var name = obj.name;
              if(list[i].amount!==undefined)
                name = name+' ('+(list[i].amount+1)+')';
              var nameStyle = 'border:1px gray solid;padding:2px;max-width:160px;';
              var style = 'border:1px gray solid;padding:2px;text-align:right;';
              if(target === list[i]){
                var bg = 'background-color:#666;';
                nameStyle += bg;
                style += bg;
              }
              var cps='-', cpcps='-';
              if (c.cps>0){
                cpcps = Beautify(c.cpcps);
                if(c.cps<1) cps = Util.round(c.cps,1);
                else        cps = Beautify(c.cps);
              }
              str += '<tr>';
              str += '<td style="'+nameStyle+'">'+name+'</td>';
              str += '<td style="'+style+'">'+Beautify(c.price)+'</td>';
              str += '<td style="'+style+'">'+cps+'</td>';
              str += '<td style="'+style+'">'+cpcps+'</td>';
              str += '<td style="'+style+'">'+Util.beautifyTime(c.price/Buyer.context.estCps)+'</td>';
              str += '</tr>';
            }
            str += '</tbody></table>'
            str += '</div>';
          }
        }
        str += '</div>'; // subsection Buyer
      }

      // Clicker
      if(Clicker.running){
        str += '<div class="subsection">'+'<div class="title">Clicker</div>';
        if(Timer.clicksPs!==undefined){
          str += '<div class="listing"><b>Clicks per second :</b> '+Util.round(Timer.clicksPs,1)+'</div>';
        }
        str += '</div>'; // subsection Clicker
      }
      document.getElementById(ui.const.menuId).innerHTML += str;
    }
  };


  /*
  * Cheater
  */
  var Cheater = $app.Cheater = {};
  Cheater.getCookies = function(number){
    $g.cookiesEarned += number;
    $g.cookies += number;
    Util.log( 'got '+Beautify(number)+' cookies.' );
  };
  Cheater.showGold = function(){
    $g.goldenCookie.delay = 10;
  };
  var gr_id = -1;
  Cheater.goldRush = function(interval){
    window.clearInterval(gr_id);
    if(interval>0){
      gr_id = window.setInterval( Cheater.showGold , interval );
    }
  };
  Cheater.instantResearch = function(){
    Interceptor.loopHook.instantResearch = function(){
      if($g.researchT > 1) $g.researchT = 1;
    };
  };
  Cheater.iAmNotACheater = function(){
    $g.Achievements['Cheated cookies taste awful'].won = 0;
  };
  Cheater.getNeuromancy = function(){
    var neuro = $U['Neuromancy'];
    this.getCookies(neuro.basePrice);
    neuro.buy();
  }

  /*
  * initializer
  */
  var initialized = false;
  $app.init = function(opt){
    if(initialized) return $app;
    console.log('cookiesmith: initialize');
    Util.merge($app.opt,opt);
    Timer.set();
    Interceptor.set();
    UI.set();
    initialized = true;
    return $app;
  };
  var started = false;
  $app.autoStart = function(opt){
    if(started) return $app;
    $app.init(opt);
    if($app.opt.clicker)     Clicker.start();
    if($app.opt.goldHunter)  GoldHunter.start();
    if($app.opt.buyer)       Buyer.start();
    started = true;
    Util.popup('started');
    return $app;
  };
  $app.stop = function(){
    Buyer.stop();
    GoldHunter.stop();
    Clicker.stop();
  };
  $app.remove = function(){
    $app.stop();
    UI.remove();
    Interceptor.remove();
    Timer.remove();
    initialized = false;
  };
  return $app;
})(window.Game,{});
