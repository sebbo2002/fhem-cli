'use strict';

const Configuration = require('../configuration');
const RemoteSession = require('../remoteSession');


/**
 * @class InformHandler
 */
class InformHandler {
    constructor (cwd, regexp = '.*') {
        this.regexp = regexp;
        this.config = new Configuration(cwd);
    }

    async run () {
        const session = new RemoteSession(this.config);
        session.execute('inform on ' + this.regexp);

        session.stdout().on('data', d => {
            if (!session.isReady()) {
                return;
            }

            const out = d
                .toString()
                .split('\n')
                .map(l => l.replace('fhem>', '').trim())
                .filter(l => l.length)
                .join('\n');

            if(out) {
                console.log(out);
            }
        });
    }
}

module.exports = InformHandler;