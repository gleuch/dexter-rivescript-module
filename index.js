var rest = require('restler');
var RiveScript = require('rivescript');

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var riveUrl = step.input('rive_url').first();
        var message = step.input('message').first();

        // Validations: Ensure URL is correct and a message is passed
        if(riveUrl === undefined || !riveUrl.length || !riveUrl.match(/^http(s)?\:\/\//i)) {
          return this.fail({'message': 'Invalid Rive URL'});
        }
        else if(message === undefined || !message.length) {
          return this.fail({'message': 'Invalid message'});
        }

        // Setup valid  variables and options
        var self = this;
        var variables = step.input('variables').first();
        try {
          variables = JSON.parse(variables);
        } catch (e) {
          //
        }
        if (variables === undefined || typeof(variables) !== 'object') {
          variables = {};
        }

        // Get Rive file and process
        rest.get(riveUrl).on('complete', function(result, response) {
          if (response.statusCode != 200) {
              return self.fail({
                  statusCode: response.statusCode,
                  headers: response.headers,
                  data: result,
                  message: 'Posting failed. Invalid status code: ' + response.statusCode
              });
          }

          // Setup Rivescript and load Rive file
          var rive = new RiveScript({utf8: true});
          rive.setUservars('dexter', variables);
          rive.stream(response.raw.toString());
          rive.sortReplies();

          // Find our result
          var answer = rive.reply('dexter', message);

          // Answers may also come back as `undefined`.
          self.complete({
            response: answer
          });
        });
    }
};
