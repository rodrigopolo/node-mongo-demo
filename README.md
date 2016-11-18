#Node-Mongo-Demo

A complete, working and MIT licensed Node.js-MongoDB [CRUD](http://en.wikipedia.org/wiki/Create,_read,_update_and_delete) App that uses most common and useful Node.js modules and [Bootstrap](http://getbootstrap.com/) front-end framework, designed to understand how to create and develop a Node.js-MongoDB project with the aim to give a cornerstone for future projects to any developer...

>**Notice:** This demo app was developed on Apr 11, 2014, since then, many updates and upgrades for almost all libraries have been taken place, this demo app still working and running and it still relevant today. Please read the update information at the end of the document.

##Install

Install this demo running this commands on your termial:

```
git clone https://github.com/rodrigopolo/node-mongo-demo.git
cd node-mongo-demo
npm install
```

##Setup


* Copy the `config_sample.js` to `config.js`.
* Edit `config.js` and set your own configurations:
  * Create a [Google Maps API Key](https://developers.google.com/maps/documentation/javascript/get-api-key) and add your key on the `config.js` file.
  * Set your default user account.
  * Set your prefered `Nodemailer` [transport](http://www.nodemailer.com/docs/transports) for "Password Recovery Email Notifications".
* Save the file and run.


##Run

On every OS you can set some environment variable to override the config settings, this is usefull when you want to deploy your project into a production area or change the app ports, there are many different ways to set an environment variable and then run you node app, here some different ways for each OS: 


###Linux/Unix/OSX

```
PORT=8080 && NODE_ENV=production && node app.js
```

or

```
export PORT=8080
node app.js
```

###Windows:

```
set PORT=8080 && set NODE_ENV=production && node app.js
```

or In Windows PowerShell

```
$env:PORT = 1234
node app.js
```

## Update 2016-08-16
I want to create a new version of this project using the latest node.js libraries and frameworks available, but after seeing the amount of work it requires and the time I got for doing it I decided just to update the project so it can work on any platform without any problem, here are some of the updates:
* The `bcrypt` library is replaced with the `bcryptjs` library, a pure JS solution which doesn't require compilation.
* Most dependencies updated.
* Moment.js arguments changed to fit the latest version.
* The `connect-mongo` for MongoStore modified to use the `mongoose.connection` object directly.
* F@kng Google Maps API Key added to the `config.js` file because f@king Google.
* Bootstrap updated.

-------

### Donations
[PayPal](http://paypal.me/rodrigopolo)

## License

(The MIT License)

Copyright (c) by Rodrigo Polo http://RodrigoPolo.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.