var WeatherI2c = require( "./weather-i2c" );

/**
 * query the device for it's data
 */
function data( rh ) {
    
    this.resourceHandler = rh;

    // need to find the iKommunicate
    //
    this.weatherI2c = new WeatherI2c.WeatherI2c( rh );
    that            = this;

    // server response
    //
    this.responder = function( response, request, params ) {

        var result = new Object();

        if( weatherI2c === undefined ) {
            result["error"] = "no i2c bus available";
        }
        else {
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
            else {
                // adjust the heading according to the real heading via iKommunicate
                //
                var heading = that.weatherI2c.windDirection;

                // now post the results
                //
                result["rain"]        = 0;
                result["direction"]   = heading;
                result["speed"]       = that.weatherI2c.windSpeed;
                result["strength"]    = that.getWindStrength( that.weatherI2c.windSpeed );
                result["heading"]     = that.getHeading( heading );
            }
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

exports.data  = data;

