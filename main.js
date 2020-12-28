NRF.setTxPower(4); // Full Power advertising
//NRF.setConnectionInterval(200);

var zero = Puck.mag();
var intervalID;
var intervalResetID;

NRF.setAdvertising({
  0x180F : [String(Puck.getBatteryPercentage())],
  0x2a01 : [String(0)]
});

setWatch(function() {
  if(intervalID!=null){
    changeInterval(intervalID, 1000*60*5);
  }
  if(idBatt!=null){
    idBatt = null;
    clearTimeout(idBatt);
  }
  if(idTemp!=null){
    idTemp = null;
    clearTimeout(idTemp);
  }
  if(idPir!=null){
    idPir = null;
    clearTimeout(idPir);
  }
  if(idMag!=null){
    idMag = null;
    clearTimeout(idMag);
  }
  if(intervalResetID != null){
    intervalResetID = null;
    clearTimeout(intervalResetID);
  }

  NRF.setAdvertising({
    0x180F : [String(Puck.getBatteryPercentage())],
    0x2a01 : [String(1)]
  });

  LED2.set();
  intervalResetID = setTimeout(()=>{
    LED2.reset();
    NRF.setAdvertising({
      0x180F : [String(Puck.getBatteryPercentage())],
      0x2a01 : [String(0)]
    });
  }, 375*3);
}, BTN, {edge:"rising", repeat:true, debounce:100});

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
  }, 1000*60*5);
};
setupAdvValues();
advValues();

var idBatt;
var idTemp;
var idPir;
var idMag;
function advValues() {
  idBatt = setTimeout(() => {
    NRF.setAdvertising({
      0x180F : [String(Puck.getBatteryPercentage())],
    });
  }, 375*4);
  idTemp = setTimeout(() => {
    var temp = Math.round(E.getTemperature()*1000)/1000;
    NRF.setAdvertising({
      0x2a02 : [String(temp)],
    });
  }, 375*8);
  idPir = setTimeout(() => {
    var pir = Math.round(Puck.light()*1000000)/1000000;
    NRF.setAdvertising({
      0x2a03 : [String(pir)]
    });
  }, 375*12);
  idMag = setTimeout(() => {
    NRF.setAdvertising({
      0x2a04 : [String(getMag())]
    });
  }, 375*16);
}

save();
