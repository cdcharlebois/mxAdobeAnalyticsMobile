define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "AdobeAnalytics/widget/AdobeAnalytics"
], function(declare, lang, ContextWidget) {
    return declare("AdobeAnalytics.widget.AdobeAnalyticsNoContext", [ContextWidget], {
        update: function(obj, callback) {
            logger.debug(this.id + ".update");
            this._preparePayloads() // DONE
                .then(lang.hitch(this, this._replaceTokens)) // DONE
                .then(lang.hitch(this, this._attachListeners)) // DONE
                .then(this._updateRendering(callback));
        },
    });
});

require(["AdobeAnalytics/widget/AdobeAnalyticsNoContext"]);