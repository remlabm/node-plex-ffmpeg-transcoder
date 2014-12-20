var _ = require('lodash')
  , async = require('async')
  , fs = require('fs')
  , path = require('path')
  , bunyan = require('bunyan')
  , log = bunyan.createLogger({name: 'convert-test'})
  , ffmpeg = require('fluent-ffmpeg')
  , Config = require('config')
  , Plex = require('plex-api')
  , client = new Plex(Config.get('Plex.host'))
  , kue = require('kue')
  , jobs = kue.createQueue({
    redis: Config.get('Redis')
  })
  ;



jobs.process('convert', function( job, done ){

  async.map( job.data.files, function( file, next ){

    file = Config.get('Worker.srcPath') + file;
    var output = path.dirname( file ) + '/' + path.basename( file, path.extname( file )) +'.mp4';

    ffmpeg(file)
      .on('start', function( command ){
        log.info('Spawned Ffmpeg: ', command )
      })
      .on('error', function(err, stdout, stderr) {
        log.error('Cannot process video', err);
        next( err );
      })
      .on('progress', function(progress) {
        job.progress( progress.percent,  100 );
        log.info('Processing: %s done', progress.percent);
      })
      .on('end', function(){
        log.info('Transcoding complete');
        next();
      })
//      .duration('0:00:10.000')
      .output( output )
      .outputOptions([
        '-movflags faststart',
        '-level 5',
        //'-x264opts bframes=3:cabac=1',
        //'-maxrate 10M',
        //"-bufsize 16M",
        //'-profile:v high',
        //'-crf 18',
        '-q:a 100',
        '-strict -2',
      ])
      .audioCodec('aac')
      .videoCodec('libx264')
      .run()
  }, function( err ){
    console.log('here?')
    if( err )
      return done( err );

    // remove old files
    async.each( job.data.files, function( file ){
      file = Config.get('Worker.srcPath') + file;
      log.info('Removing:', file)
      return fs.unlink( file );
    });

    if( job.data.refresh ){
      client.query( job.data.refresh ).then( function( result ){
        log.info('Plex refresh: ', job.data.refresh );
        done();
      })
    }else{
      done();
    }
  });

});
