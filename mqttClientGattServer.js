// ----------------------------- MQTT --------------------------------

const options = {
  retain: true,
  qos: 1,
};

const mqtt = require("mqtt");
const client = mqtt.connect("*****", {
  clientId: "mqttjs01",
});
console.log("connected flag  " + client.connected);

client.on("connect", function (evn) {
  console.log("connected");
});

//handle errors
client.on("error", function (error) {
  console.log("Can't connect" + error);
  process.exit(1);
});

// ------------------------- BLUETOOTH ---------------------------------

const noble = require("@abandonware/noble");

const SERVICE_UUID = "80b7ee5ffb594714939e67703691bd19"; //'3e440001f5bb357d719d179272e4d4d9';

noble.on("stateChange", async (state) => {
  console.log(state);
  if (state === "poweredOn") {
    await noble.startScanningAsync([SERVICE_UUID], false); //'6e400001b5a3f393e0a9e50e24dcca9e'
  }
});

setInterval(async () => {
  await noble.startScanningAsync([SERVICE_UUID], false);
}, 15000);

noble.onScanStop((state) => {
  console.log(state);
});

noble.on("discover", async (peripheral) => {
  const name = peripheral.advertisement.localName;
  console.log(`Connecting to '${name}' - ${peripheral.address} - ${peripheral.id}`);
  connectAndSetUp(peripheral);
});
noble.on("disconnect", (data) => {
  console.log("disconnected");
  console.log(data);
});

const message = {};

async function connectAndSetUp(peripheral) {
  if (peripheral.state != "connected") {
    try {
      
      const _id = peripheral.id
      const id = _id.replace(":", "")
      const tele_puckjs_SENSOR = `tele/${id}/SENSOR`
      //const address = peripheral.address
      //console.log(`Peripheral with ID ${_id} address ${address} found`);
  
      if(message[id] == null) {message[id] = {}}

      peripheral.once("disconnect", (dev) => {
        console.log("Disconnect -> " + dev + " " + peripheral);
      });
      await noble.stopScanningAsync();
      await peripheral.connectAsync();

      const {characteristics,} = await peripheral.discoverSomeServicesAndCharacteristicsAsync([SERVICE_UUID,]);

      console.log("Discovered services and characteristics");

      const characteristic = characteristics[0];

      characteristic.on("data", (data, isNotification) => {
        console.log(`Received: "${String(data)}"    isNotification: ${isNotification}`);

        var data = String(data);

        if (data.indexOf("B") > -1) {
          //Battery
          message[id].batt = String(data.substr(1));
        } else if (data[0] === "T") {
          //Temperature
          message[id].temp = String(data.substr(1));
        } else if (data[0] === "P") {
          //Luminosita
          message[id].pir = String(data.substr(1));
        } else if (data[0] === "M") {
          //Temperature
          var p = data.substr(1).split("|");
          var x = Number(p[0]);
          var y = Number(p[1]);
          var z = Number(p[2]);
          var s = Math.sqrt(x * x + y * y + z * z);
          s = Math.round(s * 100) / 100;
          message[id].mag = String(s);
        } else if (data[0] === "S") {
          //Switch
          if (data.substr(1) === "true") {
            message[id].toggle = 'on';
          } else if (data.substr(1) === "false") {
            message[id].toggle = 'off';
          } else {
            var p = data[1] * 10 + 10;
            message[id].presses = p;
          }
        }

        if(client.connected){
          client.publish(tele_puckjs_SENSOR, JSON.stringify(message[id]), options);
        }
      });

      // subscribe to be notified whenever the peripheral update the characteristic
      characteristic.subscribe((error) => {
        if (error) {
          console.error("Error subscribing to echoCharacteristic");
        } else {
          console.log("Subscribed for echoCharacteristic notifications");
        }
      });
    } catch (error) {
      console.log(error);
    }
  }
}
