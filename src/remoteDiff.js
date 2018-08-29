'use strict';

/**
 * @class RemoteDiff
 */
class RemoteDiff {

    /**
     * @param {Array<DeviceClass>} remote
     * @param {Array<DeviceClass>} local
     */
    constructor (remote, local) {
        this.remote = remote;
        this.local = local;

        this.diff = [];
        this._hooks = [];

        this.generate();
    }

    instructions () {
        return this.diff;
    }

    hooks () {
        return this._hooks;
    }

    generate () {
        this.local.forEach(localDevice => {
            const remoteDevice = this.remote.find(d => d.getName() === localDevice.getName());

            // Device not given in local config.
            // add device and all attributes…
            if (!remoteDevice) {
                this.diff.push({
                    type: 'add',
                    content: 'defmod ' + localDevice.getName() + ' ' + localDevice.getDefinition()
                });
            }

            // device found, but definition is not up to date
            else if (localDevice.getDefinition() !== remoteDevice.getDefinition()) {
                this.diff.push({
                    type: 'update',
                    content: 'defmod ' + localDevice.getName() + ' ' + localDevice.getDefinition()
                });
            }


            // attributes
            Object.entries(localDevice.getAttibutes()).forEach(([name, value]) => {
                const remoteAttr = remoteDevice ? remoteDevice.getAttibute(name) : null;

                if (!remoteAttr || remoteAttr[0] !== value[0]) {
                    this.diff.push({
                        type: !remoteAttr ? 'add' : 'update',
                        content: 'attr ' + localDevice.getName() + ' ' + name + ' ' + value[0]
                    });

                    if (this._hooks.indexOf(name) === -1) {
                        this._hooks.push(name);
                    }
                }
            });
            if (remoteDevice) {
                Object.entries(remoteDevice.getAttibutes()).forEach(([name]) => {
                    const remoteAttr = remoteDevice ? remoteDevice.getAttibute(name) : null;
                    if (!remoteAttr) {
                        this.diff.push({
                            type: 'remove',
                            content: 'deleteattr ' + localDevice.getName() + ' ' + name
                        });

                        if (this._hooks.indexOf(name) === -1) {
                            this._hooks.push(name);
                        }
                    }
                });
            }
        });

        this.remote.forEach(remoteDevice => {
            const localDevice = this.local.find(d => d.getName() === remoteDevice.getName());
            if (localDevice) {
                return;
            }

            this.diff.push({
                type: 'remove',
                content: 'delete ' + remoteDevice.getName()
            });

            Object.keys(localDevice.getAttibutes()).forEach(name => {
                if (this._hooks.indexOf(name) === -1) {
                    this._hooks.push(name);
                }
            });
        });
    }
}


module.exports = RemoteDiff;