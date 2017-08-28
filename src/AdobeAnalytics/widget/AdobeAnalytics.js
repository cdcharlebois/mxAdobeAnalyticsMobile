define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",

    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",
    "widgets/AdobeAnalytics/widget/lib/ADB_Helper"


], function(declare, _WidgetBase, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, ADB) {
    "use strict";

    return declare("AdobeAnalytics.widget.AdobeAnalytics", [_WidgetBase], {
        // modeler
        // type: null, // "PageLoad" | "Click"
        // target: null, // string: mendix name for element
        // name: null, // string: event name
        dataset: null, // {dataname, dataAttribute}
        events: null, // {all the keys below}
        // key_VistorId: null,
        // key_SessionId: null,
        // key_Action: null,
        // key_Country: null,
        // key_Currency: null,
        // key_Value: null,

        // Internal variables.
        _handles: null,
        _contextObj: null,
        _executed: false,

        constructor: function() {
            this._handles = [];
            //check for the cordova library and the plugin
            // TODO:
            // add the json config file
            console.log(ADB);
        },

        postCreate: function() {
            logger.debug(this.id + ".postCreate");
        },

        update: function(obj, callback) {
            logger.debug(this.id + ".update");
            if (obj != null && !this._executed) {
                this._contextObj = obj;
                this._preparePayloads()
                    .then(lang.hitch(this, this._replaceTokens))
                    .then(lang.hitch(this, this._attachListeners))
            }
            this._updateRendering(callback);
        },

        resize: function(box) {
            logger.debug(this.id + ".resize");
        },

        uninitialize: function() {
            logger.debug(this.id + ".uninitialize");
        },
        _attachListeners: function(eventList) {
            return new Promise(lang.hitch(this, function(resolve, reject) {
                eventList.forEach(lang.hitch(this, function(event) {
                    // TODO: Attach events (or fire)
                    var name = event.e_name,
                        payload = {
                            VisitorID: event.VisitorID,
                            SessionID: event.SessionID,
                            action: event.action,
                            country: event.country,
                            currency: event.currency,
                            value: event.value
                        }
                    if (event.e_type === "PageLoad") {
                        //fire event
                        this._fireEvent(name, payload);
                    } else {
                        // dojoEvent.connect(el, action, handler)...
                        var el = document.getElementsByClassName('mx-name-' + event.e_target)[0]
                        if (!el) {
                            console.error(`no element found with classname .mx-name-${event.e_target}`)
                            return;
                        }
                        console.debug(`Attaching event ${name} to element .mx-name-${event.e_target} with payload:`)
                        console.debug(payload);
                        el.dataset.name = name;
                        el.dataset.payload = JSON.stringify(payload);
                        el.addEventListener('touchstart', lang.hitch(this, function(e) {
                            this._fireEvent(e.target.dataset.name, JSON.parse(e.target.dataset.payload))
                        }));
                        // this.connect(el, "onclick", ADB.trackState(name, payload,
                        //     function(success) {
                        //         console.log('success')
                        //     },
                        //     function(fail) {
                        //         console.log(fail)
                        //     }
                        // ));
                    }

                }))
                this._executed = true;
                resolve();
            }))
        },
        _fireEvent: function(name, payload) {
            console.debug(`Firing event ${name} with payload:`)
            console.debug(payload);
            ADB.trackState(name, payload,
                function(success) {
                    console.log('success')
                },
                function(fail) {
                    console.log(fail)
                });
        },
        _preparePayloads: function() {
            return new Promise(lang.hitch(this, function(resolve) {
                resolve(this.events.map(lang.hitch(this, function(event) {
                    return {
                        e_type: event.type,
                        e_target: event.target,
                        e_name: event.name,
                        VisitorID: event.key_VisitorId,
                        SessionID: event.key_SessionId,
                        action: event.key_Action,
                        country: event.key_Country,
                        currency: event.key_Currency,
                        value: event.key_Value
                    }
                })))
            }))
        },
        _preparePayload: function() {
            return new Promise(lang.hitch(this, function(resolve) {
                resolve({
                    e_type: event.type,
                    e_target: event.target,
                    e_name: event.name,
                    VisitorID: this.key_VisitorId,
                    SessionID: this.key_SessionId,
                    action: this.key_Action,
                    country: this.key_Country,
                    currency: this.key_Currency,
                    value: this.key_Value
                })
            }))
        },
        _replaceTokens: function(payloadObj) {
            var toReplace = [],
                ret = [];
            var promises = this.dataset.map(lang.hitch(this, function(keyPair) {
                return new Promise(lang.hitch(this, function(resolve) {
                    var re = new RegExp('\{' + keyPair.dataName + '\}', 'g')
                    if (this._contextObj.get(keyPair.dataAttribute) !== null) {
                        toReplace.push({
                            from: re,
                            to: this._contextObj.get(keyPair.dataAttribute)
                        });
                        resolve()
                    } else {
                        mx.data.get({
                            guid: this._contextObj.get(keyPair.dataAttribute.split('/')[0]),
                            callback: function(res) {
                                toReplace.push({
                                    from: re,
                                    to: res.get(keyPair.dataAttribute.split('/')[2])
                                })
                                resolve()
                            }
                        })
                    }
                }))
            }));
            return Promise.all(promises).then(lang.hitch(this, function(resolve) {
                return new Promise(lang.hitch(this, function(resolve) {
                    resolve(
                        payloadObj.constructor === Array ?
                        payloadObj.map(lang.hitch(this, function(obj) {
                            return {
                                e_type: obj.e_type,
                                e_target: obj.e_target,
                                e_name: obj.e_name,
                                VisitorID: this._applyReplacements(obj.VisitorID, toReplace),
                                SessionID: this._applyReplacements(obj.SessionID, toReplace),
                                action: this._applyReplacements(obj.action, toReplace),
                                country: this._applyReplacements(obj.country, toReplace),
                                currency: this._applyReplacements(obj.currency, toReplace),
                                value: this._applyReplacements(obj.value, toReplace)
                            }
                        })) : {
                            e_type: payloadObj.e_type,
                            e_target: payloadObj.e_target,
                            e_name: payloadObj.e_name,
                            VisitorID: this._applyReplacements(payloadObj.VisitorID, toReplace),
                            SessionID: this._applyReplacements(payloadObj.SessionID, toReplace),
                            action: this._applyReplacements(payloadObj.action, toReplace),
                            country: this._applyReplacements(payloadObj.country, toReplace),
                            currency: this._applyReplacements(payloadObj.currency, toReplace),
                            value: this._applyReplacements(payloadObj.value, toReplace)
                        })
                }))
            }));

            // return text;
        },
        _applyReplacements: function(text, replacers) {
            replacers.forEach(function(replacer) {
                text = text.split(replacer.from).join(replacer.to);
            })
            return text;
        },
        _updateRendering: function(callback) {
            logger.debug(this.id + "._updateRendering");

            if (this._contextObj !== null) {
                dojoStyle.set(this.domNode, "display", "block");
            } else {
                dojoStyle.set(this.domNode, "display", "none");
            }

            this._executeCallback(callback);
        },

        _executeCallback: function(cb) {
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["AdobeAnalytics/widget/AdobeAnalytics"]);