var querystring    = require( "querystring" ),
    fs             = require( "fs" ),
    url            = require( "url" ),
    formidable     = require( "formidable" ),
    WeatherI2c     = require( "./weather-i2c" );

var nodeDesc = {
    "big-red-button-reciever" : false,
    "SSID-config"             : false,                              // if we can change the SSID (bluetooth). This will, potentially, reboot the device
    "nodeType"                : ["weather"],
    "socket"                  : NetUtils.CommonPorts.DEVICE_HTTP
    "name"                    : "weather station",
    "hardware"                : "chip",
    "battery"                 : false,                                // if running off a battery
    "id"                      : 102,                                  // each entity has an ID, the name is known by the controller
    
    // of of these for each of the node types
    //
    "weather" : {
        "queryAvailable" : true,
        "functions"      : ["wind-speed", "wind-direction", "rainfall"]
    }
};

/**
 * query the device for it's capabilities
 */
function query( ) {
    
    this.responder = function( response, request, params ) {

        response.writeHead(200, {"Content-Type": "application/json", });
        response.write(JSON.stringify(nodeDesc));
        response.end(); 
    }
}

/**
 * query the device for it's data
 */
function data( ik ) {
    
    // need to find the iKommunicate
    //
    this.iKommunicate = ik;
    this.weatherI2c   = new WeatherI2c.WeatherI2c();
    that              = this;

    // server response
    //
    this.responder = function( response, request, params ) {

        var result = new Object();

        if( that.weatherI2c.tempError !== undefined ) {
            result["tempError"] = that.weatherI2c.tempError;
        }
        else {
            result["temperature"] = that.weatherI2c.temperature;
            result["humidity"]    = that.weatherI2c.humidity;
        }

        if( that.weatherI2c.windError !== undefined ) {
            result["windError"] = that.weatherI2c.windError;
        } 
        else if( that.iKommunicate.ipAddress === undefined ){
            result["windError"] = "no signalK unit";
        }
        else {
            // adjust the heading according to the real heading via iKommunicate
            //
            var heading = that.weatherI2c.windDirection + that.iKommunicate.heading;

            if( heading < 0 ) {
                heading += 360;
            }
            else if( heading > 360 ) {
                heading -= 360;
            }

            // now post the results
            //
            result["rain"]        = 0;
            result["direction"]   = heading;
            result["speed"]       = that.weatherI2c.windSpeed;
            result["strength"]    = that.getWindStrength( that.weatherI2c.windSpeed );
            result["heading"]     = that.getHeading( heading );
        }

        response.writeHead(200, {"Content-Type": "application/json", });
        response.write(JSON.stringify(result));
        response.end(); 
    }.bind(this);
}

/**
 * Converts compass direction to heading 
 */
data.prototype.getHeading = function ( direction ) { 

    if(direction < 22) 
        return " N"; 
    else if (direction < 67) 
        return " NE"; 
    else if (direction < 112) 
        return " E"; 
    else if (direction < 157) 
        return " SE"; 
    else if (direction < 212) 
        return " S"; 
    else if (direction < 247) 
        return " SW"; 
    else if (direction < 292) 
        return " W"; 
    else if (direction < 337) 
        return " NW"; 
    else 
        return " N"; 
} 

/**
 * converts wind speed to wind strength 
 */
data.prototype.getWindStrength = function ( speed ) { 

    if(speed < 2) 
        return "Calm";
    else if(speed >= 2 && speed < 4) 
        return "Light Air"; 
    else if(speed >= 4 && speed < 8) 
        return "Light Breeze"; 
    else if(speed >= 8 && speed < 13) 
        return "Gentle Breeze"; 
    else if(speed >= 13 && speed < 18) 
        return "Moderate Breeze"; 
    else if(speed >= 18 && speed < 25) 
        return "Fresh Breeze"; 
    else if(speed >= 25 && speed < 31) 
        return "Strong Breeze"; 
    else if(speed >= 31 && speed < 39) 
        return "Near Gale"; 
    else 
        return "RUN"; 
}


exports.query = query;
exports.data  = data;

