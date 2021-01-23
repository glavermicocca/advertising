NRF.setTxPower(4); // Full Power advertising
//NRF.setConnectionInterval(200);

var zero = Puck.mag();
var intervalID;
var intervalResetID;
var presses = 0;

NRF.setAdvertising({
  0x2a01 : [String(presses)]
});

setWatch(function() {
  clearInterval();
  clearTimeout();

  NRF.setAdvertising({
    0x2a01 : [String(presses)]
  });


}, BTN, {edge:"rising", repeat:true, debounce:100});

// -----------------------------------------------------------------
// ------------------------------ BUTTON ---------------------------
// -----------------------------------------------------------------

function flagRising(e){
  clearInterval();
}
var pressesLong = 0;
var pressesShort = 0;
function flag(e) {
  var l = e.time - e.lastTime;

  if (l > 0.4) {
    //long
    blinkBianco();
    pressesLong++;
    NRF.setAdvertising({
      0x2a00 : [String(pressesLong)]
    });
  } else {
    //short
    blinkVerde();
    pressesShort++;
    NRF.setAdvertising({
      0x2a01 : [String(pressesShort)]
    });
  }
}
// When button pressed
setWatch(flag, BTN, { repeat: true, edge: "falling", debounce: 50  });
setWatch(flagRising, BTN, { repeat: true, edge: "rising", debounce: 50  });

// ---------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------

function getMag(){
  p = Puck.mag();
  p.x -= zero.x;
  p.y -= zero.y;
  p.z -= zero.z;
  var s = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z);
   return Math.round(s * 100 ) / 100;
}

const setupAdvValues = () => {
  intervalID = setInterval(()=>{
    advValues();
  }, 1000*5*1);
};

function advValues() {
  NRF.setAdvertising({
      0x180F : [String(Puck.getBatteryPercentage())],
    });
  setTimeout(() => {
    var temp = Math.round(E.getTemperature()*1000)/1000;
    NRF.setAdvertising({
      0x2a02 : [String(temp)],
    });
  }, 375*6);
  setTimeout(() => {
    var pir = Math.round(Puck.light()*1000000)/1000000;
    NRF.setAdvertising({
      0x2a03 : [String(pir)]
    });
  }, 375*12);
  setTimeout(() => {
    NRF.setAdvertising({
      0x2a04 : [String(getMag())]
    });
  }, 375*18);
}

setupAdvValues();
advValues();

// --------------------------------------------------------------------
// ---------------------------- SERVICE -------------------------------
// --------------------------------------------------------------------

NRF.setServices(
  {
    "80b7ee5f-fb61-4714-939e-67703691bd19": {
      "80b7ee5f-fb62-4714-939e-67703691bd19": {}
    },
  },
  { uart: false, advertise: ["80b7ee5f-fb61-4714-939e-67703691bd19"] }
);

// --------------------------------------------------------------------
// ----------------------------- GLOW ---------------------------------
// --------------------------------------------------------------------

const blinkRosso = () => {LED1.glow(100, 1000);};
const blinkVerde = () => {LED2.glow(100, 1000);};
const blinkBianco = () => {LED3.glow(100, 1000);};

var interval;
Pin.prototype.glow = function(milliseconds, Hz) {
  Hz = ((typeof Hz) === "undefined") ? 60 : Hz;
  var pin = this;
  var cycle = 1000/Hz;
  var pos = 0.001;
  var interval = setInterval(function() {
    digitalPulse(pin, 1, Math.pow(Math.sin(pos*Math.PI), 2)*cycle);
    pos += 1/(milliseconds/cycle);
    if (pos>=1) clearInterval(interval);
  }, cycle);
};

setTimeout(()=>{blinkBianco();}, 2000);
