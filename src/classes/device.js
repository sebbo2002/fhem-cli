'use strict';

/**
 * @class DeviceClass
 */
class DeviceClass {

    /**
     * Constructor
     * @param {String} name
     */
    constructor (name) {
        this._name = name;
        this._attributes = {};
        this._definition = [null, null];
    }

    getName () {
        return this._name;
    }

    setDefinition (definition, file = null) {
        this._definition = [definition, file];
    }

    getDefinition () {
        return this._definition[0];
    }

    getLine () {
        return this._definition[1];
    }

    getAttibutes () {
        return this._attributes;
    }

    getAttibute (name) {
        return this._attributes[name] || null;
    }

    setAttribute (name, value, file = null) {
        this._attributes[name] = [value, file];
    }
}

module.exports = DeviceClass;