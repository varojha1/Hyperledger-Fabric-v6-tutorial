
var log4js  = require('log4js');
var Dict = require("collections/dict");
var util = require("util");

var validate = require('../utils/validation_helper.js')
//var util = require('../utils/util');
var isInitialized = false;
var loggers = Dict();
var logHelper;



/**
 * Set up logging for processName in environment (prod, staging, qa1, ...)
 * Logging is set up from the log4js config file in ./config/log4js.config.json.
 * Logs go in the ./logs dir, created by this function if they do not exist.
 * Logs are rolling by date; a new log file is created each day. eg: eecymanager-2014-10-21.log
 * See eecymanager for usage.
 * @param {String} processName (eecymain, eecyconsole, ...)
 * @param {String} environment (prod, staging, qa1, ...)
 * @returns {Logger} logger with category processName
 * @public
 */
function init(processName, environment, config) {

    if(isInitialized){
        return;
    }
	
    var fs      = require('fs');
    var path    = require('path');
    var logpath = path.join('logs');
    var logger;

    if (!fs.existsSync(logpath)) {
        fs.mkdirSync(logpath, 448);
    }
    log4js.configure(config);
    log4js.setGlobalLogLevel(log4js.getDefaultLogger().level);

    logger = log4js.getLogger(processName);

    logger.info();
    logger.info("-----------------------------------------------------------------------------");
    logger.info(">>> %s env %s, started %s <<<", processName, environment, new Date());
    logger.info("-----------------------------------------------------------------------------");
    logger.info('Node started via(process.argv): %s', process.argv);
    logger.info('Node version: %s', process.version);
    logger.info('Node and its dependency versions: %j', process.versions);
    logger.info();

    var envString = environment.toLowerCase();
    if (envString !== "local") {
        // don't catch exceptions for local dev environment as it causes Mocha issues
        process.on('exit', function(code) {
            logger.fatal('About to exit with code:', code);
            console.log('About to exit with code:', code);
          });

        process.on('uncaughtException', function(error) {
            var exLogger = log4js.getLogger('exceptions');
            exLogger.setLevel('ERROR');
            // handle the error safely
            exLogger.fatal(error);
            logger.fatal('Node server exiting due to exception: ' + error); // NodeJS guideline for uncaught exceptions
            logger.info();
            logger.info("-------------------------------------------------------------------------------");
            logger.info("!!! %s env %s, exited due to uncaughtException %s !!!", processName, environment, new Date());
            logger.info("-------------------------------------------------------------------------------");
            logger.info();
            //NodeJS guideline for uncaught exceptions
            log4js.shutdown(function() { process.exit(1); });  // get full logs on disk before exiting
        });
    }

     logHelper = log4js.getLogger('loggingHelper');

     return logger;

}

/**
 * This is a proxy for the log4js `getLogger()` method.
 * All modules requiring a logger should make the request through this proxy
 * so that we can track all of the loggers being used across the application.
 * This makes it much easier to change logging levels on the fly without an
 * application restart.
 * @param String name of the logger to be used
 */
function getLogger(name) {
    var logger = loggers.get(name);
    
    if (!validate.isValid(logger)) {
        logger = log4js.getLogger(name);
        
        if (!logger.level) {
            logger.setLevel(log4js.getDefaultLogger().level);
        }        
        
        loggers.set(name, logger);
        
        if(logHelper){
            logHelper.info('Created logger for %s at level %s', name, logger.level);
        }
    }
    
    return logger;
}

/**
 * Returns an object of all registered loggers
 * @returns {___anonymous_loggers}
 */
function getLoggers() {
    return loggers;
}


/**
TODO: Format log messages to json objects that can be consumed by elk
**/

function logMethodEntry(logger, method){
   /* if(logger.isLevelEnabled(log4js.levels.TRACE) && logger && method){
        logger.trace('method : %s entry',method);
    }*/

    if(validate.isValid(logger) && validate.isValid(method)){
    logger.trace('%s : entry',method);
    }
}

function logError(logger, method, msg, json){
    if(validate.isValid(logger) && validate.isValid(method) && validate.isValid(msg)){
        if(typeof json === 'undefined'){
            json = {};
        }

        if(validate.isValidJson(json)){
            logger.error('%s : %s - %j',method, msg, json);
        }
        else{
           
            logger.error('%s : %s - %s',method, msg, logObject(json));
        }
       /* if(typeof msg === 'string'){
        logger.error('%s : %s - %j',method, msg, json);
        }
        else{
            logger.error('%s - %j',method, msg);
        }*/
    }
}

function logMessage(logger, method, msg, json, level){
    if(validate.isValid(logger) && validate.isValid(method) && validate.isValid(msg)){

        var isJson = false;
        if(validate.isValidJson(json)){
            isJson = true;
        }

        
        if(level === log4js.levels.TRACE){
            
            if(isJson){
                logger.trace('%s : %s - %j',method, msg, json);
            }
            else{
                logger.trace('%s : %s - %s',method, msg, logObject(json));
            }
        }
        else if(level === log4js.levels.DEBUG){
            
            if(isJson){
                logger.debug('%s : %s - %j',method, msg, json);
            }
            else{
                logger.debug('%s : %s - %s',method, msg, logObject(json));
            }
        }
        else{
            
            if(isJson){
                logger.info('%s : %s - %j',method, msg, json);
            }
            else{
                logger.info('%s : %s - %s',method, msg, logObject(json));
            }
        }
        
       
    }
}

function logRequest(logger, method, request){
   // if( logger.isLevelEnabled(log4js.levels.TRACE)){
        if(validate.isValid(logger) && validate.isValid(method) && validate.isValid(request)){
        logger.trace("%s - url\"%s\" headers:%s  params:%s body:%s",method, request.originalUrl, 
                logObject(request.headers), logObject(request.params), logObject(request.body ));
        }
   // }
    
}

function logEntryAndInput(logger, method, input){
    /*if( logger.isLevelEnabled(log4js.levels.TRACE)){
        logger.trace("method : %s entry",method);
        logger.trace("method : params - %j ",input); 
    }*/

       if(validate.isValid(logger) && validate.isValid(method) && validate.isValid(input)){
            logger.trace("%s : entry ", method);
            logger.trace("%s : params - %j ",method, input); 
        }
  
    
}

function logJson(logger, method, json){
   // if( logger.isLevelEnabled(log4js.levels.TRACE)){
    if(validate.isValid(logger) && validate.isValid(method) && validate.isValid(json)){
        if(validate.isValidJson(json)){
            logger.trace('%s : %j',method, json);
        }
        else{
            logger.trace('%s : %s',method, logObject(json));
        }
    }
        
   // }
    
}


function logObject(o,depth){
    if(typeof depth !== 'number'){
        depth =1;
    }
    return util.inspect(o,{depth:depth}).replace(/(\r\n|\n|\r)/gm,"")
};


module.exports = {
        initialize : init,
        getLogger: getLogger,
        getLoggers: getLoggers,
        logRequest: logRequest,
        logMethodEntry: logMethodEntry,
        logJson: logJson,
        logEntryAndInput: logEntryAndInput,
        logMessage: logMessage,
        logError: logError
        
};
