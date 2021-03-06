/**
 * weather-i2c - get the data via i2c
 */
var Utils        = require( '../node-lib/Utils' );
var Sleep        = require('sleep');
var IKommunicate = require( "../node-lib/signalk/IKommunicate" );

var GET_ADDRESS     = 0x61;
var SET_ADDRESS     = 0x41;
var WIND_VANE_ADDR	= 4;
var TEMP_HUMID_ADDR = 0x5c;
var AM2315_READREG  = 0x03;

/**
 * get the data via i2c from the daughter board
 * daughter board is : 
 */
function WeatherI2c( responseHandler ) {

    this.i2cWindVane  = responseHandler.getI2Caddress( 2, WIND_VANE_ADDR );
    this.i2cTempHumid = responseHandler.getI2Caddress( 2, TEMP_HUMID_ADDR );

    if( this.i2cWindVane === undefined || this.i2cTempHumid === undefined ) {
    	return undefined;
    }

    this.iKommunicate            = new IKommunicate.IKommunicate();
    this.lastIKommunicateHeading = 0;
    this.windSpeed               = 0;
    this.windDirection           = 0;
    this.temperature             = 0;
    this.humidity                = 0;
	this.tempError               = undefined;
	this.windError               = undefined;
	this.inWindCallback          = false;
	this.inTempCallback          = false;

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

			if( data === null || data === undefined ||  data[2] != 45 || data[6] != 33 ) {

				if( data !== null && data !== undefined ) {
					console.log( "bad data from daughter board:  ["+data[2] + "], ["+data[6]+"]" );
				}
				else {
					console.log( "no data from daughter board" );
				}
				this.windSpeed     = -1;
				this.windDirection = -1;
			}
			else {

        		if( this.iKommunicate.ipAddress !== undefined ) {
        			// save the latest one we have 
        			//
        			this.lastIKommunicateHeading = this.iKommunicate.heading;
				}

				this.windSpeed     = Utils.buffToInt( data, 0, 2 );
				this.windDirection = Utils.buffToInt( data, 3, 3 ) + this.lastIKommunicateHeading;

	            if( this.windDirection < 0 ) {
	                this.windDirection += 360;
	            }
	            else if( this.windDirection > 360 ) {
	                this.windDirection -= 360;
	            }
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
 * probe is : AM2315 - Encased I2C Temperature/Humidity Sensor from adafruit
 */
WeatherI2c.prototype.fetchTempHumidity = function() { 

	this.inTempCallback = true;
	this.tempError      = undefined;

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
		this.i2cTempHumid.write( new Buffer( [AM2315_READREG, 0, 4]) );
		Sleep.msleep( 10 );

		var that = this;

		// now get the data
		//
		that.i2cTempHumid.read( null, 8, function( data ) {

			console.log( "data = " + data );

			that.temperature = 0;
			that.humidity    = 0;

			if( data === null || data === undefined ) {
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
		this.tempError      = "error fetching temp: " + exp;
		this.inTempCallback = false;
		console.log( this.tempError );
	}
}

module.exports.WeatherI2c = WeatherI2c;
