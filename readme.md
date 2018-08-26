<p align="center">
  <img width="140" height="140" src="https://d.sebbo.net/tools-NsTkJ9Zqkg.svg">
</p>

# fhem-cli

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Status](https://git-badges.sebbo.net/94/master/build)](https://static.sebbo.net/fhem-cli/test/report.html)


## ⚠️ Warning
This is a very early beta. Please do a FHEM backup before you use this tool. Thank you.

## Installation

`fhem-cli` is written in JavaScript. If you have already installed node.js, you can use `npm` to install `fhem-cli` as well.
```bash
# Install it via npm
npm i -g @sebbo2002/fhem-cli
```

~~If you don't want to install `node`, you can also have a look on [the releases page](https://github.com/sebbo2002/fhem-cli/releases), where some precompiled binaries are ready to be used.~


## Quick Start

```bash
# create a new, empty project directory
mkdir ./my-fhem && cd ./my-fhem

# initialize project
fhem init

# now you should have some new files in here
ls -la

# you can always run `fhem pull` to update your local files
fhem pull

# made some changes? then push them to your FHEM instance
fhem push
```


## All Commands

### `fhem init`

### `fhem pull`

### `fhem push`

### `fhem inform`



## Credits

- Icons made by [Freepik](http://www.freepik.com) from [flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)


## Copyright and license

&copy; Sebastian Pekarek under the [MIT license](LICENSE).
