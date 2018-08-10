'use strict';

const { soap } = require('strong-soap');
const { send } = require('micro');
const moment  = require('moment');
const jsonselect = require('JSONSelect');
const { router, get } = require('microrouter')

const levels = async (req, res) => {
    const endpoint = 'https://ws-shc.qc.dfo-mpo.gc.ca/predictions?wsdl';
    const requestArgs = {
        dataName: 'hilo',
        latitudeMin: parseFloat(req.params.latitude) - 0.2,
        latitudeMax: parseFloat(req.params.latitude) + 0.2,
        longitudeMin: parseFloat(req.params.longitude) - 0.2,
        longitudeMax: parseFloat(req.params.longitude) + 0.2,
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

    soap.createClient(endpoint, {}, async (err, client) => {
        if (err) {
            send(res, 500, 'Service not available.');
        }
        client.search(requestArgs).then(({result}) => {
            console.log(result);
            const data = [];
            result.searchReturn.data.data.forEach(value => {
                const datetime = jsonselect.match(
                    'object:root .boundaryDate .min ."$value"',
                    value
                )[0];
                const stationId = jsonselect.match(
                    'object:root .metadata ."$value"',
                    value
                )[1];
                const stationName = jsonselect.match(
                    'object:root .metadata ."$value"',
                    value
                )[3];
                const latitude = jsonselect.match(
                    'object:root .spatialCoordinates .latitude ."$value"',
                    value
                )[0];
                const longitude = jsonselect.match(
                    'object:root .spatialCoordinates .longitude ."$value"',
                    value
                )[0];
                const level = jsonselect.match(
                    'object:root > .value ."$value"',
                    value
                )[0];
                data.push({
                    datetime,
                    stationId,
                    stationName,
                    latitude,
                    longitude,
                    level
                });
            });
            console.log(data);
          }, (err) => {
            console.error(err);
          });
    });
    send(res, 200, {});
}

module.exports = router(get('/levels/:latitude/:longitude', levels))
