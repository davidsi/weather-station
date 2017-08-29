/**
 * boat controller server master
 */
var serverRequestHandlers  = require( "./WeatherRequestHandlers" );

/**
 * main entry point for all the micro-servers.
 */
function MicroProcess( router, resourceHandler ) {

	var weatherServer = new weatherServer( resourceHandler );

	router.addRoute( "/data",  new serverRequestHandlers.data( resourceHandler ) );

	// router.addRoute( “windSpeed”,     new WindSpeed( weatherServer) );
	// router.addRoute( “windDirection”, new WindsDirection( weatherServer) );
	// router.addRoute( “windHeading”,   new WindHeading( weatherServer) );
	// router.addRoute( “rainFall”,      new RainFall( weatherServer) );
	// router.addRoute( “temperature”,   new Temperature( weatherServer) );
	// router.addRoute( “humidity,       new Humidity( weatherServer) );
}

module.exports = MicroProcess;