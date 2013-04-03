/*global module:false*/
module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;' +
                ' Licensed <%= pkg.license %> */'
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            thumbs: {
                src: 'thumbs.js'
            }
        },

        jasmine: {
            thumbs: {
                src: [
                    'components/jquery/jquery.js',
                    'components/underscore/underscore.js',
                    'components/backbone/backbone.js',
                    'thumbs.js'
                ],
                options: {
                    specs: 'test/spec/*Spec.js',
                    helpers: [
                        'components/sinon/index.js',
                        'components/jasmine-sinon/lib/jasmine-sinon.js',
                        'components/jasmine-jquery/lib/jasmine-jquery.js',
                        'test/spec/helpers.js'
                    ]
                }
            }
        },
        concat: {
            dist: {
                src: ['<banner:meta.banner>', '<%= pkg.name %>.js>'],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        uglify: {
            dist: {
                src: ['<banner:meta.banner>', 'thumbs.js'],
                dest: '<%= pkg.name %>.min.js'
            }
        },
        watch: {
            thumbs: {
                files: 'thumbs.js',
                tasks: ['jshint', 'jasmine']
            },
        }
    });

    // Default task.
    grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
    grunt.registerTask('test', ['jshint', 'jasmine']);
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

};
