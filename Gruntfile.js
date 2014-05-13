'use strict';

var fs = require('fs');

module.exports = function (grunt) {
  var src = grunt.option('target') || ['test/integration/**/*.js'];
  // Project configuration.
  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          timeout: '60s',
          slow: '20s',
          require: [

            function () {
              /**
               * Check for a local JSON file providing the enviroment variables:
               * ICT_CLIENT_ID, ICT_CLIENT_SECRET, ICT_EMAIL_ID, ICT_PASSWORD
               */
              if (fs.existsSync('./test/env.json')) {
                var env = require('./test/env');
                for (var e in env) {
                  if (env.hasOwnProperty(e)) {
                    process.env[e] = env[e];
                  }
                }
              } else {
                console.warn("Couldn't find env.json. This will still work in travis-ci, but local tests will fail.");
              }
            }
          ]
        },
        src: src
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        src: ['lib/**/*.js']
      },
      test: {
        src: ['test/**/*.js']
      },
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib', 'nodeunit']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'nodeunit']
      },
    },
    jsdoc: {
      dist: {
        src: ['lib/**/*.js', 'lib/*.js', 'doc/README.md'],
        options: {
          destination: 'dist/doc',
          template: 'doc/template',
          configure: 'doc/template/conf.json'
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jsdoc');

  // Default task.
  grunt.registerTask('default', ['jshint', 'mochaTest', 'jsdoc']);
};