'use strict';

const DeviceClass = require('./classes/device');

/**
 * @class LocalConfig
 */
class LocalConfig {
    constructor (cwd) {
        const path = require('path');
        this.cwd = path.normalize(cwd);
        this.parseBuffer = [];

        this._devices = {};
        this._fetched = false;
    }

    async fetch () {
        const files = await this._getListOfConfigFiles();
        await Promise.all(files.map(file => this._parseFile(file)));
        this._fetched = true;
    }

    async devices () {
        if (!this._fetched) {
            await this.fetch();
        }

        return Object.values(this._devices);
    }

    async apply (diff) {
        if (!this._fetched) {
            await this.fetch();
        }


        const files = {};
        diff.instructions().forEach(i => {
            if (!i.file) {
                throw new Error('Unable to apply diff: No file given: ' + JSON.stringify(i));
            }

            let [file, line] = i.file.split(':');
            line = line ? line.split('-') : [];

            i.line = [parseInt(line[0], 10) || null, parseInt(line[1], 10) || null];
            if (i.line[0] && !i.line[1]) {
                i.line[1] = i.line[0];
            }

            files[file] = files[file] || [];
            files[file].push(i);
        });

        await Promise.all(
            Object.entries(files).map(([file, instructions]) => this._applyForFile(file, instructions))
        );
    }

    async _applyForFile (file, instructions) {
        const fs = require('fs');

        let content = [];
        if (fs.existsSync(file)) {
            content = await new Promise((resolve, reject) => {
                fs.readFile(file, {encoding: 'utf8'}, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data.split('\n'));
                    }
                });
            });
        }

        let delta = 0;
        instructions.forEach(i => {
            let index = content.length,
                remove = 0,
                add = [];

            if (i.line && i.line[1] + delta < content.length) {
                index = i.line[0] + delta;
            }

            if (i.type === 'add' || i.type === 'update') {
                add = i.content.split('\n');
            }
            if (i.type === 'update' || i.type === 'remove') {
                remove = i.line[1] - i.line[0] + 1;
            }

            const spliceArgs = [index, remove];
            content.splice.apply(content, [...spliceArgs, ...add]);
            delta += add.length - remove;
        });

        await new Promise((resolve, reject) => {
            fs.writeFile(file, content.join('\n'), {encoding: 'utf8'}, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async _parseFile (file) {
        const readline = require('readline');
        const fs = require('fs');

        return new Promise(resolve => {
            const reader = readline.createInterface({
                input: fs.createReadStream(file)
            });

            let i = 0;
            reader.on('line', line => {
                this._parseLine(file, line, i);
                i += 1;
            });
            reader.on('close', () => {
                resolve();
            });
        });
    }

    _parseLine (file, line, i) {
        if (line.substr(0, 1) === '#') {
            return;
        }

        const complete = (this.parseBuffer.join('\n') + '\n' + line).trim();
        const lines = complete.split('\n').length;
        const parts = complete.split(' ');
        const command = parts.shift();

        if (!command && !parts.length) {
            return;
        }

        const brakets = ['(', ')', '[', ']', '{', '}'].map(b => complete.split(b).length);
        if (brakets[0] !== brakets[1] || brakets[2] !== brakets[3] || brakets[4] !== brakets[5]) {
            this.parseBufferStart = this.parseBufferStart !== null ? this.parseBufferStart : i;
            this.parseBuffer.push(line);
            return;
        }

        const lineDef = (this.parseBufferStart || i) + (lines > 1 ? '-' + ((this.parseBufferStart || i) + lines) : '');
        this.parseBufferStart = null;
        this.parseBuffer = [];

        if (['defmod', 'define'].indexOf(command) !== -1) {
            this._parseDefineLine(parts, file, lineDef);
        }
        else if (command === 'attr') {
            this._parseAttrLine(parts, file, lineDef);
        }
        else if (command === 'set') {
            // ignore sets for now
        }
        else {
            throw new Error('Unable to parse line: `' + line + '` in ' + file + ':' + lineDef);
        }
    }

    _parseDefineLine (parts, file, line) {
        const device = parts.shift(parts);

        this._devices[device] = this._devices[device] || new DeviceClass(device);
        this._devices[device].setDefinition(parts.join(' '), file + ':' + line);
    }

    _parseAttrLine (parts, file, line) {
        const device = parts.shift(parts);
        const attribute = parts.shift(parts);

        this._devices[device] = this._devices[device] || new DeviceClass(device);
        this._devices[device].setAttribute(attribute, parts.join(' '), file + ':' + line);
    }

    async _getListOfConfigFiles (directory = this.cwd) {
        const path = require('path');
        const files = await this._readdir(directory);

        const result = [];
        await Promise.all(files.map(async file => {
            const isDir = await this._isDirectory(file);
            if (isDir) {
                const filesInDirectore = await this._getListOfConfigFiles(file);
                filesInDirectore.forEach(file => result.push(file));
            }
            else if (path.extname(file) === '.cfg') {
                result.push(file);
            }
        }));

        return result;
    }

    async _readdir (directory) {
        const fs = require('fs');
        const path = require('path');

        return new Promise((resolve, reject) => {
            fs.readdir(directory, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(
                        files.map(file => path.join(directory, file))
                    );
                }
            });
        });
    }

    async _isDirectory (path) {
        const fs = require('fs');

        return new Promise((resolve, reject) => {
            fs.stat(path, (err, stats) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stats.isDirectory());
                }
            });
        });
    }
}

module.exports = LocalConfig;