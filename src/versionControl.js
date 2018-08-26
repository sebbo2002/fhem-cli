'use strict';

/**
 * @class VersionControl
 */
class VersionControl {
    constructor (cwd) {
        this.cwd = cwd;
    }

    static async getVersion() {
        return this.exec('git --version');
    }

    async init () {
        await VersionControl.exec(this.cwd, 'git init');
    }

    async getOriginUrl () {
        const url = await VersionControl.exec(this.cwd, 'git config --get remote.origin.url');
        return url.trim();
    }

    async setOriginUrl (url) {
        await VersionControl.exec(this.cwd, 'git remote set-url origin "' + url + '"');
    }

    async getStash() {
        const stdout = await VersionControl.exec(this.cwd, 'git status -s');
        const r = stdout.trim().split('\n');
        return r.length === 1 && !r[0] ? [] : r;
    }

    async add (file) {
        await VersionControl.exec(this.cwd, 'git add "' + file + '"');
    }

    async commit (message) {
        await VersionControl.exec(this.cwd, 'git commit -qm "' + message + '"');
    }

    async push () {
        await VersionControl.exec(this.cwd, 'git push');
    }

    async pull () {
        await VersionControl.exec(this.cwd, 'git pull');
    }

    static async exec (cwd, command) {
        const exec = require('child_process').exec;
        if(!command) {
            command = cwd;
            cwd = undefined;
        }

        return new Promise((resolve, reject) => {
            exec(command, {cwd}, (error, stdout, stderr) => {
                if(error) {
                    reject(stderr || error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }
}

module.exports = VersionControl;