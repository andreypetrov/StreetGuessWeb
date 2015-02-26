/**
 * Created by Andrey Petrov on 15-02-25.
 */
(function () {
    angular.module('app', ['app.core']);




    angular
        .module('app')
        .factory('dataservice', ['$http', 'logger', function ($http, logger) {
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
        }]);

    console.log("dataservice defined");
})();