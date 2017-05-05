/**
 * weather-i2c - get the data via i2c
 */
I2C   = require( '../../../../library/nodejs/device/chip/gpio/i2c' );
Utils = require( '../../../../library/nodejs/Utils' );
Sleep = require('sleep');

var GET_ADDRESS     = 0x61;
var SET_ADDRESS     = 0x41;
var WIND_VANE_ADDR	= 4;
var TEMP_HUMID_ADDR = 0x5c;
var AM2315_READREG  = 0x03;

/**
 * get the data via i2c from the daughter board
 */
function WeatherI2c() {

    this.i2cWindVane    = new I2C( { bus : 2, address : WIND_VANE_ADDR} );
    this.i2cTempHumid   = new I2C( { bus : 2, address : TEMP_HUMID_ADDR} );
    this.windSpeed      = 0;
    this.windDirection  = 0;
    this.temperature    = 0;
    this.humidity       = 0;
	this.tempError      = undefined;
	this.windError      = undefined;
	this.inWindCallback = false;
	this.inTempCallback = false;

	this.fetchWind();
	this.fetchTempHumidity();

	setInterval( function() {
		if( this.inTempCallback == false ) {
			this.fetchTempHumidity();
		}
		if( this.inWindCallback == false ) {
			this.fetchWind();
		}
	}.bind(this), 1000);
}

/**
 * get the wind data
 */
WeatherI2c.prototype.fetchWind = function() { 

	this.inWindCallback = true;
	this.windError      = undefined;

	try {
		this.i2cWindVane.read( null, 32, function( data ) {

			if( data[2] != 45 || data[6] != 33 ) {
				console.log( "bad data from daughter board:  ["+data[2] + "], ["+data[6]+"]" );
			}
			else {

				this.windSpeed     = Utils.buffToInt( data, 0, 2 );
				this.windDirection = Utils.buffToInt( data, 3, 3 );
			}

			this.inWindCallback = false;
		}.bind(this));
	}
	catch( exp ) {
		this.windError      = "error in fetching wind: " + exp ;
		this.inWindCallback = false;
	}
}

/**
 * get the temp/humidity
 */
WeatherI2c.prototype.fetchTempHumidity = function() { 

	this.inTempCallback = true;
	this.tempError      = undefined;

	var that = this;

	try {
		// this might throw an exception - in waking up the device
		//
		var b = new Buffer(['a']);
		this.i2cTempHumid.write( b );
		Sleep.msleep( 2 );
	}
	catch( exp ) {}

	try {
		// write to register, then wait a bit
		//
		that.i2cTempHumid.write( new Buffer( [AM2315_READREG, 0, 4]) );
		Sleep.msleep( 10 );

		// now get the data
		//
		that.i2cTempHumid.read( null, 8, function( data ) {

			console.log( "data = " + data );

			if( data === null ) {
				that.tempError = "skipping temp/humidity due to error " ;
				console.log( that.tempError );
			}
			else if( data[0] != AM2315_READREG ) {
				that.tempError = "i2c: temp/humidity: error reading AM2315_READREG";
				console.log( that.tempError );
			}
			else if( data[1] != 4 ) {
				// bytes req'd not correct
				//
				that.tempError = "i2c: temp/humidity: error reading number of bytes: " + data[1];
				console.log( that.tempError );
			}
			else {
		  		var h = (data[2] * 256 + data[3]) / 10;
		  		var t = ((data[4] & 0x7F) * 256 + data[5]) / 10;

		  		// change sign
		  		//
				if( data[4] >> 7 ) {
					t= -t;
				}

				that.temperature = Math.round( (t * 1.8) + 32 );
				that.humidity    = Math.round( h );
				console.log( "read temp: " + that.temperature + "F, " + Math.round(t) + "C, humidity: " + that.humidity );
			}
			that.inTempCallback = false;
		}.bind(this));
	}
	catch( exp ) {
		this.tempError = "error fetching temp: " + exp;
		this.inTempCallback = false;
		console.log( this.tempError );
	}
}

module.exports.WeatherI2c = WeatherI2c;
