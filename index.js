'use strict';

var b = require('bonescript');
var consts = require('./const');
var SPI = require('spi-trp');

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

    nrf.getStatus = function() {
        var status;
        var statusRdy = 0;

        this.readRegister(consts.STATUS, new Buffer(1), function(b) {
            status = b[0];
            statusRdy = 1;
        });

        while(!statusRdy);

        return status;
    };

    nrf.dataReady = function() {
        var status = this.getStatus();

        if (status & (1 << consts.RX_DR)) return 1;

        return !this.rxFifoEmpty();
    };

    nrf.rxFifoEmpty = function() {
        var fifoStatus;
        var fifoStatusReady = 0;

        this.readRegister(consts.FIFO_STATUS, new Buffer(1), function(b) {
            fifoStatus = b[0];
            fifoStatusReady = 1;
        });

        while(!fifoStatusReady);

        return (fifoStatus & (1 << consts.RX_EMPTY));
    };

    nrf.getData = function() {
        var data;
        var dataReady = 0;

        this.csnLow();

        var buf = new Buffer(1+payload);
        buf[0] = consts.R_RX_PAYLOAD;

        spi.transfer(buf, buf, function(device, buf) {
            data = buf;
            dataReady = 1;
        });

        while(!dataReady);
        this.csnHigh();

        var wBuf = new Buffer(1);
        wBuf[0] = (1<<consts.RX_DR);

        this.writeRegister(consts.STATUS, wBuf);
        data = data.slice(1);
        var reversedData = new Buffer(data.length);

        for (var i = 0; i < data.length; i++)
        {
            reversedData[i] = data[data.length-1-i];
        }

        return reversedData;
    };

    nrf.readRegister = function(reg, val, callback)
    {
        this.csnLow();
        var buf1 = new Buffer(1 + val.length);
        buf1[0] = consts.READ_REGISTER | (consts.REGISTER_MASK & reg);

        for (var i = 0; i < val.length; i++) {
            buf1[i+1] = val[i];
        }

        spi.transfer(buf1, new Buffer(buf1.length), function(device, buf) {
            var rBuf = new Buffer(buf.length-1);
            for (var i = 1; i < buf.length; i++) {
                rBuf[i-1] = buf[i];
            }
            callback(rBuf);
        });
        this.csnHigh();
    };

    nrf.writeRegister = function(reg, buffer) {
        this.csnLow();
        var b = new Buffer(1 + buffer.length);
        b[0] = consts.WRITE_REGISTER | (consts.REGISTER_MASK & reg);

        for (var i = 0; i < buffer.length; i++) {
            b[i+1] = buffer[i];
        }

        spi.write(b);
        this.csnHigh();
    };

    nrf.startReceiving = function() {
        this._powerUpRx();
        this.flushRx();
    };

    nrf.close = function() {
        this.ceLow();
        this.writeRegister(consts.CONFIG, consts.RF_CONFIG);
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
    b.pinMode(csnPin, b.OUTPUT);
    nrf.ceLow();
    nrf.csnHigh();

    return nrf;
})();