'use strict';

/**
@author: Varun Ojha
@version: 1.0
@date: 04/04/2017
@Description: Cloudant KeyValue store model for storing member certs
**/

var Promise = require('bluebird');
var _ = require('underscore');

var logHelper = require('../../logging/logging.js');
var logger = logHelper.getLogger('kv_store_model');
var validate = require('../../utils/validation_helper.js');
var constants = require('../../constants/constants.js');
var datastore = require('../../database/datastore.js');


var dbName;
var dbInstance;



class CloudantKeyValStore{

	constructor(dbName, dbInstance){
		logHelper.logMethodEntry('CloudantKeyValStore');
		if(!validate.isValidString(dbName)){
			logHelper.logError(logger, 'KeyValueStoreModel', 'dbName is invalid');
			throw new Error('Could not create KeyValueStoreModel. dbName is invalid');
		}

		if(!validate.isValid(dbInstance)){
			logHelper.logError(logger, 'KeyValueStoreModel', 'dbInstance is invalid');
			throw new Error('Could not create KeyValueStoreModel. dbInstance is invalid')
		}

		this.dbName = dbName;
		this.dbInstance = dbInstance;

		return this;
	}

	/**
     * Get the value associated with name.
     * @param name
     * @param cb function(err,value)
     */
    getValue(name, callback) {
		try{
			this.get({id: name})
			.then(function(resp){
				var body = resp.body;
				var retValue = null;
				if(validate.isValidJson(body)){
					retValue = JSON.stringify(body);
				}
				return callback(null, retValue);
			})
			.catch(function(err){
				return callback(err);
			})
		}
		catch(err){
			return callback(err);
		}
    }

    /**
     * Set the value associated with name.
     * @param name
     * @param cb function(err)
     */
    setValue(name, value, callback) {
		try{
			
			this.create({id:name, data:value})
			.then(function(resp){
				return callback(null, resp.body);
			})
			.catch(function(err){
				return callback(err);
			})
		}
		catch(err){
			return callback(err);
		}
    }

/**
Gets a member object by member ID
**/

 get(params){
	var keyValueStoreObject = this;

	return new Promise(function(resolve, reject){
		try{
			logHelper.logEntryAndInput(logger, 'get', params);
			if(!validate.isValidJson(params)){
				logHelper.logError(logger, 'get', 'params are invalid');
				return reject({statusCode: constants.INVALID_INPUT, body: 'params are invalid' });
			}

			var id = params.id;
			if(!validate.isValidString(id)){
				logHelper.logError(logger, 'get', 'id is invalid');
				return reject({statusCode: constants.INVALID_INPUT, body: 'id is invalid' });
			}


			var get = Promise.promisify(keyValueStoreObject.dbInstance.get);

			get(id)
			.then(function(resp){
				logHelper.logMessage(logger, 'get', 'successfully fetched member file with id '+id);
				return resolve({statusCode: constants.SUCCESS, body: resp})
			})
			.catch(function(err){
				var statusCode = err.statusCode;
				var isRegular = false;
				if(validate.isValid(params.executeRegular)){
					isRegular = params.executeRegular;
				}
				
				if(statusCode == '404' && isRegular == false ){
					logHelper.logMessage(logger, 'get', 'member file with id '+id+' does not exist',err);
					return resolve({statusCode: constants.SUCCESS, body: null})
				}
				logHelper.logError(logger, 'get', 'could not fetch member file with id '+id,err);
				var statusCode = err.statusCode || constants.INTERNAL_SERVER_ERROR;
				return reject({statusCode: statusCode, body: 'could not fetch member file with id '+id});
			});

			

		}
		catch(error){
			logHelper.logError(logger, 'get', 'Error occurred while fetching member file with id '+id, error);
			return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Error occurred while fetching member file with id '+id });
		}
	});
}

/**
Creates a new member object
**/

create(params){
	var keyValueStoreObject = this;

	return new Promise(function(resolve, reject){
		
		try{
			logHelper.logEntryAndInput(logger, 'create', params);
			if(!validate.isValidJson(params)){
				logHelper.logError(logger, 'create', 'params are invalid');
				return reject({statusCode: constants.INVALID_INPUT, body: 'params are invalid' });
			}

			var dataStr = params.data;
			if(!validate.isValidString(dataStr)){
				logHelper.logError(logger, 'create', 'dataStr is invalid');
				return reject({statusCode: constants.INVALID_INPUT, body: 'dataStr is invalid' });
			}

			var id = params.id;
			if(!validate.isValidString(id)){
				logHelper.logError(logger, 'create', 'id is invalid');
				return reject({statusCode: constants.INVALID_INPUT, body: 'id is invalid' });
			}

			var data = JSON.parse(dataStr);
			var insert = Promise.promisify(keyValueStoreObject.dbInstance.insert);
			var isUpdate = false;
			
			keyValueStoreObject.get({id: id, executeRegular: true})
			.then(function(resp){
				//update
				var oldDoc = resp.body;
				data['_id'] = oldDoc['_id']
				data['_rev'] = oldDoc['_rev'];
				isUpdate = true;

			}, function(err){
				//insert
				var lastModified = new Date();
				_.extend(data, {type: constants.MODEL_KEYVALUESTORE, lmd: lastModified});
			})
			.then(function(resp){
				if(isUpdate == true){
					return insert(data);
				}
				else{
					return insert(data, id);
				}
			})
			.then(function(resp){
				logHelper.logMessage(logger, 'create', 'member file successfully created');
				return resolve({statusCode: constants.SUCCESS, body: data })
			})
			.catch(function(err){
				logHelper.logError(logger, 'create', 'member file creation failed',err);
				return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'member file creation failed'});
			});
			
			

			/*TODO: Schema validation should be done to ensure mandatory fields are included and all fields have
			expected data types*/
			

		}
		catch(error){
			logHelper.logError(logger, 'create', 'Error occurred while creating member file', error);
			return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'member file creation failed' });
		}

	});

}



}


module.exports = CloudantKeyValStore;





