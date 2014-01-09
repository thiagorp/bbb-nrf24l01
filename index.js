'use strict';

var b = require('bonescript');
var consts = require('const');
var SPI = require('spi');

module.exports = (function(){
    var csnPin = 'P9_17';
    // var sckPin = 'P9_22';
    // var mosiPin = 'P9_18';
    // var misoPin = 'P9_21';
    var cePin = 'P9_16';

    var address = 'serv1';
    var payload = 16;
    var channel = 1;

    var spi;

    var nrf = {};

    Object.defineProperty(nrf, 'cePin', {
        get: function() { return cePin; },
        set: function(y) {
            cePin = y;
            b.pinMode(cePin, b.OUTPUT);
        }
    });

    Object.defineProperty(nrf, 'spiDev', {
        set: function(y) {
            spi = new SPI.Spi(y);
            spi.open();
        }
    });

    Object.defineProperty(nrf, 'payload', {
        get: function() { return payload; },
        set: function(y) {
            payload = y;
            var payloadBuf = new Buffer(1);
            payloadBuf[0] = payload;
            nrf.writeRegister(consts.RX_PW_P0, payloadBuf);
            nrf.writeRegister(consts.RX_PW_P1, payloadBuf);
        }
    });

    Object.defineProperty(nrf, 'channel', {
        get: function() { return channel; },
        set: function(y) {
            channel = y;
            var channelBuf = new Buffer(1);
            channelBuf[0] = channel;
            nrf.writeRegister(consts.RF_CH, channelBuf);
        }
    });

    Object.defineProperty(nrf, 'address', {
        get: function() { return address; },
        set: function(y) {
            address = y;
            var addressBuf = new Buffer(address);
            nrf.writeRegister(consts.RX_ADDR_P1, addressBuf);
        }
    });

    nrf.ceHigh = function() {
        b.digitalWrite(cePin, b.HIGH);
    };

    nrf.ceLow = function() {
        b.digitalWrite(cePin, b.LOW);
    };

    nrf.csnHigh = function() {
        b.digitalWrite(csnPin, b.HIGH);
    };

    nrf.csnLow = function() {
        b.digitalWrite(csnPin, b.LOW);
    };

    nrf.readRegister = function(reg, val, callback)
    {
        this.csnLow();
        var addr = new Buffer(1);
        addr[0] = consts.READ_REGISTER | (consts.REGISTER_MASK & reg);
        spi.write(addr);
        spi.transfer(val, val, function(device, buf) {
            callback(buf);
        });
        this.csnHigh();
    };

    nrf.writeRegister = function(reg, buffer) {
        this.csnLow();
        var addr = new Buffer(1);
        addr[0] = consts.WRITE_REGISTER | (consts.REGISTER_MASK & reg);
        spi.write(addr);
        spi.wirte(buffer);
        this.csnHigh();
    };

    nrf.startReceiving = function() {
        this._powerUpRx();
        this.flushRx();
    };

    nrf.close = function() {
        spi.close();
    };

    nrf._powerUpRx = function () {
        //TODO set is transmitting false
        this.ceLow();
        var buf1 = new Buffer(1);
        var buf2 = new Buffer(1);

        buf1[0] = consts.RF_CONFIG | ((1 << consts.PWR_UP) | (1 << consts.PRIM_RX));
        buf2[0] = (1 << consts.TX_DS) | (1 << consts.MAX_RT);

        this.writeRegister(consts.CONFIG, buf1);
        this.ceHigh();
        this.writeRegister(consts.STATUS, buf2);
    };

    nrf.flushRx = function() {
        this.csnLow();
        var buf = new Buffer(1);
        buf[0] = consts.FLUSH_RX;
        spi.write(buf);
    };

    //Initialization
    b.pinMode(cePin, b.OUTPUT);
    nrf.ceLow();
    nrf.csnHigh();

    return nrf;
})();