// require Express.js
const express = require('express')
const app = express()
// require morgan
const morgan = require('morgan')
// require fs
const fs = require('fs')
// require database script file
const logdb = require('./database.js')
//require md5 module
//var md5 = require('md5')
// Make express use its own built-in body parser
app.use(express.urlencoded({ extended: true}));
app.use(express.json());


// take an arbitrary port number as a command line argument 
// Default: 5000
const args = require('minimist')(process.argv.slice(2))
args['port']
const port = args.port || 5555

// start app server
const server = app.listen(port, () => {
  console.log('App listening on port %PORT%'.replace('%PORT%', port))
})

const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)

if(args.help || args.h) {
  console.log(help)
  process.exit(0)
}

if(args.log != false) {
    const accesslog = fs.createWriteStream('access.log', { flags: 'a'})
    app.use(morgan('combined', {stream: accesslog}))
}


if(args.debug) {
  app.get('app/log/access', (req, res) => {
      const stmt = logdb.prepare('SELECT * FROM accesslog').all()
      res.status(200).json(stmt)
  })
  app.get('/app/error', (req, res) => {
    throw new Error("Error test successful")
  })
}

app.use('app/new/log', (req, res, next) => {
    let logdata = {
      remoteaddr: req.ip,
      remoteuser: req.user,
      time: Date.now(),
      method: req.method,
      url: req.url,
      protocol: req.protocol,
      httpversion: req.httpVersion,
      status: res.statusCode,
      referer: req.headers['referer'],
      useragent: req.headers['user-agent']
    }

    const stmt = logdb.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
    
    next()
})

app.get('/app/log/access', (req, res) => {
      const stmt = logdb.prepare('SELECT * FROM accesslog').all()
      res.status(200).json(stmt)

})

app.get('/app/error', (req, res) => {
  throw new error ('Error test successful')
})

//2202-03-08 comp 426
//CREATE a new user (HTTP method post) at endpoint /app/new/
app.post('/app/new/user', (req, res, next) => {
    let data = {
    user: req.body.username,
    pass: req.body.password
    }
    const stmt = logdb.prepare('INSERT INTO userinfo (username, password) VALUES (?, ?)')
    const info = stmt.run(data.user, data.pass)
    res.status(200).json(info)
})

// Read a list of users (HTTP method GET) 
app.get('/app/users', (req, res) => {
    try {
      const stmt = logdb.prepare('SELECT * FROM userinfo').all()
      res.status(200).json(stmt)
    } catch (e) {
      console.error(e)
    }
})

// Read a single user (HTTP method GET)
app.get('/app/user/:id', (req, res) => {
  try {
      const stmt = logdb.prepare('SELECT * FROM userinfo WHERE id = ?').get(req.params.id)
      res.status(200).json(stmt)
  } catch (e) {
      console.error(e)
  }
})
// update a single user (HTTP method Patch)
app.patch('/app/update/user/:id', (req, res) => {
  let data = {
    user: req.body.username,
    pass: req.body.password
  }
  const stmt = logdb.prepare('UPDATE userinfo SET username = COALESCE(?,username), password = COALESCE(?, password) WHERE id = ?')
  const info = stmt.run(data.user, data.pass, req.params.id)
  res.status(200).json(info)
})

//delete a single user (HTTP method delete)
app.delete('/app/delete/user/:id', (req, res) => {
    const stmt = logdb.prepare('DELETE FROM userinfo WHERE id = ?')
    const info = stmt.run(req.params.id)
    res.status(200).json()
})

//Define base endpoint
app.get('/app/', (req, res) => {
    res.statusCode=200 //respond with status 200
    res.statusMessage='OK' //respond with status message "OK"
    res.writeHead(res.statusCode, {'Content-Type' : 'text/plain'})
    res.end(res.statusCode + ' ' + res.statusMessage)
})

// unless specified :varaible will be anyinput
app.get('/app/echo/:number',  (req, res) => {
    res.status(200).json({ 'message': req.params.number})
})

