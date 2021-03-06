# Messages (technical implementation)

## Bell notifications

Notifications depend on a
JSON feed containing certain attributes and flags. See the
[configuraton](configuration.md) doc for information about how to
point uportal-app-framework to your desired feed.

### Example bell notification message

*Note: All messages must be contained within the "messages" array.*

```json
{
    "messages": [
        {
            "id": "sample-unactivated-services-notification",
            "title": "PRIORITY NOTIFICATIONS ARE DEPRECATED. You need to modify your NetID account to activate essential UW Services.",
            "goLiveDate": "2017-08-01T09:30",
            "expireDate": "2017-08-02",
            "priority": "high",
            "recurrence": true,
            "dismissible": false,
            "audienceFilter": {
                "groups": ["Users - Service Activation Required"],
            },
            "data": {
                "dataUrl": "/restProxyURL/unactivatedServices",
                "dataObject": "services",
                "dataArrayFilter": {"priority":"essential", "type":"netid"},
                "dataMessageTitle": ["result", "title"],
                "dataMessageMoreInfoUrl": ["result", "url"],
            },
            "actionButton": {
                "label": "Activate services",
                "url": "my.wisc.edu/go/example/path"
            },
            "moreInfoButton": {
              "label": "Learn more",
              "url": "/learnMore"
            }
        }
    ]
}
```

**Attribute breakdown**

- **id**: A unique string to identify the message. This is used for tracking
  seen/unseen messages, dimissed notifications, and the sort order on the
  notifications page.
- **title**: The text to be displayed as the message's main content.
  **Best practices:**
  - Be concise! Limit the title to 140 characters. Shorter titles improve
    click-through and are more likely to display correctly on smaller screens.
    *Titles longer than 140 characters will be truncated (with ellipsis)* for
    consistent appearance.
  - Use general language and avoid pronouns for broadly visible messages that
    may not be relevant to the viewing user (example:
    "City of Madison - Declared Snow Emergency").
  - Use the word "You" for well-targeted messages known to be relevant to the
    viewing user. ("You have an unpaid parking ticket.")
- **goLiveDate**: *(optional)* ISO date, including time (as pictured). The
  message will display only after this moment.
- **expireDate**: *(optional)* ISO date, including time (as pictured). The
  message will display only before this moment.
- **priority**: DEPRECATED "high" triggers higher visibility
- **recurrence**: *(experimental, optional)* If true, even if a notification is
  dismissed, it will continue to reoccur in the user's home at the start of
  every session until the user is no longer a member of the targeted group. For
  example, if a user is a member of students-with-outstanding-parking-tickets,
  that user will be confronted with the notification at every login until they
  pay the fine.
- **dismissible**: *(experimental, optional)* `false` prevents dismissing the
  notification. If `true` or not set at all, the notification will be
  dismissible.
- **audienceFilter**: A group of attributes related to filtering messages to
  their intended audiences. Aspirationally, more than group filtering. In
  practice all that's here is group filering.
  - **groups**: *(optional)* Optionally show messages only to specific groups
    (i.e. uPortal groups) named in this array. If omitted, null, or an empty
    array, group memberships will not limit message display.
- **data**: *(optional)* A group of attributes related to external data
  retrieved by a dataUrl.
  - **dataUrl**: *(optional)* The user's browser will retrieve JSON data from
    the dataUrl. If data exists, the message displays. Use this feature to only
    show the message if the specific user has data. For example: Only show a
    message if the user as a specific document.
  - **dataObject**: *(optional)* An optional further refinement from dataUrl.
    The notification will show only if the named object is in the data.
  - **dataArrayFilter**: An optional further refinement from dataUrl, filtering
    the returned array. Supports multiple filtering criteria as shown in the
    example. Filters to `dataObject` first if `dataObject` is set.
    [AngularJS array filtering documentation](https://docs.angularjs.org/api/ng/filter/filter)
  - **dataMessageTitle** Sets the title of the message from the data response
    from `dataUrl`.  Expects an array for where to find the title in the data
    response from `dataUrl`.
  - **dataMessageMoreInfoUrl** Sets the url of a configured
    `more info button`.  Expects an array for where to find the
    `more info button url` in the data response from `dataUrl`.
- **actionButton**: Defines the call to action associated with the notification.
  - **label**: The button's text
  - **url**: The URL to go to when clicked
- **moreInfoButton**: Defines where the user can read more, see more, or
  interact with the subject of the message. Same format as `actionButton`.

A given message can have at most one each of the `actionButton` and
`moreInfoButton`.

"PRIORITY" NOTIFICATIONS ARE DEPRECATED. In a future release notifications with
non-null "priority" will not be supported.

Historically there was a **messageType** that distinguished between
"notification" and "announcement". This *no longer has any effect.*

## Banner messages

Banner messages are sourced from a JSON feed. See
[configuraton](configuration.md) for information about how to point
uportal-app-framework to a banner message feed.

When no feed is configured, the framework turns off the banner message feature.

Banner messages are sourced as an array, but only the first item in the array
informs the user experience; any messages after the first in the array have no
effect. (The back end is therefore expected to prioritize these messages.)

```json
[
  {
    "text": "Brief message to user",
    "icon": "optional-material-icon",
    "button": {
      "label": "Take action",
      "url": "https://www.example.edu/somewhere"
    }
  }
]

```

A zero item array of banner messages suppresses the banner message feature.

## Widget messages

Widget messaging is based on JSON input configured in a
[widget's configuration](make-a-widget.md).

Configuration is done by two required items and one optional.  Required is a url
where to find a JSON object and an array representing where in the object the
message can be found.  Optional is an array representing where in the object the
learn more url can be found.
The url to find the JSON object can be both external and internal to the app's
configuration.

Example JSON object

```json
{
  "status": "Success",
  "result": [
    {
      "message": "This is an important message that includes an optional learn more link for more information."
    }
  ],
 "learnMoreUrl": "https://apereo.org"
}
```

Example widget configuration

```xml
<portlet-preference>
    <name>widgetExternalMessageUrl</name>
    <value>locationToFindJSONObject</value>
</portlet-preference>
<portlet-preference>
    <name>widgetExtneralMessageTextObjectLocation</name>
    <value>["result", 0, "message"]</value>
</portlet-preference>
<portlet-preference>
    <name>widgetExternalMessageLearnMoreUrl</name>
    <value>["learnMoreUrl"]</value>
</portlet-preference>

```

## Exercises

### Bell notifications

Follow these steps to create a notification.

1. Add a JSON message to
[components/staticFeeds/sample-messages.json](https://github.com/uPortal-Project/uportal-app-framework/blob/master/components/staticFeeds/sample-messages.json)
2. [Start frame](quickstart.md)
3. Try changing some of the options.

You can use this example JSON:

```json
{
    "id": "sample-notification-uportal-app-framework-docs",
    "title": "Learn how to create a notification",
    "goLiveDate": null,
    "expireDate": null,
    "priority": null,
    "audienceFilter": {
        "groups": [],
    },
    "actionButton": {
        "label": "Take action",
        "url": "http://uportal-project.github.io/uportal-app-framework/messaging-implementation.html"
    },
    "moreInfoButton": null
}
```
