module.exports = {
    assets: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= appDir %>',
            dest: '<%= distDir %>',
            src: [
                'fonts/**/*',
                'images/**/*',
                'favicon.ico',
                'styles/css/*.css'
            ]
        },{
            expand: true,
            dot: true,
            cwd: 'node_modules/superdesk-core/',
            dest: '<%= distDir %>',
            src: [
                'scripts/**/*.html',
            ]
        }]
    },
    locales: {
        files: [
            {
                expand: true,
                cwd: process.cwd(),
                src: ['node_modules/angular-i18n/angular-locale_*.js'],
                dest: '<%= distDir %>/locales/',
                flatten: true,
                filter: 'isFile'
            }
        ]
    },
    index: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= appDir %>',
            dest: '<%= distDir %>',
            src: [ 'index.html' ]
        }]
    },
    sirTrevor: {
        files: [{
            expand: true,
            dot: true,
            cwd: 'node_modules/sir-trevor/',
            dest: '<%= distDir %>',
            src: [ 'sir-trevor.js', 'sir-trevor.css' ]
        }]
    },
    tmp: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= tmpDir %>',
            dest: '<%= distDir %>',
            src: [
                'scripts/lb-templates.js'
            ]
        }]
    },
    docs: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= appDir %>/docs',
            dest: '<%= distDir %>',
            src: [
                'views/**/*.{html,css,jpg,jpeg,png,gif,json}'
            ]
        },
        {
            expand: true,
            dot: true,
            cwd: '<%= appDir %>',
            dest: '<%= distDir %>',
            src: [
                'docs/images/**/*.{jpg,jpeg,png,gif}'
            ]
        }]
    },
    js: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= appDir %>',
            dest: '<%= distDir %>',
            src: [
                'scripts/config.js'
            ]
        }]
    },
    fonts: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= appDir %>',
            dest: '<%= distDir %>',
            src: [
                'fonts/sd_icons.woff',
                'fonts/sd_icons.eot',
                'fonts/sd_icons.svg',
                'fonts/sd_icons.ttf'
            ]
        }]
    //},
    //bower: {
    //    files: [{
    //        expand: true,
    //        dot: true,
    //        cwd: '<%= distDir %>',
    //        dest: '<%= bowerDir %>',
    //        src: [
    //            'images/**',
    //            'styles/css/bootstrap.css',
    //            'styles/css/app.css',
    //            'scripts/vendor.js',
    //            'scripts/superdesk-core.js',
    //            'scripts/superdesk.js',
    //            'scripts/vendor-docs.js',
    //            'scripts/superdesk-docs-core.js',
    //            'scripts/superdesk-docs-main.js'
    //        ]
    //    }]
    }
};
