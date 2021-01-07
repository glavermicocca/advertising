// ----------------------------- MQTT --------------------------------
const { v4: uuidv4 } = require("uuid");

const options = {
  retain: false,
  qos: 2,
};

const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://127.0.0.1", {
  clientId: "mqttjs01",
});
//console.log("connected flag  " + client.connected);

client.on("connect", function (evn) {
  //  console.log(evn);
});

//handle errors
client.on("error", function (error) {
  console.log("Can't connect" + error);
  process.exit(1);
});

client.on("message", function (topic, message) {
  // message is Buffer
  console.log(message.toString());
  client.end();
});

// ------------------------- BLUETOOTH ---------------------------------

const noble = require("@abandonware/noble");

const SERVICE_UUID = "80b7ee5ffb594714939e67703691bd19"; //'3e440001f5bb357d719d179272e4d4d9';
const CHARACTERISTIC_UUID = "80b7ee5ffb604714939e67703691bd19";

noble.on("stateChange", async (state) => {
  console.log(state);
  if (state === "poweredOn") {
    await noble.startScanningAsync([SERVICE_UUID], true); //'6e400001b5a3f393e0a9e50e24dcca9e'
  }
});

// setInterval(async () => {
//   console.log(`Restart scanning...`)
//   await noble.startScanningAsync([SERVICE_UUID], false);
// }, 20000);

noble.onScanStop((state) => {
  console.log(state);
});

noble.on("warning", (message) => {
  console.log(message);
});
noble.on("discover", async (peripheral) => {
  const name = peripheral.advertisement.localName;
  console.log(
    `Connecting to '${name}' - ${peripheral.address} - ${peripheral.id}`
  );

  if (peripheral.address != "fa:bd:39:0c:b8:0a") {
    await noble.stopScanningAsync();
    connectAndSetUp(peripheral);
  }
});
noble.on("disconnect", (data) => {
  console.log("disconnected");
  console.log(data);
});

const message = {};

async function connectAndSetUp(peripheral) {
  const _id = peripheral.id;

  const id = _id.replace(":", "");

  if (message[id] == null) {
    message[id] = {};
  }

  if (peripheral.state == "disconnected") {
    try {
      peripheral.once("connect", () => {
        console.log("Peripheral connected!!!");
        //const { characteristics, } = await peripheral.discoverSomeServicesAndCharacteristicsAsync([SERVICE_UUID,]);
        peripheral.discoverAllServicesAndCharacteristics(
          (error, services, characteristics) => {
            console.log("Discovered services and characteristics");

            if (error) {
              console.log(error);
              return;
            }

            const characteristic = characteristics.find((el) => {
              return el.uuid == CHARACTERISTIC_UUID;
            });

            characteristic.notify(true, (error) => {
              console.log(error);
            });

            characteristic.on("read", (data, isNotification) => {
              console.log(String(data));
              startChar(String(data), id);
            }); // legacy
          }
        );
      });

      peripheral.once("disconnect", () => {
        console.log("Disconnect -> " + peripheral);
        peripheral.removeAllListeners();
        message[id].idInterval = setInterval(async () => {
          connectAndSetUp(peripheral);
        }, 3000);
      });

      peripheral.connect((error) => {
        if (error) {
          console.log(error);
          return;
        }
      });
    } catch (error) {
      console.log(error);
    }
  } else if (peripheral.state == "connected") {
    if (message[id].idInterval) clearInterval(message[id].idInterval);
  }
}

async function startChar(data, id) {
  const tele_puckjs_SENSOR = `tele/${id}/SENSOR`;

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
      message[id].toggle = "on";
    } else if (data.substr(1) === "false") {
      message[id].toggle = "off";
    } else {
      var p = data[1] * 10 + 10;
      message[id].presses = p;
    }
  }

  try {
    console.log(tele_puckjs_SENSOR, JSON.stringify(message[id]));
    message[id].uuid = uuidv4();
    client.publish(
      tele_puckjs_SENSOR,
      JSON.stringify(message[id]),
      options,
      (obj) => {
        console.log(obj);
      }
    );
  } catch (error) {
    console.log(error);
  }
}
