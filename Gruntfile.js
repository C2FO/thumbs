/*global module:false*/
module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner:
                '// Thumbs.js <%= pkg.version %>\n' +
                '//\n' +
                '// Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>.\n' +
                '// Distributed under <%= pkg.license %> license.\n' +
                '//\n' +
                '// http://thumbsjs.com\n'
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            thumbs: {
                src: [
                    'src/*.js'
                ]
            }
        },

        jasmine: {
            options: {
                helpers: [
                    'components/sinon/index.js',
                    'components/jasmine-sinon/lib/jasmine-sinon.js',
                    'components/jasmine-jquery/lib/jasmine-jquery.js',
                    'test/helpers.js'
                ],
                vendor: [
                    'components/jquery/dist/jquery.js',
                    'components/underscore/underscore.js',
                    'components/backbone/backbone.js'
                ]
            },
            thumbs: {
                src: [
                    'src/thumbs.core.js',
                    'src/thumbs.class.js',
                    'src/thumbs.model.js',
                    'src/thumbs.collection.js',
                    'src/thumbs.history.js',
                    'src/thumbs.router.js',
                    'src/thumbs.view.js',
                    'src/thumbs.templateView.js'
                ],
                options: {
                    specs: 'test/spec/*.spec.js'
                }
            },
            build: {
                src: ['thumbs.min.js'],
                options: {
                    specs: '<%= jasmine.thumbs.options.specs %>'
                }
            }
        },

        preprocess: {
            options: {
                inline: true,
                context: {
                    banner: '<%= meta.banner %>'
                }
            },
            build: {
                files: {
                    'thumbs.js': 'src/thumbs.core.js'
                }
            }
        },

        uglify: {
            options: {
                banner: '<%= meta.banner %>'
            },
            dist: {
                src: ['<banner:meta.banner>', 'thumbs.js'],
                dest: '<%= pkg.name %>.min.js'
            }
        },

        connect: {
            server: {
                options: {
                    port: 8888,
                    base: '.',
                    hostname: '*'
                }
            }
        },

        clean: ['node_modules', "components"],

        watch: {
            thumbs: {
                files: ['src/*.js', 'test/spec/*.spec.js'],
                tasks: ['jshint', 'jasmine:thumbs']
            }
        }
    });

    // Default task.
    grunt.registerTask('default', ['build']);
    grunt.registerTask('build', ['jshint', 'test', 'preprocess', 'uglify']);
    grunt.registerTask('test', ['jshint', 'jasmine:thumbs']);
    grunt.registerTask('server', ['connect:server:keepalive']);

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-preprocess');

};
