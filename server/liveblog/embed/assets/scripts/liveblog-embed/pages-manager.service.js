(function(angular) {
    'use strict';

    PagesManagerFactory.$inject = ['posts', '$q'];
    function PagesManagerFactory(postsService, $q) {

        function PagesManager (max_results) {

            var self = this;

            /**
             * Represent a page of posts
             * @param {array} [posts=[]] - a list of post to initialize the page
             */
            function Page(posts) {
                return {
                    posts: posts || [],
                    addPost: function(post) {this.posts.push(post);}
                };
            }

            /**
             * Retrieve the given page of post from the api
             * @param {integer} page - The page index to retrieve (start from 1)
             * @param {integer} [max_results=self.max_results] - The maximum number of results to retrieve
             * @returns {promise}
             */
            function retrievePage(page, max_results) {
                // set request parameters
                var posts_criteria = {
                    source: {
                        query: {filtered: {filter: {and: [{term: {post_status: 'open'}}, {not: {term: {deleted: true}}}]}}},
                        sort: [{order: {order: 'desc', missing:'_last', unmapped_type: 'long'}}]
                    },
                    page: page,
                    max_results: max_results || self.max_results
                };
                return postsService.get(posts_criteria).$promise.then(function(data) {
                    // update posts meta data (used to know the total number of posts and pages)
                    self.meta = data._meta;
                    return data;
                });
            }

            /**
             * Fetch a new page of posts and add it to the Pages Manager.
             * @returns {promise}
             */
            function fetchNewPage() {
                var promise = $q.when();
                // for the first time, retrieve the updates just to know the latest update date
                if (self.pages.length === 0) {
                    promise = self.retrieveUpdate().then(function(updates) {
                        updateLatestDates(updates._items);
                    });
                }
                return promise.then(function() {
                    return reloadPagesFrom(0, self.pages.length + 1);
                });
            }

            /**
             * Retrieve all the updates since the latest updated date
             * @param {boolean} [should_apply_updates=false] - If true, will apply the updates into the posts list
             * @returns {promise}
             */
            function retrieveUpdate(should_apply_updates) {
                should_apply_updates = should_apply_updates === true;
                var date = self.latest_updated_date ? self.latest_updated_date.utc().format() : undefined;
                var posts_criteria = {
                    blogId: window.LB_BLOG_ID,
                    page: 1,
                    source: {
                        sort: [{_updated: {order: 'desc'}}],
                        query: {filtered: {filter: {and: [
                            {range: {_updated: {gt: date}}}
                        ]}}}
                    }
                };
                return postsService.get(posts_criteria).$promise.then(function(updates) {
                    var meta = updates._meta;
                    // if 
                    // - there is no other page 
                    // - or if we don't give a latest update date (b/c we look after the meta or the latest date)
                    // = then we return the first page of result
                    if (meta.total <= meta.max_results * meta.page || !angular.isDefined(date)) {
                        return updates;
                    // Otherwise we ask page after page and concatenate them in the response
                    } else {
                        var promises = [];
                        for (var i = meta.page + 1; i <= Math.floor(meta.total / meta.max_results) + 1; i++) {
                            posts_criteria.page = i;
                            promises.push(postsService.get(posts_criteria).$promise);
                        }
                        return $q.all(promises).then(function(updates_pages) {
                            return angular.extend({} ,updates_pages[0], {
                                _items: [].concat.apply([], updates_pages.map(function(update) {return update._items;})),
                                _meta: angular.extend(meta, {max_results: meta.max_results * updates_pages.length})
                            });
                        });
                    }
                })
                // Apply the update if needed
                .then(function(updates) {
                    if (should_apply_updates) {
                        applyUpdates(updates._items);
                    }
                    return updates;
                });
            }

            /**
             * Apply the given updates to the posts list
             * @param {array} updates - List of updated posts
             */
            function applyUpdates(updates) {
                updates.forEach(function(post) {
                    var existing_post_indexes = getPostPageIndexes(post);
                    if (angular.isDefined(existing_post_indexes)) {
                        // post already in the list
                        if (post.deleted) {
                            // post deleted
                            removePost(post);
                        } else {
                            // post updated
                            if (post.post_status === 'draft') {
                               removePost(post);
                            } else {
                                // update
                                self.pages[existing_post_indexes[0]].posts[existing_post_indexes[1]] = post;
                                createPagesWithPosts();
                           }
                        }
                    } else {
                        // post doesn't exist in the list
                        if (!post.deleted && post.post_status === 'open') {
                            addPost(post);
                        }
                    }
                });
                // update date
                updateLatestDates(updates);
            }

            /**
             * Update the latest update date by using the given posts
             * @param {array} posts - List of posts
             */
            function updateLatestDates(posts) {
                var date;
                posts.forEach(function(post) {
                    date = moment(post._updated);
                    if (angular.isDefined(self.latest_updated_date)) {
                        if (self.latest_updated_date.diff(date) < 0) {
                            self.latest_updated_date = date;
                        }
                    } else {
                        self.latest_updated_date = date;
                    }
                });
            }

            /**
             * Recreate the pages from the given posts
             * @param {array} [posts=self.allPosts()] - List of posts
             */
            function createPagesWithPosts(posts) {
                posts = posts || self.allPosts();
                self.pages = [];
                // respect the order
                // TODO: allow other field for ordering
                posts.sort(function(a, b) {return a.order < b.order;});
                var page;
                posts.forEach(function(post, index) {
                    if (index % self.max_results === 0) {
                        page = new Page();
                    }
                    page.addPost(post);
                    if (page.posts.length === self.max_results) {
                        addPage(page);
                        page = undefined;
                    }
                });
                if (angular.isDefined(page)) {
                    addPage(page);
                }
            }

            /**
             * Resynchronize the content of the given page and the following ones
             * @param {interger} page_index - index of the first page
             * @param {interger} [to=self.pages.length] - latest wanted page
             * @returns {promise}
             */
            function reloadPagesFrom(page_index, to) {
                to = to || self.pages.length;
                return retrievePage(1, to * self.max_results).then(function(posts) {
                    createPagesWithPosts(posts._items);
                });
            }

            /**
             * Returns the page index and the post index of the given post in the local pages
             * @param {Post} post_to_find - post to find in the pages
             * @returns {array} - [page_index, post_index]
             */
            function getPostPageIndexes(post_to_find){
                var page;
                for (var page_index = 0; page_index < self.pages.length; page_index++) {
                    page = self.pages[page_index];
                    for (var post_index = 0; post_index < page.posts.length; post_index++) {
                        if (page.posts[post_index]._id === post_to_find._id) {
                            return [page_index, post_index];
                        }
                    }
                }
            }

            /**
             * Add a post or a list of posts to the local pages
             * @param {Post|array<Post>} posts - posts to be added to the pages
             */
            function addPost(posts) {
                var all_posts = self.allPosts();
                if (!angular.isArray(posts)) {
                    posts = [posts];
                }
                // for every post, check if exist before or add it
                posts.forEach(function(post) {
                    if (!angular.isDefined(getPostPageIndexes(post))) {
                        all_posts.push(post);
                    }
                });
                // and recreate pages
                createPagesWithPosts(all_posts);
                // update date
                updateLatestDates(all_posts);
            }

            /**
             * Remove a post in the local pages
             * @param {Post} post_to_remove - posts to be removed from the pages
             */
            function removePost(post_to_remove) {
                var indexes = getPostPageIndexes(post_to_remove);
                if (angular.isDefined(post_to_remove)) {
                    var page_index = indexes[0];
                    var post_index = indexes[1];
                    self.pages[page_index].posts.splice(post_index, 1);
                    createPagesWithPosts(self.allPosts());
                }
            }

            /**
             * Add the given page to the Page Manager
             * @param {Page} page - a page instance
             */
            function addPage(page) {
                self.pages.push(page);
            }

            /**
             * Returns the number of posts in the local pages
             * @returns {integer}
             */
            function count() {
                return self.pages.reduce(function(previous_value, current_value) {
                    return previous_value + current_value.posts.length;
                }, 0);
            }

            angular.extend(self, {
                /**
                 * List of page instances
                 */
                pages: [],
                /**
                 * Represent the meta data of posts (total number for instance)
                 */
                meta: {},
                /**
                 * Number of results per page
                 */
                max_results: max_results,
                /**
                 * Latest updated date. Used for retrieving updates since this date.
                 */
                latest_updated_date: undefined,
                /**
                 * Fetch a new page of posts
                 */
                fetchNewPage: fetchNewPage,
                /**
                 * Return the latest available updates
                 */
                retrieveUpdate: retrieveUpdate,
                /**
                 * Return all the posts from the local pages
                 */
                allPosts: function () {
                    var posts = self.pages.map(function(page) {
                        return page.posts.map(function(post) {
                            return post;
                        });
                    });
                    // flatten array
                    var merged = [];
                    return merged.concat.apply(merged, posts);
                }
            });
        }

        // return the Pages Manager constructor
        return PagesManager;
    }

    angular.module('liveblog-embed')
        .factory('PagesManager', PagesManagerFactory);

})(angular);
