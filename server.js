/**
 * boat controller server master
 */
var server                 = require( "../libs/node-lib/client-server/server" );
var Router                 = require( "../libs/node-lib/client-server/router" );
var serverRequestHandlers  = require( "./WeatherRequestHandlers" );
var router                 = new Router();

router.addRoute( "/query", new serverRequestHandlers.query );
router.addRoute( "/data",  new serverRequestHandlers.data() );

console.log( "starting weather station" );
server.start( router );