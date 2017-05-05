/**
 * boat controller server master
 */
var server                 = require( "../../../../library/nodejs/client-server/server" );
var Router                 = require( "../../../../library/nodejs/client-server/router" );
var IKommunicate           = require( "../../../../library/nodejs/signalk/IKommunicate" );
var serverRequestHandlers  = require( "./WeatherRequestHandlers" );

var router       = new Router();
var iKommunicate = new IKommunicate.IKommunicate();

iKommunicate.findIpAddress( function( ipAddress ) {
    console.log( "found iKommunicate at " + ipAddress );
});

router.addRoute( "/query", new serverRequestHandlers.query );
router.addRoute( "/data",  new serverRequestHandlers.data( iKommunicate ) );

console.log( "starting weather station" );
server.start( router );