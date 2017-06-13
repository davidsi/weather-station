/**
 * boat controller server master
 */
var server                 = require( "../libs/node-lib/client-server/server" );
var Router                 = require( "../libs/node-lib/client-server/router" );
var serverRequestHandlers  = require( "./WeatherRequestHandlers" );
// var IKommunicate           = require( "../libs/node-lib/signalk/IKommunicate" );

var router       = new Router();
// var iKommunicate = new IKommunicate.IKommunicate();

// iKommunicate.findIpAddress( function( ipAddress ) {
//     console.log( "found iKommunicate at " + ipAddress );
// });

router.addRoute( "/query", new serverRequestHandlers.query );
router.addRoute( "/data",  new serverRequestHandlers.data( /*iKommunicate*/ ) );

console.log( "starting weather station" );
server.start( router );