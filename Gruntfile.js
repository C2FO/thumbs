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
                    'test/spec/helpers.js'
                ],
                vendor: [
                    'components/jquery/jquery.js',
                    'components/underscore/underscore.js',
                    'components/backbone/backbone.js'
                ]
            },
            thumbs: {
                src: [
                    'src/thumbs.core.js',
                    'src/thumbs.class.js',
                    'src/thumbs.helpers.js',
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
            old: {
                src: [
                    'thumbs.js'
                ],
                options: {
                    specs: 'test/spec/*Spec.js'
                }
            }
        },

        preprocess: {
            options: {
                inline: true
            },
            build: {
                files: {
                    'thumbs.js': 'src/thumbs.core.js'
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

        connect: {
            server: {
                options: {
                    port: 8888,
                    base: '.',
                    hostname: '*'
                }
            }
        },

        watch: {
            thumbs: {
                files: ['src/*.js', 'test/spec/*.spec.js'],
                tasks: ['jshint', 'jasmine:thumbs']
            }
        }
    });

    // Default task.
    grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
    grunt.registerTask('test', ['jshint', 'jasmine:thumbs']);
    grunt.registerTask('server', ['connect:server:keepalive']);

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-preprocess');

};
