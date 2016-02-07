'use strict';

//dependencies

var Big = require('big.js');
var mongoose = require('mongoose');
var SchemaType = mongoose.SchemaType;
var CastError = SchemaType.CastError;
var errorMessages = mongoose.Error.messages;

//override valueOf to return javascript Number than string
var valueOf = Big.prototype.valueOf;
Big.prototype.valueOf = function() {
    return Number(valueOf.call(this));
};

/**
 * @constructor
 * @description mongoose bigdecimal SchemaType
 * @param {String} path
 * @param {Object} options
 * @inherits SchemaType
 * @api private
 */
function SchemaBigDecimal(path, options) {
    SchemaType.call(this, path, options, 'BigDecimal');
}


/**
 * @description specifies schema type's name, to defend against 
 *              minifiers that mangle function names.
 * @api private
 */
SchemaBigDecimal.schemaName = 'BigDecimal';


/**
 * @description inherits from mongoose SchemaType
 */
SchemaBigDecimal.prototype = Object.create(SchemaType.prototype);
SchemaBigDecimal.prototype.constructor = Big;


/**
 * @function
 * @description implement checkRequired method
 *              Required validator for bigdecimal schema type
 * @param {any} value
 * @return {Boolean}
 * @private
 */
SchemaBigDecimal.prototype.checkRequired = function checkRequired(value) {
    return (value !== null) && (value instanceof Big);
};


/**
 * @function
 * @description sets a maximum bigdecimal validator
 * @param {BigDecimal} value minimum bigdecimal allowed
 * @param {String} [message] optional custom error message
 * @return {SchemaBigDecimal} this
 * @see Customized Error Messages #error_messages_MongooseError-messages
 * @public
 */
SchemaBigDecimal.prototype.min = function(value, message) {

    if (this.minValidator) {
        this.validators = this.validators.filter(function(v) {
            return v.validator !== this.minValidator;
        }, this);
    }

    if (null !== value) {
        var msg = message || errorMessages.Number.min;
        msg = msg.replace(/{MIN}/, value);

        this.minValidator = function(v) {
            return v !== null && v.gt(value);
        };

        this.validators.push({
            validator: this.minValidator,
            message: msg,
            type: 'min'
        });
    }

    return this;
};


/**
 * @function
 * @description sets a maximum bigdecimal validator
 * @param {Big} value maximum bigdecimal allowed
 * @param {String} [message] optional custom error message
 * @return {SchemaBigDecimal} this
 * @see Customized Error Messages #error_messages_MongooseError-messages
 * @public
 */
SchemaBigDecimal.prototype.max = function(value, message) {

    if (this.maxValidator) {
        this.validators = this.validators.filter(function(v) {
            return v.validator !== this.maxValidator;
        }, this);
    }

    if (null !== value) {
        var msg = message || errorMessages.Number.max;
        msg = msg.replace(/{MAX}/, value);

        this.maxValidator = function(v) {
            return v !== null && v.lt(value);
        };

        this.validators.push({
            validator: this.maxValidator,
            message: msg,
            type: 'max'
        });
    }

    return this;
};


/**
 * @function
 * @description casts to bigdecimal
 * @param {Object} value the value to cast
 * @param {Document} doc document that triggers the casting
 * @param {Boolean} [init]
 * @private
 */
SchemaBigDecimal.prototype.cast = function(value /*,doc , init*/ ) {

    //is null
    if (null === value) {
        return value;
    }

    //is empty string
    if ('' === value) {
        return null;
    }

    //is bigdecimal
    if (value instanceof Big) {
        return value;
    }

    //is number or string
    if ((typeof value === 'string') || (typeof value === 'number')) {
        try {
            return new Big(value);
        } catch (e) {
            throw new CastError('BigDecimal', value, this.path);
        }
    }

    throw new CastError('BigDecimal', value, this.path);
};


/*!
 * ignore
 */
function handleSingle(val) {
    /*jshint validthis:true*/

    return this.cast(val);
}

function handleArray(val) {
    /*jshint validthis:true*/

    if (!Array.isArray(val)) {
        val = [val];
    }

    return val.map(function(m) {
        var cast = this.cast(m);
        return cast.valueOf();
    }.bind(this));

}


//query conditions that are supported for bigdecimal schema types
SchemaBigDecimal.prototype.$conditionalHandlers = {
    '$lt': handleSingle,
    '$lte': handleSingle,
    '$gt': handleSingle,
    '$gte': handleSingle,
    '$ne': handleSingle,
    '$in': handleArray,
    '$nin': handleArray,
    '$mod': handleArray,
    '$all': handleArray
};


/**
 * Casts contents for queries.
 *
 * @param {String} $conditional
 * @param {any} [value] value to be casted for query
 * @private
 */
SchemaBigDecimal.prototype.castForQuery = function($conditional, val) {
    if (arguments.length === 2) {
        var handler = this.$conditionalHandlers[$conditional];

        if (!handler) {
            throw new Error('Can\'t use ' + $conditional + ' with BigDecimal.');
        }

        return handler.call(this, val).valueOf();

    } else {
        return this.cast($conditional).valueOf();
    }

};


//------------------------------------------------------------------------------
// Attach Types
//------------------------------------------------------------------------------

//extend mongoose schema types with bigdecimal type
if (!mongoose.Schema.Types.BigDecimal) {
    mongoose.Schema.Types.BigDecimal = SchemaBigDecimal;
}

//extend mongoose schema types with bigdecimal type
if (!mongoose.Types.BigDecimal) {
    mongoose.Types.BigDecimal = SchemaBigDecimal;
}
