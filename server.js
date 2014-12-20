var _ = require('lodash')
  , program = require('commander')
  , bunyan = require('bunyan')
  , log = bunyan.createLogger({name: 'convert-test'})
  , Config = require('config')
  , kue = require('kue')
  , jobs = kue.createQueue({
    redis: Config.get('Redis')
  })
  ;

kue.app.listen(3000)

