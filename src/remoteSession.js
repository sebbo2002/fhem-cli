'use strict';

/**
 * @class RemoteSession
 */
class RemoteSession {
    constructor (configuration) {
        const spawn = require('child_process').spawn;

        this._process = spawn('ssh', [
            configuration.host(),
            'telnet',
            'localhost',
            configuration.port()
        ], {
            cwd: process.cwd(),
            env: process.env
        });

        this._queue = [];
        this._ready = false;
        this._busy = false;
        this._close = false;

        //this._process.stdout.on('data', d => console.log(d.toString().split('\n').map(l => 'Remote: stdout: ' + l).join('\n')));
        //this._process.stderr.on('data', d => console.log(d.toString().split('\n').map(l => 'Remote: stderr: ' + l).join('\n')));


        const onReadyListener = buffer => {
            if (buffer.toString().split('\n').find(l => l.trim() === 'fhem>')) {
                this._process.stdout.removeListener('data', onReadyListener);
                this._ready = true;

                this._handleQueue();
            }
        };

        this._process.stdout.on('data', onReadyListener);
        this._process.stdin.write('\n\n\n\n');
    }

    stdout () {
        return this._process.stdout;
    }

    isReady () {
        return this._ready;
    }

    async execute (command) {
        return new Promise((resolve, reject) => {
            const job = [command, resolve, reject];
            this._queue.push(job);

            if (!this._busy && this._ready) {
                this._handleQueue();
            }
        });
    }

    _handleQueue () {
        this._queue.busy = true;

        if (this._queue.length === 0 && this._close) {
            this.close();
            return;
        }
        if (this._queue.length === 0) {
            this._busy = false;
            return;
        }

        let _answered = false;
        let timeout = null;
        let result = [];
        const [command, success, error] = this._queue.shift();

        const answered = () => {
            _answered = true;
            clearTimeout(timeout);

            this._process.stdout.removeListener('data', stdoutHandler);
        };

        timeout = setTimeout(() => {
            if (!_answered) {
                error(new Error('Timeout: FHEM did not answer within given period of time…'));
                answered();
            }
        }, 20000);

        const stdoutHandler = d => {
            d.toString().split('\n').forEach(l => {
                if (l.trim() === 'fhem>') {
                    success(result.join('').trim());
                    answered();

                    this._handleQueue();
                } else {
                    result.push(l);
                }
            });
        };

        this._process.stdout.on('data', stdoutHandler);

        command.split('\n').forEach(l => {
            //console.log('Remote: stdin: ', l);
            this._process.stdin.write(l + '\n');
        });
    }

    close () {
        this._close = true;

        if (!this._busy) {
            this._process.stdin.write('quit\n');
        }
    }
}

module.exports = RemoteSession;