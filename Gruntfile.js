'use strict';

var fs = require('fs');

/**
 * Check for a local JSON file providing the enviroment variables:
 * ICT_CLIENT_ID, ICT_CLIENT_SECRET, ICT_EMAIL_ID, ICT_PASSWORD
 */
if (fs.existsSync('./test/env.json')) {
  var env = require('./test/env');
  for (var e in env) {
    process.env[e] = env[e];
  }
} else {
  console.warn("Couldn't find env.json. This will still work in travis-ci, but local tests will fail.");
}

module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          timeout: '100s'
        },
        src: ['test/integration/**/*.js']
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
      // test: {
      //   src: ['test/**/*.js']
      // },
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
          destination: 'doc'
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