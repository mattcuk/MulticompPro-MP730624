window.addEventListener('DOMContentLoaded', function () {
    const searchParams = new URL(location).searchParams;
    const inputs = Array.from(document.querySelectorAll('input[id]'));

    inputs.forEach((input) => {
        if (searchParams.has(input.id)) {
            if (input.type == 'checkbox') {
                input.checked = searchParams.get(input.id);
            } else {
                input.value = searchParams.get(input.id);
                input.blur();
            }
        }
        if (input.type == 'checkbox') {
            input.addEventListener('change', function (event) {
                const newSearchParams = new URL(location).searchParams;
                if (event.target.checked) {
                    newSearchParams.set(input.id, event.target.checked);
                } else {
                    newSearchParams.delete(input.id);
                }
                history.replaceState(
                    {},
                    '',
                    Array.from(newSearchParams).length
                        ? location.pathname + '?' + newSearchParams
                        : location.pathname
                );
            });
        } else {
            input.addEventListener('input', function (event) {
                const newSearchParams = new URL(location).searchParams;
                if (event.target.value) {
                    newSearchParams.set(input.id, event.target.value);
                } else {
                    newSearchParams.delete(input.id);
                }
                history.replaceState(
                    {},
                    '',
                    Array.from(newSearchParams).length
                        ? location.pathname + '?' + newSearchParams
                        : location.pathname
                );
            });
        }
    });

    document.querySelector('#selDevice').addEventListener('click', function () {
        if (isWebBluetoothEnabled()) {
            onSelDeviceButtonClick();
        }
    });
    
    document.querySelector('#clr').addEventListener('click', function (event) {
        if (isWebBluetoothEnabled()) {
            onClrButtonClick();
        }
    });
    
    document.querySelector('#reset').addEventListener('click', function (event) {
        if (isWebBluetoothEnabled()) {
            onResetButtonClick();
        }
    });
    
    document.querySelector('#stat').addEventListener('click', function (event) {
        onStatButtonClick();
    });
    
    document.querySelector('#toggleMode').addEventListener('click', function(event) {
        toggleTestMode();
    });
    
    // display the overlay help text
    // document.getElementById("overlay").style.display = "block";

    document.getElementById("id_meter1_value").textContent = "-----";
    document.getElementById("id_min_value").textContent = "-----";
    document.getElementById("id_max_value").textContent = "-----";
    document.getElementById("id_mean_value").textContent = "-----";

});

var ChromeSamples = {
    log: function () {
        var line = Array.prototype.slice
            .call(arguments)
            .map(function (argument) {
                return typeof argument === 'string' ? argument : JSON.stringify(argument);
            })
            .join(' ');

        document.getElementById('log').textContent += line + '\n';
    },

    clearLog: function () {
        document.getElementById('log').textContent = '';
    },

    setStatus: function (status) {
        document.getElementById('status').textContent = status;
    },

    setContent: function (newContent) {
        var content = document.getElementById('content');
        while (content.hasChildNodes()) {
            content.removeChild(content.lastChild);
        }
        content.appendChild(newContent);
    },
};

log = ChromeSamples.log;
clearLog = ChromeSamples.clearLog;

function isWebBluetoothEnabled() {
    if (navigator.bluetooth) {
        return true;
    } else {
        ChromeSamples.setStatus('Web Bluetooth API is not available.\n' +
            'Please make sure the "Experimental Web Platform features" flag is enabled.');
        return false;
    }
}

// Add a global error event listener early on in the page load, to help ensure that browsers
// which don't support specific functionality still end up displaying a meaningful message.
window.addEventListener('error', function (error) {
    if (ChromeSamples && ChromeSamples.setStatus) {
        console.error(error);
        ChromeSamples.setStatus(error.message + ' (Your browser may not support this feature.)');
        error.preventDefault();
    }
});

if (/Chrome\/(\d+\.\d+.\d+.\d+)/.test(navigator.userAgent)) {
    if (45 > parseInt(RegExp.$1)) {
        ChromeSamples.setStatus('Warning: Tested with Chrome ' + 45 + '.');
    }
}

var bluetoothDevice;
var SendReqCharacteristic;
var GetResCharacteristic;

var nodataTimer = null;

var dialcode_arr = [
    25840, 25584, 25328, 25072, 26608,
    9456, 9200, 8944, 8688, 10224,
    23536, 23280, 24560,
    7152, 6896, 8176,
    13553, 13297, 13041, 14321,
    8945, 10225,
    11505, 11249, 10993, 12273,
    58098, 59378,
    42226, 42994,
    19697, 19441, 19185, 21745, 21489, 21233, 23793, 23537, 24561,
    8690, 25074,
    24819,
    54000, 53744, 37616, 37360, 38896, 55280,
    56304, 56048, 39920, 39664, 40944, 57328,
    58352, 41968,
    41713, 44273, 44017, 43761, 46321, 46065,
];

var dialdecode_arr = [
    "ACV,V,1,2 V", "ACV,V,2,20 V", "ACV,V,3,200 V", "ACV,V,4,750 V", "ACV,over,1",
    "DCV,V,1,2 V", "DCV,V,2,20 V", "DCV,V,3,200 V", "DCV,V,4,1000 V", "DCV,over,1",
    "ACV,mV,2,20 mV", "ACV,mV,3,200 mV", "ACV,over,0",
    "DCV,mV,2,20 mV", "DCV,mV,3,200 mV", "DCV,over,0",
    "RES,Mohm,1,2 Mohm", "RES,Mohm,2,20 Mohm", "RES,Mohm,3,200 Mohm", "RES,over,0",
    "RES,ohm,3,200 ohm", "RES,over,1",
    "RES,kohm,1,2 kohm", "RES,kohm,2,20 kohm", "RES,kohm,3,200 kohm", "RES,over,2",
    "CONT,ohm,3", "CONT,over,4",
    "DIODE,V,1", "DIODE,over,1",
    "CAP,nF,1,2 nF", "CAP,nF,2,20 nF", "CAP,nF,3,200 nF", "CAP,uF,1,2 uF", "CAP,uF,2,20 uF", "CAP,uF,3,200 uF", "CAP,mF,1,2 mF", "CAP,mF,2,20 mF", "CAP,over,0",
    "TEMP,degC,4,400 C", "TEMP,degF,4,750 F",
    "NCV,sp,4",
    "ACI,uA,3,200 uA", "ACI,uA,4,2000 uA", "DCI,uA,3,200 uA", "DCI,uA,4,2000 uA", "DCI,over,1", "ACI,over,1",
    "ACI,mA,2,20 mA", "ACI,mA,3,200 mA", "DCI,mA,2,20 mA", "DCI,mA,3,200 mA", "DCI,over,0", "ACI,over,0",
    "ACI,A,2,20 A", "DCI,A,2,20 A",
    "FREQ,Hz,3,200 Hz", "FREQ,kHz,1,2 kHz", "FREQ,kHz,2,20 kHz", "FREQ,kHz,3,200 kHz", "FREQ,MHz,1,2 MHz", "FREQ,MHz,2,20 MHz",
];

let isTestMode = false;
let testModeInterval;

function toggleTestMode() {
    isTestMode = !isTestMode;
    if (isTestMode) {
        document.querySelector('#selDevice').disabled = true;
        document.querySelector('#reset').disabled = true;
        startTestMode();
    } else {
        document.querySelector('#selDevice').disabled = false;
        document.querySelector('#reset').disabled = false;
        stopTestMode();
    }
    // document.querySelector('#toggleMode').textContent = isTestMode ? 'Stop Test Mode' : 'Start Test Mode';
}

function startTestMode() {
    testModeInterval = setInterval(simulateReading, 1000);
}

function stopTestMode() {
    clearInterval(testModeInterval);
}

function simulateReading() {
    //const measTypes = ['DCV', 'ACV', 'DCI', 'ACI', 'RES'];
    const measTypes = ['DCV'];
    const measType = measTypes[Math.floor(Math.random() * measTypes.length)];
    let value, unit;

    switch (measType) {
        case 'DCV':
        case 'ACV':
        value = (Math.random() * 20).toFixed(2);
        unit = 'V';
        break;
        case 'DCI':
        case 'ACI':
        value = (Math.random() * 1000).toFixed(1);
        unit = 'mA';
        break;
        case 'RES':
        value = (Math.random() * 1000).toFixed(1);
        unit = 'Ω';
        break;
    }

    const simulatedEvent = {
        target: {
            value: {
                byteLength: 6,
                getUint8: () => 0, // Simplified for this example
            }
        }
    };

    handleBleNotifications(simulatedEvent, true, measType, value, unit);
}


function overlay_off() {
    document.getElementById("overlay").style.display = "none";
}

var dial = {};

stat = {
    type: "NONE",
    numsamples: 0,
    sum: 0.0,
    min: 0.0,
    mean: 0.0,
    max: 0.0
}

for (var i = 0; i < dialcode_arr.length; i++) {
    dial[dialcode_arr[i]] = dialdecode_arr[i];
}


// scale number to milli, mico, kilo, mega and return the result and the prefix
function scale_number(num) {
    var prefix = "";
    var result = num;
    var absnum = Math.abs(num);
    if (absnum > 1000000) {
        result = num / 1000000;
        prefix = "M";
    } else if (absnum > 1000) {
        result = num / 1000;
        prefix = "k";
    } else if (absnum < 0.001) {
        result = num * 1000;
        prefix = "m";
    } else if (absnum < 0.000001) {
        result = num * 1000000;
        prefix = "u";
    }
    return [result, prefix];
}

async function onSelDeviceButtonClick() {
    if (isTestMode) return;
    try {
        if (!bluetoothDevice) {
            await requestDevice();
        }
        await connectDeviceAndCacheCharacteristics();
    } catch (error) {
        log('Error: ' + error);
    }
}

async function requestDevice() {
    log('Requesting any Bluetooth Device...');
    bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [
            { services: ["0000fff0-0000-1000-8000-00805f9b34fb"] },
        ],
        //acceptAllDevices: true,
        optionalServices: ['0000fff0-0000-1000-8000-00805f9b34fb']
    });
    bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
}

async function connectDeviceAndCacheCharacteristics() {
    if (bluetoothDevice.gatt.connected && SendReqCharacteristic) {
        return;
    }
    log('Connecting to GATT Server...');
    const server = await bluetoothDevice.gatt.connect();
    log('Getting Primary Service...');
    const service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
    log('Getting SendReq Characteristic...');
    SendReqCharacteristic = await service.getCharacteristic('0000fff4-0000-1000-8000-00805f9b34fb');
    log('Add Event Handler for Notifications...');
    SendReqCharacteristic.addEventListener('characteristicvaluechanged', handleBleNotifications);
    log('Start Notifications...');
    SendReqCharacteristic.startNotifications();
    log('Ready.');
    document.getElementById('selDevice').disabled = true;
    document.getElementById('reset').disabled = false;
}

function nodata_callback() {
    document.getElementById("id_meter1_value").textContent = "----";
    document.getElementById("units").textContent = " ";
}

function handleBleNotifications(event, isSimulated = false, simMeasType = '', simValue = '', simUnit = '') {
    
    if (nodataTimer != null) {
        clearTimeout(nodataTimer);
        nodataTimer = null;
    }

    const dateobj = new Date();
    let do_overload = 0;
    let value, meas_type, meas_unit, meas_str;

    if (isSimulated) {
        meas_type = simMeasType;
        meas_unit = simUnit;
        meas_str = simValue;
        meas_maxval = 2;
    } else {
        value = event.target.value;
        vlen = value.byteLength;
        dialcode = (value.getUint8(0) * 256) + value.getUint8(1);
        // log('dialcode is ' + dialcode);
        dialdecode = dial[dialcode]; // dialcode contains a string like "DCV,mV,2,60 mV"
        try {
            if (dialdecode.search(",") == -1) { // catch any unexpected notifications
                return;
            }
        } catch (err) {
            return;
        }
        temp_str = dialdecode.split(",");
        meas_type = temp_str[0]; // e.g. DVC
        meas_unit = temp_str[1]; // e.g. mV
        meas_dp_pos = temp_str[2]; // decimal place from left. For example, 3 would mean xxx.x
        meas_maxval = temp_str[3]; // max value string, for example '600 mV'
        if ((typeof meas_maxval) == 'undefined') {
            meas_maxval = "";
        }
        //handle out of range for resistances:
        if (meas_unit.search("over") > -1) {
            do_overload = 1;
            meas_unit = "";
        }
        // handle unknown measurement types that occasionally seem to appear when the dial is rotated:
        if (meas_type.search("UNK") > -1) {
            return;
        }

        msbyte = value.getUint8(5);
        lsbyte = value.getUint8(4);
        rawmeas = (msbyte * 256) + lsbyte; // rawmeas is unsigned int
        intmeas = rawmeas;
        // log('rawmeas: ' + rawmeas + ', temp_str: ' + temp_str);
        if (msbyte > 0x7f) {
            intmeas = 0xFFFF8000 | (intmeas & 0x7FFF); // intmeas is signed int
            rawmeas = rawmeas & 0x7fff;
        }
        // convert the measurement result into a string
        //if ((intmeas > 32676) || (intmeas < -32676)) { 
        //    log('intmeas is ' + intmeas + ' rawmeas is ' + rawmeas );
        //}
        if (do_overload > 0) { // overload
            meas_str = "Overload";
        } else { // not overloaded
            temp_str = rawmeas.toString();
            temp_str = temp_str.padStart(5, '0');
            if (meas_dp_pos < 5) {
                meas_str = temp_str.slice(0, meas_dp_pos) + "." + temp_str.slice(meas_dp_pos);
                if (msbyte > 0x7f) { // negative value, prepend with a '-'
                    meas_str = "-" + meas_str;
                }
            }
        }
    }

    //log('dial ' + dialcode.toString(16) + ": " + dialdecode + ', meas: ' + meas_str + ' ' + meas_unit);
    // log the output:
    hr = ('00' + dateobj.getHours()).slice(-2);
    min = ('00' + dateobj.getMinutes()).slice(-2);
    sec = ('00' + dateobj.getSeconds()).slice(-2);
    log(
        // this is a CSV style of format, so that it can be easily imported into a spreadsheet
        hr + ":" + min + ":" + sec + ",  " +
        meas_type + " [" + meas_maxval + "],  " +
        meas_str + " " + meas_unit
    );
    if (document.getElementById("id_scrollcheck").checked == true) {
        // do auto-scroll
        var logDiv = document.getElementById("output");
        logDiv.scrollTop = logDiv.scrollHeight;
    }
    document.getElementById("id_meter1_value").textContent = meas_str + " " + meas_unit;
    document.getElementById("units").textContent = meas_type + " " + meas_maxval;
    // stats display
    std_unit = "";
    if (meas_type == "DCV") {
        std_unit = "V";
    } else if (meas_type == "DCI") {
        std_unit = "A";
    } else if (meas_type == "ACV") {
        std_unit = "V";
    } else if (meas_type == "ACI") {
        std_unit = "A";
    } else if (meas_type == "RES") {
        std_unit = "Ω";
    } else {
        std_unit = "";
    }
    // display the stats if we are in a mode that supports it
    if (meas_type == "DCV" || meas_type == "DCI" || meas_type == "ACV" || meas_type == "ACI" || meas_type == "RES") {
        if (stat.meas_type != meas_type) {
            onStatButtonClick();
            stat.meas_type = meas_type;
        }
        if (do_overload == 0) {
            // get the current measurement in a standard unit (e.g. volts, amps, ohms)
            sampval = parseFloat(meas_str);
            mult = 1.0
            prefix = meas_unit.charAt(0);
            if (prefix == "m") {
                sampval = sampval / 1000.0;
                mult = 0.001;
            } else if (prefix == "k") {
                sampval = sampval * 1000.0;
                mult = 1000.0;
            } else if (prefix == "M") {
                sampval = sampval * 1000000.0;
                mult = 1000000.0;
            } else if (prefix == "u") {
                sampval = sampval / 1000000.0;
                mult = 0.000001;
            } else {
                prefix = "";
                mult = 1.0;
            }
            if (stat.numsamples == 0) { // first sample
                stat.min = sampval;
                stat.max = sampval;
                stat.sum = sampval;
                stat.numsamples = 1;
                stat.mean = sampval;
                stat.type = meas_type;
            } else {
                stat.min = Math.min(stat.min, sampval);
                stat.max = Math.max(stat.max, sampval);
                stat.sum = stat.sum + sampval;
                stat.numsamples = stat.numsamples + 1;
                stat.mean = stat.sum / stat.numsamples;
            }

            [val, prefix] = scale_number(stat.min);
            document.getElementById("id_min_value").textContent = val.toFixed(5).slice(0, 6);
            document.getElementById("id_min_unit").textContent = prefix + std_unit;

            [val, prefix] = scale_number(stat.max);
            document.getElementById("id_max_value").textContent = val.toFixed(5).slice(0, 6);
            document.getElementById("id_max_unit").textContent = prefix + std_unit;

            [val, prefix] = scale_number(stat.mean);
            document.getElementById("id_mean_value").textContent = val.toFixed(5).slice(0, 6);
            document.getElementById("id_mean_unit").textContent = prefix + std_unit;
        }
    } else {
        // we are in a mode that does not support stats, so clear the stats display
        document.getElementById("sid_min_value").textContent = "n/a";
        document.getElementById("id_min_unit").textContent = "-";
        document.getElementById("id_max_value").textContent = "n/a";
        document.getElementById("id_max_unit").textContent = "-";
        document.getElementById("id_mean_value").textContent = "n/a";
        document.getElementById("id_mean_unit").textContent = "-";
        stat.numsamples = 0;
        stat.meas_type = "NONE";
    }

    nodataTimer = setTimeout(nodata_callback, 1000);
}

function onClrButtonClick() {
    clearLog();
}

function onStatButtonClick() {
    stat.min = 0.0;
    stat.max = 0.0;
    stat.sum = 0.0;
    stat.numsamples = 0;
    stat.mean = 0.0;
    document.getElementById("id_min_value").textContent = "-----";
    document.getElementById("id_min_unit").textContent = "-";
    document.getElementById("id_max_value").textContent = "-----";
    document.getElementById("id_max_unit").textContent = "-";
    document.getElementById("id_mean_value").textContent = "-----";
    document.getElementById("id_mean_unit").textContent = "-";
    // log the action:
    const dateobj = new Date(); // get timestamp
    hr = ('00' + dateobj.getHours()).slice(-2);
    min = ('00' + dateobj.getMinutes()).slice(-2);
    sec = ('00' + dateobj.getSeconds()).slice(-2);
    log(hr + ":" + min + ":" + sec + ",  Statistics cleared,  OK");
}

function onResetButtonClick() {
    if (isTestMode) return;
    SendReqCharacteristic.removeEventListener(
        'characteristicvaluechanged',
        handleBleNotifications
    );
    GetResCharacteristic = null;
    SendReqCharacteristic = null;
    // Note that it doesn't disconnect device.
    bluetoothDevice = null;
    log('> Bluetooth Device reset');
    document.querySelector('#reset').disabled = true; // disable reset button
    document.querySelector('#selDevice').disabled = false;
}

async function onDisconnected() {
    log('> Bluetooth Device disconnected');
    try {
        await connectDeviceAndCacheCharacteristics()
    } catch (error) {
        log('Error: ' + error);
    }
}
