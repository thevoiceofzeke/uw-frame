/*
 * Licensed to Apereo under one or more contributor license
 * agreements. See the NOTICE file distributed with this work
 * for additional information regarding copyright ownership.
 * Apereo licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License.  You may obtain a
 * copy of the License at the following location:
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
'use strict';

define(['angular'], function(angular) {
  return angular.module('portal.widgets.services', [])

  .factory('widgetService', [
    '$http', '$log', 'SERVICE_LOC',
    function($http, $log, SERVICE_LOC) {
    /**
     * @typedef {Object} ExternalMessage
     * @property {string} messageText
     * @property {string} learnMoreUrl
    */

    /**
     * Get the a single app's full entity file as JSON
     * @param {string} fname - The app's fname value (<fname> in entity files)
     * @return {*}
     */
    var getSingleWidgetData = function getSingleWidgetData(fname) {
      // configuration backwards compatibility
      var entrySuffix =
        angular.isUndefined(SERVICE_LOC.widgetApi.entrySuffix) ? '.json' :
          SERVICE_LOC.widgetApi.entrySuffix;
      return $http.get(SERVICE_LOC.widgetApi.entry + fname + entrySuffix)
        .then(function(result) {
          if (angular.isDefined(result.data.entry.layoutObject)) {
            return result.data.entry.layoutObject;
          }
          return undefined;
        })
        .catch(function(error) {
          $log.warn('Error getting app directory entry for ' + fname);
          $log.error(error);
          return getErrorPage(fname);
        });
    };

    /**
     * Display error message if a user doesn't have
     * permission to see/use the requested widget
     * @param {string} fname
     * @return {Object} Special error-case widget configuration
     */
    var getErrorPage = function(fname) {
      return {
        title: fname,
        mdIcon: 'help',
        widgetType: 'generic',
        widgetConfig: {
          additionalText: 'Please contact your help desk if you ' +
            'feel you should be able to access this content',
        },
        widgetTemplate: '<div class=\'overlay__widget-mode\'>' +
        '<div class=\'overlay-content\'>' +
        '<p><md-icon class=\'md-warn\'>warning</md-icon></p>' +
        '<p>You do not have permission to access this content. ' +
        'If you feel this is an error, please contact your help desk.</p>' +
        '</div>' +
        '</div>',
      };
    };

    /**
     * Retrieve the widget external messaging if widget.widgetExternalMessageUrl
     * is configured, otherwise will return null.
     * @param {Object} widget
     * @return {ExternalMessage} message text
     */
    var getWidgetExternalMessage = function(widget) {
      var externalMessage = {};
      return $http.get(widget.widgetExternalMessageUrl, {cache: true})
        .then(function(result) {
          if (widget.widgetExtneralMessageTextObjectLocation &&
            angular.isArray(widget.widgetExtneralMessageTextObjectLocation)) {
            var messageText = result.data;
            angular.forEach(widget.widgetExtneralMessageTextObjectLocation,
              function(value, key) {
                messageText = messageText[value];
            });
            externalMessage.messageText = messageText;
          } else {
            $log.warn('Could not parse external message text for ' +
              widget.fname);
          }

          // Determine the learn more link if configured
          if (widget.widgetExternalMessageLearnMoreUrl &&
            angular.isArray(widget.widgetExternalMessageLearnMoreUrl)) {
            var learnMoreUrl = result.data;
            angular.forEach(widget.widgetExternalMessageLearnMoreUrl,
              function(value, key) {
              learnMoreUrl = learnMoreUrl[value];
            });
            externalMessage.learnMoreUrl = learnMoreUrl;
          }
          return externalMessage;
        })
        .catch(function(error) {
          $log.warn('Could not retrieve external message for: '
            + widget.fname);
          return null;
        });
    };

    /**
     * Get additional values/configuration not provided
     * by the widget's basic configuration.
     * Used by Option Link and Custom widgets
     * @param {Object} widget
     * @return {*}
     */
    var getWidgetJson = function(widget) {
      return $http.get(widget.widgetURL, {cache: true})
        .then(function(result) {
          var data = result.data;
          // Consider refactoring to only pull in widgetUrl and
          // only return the raw result -- sorting what to do with
          // the result should be the controller's responsibility
          if (data) {
            if (data.result) {
              widget.widgetData = data.result;
            }
            if (data.content) {
              widget.widgetContent = data.content;
            }
          }
          return data;
        })
        .catch(function(error) {
          $log.error(error);
        });
    };


    /**
     * Get an RSS feed from the provided url as json
     * @param {string} url
     * @return {*}
     */
    var getRssAsJson = function(url) {
      console.log('getting rss as json from url: ' + url);
      return $http.get(url, {cache: true})
        .then(function(result) {
          //
          console.log('successfully got rss as json');
          console.log(result);
          return result.data;
        })
        .catch(function(error) {
          $log.error('Couldn\'t get rss as JSON: ');
          $log.error(error)
        });
    };


    /**
     * Get the quantity of items needing attention
     * for an action-item widget
     * @param {string} url - The url provided in widgetConfig
     * @return {number} The number of items needing attention
     */
    var getActionItemQuantity = function(url) {
      return $http.get(url)
        .then(function(result) {
          return result.data;
        })
        .catch(function(error) {
          $log.warn('Couldn\'t get action item quantity.');
          $log.error(error);
        });
    };

    return {
      getSingleWidgetData: getSingleWidgetData,
      getErrorPage: getErrorPage,
      getWidgetJson: getWidgetJson,
      getRssAsJson: getRssAsJson,
      getActionItemQuantity: getActionItemQuantity,
      getWidgetExternalMessage: getWidgetExternalMessage,
    };
  }]);
});
