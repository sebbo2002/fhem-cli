'use strict';

const inquirer = require('inquirer');
const ora = require('ora');

const VersionControl = require('../versionControl');
const Configuration = require('../configuration');
const RemoteSession = require('../remoteSession');


/**
 * @class InitHandler
 */
class InitHandler {
    constructor (cwd) {
        this.cwd = cwd;
        this.vcs = new VersionControl(cwd);
    }

    async run () {
        await this.getGitVersion();
        await this.getSSHVersion();
        await this.tellItsBeta();
        await this.askIfDirectoryIsCorrect();
        await this.initGitRepository();
        await this.syncGitOriginURL();

        this.config = new Configuration(this.cwd);
        await this.askForConfiguration();
        await this.testConnection();
        await this.commitConfiguration();
    }

    async getGitVersion () {
        const spinner = ora('Check `git --version`').start();

        try {
            await VersionControl.getVersion();
            spinner.succeed();
        }
        catch (err) {
            spinner.fail(err);
            throw err;
        }
    }

    async getSSHVersion () {
        const spinner = ora('Check `ssh -V`').start();

        try {
            await VersionControl.exec('ssh -V');
            spinner.succeed();
        }
        catch (err) {
            spinner.fail(err);
            throw err;
        }

        console.log('');
    }

    async tellItsBeta () {
        const res = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: 'FHEM CLI is in a very, very early stage and will produce bugs. \n  ' +
                'Please do regular backups of your FHEM configuration when using this tool. \n  ' +
                'Continue?',
            default: false
        }]);
        if (!res.confirm) {
            console.log('\nOkay. See you later when you made a backup. Bye…');
            process.exit(1);
        }

        console.log('');
    }

    async askIfDirectoryIsCorrect () {
        const res = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: 'So you want to initialize a new fhem-cli project here:\n  > ' + this.cwd + '\n  Is this correct?'
        }]);
        if (!res.confirm) {
            console.log('Oh. Okay. Please try again later when you are in the right directory. Bye…');
            process.exit(1);
        }

        console.log('');
    }

    async initGitRepository () {
        const spinner = ora('Setup git repository…').start();
        await this.vcs.init();

        const stash = await this.vcs.getStash();
        if (stash.length !== 0 && (stash.length !== 1 || stash[0].indexOf('.fhem-cli.json') === -1)) {
            spinner.fail('Stash is not empty, please commit your changes…');
            throw new Error('Stash is not empty, please commit your changes…');
        }

        spinner.succeed();
        console.log('');
    }

    async syncGitOriginURL () {
        let url;
        try {
            url = await this.vcs.getOriginUrl();
        }
        catch (err) {
            // do nothing
        }
        if(url) {
            return;
        }

        const res = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to sync your project with a remote git repository?',
            default: false
        }]);
        if (res.confirm) {
            const resUrl = await inquirer.prompt([{
                type: 'input',
                name: 'url',
                message: 'Okay, then enter the remote URL here:',
                default: url
            }]);

            if (resUrl.url) {
                await this.vcs.setOriginUrl(resUrl.url);
            }
        }
    }

    async askForConfiguration () {
        const res = await inquirer.prompt([
            {
                type: 'input',
                name: 'host',
                message: 'What\'s the hostname of your FHEM server? I need this to SSH into it…\n  ' +
                    'You should be able to ssh into it without a password.\n  ',
                'default': this.config.host() || 'fhem.local'
            },
            {
                type: 'input',
                name: 'port',
                message: 'What\'s the telnet port FHEM is listening on?',
                'default': this.config.port() || 7072
            }
        ]);

        this.config.host(res.host);
        this.config.port(res.port);

        console.log('');
    }

    async testConnection () {
        const spinner = ora('Test connection to your FHEM instance…').start();

        try {
            const session = new RemoteSession(this.config);

            const version = await session.execute('version');
            if (version.indexOf('fhem.pl') === -1) {
                throw new Error('Unexpected version!');
            }

            session.close();
            spinner.succeed('Test successfull. Configuration complete. Run `fhem pull` to procceed…');
        }
        catch (err) {
            spinner.fail(err);
            throw err;
        }
    }

    async commitConfiguration () {
        const spinner = ora('Commit your configuration changes').start();

        const stash = await this.vcs.getStash();
        if(stash.length === 0) {
            spinner.succeed();
            return;
        }

        try {
            await this.vcs.add('./.fhem-cli.json');
            await this.vcs.commit('FHEM CLI Configuration File');
        }
        catch(err) {
            spinner.fail('Commit failed!');
            throw err;
        }

        try {
            const origin = await this.vcs.getOriginUrl();
            if (origin) {
                await this.vcs.push();
            }
        }
        catch (err) {
            // do nothing
        }

        spinner.succeed();
    }
}

module.exports = InitHandler;