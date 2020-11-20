'use strict';

const RemoteSession = require('./remoteSession');
const DeviceClass = require('./classes/device');

/**
 * @class RemoteConfig
 */
class RemoteConfig {
    constructor (configuration) {
        this.config = configuration;

        this._devices = {};
        this._fetched = false;
    }

    async fetch () {
        const session = new RemoteSession(this.config);
        const text = await session.execute('jsonlist2');
        session.close();

        const json = JSON.parse(text);

        json.Results.forEach(j => {
            const device = new DeviceClass(j.Name);

            // ignore FHEMWEB Connections
            if(j.Internals.TYPE === 'FHEMWEB' && j.Internals.TEMPORARY) {
                return;
            }

            // ignore TELNET Connections
            if(j.Internals.TYPE === 'telnet' && j.Internals.TEMPORARY) {
                return;
            }

            let def = j.Internals.DEF;

            // DOIF ; Fix
            if(j.Internals.TYPE === 'DOIF') {
                def = def.replace(/;/g, ';;');
            }

            device.setDefinition([j.Internals.TYPE, def].join(' ').trim().replace(/\n/g, '\\\n'));
            Object.entries(j.Attributes).forEach(([name, value]) => {
                if(name === 'userReadings') {
                    value = value
                        .replace(/;/g, ';;')
                        .replace(/\n/g, '\\\n');
                }
                device.setAttribute(name, value);
            });

            this._devices[j.Name] = device;
        });

        this._fetched = true;
    }

    async devices () {
        if(!this._fetched) {
            await this.fetch();
        }

        return Object.values(this._devices);
    }

    async apply (diffs) {
        if(!this._fetched) {
            await this.fetch();
        }
        if(!diffs.instructions().length) {
            return [];
        }

        const errors = [];
        const session = new RemoteSession(this.config);
        const commands = diffs.instructions().map(d => {
            if(!d.content) {
                throw new Error('Unable to apply diff: no command in instruction: ' + JSON.stringify(d));
            }

            return d.content.split('\n').map(s => s.substr(-1) === '\\' ? s.substr(0, s.length - 1) : s).join('\\\n');
        });
        for(let i = 0; i < commands.length; i += 1) {
            const command = commands[i];
            let response;

            try {
                response = await session.execute(command);
            }
            catch(err) {
                errors.push(err);
            }

            const responseHasContent = !!response.split('>').map(s => s.trim()).join('');
            if(responseHasContent) {
                errors.push(new Error('Unable to apply this command: `' + command + '` - FHEM answered: `' + response + '`'));
            }
        }

        const response = await session.execute('save');
        if(response.indexOf('Wrote configuration to ') === -1) {
            errors.push(new Error('Unable to apply diff: unexpected response while running `save`: `' + response + '`'));
        }

        session.close();
        return errors;
    }
}

module.exports = RemoteConfig;
