bbb-nrf24l01
============

A bonescript module for beaglebone that interfaces with the nrf24l010. This module is based on this (https://github.com/aaronds/arduino-nrf24l01) library for arduino.

This module uses the [node-spi](https://github.com/RussTheAerialist/node-spi) library for the communication layer.

It is still on its first version and needs a lot of improvemens. It doesn't support interruption yet. Any help on the source code will be very appreciated.

Requirements
============

To use this module you need to have the SPI0 of the beaglebone enabled. You can follow the third tutorial (SPI0) of [this page](http://elinux.org/BeagleBone_Black_Enable_SPIDEV).

Wiring
======

```
nrf25l01    ->     Beaglebone
--------           ----------
GND                GND (P9_1 or P9_2)
3.3V               3.3V (P9_3 or P9_4)
CE                 P9_16 (configurable)
CSN                SPI0.CS (P9_17)
SCKL               SPI0.SCLK (P9_22)
MOSI               SPI0.D1 (P9_18)
MISO               SPI0.D0 (P9_21)
IRQ                (not used yet)
```

Installation
============

```
npm install bbb-nrf24l01
```

Basic Usage
===========

Initialization
```javascript
var nrf = require('bbb-nrf24l01');
nrf.spiDev = '/dev/spidev1.0'; // This always needs to be the first property to be set
nrf.channel = 0; //0 - 127 and 0 - 84 in the US
nrf.payload = 4; //Size in bytes of the payload
nrf.address = 'serve'; //Address for receiving messages (Must be 5 bytes long)
nrf.startReceiving();
```

If you need to change the CE pin, just do
```javascript
nrf.cePin = 'P9_15'; //Or whatever other IO pin
```

Receiving data
```javascript
if (nrf.dataReady()) {
  var data = nrf.getData(); // Returns a Buffer object with the data received
}
```

Sending data
```javascript
nrf.setToAddr('clien'); //Address of the receiver (also needs to have 5 bytes only)
var buf = new Buffer('msg'); // The size of the buffer needs to be the same as the payload
nrf.sendData(buf);
while (nrf.isSending());
```

Contact
=======

And doubts and/or suggestions regarding this library you can reach me at thiago.rdp at gmail.

License
=======

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see http://www.gnu.org/licenses/.
