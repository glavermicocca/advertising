const noble = require('@abandonware/noble');

var options = {
    retain: true,
    qos: 1
};

var mqtt = require('mqtt');
var client = mqtt.connect("*****", { clientId: "mqttjs02" });
//console.log("connected flag  " + client.connected);

//handle incoming messages
// client.on('message', function (topic, message, packet) {
//     //console.log("message is " + message);
//     //console.log("topic is " + topic);
// });

client.on("connect", function (evn) {
    //console.log("connected")
})

//handle errors
client.on("error", function (error) {
    //console.log("Can't connect" + error);
    process.exit(1)
});

const startAdv = () => {
    noble.on('stateChange', async (state) => {
        if (state === 'poweredOn') {
            await noble.startScanningAsync(['6e400001b5a3f393e0a9e50e24dcca9e'], true); //'6e400001b5a3f393e0a9e50e24dcca9e'
        }
    });

    noble.on('discover', async (peripheral) => {
        writeData(peripheral, client)
    });
}
startAdv();

const message = {}

const writeData = (peripheral, client) => {

    const _id = peripheral.id
    const address = peripheral.address

    ////console.log(`Peripheral with ID ${id} address ${address} found`);

    const advertisement = peripheral.advertisement;

    const localName = advertisement.localName;
    const txPowerLevel = advertisement.txPowerLevel;
    const manufacturerData = advertisement.manufacturerData;
    const serviceData = advertisement.serviceData;
    const serviceUuids = advertisement.serviceUuids;

    const id = _id.replace(":", "")
    const tele_puckjs_SENSOR = `tele/${id}/SENSOR`

    if(message[id] == null) {
        message[id] = {}
    }

    if (serviceData != null && serviceData.length > 0) {
        serviceData.forEach((element) => {
            const { uuid, data } = element
            switch (uuid) {
                case '180f':
                    //console.log("batt -> " + String(data))
                    message[id].batt = Number(String(data))
                    break;
                case '2a01':
                    //console.log("presses -> " + String(data))
                    message[id].presses = Number(String(data))
                    break;
                case '2a02':
                    //console.log("temp -> " + String(data))
                    message[id].temp = String(data)
                    break;
                case '2a03':
                    //console.log("pir  -> " + String(data))
                    message[id].pir = String(data)
                    break;
                case '2a04':
                    //console.log("mag  -> " + String(data))
                    message[id].mag = String(data)
                    break;
            }
        })
        //        client.publish(tele_puckjs_AVAILABILITY, "Online", options)
        if(client.connected){
            client.publish(tele_puckjs_SENSOR, JSON.stringify(message[id]), options);
        }
    }
}
