NRF.setTxPower(4);
NRF.setConnectionInterval(200);

const MINUTE = 60 * 1000;

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

const blinkRosso = () => {LED1.glow(100, 500);};
const blinkVerde = () => {LED2.glow(100, 500);};
const blinkBianco = () => {LED3.glow(100, 500);};

NRF.setServices(
  {
    "80b7ee5f-fb59-4714-939e-67703691bd19": {
      "80b7ee5f-fb60-4714-939e-67703691bd19": {
        value: [0],
        maxLen: 19,
        writable: true,
        notify: true, // optional, default is false
        onWrite: function (evt) {
          // Data comes in as a byte, make it 0..1 range
          //var n = evt.data[0] / 255;
          // Send data directly to servo as PWM
          var data = evt.data;
          blinkBianco();
          //send BACK
          NRF.updateServices({
            "80b7ee5f-fb59-4714-939e-67703691bd19": {
              "80b7ee5f-fb60-4714-939e-67703691bd19": {
                value: toCharCodeArray(data),
                notify: true,
              },
            },
          });
        },
      }
    },
  },
  { uart: false, advertise: ["80b7ee5f-fb59-4714-939e-67703691bd19"] }
);
//NRF.setAdvertising({}, {name:"Puck.js"});

var idIntervalValuesPir;
var idIntervalValuesTemp;
var idIntervalValuesBatt;
const startHere = () => {
  cnt = 0;
  blinkVerde();
  setupUUID();
};

const setupUUID = ()=>{
    idIntervalValuesPir = setTimeout(()=>{
      setupService(getPir());
    },MINUTE*3);
    idIntervalValuesTemp = setTimeout(()=>{
      setupService(getTemp());
    },MINUTE*3+5000);
    idIntervalValuesBatt = setTimeout(()=>{
      setupService(getBatt());
    },MINUTE*3+10000);
};

const setupService = (value) =>{
  if(value != null){
    blinkBianco();
    NRF.updateServices({
      "80b7ee5f-fb59-4714-939e-67703691bd19": {
        "80b7ee5f-fb60-4714-939e-67703691bd19": {
          value: toCharCodeArray(value),
          notify: true,
          writable: true,
          readable: true,
        }
      },
    },{ uart: false, advertise: ["80b7ee5f-fb59-4714-939e-67703691bd19"] });
  }
};

// On disconnect, stop the servo
NRF.on("disconnect", () => {
  if (idIntervalValuesPir) clearInterval(idIntervalValuesPir);
  if (idIntervalValuesTemp) clearInterval(idIntervalValuesTemp);
  if (idIntervalValuesBatt) clearInterval(idIntervalValuesBatt);
  if (idIntervalBtn) clearInterval(idIntervalBtn);
  blinkRosso();
  address = null;
});

// On disconnect, stop the servo
var address;
NRF.on("connect", (addr) => {
  address = addr;
  startHere();
});

// -----------------------------------------------------------------
// ------------------------------ BUTTON ---------------------------
// -----------------------------------------------------------------

var log = print;
var idIntervalBtn;
function flagRising(e){
  if(address){

    var valueL = 0;

    if(idIntervalValuesPir){changeInterval(idIntervalValuesPir, MINUTE * 3);}
    if(idIntervalValuesTemp){changeInterval(idIntervalValuesTemp, MINUTE * 3 + 5000);}
    if(idIntervalValuesBatt){changeInterval(idIntervalValuesBatt, MINUTE * 3 + 10000);}

    idIntervalBtn = setInterval(()=>{
      var value = ++valueL%10;
      analogWrite(LED2, value*0.1);
      setupService(`S${value}`);
    }, 280);
  }
}
var toggle = false;
function flag(e) {
  if(address){
    var l = e.time - e.lastTime;

    digitalWrite(LED1,0);
    digitalWrite(LED2,0);
    digitalWrite(LED3,0);

    if(idIntervalBtn != null){clearInterval(idIntervalBtn);}

    if (l > 0.4) {
      //long
    } else {
      //short
      LED3.glow(500, 1000);
      toggle = !toggle;
      setupService(`S${toggle}`);
    }
  } else {
    blinkRosso();
  }
}
// When button pressed
setWatch(flag, BTN, { repeat: true, edge: "falling", debounce: 50  });
setWatch(flagRising, BTN, { repeat: true, edge: "rising", debounce: 50  });

// --------------------------------------------------------------------
// ----------------------------- GLOW ---------------------------------
// --------------------------------------------------------------------

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

blinkBianco();
