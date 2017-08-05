'use strict';

const hapi = require('hapi');
const soap = require('strong-soap').soap;
const moment = require('moment');
const jsonselect = require('JSONSelect');

const server = new hapi.Server();
server.connection({
    host: 'localhost',
    port: 8000
});

// Add the route
server.route({
    method: 'GET',
    path: '/levels/{latitude},{longitude}/',
    handler: function(request, reply) {
        const endpoint = 'https://ws-shc.qc.dfo-mpo.gc.ca/predictions?wsdl';

        const requestArgs = {
            dataName: 'hilo',
            latitudeMin: parseFloat(request.params.latitude) - 0.2,
            latitudeMax: parseFloat(request.params.latitude) + 0.2,
            longitudeMin: parseFloat(request.params.longitude) - 0.2,
            longitudeMax: parseFloat(request.params.longitude) + 0.2,
            depthMin: 0.0,
            depthMax: 0.0,
            dateMin: moment().format('YYYY-MM-DD HH:mm:ss'), // UTC
            dateMax: moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss'), // UTC
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
                let data = [];
                result.searchReturn.data.data.forEach(value => {
                    let datetime,
                        station_id,
                        station_name,
                        latitude,
                        longitude,
                        level;
                    datetime = jsonselect.match(
                        'object:root .boundaryDate .min ."$value"',
                        value
                    )[0];
                    station_id = jsonselect.match(
                        'object:root .metadata ."$value"',
                        value
                    )[1];
                    station_name = jsonselect.match(
                        'object:root .metadata ."$value"',
                        value
                    )[3];
                    latitude = jsonselect.match(
                        'object:root .spatialCoordinates .latitude ."$value"',
                        value
                    )[0];
                    longitude = jsonselect.match(
                        'object:root .spatialCoordinates .longitude ."$value"',
                        value
                    )[0];
                    level = jsonselect.match(
                        'object:root > .value ."$value"',
                        value
                    )[0];
                    data.push({
                        datetime: datetime,
                        station_id: station_id,
                        station_name: station_name,
                        latitude: latitude,
                        longitude: longitude,
                        level: level
                    });
                });
                reply(data);
            });
        });
    }
});

// Start the server
server.start(err => {
    if (err) {
        throw err;
    }
});
