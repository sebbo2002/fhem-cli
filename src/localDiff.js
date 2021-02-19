'use strict';

/**
 * @class LocalDiff
 */
class LocalDiff {

    /**
     * @param {string} cwd
     * @param {Array<DeviceClass>} remote
     * @param {Array<DeviceClass>} local
     */
    constructor (cwd, remote, local) {
        this.cwd = cwd;
        this.remote = remote;
        this.local = local;
        this.diff = [];

        this.generate();
    }

    instructions () {
        return this.diff;
    }

    generate () {
        this.remote.forEach(remoteDevice => {
            const path = require('path');
            const localDevice = this.local.find(d => d.getName() === remoteDevice.getName());

            let fileName;
            if(localDevice) {
                fileName = localDevice.getLine();
            }
            if (!fileName) {
                fileName = path.resolve(
                    this.cwd,
                    (
                        remoteDevice.getAttibute('room') ?
                            remoteDevice.getAttibute('room')[0].split(',')[0].trim() :
                            'unsorted'
                    )
                        .toLowerCase()
                        .replace(/ß/g, 'ss')
                        .replace(/ö/g, 'oe')
                        .replace(/ü/g, 'ue')
                        .replace(/ä/g, 'ae')
                        .replace(/[^0-9a-z-_.]/g, '') + '.cfg'
                );
            }

            // Device not given in local config.
            // add device and all attributes…
            if (!localDevice) {
                this.diff.push({
                    type: 'add',
                    content: '\ndefmod ' + remoteDevice.getName() + ' ' + remoteDevice.getDefinition(),
                    file: fileName
                });
            } else {
                // device found, but definition is not up to date
                if (remoteDevice.getDefinition() !== localDevice.getDefinition()) {
                    this.diff.push({
                        type: 'update',
                        content: 'defmod ' + remoteDevice.getName() + ' ' + remoteDevice.getDefinition(),
                        file: fileName
                    });
                }
            }


            // attributes
            Object.entries(remoteDevice.getAttibutes()).forEach(([name, value]) => {
                const localAttr = localDevice ? localDevice.getAttibute(name) : null;

                if (!localAttr) {
                    this.diff.push({
                        type: 'add',
                        content: 'attr ' + remoteDevice.getName() + ' ' + name + ' ' + value[0],
                        file: localDevice && Object.keys(localDevice.getAttibutes()).length ? localDevice.getAttibute(
                            Object.keys(localDevice.getAttibutes())[Object.keys(localDevice.getAttibutes()).length - 1]
                        )[1] : fileName
                    });
                }
                else if (this.trimWhitespaces(localAttr[0]) !== this.trimWhitespaces(value[0])) {
                    this.diff.push({
                        type: 'update',
                        content: 'attr ' + remoteDevice.getName() + ' ' + name + ' ' +
                            value[0].split('\n').map(l => '  ' + l.trim()).join('\n'),
                        file: localAttr[1]
                    });
                }
            });
            if (localDevice) {
                Object.entries(localDevice.getAttibutes()).forEach(([name, value]) => {
                    const localAttr = localDevice ? localDevice.getAttibute(name) : null;
                    if (!localAttr) {
                        this.diff.push({
                            type: 'remove',
                            file: value[1]
                        });
                    }
                });
            }
        });

        this.local.forEach(localDevice => {
            const remoteDevice = this.remote.findIndex(d => d.getName() === localDevice.getName());
            if (remoteDevice > -1) {
                return;
            }

            if(localDevice.getLine()) {
                this.diff.push({
                    type: 'remove',
                    file: localDevice.getLine()
                });
            }

            Object.entries(localDevice.getAttibutes()).forEach(([,value]) => {
                this.diff.push({
                    type: 'remove',
                    file: value[1]
                });
            });
        });
    }
    trimWhitespaces(str) {
        return str.split('\n').map(s => s.trim()).join('\n');
    }
}


module.exports = LocalDiff;
