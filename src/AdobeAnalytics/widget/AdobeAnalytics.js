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
    "AdobeAnalytics/widget/lib/ADB_Helper"

], function(declare, _WidgetBase, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, ADB) {
    "use strict";

    return declare("AdobeAnalytics.widget.AdobeAnalytics", [_WidgetBase], {
        // modeler
        // type: null, // "PageLoad" | "Click"
        // target: null, // string: mendix name for element
        // name: null, // string: event name
        dataset: null, // {dataname, dataAttribute}
        events: null, // {all the keys below}

        // Internal variables.
        _handles: null,
        _contextObj: null,
        _executed: false,

        constructor: function() {
            this._handles = {};
            //check for the cordova library and the plugin
            // TODO:
            // add the json config file
            console.debug(ADB ? "ADB Loaded" : "ADB Failed to Load. Ruh Roh.");
        },

        postCreate: function() {
            logger.debug(this.id + ".postCreate");
        },

        update: function(obj, callback) {
            logger.debug(this.id + ".update");
            if (obj != null && !this._executed) {
                this._contextObj = obj;
                this._preparePayloads() // DONE
                    .then(lang.hitch(this, this._replaceTokens)) // DONE
                    .then(lang.hitch(this, this._attachListeners)) // DONE
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
                    // new: add sector and appname
                    var eventModel = {
                            name: event.sector + ":" + event.appname + ":" + event.e_name,
                            payload: {
                                VisitorID: event.VisitorID,
                                SessionID: event.SessionID,
                                action: event.action,
                                value: event.value,
                                sector: event.sector,
                                app: {
                                    name: event.appname,
                                    version: this.appVersion,
                                    os: ("undefined" !== typeof device && device.platform ? device.platform.toLowerCase() : "unknown")
                                },
                                locale: {
                                    country: event.country,
                                    currency: event.currency,
                                    language: event.language
                                }
                            }
                        },
                        el;
                    if (event.e_type === "PageLoad") {
                        //fire event
                        this._fireEvent(eventModel.name, eventModel.payload);
                    } else if (event.e_type === "GlobalClick") {
                        // dojoEvent.connect(el, action, handler)...
                        el = document.getElementsByClassName('mx-name-' + event.e_target)[0]
                        if (!el) {
                            console.error("no element found with classname .mx-name-" + event.e_target + ". Please check your widget's event configuration for event: " + event.e_name);
                            return;
                        }
                        this._attachListenerToElement(el, eventModel);
                    } else if (event.e_type === "SiblingClick") {
                        el = this.domNode.parentElement.querySelector('.mx-name-' + event.e_target);
                        if (!el) {
                            console.error("no sibling element found with classname .mx-name-" + event.e_target + ". Please check your widget's event configuration for event: " + event.e_name);
                            return;
                        }
                        this._attachListenerToElement(el, eventModel);
                    }

                }));
                this._executed = true;
                resolve();
            }))
        },

        _attachListenerToElement: function(el, model) {
            var elementClassName = el.className.split(" ").join(".");
            console.debug("Attaching event " + model.name + " to element with class " + elementClassName + " with payload:");
            console.debug(model.payload);
            var eventsOnElement = el.dataset.mendixOmnitureEvents ? JSON.parse(el.dataset.mendixOmnitureEvents) : [];
            eventsOnElement.push(model);
            el.dataset.mendixOmnitureEvents = JSON.stringify(eventsOnElement);
            // el.dataset.name = name;
            // el.dataset.payload = JSON.stringify(payload);
            if (eventsOnElement.length === 1) { // only add the listener on the first event model
                var handler = this.connect(el, "click", lang.hitch(this, function(e) {
                    var payloadElement = this._getClosestParentWithPayload(e.target);
                    if (payloadElement) {
                        var events = JSON.parse(payloadElement.dataset.mendixOmnitureEvents),
                            numberOfEvents = events.length;
                        console.debug("Firing " + numberOfEvents + " events");
                        events.forEach(lang.hitch(this, function(eventModel) {
                            this._fireEvent(eventModel.name, eventModel.payload);
                        }));
                    } else {
                        console.error(
                            "An error occurred while trying to fire the event.\n" +
                            "Payload: " + e.target.dataset.payload
                        );
                    }
                }));
                this._handles[elementClassName] = handler;
            } else {
                console.debug("Skipping adding listener to " + elementClassName + ". Listener already added");
            }

        },

        _getClosestParentWithPayload: function(el) {
            if (el.dataset && el.dataset.mendixOmnitureEvents) {
                return el;
            } else if (el.tagName === "BODY") {
                return null;
            } else {
                return this._getClosestParentWithPayload(el.parentElement);
            }
        },
        _fireEvent: function(name, payload) {
            console.debug("Firing event " + name + " with payload:");
            console.debug(payload);
            ADB.trackState(name, payload,
                function(success) {
                    console.debug('success')
                },
                function(fail) {
                    console.error(fail)
                });
        },
        _preparePayloads: function() {
            return new Promise(lang.hitch(this, function(resolve) {
                resolve(this.events.map(lang.hitch(this, function(event) {
                    return {
                        e_type: event.type,
                        e_target: event.target,
                        e_name: event.name,
                        VisitorID: mx.session.getUserName(),
                        SessionID: mx.session.getSessionObjectId(),
                        action: event.key_Action,
                        country: event.key_Country,
                        currency: event.key_Currency,
                        value: event.key_Value,
                        appname: event.key_Appname,
                        language: event.key_Language,
                        sector: event.key_Sector
                    }
                })))
            }))
        },

        _buildPayloadForEvent: function(payloadObj, toReplace) {
            return {
                e_type: payloadObj.e_type,
                e_target: payloadObj.e_target,
                e_name: this._applyReplacements(payloadObj.e_name, toReplace).toLowerCase(),
                VisitorID: payloadObj.VisitorID,
                SessionID: payloadObj.SessionID,
                action: this._applyReplacements(payloadObj.action, toReplace),
                country: this._applyReplacements(payloadObj.country, toReplace),
                currency: this._applyReplacements(payloadObj.currency, toReplace),
                value: this._applyReplacements(payloadObj.value, toReplace),
                appname: this._applyReplacements(payloadObj.appname, toReplace),
                language: this._applyReplacements(payloadObj.language, toReplace),
                sector: this._applyReplacements(payloadObj.sector, toReplace)
            }
        },
        _replaceTokens: function(payloadObj) {

            var toReplace = [],
                ret = [];
            var promises = this.dataset.map(lang.hitch(this, function(keyPair) {
                return new Promise(lang.hitch(this, function(resolve) {
                    var re = new RegExp('\{' + keyPair.dataName + '\}', 'g')
                    if (keyPair.dataSourceType === "context") {
                        if (this._contextObj.get(keyPair.dataAttribute) !== null) {
                            toReplace.push({
                                from: re,
                                to: this._contextObj.get(keyPair.dataAttribute)
                            });
                            resolve()
                        } else {
                            var referencedGuid = this._contextObj.get(keyPair.dataAttribute.split('/')[0]);
                            if (referencedGuid) {
                                mx.data.get({
                                    guid: referencedGuid,
                                    callback: function(res) {
                                        toReplace.push({
                                            from: re,
                                            to: res.get(keyPair.dataAttribute.split('/')[2])
                                        })
                                        resolve();
                                    }
                                })
                            } else {
                                console.error("No associated object found over association: " + keyPair.dataAttribute.split('/')[0]);
                                resolve();
                            }
                        }
                    } else if (keyPair.dataSourceType === "session") {
                        console.error("Session datatypes are not yet supported");
                        resolve();
                    } else if (keyPair.dataSourceType === "account") {
                        // get the account entity
                        // query to the target
                        var sourceEntity = keyPair.dataAccountEntity || "CRM.Consumer",
                            association = keyPair.dataAccountAssociation || "CRM.Person_Country",
                            targetEntity = keyPair.dataAccountTargetEntity || "ContentManagement.Country", //doesn't matter
                            targetAttribute = keyPair.dataAccountTargetAttribute || "Name";
                        if (sourceEntity === targetEntity) {
                            this._getValueOfPropertyOnEntity(targetAttribute, sourceEntity)
                                .then(lang.hitch(this, function(value) {
                                    toReplace.push({
                                        from: re,
                                        to: value
                                    });
                                    resolve();
                                }));
                        } else {
                            this._getValueOfPropertyOnEntity(association, sourceEntity)
                                .then(lang.hitch(this, function(value) { // this should be turned into a promise that resolves with the value to replace 
                                    if (value) {
                                        mx.data.get({
                                            guid: value,
                                            callback: function(obj) {
                                                if (obj.get(targetAttribute) === null) {
                                                    console.log("The value of attribute " + targetAttribute + " is null for " + targetEntity + " with guid " + value);
                                                }
                                                toReplace.push({
                                                    from: re,
                                                    to: obj.get(targetAttribute)
                                                });
                                                resolve();
                                            }
                                        });
                                    } else {
                                        console.log("The value of property " + association + " is null for the found " + sourceEntity + " entity");
                                        toReplace.push({
                                            from: re,
                                            to: null
                                        });
                                        resolve();
                                    }

                                }))
                                .catch(function(err) {
                                    console.error(err);
                                    toReplace.push({
                                        from: re,
                                        to: null
                                    });
                                    resolve();
                                });
                        }

                    }

                }))
            }));
            promises.push(new Promise(lang.hitch(this, function(resolve) {
                cordova.getAppVersion().then(function(data) {
                    this.appVersion = data;
                }.bind(this));
                resolve();
            })));
            return Promise.all(promises).then(lang.hitch(this, function(resolve) {
                return new Promise(lang.hitch(this, function(resolve) {
                    resolve(
                        payloadObj.constructor === Array ?
                        payloadObj.map(lang.hitch(this, function(obj) {
                            return this._buildPayloadForEvent(obj, toReplace)
                        })) :
                        this._buildPayloadForEvent(payloadObj, toReplace)
                    )
                }))
            }));

            // return text;
        },
        _getValueOfPropertyOnEntity: function(propertyName, entity) {
            return new Promise(lang.hitch(this, function(resolve, reject) {
                mx.data.getOffline(entity, null, {}, function(mxobjs, count) {
                    console.debug("Found " + count + " " + entity + " objects.");
                    if (count === 1) {
                        resolve(mxobjs[0].get(propertyName));
                    } else {
                        reject("Found " + count + " " + entity + " objects. Please change access rules so that only one is accessible by this user.");
                    }
                }, function(e) {
                    console.error(e);
                    reject(e);
                });
            }));
        },
        _applyReplacements: function(text, replacers) {
            replacers.forEach(function(replacer) {
                text = text.split(replacer.from).join(replacer.to); // data replace tokens
            });
            return text.split(' ').join('_').split(/[^\w:]/).join(''); // spaces to underscores // remove everything that isn't [A-Za-z0-9_]
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