'use strict';

const pkg = require('../package');
const https = require('https');

/**
 * @class RemoteDiff
 */
class Updater {

    static async isUpdateAvailable () {
        const installed = pkg.version || null;
        if (!installed) {
            return false;
        }

        try {
            const available = await this.getAvailableVersion();
            if (available === installed) {
                return false;
            }

            return {
                installed,
                available
            };
        }
        catch(error) {
            return false;
        }
    }

    static async getAvailableVersion () {
        return new Promise((resolve, reject) => {
            let data = '';

            const options = {
                hostname: 'registry.npmjs.org',
                path: '/@sebbo2002/fhem-cli',
                timeout: 4000
            };

            const req = https.request(options, res => {
                res.on('data', d => {
                    data += d.toString();
                });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data)['dist-tags'].latest);
                    }
                    catch(error) {
                        reject(error);
                    }
                });
            });
            req.on('error', (e) => {
                reject(e);
            });

            req.end();
        });
    }
}

module.exports = Updater;
