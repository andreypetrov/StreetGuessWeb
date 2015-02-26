/**
 *
 * Always use IIFE - Immediately Invoked Function Expression to capsulate code.
 * For more information see https://github.com/johnpapa/angularjs-styleguide#style-y010
 *
 * Created by Andrey Petrov on 15-02-25.
 */
(function () {
    'use strict';

    angular
        .module('app')
        //.factory('dataservice', function(){
        //    console.log("wow");
        //    return {
        //        getBlogPosts: ""
        //    }
        //})
        .controller('MainController', MainController);

    MainController.$inject = ['dataservice'];

    function dataservice($http, logger) {
        return {
            getBlogPosts: getBlogPosts
        };

        function getBlogPosts() {
            return $http.get('/api/blog')
                .then(getBlogPostsComplete)
                .catch(getBlogPostsFailed);

            function getBlogPostsComplete(response) {
                return response.data.results;
            }

            function getBlogPostsFailed(error) {
                logger.error('XHR Failed for getAvengers.' + error.data);
            }
        }
    }

    function MainController(dataservice) {
        dataservice.getBlogPosts().then(function(data) {
            console.log("well done: ");
            console.log(data);

        });


        var vm = this;
        vm.name = "bla";
        console.log("This is the main controller");

    };
})();