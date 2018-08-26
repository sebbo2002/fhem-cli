'use strict';

/**
 * @class Configuration
 */
class Configuration {
    constructor (cwd) {
        const path = require('path');
        this.file = path.normalize(cwd + '/.fhem-cli.json');

        try {
            this.config = require(this.file);
        }
        catch(err) {
            this.config = {};
        }
    }

    save () {
        const fs = require('fs');
        fs.writeFileSync(this.file, JSON.stringify(this.config, null, '  '));
    }

    host (host) {
        if(host === undefined) {
            return this.config.host || null;
        }

        this.config.host = host || null;
        this.save();
    }

    parseHost () {
        const url = require('url').parse('ssh://' + this.host());
        return {
            username: url.auth.split(':')[0],
            host: url.hostname,
            port: url.port
        };
    }

    port (port) {
        if(port === undefined) {
            return this.config.port || null;
        }

        this.config.port = port || null;
        this.save();
    }

    hooks (hooks) {
        if(hooks === undefined) {
            return this.config.hooks || [];
        }

        this.config.hooks = hooks || [];
        this.save();
    }
}

module.exports = Configuration;