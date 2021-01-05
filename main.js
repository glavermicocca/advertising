NRF.setTxPower(4);

const MINUTE = 1000; //60 * 1000;

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

const blinkRosso = () => {LED1.glow(200, 1000);};
const blinkVerde = () => {LED2.glow(200, 1000);};
const blinkBianco = () => {LED3.glow(200, 1000);};
const blinkBiancoBreve = () => {LED3.glow(200, 600);};

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
NRF.setAdvertising({}, {name:"Puck.js"});

var idIntervalValues;
var cnt = 0;
const startHere = () => {
  idIntervalValues = setInterval(() => {
    cnt++;
    var value;
    if(cnt % 4 == 0){
     value = getMag();
    } else if(cnt % 4 == 1){
      value = getPir();
    } else if(cnt % 4 == 2){
      value = getTemp();
    } else if(cnt % 4 == 3){
      value = getBatt();
    }
    if(value != null){
      blinkBiancoBreve();
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
  }, MINUTE * 10);
};

// On disconnect, stop the servo
NRF.on("disconnect", () => {
  if (idIntervalValues) clearInterval(idIntervalValues);
  blinkRosso();
  address = null;
});

// On disconnect, stop the servo
var address;
NRF.on("connect", (addr) => {
  startHere();
  address = addr;
  blinkVerde();
});

// -----------------------------------------------------------------
// ------------------------------ BUTTON ---------------------------
// -----------------------------------------------------------------

var log = print;
var idIntervalBtn;
function flagRising(e){
  if(address){
    var valueL = 0;
    if(idIntervalValues){changeInterval(idIntervalValues, MINUTE*10);}
    idIntervalBtn = setInterval(()=>{
      var value = ++valueL%10;
      analogWrite(LED2, value*0.1);
      NRF.updateServices({
        "80b7ee5f-fb59-4714-939e-67703691bd19": {
          "80b7ee5f-fb60-4714-939e-67703691bd19": {
            value: toCharCodeArray(`S${value}`),
            notify: true,
            writable: true,
            readable: true,
          }
        },
      },{ uart: false, advertise: ["80b7ee5f-fb59-4714-939e-67703691bd19"] });
    }, 420);
  }
}
var toggle = false;
function flag(e) {
  if(address){
    var l = e.time - e.lastTime;

    digitalWrite(LED1,0);
    digitalWrite(LED2,0);
    digitalWrite(LED3,0);

    if(idIntervalBtn != null){
      clearInterval(idIntervalBtn);
    }

    if (l > 0.4) {
      //long
    } else {
      //short
      LED3.glow(500, 1000);
      toggle = !toggle;
      var valueS = `S${toggle}`;
      NRF.updateServices({
        "80b7ee5f-fb59-4714-939e-67703691bd19": {
          "80b7ee5f-fb60-4714-939e-67703691bd19": {
            value: toCharCodeArray(valueS),
            notify: true,
            writable: true,
            readable: true,
          }
        },
      },{ uart: false, advertise: ["80b7ee5f-fb59-4714-939e-67703691bd19"] });
    }
  }
}
// When button pressed
setWatch(flag, BTN, { repeat: true, edge: "falling", debounce: 50  });
setWatch(flagRising, BTN, { repeat: true, edge: "rising", debounce: 50  });

// --------------------------------------------------------------------
// ----------------------------- GLOW ---------------------------------
// --------------------------------------------------------------------

// add a new function to all pins to glow
Pin.prototype.glow = function(milliseconds, Hz) {
  // see if the user specified a Hz
  // if she/he did not, we default to 60Hz
  Hz = ((typeof Hz) === "undefined") ? 60 : Hz;
  // save the pin: this is important, as in an internal function
  // 'this' would refer to the function, and no longer the pin.
  var pin = this;
  // remember that to achieve a certain Hz, we need to 
  // have cycles every 1000/Hz milliseconds
  var cycle = 1000/Hz;
  // we need to cheat a bit and take pos > 0 since
  // sin(0) = 0 and digitalPulse does not accept 0
  var pos = 0.001;
  // next, we create the function that will call our digital pulse
  var interval = setInterval(function() {
    // we send our pulse, and we use the sine function to determine the length
    // the use of Math.pow( .. ) will epsecially lower the lowest values, while
    // keeping 1 almost 1. This will help to ensure that only the brightest
    // part of the glow is truly bright.
    digitalPulse(pin, 1, Math.pow(Math.sin(pos*Math.PI), 2)*cycle);
    // we advance to the next position, determined by 
    // how long we want one glow to take
    pos += 1/(milliseconds/cycle);
    // if we are done, we clear this interval
    if (pos>=1) clearInterval(interval);
    // finally, we launch this every cycle, where the dimmer cycles
    // will have a shorter pulse and the brighter cycles a longer pulse
  }, cycle);
};

blinkBiancoBreve();
