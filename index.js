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

          // Find our result using asnyc
          rive.replyAsync('dexter', message, false, function(error, reply){
            if(error){
              // Fail if error
              return self.fail({'message': 'Error in reply'});
            }
            else if(!reply || reply.match(/^ERR/) || reply.length == 0){
              // Handle error messages in case of replies that do not match/etc
              return self.fail({'message': reply || 'Undefined reply'})
            }
            else {
              // Send response
              return self.complete({'response': reply});
            }
          });
        });
    }
};
