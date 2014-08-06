'use strict';

var async = require('async'),
  Datastore = require('nedb'),
  _ = require('lodash');

module.exports = function (Connection) {
  Connection.addInstanceMethods(
    /** @lends Connection.prototype */
    {
      /**
       * Start long-polling for events.
       * @see {@link https://developers.box.com/docs/#events-long-polling}
       * @fires Connection#"polling.error"
       * @fires Connection#"polling.end"
       */
      startLongPolling: function () {
        var self = this;

        async.waterfall([

          function (next) {
            if (!self.events) {
              self.events = new Datastore();
              self.events.ensureIndex({
                fieldName: 'event_id',
                unique: true
              });
              self.events.ensureIndex({
                fieldName: 'recorded_at',
                sparse: true
              });
              self.events.ensureIndex({
                fieldName: 'created_at',
              }, next);
            } else {
              next();
            }
          },
          function (next) {
            if (!self.keepPolling) {
              self.keepPolling = true;

              async.whilst(function () {
                return self.keepPolling;
              }, _.bind(self._emit, self), _.noop);
              next(null, true);
            } else {
              next(null, false);
            }
          },

          function (doLongPoll, next) {
            if (doLongPoll) {
              async.whilst(function () {
                return self.keepPolling;
              }, _.bind(self._longPoll, self), function (err) {
                if (err) {
                  /**
                   * Fires when an error occurs during long-polling.
                   * @event Connection#"polling.error"
                   * @type {Error}
                   * @see {@link Connection#startLongPolling}
                   */
                  self.emit('polling.error', err);
                } else if (!self.keepPolling) {
                  /**
                   * Fires when a running long-polling process ends.
                   * @event Connection#"polling.end"
                   * @see {@link Connection#stopLongPolling}
                   */
                  self.emit('polling.end');
                }
              });
            }
            next();
          }
        ], _.noop);
      },

      /**
       * Stop a running long-polling process.
       * @see {@link https://developers.box.com/docs/#events-long-polling}
       */
      stopLongPolling: function () {
        this.keepPolling = false;
      },

      /**
       * Do not call this method directly.
       * @summary The internal long-polling sequence.
       * @private
       * @param {optionalErrorCallback} done - Called after finishing one round of long polling.
       * @fires Connection#"polling.ready"
       */
      _longPoll: function (done) {
        var self = this;
        self.log.debug('NSP: %s', self.nsp);

        async.waterfall([

          function (next) {
            if (!self.nsp) {
              self._request('https://api.box.com/2.0/events', 'GET', next, {
                stream_position: 'now'
              });
            } else {
              next(null, null);
            }
          },
          function (body, next) {
            if (body) {
              self.nsp = body.next_stream_position;
              /**
               * Fires when a stream position has been fixed. All events from here onwards will be captured.
               * @event Connection#"polling.ready"
               */
              self.emit('polling.ready');
            }
            self._request('https://api.box.com/2.0/events', 'OPTIONS', next);
          },
          function (body, next) {
            self._request(body.entries[0].url, 'GET', next, {
              stream_position: self.nsp
            }, null, null, null, null, {
              timeout: 600000,
              num_retries: -1
            });
          },
          function (body, next) {
            self.log.debug(body);
            if (!_.isEmpty(body) && (body.message === 'new_change')) {
              self._request('https://api.box.com/2.0/events', 'GET', next, {
                stream_position: self.nsp
              });
            } else {
              self.log.debug('Refreshing long-poll...');
              next(null, null);
            }
          },
          function (body, next) {
            if (body) {
              self.nsp = body.next_stream_position;
              _.each(body.entries, _.bind(self._trackEvent, self));
            }
            next();
          }
        ], done);
      },

      /**
       * Do not call this method directly.
       * @summary The internal tracker for remote events.
       * @private
       * @param {Object} event - The event to push.
       */
      _trackEvent: function (event) {
        var self = this;

        event.monologued = false;
        event.recorded_at = new Date();

        self.events.insert(event, function (err) {
          if (!err) {
            _.delay(function () {
              self.events.remove({
                event_id: event.event_id
              });
            }, 60000);
          }
        });
      },

      /**
       * Do not call this method directly.
       * @summary The internal event emitter.
       * @private
       * @param {function} done - The callback.
       * @fires Connection#"polling.event.EVENT"
       */
      _emit: function (done) {
        var self = this;

        async.waterfall([

          function (next) {
            _.delay(next, 15000);
          },
          function (next) {
            self.events.find({
              monologued: false,
              recorded_at: {
                $lte: new Date(Date.now() - 15000)
              }
            }).sort({
              created_at: 1
            }).exec(next);
          },
          function (items, next) {
            _.each(items, function (item) {
              /**
               * Events captured from an event stream during long-polling.
               * The event name is of the form polling.event.EVENT, where EVENT is the lowercased,
               * (_ -> .)-transformed version of the source event type. This transformation helps
               * leverage {@link external:Monologue|Monologue} subscription filters.
               * @typedef {string} PollingEvent
               * @see {@link https://developers.box.com/docs/#events}
               * @example
               * When an event of type {@linkcode ITEM_CREATE} is read from the event stream,
               * an event {@linkcode polling.event.item.create} is emitted.
               */

              /**
               * Fires when an event is read from the event stream during long-polling.
               * @event Connection#"polling.event.EVENT"
               * @type {PollingEvent}
               */
              self.emit('polling.event.' + item.event_type.toLowerCase().replace('_', '.'),
                _.omit(item, 'monologued', '_id'));
            });

            self.events.update({
              event_id: {
                $in: _.pluck(items, 'event_id')
              }
            }, {
              $set: {
                monologued: true
              }
            }, {
              multi: true
            }, next);
          }
        ], done);
      }
    });
};