'use strict';

const Updater = require('../updater');
const Sentry = require('@sentry/node');
const pkg = require('../../package');
if(!pkg.version && process.env.SENTRY_DSN !== '') {
    Sentry.init({
        dsn: process.env.SENTRY_DSN || 'https://9fd568ebebd540dfacd34984bbd82b68@sentry.sebbo.net/6'
    });
}

/**
 * @class Handler
 */
class Handler {
    constructor (command, parameters) {
        this.command = command;
        this.cwd = process.cwd();
        this.parameters = parameters;
    }

    async run () {
        console.log('');

        try {
            await this._run();
        }
        catch(err) {
            console.log(err);
            process.exit(1);
        }
    }

    async _run () {

        // Step 1: Check if we have a valid project directory here
        if(this.command !== 'init') {
            // @todo check if config exists
            // y: load config
            // n: list project folders, go to first if just one, otherwise ask which one to use
        }

        const updateAvailablePromise = Updater.isUpdateAvailable();

        if(!this[this.command]) {
            throw new Error('Handler: Unable to handle command `' + this.command + '`');
        }

        await this[this.command]();

        const updateAvailable = await updateAvailablePromise;
        if(updateAvailable) {
            console.log('\n');
            console.log('⬇️  Update Available\n');
            console.log(
                `You use fhem-cli ${updateAvailable.installed}, but ${updateAvailable.available} is the most ` +
                'current one.\nYou can update by running `npm i -g @sebbo2002/fhem-cli`'
            );
            console.log('');
        }
    }

    async init () {
        const InitHandler = require('./init');
        await new InitHandler(this.cwd).run();
    }

    async pull () {
        const PullHandler = require('./pull');
        await new PullHandler(this.cwd).run();
    }

    async push () {
        const PushHandler = require('./push');
        await new PushHandler(this.cwd).run();
    }

    async inform () {
        const InformHandler = require('./inform');
        await new InformHandler(this.cwd, this.parameters.regexp).run();
    }
}

module.exports = Handler;
