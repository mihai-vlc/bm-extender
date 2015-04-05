module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-crx');

    grunt.initConfig({
      crx: {
        dwreSidebar: {
          src: "src/",
          dest: "dist/dwre_sidebar.crx",
          privateKey: "~/.ssh/chrome.pem"
        }
      }
    });


    grunt.registerTask('default', ['crx']);

};
