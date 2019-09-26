'use strict';

const soap = require('soap-as-promised');
const { send } = require('micro');
const moment  = require('moment');
const jsonselect = require('JSONSelect');
const { router, get } = require('microrouter')

const processLevels = (result) => {
    const data = {};
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

        if (!Object.prototype.hasOwnProperty.call(data, stationId)) {
            data[stationId] = {
                stationName,
                latitude,
                longitude,
                levels: []
            };
        }
        
        data[stationId].levels.push({
            datetime,
            level
        });
    });
    return data;
}

const levels = async (req, res) => {
    const endpoint = 'https://ws-shc.qc.dfo-mpo.gc.ca/predictions?wsdl';
    const requestArgs = {
        dataName: 'hilo',
        latitudeMin: parseFloat(req.params.latitude) - 0.2,
        latitudeMax: parseFloat(req.params.latitude) + 0.2,
        longitudeMin: parseFloat(req.params.longitude) - 0.2,
        longitudeMax: parseFloat(req.params.longitude) + 0.2,
        depthMin: 0,
        depthMax: 0,
        dateMin: moment().format('YYYY-MM-DD HH:mm:ss'), // UTC
        dateMax: moment().add(2, 'days').format('YYYY-MM-DD HH:mm:ss'), // UTC
        start: 1,
        sizeMax: 100,
        metadata: true,
        metadataSelection: '',
        order: 'asc'
    };

    const response = await soap.createClient(endpoint)
    .then((client) => client.search(requestArgs)
    .then((result) => {
        return {
            code: 200,
            data: processLevels(result)
        };
    })
    .catch((error) => {
        return {
            code: 500,
            data: error
        }
    }));

    send(res, response.code, response.data);
}

module.exports = router(get('/levels/:latitude/:longitude', levels))
