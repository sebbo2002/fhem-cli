'use strict';

const ora = require('ora');
const execFile = require('child_process').execFile;
const inquirer = require('inquirer');

const VersionControl = require('../versionControl');
const Configuration = require('../configuration');
const LocalConfig = require('../localConfig');
const RemoteConfig = require('../remoteConfig');
const RemoteDiff = require('../remoteDiff');


/**
 * @class PushHandler
 */
class PushHandler {
    constructor (cwd) {
        this.cwd = cwd;
        this.vcs = new VersionControl(cwd);
        this.config = new Configuration(cwd);
        this.localConfig = new LocalConfig(cwd);
        this.remoteConfig = new RemoteConfig(this.config);
        this.diff = null;
    }

    async run () {
        await this.loadConfigs();
        await this.generateDiff();
        await this.approveDiff();
        await this.applyChanges();
        await this.applyHooks();
        await this.commitChanges();
        await this.pushChanges();
    }

    async loadConfigs () {
        const spinner = ora('Load FHEM configurations…').start();
        await Promise.all([
            this.localConfig.fetch(),
            this.remoteConfig.fetch()
        ]);

        if (this.localConfig.parseBuffer.length) {
            throw new Error('Unable to parse this:\n' + this.localConfig.parseBuffer.map(l => '> ' + l).join('\n'));
        }

        spinner.succeed();
    }

    async generateDiff () {
        const spinner = ora('Generate diff…').start();
        this.diff = new RemoteDiff(await this.remoteConfig.devices(), await this.localConfig.devices());
        spinner.succeed();
    }

    async approveDiff () {
        if (this.diff.diff.length === 0) {
            return;
        }

        console.log('\n\n### Diff:');
        this.diff.diff.forEach(c => console.log('+ %s', c.content));

        const res = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: 'Apply diff now?',
            default: true
        }]);
        if (!res.confirm) {
            console.log('\nOkay. Bye…');
            process.exit(1);
        }
    }

    async applyChanges () {
        const spinner = ora('Apply changes on your FHEM instance…').start();
        const errors = await this.remoteConfig.apply(this.diff);

        if (!this.diff.diff.length) {
            spinner.succeed('No changes to apply on your FHEM instance…');
            return;
        }
        if (!errors.length) {
            spinner.succeed();
            return;
        }

        spinner.fail('Got ' + errors.length + ' errors during push:');
        console.log(errors.map(e => '- ' + e.toString()).join('\n'));
    }

    async applyHooks () {
        const hooks = this.config
            .hooks()
            .filter(([attr]) => attr === '*' || this.diff.hooks().indexOf(attr) > -1)
            .map(hook => hook[1])
            .filter((elem, pos, arr) => arr.indexOf(elem) === pos);

        for (let i = 0; i < hooks.length; i += 1) {
            const command = hooks[i];
            const spinner = ora('Hook: `' + command + '`').start();

            const args = [this.config.host()];
            command.split(' ').forEach(p => args.push(p));

            await new Promise((resolve, reject) => {
                execFile('ssh', args, {cwd: this.cwd, env: process.env}, (err, stdout, stderr) => {
                    if (!err) {
                        resolve();
                    } else {
                        console.log(stdout, stderr);
                        reject(err);
                    }
                });
            });

            spinner.succeed();
        }
    }

    async commitChanges () {

    }

    async pushChanges () {

    }
}

module.exports = PushHandler;
