'use strict';

const ora = require('ora');
const inquirer = require('inquirer');

const VersionControl = require('../versionControl');
const Configuration = require('../configuration');
const LocalConfig = require('../localConfig');
const RemoteConfig = require('../remoteConfig');
const LocalDiff = require('../localDiff');


/**
 * @class PullHandler
 */
class PullHandler {
    constructor (cwd) {
        this.cwd = cwd;
        this.vcs = new VersionControl(cwd);
        this.config = new Configuration(cwd);
        this.localConfig = new LocalConfig(cwd);
        this.remoteConfig = new RemoteConfig(this.config);
        this.diff = null;
    }

    async run () {
        await this.checkStash();
        await this.loadConfigs();
        await this.generateDiff();
        await this.approveDiff();
        await this.applyChanges();
    }

    async checkStash () {
        const spinner = ora('Check project stash').start();
        const stash = this.vcs.getStash();
        if(stash.length) {
            spinner.fail('Your Stash is not empty. Please review pending changes!');
            throw new Error('Stash not empty!');
        }

        spinner.succeed();
    }

    async loadConfigs () {
        const spinner = ora('Load FHEM configurations…').start();
        await Promise.all([
            this.localConfig.fetch(),
            this.remoteConfig.fetch()
        ]);

        spinner.succeed();
    }

    async generateDiff () {
        const spinner = ora('Generate diff…').start();
        this.diff = new LocalDiff(this.cwd, await this.remoteConfig.devices(), await this.localConfig.devices());
        spinner.succeed();
    }

    async approveDiff () {
        if (this.diff.diff.length === 0) {
            return;
        }

        console.log('\n\n### Diff:');
        this.diff.diff.forEach(c => {
            console.log(`\n#### ${c.file}`);

            const prefix = c.type === 'remove' ? '- ' : '+ ';
            console.log(prefix + (c.content ? c.content.replace(/\n/g, '\n' + prefix) : ''));
        });

        console.log('');
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
        const spinner = ora('Apply changes locally…').start();
        await this.localConfig.apply(this.diff);
        spinner.succeed();
    }
}

module.exports = PullHandler;
