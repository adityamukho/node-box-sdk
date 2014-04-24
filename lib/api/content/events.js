'use strict';

var async = require('async'),
  _ = require('lodash');

var keepPolling;

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

        if (!keepPolling) {
          keepPolling = true;
          async.whilst(function () {
            return keepPolling;
          }, self.longPoll, function (err) {
            if (err) {
              /**
               * Fires when an error occurs during long-polling.
               * @event Connection#"polling.error"
               * @type {Error}
               * @see {@link Connection#startLongPolling}
               */
              self.emit('polling.error', err);
            } else {
              /**
               * Fires when a running long-polling process ends.
               * @event Connection#"polling.end"
               * @see {@link Connection#stopLongPolling}
               */
              self.emit('polling.end');
            }
          });
        }
      },

      /**
       * Stop a running long-polling process.
       * @see {@link https://developers.box.com/docs/#events-long-polling}
       */
      stopLongPolling: function () {
        keepPolling = false;
      },

      /**
       * Do not call this function directly.
       * @summary The internal long-polling sequence.
       * @private
       * @param {optionalErrorCallback} done - Called after finishing one round of long polling.
       * @fires Connection#"polling.event.{event}"
       */
      _longPoll: function (done) {
        var self = this,
          nsp;

        async.waterfall([

          function (next) {
            self._request('https://api.box.com/2.0/events', 'GET', next, {
              stream_position: 'now'
            });
          },
          function (body, next) {
            nsp = body.next_stream_position;
            self._request('https://api.box.com/2.0/events', 'OPTIONS', next);
          },
          function (body, next) {
            self._request(body.entries[0].url, 'GET', next, {
              stream_position: nsp
            });
          },
          function (body, next) {
            if (body.message === 'new_change') {
              self._request('https://api.box.com/2.0/events', 'GET', function (err, body) {
                if (err) {
                  return next(err);
                }

                _.each(body.entries, function (event) {
                  /**
                   * Events captured from an event stream during long-polling.
                   * The event name is of the form polling.event.{event}, where {event} is the lowercased,
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
                   * @event Connection#"polling.event.{event}"
                   * @type {PollingEvent}
                   */
                  self.emit('polling.event.' + event.event_type.toLowerCase().replace('_', '.'), event);
                });
                next();
              }, {
                stream_position: nsp
              });
            } else {
              next();
            }
          }
        ], done);
      }
    });
};