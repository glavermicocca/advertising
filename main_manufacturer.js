NRF.setTxPower(4); // Full Power advertising
NRF.setConnectionInterval("auto");

const MINUTE = 60 * 1000; //60 min

// -----------------------------------------------------------------
// ------------------------------ SENSOR ---------------------------
// -----------------------------------------------------------------

var zero = Puck.mag();

const getBatt = () => {
  const batt = E.getBattery();
  return `B${batt}`;
};
const getTemp = () => {
  const temp = Math.round(E.getTemperature() * 100) / 100;
  return `T${temp}`;
};
const getPir = () => {
  const pir = Math.round(Puck.light() * 10000) / 10000;
  return `P${pir}`;
};
const getMag = () => {
  const coord = Puck.mag();
  return `M${coord.x}|${coord.y}|${coord.z}`;
};
const toCharCodeArray = (utf8) => {
  if (utf8.length > 20) {
    utf8 = utf8.substr(0, 19);
  }
  var arr = [];
  for (var i = 0; i < utf8.length; i++) {
    arr.push(utf8.charCodeAt(i));
  }
  return arr;
};

function startSensorsReading(){
  setInterval(()=>{
      setTimeout(()=>{
      NRF.setAdvertising({},{manufacturer: 0x0590, manufacturerData:(getBatt())});
    }, MINUTE * 5);
    setTimeout(()=>{
      NRF.setAdvertising({},{manufacturer: 0x0590, manufacturerData:(getTemp)});
    }, MINUTE * 10);
    setTimeout(()=>{
      var pir = String(Math.round(Puck.light()*1000000)/1000000);
      NRF.setAdvertising({},{manufacturer: 0x0590, manufacturerData:(getPir())});
    }, MINUTE * 15);
    setTimeout(()=>{
      NRF.setAdvertising({},{manufacturer: 0x0590, manufacturerData:(getMag())});
    }, MINUTE * 20);
  }, MINUTE * 10);
}

// -----------------------------------------------------------------
// ------------------------------ BUTTON ---------------------------
// -----------------------------------------------------------------

var idIntervalBtn;
var pressesShort = 0;
var pressesLong = 0;

const getShortPresses = () => {
  return `S${pressesShort++ % 10}`;
};

const getLongPresses = () => {
  return `L${pressesLong++ % 20}`;
};

NRF.setAdvertising({},{manufacturer: 0x0590, manufacturerData:getShortPresses()});
function flagRising(e){
  clearInterval();
  clearTimeout();
  setInterval(()=>{
    NRF.setAdvertising({},{manufacturer: 0x0590, manufacturerData:getLongPresses()});
    blinkVerde();
  }, 400);
}
function flag(e) {
  var l = e.time - e.lastTime;
  //console.log(l);

  clearInterval();
  clearTimeout();

  digitalWrite(LED1,0);
  digitalWrite(LED2,0);
  digitalWrite(LED3,0);

  if (l > 0.4) {
    //long
  } else {
    //short
    blinkBianco();
    NRF.setAdvertising({},{manufacturer: 0x0590, manufacturerData:getShortPresses()});
  }
  startSensorsReading();
}
// When button pressed
setWatch(flag, BTN, { repeat: true, edge: "falling", debounce: 50 });
setWatch(flagRising, BTN, { repeat: true, edge: "rising", debounce: 50 });

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

setTimeout(()=>{blinkRosso();}, 2000);
