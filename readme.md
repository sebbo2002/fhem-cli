<p align="center">
  <img width="140" height="140" src="https://d.sebbo.net/tools-NsTkJ9Zqkg.svg">
</p>

# FHEM CLI

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
![Status](https://git-badges.sebbo.net/94/master/build)


## ⚠️ Warning
Of course this software might have bugs. So please make a backup of your configuration when you use this script. Thank you.


## 🤨 WTF? Why do I need a CLI for FHEM?
- FHEM's telnet is nice to play with, but I like to have my configuration in files to version it
- It's not allowed to edit fhem.cfg directly
- FHEM CLI syncs local configuration files with your remote FHEM instance over SSH and Telnet (SSH into machine, then telnet on localhost). To do this, it creates a representation of all devices and attributes and compares them. Then, a diff is created and applied locally or on your FHEM instance.
- Bonus: FHEM CLI can also restart your Homebridge… ([?](https://github.com/sebbo2002/fhem-cli#-setup-homebridge-restart))


## 🔧 Installation

`fhem-cli` is written in JavaScript. If you have already installed node.js, you can use `npm` to install `fhem-cli` as well.
```bash
# Install it via npm
npm i -g @sebbo2002/fhem-cli
```

~~If you don't want to install `node`, you can also have a look on [the releases page](https://github.com/sebbo2002/fhem-cli/releases), where some precompiled binaries are ready to be used.~~ (This is not done yet. Need this? Please give a 👍 [over here](https://github.com/sebbo2002/fhem-cli/issues/8).)


## ⚡️ Quick Start

```bash
# create a new, empty project directory
mkdir ./my-fhem
cd ./my-fhem

# initialize project
fhem init

# now you should have some new files in here
ls -la

# you can always run `fhem pull` to update your local files
fhem pull

# made some changes? then push them to your FHEM instance
fhem push
```


## 📑 All Commands

#### `fhem init`
Starts an interactive wizard which configures FHEM CLI to connect to your FHEM instance.

#### `fhem pull`
Compare local and remote and updates your local files to match your remote.

#### `fhem push`
Compare local and remote and updates your remote instance to match your local files.

#### `fhem inform [regexp]`
Just proxies FHEM inform, so you can have a look at your instance's events.


## 🔁 Setup Homebridge restart

FHEM CLI allows you to setup hooks. These hooks are called, when a given attribute changes. You can use this feature to restart Homebridge when it's configuration changes.

To do this, you need to create a new bash file on your FHEM box. Running this file will restart your Homebridge:

```bash
#!/usr/bin/env bash
su fhem -c 'forever restartall'
```

When you do not login via root, you need to make this file executable without entering a password. To do this, we need to setup some permissions:

```bash
sudo chown root:root restart-homebridge.sh
sudo chmod 4775 restart-homebridge.sh
```

We also need an entry in our `/etc/sudoers` file:

```bash
sebbo ALL=(ALL) NOPASSWD: /home/batman/restart-homebridge.sh
```

Cool. Now it should be possible to restart Homebridge from our local machine like this:

```bash
ssh fhem.local sudo /home/batman/restart-homebridge.sh
```

If not, something went wrong. Sorry, you have to fix this first. If this works, you can update your FHEM CLI project settings. These are located in your project directory in a file called `.fhem-cli.json`:

```json
{
  "host": "fhem.local",
  "port": 7072,
  "hooks": [
  	["homebridgeMapping", "sudo /home/batman/restart-homebridge.sh"],
  	["room", "sudo /home/batman/restart-homebridge.sh"]
  ]
}
```

Now, FHEM CLI should restart Homebridge when any `room` or any `homebridgeMapping` attribute changes. Nice, isn't it?

## 📚 Credits

- Icon made by [Freepik](http://www.freepik.com) from [flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)


## ☁ Privacy

I use a private [Sentry instance]() to which unhandled errors of this script are reported. The reported data will only
be used to fix the bug in a future version. Reporting can be disabled by setting the environment variable `SENTRY_DSN`
to an empty string (`SENTRY_DSN="""`).


## 👨‍🔧 Copyright and license

&copy; Sebastian Pekarek under the [MIT license](LICENSE).
