var ffmpeg = require('fluent-ffmpeg')
  , _ = require('lodash')
  , async = require('async')
  , path = require('path')
  , program = require('commander')
  , bunyan = require('bunyan')
  , log = bunyan.createLogger({name: 'convert-test'})
  , Config = require('config')
  , Plex = require('plex-api')
  , client = new Plex(Config.get('Plex.host'))
  , kue = require('kue')
  , jobs = kue.createQueue({
    redis: Config.get('Redis')
  })
  ;
  _.mixin( require('lodash-deep'));

client.find("/library/sections", { type: 'movie'}).then( function( result ){
  _.each( result, function( section ){
    //log.info( section)
    client.query( section.uri + '/all').then( function( results ){
      async.each( results.video, function( item, next ){

        if( !_.isArray( item.media )){
          return next();
        }

        async.map( item.media, function( media, cb){
          //console.log( media )
          if( !_.isArray( media.part )){
            return cb();
          }

          // more rules here
          if( media.attributes.container == "mp4" ){
            return cb();
          }

          cb( null, {
            key: item.attributes.key,
            refresh: section.uri + '/refresh',
            title: item.attributes.title,
            files: _.map( _.deepPluck( media.part, 'attributes.file'), function( file ){
              return  file.replace('/data/', '');
            })
          } );
        }, function( err, results ){
          //console.log( item )
          log.info( results );
          async.each(_.compact( results), function( media, cb ){

            var job = jobs.create('convert', media)
              .searchKeys(['key']).save( function( err ){
              if( err )
                return cb( err );
              log.info('Added Job:', media.title)
              cb()
            });
          }, function(err){
            if( err )
              log.error( err )

            next()
          })
        })
      }, function( err ){
        if( err )
          log.error( err )
      });
    })
  });
});

//var watcher = Config.get('watcher');
//
//  watch.createMonitor( watcher.srcPath, function (monitor) {
//
//    monitor.on("created", function (f, stat) {
//
//      console.log( stat );
//      // Handle new files
//      //var job = jobs.create('convert', {
//      //  title: f
//      //  , file: f
//      //  , outputPath: watcher.outputPath
//      //}).save( function( err ){
//      //  if( err )
//      //    return log.error( err );
//      //
//      //  log.info('Added Job', f)
//      //});
//      log.info( 'Created', f )
//    });
//
//    monitor.on("changed", function (f, curr, prev) {
//      // Handle file changes
//    });
//    monitor.on("removed", function (f, stat) {
//      // Handle removed files
//      log.info( 'Removed', f )
//    });
//    monitor.on('error', function( err ){
//      log.error( err )
//    })
//  })
//
