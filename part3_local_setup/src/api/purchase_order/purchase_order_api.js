'use strict';

/**
@author: Varun Ojha
@version: 1.0
@date: 19/02/2017
@Description: Purchase Order API for CRUD operations
**/

var config = require('config');
var Promise = require('bluebird');
var _ = require('underscore');
var uuid = require('uuid');

var logHelper = require('../../logging/logging.js');
var logger = logHelper.getLogger('purchase_order_api.js');
var validate = require('../../utils/validation_helper.js');
var constants = require('../../constants/constants.js');
var util = require('../../utils/util.js');
var bcSdk = require('../../blockchain/blockchain_sdk.js');
var datastore = require('../../database/datastore.js');
var modelFactory = require('../../database/model_factory.js');
var dbName = config.databases[constants.APP_MASTER_DB];

module.exports = {
    create: createPurchaseOrder,
    update: updatePurchaseOrder,
    get: getPurchaseOrder
};

/**
 * Creates the purchase order in the database as well as blockchain
 */
function createPurchaseOrder(params){
    
    return new Promise(function(resolve, reject){
        
        try{
            logHelper.logEntryAndInput(logger, 'createPurchaseOrder', params);


            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'createPurchaseOrder', 'params are invalid');
                return reject({statusCode: constants.INVALID_INPUT, body: 'params are invalid' });
            }

            var user = params.user;
            if(!validate.isValidString(user)){
                logHelper.logError(logger, 'createPurchaseOrder', 'user is invalid');
                return reject({statusCode: constants.INVALID_INPUT, body: 'user is invalid' });
            }

            var company = params.company;
            if(!validate.isValidString(company)){
                logHelper.logError(logger, 'createPurchaseOrder', 'company is invalid');
                return reject({statusCode: constants.INVALID_INPUT, body: 'company is invalid' });
            }

            var purchaseOrder = params.purchaseOrder;
            if(!validate.isValidJson(purchaseOrder)){
                logHelper.logError(logger, 'createPurchaseOrder', 'PurchaseOrder is invalid');
                return reject({statusCode: constants.INVALID_INPUT, body: 'PurchaseOrder is invalid' });
            }

            
            var model;

            var wbId = uuid.v1();

            purchaseOrder.id = wbId;
            purchaseOrder.lastModifiedBy = user;
            purchaseOrder.status = constants['STATUS_SUBMITTED'];

            modelFactory.getModel(constants.MODEL_PO, dbName)
            .then(function(resp){
                model = resp.body;
                return bcSdk.createPurchaseOrder({user: company, purchaseOrder: purchaseOrder})
                
            })
            .then(function(resp){
                return model.create({purchaseOrder: purchaseOrder});
            })
            
            .then(function(resp){
                logHelper.logMessage(logger, 'createPurchaseOrder', 'Successfully created purchase order ', resp.body);
                return resolve({statusCode: constants.SUCCESS, body: resp.body})
            })
           
            .catch(function(err){
                logHelper.logError(logger, 'createPurchaseOrder', 'could not create PurchaseOrder ', err);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: err})
            });
            
            
            

        }
        catch(error){
            logHelper.logError(logger, 'createPurchaseOrder', 'could not create PurchaseOrder', error);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'could not create PurchaseOrder' });
        }

    });

}

function updatePurchaseOrder(params){
    
    return new Promise(function(resolve, reject){
        
        try{
            logHelper.logEntryAndInput(logger, 'updatePurchaseOrder', params);


            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'updatePurchaseOrder', 'params are invalid');
                return reject({statusCode: constants.INVALID_INPUT, body: 'params are invalid' });
            }

            var user = params.user;
            if(!validate.isValidString(user)){
                logHelper.logError(logger, 'updatePurchaseOrder', 'user is invalid');
                return reject({statusCode: constants.INVALID_INPUT, body: 'user is invalid' });
            }

            var company = params.company;
            if(!validate.isValidString(company)){
                logHelper.logError(logger, 'updatePurchaseOrder', 'company is invalid');
                return reject({statusCode: constants.INVALID_INPUT, body: 'company is invalid' });
            }

            var purchaseOrder = params.purchaseOrder;
            if(!validate.isValidJson(purchaseOrder)){
                logHelper.logError(logger, 'updatePurchaseOrder', 'PurchaseOrder is invalid');
                return reject({statusCode: constants.INVALID_INPUT, body: 'PurchaseOrder is invalid' });
            }

            var model;
            var wbId = purchaseOrder.id;
            if(!validate.isValidString(wbId)){
                logHelper.logError(logger, 'updatePurchaseOrder', 'id is invalid');
                return reject({statusCode: constants.INVALID_INPUT, body: 'id is invalid' });
            }

            modelFactory.getModel(constants.MODEL_PO, dbName)
            .then(function(resp){
                model = resp.body;
                return bcSdk.updatePurchaseOrder({user: company, purchaseOrder: purchaseOrder})
                
            })
            .then(function(resp){
                return model.update({purchaseOrder: purchaseOrder, id: wbId});
            })
            .then(function(resp){
                logHelper.logMessage(logger, 'updatePurchaseOrder', 'Successfully updated purchase order', resp.body);
                return resolve({statusCode: constants.SUCCESS, body: resp.body})
            })
           
            .catch(function(err){
                logHelper.logError(logger, 'updatePurchaseOrder', 'could not update purchase order', err);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: err})
            });
            
            
            

        }
        catch(error){
            logHelper.logError(logger, 'updatePurchaseOrder', 'could not update purchase order', error);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'could not update purchase order' });
        }

    });

}

function getPurchaseOrder(params){
    
    return new Promise(function(resolve, reject){
        
        try{
            logHelper.logEntryAndInput(logger, 'getPurchaseOrder', params);


            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'getPurchaseOrder', 'params are invalid');
                return reject({statusCode: constants.INVALID_INPUT, body: 'params are invalid' });
            }

            var user = params.user;
            if(!validate.isValidString(user)){
                logHelper.logError(logger, 'getPurchaseOrder', 'user is invalid');
                return reject({statusCode: constants.INVALID_INPUT, body: 'user is invalid' });
            }

            var model;
            var wbId = params.id;
            if(!validate.isValidString(wbId)){
                logHelper.logError(logger, 'getPurchaseOrder', 'id is invalid');
                return reject({statusCode: constants.INVALID_INPUT, body: 'id is invalid' });
            }


           modelFactory.getModel(constants.MODEL_PO, dbName)
            .then(function(resp){
                model = resp.body;
                //Fetch the purchase order from ERP DB directly rather than blockchain.
                //ERP DB would have been synced up with blockchain using event handler
                return model.get({id: wbId});
                
            })
            .then(function(resp){
                logHelper.logMessage(logger, 'getPurchaseOrder', 'Successfully fetched purchase order ', resp.body);
                return resolve({statusCode: constants.SUCCESS, body: resp.body})
            })
           
            .catch(function(err){
                logHelper.logError(logger, 'getPurchaseOrder', 'could not fetch purchase order ', err);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: err})
            });
            
            
            

        }
        catch(error){
            logHelper.logError(logger, 'getPurchaseOrder', 'could not fetch purchase order', error);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'could not fetch purchase order' });
        }

    });

}


