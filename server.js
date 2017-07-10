'use strict';

const hapi = require('hapi');
const soap = require('strong-soap').soap;
const moment = require ('moment');

const server = new hapi.Server();
server.connection({
    host: 'localhost',
    port: 8000
});

// Add the route
server.route({
  method: 'GET',
  path:'/levels/{latitude},{longitude}/',
  handler: function (request, reply) {
    const endpoint = 'https://ws-shc.qc.dfo-mpo.gc.ca/predictions?wsdl';

    const requestArgs = {
      dataName: 'hilo',
      latitudeMin: parseFloat(request.params.latitude) - 0.2,
      latitudeMax: parseFloat(request.params.latitude) + 0.2,
      longitudeMin: parseFloat(request.params.longitude) - 0.2,
      longitudeMax: parseFloat(request.params.longitude) + 0.2,
      depthMin: 0.0,
      depthMax: 0.0,
      dateMin: moment().format('YYYY-DD-MM HH:mm:ss'), // UTC
      dateMax: moment().add(1, 'days').format('YYYY-DD-MM HH:mm:ss'), // UTC
      start: 1,
      sizeMax: 100,
      metadata: true,
      metadataSelection: '',
      order: 'asc'
    };

    const options = {};

    soap.createClient(endpoint, options, function(err, client) {
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
