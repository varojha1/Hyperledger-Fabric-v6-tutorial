'use strict';

/**
@author: Varun Ojha
@version: 1.0
@date: 02/05/2016
@Description: Cloudant datastore. Establishes connection with the cloudant service and caches db instance(s)
**/

var Promise = require('bluebird');
var Map = require('collections/map');
var dbCache = new Map();
var Cloudant = require('cloudant');

var logHelper = require('../logging/logging.js');
var logger = logHelper.getLogger('datastore.js');
var validate = require('../utils/validation_helper.js');
var constants = require('../constants/constants.js');

var cloudant;
var dbGet, dbCreate;
var config;


module.exports = {
	init: init,
	initSync: initSync,
	getDbInstance: getDbInstance
};

/**
Initialize the datastore with the appropriate config
**/
function init(config){
	
	return new Promise(function(resolve, reject){
		try{
			logHelper.logEntryAndInput(logger, 'init', config);
			
			

			if(!validate.isValidJson(config)){
				logHelper.logError(logger, 'init', 'config is invalid');
				return reject({statusCode: constants.INVALID_INPUT, body: "config is invalid"});
			}

			var credentials = config.credentials;
			if(!validate.isValidJson(credentials)){
				logHelper.logError(logger, 'init', 'credentials are invalid');
				return reject({statusCode: constants.INVALID_INPUT, body: "credentials are invalid"});
			}

			var url = credentials.url;
			if(!validate.isValidString(url)){
				logHelper.logError(logger, 'init', 'url is invalid');
				return reject({statusCode: constants.INVALID_INPUT, body: "url is invalid"});
			}

			if(validate.isValid(cloudant) && validate.isValid(dbGet) && validate.isValid(dbCreate)){
				logHelper.logMessage(logger, 'init', 'datastore is already initialized');
				return resolve({statusCode: constants.SUCCESS_NO_CHANGE, body: 'datastore is already initialized' });
			}

			cloudant = Cloudant(url);
			dbGet = Promise.promisify(cloudant.db.get);
			dbCreate = Promise.promisify(cloudant.db.create);
			config = config;
			
			logHelper.logMessage(logger, 'init', 'datastore successfully initialized with config ',config);
			return resolve({statusCode: 200, body: 'datastore successfully initialized'});
			
		}
		catch(error){

			logHelper.logError(logger, 'init', 'error occurred while initiazing datastore', error);
			return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: error});

		}
	});
		

}

/**
Initialize the datastore with the appropriate config in a synchronous manner
**/
function initSync(config){
	
	
		try{
			logHelper.logEntryAndInput(logger, 'init', config);
			
			if(validate.isValid(cloudant) && validate.isValid(dbGet) && validate.isValid(dbCreate)){
				logHelper.logMessage(logger, 'init', 'datastore is already initialized');
				return {statusCode: constants.SUCCESS_NO_CHANGE, body: 'datastore is already initialized' };
			}

			if(!validate.isValidJson(config)){
				logHelper.logError(logger, 'init', 'config is invalid');
				return {statusCode: constants.INVALID_INPUT, body: "config is invalid"};
			}

			var credentials = config.credentials;
			if(!validate.isValidJson(credentials)){
				logHelper.logError(logger, 'init', 'credentials are invalid');
				return {statusCode: constants.INVALID_INPUT, body: "credentials are invalid"};
			}

			var url = credentials.url;
			if(!validate.isValidString(url)){
				logHelper.logError(logger, 'init', 'url is invalid');
				return {statusCode: constants.INVALID_INPUT, body: "url is invalid"};
			}

			cloudant = Cloudant(url);
			dbGet = Promise.promisify(cloudant.db.get);
			dbCreate = Promise.promisify(cloudant.db.create);
			config = config;
			
			return {statusCode: constants.SUCCESS, body: 'datastore successfully initialized'};
			
		}
		catch(error){

			logHelper.logError(logger, 'init', 'error occurred while initiazing datastore', error);
			return {statusCode: constants.INTERNAL_SERVER_ERROR, body: error};

		}
	
		

}


/**
Returns dbInstance from the cache. If db does not exist, creates it and adds it to cache
**/

function getDbInstance(dbName){
	
	return new Promise(function(resolve, reject){
		try{
			logHelper.logEntryAndInput(logger, 'getDbInstance', dbName);

			if(!validate.isValidString(dbName)){
				logHelper.logMessage(logger, 'getDbInstance', 'dbName is not valid');
				return reject({statusCode: constants.INVALID_INPUT, body: 'dbName is not valid'});
			}
			
			var dbInstance = dbCache.get(dbName, null);
			if(validate.isValid(dbInstance)){
				return resolve({statusCode: constants.SUCCESS, body: dbInstance});
			}


			dbGet(dbName)
			.then(function(resp){
				logHelper.logMessage(logger, 'getDbInstance', dbName+' already exists.');
			}, function(resp){
				logHelper.logError(logger, 'getDbInstance', dbName+' does not exist. Creating...');
				return dbCreate(dbName);
			})
			.then(function(resp){
				dbInstance = cloudant.db.use(dbName);
				dbCache.set(dbName, dbInstance);
				return resolve({statusCode: constants.SUCCESS, body: dbInstance});
			})
			.catch(function(err){
				logHelper.logError(logger, 'getDbInstance', 'could not fetch dbInstance for '+dbName, err);
				return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'could not fetch dbInstance for '+dbName});
			});
		}
		catch(error){
			logHelper.logError(logger, 'getDbInstance', 'could not fetch dbInstance for '+dbName, error);
			return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'could not fetch dbInstance for '+dbName});

		}
		

	});
}

