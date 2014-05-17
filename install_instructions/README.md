###How to install a Node.js and MongoDB complete development environment (64-bit) on Windows 8, Ubuntu 14.04 and OS X 10.9 Mavericks

##Windows
**NOTE**: All installation steps that run in the `Command Prompt (Admin)` are done as an administrator.

###MongoDB
Add MongoDB bin path to your system path environment variable

```
c:\mongodb\bin
```

Make MongoDB directories:

```
mkdir c:\mongodb\data
mkdir c:\mongodb\data\db
mkdir c:\mongodb\logs
mkdir c:\mongodb\conf
```

Download [MongoDB 2.6.1 64-bit](https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-2008plus-2.6.1.zip) the ZIP version, unzip and move the `bin` folder to the folder `c:\mongodb` so it becomes `c:\mongodb\bin`

Create the config file `mongodb.conf` on `c:\mongodb\` with the following contents:

```
# mongodb.conf

# Data
dbpath=c:\mongodb\data\db

# Log
logpath=c:\mongodb\logs\mongodb.log
logappend=true

# Only run on localhost for development
bind_ip=127.0.0.1

# Default MongoDB port
port=27017
```

Install MongoDB as a service:

```
mongod --install --config c:\mongodb\mongodb.conf --logpath c:\mongodb\logs\mongodb.log
```

Start MongoDB service:

```
net start MongoDB
```

_To remove MongoDB service_:

```
net stop MongoDB
mongod --remove
```

If you want to have a GUI to work with MongoDB Shell, [Robomongo](http://robomongo.org) is the best choice.


###Node.js
[Download](http://nodejs.org/) and install Node.js

To setup a node.js development environment on Windows 8 you'll need some extra tools:


* [Python 2.7.6](https://www.python.org/ftp/python/2.7.6/python-2.7.6.amd64.msi)
* [Visual Studio 2012 Express for Windows Desktop (EN)](http://download.microsoft.com/download/1/F/5/1F519CC5-0B90-4EA3-8159-33BFB97EF4D9/VS2012_WDX_ENU.iso)
* Optional: [Git Latest](http://git-scm.com/download/win)

After downloading:

1. Install Python 2.7.6, (`v2.7` recommended, `v3.x.x` is __*not*__ supported).
2. Install Visual Studio 2012 Express for Windows Desktop.
3. Add `C:\Python27\` to your system `PATH` environment variable.



Source information about development environment on Windows 8
* [Source 1](http://stackoverflow.com/a/21366601/218418)
* [Source 2](https://github.com/TooTallNate/node-gyp#installation)
* [Source 3](http://stackoverflow.com/a/17934330/218418)



##Ubuntu 14.04


###MongoDB

Open Terminal and enter the following code line by line:

```
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
sudo apt-get update
sudo apt-get install mongodb-org
```

[Source](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/)

###Node.js

```
sudo apt-get install g++ curl libssl-dev apache2-utils git-core python-software-properties
sudo apt-add-repository ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install nodejs
```


Make npm global installs possible
```
npm config set prefix ~/.npm
echo 'export PATH=$HOME/.npm/bin:$PATH' >> ~/.bashrc 
. ~/.bashrc
```

[Source](http://stackoverflow.com/a/19379795/218418)


##OS X >= 10.8

**IMPORTANT** It is required to have installed `Xcode` + `Command Line Tools` installed previous to install MongoDB from Homebrew, `Xcode` can be installed from the `Mac App Store`, once installed, you can install the `Command Line Tools` going to `Xcode` `Preferences` menu, and then `Downloads` tab, just click on the `Install` button.

Install Homebrew from Terminal

```
ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"
```

###MongoDB

Install MongoDB with Homebrew

```
brew update
brew install mongodb
mkdir -p ~/Library/LaunchAgents
ln -sfv /usr/local/opt/mongodb/*.plist ~/Library/LaunchAgents
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.mongodb.plist
```

###Node.js
Download and install Node.js

Make npm global installs possible
```
npm config set prefix ~/.npm
echo 'export PATH=$HOME/.npm/bin:$PATH' >> ~/.bashrc 
. ~/.bashrc
```
















