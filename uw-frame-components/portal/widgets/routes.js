define(['require'], function(require) {

  return {
    'demoWidgets': {
      templateUrl: require.toUrl('./partials/demo-widgets.html'),
    },
    'widgetCreator': {
      templateUrl: require.toUrl('./partials/widget-creator.html'),
    },
  }
});
