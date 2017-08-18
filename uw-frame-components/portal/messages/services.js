'use strict';

define(['angular'], function(angular) {
  return angular.module('portal.messages.services', [])
    .factory('messagesService', [
      '$http',
      '$log',
      '$localStorage',
      '$sessionStorage',
      '$q',
      '$filter',
      'portalGroupService',
      'miscService',
      'keyValueService',
      'SERVICE_LOC',
      'MESSAGES',
      'KV_KEYS',
      function($http,
               $log,
               $localStorage,
               $sessionStorage,
               $q,
               $filter,
               portalGroupService,
               miscService,
               keyValueService,
               SERVICE_LOC,
               MESSAGES,
               KV_KEYS) {
        // //////////////////
        // Exposed methods //
        // //////////////////

        /**
         * @typedef {Object} Message
         * @property {number} id
         * @property {string} title
         * @property {string} titleShort
         * @property {string} description
         * @property {string} descriptionShort
         * @property {string} messageType
         * @property {string} goLiveDate
         * @property {string} expireDate
         * @property {string} featureImageUrl
         * @property {string} priority
         * @property {Object} actionButton
         * @property {Object} moreInfoButton
         * @property {Object} confirmButton
         */

        /**
         * Get everything at the messages service endpoint
         * @returns {Array} An array of message objects
         */
        var getAllMessages = function() {
          return $http.get(SERVICE_LOC.messagesURL)
            .then(function(response) {
              return response.data;
            })
            .catch(function(error) {
              miscService.redirectUser(error.status, 'Get all messages');
            });
        };

        /**
         * Filter the array of messages based on each message's groups
         * attribute
         * @param messages An array of message objects
         * @returns {Array} A filtered array of messages
         */
        var getMessagesByGroup = function(messages) {
          return portalGroupService.getGroups()
            .then(function(groups) {
              var messagesByGroup = [];
              angular.forEach(messages, function(message) {
                var added = false;
                // If the message's groups array has groups,
                // check for matches against portal groups
                if (message.audienceFilter.groups.length > 0) {
                  // For each group for the current message
                  angular.forEach(message.audienceFilter.groups,
                    function(messageGroup) {
                      if (!added) {
                        // Check for matches against the groups returned
                        // by portalGroupService
                        var intersectedGroups = $filter('filter')(
                          groups,
                          {name: messageGroup}
                        );
                        if (intersectedGroups.length > 0) {
                          // If user is in this group, he should see this
                          // notification
                          messagesByGroup.push(message);
                          added = true;
                        }
                      }
                    });
                } else {
                  // If the message's groups array is empty or null,
                  // show it to everyone
                  messagesByGroup.push(message);
                  added = true;
                }
              });
              return messagesByGroup;
            })
            .catch(function(error) {
              $log.warn('Problem getting groups from portalGroupService');
              miscService.redirectUser(
                error.status, 'Unable to retrieve groups');
            });
        };

        /**
         * Filter the array of messages based on if
         * data was requested before showing
         * @param messages An array of message objects
         * @returns {filteredMessages[]} an array of messages that
         *   includes only non-data messages and messages that requested
         *   data and had data
         */
        var getMessagesByData = function(messages) {
          // Initialize method variables
          var promises = [];
          var filteredMessages = [];

          angular.forEach(messages, function(message) {
            if (message.audienceFilter.dataUrl) {
              // If the message has a dataUrl, add it to promises array
              promises.push($http.get(message.audienceFilter.dataUrl)
                .then(function(result) {
                  var objectToFind = result.data;
                  // If dataObject specified, try to use it
                  if (result && message.audienceFilter.dataObject) {
                    objectToFind =
                      objectToFind[message.audienceFilter.dataObject];
                  }
                  // If dataArrayFilter specified, then use it to filter
                  if (objectToFind && message.audienceFilter.dataArrayFilter) {
                    var arrayFilter = angular.fromJson(
                      message.audienceFilter.dataArrayFilter
                    );
                    // If you try to do an array filter on a non-array,
                    // return blank
                    if (!angular.isArray(objectToFind)) {
                      return;
                    }
                    if ($filter('filter')(
                        objectToFind,
                        arrayFilter
                      ).length > 0) {
                      return message;
                    }
                  } else if (objectToFind) {
                    return message;
                  }
                  return message;
                }).catch(function(error) {
                  $log.warn('Error retrieving data for notification');
                  $log.error(error);
                }
              ));
            } else {
              filteredMessages.push(message);
            }
          });

          // Once all the promises are prepared, run 'em
          return $q.all(promises)
            .then(function(result) {
              angular.forEach(result, function(message) {
                if (message) {
                  filteredMessages.push(message);
                }
              });
              return filteredMessages;
            });
        };

        /**
         * Get list of seen message IDs from K/V store or session storage
         * @returns {*}
         */
        var getSeenMessageIds = function() {
          // If K/V store isn't turned on, don't proceed
          if (!keyValueService.isKVStoreActivated()) {
            return $q.resolve([]);
          }

          return keyValueService.getValue(KV_KEYS.VIEWED_MESSAGE_IDS)
            .then(function(result) {
              if (result && angular.isArray(result)) {
                return result;
              }
              return $q.reject(result);
            })
            .catch(function(error) {
              return [];
            });
        };

        /**
         * Set list of seen IDs in K/V store and session storage
         * @param originalSeenIds The ids when the controller initialized
         * @param alteredSeenIds The ids following action in the controller
         * @param action The action to take (restore or dismiss)
         * @returns {*}
         */
        var setMessagesSeen = function(originalSeenIds,
                                       alteredSeenIds,
                                       action) {
          $log.log('[Set Messages Seen]: inside setMessagesSeen '
            + 'with original ids', originalSeenIds);
          $log.log('[Set Messages Seen]: inside setMessagesSeen '
            + 'with updated ids', alteredSeenIds);
          // If K/V store isn't activated, don't proceed
          if (!keyValueService.isKVStoreActivated()) {
            $log.log('this should fire in local dev');
            return $q.resolve($sessionStorage.seenMessageIds);
          }

          // Update stored IDs based on the action taken
          if (action === 'restore') {
            $log.log('action is restore');
            $log.log('original:', originalSeenIds);
            $log.log('altered:', alteredSeenIds);
            $log.log('expectation: altered and end result should have '
              + 'FEWER values than original');
            // If original array has values no longer present
            // in updated array, remove them
            //
            angular.forEach(originalSeenIds, function(id, index) {
              if (alteredSeenIds.indexOf(id) == -1) {
                originalSeenIds.splice(index, 1);
              }
            });
          } else if (action === 'dismiss') {
            $log.log('action is dismiss');
            $log.log('original:', originalSeenIds);
            $log.log('altered:', alteredSeenIds);
            $log.log('expectation: altered and end result should have '
              + 'MORE values than original');
            // Add any IDs in the updated array to the original array
            angular.forEach(alteredSeenIds, function(id) {
              if (originalSeenIds.indexOf(id) == -1) {
                originalSeenIds.push(id);
              }
            });
          }
          $log.log('after cycling through arrays, originalSeenIds now has:',
            originalSeenIds);
          return keyValueService.setValue(KV_KEYS.VIEWED_MESSAGE_IDS,
            originalSeenIds)
            .then(function() {
              $log.log('[Set Messages Seen]: successfully set values '
                + 'in k/v store', originalSeenIds);
              return originalSeenIds;
            })
            .catch(function(error) {
              $log.warn('Problem setting seen message IDs in storage');
              return error;
            });
        };

        return {
          getAllMessages: getAllMessages,
          getMessagesByGroup: getMessagesByGroup,
          getMessagesByData: getMessagesByData,
          getSeenMessageIds: getSeenMessageIds,
          setMessagesSeen: setMessagesSeen,
        };
    }]);
});
