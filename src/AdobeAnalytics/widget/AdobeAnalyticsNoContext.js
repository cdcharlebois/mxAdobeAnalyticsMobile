define([
    "dojo/_base/declare",
    "AdobeAnalytics/widget/AdobeAnalytics"
], function(declare, ContextWidget) {
    return declare("AdobeAnalytics.widget.AdobeAnalyticsNoContext", ContextWidget);
});

require(["AdobeAnalytics/widget/AdobeAnalyticsNoContext"]);