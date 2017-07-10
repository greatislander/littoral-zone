'use strict';

const Hapi = require('hapi');
const soap = require('strong-soap').soap;

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 8000
});

// Add the route
server.route({
  method: 'GET',
  path:'/hello',
  handler: function (request, reply) {
    const url = 'https://ws-shc.qc.dfo-mpo.gc.ca/predictions?wsdl';
    const requestArgs = {
      dataName: 'hilo',
      latitudeMin: 43.7959,
      latitudeMax: 44.3592,
      longitudeMin: -65.1201,
      longitudeMax: -64.1574,
      depthMin: 0.0,
      depthMax: 0.0,
      dateMin: '2017-08-01 00:00:00', // UTC
      dateMax: '2017-08-01 23:59:59', // UTC
      start: 1,
      sizeMax: 100,
      metadata: false,
      metadataSelection: [
        'station_name'
      ],
      order: 'asc'
    };
    const options = {};

    soap.createClient(url, options, function(err, client) {
      const method = client['search'];
      method(requestArgs, function(err, result, envelope, soapHeader) {
        reply( result );
      });
    });
  }
});

// Start the server
server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});
