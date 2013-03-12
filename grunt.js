/*global module:false*/
module.exports = function (grunt) {
    var fs = require('fs');

    // grunt doesn't natively support reading config from .jshintrc yet
    var jshintOptions = JSON.parse(fs.readFileSync('./.jshintrc'));

    // Project configuration.
    grunt.initConfig({
        pkg: '<json:package.json>',
        meta: {
            banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;' +
                ' Licensed <%= pkg.license %> */'
        },

        jshint: {
            options: jshintOptions,
            globals: jshintOptions.predef
        },

        lint: {
            files: [
                'thumbs.js'
            ]
        },

        jasmine: {
            all: {
                src: ['test/runner.html'],
                errorReporting: true,
                timeout: 20000
            }
        },
        concat: {
            dist: {
                src: ['<banner:meta.banner>', '<%= pkg.name %>.js>'],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        min: {
            dist: {
                src: ['<banner:meta.banner>', 'thumbs.js'],
                dest: '<%= pkg.name %>.min.js'
            }
        },
        watch: {
            files: '<config:lint.files>',
            tasks: 'lint qunit'
        },
        uglify: {}
    });

    // Default task.
    grunt.registerTask('default', 'lint concat min');
    grunt.loadNpmTasks('grunt-jasmine-task');

};
